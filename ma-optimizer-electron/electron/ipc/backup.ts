import { ipcMain, dialog } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { sendLog, sendError } from './logger'
import { loadBackups } from './registry'
import { escapePS, spawnPromise } from './utils'

const backupDir = path.join(app.getPath('userData'), 'backups')

async function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) await fs.promises.mkdir(dir, { recursive: true })
}

// Export all MA-Optimizer settings as .maopt JSON
ipcMain.handle('backup:export', async (_, savePath: string) => {
    try {
        await ensureDir(path.dirname(savePath))
        const data = {
            version: '7.0.0',
            exportedAt: new Date().toISOString(),
            registryBackups: await loadBackups(),
            appliedTweaks: {},
        }
        // Also include electron-store settings
        try {
            const Store = require('electron-store')
            const store = new Store()
            data.appliedTweaks = store.get('appliedTweaks') || {}
        } catch { }
        await fs.promises.writeFile(savePath, JSON.stringify(data, null, 2), 'utf-8')
        sendLog(`[Backup] Exported settings to ${savePath}`)
        return { success: true }
    } catch (e: any) {
        sendError(`[Backup] Export failed: ${e.message}`)
        return { success: false, error: e.message }
    }
})

// Import settings from .maopt JSON
ipcMain.handle('backup:import', async (_, filePath: string) => {
    try {
        const raw = await fs.promises.readFile(filePath, 'utf-8')
        const data = JSON.parse(raw)
        if (!data.version) {
            return { success: false, error: 'Invalid backup file' }
        }
        // Store applied tweaks
        try {
            const Store = require('electron-store')
            const store = new Store()
            if (data.appliedTweaks) {
                store.set('appliedTweaks', data.appliedTweaks)
            }
        } catch { }
        sendLog(`[Backup] Imported settings from ${filePath} (${Object.keys(data.registryBackups || {}).length} entries)`)
        return { success: true, data }
    } catch (e: any) {
        sendError(`[Backup] Import failed: ${e.message}`)
        return { success: false, error: e.message }
    }
})

// Undo all changes — restores all original registry values
ipcMain.handle('backup:undoAll', async () => {
    const backups = await loadBackups()
    let restored = 0
    let failed = 0

    for (const [key, entry] of Object.entries(backups)) {
        try {
            const { hive, path: regPath, name, originalValue } = entry as any
            if (originalValue !== null && originalValue !== undefined) {
                const fullPath = `${escapePS(hive)}:\\${escapePS(regPath)}`
                const val = typeof originalValue === 'string' ? `'${escapePS(originalValue)}'` : originalValue
                const ps = `Set-ItemProperty -Path '${fullPath}' -Name '${escapePS(name)}' -Value ${val} -Force`
                await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], {
                    timeout: 10000, encoding: 'utf-8',
                })
                restored++
            }
        } catch {
            failed++
        }
    }

    sendLog(`[Backup] Undo All: Restored ${restored}, Failed ${failed}`)
    return { success: true, restored, failed }
})

// Undo last change only
ipcMain.handle('backup:undoLast', async () => {
    const backups = await loadBackups()
    const entries = Object.entries(backups)
    if (entries.length === 0) return { success: false, error: 'No changes to undo' }

    const sorted = entries.sort((a, b) =>
        new Date((b[1] as any).backedUpAt).getTime() - new Date((a[1] as any).backedUpAt).getTime()
    )
    const [key, entry] = sorted[0]
    const { hive, path: regPath, name, originalValue } = entry as any

    try {
        if (originalValue !== null && originalValue !== undefined) {
            const fullPath = `${escapePS(hive)}:\\${escapePS(regPath)}`
            const val = typeof originalValue === 'string' ? `'${escapePS(originalValue)}'` : originalValue
            const ps = `Set-ItemProperty -Path '${fullPath}' -Name '${escapePS(name)}' -Value ${val} -Force`
            await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], {
                timeout: 10000, encoding: 'utf-8',
            })
        }
        // Remove this entry from backups
        const allBackups = await loadBackups()
        delete allBackups[key]
        const backupPath = path.join(app.getPath('userData'), 'backups', 'registry_backup.json')
        await fs.promises.writeFile(backupPath, JSON.stringify(allBackups, null, 2), 'utf-8')
        sendLog(`[Backup] Undone last change: ${key}`)
        return { success: true, key }
    } catch (e: any) {
        sendError(`[Backup] Undo last failed: ${e.message}`)
        return { success: false, error: e.message }
    }
})
