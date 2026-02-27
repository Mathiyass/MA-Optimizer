import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

// IPC handler imports
import './ipc/admin'
import './ipc/logger'
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

// 🔧 FIX: Added missing global exception handler
process.on('uncaughtException', (error) => {
    dialog.showErrorBox('Critical Error', `An unexpected error occurred: ${error.message}\n\n${error.stack}`)
    process.exit(1)
})

let mainWindow: BrowserWindow | null = null

// 🔧 FIX: Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    const isDev = process.env.NODE_ENV === 'development'
    if (!isDev) {
        app.quit()
        process.exit(0)
    } else {
        console.warn('[Dev] Skipping single instance lock exit in dev mode.')
    }
} else {
    app.on('second-instance', () => {
        // If someone tried to run a second instance, we should focus our window
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })
}

function isAdmin(): boolean {
    try {
        const { execSync } = require('child_process')
        execSync('net session', { stdio: 'ignore' })
        return true
    } catch {
        return false
    }
}

function ensureAdmin() {
    if (!isAdmin()) {
        const isDev = process.env.NODE_ENV === 'development'
        if (isDev) {
            console.warn('[Dev] Skipping admin elevation in development mode to prevent endless loops.')
            return
        }

        const { execSync } = require('child_process')
        const exePath = app.getPath('exe')
        try {
            // Relaunches the app requesting admin elevation via UAC
            execSync(`powershell -Command "Start-Process '${exePath}' -Verb RunAs"`, { windowsHide: true })
        } catch (e) {
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
        backgroundColor: '#0a0e1a',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            // 🔧 FIX: Ensure contextIsolation remains true, nodeIntegration false, and sandbox enabled for secure IPC
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
        icon: path.join(__dirname, '../public/icon.ico'),
        show: false, // 🔧 FIX: Correctly kept false initially to show only when ready
        titleBarStyle: 'hidden',
    })

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

    const isDev = process.env.NODE_ENV === 'development'
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools({ mode: 'detach' })
    } else {
        mainWindow.loadFile(path.join(__dirname, '../../dist-vite/index.html'))
    }

    // 🔧 FIX: Show only when ready to eliminate visual flicker/empty window
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show()
        mainWindow?.webContents.send('admin:status', isAdmin())
    })

    mainWindow.on('closed', () => {
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
    if (typeof p !== 'string' || p.includes('..')) return false
    shell.openPath(p)
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
            console.warn(`[Security] Blocked unauthorized tool execution: ${cmd}`)
            return false
        }
        const { exec } = require('child_process')
        exec(cmd, { windowsHide: false })
        return true
    } catch {
        return false
    }
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
app.whenReady().then(() => {
    // 🔧 FIX: Add CSP headers via session.defaultSession
    const { session } = require('electron')
    session.defaultSession.webRequest.onHeadersReceived((details: any, callback: any) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' data:; connect-src 'self' http://localhost:* ws://localhost:*"]
            }
        })
    })

    ensureAdmin()
    createWindow()
})

app.on('window-all-closed', () => {
    // 🔧 FIX: Ensure process cleanups could be handled here if needed in future, but properly quiting
    app.quit()
})

// 🔧 FIX: Add missing lifecycle events
app.on('before-quit', () => {
    // Logic before process exit
    console.log('[System] App is preparing to quit...')
})

app.on('will-quit', () => {
    // 🔧 FIX: Unregister all shortcuts or perform sync cleanup here
    try {
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
