import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import { useLogStore } from '../store/logStore'
import { useSettingsStore } from '../store/settingsStore'
import { tweaks, TweakDefinition } from '../data/tweaks'

export function useTweak(tweakId: string) {
    const tweak = tweaks.find((t) => t.id === tweakId) as TweakDefinition
    const [enabled, setEnabled] = useState<boolean | null>(null)
    const [loading, setLoading] = useState(false)
    const showConfirm = useAppStore((s) => s.showConfirm)
    const addNotification = useAppStore((s) => s.addNotification)
    const addLog = useLogStore((s) => s.addLine)
    const backupTweak = useSettingsStore((s) => s.backupTweak)
    const setTweakApplied = useSettingsStore((s) => s.setTweakApplied)

    // Read current registry state on mount
    useEffect(() => {
        if (!tweak || !window.api) return
        const read = async () => {
            try {
                const val = await window.api.registry.get(tweak.hive, tweak.path, tweak.key)
                const isApplied = val !== null && val !== undefined
                    ? String(val) === String(tweak.applyValue)
                    : false
                setEnabled(isApplied)
                setTweakApplied(tweakId, isApplied)
            } catch {
                setEnabled(false)
            }
        }
        read()
    }, [tweakId])

    const toggle = useCallback(async (newVal: boolean) => {
        if (!tweak) return

        // Aggressive tweak confirmation
        if (newVal && tweak.risk === 'aggressive') {
            const ok = await showConfirm({
                title: `⚠️ Aggressive Tweak: ${tweak.name}`,
                message: tweak.warningText || `This tweak modifies ${tweak.hive}\\${tweak.path}\\${tweak.key} and may cause system instability.`,
                requireCheckbox: true,
                checkboxLabel: 'I understand the risks and accept responsibility',
            })
            if (!ok) return
        }

        setLoading(true)
        try {
            // Backup original value before first change
            const current = await window.api.registry.get(tweak.hive, tweak.path, tweak.key)
            backupTweak(tweakId, current)

            const value = newVal ? tweak.applyValue : tweak.revertValue
            const success = await window.api.registry.set(
                tweak.hive, tweak.path, tweak.key, value, tweak.regType
            )

            if (success) {
                setEnabled(newVal)
                setTweakApplied(tweakId, newVal)
                addLog(`[${newVal ? 'APPLY' : 'REVERT'}] ${tweak.name} → ${value}`)
                addNotification('success', `${newVal ? 'Applied' : 'Reverted'}: ${tweak.name}`)

                // Handle service actions
                if (tweak.serviceAction) {
                    const mode = newVal ? tweak.serviceAction.applyMode : tweak.serviceAction.revertMode
                    if (newVal && mode === 'disabled') {
                        await window.api.services.stop(tweak.serviceAction.serviceName).catch(() => { })
                    }
                    await window.api.services.setStartup(tweak.serviceAction.serviceName, mode).catch(() => { })
                }
            } else {
                addNotification('error', `Failed to apply: ${tweak.name}`)
                addLog(`[ERROR] Failed to toggle ${tweak.name}`)
            }
        } catch (e) {
            addLog(`[ERROR] Failed to toggle ${tweak.name}: ${e}`)
            addNotification('error', `Error: ${tweak.name}`)
        } finally {
            setLoading(false)
        }
    }, [tweak, tweakId])

    return { enabled, loading, toggle, tweak }
}
