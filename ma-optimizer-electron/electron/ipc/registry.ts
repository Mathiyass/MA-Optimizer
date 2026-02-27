import { ipcMain } from 'electron'
import { execSync } from 'child_process'
import { sendLog, sendError } from './logger'
import * as path from 'path'
import * as fs from 'fs'
import { app } from 'electron'
import { escapePS } from './utils'
import { ipcRenderer } from 'electron' // wait, this is main process, use ipcMain

let restorePointCreated = false
async function ensureRestorePoint() {
    if (restorePointCreated) return
    try {
        const { ipcMain } = require('electron')
        // We can't easily trigger another IPC handler from here without emit or similar
        // Let's just run the powershell directly
        const ps = `Checkpoint-Computer -Description "MA-Optimizer Auto-Backup" -RestorePointType "MODIFY_SETTINGS"`
        execSync(`powershell -NonInteractive -NoProfile -Command "${ps}"`, {
            encoding: 'utf-8', timeout: 120000, windowsHide: true,
        })
        restorePointCreated = true
        sendLog('[Backup] Automatic restore point created before modification')
    } catch (e) {
        sendLog('[Backup] Skipping restore point (missing privileges or disabled)')
    }
}

const backupPath = path.join(app.getPath('userData'), 'backups', 'registry_backup.json')

function ensureBackupDir() {
    const dir = path.dirname(backupPath)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
}

function loadBackups(): Record<string, any> {
    ensureBackupDir()
    try {
        if (fs.existsSync(backupPath)) {
            return JSON.parse(fs.readFileSync(backupPath, 'utf-8'))
        }
    } catch { }
    return {}
}

function saveBackups(data: Record<string, any>) {
    ensureBackupDir()
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf-8')
}

function backupOriginalValue(hive: string, regPath: string, name: string, currentValue: any) {
    const key = `${hive}\\${regPath}\\${name}`
    const backups = loadBackups()
    // Never overwrite an existing backup for the same key
    if (!(key in backups)) {
        backups[key] = {
            hive,
            path: regPath,
            name,
            originalValue: currentValue,
            backedUpAt: new Date().toISOString(),
        }
        saveBackups(backups)
        sendLog(`[Backup] Saved original value for ${key}: ${currentValue}`)
    }
}

// Registry GET via PowerShell
ipcMain.handle('registry:get', async (_, hive: string, regPath: string, name: string) => {
    try {
        const fullPath = `${escapePS(hive)}:\\${escapePS(regPath)}`
        const ps = `(Get-ItemProperty -Path '${fullPath}' -Name '${escapePS(name)}' -ErrorAction SilentlyContinue).'${escapePS(name)}'`
        const result = execSync(`powershell -NonInteractive -NoProfile -Command "${ps}"`, {
            encoding: 'utf-8',
            timeout: 10000,
            windowsHide: true,
        }).trim()
        if (result === '' || result === 'True' || result === 'False') {
            if (result === 'True') return 1
            if (result === 'False') return 0
            return null
        }
        const num = parseInt(result)
        return isNaN(num) ? result : num
    } catch {
        return null
    }
})

// Registry SET via PowerShell — with automatic backup
ipcMain.handle('registry:set', async (_, hive: string, regPath: string, name: string, value: any, type: string) => {
    try {
        // Read current value first for backup
        const fullPath = `${escapePS(hive)}:\\${escapePS(regPath)}`
        let currentValue: any = null
        try {
            const psGet = `(Get-ItemProperty -Path '${fullPath}' -Name '${escapePS(name)}' -ErrorAction SilentlyContinue).'${escapePS(name)}'`
            currentValue = execSync(`powershell -NonInteractive -NoProfile -Command "${psGet}"`, {
                encoding: 'utf-8', timeout: 10000, windowsHide: true,
            }).trim()
            if (currentValue === '') currentValue = null
        } catch { }

        // Backup original value
        backupOriginalValue(hive, regPath, name, currentValue)

        // Map type names
        const typeMap: Record<string, string> = {
            'DWord': 'DWord',
            'QWord': 'QWord',
            'String': 'String',
            'ExpandString': 'ExpandString',
            'Binary': 'Binary',
        }
        const psType = typeMap[type] || 'DWord'

        // Ensure path and restore point
        await ensureRestorePoint()
        const psEnsure = `if(!(Test-Path '${fullPath}')){New-Item -Path '${fullPath}' -Force | Out-Null}`
        execSync(`powershell -NonInteractive -NoProfile -Command "${psEnsure}"`, {
            encoding: 'utf-8', timeout: 10000, windowsHide: true,
        })

        // Set value
        const valEscaped = typeof value === 'string' ? `'${escapePS(value)}'` : value
        const psSet = `Set-ItemProperty -Path '${fullPath}' -Name '${escapePS(name)}' -Value ${valEscaped} -Type ${psType} -Force`
        execSync(`powershell -NonInteractive -NoProfile -Command "${psSet}"`, {
            encoding: 'utf-8', timeout: 10000, windowsHide: true,
        })

        sendLog(`[Registry] SET ${hive}\\${regPath}\\${name} = ${value} (was: ${currentValue})`)
        return true
    } catch (e: any) {
        sendError(`[Registry] Failed to set ${hive}\\${regPath}\\${name}: ${e.message}`)
        return false
    }
})

