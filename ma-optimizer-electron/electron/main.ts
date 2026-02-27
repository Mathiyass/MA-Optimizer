import { app, BrowserWindow, ipcMain, shell, dialog, globalShortcut } from 'electron'
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

let mainWindow: BrowserWindow | null = null

function isAdmin(): boolean {
    try {
        const { execSync } = require('child_process')
        execSync('net session', { stdio: 'ignore' })
        return true
    } catch {
        return false
    }
}

function createWindow() {
    // Restore window state
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
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
        icon: path.join(__dirname, '../public/icon.ico'),
        show: false,
        titleBarStyle: 'hidden',
    })

    if (windowState.isMaximized) {
        mainWindow.maximize()
    }

    // Save window state on changes
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

    // Load content
    const isDev = process.env.NODE_ENV === 'development'
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools({ mode: 'detach' })
    } else {
        mainWindow.loadFile(path.join(__dirname, '../../dist-vite/index.html'))
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow?.show()
        mainWindow?.webContents.send('admin:status', isAdmin())
    })

    mainWindow.on('closed', () => {
        mainWindow = null
    })

    // External links open in browser
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
    shell.openPath(p)
    return true
})
ipcMain.handle('system:runTool', async (_, cmd: string) => {
    try {
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

// App lifecycle
app.whenReady().then(() => {
    createWindow()
})

app.on('window-all-closed', () => {
    app.quit()
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

export { mainWindow, isAdmin }
