import { ipcMain } from 'electron'
import { execSync } from 'child_process'
import { sendLog, sendError } from './logger'

interface ServiceInfo {
    name: string
    displayName: string
    status: string
    startType: string
}

const recommendedDisable = [
    { name: 'SysMain', reason: 'Superfetch — saves RAM, minor impact on SSD' },
    { name: 'DiagTrack', reason: 'Connected User Experiences and Telemetry' },
    { name: 'WerSvc', reason: 'Windows Error Reporting' },
    { name: 'MapsBroker', reason: 'Downloaded Maps Manager' },
    { name: 'RetailDemo', reason: 'Retail Demo Service' },
    { name: 'XblGameSave', reason: 'Xbox Live Game Save' },
    { name: 'XblAuthManager', reason: 'Xbox Live Auth Manager' },
    { name: 'XboxNetApiSvc', reason: 'Xbox Live Networking Service' },
    { name: 'lfsvc', reason: 'Geolocation Service' },
    { name: 'wisvc', reason: 'Windows Insider Service' },
    { name: 'TabletInputService', reason: 'Touch Keyboard and Handwriting' },
    { name: 'Fax', reason: 'Fax Service' },
    { name: 'RemoteRegistry', reason: 'Remote Registry — security risk' },
    { name: 'dmwappushservice', reason: 'WAP Push Message Routing' },
]

ipcMain.handle('services:list', async () => {
    try {
        const ps = `Get-Service | Select-Object Name,DisplayName,Status,StartType | ConvertTo-Json -Depth 2`
        const result = execSync(`powershell -NonInteractive -NoProfile -Command "${ps}"`, {
            encoding: 'utf-8', timeout: 30000, windowsHide: true, maxBuffer: 10 * 1024 * 1024,
        })
        const services = JSON.parse(result)
        return Array.isArray(services) ? services.map((s: any) => ({
            name: s.Name,
            displayName: s.DisplayName,
            status: typeof s.Status === 'number' ? (s.Status === 4 ? 'Running' : 'Stopped') : String(s.Status),
            startType: typeof s.StartType === 'number'
                ? ['Boot', 'System', 'Automatic', 'Manual', 'Disabled'][s.StartType] || 'Unknown'
                : String(s.StartType),
            recommended: recommendedDisable.find(r => r.name === s.Name)?.reason || null,
        })) : []
    } catch (e: any) {
        sendError(`Failed to list services: ${e.message}`)
        return []
    }
})

ipcMain.handle('services:setStartup', async (_, name: string, mode: string) => {
    try {
        const modeMap: Record<string, string> = {
            disabled: 'Disabled',
            manual: 'Manual',
            automatic: 'Automatic',
        }
        const ps = `Set-Service -Name '${name}' -StartupType ${modeMap[mode] || mode}`
        execSync(`powershell -NonInteractive -NoProfile -Command "${ps}"`, {
            encoding: 'utf-8', timeout: 10000, windowsHide: true,
        })
        sendLog(`[Services] Set ${name} startup type to ${mode}`)
        return true
    } catch (e: any) {
        sendError(`Failed to set ${name} startup: ${e.message}`)
        return false
    }
})

ipcMain.handle('services:start', async (_, name: string) => {
    try {
        execSync(`powershell -NonInteractive -NoProfile -Command "Start-Service -Name '${name}'"`, {
            encoding: 'utf-8', timeout: 15000, windowsHide: true,
        })
        sendLog(`[Services] Started ${name}`)
        return true
    } catch (e: any) {
        sendError(`Failed to start ${name}: ${e.message}`)
        return false
    }
})

ipcMain.handle('services:stop', async (_, name: string) => {
    try {
        execSync(`powershell -NonInteractive -NoProfile -Command "Stop-Service -Name '${name}' -Force"`, {
            encoding: 'utf-8', timeout: 15000, windowsHide: true,
        })
        sendLog(`[Services] Stopped ${name}`)
        return true
    } catch (e: any) {
        sendError(`Failed to stop ${name}: ${e.message}`)
        return false
    }
})

ipcMain.handle('services:applyRecommended', async () => {
    let applied = 0
    for (const svc of recommendedDisable) {
        try {
            execSync(`powershell -NonInteractive -NoProfile -Command "Stop-Service -Name '${svc.name}' -Force -ErrorAction SilentlyContinue; Set-Service -Name '${svc.name}' -StartupType Disabled -ErrorAction SilentlyContinue"`, {
                encoding: 'utf-8', timeout: 10000, windowsHide: true,
            })
            applied++
            sendLog(`[Services] Disabled ${svc.name} — ${svc.reason}`)
        } catch { }
    }
    sendLog(`[Services] Applied ${applied}/${recommendedDisable.length} recommended service changes`)
    return { applied, total: recommendedDisable.length }
})
