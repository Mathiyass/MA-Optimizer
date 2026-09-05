import { ipcMain } from 'electron'
import { execSync, spawnSync } from 'child_process'
import { sendLog, sendError } from './logger'
import * as path from 'path'
import * as fs from 'fs'
import { app } from 'electron'
import { escapePS, spawnPromise } from './utils'

let restorePointCreated = false
let restorePointInProgress = false

export function ensureRestorePointAsync() {
    if (restorePointCreated || restorePointInProgress) return
    restorePointInProgress = true
    const ps = `Checkpoint-Computer -Description 'MA-Optimizer Auto-Backup' -RestorePointType 'MODIFY_SETTINGS' -ErrorAction SilentlyContinue`
    spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], {
        timeout: 120000, encoding: 'utf-8',
    }).then(() => {
        restorePointCreated = true
        restorePointInProgress = false
        sendLog('[Backup] Automatic restore point created in background')
    }).catch(() => {
        restorePointInProgress = false
        sendLog('[Backup] Skipping restore point (missing privileges or disabled)')
    })
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

export function parseRegQueryOutput(stdout: string): { type: string; value: any } | null {
    if (!stdout) return null
    const lines = stdout.split(/\r?\n/)
    for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('HKEY_')) continue
        // Match: [optional name] REG_TYPE [optional value]
        const match = trimmed.match(/^(?:(\(Default\)|[^\t]+?)\s+)?(REG_[A-Z_]+)(?:\s+(.*))?$/i)
        if (match) {
            const regType = match[2].toUpperCase()
            const rawVal = match[3] !== undefined ? match[3].trim() : ''
            if (rawVal === '(value not set)') {
                return null
            }
            if (regType === 'REG_DWORD' || regType === 'REG_QWORD') {
                const parsed = parseInt(rawVal, rawVal.startsWith('0x') ? 16 : 10)
                return { type: regType, value: isNaN(parsed) ? 0 : parsed }
            } else {
                return { type: regType, value: rawVal }
            }
        }
    }
    return null
}

export async function queryRegistry(hive: string, regPath: string, name: string): Promise<any> {
    const fullKey = `${hive}\\${regPath}`
    const isDefault = !name || name === '@' || name === '(Default)'
    const args = isDefault ? ['query', fullKey, '/ve'] : ['query', fullKey, '/v', name]
    try {
        const { stdout } = await spawnPromise('reg.exe', args, { timeout: 4000 })
        const parsed = parseRegQueryOutput(stdout)
        return parsed ? parsed.value : null
    } catch {
        return null
    }
}

// Registry GET via native reg.exe (100x faster than PowerShell)
ipcMain.handle('registry:get', async (_, hive: string, regPath: string, name: string) => {
    return await queryRegistry(hive, regPath, name)
})

// Registry SET via native reg.exe — with automatic backup & async restore point
ipcMain.handle('registry:set', async (_, hive: string, regPath: string, name: string, value: any, type: string) => {
    try {
        const fullKey = `${hive}\\${regPath}`
        const isDefault = !name || name === '@' || name === '(Default)'

        // Read current value first for backup
        const currentValue = await queryRegistry(hive, regPath, name)
        await backupOriginalValue(hive, regPath, name, currentValue)

        // Queue background restore point
        ensureRestorePointAsync()

        const typeMap: Record<string, string> = {
            'DWord': 'REG_DWORD',
            'QWord': 'REG_QWORD',
            'String': 'REG_SZ',
            'ExpandString': 'REG_EXPAND_SZ',
            'Binary': 'REG_BINARY',
        }
        const regType = typeMap[type] || 'REG_DWORD'

        let addArgs: string[] = []
        if (isDefault) {
            addArgs = ['add', fullKey, '/ve', '/d', String(value), '/f']
        } else {
            addArgs = ['add', fullKey, '/v', name, '/t', regType, '/d', String(value), '/f']
        }

        await spawnPromise('reg.exe', addArgs, { timeout: 5000 })
        sendLog(`[Registry] SET ${fullKey}\\${name} = ${value} (was: ${currentValue})`)
        return true
    } catch (e: any) {
        sendError(`[Registry] Failed to set ${hive}\\${regPath}\\${name}: ${e.message}`)
        return false
    }
})

// Registry DELETE via native reg.exe
ipcMain.handle('registry:delete', async (_, hive: string, regPath: string, name: string) => {
    try {
        const fullKey = `${hive}\\${regPath}`
        const isDefault = !name || name === '@' || name === '(Default)'
        const deleteArgs = isDefault ? ['delete', fullKey, '/ve', '/f'] : ['delete', fullKey, '/v', name, '/f']
        await spawnPromise('reg.exe', deleteArgs, { timeout: 5000 })
        sendLog(`[Registry] DELETED ${fullKey}\\${name}`)
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

// Restore all backed up values using native reg.exe
ipcMain.handle('registry:restoreAll', async () => {
    const backups = await loadBackups()
    let restored = 0
    for (const [key, entry] of Object.entries(backups)) {
        try {
            const { hive, path: regPath, name, originalValue } = entry as any
            if (originalValue !== null && originalValue !== undefined) {
                const fullKey = `${hive}\\${regPath}`
                const isDefault = !name || name === '@' || name === '(Default)'
                const addArgs = isDefault
                    ? ['add', fullKey, '/ve', '/d', String(originalValue), '/f']
                    : ['add', fullKey, '/v', name, '/d', String(originalValue), '/f']
                await spawnPromise('reg.exe', addArgs, { timeout: 5000 })
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
            const fullKey = `${hive}\\${regPath}`
            const isDefault = !name || name === '@' || name === '(Default)'
            const addArgs = isDefault
                ? ['add', fullKey, '/ve', '/d', String(originalValue), '/f']
                : ['add', fullKey, '/v', name, '/d', String(originalValue), '/f']
            await spawnPromise('reg.exe', addArgs, { timeout: 5000 })
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

