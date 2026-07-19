import { ipcMain, BrowserWindow } from 'electron'
import { exec, execSync, spawn } from 'child_process'
import * as os from 'os'
import { sendLog, sendError } from './logger'
import { escapePS, spawnPromise } from './utils'

let si: any = null
function getSi() {
    if (!si) si = require('systeminformation')
    return si
}

let lastCpus = os.cpus()

function calculateCpuLoad() {
    const currentCpus = os.cpus()
    let totalDiff = 0
    let idleDiff = 0

    for (let i = 0; i < currentCpus.length; i++) {
        const lastCpu = lastCpus[i]
        const currentCpu = currentCpus[i]
        if (!lastCpu || !currentCpu) continue

        const lastTotal = Object.values(lastCpu.times).reduce((acc, t) => acc + t, 0)
        const currentTotal = Object.values(currentCpu.times).reduce((acc, t) => acc + t, 0)

        const total = currentTotal - lastTotal
        const idle = currentCpu.times.idle - lastCpu.times.idle

        totalDiff += total
        idleDiff += idle
    }

    lastCpus = currentCpus

    if (totalDiff === 0) return 0
    return Math.round((1 - idleDiff / totalDiff) * 100 * 10) / 10
}

let lastNetBytes = { rx: 0, tx: 0, time: Date.now() }

function getNetworkBytesWin(): Promise<{ rx: number, tx: number }> {
    return new Promise((resolve) => {
        exec('netstat -e', { windowsHide: true }, (err, stdout) => {
            if (err || !stdout) {
                return resolve({ rx: 0, tx: 0 })
            }
            const match = stdout.match(/Bytes\s+(\d+)\s+(\d+)/)
            if (match) {
                resolve({
                    rx: parseInt(match[1], 10),
                    tx: parseInt(match[2], 10)
                })
            } else {
                resolve({ rx: 0, tx: 0 })
            }
        })
    })
}

async function getNetworkStats(): Promise<{ rxSec: number, txSec: number }> {
    if (process.platform === 'win32') {
        const now = Date.now()
        const elapsed = (now - lastNetBytes.time) / 1000
        const current = await getNetworkBytesWin()
        
        let rxSec = 0
        let txSec = 0
        
        if (elapsed > 0) {
            if (lastNetBytes.rx > 0 && current.rx >= lastNetBytes.rx) {
                rxSec = Math.round((current.rx - lastNetBytes.rx) / elapsed)
            }
            if (lastNetBytes.tx > 0 && current.tx >= lastNetBytes.tx) {
                txSec = Math.round((current.tx - lastNetBytes.tx) / elapsed)
            }
        }
        
        lastNetBytes = { rx: current.rx, tx: current.tx, time: now }
        return { rxSec, txSec }
    } else {
        try {
            const net = await getSi().networkStats()
            const primary = net[0] || {}
            return {
                rxSec: primary.rx_sec || 0,
                txSec: primary.tx_sec || 0,
            }
        } catch {
            return { rxSec: 0, txSec: 0 }
        }
    }
}

ipcMain.handle('system:cpuUsage', async () => {
    try {
        const load = calculateCpuLoad()
        const currentCpus = os.cpus()
        const cpuCpus = currentCpus.map((cpu, index) => {
            const lastCpu = lastCpus[index]
            if (!lastCpu) return 0
            const lastTotal = Object.values(lastCpu.times).reduce((acc, t) => acc + t, 0)
            const currentTotal = Object.values(cpu.times).reduce((acc, t) => acc + t, 0)
            const total = currentTotal - lastTotal
            const idle = cpu.times.idle - lastCpu.times.idle
            return total === 0 ? 0 : Math.round((1 - idle / total) * 100 * 10) / 10
        })
        lastCpus = currentCpus
        return {
            currentLoad: load,
            cpus: cpuCpus,
        }
    } catch { return { currentLoad: 0, cpus: [] } }
})

