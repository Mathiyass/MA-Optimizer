import { useState, useEffect, useCallback } from 'react'
import { useLogStore } from '../store/logStore'

interface ServiceInfo {
    name: string
    displayName: string
    status: 'Running' | 'Stopped' | 'Unknown'
    startType: string
}

export function useServices() {
    const [services, setServices] = useState<ServiceInfo[]>([])
    const [loading, setLoading] = useState(false)
    const addLog = useLogStore(s => s.addLine)

    const refresh = useCallback(async () => {
        if (!window.api) return
        setLoading(true)
        try {
            const list = await window.api.services.list()
            setServices(list || [])
        } catch (e) {
            addLog(`[ERROR] Failed to list services: ${e}`)
        } finally {
            setLoading(false)
        }
    }, [addLog])

    useEffect(() => {
        refresh()
    }, [refresh])

    const setStartup = async (name: string, mode: string) => {
        try {
            await window.api?.services.setStartup(name, mode)
            addLog(`[SERVICE] Set ${name} startup to ${mode}`)
            await refresh()
        } catch (e) {
            addLog(`[ERROR] Failed to set startup for ${name}: ${e}`)
        }
    }

    const toggleService = async (name: string, start: boolean) => {
        try {
            if (start) {
                await window.api?.services.start(name)
                addLog(`[SERVICE] Started ${name}`)
            } else {
                await window.api?.services.stop(name)
                addLog(`[SERVICE] Stopped ${name}`)
            }
            await refresh()
        } catch (e) {
            addLog(`[ERROR] Failed to toggle ${name}: ${e}`)
        }
    }

    return { services, loading, refresh, setStartup, toggleService }
}
