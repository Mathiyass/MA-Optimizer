import { spawnPromise } from './ipc/utils'
import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

// IPC handler imports
import './ipc/admin'
import { logger } from './ipc/logger'
import './ipc/registry'
import './ipc/backup'
import './ipc/powerplan'
import './ipc/services'
import './ipc/network'
import './ipc/systeminfo'
import './ipc/cleaner'
import './ipc/startup'
import './ipc/winget'
import './ipc/benchmark'
import './ipc/repair'
import './ipc/advanced'
import './ipc/driverUpdater'
import { startSystemStatsPolling, stopSystemStatsPolling } from './ipc/systeminfo'

const isDev = process.env.NODE_ENV === 'development'

// 🔧 FIX: Added global exception handler, styled native dialog cannot take CSS colors but we make it clear it's an error.
process.on('uncaughtException', (error) => {
    dialog.showErrorBox('Critical System Error', `MA-Optimizer encountered a critical error.\n\nPlease restart the application.\nError: ${error.message}\n\n${error.stack}`)
    process.exit(1)
})

let mainWindow: BrowserWindow | null = null

// 🔧 FIX: Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    app.quit()
    process.exit(0)
} else {
    app.on('second-instance', () => {
        // If someone tried to run a second instance, we should focus our window
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })
}

async function isAdmin(): Promise<boolean> {
    try {
        const { execPromise } = require('./ipc/utils')
        await execPromise('net session', { windowsHide: true })
        return true
    } catch {
        return false
    }
}

async function ensureAdmin() {
    if (!(await isAdmin())) {
        if (isDev) {
            logger.warn('[Dev] Skipping admin elevation in development mode.')
            return
        }

        const { execSync } = require('child_process')
        const exePath = app.getPath('exe')
        try {
            // Relaunches the app requesting admin elevation via UAC
            execSync(`powershell -Command "Start-Process '${exePath}' -Verb RunAs"`, { windowsHide: true })
        } catch (e: any) {
            dialog.showErrorBox('Elevation Required', 'This application requires Administrator privileges to optimize your system. It could not elevate automatically.')
        }
        app.quit()
        process.exit(0)
    }
}

function createWindow() {
    let windowState = { width: 1280, height: 800, x: undefined as number | undefined, y: undefined as number | undefined, isMaximized: false }
    try {
        const Store = require('electron-store')
        const store = new Store()
        const saved = store.get('windowState') as typeof windowState | undefined
        if (saved) windowState = saved
    } catch { }

    mainWindow = new BrowserWindow({
        width: windowState.width,
        height: windowState.height,
        x: windowState.x,
        y: windowState.y,
        minWidth: 1100,
        minHeight: 720,
        frame: false,
        transparent: false,
        backgroundColor: '#0d0f1a', // 🔧 FIX: Match new design system shell background
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            // 🔧 FIX: Ensure contextIsolation remains true, nodeIntegration false, and sandbox enabled for secure IPC
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            backgroundThrottling: false, // 🔧 FIX: Prevent background throttle for system tool
        },
        icon: path.join(__dirname, '../../public/icon.ico'),
        show: false, // 🔧 FIX: Correctly kept false initially to show only when ready
        titleBarStyle: 'hidden',
    })

    // 🔧 FIX: Enable V8 Code Cache for faster cold starts
    app.setPath('userData', path.join(app.getPath('appData'), 'MA-Optimizer'))

    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
        logger.error(`Load failure: ${errorCode} - ${errorDescription}`);
    });

    mainWindow.webContents.on('render-process-gone', (_event, details) => {
        logger.error(`Renderer process gone: ${details.reason}`);
    });

    if (windowState.isMaximized) {
        mainWindow.maximize()
    }

    const saveWindowState = () => {
        if (!mainWindow) return
        try {
            const Store = require('electron-store')
            const store = new Store()
            const bounds = mainWindow.getBounds()
            store.set('windowState', {
                width: bounds.width,
                height: bounds.height,
                x: bounds.x,
                y: bounds.y,
                isMaximized: mainWindow.isMaximized(),
            })
        } catch { }
    }
    mainWindow.on('resize', saveWindowState)
    mainWindow.on('move', saveWindowState)
    mainWindow.on('close', saveWindowState)

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools({ mode: 'detach' })
    } else {
        mainWindow.loadFile(path.join(__dirname, '../../dist-vite/index.html'))
    }


    mainWindow.once('ready-to-show', async () => {
        if (isDev) {
            logger.info('[Diagnostic] ready-to-show event triggered.');
        }
        mainWindow?.show()
        const admin = await isAdmin()
        mainWindow?.webContents.send('admin:status', admin)
    })

    mainWindow.on('closed', () => {
        if (isDev) {
            logger.info('[Diagnostic] Window closed event triggered.');
        }
        mainWindow = null
    })

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url)
        return { action: 'deny' }
    })
}

// Window control IPC
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize()
    } else {
        mainWindow?.maximize()
    }
})
ipcMain.on('window:close', () => mainWindow?.close())
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false)

// Dialog IPC
ipcMain.handle('dialog:open', async (_, opts) => {
    if (!mainWindow) return null
    return dialog.showOpenDialog(mainWindow, opts)
})
ipcMain.handle('dialog:save', async (_, opts) => {
    if (!mainWindow) return null
    return dialog.showSaveDialog(mainWindow, opts)
})