ipcMain.handle('system:ramUsage', async () => {
    try {
        const total = os.totalmem()
        const free = os.freemem()
        const used = total - free
        return {
            total,
            used,
            free,
            usedPercent: Math.round((used / total) * 1000) / 10,
            swapTotal: 0,
            swapUsed: 0,
        }
    } catch { return { total: 0, used: 0, free: 0, usedPercent: 0, swapTotal: 0, swapUsed: 0 } }
})

let diskIOMetrics = { readBytesPerSec: 0, writeBytesPerSec: 0 }

function startTypeperfDiskIO() {
    if (process.platform !== 'win32') return
    const tp = spawn('typeperf', ['\\PhysicalDisk(_Total)\\Disk Read Bytes/sec', '\\PhysicalDisk(_Total)\\Disk Write Bytes/sec', '-si', '1'], { windowsHide: true, shell: false })

    tp.stdout.on('data', (data) => {
        const lines = data.toString().split('\n')
        for (const line of lines) {
            if (line.includes(',') && !line.includes('PDH-CSV') && !line.includes('Exiting')) {
                const parts = line.split(',')
                if (parts.length >= 3) {
                    const read = parseFloat(parts[1].replace(/"/g, ''))
                    const write = parseFloat(parts[2].replace(/"/g, ''))
                    if (!isNaN(read) && !isNaN(write)) {
                        diskIOMetrics.readBytesPerSec = read
                        diskIOMetrics.writeBytesPerSec = write
                    }
                }
            }
        }
    })

    tp.on('error', () => { /* ignore */ })
    tp.on('close', () => setTimeout(startTypeperfDiskIO, 5000))
}

startTypeperfDiskIO()

// Use fsStats / Typeperf for reliable byte-rate data on Windows (disksIO often returns 0)
ipcMain.handle('system:diskIO', async () => {
    try {
        if (process.platform === 'win32') {
            return {
                readPerSec: diskIOMetrics.readBytesPerSec,
                writePerSec: diskIOMetrics.writeBytesPerSec,
                readBytesPerSec: diskIOMetrics.readBytesPerSec,
                writeBytesPerSec: diskIOMetrics.writeBytesPerSec,
            }
        }

        const fs = await getSi().fsStats()
        if (fs && (fs.rx_sec !== null || fs.wx_sec !== null)) {
            return {
                readPerSec: fs.rx_sec || 0,
                writePerSec: fs.wx_sec || 0,
                readBytesPerSec: fs.rx_sec || 0,
                writeBytesPerSec: fs.wx_sec || 0,
            }
        }
        // Fallback to disksIO
        const io = await getSi().disksIO()
        return {
            readPerSec: io?.rIO_sec || 0,
            writePerSec: io?.wIO_sec || 0,
            readBytesPerSec: io?.rIO_sec || 0,
            writeBytesPerSec: io?.wIO_sec || 0,
        }
    } catch { return { readPerSec: 0, writePerSec: 0, readBytesPerSec: 0, writeBytesPerSec: 0 } }
})

ipcMain.handle('system:networkSpeed', async () => {
    try {
        const net = await getSi().networkStats()
        const primary = net[0] || {}
        return {
            rxSec: primary.rx_sec || 0,
            txSec: primary.tx_sec || 0,
            rxBytes: primary.rx_bytes || 0,
            txBytes: primary.tx_bytes || 0,
        }
    } catch { return { rxSec: 0, txSec: 0, rxBytes: 0, txBytes: 0 } }
})

ipcMain.handle('system:fullInfo', async () => {
    try {
        const [cpu, mem, os, graphics, disk, baseboard, bios, system, time, net] = await Promise.all([
            getSi().cpu(),
            getSi().mem(),
            getSi().osInfo(),
            getSi().graphics(),
            getSi().diskLayout(),
            getSi().baseboard(),
            getSi().bios(),
            getSi().system(),
            getSi().time(),
            getSi().networkInterfaces(),
        ])

        let cpuTemp = null
        try {
            const temp = await getSi().cpuTemperature()
            cpuTemp = temp.main || null
        } catch { }

        return {
            cpu: {
                brand: cpu.brand,
                manufacturer: cpu.manufacturer,
                speed: cpu.speed,
                speedMax: cpu.speedMax,
                cores: cpu.physicalCores,
                threads: cpu.cores,
                socket: cpu.socket,
                cache: { l1d: cpu.cache?.l1d, l1i: cpu.cache?.l1i, l2: cpu.cache?.l2, l3: cpu.cache?.l3 },
                temperature: cpuTemp,
            },
            memory: {
                total: mem.total,
                used: mem.active,
                free: mem.available,
                swapTotal: mem.swaptotal,
                swapUsed: mem.swapused,
            },
            os: {
                platform: os.platform,
                distro: os.distro,
                release: os.release,
                build: os.build,
                arch: os.arch,
                hostname: os.hostname,
                serial: os.serial,
            },
            gpu: (graphics.controllers || []).map((g: any) => ({
                model: g.model,
                vendor: g.vendor,
                vram: g.vram,
                driverVersion: g.driverVersion,
                resolutionX: g.resolutionX,
                resolutionY: g.resolutionY,
            })),
            disks: (disk || []).map((d: any) => ({
                name: d.name,
                type: d.type,
                size: d.size,
                vendor: d.vendor,
                interfaceType: d.interfaceType,
                temperature: d.temperature,
                serialNum: d.serialNum,
                smartStatus: d.smartStatus,
            })),
            motherboard: {
                manufacturer: baseboard.manufacturer,
                model: baseboard.model,
                version: baseboard.version,
                serial: baseboard.serial,
            },
            bios: {
                vendor: bios.vendor,
                version: bios.version,
                releaseDate: bios.releaseDate,
            },
            system: {
                manufacturer: system.manufacturer,
                model: system.model,
                version: system.version,
                uuid: system.uuid,
            },
            uptime: time.uptime,
            network: (net || []).map((n: any) => ({
                iface: n.iface,
                ifaceName: n.ifaceName,
                ip4: n.ip4,
                ip6: n.ip6,
                mac: n.mac,
                type: n.type,
                speed: n.speed,
                dhcp: n.dhcp,
            })),
        }
    } catch (e: any) {
        sendError(`Failed to get system info: ${e.message}`)
        return null
    }
})

ipcMain.handle('system:processes', async () => {
    try {
        const procs = await getSi().processes()
        return (procs.list || []).slice(0, 200).map((p: any) => ({
            pid: p.pid,
            name: p.name,
            cpu: Math.round(p.cpu * 10) / 10,
            mem: Math.round((p.mem || 0) * 10) / 10,
            memRss: p.memRss || 0,
            path: p.path || '',
            command: p.command || '',
            started: p.started || '',
            state: p.state || 'running',
        }))
    } catch { return [] }
})

ipcMain.handle('system:killProcess', async (_, pid: number) => {
    try {
        const safePid = parseInt(String(pid))
        if (isNaN(safePid)) return false
        await spawnPromise('taskkill', ['/PID', String(safePid), '/F'], { timeout: 5000, encoding: 'utf-8' })
        sendLog(`[System] Killed process PID ${safePid}`)
        return true
    } catch (e: any) {
        sendError(`Failed to kill process ${pid}: ${e.message}`)
        return false
    }
})

ipcMain.handle('system:setPriority', async (_, pid: number, priority: number) => {
    try {
        const safePid = parseInt(String(pid))
        const safePriority = parseInt(String(priority))
        if (isNaN(safePid) || isNaN(safePriority)) return false
        const ps = `(Get-Process -Id ${safePid}).PriorityClass = ${safePriority}`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], {
            timeout: 5000, encoding: 'utf-8',
        })
        sendLog(`[System] Set process ${pid} priority to ${priority}`)
        return true
    } catch (e: any) {
        sendError(`Failed to set priority for ${pid}: ${e.message}`)
        return false
    }
})

ipcMain.handle('system:cleanRam', async () => {
    try {
        const ps = `Get-Process | ForEach-Object { try { $_.EmptyWorkingSet() } catch {} }; [System.GC]::Collect()`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], {
            timeout: 15000, encoding: 'utf-8',
        })
        sendLog('[System] RAM working set optimized successfully')
        return true
    } catch (e: any) {
        sendError(`Failed to optimize RAM: ${e.message}`)
        return false
    }
})

