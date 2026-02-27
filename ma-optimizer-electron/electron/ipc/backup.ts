import { ipcMain, dialog } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { sendLog, sendError } from './logger'
import { loadBackups } from './registry'

const backupDir = path.join(app.getPath('userData'), 'backups')

function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// Export all MA-Optimizer settings as .maopt JSON
ipcMain.handle('backup:export', async (_, savePath: string) => {
    try {
        ensureDir(path.dirname(savePath))
        const data = {
            version: '7.0.0',
            exportedAt: new Date().toISOString(),
            registryBackups: loadBackups(),
            appliedTweaks: {},
        }
        // Also include electron-store settings
        try {
            const Store = require('electron-store')
            const store = new Store()
            data.appliedTweaks = store.get('appliedTweaks') || {}
        } catch { }
        fs.writeFileSync(savePath, JSON.stringify(data, null, 2), 'utf-8')
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
        const raw = fs.readFileSync(filePath, 'utf-8')
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
    const { execSync } = require('child_process')
    const backups = loadBackups()
    let restored = 0
    let failed = 0

    for (const [key, entry] of Object.entries(backups)) {
        try {
            const { hive, path: regPath, name, originalValue } = entry as any
            if (originalValue !== null && originalValue !== undefined) {
                const fullPath = `${hive}:\\${regPath}`
                const val = typeof originalValue === 'string' ? `'${originalValue}'` : originalValue
                const ps = `Set-ItemProperty -Path '${fullPath}' -Name '${name}' -Value ${val} -Force`
                execSync(`powershell -NonInteractive -NoProfile -Command "${ps}"`, {
                    encoding: 'utf-8', timeout: 10000, windowsHide: true,
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
    const { execSync } = require('child_process')
    const backups = loadBackups()
    const entries = Object.entries(backups)
    if (entries.length === 0) return { success: false, error: 'No changes to undo' }

    const sorted = entries.sort((a, b) =>
        new Date((b[1] as any).backedUpAt).getTime() - new Date((a[1] as any).backedUpAt).getTime()
    )
    const [key, entry] = sorted[0]
    const { hive, path: regPath, name, originalValue } = entry as any

    try {
        if (originalValue !== null && originalValue !== undefined) {
            const fullPath = `${hive}:\\${regPath}`
            const val = typeof originalValue === 'string' ? `'${originalValue}'` : originalValue
            const ps = `Set-ItemProperty -Path '${fullPath}' -Name '${name}' -Value ${val} -Force`
            execSync(`powershell -NonInteractive -NoProfile -Command "${ps}"`, {
                encoding: 'utf-8', timeout: 10000, windowsHide: true,
            })
        }
        // Remove this entry from backups
        const allBackups = loadBackups()
        delete allBackups[key]
        const backupPath = path.join(app.getPath('userData'), 'backups', 'registry_backup.json')
        fs.writeFileSync(backupPath, JSON.stringify(allBackups, null, 2), 'utf-8')
        sendLog(`[Backup] Undone last change: ${key}`)
        return { success: true, key }
    } catch (e: any) {
        sendError(`[Backup] Undo last failed: ${e.message}`)
        return { success: false, error: e.message }
    }
})
