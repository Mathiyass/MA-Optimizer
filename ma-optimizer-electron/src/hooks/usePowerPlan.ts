import { useState, useEffect, useCallback } from 'react'
import { useLogStore } from '../store/logStore'
import { useAppStore } from '../store/appStore'

export function usePowerPlan() {
    const [isActive, setIsActive] = useState(false)
    const [exists, setExists] = useState(false)
    const [loading, setLoading] = useState(false)
    const [activePlan, setActivePlan] = useState<{ guid: string; name: string } | null>(null)
    const [allPlans, setAllPlans] = useState<Array<{ guid: string; name: string; active: boolean }>>([])
    const [currentProfile, setCurrentProfile] = useState<string>('performance')
    const addLog = useLogStore((s) => s.addLine)
    const addNotification = useAppStore((s) => s.addNotification)

    const refresh = useCallback(async () => {
        if (!window.api) return
        try {
            const [active, planExists, current, plans] = await Promise.all([
                window.api.powerPlan.isActive(),
                window.api.powerPlan.exists(),
                window.api.powerPlan.getActive(),
                window.api.powerPlan.listAll(),
            ])
            setIsActive(active)
            setExists(planExists)
            setActivePlan(current)
            setAllPlans(plans)
        } catch { }
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    const activate = useCallback(async () => {
        setLoading(true)
        try {
            await window.api.powerPlan.activate()
            setIsActive(true)
            setExists(true)
            addLog('[MA Power Plan] Activated')
            addNotification('success', 'MA Power Plan activated!')
            await refresh()
        } catch (e) {
            addLog(`[MA Power Plan] Activation failed: ${e}`)
            addNotification('error', 'Failed to activate MA Power Plan')
        } finally {
            setLoading(false)
        }
    }, [refresh])

    const deactivate = useCallback(async () => {
        setLoading(true)
        try {
            await window.api.powerPlan.deactivate()
            setIsActive(false)
            addLog('[MA Power Plan] Deactivated')
            addNotification('info', 'Switched to High Performance plan')
            await refresh()
        } catch (e) {
            addNotification('error', 'Failed to deactivate')
        } finally {
            setLoading(false)
        }
    }, [refresh])

    const applyProfile = useCallback(async (profile: string) => {
        setLoading(true)
        try {
            await window.api.powerPlan.applyProfile(profile)
            setCurrentProfile(profile)
            addNotification('success', `${profile} profile applied`)
            await refresh()
        } catch {
            addNotification('error', 'Failed to apply profile')
        } finally {
            setLoading(false)
        }
    }, [refresh])

    const deletePlan = useCallback(async () => {
        setLoading(true)
        try {
            await window.api.powerPlan.delete()
            setIsActive(false)
            setExists(false)
            addNotification('info', 'MA Power Plan deleted')
            await refresh()
        } catch {
            addNotification('error', 'Failed to delete plan')
        } finally {
            setLoading(false)
        }
    }, [refresh])

    const activateByGuid = useCallback(async (guid: string) => {
        try {
            await window.api.powerPlan.activatePlanByGuid(guid)
            addNotification('success', 'Power plan activated')
            await refresh()
        } catch {
            addNotification('error', 'Failed to activate plan')
        }
    }, [refresh])

    return {
        isActive,
        exists,
        loading,
        activePlan,
        allPlans,
        currentProfile,
        activate,
        deactivate,
        applyProfile,
        deletePlan,
        activateByGuid,
        refresh,
    }
}
