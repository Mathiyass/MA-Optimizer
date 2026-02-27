import { useEffect, useRef } from 'react'
import { useSystemStore } from '../store/systemStore'

export function useSystemMonitor(enabled = true, interval = 1000) {
    const updateCpu = useSystemStore((s) => s.updateCpu)
    const updateRam = useSystemStore((s) => s.updateRam)
    const updateDisk = useSystemStore((s) => s.updateDisk)
    const updateNetwork = useSystemStore((s) => s.updateNetwork)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        if (!enabled || !window.api) return

        const poll = async () => {
            try {
                const [cpuData, ramData, diskData, netData] = await Promise.all([
                    window.api.system.getCpuUsage(),
                    window.api.system.getRamUsage(),
                    window.api.system.getDiskIO(),
                    window.api.system.getNetworkSpeed(),
                ])
                updateCpu(cpuData.currentLoad, cpuData.cpus)
                updateRam({
                    total: ramData.total,
                    used: ramData.used,
                    free: ramData.free,
                    percent: ramData.usedPercent,
                })
                updateDisk({
                    readPerSec: diskData.readBytesPerSec,
                    writePerSec: diskData.writeBytesPerSec,
                })
                updateNetwork({
                    rxSec: netData.rxSec,
                    txSec: netData.txSec,
                })
            } catch { }
        }

        poll()
        timerRef.current = setInterval(poll, interval)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [enabled, interval])
}
