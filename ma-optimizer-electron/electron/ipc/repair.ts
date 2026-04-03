import { ipcMain, BrowserWindow } from 'electron'
import { execSync, spawn, spawnSync } from 'child_process'
import { sendLog, sendError } from './logger'
import { escapePS, spawnSyncChecked } from './utils'

function streamCommand(cmd: string, args: string[], win: BrowserWindow | null): Promise<string> {
    return new Promise((resolve) => {
        let output = ''
        const proc = spawn(cmd, args, { windowsHide: true, shell: false })
        proc.stdout.on('data', (d: Buffer) => {
            const line = d.toString().trim()
            if (line) {
                output += line + '\n'
                win?.webContents.send('log:line', `[${cmd}] ${line}`)
            }
        })
        proc.stderr.on('data', (d: Buffer) => {
            const line = d.toString().trim()
            if (line) {
                output += line + '\n'
                win?.webContents.send('log:line', `[${cmd}] ${line}`)
            }
        })
        proc.on('close', () => resolve(output))
        proc.on('error', (e) => resolve(e.message))
        setTimeout(() => { try { proc.kill() } catch { }; resolve(output) }, 600000) // 10min max
    })
}

function getWin(): BrowserWindow | null {
    const wins = BrowserWindow.getAllWindows()
    return wins.length > 0 ? wins[0] : null
}

// SFC /scannow
ipcMain.handle('repair:sfc', async () => {
    sendLog('[Repair] Starting SFC /scannow...')
    const result = await streamCommand('sfc', ['/scannow'], getWin())
    sendLog('[Repair] SFC scan complete')
    return result
})

// DISM operations
ipcMain.handle('repair:dism', async (_, action: string) => {
    const actions: Record<string, string[]> = {
        checkHealth: ['/Online', '/Cleanup-Image', '/CheckHealth'],
        scanHealth: ['/Online', '/Cleanup-Image', '/ScanHealth'],
        restoreHealth: ['/Online', '/Cleanup-Image', '/RestoreHealth'],
        cleanup: ['/Online', '/Cleanup-Image', '/StartComponentCleanup'],
    }
    const args = actions[action] || actions.checkHealth
    sendLog(`[Repair] Starting DISM ${action}...`)
    const result = await streamCommand('dism', args, getWin())
    sendLog(`[Repair] DISM ${action} complete`)
    return result
})

// Create restore point
ipcMain.handle('repair:createRestorePoint', async (_, desc: string) => {
    try {
        const safeDesc = escapePS(desc || 'MA-Optimizer Backup')
        const ps = `Checkpoint-Computer -Description '${safeDesc}' -RestorePointType 'MODIFY_SETTINGS'`
        spawnSyncChecked('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], {
            timeout: 120000, encoding: 'utf-8',
        })
        sendLog(`[Repair] Restore point created: ${desc}`)
        return true
    } catch (e: any) {
        // Try via WMI if PowerShell cmdlet fails
        try {
            const safeDesc = escapePS(desc || 'MA-Optimizer Backup')
            const wmi = `(Get-WmiObject -List -Class SystemRestore -Namespace 'root\\default').CreateRestorePoint('${safeDesc}',12,100)`
            spawnSyncChecked('powershell', ['-NonInteractive', '-NoProfile', '-Command', wmi], {
                timeout: 120000, encoding: 'utf-8',
            })
            sendLog(`[Repair] Restore point created via WMI: ${desc}`)
            return true
        } catch (e2: any) {
            sendError(`Failed to create restore point: ${e2.message}`)
            return false
        }
    }
})

// List restore points
ipcMain.handle('repair:listRestorePoints', async () => {
    try {
        const ps = `Get-ComputerRestorePoint | Select-Object SequenceNumber,Description,CreationTime,RestorePointType | ConvertTo-Json`
        const { stdout } = spawnSyncChecked('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], {
            encoding: 'utf-8', timeout: 15000,
        })
        const result = stdout.trim()
        if (!result) return []
        const parsed = JSON.parse(result)
        return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
        return []
    }
})

// Reset network
ipcMain.handle('repair:resetNetwork', async () => {
    const win = getWin()
    const commands = [
        ['netsh', ['winsock', 'reset']],
        ['netsh', ['int', 'ip', 'reset']],
        ['netsh', ['advfirewall', 'reset']],
        ['ipconfig', ['/release']],
        ['ipconfig', ['/renew']],
        ['ipconfig', ['/flushdns']],
        ['netsh', ['winhttp', 'reset', 'proxy']],
    ]
    for (const [cmd, args] of commands) {
        await streamCommand(cmd as string, args as string[], win)
    }
    sendLog('[Repair] Full network reset complete — restart recommended')
    return true
})

