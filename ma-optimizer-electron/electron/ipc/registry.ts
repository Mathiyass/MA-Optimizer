import { ipcMain } from 'electron'
import { execSync, spawnSync } from 'child_process'
import { sendLog, sendError } from './logger'
import * as path from 'path'
import * as fs from 'fs'
import { app } from 'electron'
import { escapePS, spawnPromise } from './utils'

let restorePointCreated = false
async function ensureRestorePoint() {
    if (restorePointCreated) return
    try {
        const ps = `Checkpoint-Computer -Description 'MA-Optimizer Auto-Backup' -RestorePointType 'MODIFY_SETTINGS'`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], {
            timeout: 120000, encoding: 'utf-8',
        })
        restorePointCreated = true
        sendLog('[Backup] Automatic restore point created before modification')
    } catch (e) {
        sendLog('[Backup] Skipping restore point (missing privileges or disabled)')
    }
}

const backupPath = path.join(app.getPath('userData'), 'backups', 'registry_backup.json')

async function ensureBackupDir() {
    const dir = path.dirname(backupPath)
    if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true })
    }
}

export async function loadBackups(): Promise<Record<string, any>> {
    await ensureBackupDir()
    try {
        if (fs.existsSync(backupPath)) {
            const data = await fs.promises.readFile(backupPath, 'utf-8')
            return JSON.parse(data)
        }
    } catch { }
    return {}
}

export async function saveBackups(data: Record<string, any>) {
    await ensureBackupDir()
    await fs.promises.writeFile(backupPath, JSON.stringify(data, null, 2), 'utf-8')
}

export async function backupOriginalValue(hive: string, regPath: string, name: string, currentValue: any) {
    const key = `${hive}\\${regPath}\\${name}`
    const backups = await loadBackups()
    // Never overwrite an existing backup for the same key
    if (!(key in backups)) {
        backups[key] = {
            hive,
            path: regPath,
            name,
            originalValue: currentValue,
            backedUpAt: new Date().toISOString(),
        }
        await saveBackups(backups)
        sendLog(`[Backup] Saved original value for ${key}: ${currentValue}`)
    }
}

// Registry GET via PowerShell
ipcMain.handle('registry:get', async (_, hive: string, regPath: string, name: string) => {
    try {
        const fullPath = `${escapePS(hive)}:\\${escapePS(regPath)}`
        const ps = `(Get-ItemProperty -Path '${fullPath}' -Name '${escapePS(name)}' -ErrorAction SilentlyContinue).'${escapePS(name)}'`
        const { stdout } = await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], {
            encoding: 'utf-8',
            timeout: 10000,
        })
        const result = stdout.trim()
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
            const { stdout } = await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', psGet], {
                encoding: 'utf-8', timeout: 10000,
            })
            currentValue = stdout.trim()
            if (currentValue === '') currentValue = null
        } catch { }

        // Backup original value
        await backupOriginalValue(hive, regPath, name, currentValue)

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
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', psEnsure], {
            timeout: 10000, encoding: 'utf-8',
        })

        // Set value
        const valEscaped = typeof value === 'string' ? `'${escapePS(value)}'` : value
        const psSet = `Set-ItemProperty -Path '${fullPath}' -Name '${escapePS(name)}' -Value ${valEscaped} -Type ${psType} -Force`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', psSet], {
            timeout: 10000, encoding: 'utf-8',
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
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], {
            timeout: 10000, encoding: 'utf-8',
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
    return await loadBackups()
})

// Restore all backed up values
ipcMain.handle('registry:restoreAll', async () => {
    const backups = await loadBackups()
    let restored = 0
    for (const [key, entry] of Object.entries(backups)) {
        try {
            const { hive, path: regPath, name, originalValue } = entry as any
            if (originalValue !== null && originalValue !== undefined) {
                const fullPath = `${escapePS(hive)}:\\${escapePS(regPath)}`
                const valEscaped = typeof originalValue === 'string' ? `'${escapePS(originalValue)}'` : originalValue
                const ps = `Set-ItemProperty -Path '${fullPath}' -Name '${escapePS(name)}' -Value ${valEscaped} -Force`
                await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], {
                    timeout: 10000, encoding: 'utf-8',
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
    const backups = await loadBackups()
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
            await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], {
                timeout: 10000, encoding: 'utf-8',
            })
        }
        // Remove from backups
        delete backups[key]
        await saveBackups(backups)
        sendLog(`[Registry] Restored last change: ${key}`)
        return { success: true, key }
    } catch (e: any) {
        sendError(`[Registry] Failed to restore ${key}: ${e.message}`)
        return { success: false, error: e.message }
    }
})

