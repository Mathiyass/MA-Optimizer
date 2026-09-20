import { ipcMain } from 'electron'
import { spawnPromise } from './utils'
import { sendLog, sendError } from './logger'

// Phase 2: Security vs Performance Architecture

export interface SecurityStatus {
    vbsEnabled: boolean
    hvciEnabled: boolean
    spectreDisabled: boolean
    cfgEnabled: boolean
    hypervisorType: string
    securityScore: number // 0 (Pure gaming performance) to 100 (Maximum hardened enterprise)
}

export async function getVbsStatus(): Promise<{ success: boolean; enabled: boolean; hypervisorType: string }> {
    try {
        const ps = `
$dg = (Get-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard' -Name 'EnableVirtualizationBasedSecurity' -ErrorAction SilentlyContinue).EnableVirtualizationBasedSecurity
$bcd = (bcdedit /enum {current} | Select-String 'hypervisorlaunchtype').Line
$type = if ($bcd -match 'Off') { 'Off' } elseif ($bcd -match 'Auto') { 'Auto' } else { 'Default' }
[PSCustomObject]@{
    Enabled = ($dg -eq 1 -or $type -eq 'Auto')
    HypervisorType = $type
} | ConvertTo-Json -Compress
`
        const { stdout } = await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 6000 })
        const parsed = JSON.parse(stdout.trim() || '{}')
        return { success: true, enabled: !!parsed.Enabled, hypervisorType: parsed.HypervisorType || 'Default' }
    } catch (e: any) {
        return { success: false, enabled: false, hypervisorType: 'Unknown' }
    }
}

export async function toggleVbs(enable: boolean): Promise<{ success: boolean; message: string }> {
    try {
        const val = enable ? 1 : 0
        const bcdVal = enable ? 'auto' : 'off'
        const ps = `
if (!(Test-Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard')) { New-Item -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard' -Force | Out-Null }
Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard' -Name 'EnableVirtualizationBasedSecurity' -Value ${val} -Type DWord -Force
bcdedit /set hypervisorlaunchtype ${bcdVal}
`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 8000 })
        sendLog(`[Security Engine] Virtualization-Based Security (VBS) set to ${enable ? 'Enabled' : 'Disabled (Recovers 5-15% 1% low FPS, requires reboot)'}`)
        return { success: true, message: `VBS ${enable ? 'enabled' : 'disabled'} (Reboot required)` }
    } catch (e: any) {
        sendError(`[Security Engine] Failed to toggle VBS: ${e.message}`)
        return { success: false, message: e.message }
    }
}

export async function getHvciStatus(): Promise<{ success: boolean; enabled: boolean }> {
    try {
        const ps = `(Get-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity' -Name 'Enabled' -ErrorAction SilentlyContinue).Enabled`
        const { stdout } = await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 5000 })
        const val = parseInt(stdout.trim(), 10)
        return { success: true, enabled: val === 1 }
    } catch (e: any) {
        return { success: false, enabled: false }
    }
}

export async function toggleHvci(enable: boolean): Promise<{ success: boolean; message: string }> {
    try {
        const val = enable ? 1 : 0
        const ps = `
$path = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity'
if (!(Test-Path $path)) { New-Item -Path $path -Force | Out-Null }
Set-ItemProperty -Path $path -Name 'Enabled' -Value ${val} -Type DWord -Force
`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 6000 })
        sendLog(`[Security Engine] Hypervisor-Protected Code Integrity (HVCI / Core Isolation) set to ${enable ? 'Enabled' : 'Disabled (Eliminates kernel virtualization hook latency)'}`)
        return { success: true, message: `Core Isolation HVCI ${enable ? 'enabled' : 'disabled'} (Reboot required)` }
    } catch (e: any) {
        sendError(`[Security Engine] Failed to toggle HVCI: ${e.message}`)
        return { success: false, message: e.message }
    }
}

export async function getExploitProtection(): Promise<{ success: boolean; cfgEnabled: boolean; depEnabled: boolean; aslrEnabled: boolean }> {
    try {
        const ps = `
$mit = Get-ProcessMitigation -System -ErrorAction SilentlyContinue
[PSCustomObject]@{
    CFG = ($mit.ControlFlowGuard.Enable -ne 'OFF')
    DEP = ($mit.DEP.Enable -ne 'OFF')
    ASLR = ($mit.BottomUpASLR.Enable -ne 'OFF')
} | ConvertTo-Json -Compress
`
        const { stdout } = await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 8000 })
        const parsed = JSON.parse(stdout.trim() || '{}')
        return {
            success: true,
            cfgEnabled: parsed.CFG ?? true,
            depEnabled: parsed.DEP ?? true,
            aslrEnabled: parsed.ASLR ?? true
        }
    } catch (e: any) {
        return { success: false, cfgEnabled: true, depEnabled: true, aslrEnabled: true }
    }
}

export async function toggleCfg(enable: boolean): Promise<{ success: boolean; message: string }> {
    try {
        const cmd = enable ? '-Enable' : '-Disable'
        const ps = `Set-ProcessMitigation -System ${cmd} CFG`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 8000 })
        sendLog(`[Security Engine] Control Flow Guard (CFG) set to ${enable ? 'Enabled' : 'Disabled (High performance, reduces pointer branch checking)'}`)
        return { success: true, message: `Control Flow Guard ${enable ? 'enabled' : 'disabled'}` }
    } catch (e: any) {
        sendError(`[Security Engine] Failed to toggle CFG: ${e.message}`)
        return { success: false, message: e.message }
    }
}

export async function getSecurityOverview(): Promise<{ success: boolean; status: SecurityStatus }> {
    try {
        const [vbs, hvci, ep] = await Promise.all([
            getVbsStatus(),
            getHvciStatus(),
            getExploitProtection()
        ])

        const { getSpectreMitigationsStatus } = require('./performance')
        const spectre = await getSpectreMitigationsStatus()

        // Calculate score: 100 = full defense, 0 = pure FPS tuning
        let score = 0
        if (vbs.enabled) score += 35
        if (hvci.enabled) score += 35
        if (!spectre.disabled) score += 20
        if (ep.cfgEnabled) score += 10

        const status: SecurityStatus = {
            vbsEnabled: vbs.enabled,
            hvciEnabled: hvci.enabled,
            spectreDisabled: spectre.disabled,
            cfgEnabled: ep.cfgEnabled,
            hypervisorType: vbs.hypervisorType,
            securityScore: score
        }

        return { success: true, status }
    } catch (e: any) {
        return {
            success: false,
            status: {
                vbsEnabled: true,
                hvciEnabled: true,
                spectreDisabled: false,
                cfgEnabled: true,
                hypervisorType: 'Unknown',
                securityScore: 100
            }
        }
    }
}

// Register IPC Handlers
ipcMain.handle('security:getVbsStatus', () => getVbsStatus())
ipcMain.handle('security:toggleVbs', (_e, enable: boolean) => toggleVbs(enable))
ipcMain.handle('security:getHvciStatus', () => getHvciStatus())
ipcMain.handle('security:toggleHvci', (_e, enable: boolean) => toggleHvci(enable))
ipcMain.handle('security:getExploitProtection', () => getExploitProtection())
ipcMain.handle('security:toggleCfg', (_e, enable: boolean) => toggleCfg(enable))
ipcMain.handle('security:getSecurityOverview', () => getSecurityOverview())
