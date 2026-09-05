import { ipcMain, BrowserWindow } from 'electron'
import { sendLog, sendError } from './logger'
import { spawnPromise } from './utils'
import * as os from 'os'

export interface GovernorConfig {
    proBalanceEnabled: boolean
    proBalanceCpuThreshold: number // CPU % threshold (e.g. 20%)
    proBalanceRestraintDuration: number // seconds to hold restraint
    smartTrimEnabled: boolean
    smartTrimRamThreshold: number // RAM % threshold (e.g. 80%)
    autoGameBoost: boolean
}

interface RestrainedProcess {
    pid: number
    name: string
    restrainedAt: number
}

// Critical system & multimedia processes that must never be restrained
const EXEMPT_PROCESS_NAMES = new Set([
    'explorer.exe',
    'dwm.exe',
    'csrss.exe',
    'services.exe',
    'lsass.exe',
    'smss.exe',
    'winlogon.exe',
    'audiodg.exe',
    'system',
    'registry',
    'steam.exe',
    'steamwebhelper.exe',
    'obs64.exe',
    'discord.exe',
    'nvidia share.exe',
    'ma-optimizer.exe',
    'electron.exe',
])

const KNOWN_GAME_PROCESSES = [
    'cs2.exe',
    'csgo.exe',
    'valorant.exe',
    'fortniteclient-win64-shipping.exe',
    'cyberpunk2077.exe',
    'gta5.exe',
    'r5apex.exe',
    'overwatch.exe',
    'dota2.exe',
    'league of legends.exe',
    'modernwarfare.exe',
    'cod.exe',
    'pubg.exe',
    'rocketleague.exe',
    'rainbowsix.exe',
    'rust.exe',
]

let config: GovernorConfig = {
    proBalanceEnabled: true,
    proBalanceCpuThreshold: 20,
    proBalanceRestraintDuration: 15,
    smartTrimEnabled: true,
    smartTrimRamThreshold: 80,
    autoGameBoost: true,
}

let governorInterval: NodeJS.Timeout | null = null
let restrainedProcesses = new Map<number, RestrainedProcess>()
let lastForegroundGame: string | null = null
let prevCpuTimes = new Map<number, { totalTime: number; timestamp: number }>()

export function isExempt(name: string): boolean {
    const lower = name.toLowerCase().trim()
    if (EXEMPT_PROCESS_NAMES.has(lower)) return true
    if (KNOWN_GAME_PROCESSES.includes(lower)) return true
    return false
}

/**
 * Executes SmartTrim working set cleanup on bloated background processes
 */
export async function executeSmartTrim(): Promise<{ freedMb: number; success: boolean }> {
    try {
        const memBefore = os.freemem()
        const ps = `
$procs = Get-Process | Where-Object { $_.WorkingSet64 -gt 50MB -and $_.MainWindowTitle -eq '' }
foreach ($p in $procs) {
    try { $p.EmptyWorkingSet() | Out-Null } catch {}
}
[System.GC]::Collect()
`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 12000 })
        const memAfter = os.freemem()
        const freedMb = Math.max(0, Math.round((memAfter - memBefore) / (1024 * 1024)))
        sendLog(`[SmartTrim] Reclaimed ~${freedMb} MB of inactive RAM working set`)
        return { freedMb, success: true }
    } catch (e: any) {
        sendError(`[SmartTrim] Error executing memory trim: ${e.message}`)
        return { freedMb: 0, success: false }
    }
}

/**
 * Restores priority of restrained background processes back to Normal
 */
async function restorePriorities(pids: number[]): Promise<void> {
    if (pids.length === 0) return
    const pidList = pids.join(',')
    try {
        const ps = `Get-Process -Id ${pidList} -ErrorAction SilentlyContinue | ForEach-Object { $_.PriorityClass = 'Normal' }`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], { timeout: 5000 }).catch(() => {})
        for (const pid of pids) {
            restrainedProcesses.delete(pid)
        }
    } catch {}
}

/**
 * Checks running processes, detects game mode, and applies ProBalance rate restraint
 */