// Registry DELETE
ipcMain.handle('registry:delete', async (_, hive: string, regPath: string, name: string) => {
    try {
        const fullPath = `${escapePS(hive)}:\\${escapePS(regPath)}`
        const ps = `Remove-ItemProperty -Path '${fullPath}' -Name '${escapePS(name)}' -Force -ErrorAction SilentlyContinue`
        execSync(`powershell -NonInteractive -NoProfile -Command "${ps}"`, {
            encoding: 'utf-8', timeout: 10000, windowsHide: true,
        })
        sendLog(`[Registry] DELETED ${hive}\\${regPath}\\${name}`)
        return true
    } catch (e: any) {
        sendError(`[Registry] Failed to delete ${hive}\\${regPath}\\${name}: ${e.message}`)
        return false
    }
})

// Full registry backup export
ipcMain.handle('registry:backup', async () => {
    return loadBackups()
})

// Restore all backed up values
ipcMain.handle('registry:restoreAll', async () => {
    const backups = loadBackups()
    let restored = 0
    for (const [key, entry] of Object.entries(backups)) {
        try {
            const { hive, path: regPath, name, originalValue } = entry as any
            if (originalValue !== null && originalValue !== undefined) {
                const fullPath = `${escapePS(hive)}:\\${escapePS(regPath)}`
                const valEscaped = typeof originalValue === 'string' ? `'${escapePS(originalValue)}'` : originalValue
                const ps = `Set-ItemProperty -Path '${fullPath}' -Name '${escapePS(name)}' -Value ${valEscaped} -Force`
                execSync(`powershell -NonInteractive -NoProfile -Command "${ps}"`, {
                    encoding: 'utf-8', timeout: 10000, windowsHide: true,
                })
                restored++
            }
        } catch (e: any) {
            sendError(`[Registry] Failed to restore ${key}: ${e.message}`)
        }
    }
    sendLog(`[Registry] Restored ${restored} registry values`)
    return { success: true, restored }
})

// Restore last backed up value
ipcMain.handle('registry:restoreLast', async () => {
    const backups = loadBackups()
    const entries = Object.entries(backups)
    if (entries.length === 0) return { success: false, error: 'No backups found' }

    // Get the most recently backed up entry
    const sorted = entries.sort((a, b) =>
        new Date((b[1] as any).backedUpAt).getTime() - new Date((a[1] as any).backedUpAt).getTime()
    )
    const [key, entry] = sorted[0]
    const { hive, path: regPath, name, originalValue } = entry as any

    try {
        if (originalValue !== null && originalValue !== undefined) {
            const fullPath = `${escapePS(hive)}:\\${escapePS(regPath)}`
            const valEscaped = typeof originalValue === 'string' ? `'${escapePS(originalValue)}'` : originalValue
            const ps = `Set-ItemProperty -Path '${fullPath}' -Name '${escapePS(name)}' -Value ${valEscaped} -Force`
            execSync(`powershell -NonInteractive -NoProfile -Command "${ps}"`, {
                encoding: 'utf-8', timeout: 10000, windowsHide: true,
            })
        }
        // Remove from backups
        delete backups[key]
        saveBackups(backups)
        sendLog(`[Registry] Restored last change: ${key}`)
        return { success: true, key }
    } catch (e: any) {
        sendError(`[Registry] Failed to restore ${key}: ${e.message}`)
        return { success: false, error: e.message }
    }
})

export { backupOriginalValue, loadBackups }
