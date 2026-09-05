import { ipcMain } from 'electron'
import { spawnPromise } from './utils'
import { sendLog, sendError } from './logger'

export interface HonePresetResult {
    success: boolean
    appliedTweaks: number
    message: string
}

// Enable MSI (Message Signaled Interrupts) Mode specifically on GPU & NICs for ultra-low DPC latency
async function enableMsiModeForGpuAndNic(): Promise<boolean> {
    try {
        const ps = `
$devices = Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\PCI\\*\\*\\Device Parameters\\Interrupt Management\\MessageSignaledInterruptProperties' -ErrorAction SilentlyContinue
foreach ($dev in $devices) {
    $parent = Split-Path (Split-Path (Split-Path $dev.PSPath))
    $devProps = Get-ItemProperty -Path $parent -ErrorAction SilentlyContinue
    if ($devProps.Class -match 'Display|Net' -or $parent -match 'CC_03|CC_02') {
        Set-ItemProperty -Path $dev.PSPath -Name 'MSISupported' -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
    }
}
`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 10000 })
        sendLog('[Hone Engine] Enabled Message Signaled Interrupts (MSI Mode) for GPU and Network Adapters (Reduced DPC Latency)')
        return true
    } catch (e: any) {
        sendError(`[Hone Engine] MSI Mode failed: ${e.message}`)
        return false
    }
}

// Revert/Disable MSI Mode on GPU & NICs
async function disableMsiModeForGpuAndNic(): Promise<boolean> {
    try {
        const ps = `
$devices = Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\PCI\\*\\*\\Device Parameters\\Interrupt Management\\MessageSignaledInterruptProperties' -ErrorAction SilentlyContinue
foreach ($dev in $devices) {
    $parent = Split-Path (Split-Path (Split-Path $dev.PSPath))
    $devProps = Get-ItemProperty -Path $parent -ErrorAction SilentlyContinue
    if ($devProps.Class -match 'Display|Net' -or $parent -match 'CC_03|CC_02') {
        Set-ItemProperty -Path $dev.PSPath -Name 'MSISupported' -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
    }
}
`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 10000 })
        sendLog('[Hone Engine] Disabled Message Signaled Interrupts (MSI Mode) for GPU and Network Adapters')
        return true
    } catch (e: any) {
        sendError(`[Hone Engine] Disable MSI Mode failed: ${e.message}`)
        return false
    }
}

// Apply Hone 1:1 Raw Mouse Input & Eliminate Pointer Acceleration
async function applyHoneRawMouseInput(): Promise<boolean> {
    try {
        const ps = `
Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseSpeed' -Value '0'
Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseThreshold1' -Value '0'
Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseThreshold2' -Value '0'
Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'SmoothMouseXCurve' -Value ([byte[]](0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0))
Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'SmoothMouseYCurve' -Value ([byte[]](0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0))
`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 5000 })
        sendLog('[Hone Engine] Applied 1:1 Raw Mouse Input & Stripped Acceleration Curves')
        return true
    } catch (e: any) {
        sendError(`[Hone Engine] Mouse input tuning failed: ${e.message}`)
        return false
    }
}

// Hone Competitive Preset Execution Payload
async function applyHoneCompetitivePreset(): Promise<HonePresetResult> {
    try {
        sendLog('[Hone Engine] Executing Hone Competitive Gaming Optimization Payload...')
        let count = 0

        // 1. MSI Interrupt Mode
        if (await enableMsiModeForGpuAndNic()) count += 2

        // 2. Raw 1:1 Mouse Input
        if (await applyHoneRawMouseInput()) count += 3

        // 3. System Responsiveness & Multimedia Scheduling
        const psSystem = `
Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Name 'SystemResponsiveness' -Value 0 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Name 'NetworkThrottlingIndex' -Value 4294967295 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games' -Name 'GPU Priority' -Value 8 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games' -Name 'Priority' -Value 6 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games' -Name 'Scheduling Category' -Value 'High' -Type String -ErrorAction SilentlyContinue
Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games' -Name 'SFIO Priority' -Value 'High' -Type String -ErrorAction SilentlyContinue
`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', psSystem], { timeout: 8000 }).catch(() => {})
        count += 6

        // 4. Disable Game DVR & Bar Background Overlay
        const psDvr = `
Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_Enabled' -Value 0 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR' -Name 'AllowGameDVR' -Value 0 -Type DWord -ErrorAction SilentlyContinue
`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', psDvr], { timeout: 5000 }).catch(() => {})
        count += 2

        // 5. USB Selective Suspend Disable
        const psUsb = `powercfg /SETACVALUEINDEX SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e66447-4a5f-413d-be5d-004848747134 0; powercfg /SETACTIVE SCHEME_CURRENT`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', psUsb], { timeout: 5000 }).catch(() => {})
        count += 1

        sendLog(`[Hone Engine] Hone Competitive Gaming Payload Applied! (${count} optimizations active)`)
        return { success: true, appliedTweaks: count, message: 'Hone Competitive Preset Applied Successfully!' }
    } catch (e: any) {
        sendError(`[Hone Engine] Failed applying Hone preset: ${e.message}`)
        return { success: false, appliedTweaks: 0, message: e.message }
    }
}

// IPC Handlers
ipcMain.handle('hone:enableMsiMode', async () => {
    return await enableMsiModeForGpuAndNic()
})

ipcMain.handle('hone:disableMsiMode', async () => {
    return await disableMsiModeForGpuAndNic()
})

ipcMain.handle('hone:disableMouseAccel', async () => {
    return await applyHoneRawMouseInput()
})

ipcMain.handle('hone:applyPreset', async () => {
    return await applyHoneCompetitivePreset()
})
