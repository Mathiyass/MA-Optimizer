import { useEffect } from 'react'
import { useSystemStore } from '../store/systemStore'

export function useSystemMonitor(enabled = true) {
    const updateCpu = useSystemStore((s) => s.updateCpu)
    const updateRam = useSystemStore((s) => s.updateRam)
    const updateDisk = useSystemStore((s) => s.updateDisk)
    const updateNetwork = useSystemStore((s) => s.updateNetwork)

    useEffect(() => {
        // Listen to IPC pushed stats instead of polling independently on renderer
        if (!enabled || !window.api?.onSystemStats) return

        const unsubscribe = window.api.onSystemStats((stats: any) => {
            updateCpu(stats.cpu.currentLoad, stats.cpu.cpus)
            updateRam(stats.ram)
            updateDisk(stats.disk)
            updateNetwork(stats.network)
        })

        return () => {
            if (unsubscribe) unsubscribe()
        }
    }, [enabled])
}