// Reset Windows Update
ipcMain.handle('repair:resetWU', async () => {
    sendLog('[Repair] Resetting Windows Update components...')
    const ps = `
Stop-Service wuauserv -Force -ErrorAction SilentlyContinue
Stop-Service bits -Force -ErrorAction SilentlyContinue
Stop-Service cryptsvc -Force -ErrorAction SilentlyContinue
Stop-Service msiserver -Force -ErrorAction SilentlyContinue
Remove-Item "C:\\Windows\\SoftwareDistribution" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "C:\\Windows\\System32\\catroot2" -Recurse -Force -ErrorAction SilentlyContinue
regsvr32 /s atl.dll
regsvr32 /s urlmon.dll
regsvr32 /s mshtml.dll
netsh winsock reset
netsh winhttp reset proxy
Start-Service wuauserv -ErrorAction SilentlyContinue
Start-Service bits -ErrorAction SilentlyContinue
Start-Service cryptsvc -ErrorAction SilentlyContinue
Start-Service msiserver -ErrorAction SilentlyContinue
`
    try {
        spawnSyncChecked('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps.replace(/\r?\n/g, '; ')], {
            timeout: 60000, encoding: 'utf-8',
        })
        sendLog('[Repair] Windows Update components reset complete')
        return true
    } catch (e: any) {
        sendError(`WU reset error: ${e.message}`)
        return false
    }
})

// wsreset
ipcMain.handle('repair:wsreset', async () => {
    try {
        execSync('wsreset.exe', { timeout: 30000, windowsHide: true })
        sendLog('[Repair] Windows Store reset complete')
        return true
    } catch { return false }
})

// Re-register apps
ipcMain.handle('repair:reregisterApps', async () => {
    sendLog('[Repair] Re-registering Windows Store apps...')
    const result = await streamCommand('powershell', [
        '-NonInteractive', '-NoProfile', '-Command',
        'Get-AppxPackage -AllUsers | ForEach-Object { Add-AppxPackage -Register "$($_.InstallLocation)\\AppxManifest.xml" -DisableDevelopmentMode -ErrorAction SilentlyContinue }'
    ], getWin())
    sendLog('[Repair] Apps re-registered')
    return result
})

// Fix hosts file
ipcMain.handle('repair:fixHosts', async () => {
    try {
        const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts'
        const defaultHosts = `# Copyright (c) 1993-2009 Microsoft Corp.\r\n#\r\n# This is a sample HOSTS file used by Microsoft TCP/IP for Windows.\r\n#\r\n# localhost name resolution is handled within DNS itself.\r\n#\t127.0.0.1       localhost\r\n#\t::1             localhost\r\n`
        require('fs').writeFileSync(hostsPath, defaultHosts, 'utf-8')
        sendLog('[Repair] Hosts file restored to default')
        return true
    } catch (e: any) {
        sendError(`Failed to fix hosts: ${e.message}`)
        return false
    }
})

// Rebuild icon cache
ipcMain.handle('repair:iconCache', async () => {
    try {
        const ps = `
Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
Remove-Item "$env:LOCALAPPDATA\\IconCache.db" -Force -ErrorAction SilentlyContinue
Remove-Item "$env:LOCALAPPDATA\\Microsoft\\Windows\\Explorer\\iconcache_*" -Force -ErrorAction SilentlyContinue
Start-Process explorer
`
        spawnSyncChecked('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps.replace(/\r?\n/g, '; ')], {
            timeout: 15000, encoding: 'utf-8',
        })
        sendLog('[Repair] Icon cache rebuilt')
        return true
    } catch { return false }
})

// Check disk
ipcMain.handle('repair:chkdsk', async (_, drive: string) => {
    const safeDrive = (drive || 'C:').replace(/[^a-zA-Z0-9:]/g, '')
    if (!safeDrive) return 'Invalid drive'
    sendLog(`[Repair] Running chkdsk on ${safeDrive}...`)
    return await streamCommand('chkdsk', [safeDrive, '/scan'], getWin())
})

// Memory diagnostic
ipcMain.handle('repair:memdiag', async () => {
    try {
        execSync('mdsched.exe', { timeout: 5000, windowsHide: false })
        sendLog('[Repair] Memory Diagnostic launched')
        return true
    } catch { return false }
})
