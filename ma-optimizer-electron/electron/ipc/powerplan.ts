import { ipcMain, BrowserWindow, shell } from 'electron'
import { execSync, exec, spawn } from 'child_process'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import { sendLog, sendError } from './logger'
import { escapePS, spawnSyncChecked } from './utils'

const MA_PLAN_GUID = 'e3a5506b-2d5f-4a5d-9c2a-4d3e5f1a7b9c'
const MA_PLAN_NAME = 'MA Power Plan'
const ULTIMATE_GUID = 'e9a42b02-d5df-448d-aa00-03f14749eb61'
const HIGH_PERF_GUID = '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c'
const BALANCED_GUID = '381b4222-f694-41f0-9685-ff5bb260df2e'

const SUB_PROC = '54533251-82be-4824-96c1-47b60b740d00'
const SUB_SLEEP = '238c9fa8-0aad-41ed-83f4-97be242c8f20'
const SUB_PCIE = '501a4d13-42af-4429-9fd1-a8218c268e20'
const SUB_USB = '2a737441-1930-4402-8d77-b2bebba308a3'
const SUB_DISK = '0012ee47-9041-4b5d-9b77-535fba8b1442'

async function run(cmd: string, args: string[]): Promise<string> {
    return new Promise(resolve => {
        const proc = spawn(cmd, args, { timeout: 30000, windowsHide: true })
        let stdout = ''
        proc.stdout?.on('data', (d: any) => stdout += d.toString())
        proc.on('close', () => resolve(stdout))
        proc.on('error', (err: any) => resolve(err.message))
    })
}

function reg(regPath: string, name: string, value: string | number, type = 'REG_DWORD') {
    try {
        spawnSyncChecked('reg', ['add', regPath, '/v', String(name), '/t', type, '/d', String(value), '/f'], { timeout: 10000, encoding: 'utf-8' })
    } catch { }
}

function getMainWindow(): BrowserWindow | null {
    const wins = BrowserWindow.getAllWindows()
    return wins.length > 0 ? wins[0] : null
}

function send(msg: string) {
    sendLog(`[MA Power Plan] ${msg}`)
}

