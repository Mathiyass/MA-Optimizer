import { create } from 'zustand'

interface SettingsStore {
    // Applied tweaks tracking
    appliedTweaks: Record<string, boolean>
    setTweakApplied: (id: string, applied: boolean) => void

    // Cumulative cleaned space
    totalCleaned: number
    addCleaned: (bytes: number) => void

    // Backup store for original tweak values
    tweakBackups: Record<string, any>
    backupTweak: (id: string, originalValue: any) => void

    // Has run before (for welcome modal)
    hasRunBefore: boolean
    setHasRunBefore: (val: boolean) => void

    // Last active page
    lastPage: string
    setLastPage: (page: string) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
    appliedTweaks: {},
    setTweakApplied: (id, applied) =>
        set((s) => ({
            appliedTweaks: { ...s.appliedTweaks, [id]: applied },
        })),

    totalCleaned: 0,
    addCleaned: (bytes) =>
        set((s) => ({ totalCleaned: s.totalCleaned + bytes })),

    tweakBackups: {},
    backupTweak: (id, originalValue) =>
        set((s) => {
            if (id in s.tweakBackups) return s // Don't overwrite
            return { tweakBackups: { ...s.tweakBackups, [id]: originalValue } }
        }),

    hasRunBefore: false,
    setHasRunBefore: (val) => set({ hasRunBefore: val }),

    lastPage: 'dashboard',
    setLastPage: (page) => set({ lastPage: page }),
}))
