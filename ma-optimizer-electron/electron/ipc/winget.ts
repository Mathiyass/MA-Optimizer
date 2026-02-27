import { ipcMain, BrowserWindow } from 'electron'
import { execSync, spawn } from 'child_process'
import { sendLog, sendError } from './logger'

ipcMain.handle('winget:isInstalled', async () => {
    try {
        const result = execSync('winget --version', { encoding: 'utf-8', timeout: 10000, windowsHide: true }).trim()
        return { installed: true, version: result }
    } catch {
        return { installed: false, version: null }
    }
})

ipcMain.handle('winget:listInstalled', async () => {
    try {
        const result = execSync('winget list --accept-source-agreements', {
            encoding: 'utf-8', timeout: 60000, windowsHide: true, maxBuffer: 10 * 1024 * 1024,
        })
        const lines = result.split('\n').filter(l => l.trim())
        // Parse the table output
        const installed: string[] = []
        let headerPassed = false
        for (const line of lines) {
            if (line.includes('---')) {
                headerPassed = true
                continue
            }
            if (headerPassed && line.trim()) {
                // Extract the ID (second column typically)
                const parts = line.split(/\s{2,}/)
                if (parts.length >= 2) {
                    installed.push(parts[1]?.trim() || parts[0]?.trim())
                }
            }
        }
        return installed
    } catch {
        return []
    }
})

ipcMain.handle('winget:install', async (event, id: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return new Promise((resolve) => {
        sendLog(`[winget] Installing ${id}...`)
        const proc = spawn('winget', ['install', '--id', id, '-e', '--silent',
            '--accept-source-agreements', '--accept-package-agreements'], {
            windowsHide: true,
            shell: true,
        })
        proc.stdout.on('data', (d: Buffer) => {
            const line = d.toString().trim()
            if (line) {
                win?.webContents.send('log:line', `[winget] ${line}`)
            }
        })
        proc.stderr.on('data', (d: Buffer) => {
            const line = d.toString().trim()
            if (line) {
                win?.webContents.send('log:line', `[winget] ${line}`)
            }
        })
        proc.on('close', (code) => {
            const success = code === 0
            sendLog(`[winget] Install ${id} ${success ? 'succeeded' : 'failed'} (exit code: ${code})`)
            resolve(success)
        })
        proc.on('error', () => resolve(false))
        // Timeout after 5 minutes
        setTimeout(() => { try { proc.kill() } catch { }; resolve(false) }, 300000)
    })
})

ipcMain.handle('winget:uninstall', async (event, id: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return new Promise((resolve) => {
        sendLog(`[winget] Uninstalling ${id}...`)
        const proc = spawn('winget', ['uninstall', '--id', id, '-e', '--silent',
            '--accept-source-agreements'], {
            windowsHide: true,
            shell: true,
        })
        proc.stdout.on('data', (d: Buffer) => {
            const line = d.toString().trim()
            if (line) win?.webContents.send('log:line', `[winget] ${line}`)
        })
        proc.stderr.on('data', (d: Buffer) => {
            const line = d.toString().trim()
            if (line) win?.webContents.send('log:line', `[winget] ${line}`)
        })
        proc.on('close', (code) => {
            resolve(code === 0)
        })
        proc.on('error', () => resolve(false))
        setTimeout(() => { try { proc.kill() } catch { }; resolve(false) }, 300000)
    })
})

ipcMain.handle('winget:upgradeAll', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return new Promise((resolve) => {
        sendLog('[winget] Upgrading all packages...')
        const proc = spawn('winget', ['upgrade', '--all', '--silent',
            '--accept-source-agreements', '--accept-package-agreements'], {
            windowsHide: true,
            shell: true,
        })
        proc.stdout.on('data', (d: Buffer) => {
            const line = d.toString().trim()
            if (line) win?.webContents.send('log:line', `[winget] ${line}`)
        })
        proc.stderr.on('data', (d: Buffer) => {
            const line = d.toString().trim()
            if (line) win?.webContents.send('log:line', `[winget] ${line}`)
        })
        proc.on('close', (code) => resolve(code === 0))
        proc.on('error', () => resolve(false))
        setTimeout(() => { try { proc.kill() } catch { }; resolve(false) }, 600000)
    })
})

ipcMain.handle('winget:search', async (_, query: string) => {
    try {
        const result = execSync(`winget search "${query}" --accept-source-agreements`, {
            encoding: 'utf-8', timeout: 30000, windowsHide: true, maxBuffer: 10 * 1024 * 1024,
        })
        const lines = result.split('\n').filter(l => l.trim())
        const results: { name: string; id: string; version: string; source: string }[] = []
        let headerPassed = false
        for (const line of lines) {
            if (line.includes('---')) {
                headerPassed = true
                continue
            }
            if (headerPassed && line.trim()) {
                const parts = line.split(/\s{2,}/).map(p => p.trim()).filter(Boolean)
                if (parts.length >= 2) {
                    results.push({
                        name: parts[0] || '',
                        id: parts[1] || '',
                        version: parts[2] || '',
                        source: parts[3] || 'winget',
                    })
                }
            }
        }
        return results.slice(0, 50)
    } catch {
        return []
    }
})

ipcMain.handle('winget:checkUpdate', async (_, id: string) => {
    try {
        const result = execSync(`winget upgrade --id ${id} -e --accept-source-agreements`, {
            encoding: 'utf-8', timeout: 30000, windowsHide: true,
        })
        return result.toLowerCase().includes('available')
    } catch {
        return false
    }
})
