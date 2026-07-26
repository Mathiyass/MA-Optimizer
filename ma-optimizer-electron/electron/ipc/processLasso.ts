import { ipcMain } from 'electron'
import { exec, spawn } from 'child_process'
import { sendLog, sendError } from './logger'
import { spawnPromise } from './utils'

export interface ProcessLassoConfig {
    proBalanceEnabled: boolean
    proBalanceCpuThreshold: number // e.g. 20%
    smartTrimEnabled: boolean
    smartTrimRamThreshold: number // e.g. 80%
    coreParkingDisabled: boolean
    priorityRules: Array<{ processName: string; priority: string }>
    affinityRules: Array<{ processName: string; affinityMask: number }>
    disallowedProcesses: string[]
    gameModeProcesses: string[]
}

let lassoConfig: ProcessLassoConfig = {
    proBalanceEnabled: false,
    proBalanceCpuThreshold: 20,
    smartTrimEnabled: false,
    smartTrimRamThreshold: 80,
    coreParkingDisabled: false,
    priorityRules: [],
    affinityRules: [],
    disallowedProcesses: ['telemetry.exe', 'compattelrunner.exe'],
    gameModeProcesses: ['cs2.exe', 'cyberpunk2077.exe', 'valorant.exe', 'fortnite.exe', 'gta5.exe']
}

let proBalanceInterval: NodeJS.Timeout | null = null

// Helper to set process affinity via PowerShell
async function setProcessAffinity(pid: number, mask: number): Promise<boolean> {
    try {
        const ps = `(Get-Process -Id ${pid}).ProcessorAffinity = [IntPtr]${mask}`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 5000 })
        sendLog(`[ProcessLasso] Set PID ${pid} CPU affinity mask to ${mask}`)
        return true
    } catch (e: any) {
        sendError(`[ProcessLasso] Failed setting affinity for PID ${pid}: ${e.message}`)
        return false
    }
}

// Helper to set process I/O priority via PowerShell
async function setProcessIoPriority(pid: number, level: 'High' | 'Normal' | 'Low' | 'VeryLow'): Promise<boolean> {
    try {
        const priorityVal = level === 'High' ? 2 : level === 'Normal' ? 1 : level === 'Low' ? 0 : 0
        const ps = `$h = [System.Diagnostics.Process]::GetProcessById(${pid}).Handle; Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class Win32 { [DllImport("ntdll.dll")] public static extern int NtSetInformationProcess(IntPtr h, int c, ref int p, int s); }'; $p = ${priorityVal}; [Win32]::NtSetInformationProcess($h, 33, [ref]$p, 4)`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 5000 })
        sendLog(`[ProcessLasso] Set PID ${pid} I/O priority to ${level}`)
        return true
    } catch (e: any) {
        sendError(`[ProcessLasso] Failed setting I/O priority for PID ${pid}: ${e.message}`)
        return false
    }
}

// Helper to toggle Windows Core Parking
async function setCoreParking(disable: boolean): Promise<boolean> {
    try {
        const val = disable ? '0' : '100'
        const ps = `Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Power\\PowerSettings\\54533751-8270-4d6d-87c6-145531aee0ee\\0cc5b647-c1df-4637-891a-dec35c3185b3' -Name ValueMax -Value ${val} -ErrorAction SilentlyContinue; powercfg -setacvalueindex SCHEME_CURRENT SUB_PROCESSOR CPMINCORES 100; powercfg -setactive SCHEME_CURRENT`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 10000 })
        lassoConfig.coreParkingDisabled = disable
        sendLog(`[ProcessLasso] Core Parking ${disable ? 'Disabled (All Cores Active)' : 'Restored to Default'}`)
        return true
    } catch (e: any) {
        sendError(`[ProcessLasso] Failed configuring Core Parking: ${e.message}`)
        return false
    }
}

// SmartTrim RAM cleaner cycle
async function runSmartTrim() {
    try {
        const ps = `Get-Process | Where-Object { $_.WorkingSet64 -gt 100MB } | ForEach-Object { try { $_.EmptyWorkingSet() } catch {} }; [System.GC]::Collect()`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 15000 })
        sendLog('[ProcessLasso] SmartTrim automatically released RAM working set')
    } catch (e: any) {
        sendError(`[ProcessLasso] SmartTrim error: ${e.message}`)
    }
}

// ProBalance dynamic loop
function startProBalanceLoop() {
    if (proBalanceInterval) clearInterval(proBalanceInterval)

    proBalanceInterval = setInterval(async () => {
        if (!lassoConfig.proBalanceEnabled && !lassoConfig.disallowedProcesses.length) return

        try {
            // Check disallowed processes
            if (lassoConfig.disallowedProcesses.length > 0) {
                const names = lassoConfig.disallowedProcesses.map(n => `'${n.toLowerCase()}'`).join(',')
                const psKill = `Get-Process | Where-Object { (${names}) -contains $_.Name.ToLower() -or (${names}) -contains ($_.Name.ToLower() + '.exe') } | Stop-Process -Force`
                await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', psKill], { timeout: 5000 }).catch(() => {})
            }

            // ProBalance dynamic priority adjustment
            if (lassoConfig.proBalanceEnabled) {
                const psProBalance = `Get-Process | Where-Object { $_.CPU -gt ${lassoConfig.proBalanceCpuThreshold} -and $_.PriorityClass -eq 'Normal' -and $_.MainWindowTitle -eq '' } | ForEach-Object { $_.PriorityClass = 'BelowNormal' }`
                await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', psProBalance], { timeout: 5000 }).catch(() => {})
            }
        } catch {}
    }, 5000)
}

// Register IPC Handlers
ipcMain.handle('processLasso:getConfig', async () => {
    return lassoConfig
})

ipcMain.handle('processLasso:updateConfig', async (_, newConfig: Partial<ProcessLassoConfig>) => {
    lassoConfig = { ...lassoConfig, ...newConfig }
    if (lassoConfig.proBalanceEnabled) {
        startProBalanceLoop()
    } else if (proBalanceInterval) {
        clearInterval(proBalanceInterval)
        proBalanceInterval = null
    }
    return lassoConfig
})

ipcMain.handle('processLasso:setAffinity', async (_, pid: number, mask: number) => {
    return await setProcessAffinity(pid, mask)
})

ipcMain.handle('processLasso:setIoPriority', async (_, pid: number, level: 'High' | 'Normal' | 'Low' | 'VeryLow') => {
    return await setProcessIoPriority(pid, level)
})

ipcMain.handle('processLasso:toggleCoreParking', async (_, disable: boolean) => {
    return await setCoreParking(disable)
})

ipcMain.handle('processLasso:runSmartTrim', async () => {
    await runSmartTrim()
    return true
})

startProBalanceLoop()
