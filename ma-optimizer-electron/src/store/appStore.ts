import { create } from 'zustand'

export type PageId =
    | 'dashboard' | 'performance' | 'process-lasso' | 'hone' | 'exitlag' | 'ma-power' | 'network' | 'privacy'
    | 'gaming' | 'cleaner' | 'startup' | 'apps' | 'tools'
    | 'repair' | 'advanced' | 'benchmark' | 'about' | 'drivers' | 'ai-advisor'

interface Notification {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    timestamp: number
}

interface ConfirmState {
    open: boolean
    title: string
    message: string
    requireCheckbox: boolean
    checkboxLabel: string
    onConfirm: (() => void) | null
    onCancel: (() => void) | null
}

interface ProgressState {
    open: boolean
    title: string
    message: string
    progress: number // keep for compatibility
    downloadProgress: number
    installProgress: number
    stage: 'download' | 'install' | 'idle'
}

interface AppStore {
    // Navigation
    currentPage: PageId
    setPage: (page: PageId) => void

    // Admin
    isAdmin: boolean
    setIsAdmin: (val: boolean) => void

    // Notifications (toast)
    notifications: Notification[]
    addNotification: (type: Notification['type'], message: string) => void
    removeNotification: (id: string) => void

    // Confirmation dialog
    confirm: ConfirmState
    showConfirm: (opts: {
        title: string
        message: string
        requireCheckbox?: boolean
        checkboxLabel?: string
    }) => Promise<boolean>
    closeConfirm: () => void

    // Progress modal
    progress: ProgressState
    showProgress: (title: string, message: string) => void
    updateProgress: (progress: number, message?: string, stage?: 'download' | 'install') => void
    closeProgress: () => void

    // Search overlay
    searchOpen: boolean
    setSearchOpen: (val: boolean) => void

    // Profile selector
    profilesOpen: boolean
    setProfilesOpen: (val: boolean) => void

    // Surface Mode (Full vs Compact Mini-HUD)
    surfaceMode: 'full' | 'compact'
    setSurfaceMode: (mode: 'full' | 'compact') => void
    toggleSurfaceMode: () => Promise<void>

    // Global AI Copilot Sidecar Drawer
    isAiDrawerOpen: boolean
    setAiDrawerOpen: (val: boolean) => void
    toggleAiDrawer: () => void

    // Log console
    logOpen: boolean
    setLogOpen: (val: boolean) => void
}

let confirmResolve: ((value: boolean) => void) | null = null

export const useAppStore = create<AppStore>((set, get) => ({
    currentPage: 'dashboard',
    setPage: (page) => set({ currentPage: page }),

    isAdmin: false,
    setIsAdmin: (val) => set({ isAdmin: val }),

    notifications: [],
    addNotification: (type, message) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
        set((s) => ({
            notifications: [...s.notifications.slice(-10), { id, type, message, timestamp: Date.now() }],
        }))
        // Auto-dismiss after 4s
        setTimeout(() => {
            set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }))
        }, 4000)
    },
    removeNotification: (id) =>
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

    confirm: {
        open: false,
        title: '',
        message: '',
        requireCheckbox: false,
        checkboxLabel: '',
        onConfirm: null,
        onCancel: null,
    },
    showConfirm: (opts) => {
        return new Promise<boolean>((resolve) => {
            confirmResolve = resolve
            set({
                confirm: {
                    open: true,
                    title: opts.title,
                    message: opts.message,
                    requireCheckbox: opts.requireCheckbox ?? false,
                    checkboxLabel: opts.checkboxLabel ?? 'I understand the risks',
                    onConfirm: () => {
                        confirmResolve?.(true)
                        confirmResolve = null
                        set({
                            confirm: { ...get().confirm, open: false, onConfirm: null, onCancel: null },
                        })
                    },
                    onCancel: () => {
                        confirmResolve?.(false)
                        confirmResolve = null
                        set({
                            confirm: { ...get().confirm, open: false, onConfirm: null, onCancel: null },
                        })
                    },
                },
            })
        })
    },
    closeConfirm: () => {
        confirmResolve?.(false)
        confirmResolve = null
        set((s) => ({ confirm: { ...s.confirm, open: false } }))
    },

    progress: { open: false, title: '', message: '', progress: 0, downloadProgress: 0, installProgress: 0, stage: 'idle' },
    showProgress: (title, message) => set({ progress: { open: true, title, message, progress: 0, downloadProgress: 0, installProgress: 0, stage: 'idle' } }),
    updateProgress: (progress, message, stage) =>
        set((s) => {
            const nextStage = stage || s.progress.stage || (message?.toLowerCase().includes('download') ? 'download' : message?.toLowerCase().includes('install') ? 'install' : 'idle')
            return {
                progress: {
                    ...s.progress,
                    progress,
                    stage: nextStage as any,
                    downloadProgress: nextStage === 'download' ? progress : s.progress.downloadProgress,
                    installProgress: nextStage === 'install' ? progress : s.progress.installProgress,
                    ...(message ? { message } : {}),
                },
            }
        }),
    closeProgress: () => set({ progress: { open: false, title: '', message: '', progress: 0, downloadProgress: 0, installProgress: 0, stage: 'idle' } }),

    searchOpen: false,
    setSearchOpen: (val) => set({ searchOpen: val }),

    profilesOpen: false,
    setProfilesOpen: (val) => set({ profilesOpen: val }),

    surfaceMode: 'full',
    setSurfaceMode: (mode) => set({ surfaceMode: mode }),
    toggleSurfaceMode: async () => {
        const next = get().surfaceMode === 'full' ? 'compact' : 'full'
        if (window.api?.window?.toggleCompactMode) {
            await window.api.window.toggleCompactMode(next === 'compact')
        }
        set({ surfaceMode: next })
    },

    isAiDrawerOpen: false,
    setAiDrawerOpen: (val) => set({ isAiDrawerOpen: val }),
    toggleAiDrawer: () => set((s) => ({ isAiDrawerOpen: !s.isAiDrawerOpen })),

    logOpen: false,
    setLogOpen: (val) => set({ logOpen: val }),
}))