async function createMaPowerPlan(): Promise<boolean> {
    try {
        send('Step 1/8: Duplicating Ultimate Performance as base...')
        // Try Ultimate Performance first, fall back to High Performance
        let result = await run('powercfg', ['/duplicatescheme', ULTIMATE_GUID, MA_PLAN_GUID])
        if (result.toLowerCase().includes('error') || result.toLowerCase().includes('not found')) {
            // Unhide Ultimate Performance first
            await run('powercfg', ['-duplicatescheme', ULTIMATE_GUID])
            result = await run('powercfg', ['/duplicatescheme', ULTIMATE_GUID, MA_PLAN_GUID])
            if (result.toLowerCase().includes('error')) {
                send('Ultimate Performance not available, using High Performance as base...')
                await run('powercfg', ['/duplicatescheme', HIGH_PERF_GUID, MA_PLAN_GUID])
            }
        }

        send('Step 2/8: Naming and describing plan...')
        await run('powercfg', ['/changename', MA_PLAN_GUID, MA_PLAN_NAME, "MA-Optimizer exclusive plan — maximum sustained performance with zero throttling"])

        send('Step 3/8: Configuring processor to maximum (no boost limits, no parking)...')
        const procTweaks: [string, number, number][] = [
            ['bc5038f7-23e0-4960-96da-33abaf5935ec', 100, 100],  // Max processor state
            ['893dee8e-2bef-41e0-89c6-b55d0929964c', 0, 0],      // Min processor state
            ['be337238-0d82-4146-a960-4f3749d470c7', 3, 2],      // Boost mode
            ['45bcc044-d885-43e2-8605-ee0ec6e96b59', 100, 60],   // Boost policy
            ['0cc5b647-c1df-4637-891a-dec35c318583', 100, 50],   // Core parking min
            ['ea062031-0e34-4ff1-9b6d-eb1059334028', 100, 100],  // Core parking max
            ['3b04d4fd-1cc7-4f23-ab1c-d1337819c4bb', 0, 1],     // Allow throttle states
            ['7f2492b6-60b1-45e5-ae55-773f8cd5caec', 4, 0],     // Heterogeneous policy
            ['06cadf0e-64ed-448a-8927-ce7bf90eb35d', 10, 30],   // Perf increase threshold
            ['12a0ab44-fe28-4fa9-b3bd-4b64f44960a6', 8, 25],    // Perf decrease threshold
            ['465e1f50-b610-473a-ab58-00d1077dc418', 2, 0],     // Perf increase policy
            ['616cdaa5-695e-4b83-b97d-e0e9b0df5c43', 100, 0],   // Latency sensitivity min cores
        ]
        for (const [guid, ac, dc] of procTweaks) {
            await run('powercfg', ['/setacvalueindex', MA_PLAN_GUID, SUB_PROC, guid, String(ac)])
            await run('powercfg', ['/setdcvalueindex', MA_PLAN_GUID, SUB_PROC, guid, String(dc)])
        }

        send('Step 4/8: Disabling all sleep and hibernate states...')
        const sleepTweaks: [string, number][] = [
            ['29f6c1db-86da-48c5-9fdb-f2b67b1f44da', 0],  // Sleep after: never
            ['9d7815a6-7ee4-497e-8888-515a05f02364', 0],  // Hibernate after: never
            ['94ac6d29-73ce-41a6-809f-6363ba21b47e', 0],  // Allow hybrid sleep: off
            ['bd3b718a-0680-4d9d-8ab2-e1d2b4ac806d', 0],  // Wake timers: disabled
            ['7bc4a2f9-d8fc-4469-b07b-33eb785aaca0', 0],  // Fast sleep: off
        ]
        for (const [guid, val] of sleepTweaks) {
            await run('powercfg', ['/setacvalueindex', MA_PLAN_GUID, SUB_SLEEP, guid, String(val)])
            await run('powercfg', ['/setdcvalueindex', MA_PLAN_GUID, SUB_SLEEP, guid, String(val)])
        }

        send('Step 5/8: Disabling PCIe link state power management...')
        await run('powercfg', ['/setacvalueindex', MA_PLAN_GUID, SUB_PCIE, 'ee12f906-d277-404b-b6da-e5fa1a576df5', '0'])
        await run('powercfg', ['/setdcvalueindex', MA_PLAN_GUID, SUB_PCIE, 'ee12f906-d277-404b-b6da-e5fa1a576df5', '0'])

        send('Step 6/8: Disabling USB selective suspend...')
        await run('powercfg', ['/setacvalueindex', MA_PLAN_GUID, SUB_USB, '48e6b7a6-50f5-4782-a5d4-53bb8f07e226', '0'])
        await run('powercfg', ['/setdcvalueindex', MA_PLAN_GUID, SUB_USB, '48e6b7a6-50f5-4782-a5d4-53bb8f07e226', '0'])
        await run('powercfg', ['/setacvalueindex', MA_PLAN_GUID, SUB_USB, 'd4e98f31-5ffe-4ce1-be31-1b38b384c009', '0'])
        await run('powercfg', ['/setacvalueindex', MA_PLAN_GUID, SUB_USB, '736184a9-f223-4356-9fe3-3e7e21129dff', '0'])

        send('Step 7/8: Disabling disk power saving and NVMe idle timeout...')
        await run('powercfg', ['/setacvalueindex', MA_PLAN_GUID, SUB_DISK, '6738e2c4-e8a5-4a42-b16a-e040e769756e', '0'])
        await run('powercfg', ['/setdcvalueindex', MA_PLAN_GUID, SUB_DISK, '6738e2c4-e8a5-4a42-b16a-e040e769756e', '0'])
        await run('powercfg', ['/setacvalueindex', MA_PLAN_GUID, SUB_DISK, 'd639518a-e56d-4345-8af2-b9f32fb26109', '0'])

        send('Step 8/8: Applying registry performance tweaks...')
        const mmPath = 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile'
        reg(mmPath, 'SystemResponsiveness', 0)
        reg(mmPath, 'NetworkThrottlingIndex', 4294967295)

        const gamesPath = `${mmPath}\\Tasks\\Games`
        reg(gamesPath, 'GPU Priority', 8)
        reg(gamesPath, 'Priority', 6)
        reg(gamesPath, 'Scheduling Category', 'High', 'REG_SZ')
        reg(gamesPath, 'SFIO Priority', 'High', 'REG_SZ')
        reg(gamesPath, 'Background Only', 'False', 'REG_SZ')
        reg(gamesPath, 'Clock Rate', 10000)
        reg(gamesPath, 'Latency Sensitive', 'True', 'REG_SZ')

        // Disable Connected Standby / Modern Standby
        reg('HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power', 'CsEnabled', 0)
        reg('HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power', 'PlatformAoAcOverride', 0)
        reg('HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power', 'EnergyEstimationEnabled', 0)

        // Disable Fast Startup
        reg('HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power', 'HiberbootEnabled', 0)

        // Interrupt coalescing disabled
        reg('HKLM\\SYSTEM\\CurrentControlSet\\Services\\Ndis\\Parameters', 'AllowCoalescingOnHost', 0)

        send('Activating MA Power Plan...')
        await run('powercfg', ['/setactive', MA_PLAN_GUID])

        send('✅ MA Power Plan created and activated successfully! A restart is recommended.')
        return true
    } catch (e: any) {
        sendError(`MA Power Plan creation failed: ${e.message}`)
        return false
    }
}