// 🔧 FIX: Shift live stat polling to the main process and push to renderer (Debounce & Centralize)
let isPollingSystemStats = false
let systemStatsInterval: NodeJS.Timeout | null = null

export function startSystemStatsPolling() {
    if (isPollingSystemStats) return
    isPollingSystemStats = true

    // Initialize last cpus and net bytes
    lastCpus = os.cpus()
    if (process.platform === 'win32') {
        getNetworkBytesWin().then(res => {
            lastNetBytes = { rx: res.rx, tx: res.tx, time: Date.now() }
        }).catch(() => {})
    }

    systemStatsInterval = setInterval(async () => {
        const windows = BrowserWindow.getAllWindows()
        // Filter out minimized or hidden windows to save resources
        const visibleWindows = windows.filter(win => !win.isDestroyed() && win.isVisible() && !win.isMinimized())
        if (visibleWindows.length === 0) {
            return
        }

        try {
            // CPU: Pure JS
            const cpuLoad = calculateCpuLoad()
            const currentCpus = os.cpus()
            const cpuCpus = currentCpus.map((cpu, index) => {
                const lastCpu = lastCpus[index]
                if (!lastCpu) return 0
                const lastTotal = Object.values(lastCpu.times).reduce((acc, t) => acc + t, 0)
                const currentTotal = Object.values(cpu.times).reduce((acc, t) => acc + t, 0)
                const total = currentTotal - lastTotal
                const idle = cpu.times.idle - lastCpu.times.idle
                return total === 0 ? 0 : Math.round((1 - idle / total) * 100 * 10) / 10
            })
            lastCpus = currentCpus

            // Memory: Pure JS
            const totalMem = os.totalmem()
            const freeMem = os.freemem()
            const usedMem = totalMem - freeMem

            // Disk: typeperf stream or fallback
            let diskData = { readPerSec: 0, writePerSec: 0, readBytesPerSec: 0, writeBytesPerSec: 0 }
            if (process.platform === 'win32') {
                diskData = {
                    readPerSec: diskIOMetrics.readBytesPerSec,
                    writePerSec: diskIOMetrics.writeBytesPerSec,
                    readBytesPerSec: diskIOMetrics.readBytesPerSec,
                    writeBytesPerSec: diskIOMetrics.writeBytesPerSec,
                }
            } else {
                try {
                    const fs = await getSi().fsStats()
                    if (fs && (fs.rx_sec !== null || fs.wx_sec !== null)) {
                        diskData = {
                            readPerSec: fs.rx_sec || 0, writePerSec: fs.wx_sec || 0,
                            readBytesPerSec: fs.rx_sec || 0, writeBytesPerSec: fs.wx_sec || 0,
                        }
                    } else {
                        const io = await getSi().disksIO()
                        diskData = {
                            readPerSec: io?.rIO_sec || 0, writePerSec: io?.wIO_sec || 0,
                            readBytesPerSec: io?.rIO_sec || 0, writeBytesPerSec: io?.wIO_sec || 0,
                        }
                    }
                } catch {}
            }

            // Network Stats: netstat -e diff
            const netData = await getNetworkStats()

            const stats = {
                cpu: {
                    currentLoad: cpuLoad,
                    cpus: cpuCpus,
                },
                ram: {
                    total: totalMem,
                    used: usedMem,
                    free: freeMem,
                    percent: Math.round((usedMem / totalMem) * 1000) / 10,
                },
                disk: diskData,
                network: netData
            }

            visibleWindows.forEach((win: BrowserWindow) => {
                if (!win.isDestroyed()) {
                    win.webContents.send('system:stats', stats)
                }
            })
        } catch { }
    }, 2000)
}

export function stopSystemStatsPolling() {
    if (systemStatsInterval) {
        clearInterval(systemStatsInterval)
        systemStatsInterval = null
    }
    isPollingSystemStats = false
}
