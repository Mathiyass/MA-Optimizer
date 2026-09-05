import { app, BrowserWindow, ipcMain, shell, dialog, screen } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

const isDev = process.env.NODE_ENV === 'development'

// 🔧 FIX: app.setPath('userData', ...) and app.commandLine.appendSwitch must be called before any IPC handler imports
// to ensure that custom user data paths (used by logger) and Chromium switches are applied correctly.
app.setPath('userData', path.join(app.getPath('appData'), 'MA-Optimizer'))
app.commandLine.appendSwitch('disable-features', 'AutofillServerCommunication,CalculateNativeWinOcclusion,TranslateUI,MediaRouter')
app.commandLine.appendSwitch('enable-low-end-device-mode')
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=192 --optimize-for-size --gc-global')
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
app.commandLine.appendSwitch('disable-component-update')
app.commandLine.appendSwitch('disable-renderer-backgrounding')
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows')


// IPC handler imports
require('./ipc/admin')
require('./ipc/logger')
require('./ipc/registry')
require('./ipc/backup')
require('./ipc/powerplan')
require('./ipc/services')
require('./ipc/network')
require('./ipc/systeminfo')
require('./ipc/cleaner')
require('./ipc/startup')
require('./ipc/winget')
require('./ipc/benchmark')
require('./ipc/repair')
require('./ipc/advanced')
require('./ipc/driverUpdater')
require('./ipc/processLasso')
require('./ipc/gearup')
require('./ipc/exitlag')
require('./ipc/heuristicGovernor')
require('./ipc/aiAssistant')





const { startSystemStatsPolling, stopSystemStatsPolling } = require('./ipc/systeminfo')
const { spawnPromise } = require('./ipc/utils')

// 🔧 FIX: Added global exception handler, styled native dialog cannot take CSS colors but we make it clear it's an error.
process.on('uncaughtException', (error) => {
    dialog.showMessageBoxSync({ type: 'error', title: 'Critical System Error', message: 'MA-Optimizer encountered a critical error.\n\nPlease restart the application.', detail: `Error: ${error.message}\n\n${error.stack}` })
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
            console.warn('[Dev] Skipping admin elevation in development mode.')
            return
        }

        const { execSync } = require('child_process')
        const exePath = app.getPath('exe')
        try {
            // Relaunches the app requesting admin elevation via UAC
            execSync(`powershell -Command "Start-Process '${exePath}' -Verb RunAs"`, { windowsHide: true })
        } catch (e: any) {
            dialog.showMessageBoxSync({ type: 'error', title: 'Elevation Required', message: 'This application requires Administrator privileges to optimize your system.', detail: 'It could not elevate automatically.' })
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

    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
        console.error(`Load failure: ${errorCode} - ${errorDescription}`);
    });

    mainWindow.webContents.on('render-process-gone', (_event, details) => {
        console.error(`Renderer process gone: ${details.reason}`);
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
        console.log('[Diagnostic] ready-to-show event triggered.');
        mainWindow?.show()
        const admin = await isAdmin()
        mainWindow?.webContents.send('admin:status', admin)
    })

    mainWindow.on('closed', () => {
        console.log('[Diagnostic] Window closed event triggered.');
        mainWindow = null
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // Capture renderer logs
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`[Renderer] ${message} (${sourceId}:${line})`);
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools({ mode: 'detach' })
    } else {
        mainWindow.loadFile(path.join(__dirname, '../../dist-vite/index.html'))
    }
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

let normalWindowBounds: { x: number; y: number; width: number; height: number } | null = null

ipcMain.handle('window:toggleCompactMode', async (_, isCompact: boolean) => {
    if (!mainWindow) return { isCompact: false }

    if (isCompact) {
        normalWindowBounds = mainWindow.getBounds()
        mainWindow.setMinimumSize(320, 140)
        mainWindow.setSize(380, 160)
        mainWindow.setAlwaysOnTop(true, 'screen-saver')

        try {
            const primary = screen.getPrimaryDisplay()
            const { width } = primary.workAreaSize
            mainWindow.setPosition(width - 400, 40)
        } catch {}

        return { isCompact: true }
    } else {
        mainWindow.setAlwaysOnTop(false)
        mainWindow.setMinimumSize(1100, 720)
        if (normalWindowBounds) {
            mainWindow.setBounds(normalWindowBounds)
        } else {
            mainWindow.setSize(1280, 800)
            mainWindow.center()
        }
        return { isCompact: false }
    }
})

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
        console.warn(`[Security] Blocked invalid path opening attempt: ${p}`)
        return false
    }

    const normalizedPath = path.normalize(p)
    if (!path.isAbsolute(normalizedPath)) {
        console.warn(`[Security] Blocked non-absolute path opening attempt: ${p}`)
        return false
    }

    const error = await shell.openPath(normalizedPath)
    if (error) {
        console.error(`[System] Failed to open path: ${normalizedPath}. Error: ${error}`)
        return false
    }
    return true
})

// 🔧 FIX: Sanitize tool commands via Strict Whitelist and safely spawn administrative tools
const ALLOWED_TOOLS = new Set([
    'cmd', 'cmd.exe',
    'powershell', 'powershell.exe',
    'taskmgr', 'taskmgr.exe',
    'regedit', 'regedit.exe',
    'resmon', 'resmon.exe',
    'perfmon', 'perfmon.exe',
    'cleanmgr', 'cleanmgr.exe',
    'msconfig', 'msconfig.exe',
    'msinfo32', 'msinfo32.exe',
    'dxdiag', 'dxdiag.exe',
    'dfrgui', 'dfrgui.exe',
    'mdsched', 'mdsched.exe',
    'control', 'control.exe',
    'compmgmt.msc',
    'devmgmt.msc',
    'diskmgmt.msc',
    'gpedit.msc',
    'services.msc',
    'eventvwr', 'eventvwr.msc',
    'sysdm.cpl',
    'appwiz.cpl',
    'ncpa.cpl',
    'firewall.cpl',
    'powercfg.cpl',
    'mmsys.cpl',
])

ipcMain.handle('system:runTool', async (_, cmd: string) => {
    try {
        const cleanCmd = String(cmd).trim().toLowerCase()
        if (!ALLOWED_TOOLS.has(cleanCmd)) {
            console.warn(`[Security] Blocked unauthorized tool execution: ${cmd}`)
            return false
        }
        const { spawn } = require('child_process')
        if (cleanCmd.endsWith('.msc')) {
            spawn('mmc.exe', [cleanCmd], { windowsHide: false, detached: true, stdio: 'ignore' }).unref()
        } else if (cleanCmd.endsWith('.cpl')) {
            spawn('control.exe', [cleanCmd], { windowsHide: false, detached: true, stdio: 'ignore' }).unref()
        } else {
            spawn(cleanCmd, [], { windowsHide: false, detached: true, shell: true, stdio: 'ignore' }).unref()
        }
        return true
    } catch (e: any) {
        console.error(`[System] Failed to run tool ${cmd}:`, e)
        return false
    }
})

ipcMain.handle('create-restore-point', async () => {
    try {
        await spawnPromise('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', "Checkpoint-Computer -Description 'MA Optimizer Restore Point' -RestorePointType 'MODIFY_SETTINGS'"])
        return { success: true }
    } catch (error: any) {
        console.error('[Restore Point Error]:', error.message || error)
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

    session.defaultSession.webRequest.onHeadersReceived((details: any, callback: any) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' data:; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' http://localhost:* ws://localhost:* https:"]
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
