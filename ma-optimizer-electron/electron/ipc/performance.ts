import { ipcMain } from 'electron'
import { spawnPromise } from './utils'
import { sendLog, sendError } from './logger'

// Phase 1: Kernel & Scheduler Tuning

export async function getWin32PrioritySeparation(): Promise<{ success: boolean; value: number }> {
    try {
        const ps = `(Get-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl' -Name 'Win32PrioritySeparation' -ErrorAction SilentlyContinue).Win32PrioritySeparation`
        const { stdout } = await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 5000 })
        const val = parseInt(stdout.trim(), 10)
        return { success: true, value: isNaN(val) ? 2 : val }
    } catch (e: any) {
        return { success: false, value: 2 }
    }
}

export async function setWin32PrioritySeparation(value: number = 38): Promise<{ success: boolean; message: string }> {
    try {
        const clamped = Math.max(0, Math.min(63, value))
        const ps = `Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl' -Name 'Win32PrioritySeparation' -Value ${clamped} -Type DWord -Force`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 5000 })
        sendLog(`[Kernel Tuning] Win32PrioritySeparation set to ${clamped} (0x${clamped.toString(16).toUpperCase()}) - Foreground Priority Boost applied`)
        return { success: true, message: `Win32PrioritySeparation successfully set to ${clamped}` }
    } catch (e: any) {
        sendError(`[Kernel Tuning] Failed to set Win32PrioritySeparation: ${e.message}`)
        return { success: false, message: e.message }
    }
}

export async function getSpectreMitigationsStatus(): Promise<{ success: boolean; disabled: boolean }> {
    try {
        const ps = `
$fso = (Get-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management' -Name 'FeatureSettingsOverride' -ErrorAction SilentlyContinue).FeatureSettingsOverride
$fsom = (Get-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management' -Name 'FeatureSettingsOverrideMask' -ErrorAction SilentlyContinue).FeatureSettingsOverrideMask
if ($fso -eq 3 -and $fsom -eq 3) { 'DISABLED' } else { 'ENABLED' }
`
        const { stdout } = await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 5000 })
        const disabled = stdout.trim().toUpperCase() === 'DISABLED'
        return { success: true, disabled }
    } catch (e: any) {
        return { success: false, disabled: false }
    }
}

export async function toggleSpectreMitigations(disable: boolean): Promise<{ success: boolean; message: string }> {
    try {
        let ps = ''
        if (disable) {
            ps = `
Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management' -Name 'FeatureSettingsOverride' -Value 3 -Type DWord -Force
Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management' -Name 'FeatureSettingsOverrideMask' -Value 3 -Type DWord -Force
`
            sendLog('[Kernel Security] Spectre/Meltdown CPU mitigations disabled (Maximum CPU throughput mode, high-risk)')
        } else {
            ps = `
Remove-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management' -Name 'FeatureSettingsOverride' -ErrorAction SilentlyContinue
Remove-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management' -Name 'FeatureSettingsOverrideMask' -ErrorAction SilentlyContinue
`
            sendLog('[Kernel Security] Spectre/Meltdown CPU mitigations restored to system defaults')
        }
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 6000 })
        return { success: true, message: disable ? 'Spectre mitigations disabled' : 'Spectre mitigations enabled' }
    } catch (e: any) {
        sendError(`[Kernel Security] Failed to toggle Spectre mitigations: ${e.message}`)
        return { success: false, message: e.message }
    }
}

// Phase 4: GPU & Display Pipeline Enhancements

export async function getHagsStatus(): Promise<{ success: boolean; enabled: boolean; supported: boolean }> {
    try {
        const ps = `
$val = (Get-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers' -Name 'HwSchMode' -ErrorAction SilentlyContinue).HwSchMode
$supported = (Get-CimInstance Win32_VideoController | Where-Object { $_.Name -notmatch 'Basic Render|Remote' }).Count -gt 0
[PSCustomObject]@{
    Enabled = ($val -eq 2)
    Supported = $supported
} | ConvertTo-Json -Compress
`
        const { stdout } = await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 6000 })
        const parsed = JSON.parse(stdout.trim() || '{}')
        return { success: true, enabled: !!parsed.Enabled, supported: parsed.Supported ?? true }
    } catch (e: any) {
        return { success: false, enabled: false, supported: false }
    }
}

export async function toggleHags(enable: boolean): Promise<{ success: boolean; message: string }> {
    try {
        const val = enable ? 2 : 1
        const ps = `Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers' -Name 'HwSchMode' -Value ${val} -Type DWord -Force`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 5000 })
        sendLog(`[GPU Pipeline] Hardware-Accelerated GPU Scheduling (HAGS) set to ${enable ? 'Enabled (Mode 2)' : 'Disabled (Mode 1)'}`)
        return { success: true, message: `HAGS ${enable ? 'enabled' : 'disabled'} (Reboot required)` }
    } catch (e: any) {
        sendError(`[GPU Pipeline] Failed to toggle HAGS: ${e.message}`)
        return { success: false, message: e.message }
    }
}