export async function runGovernorCycle(): Promise<void> {
    try {
        // 1. SmartTrim check if RAM exceeds threshold
        if (config.smartTrimEnabled) {
            const totalMem = os.totalmem()
            const usedPercent = ((totalMem - os.freemem()) / totalMem) * 100
            if (usedPercent >= config.smartTrimRamThreshold) {
                await executeSmartTrim()
            }
        }

        // 2. Activity & Game Detection
        const psQuery = `
Get-Process | Select-Object -Property Id, ProcessName, CPU, MainWindowTitle | ConvertTo-Json -Compress
`
        let rawJson = ''
        try {
            const res = await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', psQuery], { timeout: 8000 })
            rawJson = res.stdout.trim()
        } catch {
            return
        }
        if (!rawJson) return

        let procList: any[] = []
        try {
            const parsed = JSON.parse(rawJson)
            procList = Array.isArray(parsed) ? parsed : [parsed]
        } catch {
            return
        }

        const now = Date.now()

        // Check if any known game is running with a window
        let activeGameFound: string | null = null
        for (const p of procList) {
            const exeName = (p.ProcessName || '').toLowerCase() + '.exe'
            if (KNOWN_GAME_PROCESSES.includes(exeName)) {
                activeGameFound = exeName
                break
            }
        }

        if (activeGameFound !== lastForegroundGame) {
            lastForegroundGame = activeGameFound
            const eventPayload = { activeGame: activeGameFound, isGaming: !!activeGameFound }
            BrowserWindow.getAllWindows().forEach((win) => {
                if (!win.isDestroyed()) {
                    win.webContents.send('heuristic:activity', eventPayload)
                }
            })
            if (activeGameFound) {
                sendLog(`[Governor] Active game detected: ${activeGameFound}. Prioritizing resources.`)
            }
        }

        // 3. ProBalance Priority Restraint
        if (config.proBalanceEnabled) {
            const toRestrain: Array<{ pid: number; name: string }> = []
            const currentPids = new Set<number>()

            for (const p of procList) {
                const pid = p.Id
                const name = (p.ProcessName || '').toLowerCase() + '.exe'
                const cpuTime = typeof p.CPU === 'number' ? p.CPU : 0
                const hasWindow = !!(p.MainWindowTitle && p.MainWindowTitle.trim().length > 0)
                currentPids.add(pid)

                if (isExempt(name) || hasWindow) {
                    continue
                }

                const prev = prevCpuTimes.get(pid)
                if (prev) {
                    const elapsedSec = (now - prev.timestamp) / 1000
                    if (elapsedSec > 0) {
                        const cpuPercent = ((cpuTime - prev.totalTime) / (elapsedSec * os.cpus().length)) * 100
                        if (cpuPercent >= config.proBalanceCpuThreshold) {
                            toRestrain.push({ pid, name })
                        }
                    }
                }
                prevCpuTimes.set(pid, { totalTime: cpuTime, timestamp: now })
            }

            // Cleanup dead PIDs from cache
            for (const cachedPid of prevCpuTimes.keys()) {
                if (!currentPids.has(cachedPid)) {
                    prevCpuTimes.delete(cachedPid)
                }
            }

            // Apply BelowNormal priority to hogs
            for (const target of toRestrain) {
                if (!restrainedProcesses.has(target.pid)) {
                    const psRestrain = `(Get-Process -Id ${target.pid} -ErrorAction SilentlyContinue).PriorityClass = 'BelowNormal'`
                    await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', psRestrain], { timeout: 4000 }).catch(() => {})
                    restrainedProcesses.set(target.pid, { pid: target.pid, name: target.name, restrainedAt: now })
                    sendLog(`[ProBalance] Restrained background hog: ${target.name} (PID: ${target.pid}) to BelowNormal`)
                }
            }

            // Release restrained processes after duration expires
            const pidsToRestore: number[] = []
            for (const [pid, info] of restrainedProcesses.entries()) {
                if (now - info.restrainedAt >= config.proBalanceRestraintDuration * 1000 || !currentPids.has(pid)) {
                    pidsToRestore.push(pid)
                }
            }
            await restorePriorities(pidsToRestore)
        }
    } catch {}
}

export function startGovernorDaemon() {
    if (governorInterval) clearInterval(governorInterval)
    governorInterval = setInterval(runGovernorCycle, 4000)
}

export function stopGovernorDaemon() {
    if (governorInterval) {
        clearInterval(governorInterval)
        governorInterval = null
    }
}

// IPC Registration
ipcMain.handle('heuristic:getState', async () => {
    return {
        config,
        activeGame: lastForegroundGame,
        isGaming: !!lastForegroundGame,
        restrainedCount: restrainedProcesses.size,
        restrainedList: Array.from(restrainedProcesses.values()),
    }
})

ipcMain.handle('heuristic:updateConfig', async (_, newConfig: Partial<GovernorConfig>) => {
    config = { ...config, ...newConfig }
    sendLog(`[Governor] Updated configuration: ${JSON.stringify(config)}`)
    return config
})

ipcMain.handle('heuristic:runSmartTrim', async () => {
    return await executeSmartTrim()
})

ipcMain.handle('heuristic:turboBoost', async () => {
    sendLog('[Governor] 🚀 Turbo Boost initiated!')
    const trimRes = await executeSmartTrim()
    // Unpark cores via powercfg
    try {
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', 'powercfg -setacvalueindex SCHEME_CURRENT SUB_PROCESSOR CPMINCORES 100; powercfg -setactive SCHEME_CURRENT'], { timeout: 5000 })
    } catch {}
    return { success: true, freedMb: trimRes.freedMb }
})

// Start daemon automatically on startup
startGovernorDaemon()