// IPC Handlers
ipcMain.handle('powerplan:create', () => createMaPowerPlan())

ipcMain.handle('powerplan:activate', async () => {
    const exists = (await run('powercfg', ['/list'])).toLowerCase().includes(MA_PLAN_GUID.toLowerCase())
    if (!exists) await createMaPowerPlan()
    else await run('powercfg', ['/setactive', MA_PLAN_GUID])
    send('MA Power Plan activated')
    return true
})

ipcMain.handle('powerplan:deactivate', async () => {
    await run('powercfg', ['/setactive', HIGH_PERF_GUID])
    send('Switched to High Performance plan')
    return true
})

ipcMain.handle('powerplan:exists', async () =>
    (await run('powercfg', ['/list'])).toLowerCase().includes(MA_PLAN_GUID.toLowerCase())
)

ipcMain.handle('powerplan:isActive', async () => {
    const out = await run('powercfg', ['/getactivescheme'])
    return out.toLowerCase().includes(MA_PLAN_GUID.toLowerCase())
})

ipcMain.handle('powerplan:getActive', async () => {
    const out = await run('powercfg', ['/getactivescheme'])
    const m = out.match(/([0-9a-f-]{36})\s+\(([^)]+)\)/i)
    return m ? { guid: m[1], name: m[2] } : null
})

ipcMain.handle('powerplan:listAll', async () => {
    const out = await run('powercfg', ['/list'])
    return out.split('\n')
        .filter(l => l.includes('GUID'))
        .map(l => {
            const m = l.match(/([0-9a-f-]{36})\s+\(([^)]+)\)(\s+\*)?/i)
            return m ? { guid: m[1].trim(), name: m[2].trim(), active: !!m[3] } : null
        })
        .filter(Boolean)
})

ipcMain.handle('powerplan:activateByGuid', async (_, guid: string) => {
    const safeGuid = String(guid).replace(/[^a-fA-F0-9-]/g, '')
    await run('powercfg', ['/setactive', safeGuid])
    send(`Activated power plan: ${safeGuid}`)
    return true
})