export async function getMpoStatus(): Promise<{ success: boolean; disabled: boolean }> {
    try {
        const ps = `
$dwm = (Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\Dwm' -Name 'OverlayTestMode' -ErrorAction SilentlyContinue).OverlayTestMode
$gfx = (Get-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers' -Name 'DisableOverlays' -ErrorAction SilentlyContinue).DisableOverlays
if ($dwm -eq 5 -or $gfx -eq 1) { 'DISABLED' } else { 'ENABLED' }
`
        const { stdout } = await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 5000 })
        const disabled = stdout.trim().toUpperCase() === 'DISABLED'
        return { success: true, disabled }
    } catch (e: any) {
        return { success: false, disabled: false }
    }
}

export async function disableMpo(): Promise<{ success: boolean; message: string }> {
    try {
        const ps = `
Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\Dwm' -Name 'OverlayTestMode' -Value 5 -Type DWord -Force -ErrorAction SilentlyContinue
Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers' -Name 'DisableOverlays' -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 5000 })
        sendLog('[GPU Pipeline] Multi-Plane Overlay (MPO) disabled via legacy DWM OverlayTestMode and modern 25H2 DisableOverlays')
        return { success: true, message: 'MPO disabled (Eliminates desktop composition stutter and black screens)' }
    } catch (e: any) {
        sendError(`[GPU Pipeline] Failed to disable MPO: ${e.message}`)
        return { success: false, message: e.message }
    }
}

export async function enableMpo(): Promise<{ success: boolean; message: string }> {
    try {
        const ps = `
Remove-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\Dwm' -Name 'OverlayTestMode' -ErrorAction SilentlyContinue
Remove-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers' -Name 'DisableOverlays' -ErrorAction SilentlyContinue
`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 5000 })
        sendLog('[GPU Pipeline] Multi-Plane Overlay (MPO) restored to Windows defaults')
        return { success: true, message: 'MPO restored to default' }
    } catch (e: any) {
        sendError(`[GPU Pipeline] Failed to enable MPO: ${e.message}`)
        return { success: false, message: e.message }
    }
}

export async function disableFullscreenOptimizations(): Promise<{ success: boolean; message: string }> {
    try {
        const ps = `
if (!(Test-Path 'HKCU:\\System\\GameConfigStore')) { New-Item -Path 'HKCU:\\System\\GameConfigStore' -Force | Out-Null }
Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_FSEBehaviorMode' -Value 2 -Type DWord -Force
Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_HonorUserFSEBehaviorMode' -Value 1 -Type DWord -Force
Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_FSEBehavior' -Value 2 -Type DWord -Force
Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_DXGIHonorFSEWindowsCompatible' -Value 1 -Type DWord -Force
`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 6000 })
        sendLog('[GPU Pipeline] Disabled Windows Fullscreen Optimizations globally (Forces true exclusive fullscreen latency)')
        return { success: true, message: 'Fullscreen optimizations disabled globally' }
    } catch (e: any) {
        sendError(`[GPU Pipeline] Failed to disable fullscreen optimizations: ${e.message}`)
        return { success: false, message: e.message }
    }
}

export async function killGameDvr(): Promise<{ success: boolean; message: string }> {
    try {
        const ps = `
Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_Enabled' -Value 0 -Type DWord -Force
if (!(Test-Path 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\GameDVR')) { New-Item -Path 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\GameDVR' -Force | Out-Null }
Set-ItemProperty -Path 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\GameDVR' -Name 'AppCaptureEnabled' -Value 0 -Type DWord -Force
if (!(Test-Path 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR')) { New-Item -Path 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR' -Force | Out-Null }
Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR' -Name 'AllowGameDVR' -Value 0 -Type DWord -Force
`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 6000 })
        sendLog('[Gaming Engine] Game DVR, Xbox Game Bar Capture, and Background Recording stripped completely')
        return { success: true, message: 'Game DVR background capture killed' }
    } catch (e: any) {
        sendError(`[Gaming Engine] Failed to kill Game DVR: ${e.message}`)
        return { success: false, message: e.message }
    }
}

export async function getGpuInfo(): Promise<{ success: boolean; gpus: Array<{ name: string; vram: string; driverVersion: string; driverDate: string }> }> {
    try {
        const ps = `
Get-CimInstance Win32_VideoController | Select-Object Name, @{N='VRAM';E={[math]::Round($_.AdapterRAM / 1GB, 2)}}, DriverVersion, DriverDate | ConvertTo-Json -Compress
`
        const { stdout } = await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 6000 })
        const parsed = JSON.parse(stdout.trim() || '[]')
        const arr = Array.isArray(parsed) ? parsed : [parsed]
        const gpus = arr.filter(g => g && g.Name).map(g => ({
            name: String(g.Name || 'Unknown GPU'),
            vram: g.VRAM ? `${g.VRAM} GB` : 'N/A',
            driverVersion: String(g.DriverVersion || 'N/A'),
            driverDate: g.DriverDate ? String(g.DriverDate).split('T')[0] : 'N/A'
        }))
        return { success: true, gpus }
    } catch (e: any) {
        return { success: false, gpus: [] }
    }
}

export async function getMmcssGameProfile(): Promise<{
    success: boolean
    gpuPriority: number
    priority: number
    schedulingCategory: string
    sfioPriority: string
    isOptimal: boolean
}> {
    try {
        const ps = `
$path = 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games'
$gpu = (Get-ItemProperty -Path $path -Name 'GPU Priority' -ErrorAction SilentlyContinue).'GPU Priority'
$prio = (Get-ItemProperty -Path $path -Name 'Priority' -ErrorAction SilentlyContinue).Priority
$sched = (Get-ItemProperty -Path $path -Name 'Scheduling Category' -ErrorAction SilentlyContinue).'Scheduling Category'
$sfio = (Get-ItemProperty -Path $path -Name 'SFIO Priority' -ErrorAction SilentlyContinue).'SFIO Priority'
[PSCustomObject]@{
    GpuPriority = if ($gpu -ne $null) { [int]$gpu } else { 8 }
    Priority = if ($prio -ne $null) { [int]$prio } else { 2 }
    SchedulingCategory = if ($sched) { [string]$sched } else { 'Medium' }
    SfioPriority = if ($sfio) { [string]$sfio } else { 'Normal' }
} | ConvertTo-Json -Compress
`
        const { stdout } = await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 5000 })
        const data = JSON.parse(stdout.trim() || '{}')
        const gpuPriority = Number(data.GpuPriority ?? 8)
        const priority = Number(data.Priority ?? 2)
        const schedulingCategory = String(data.SchedulingCategory || 'Medium')
        const sfioPriority = String(data.SfioPriority || 'Normal')
        const isOptimal = gpuPriority >= 8 && priority >= 6 && schedulingCategory.toLowerCase() === 'high'

        return {
            success: true,
            gpuPriority,
            priority,
            schedulingCategory,
            sfioPriority,
            isOptimal,
        }
    } catch {
        return {
            success: false,
            gpuPriority: 8,
            priority: 2,
            schedulingCategory: 'Medium',
            sfioPriority: 'Normal',
            isOptimal: false,
        }
    }
}

export async function setMmcssGameProfile(): Promise<{ success: boolean; message: string }> {
    try {
        const ps = `
$path = 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games'
if (-not (Test-Path $path)) { New-Item -Path $path -Force | Out-Null }
Set-ItemProperty -Path $path -Name 'GPU Priority' -Value 8 -Type DWord -Force
Set-ItemProperty -Path $path -Name 'Priority' -Value 6 -Type DWord -Force
Set-ItemProperty -Path $path -Name 'Scheduling Category' -Value 'High' -Type String -Force
Set-ItemProperty -Path $path -Name 'SFIO Priority' -Value 'High' -Type String -Force
Set-ItemProperty -Path $path -Name 'Background Only' -Value 'False' -Type String -Force
Set-ItemProperty -Path $path -Name 'Clock Rate' -Value 10000 -Type DWord -Force

$sysProf = 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile'
Set-ItemProperty -Path $sysProf -Name 'SystemResponsiveness' -Value 0 -Type DWord -Force
Set-ItemProperty -Path $sysProf -Name 'NetworkThrottlingIndex' -Value 4294967295 -Type DWord -Force
`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 6000 })
        sendLog('[MMCSS] Applied Maximum Gaming Task Priority: GPU Priority=8, Thread Priority=6, Scheduling Category=High, SystemResponsiveness=0')
        return { success: true, message: 'MMCSS Gaming Priority Profile Applied (GPU=8, Priority=6, Scheduling=High)' }
    } catch (e: any) {
        sendError(`[MMCSS] Failed to apply profile: ${e.message}`)
        return { success: false, message: e.message }
    }
}

// Register IPC Handlers
ipcMain.handle('performance:getWin32PrioritySeparation', () => getWin32PrioritySeparation())
ipcMain.handle('performance:setWin32PrioritySeparation', (_e, val: number) => setWin32PrioritySeparation(val))
ipcMain.handle('performance:getSpectreMitigationsStatus', () => getSpectreMitigationsStatus())
ipcMain.handle('performance:toggleSpectreMitigations', (_e, disable: boolean) => toggleSpectreMitigations(disable))

ipcMain.handle('performance:getHagsStatus', () => getHagsStatus())
ipcMain.handle('performance:toggleHags', (_e, enable: boolean) => toggleHags(enable))
ipcMain.handle('performance:getMpoStatus', () => getMpoStatus())
ipcMain.handle('performance:disableMpo', () => disableMpo())
ipcMain.handle('performance:enableMpo', () => enableMpo())
ipcMain.handle('performance:disableFullscreenOptimizations', () => disableFullscreenOptimizations())
ipcMain.handle('performance:killGameDvr', () => killGameDvr())
ipcMain.handle('performance:getGpuInfo', () => getGpuInfo())

ipcMain.handle('performance:getMmcssGameProfile', () => getMmcssGameProfile())
ipcMain.handle('performance:setMmcssGameProfile', () => setMmcssGameProfile())