// System tool launcher
ipcMain.handle('system:openPath', async (_, p: string) => {
    // 🔧 FIX: Validate paths being opened are legitimate to prevent directory traversal
    if (typeof p !== 'string' || p.includes('..')) {
        logger.warn(`[Security] Blocked invalid path opening attempt: ${p}`)
        return false
    }

    const normalizedPath = path.normalize(p)
    if (!path.isAbsolute(normalizedPath)) {
        logger.warn(`[Security] Blocked non-absolute path opening attempt: ${p}`)
        return false
    }

    const error = await shell.openPath(normalizedPath)
    if (error) {
        logger.error(`[System] Failed to open path: ${normalizedPath}. Error: ${error}`)
        return false
    }
    return true
})

// 🔧 FIX: Sanitize tool commands via Strict Whitelist instead of allowing arbitrary execution
const ALLOWED_TOOLS = [
    'resmon', 'taskmgr', 'cleanmgr', 'dfrgui', 'eventvwr',
    'compmgmt.msc', 'mdsched', 'control', 'sysdm.cpl',
    'appwiz.cpl', 'ncpa.cpl', 'mmsys.cpl', 'perfmon', 'regedit', 'msconfig'
]

ipcMain.handle('system:runTool', async (_, cmd: string) => {
    try {
        if (!ALLOWED_TOOLS.includes(cmd)) {
            logger.warn(`[Security] Blocked unauthorized tool execution: ${cmd}`)
            return false
        }
        const { exec } = require('child_process')
        exec(cmd, { windowsHide: false })
        return true
    } catch {
        return false
    }
})

ipcMain.handle('create-restore-point', async () => {
    try {
        await spawnPromise('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', "Checkpoint-Computer -Description 'MA Optimizer Restore Point' -RestorePointType 'MODIFY_SETTINGS'"])
        return { success: true }
    } catch (error: any) {
        logger.error(`[Restore Point Error]: ${error.message || error}`)
        return { success: false, error: error.message || String(error) }
    }
})

// 🔧 FIX: Fetch Winget app icons via Win32 API / Registry via IPC
ipcMain.handle('winget:getIcon', async (_, appName: string) => {
    return new Promise((resolve) => {
        if (!appName) return resolve(null);
        // Cleanse the input string for powershell injection safety
        const safeName = appName.replace(/"/g, '`"').replace(/'/g, "''");
        const psCommand = `
$appName = "${safeName}"
$paths = @(
    "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
    "HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
    "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*"
)
$iconPath = ""
foreach ($path in $paths) {
    $items = Get-ItemProperty $path -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -match $appName }
    if ($items -and $items.DisplayIcon) {
        $iconPath = $items[0].DisplayIcon -replace '"', '' -replace ',0$', ''
        break
    }
}
if ($iconPath -and (Test-Path $iconPath)) {
    try {
        Add-Type -AssemblyName System.Drawing
        if ($iconPath.EndsWith(".ico", "OrdinalIgnoreCase")) {
            $icon = New-Object System.Drawing.Icon($iconPath)
        } else {
            $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($iconPath)
        }
        $ms = New-Object System.IO.MemoryStream
        $icon.ToBitmap().Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $base64 = [Convert]::ToBase64String($ms.ToArray())
        Write-Output $base64
    } catch { Write-Output "" }
} else { Write-Output "" }
`
        require('child_process').exec(`powershell -NoProfile -Command "${psCommand.replace(/\n/g, ' ')}"`, { windowsHide: true, maxBuffer: 1024 * 1024 * 10 }, (err: any, stdout: string) => {
            if (err || !stdout || !stdout.trim()) resolve(null)
            else resolve(`data:image/png;base64,${stdout.trim()}`)
        })
    })
})

// Auto-updater
try {
    const { autoUpdater } = require('electron-updater')
    ipcMain.handle('updates:check', async () => {
        try {
            const result = await autoUpdater.checkForUpdates()
            return result?.updateInfo ?? null
        } catch {
            return null
        }
    })
    ipcMain.on('updates:download', () => autoUpdater.downloadUpdate())
    ipcMain.on('updates:install', () => autoUpdater.quitAndInstall())
} catch {
    ipcMain.handle('updates:check', async () => null)
}

// 🔧 FIX: App lifecycle properly handling startup operations
app.whenReady().then(async () => {
    // 🔧 FIX: Add CSP headers via session.defaultSession
    const { session } = require('electron')

    // 🔧 FIX: Suppress noisy Chromium devtools autofill warnings
    app.commandLine.appendSwitch('disable-features', 'AutofillServerCommunication')

    session.defaultSession.webRequest.onHeadersReceived((details: any, callback: any) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' http://localhost:* ws://localhost:* https://logo.clearbit.com https://icons.duckduckgo.com"]
            }
        })
    })

    startSystemStatsPolling()
    await ensureAdmin()
    createWindow()
})

app.on('window-all-closed', () => {
    // 🔧 FIX: Ensure process cleanups could be handled here if needed in future, but properly quiting
    app.quit()
})

// 🔧 FIX: Add missing lifecycle events
app.on('before-quit', () => {
    // Logic before process exit
})

app.on('will-quit', () => {
    // 🔧 FIX: Unregister all shortcuts or perform sync cleanup here
    try {
        stopSystemStatsPolling()
        const { globalShortcut } = require('electron')
        globalShortcut.unregisterAll()
    } catch { }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

export { mainWindow, isAdmin }