ipcMain.handle('powerplan:applyProfile', async (_, profile: string) => {
    send(`Applying ${profile} profile...`)
    const boostModeAc: Record<string, number> = { performance: 3, balanced: 2, battery: 1 }
    const minCoresAc: Record<string, number> = { performance: 100, balanced: 50, battery: 0 }
    const sleepAc: Record<string, number> = { performance: 0, balanced: 1800, battery: 900 }

    await run('powercfg', ['/setacvalueindex', MA_PLAN_GUID, SUB_PROC, 'be337238-0d82-4146-a960-4f3749d470c7', String(boostModeAc[profile] ?? 2)])
    await run('powercfg', ['/setacvalueindex', MA_PLAN_GUID, SUB_PROC, '0cc5b647-c1df-4637-891a-dec35c318583', String(minCoresAc[profile] ?? 50)])

    if (profile === 'battery') {
        await run('powercfg', ['/setacvalueindex', MA_PLAN_GUID, SUB_SLEEP, '29f6c1db-86da-48c5-9fdb-f2b67b1f44da', String(sleepAc[profile])])
    } else {
        await run('powercfg', ['/setacvalueindex', MA_PLAN_GUID, SUB_SLEEP, '29f6c1db-86da-48c5-9fdb-f2b67b1f44da', '0'])
    }

    await run('powercfg', ['/setactive', MA_PLAN_GUID])
    send(`${profile} profile applied.`)
    return true
})

ipcMain.handle('powerplan:setTimer', async (_, ns: number) => {
    try {
        const safeNs = parseInt(String(ns))
        if (isNaN(safeNs)) return false
        const ps = `
$code = @"
using System.Runtime.InteropServices;
public class TimerRes {
    [DllImport("ntdll.dll")] public static extern int NtSetTimerResolution(int d, bool s, out int c);
    public static void Set(int ns) { int c; NtSetTimerResolution(ns, true, out c); }
}
"@
Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue
[TimerRes]::Set(${safeNs})
`
        spawnSyncChecked('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps.replace(/\r?\n/g, ' ')], {
            timeout: 10000,
            encoding: 'utf-8'
        })
        send(`Timer resolution set to ${ns / 10000}ms`)
        return true
    } catch (e: any) {
        sendError(`Failed to set timer resolution: ${e.message}`)
        return false
    }
})

ipcMain.handle('powerplan:getTimer', async () => {
    try {
        const ps = `(Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel" -Name "GlobalTimerResolutionRequests" -ErrorAction SilentlyContinue).GlobalTimerResolutionRequests`
        const { stdout } = spawnSyncChecked('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], {
            encoding: 'utf-8', timeout: 5000,
        })
        const result = stdout.trim()
        return parseInt(result) || 10000
    } catch {
        return 10000
    }
})

ipcMain.handle('powerplan:energyReport', async () => {
    const outPath = path.join(os.tmpdir(), 'ma-energy-report.html')
    send('Generating energy report (10s scan)...')
    await run('powercfg', ['/energy', '/output', outPath, '/duration', '10'])
    shell.openPath(outPath)
    send('Energy report generated and opened')
    return outPath
})

ipcMain.handle('powerplan:batteryReport', async () => {
    const outPath = path.join(os.tmpdir(), 'ma-battery-report.html')
    send('Generating battery report...')
    await run('powercfg', ['/batteryreport', '/output', outPath])
    shell.openPath(outPath)
    return outPath
})

ipcMain.handle('powerplan:sleepStudy', async () => {
    const outPath = path.join(os.tmpdir(), 'ma-sleep-study.html')
    send('Generating sleep study report...')
    await run('powercfg', ['/sleepstudy', '/output', outPath])
    shell.openPath(outPath)
    return outPath
})

ipcMain.handle('powerplan:delete', async () => {
    await run('powercfg', ['/setactive', BALANCED_GUID])
    await run('powercfg', ['/delete', MA_PLAN_GUID])
    send('MA Power Plan deleted, switched to Balanced')
    return true
})

ipcMain.handle('powerplan:export', async (_, savePath: string) => {
    await run('powercfg', ['/export', String(savePath), MA_PLAN_GUID])
    send(`Plan exported to ${savePath}`)
    return true
})

ipcMain.handle('powerplan:import', async (_, filePath: string) => {
    await run('powercfg', ['/import', String(filePath)])
    send(`Plan imported from ${filePath}`)
    return true
})
