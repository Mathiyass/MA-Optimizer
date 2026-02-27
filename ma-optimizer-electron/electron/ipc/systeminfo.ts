import { ipcMain } from 'electron'
import { execSync } from 'child_process'
import { sendLog, sendError } from './logger'

let si: any = null
function getSi() {
    if (!si) si = require('systeminformation')
    return si
}

ipcMain.handle('system:cpuUsage', async () => {
    try {
        const load = await getSi().currentLoad()
        return {
            currentLoad: Math.round(load.currentLoad * 10) / 10,
            cpus: load.cpus?.map((c: any) => Math.round(c.load * 10) / 10) || [],
        }
    } catch { return { currentLoad: 0, cpus: [] } }
})

ipcMain.handle('system:ramUsage', async () => {
    try {
        const mem = await getSi().mem()
        return {
            total: mem.total,
            used: mem.active,
            free: mem.available,
            usedPercent: Math.round((mem.active / mem.total) * 1000) / 10,
            swapTotal: mem.swaptotal,
            swapUsed: mem.swapused,
        }
    } catch { return { total: 0, used: 0, free: 0, usedPercent: 0, swapTotal: 0, swapUsed: 0 } }
})

// Use fsStats for reliable byte-rate data on Windows (disksIO often returns 0)
ipcMain.handle('system:diskIO', async () => {
    try {
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
        execSync(`taskkill /PID ${pid} /F`, { timeout: 5000, windowsHide: true })
        sendLog(`[System] Killed process PID ${pid}`)
        return true
    } catch (e: any) {
        sendError(`Failed to kill process ${pid}: ${e.message}`)
        return false
    }
})

ipcMain.handle('system:setPriority', async (_, pid: number, priority: number) => {
    try {
        const ps = `(Get-Process -Id ${pid}).PriorityClass = ${priority}`
        execSync(`powershell -NonInteractive -NoProfile -Command "${ps}"`, {
            encoding: 'utf-8', timeout: 5000, windowsHide: true,
        })
        sendLog(`[System] Set process ${pid} priority to ${priority}`)
        return true
    } catch (e: any) {
        sendError(`Failed to set priority for ${pid}: ${e.message}`)
        return false
    }
})
