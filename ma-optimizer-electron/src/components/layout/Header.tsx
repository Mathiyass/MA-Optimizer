import React, { useState, useEffect } from 'react'
import { Minus, Square, X, Search, Undo2, UserCog, Shield, Loader, Check, AlertTriangle, Minimize2, Activity, Gamepad2, Sparkles } from 'lucide-react'
import { useAppStore } from '../../store/appStore'

export function Header() {
    const [isMaximized, setIsMaximized] = useState(false)
    const [activity, setActivity] = useState<{ activeGame: string | null; isGaming: boolean }>({ activeGame: null, isGaming: false })
    const isAdmin = useAppStore((s) => s.isAdmin)
    const toggleSurfaceMode = useAppStore((s) => s.toggleSurfaceMode)
    const setSearchOpen = useAppStore((s) => s.setSearchOpen)
    const setProfilesOpen = useAppStore((s) => s.setProfilesOpen)
    const isAiDrawerOpen = useAppStore((s) => s.isAiDrawerOpen)
    const toggleAiDrawer = useAppStore((s) => s.toggleAiDrawer)
    const [restoreStatus, setRestoreStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

    useEffect(() => {
        if (window.api?.onActivityState) {
            const unsubscribe = window.api.onActivityState((state) => {
                setActivity(state)
            })
            return () => unsubscribe()
        }
    }, [])

    useEffect(() => {
        const check = async () => {
            if (window.api) {
                setIsMaximized(await window.api.window.isMaximized())
            }
        }
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    const handleUndo = async () => {
        if (!window.api) return
        const result = await window.api.backup.undoLast()
        if (result.success) {
            useAppStore.getState().addNotification('success', `Reverted: ${result.key}`)
        } else {
            useAppStore.getState().addNotification('warning', result.error || 'Nothing to undo')
        }
    }

    const handleRestorePoint = async () => {
        if (restoreStatus === 'loading' || !window.api) return
        setRestoreStatus('loading')
        try {
            const res = await window.api.createRestorePoint()
            if (res.success) {
                setRestoreStatus('success')
                useAppStore.getState().addNotification('success', 'Restore point created successfully.')
                setTimeout(() => setRestoreStatus('idle'), 4000)
            } else {
                setRestoreStatus('error')
                useAppStore.getState().addNotification('error', 'Failed to create restore point.')
                setTimeout(() => setRestoreStatus('idle'), 4000)
            }
        } catch (e: any) {
            setRestoreStatus('error')
            useAppStore.getState().addNotification('error', 'Error: ' + e.message)
            setTimeout(() => setRestoreStatus('idle'), 4000)
        }
    }

    return (
        <header className="h-16 glass-shell flex items-center shrink-0 select-none z-20 relative overflow-hidden" style={{ WebkitAppRegion: 'drag' } as any}>
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-[var(--accent-cyan)]/5 to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[var(--accent-violet)]/5 to-transparent pointer-events-none" />

            {/* Left section */}
            <div className="flex items-center gap-2 pl-6 relative z-10" style={{ WebkitAppRegion: 'no-drag' } as any}>
                {/* Admin badge */}
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-2xl text-[10px] font-black tracking-widest uppercase border transition-all ${isAdmin ? 'bg-[rgba(0,255,222,0.1)] border-[#00FFDE]/40 text-[#00FFDE] shadow-[0_0_15px_rgba(0,255,222,0.2)]' : 'bg-[rgba(255,0,60,0.1)] border-[#FF003C]/40 text-[#FF003C] shadow-[0_0_15px_rgba(255,0,60,0.2)]'
                    }`}>
                    <UserCog className="w-4 h-4" />
                    {isAdmin ? 'Admin Privileges Active' : 'Standard Mode'}
                </div>

                {/* Live Activity & Game Badge */}
                {activity.isGaming && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <Gamepad2 className="w-3.5 h-3.5 animate-pulse" />
                        <span>Game: {activity.activeGame || 'Active'}</span>
                    </div>
                )}
            </div>

            {/* Center - draggable */}
            <div className="flex-1" />

            {/* Right section */}
            <div className="flex items-center gap-2 pr-2 relative z-10" style={{ WebkitAppRegion: 'no-drag' } as any}>

                {/* 🛡️ Create Restore Point Button */}
                <button
                    onClick={handleRestorePoint}
                    disabled={restoreStatus === 'loading'}
                    className={`flex items-center gap-2 px-5 py-2 rounded-2xl transition-all text-[10px] font-black tracking-widest uppercase mr-3
                        ${restoreStatus === 'idle' ? 'border border-[var(--accent-cyan)]/50 text-[var(--accent-cyan)] bg-[rgba(0,255,222,0.05)] hover:bg-[rgba(0,255,222,0.15)] hover:shadow-[0_0_20px_rgba(0,255,222,0.3)] hover:border-[var(--accent-cyan)]' : ''}
                        ${restoreStatus === 'loading' ? 'border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] bg-[rgba(0,255,222,0.05)] opacity-80' : ''}
                        ${restoreStatus === 'success' ? 'border border-[var(--accent-cyan)] text-black bg-[var(--accent-cyan)] shadow-[0_0_20px_rgba(0,255,222,0.4)]' : ''}
                        ${restoreStatus === 'error' ? 'border border-[#FF003C] text-white bg-[#FF003C] shadow-[0_0_20px_rgba(255,0,60,0.4)]' : ''}
                    `}
                >
                    {restoreStatus === 'idle' && <><span>🛡️ Restore Point</span></>}
                    {restoreStatus === 'loading' && <><Loader className="w-4 h-4 animate-spin" /> <span>Creating...</span></>}
                    {restoreStatus === 'success' && <><span>✓ Created</span></>}
                    {restoreStatus === 'error' && <><span>✕ Failed</span></>}
                </button>

                {/* 🤖 Global AI Copilot Sidecar Drawer Toggle */}
                <button
                    onClick={() => toggleAiDrawer()}
                    title="Toggle AI Copilot Drawer (Ctrl+Space)"
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all text-[11px] font-black tracking-widest uppercase mr-2 border group ${
                        isAiDrawerOpen
                            ? 'bg-[var(--accent-cyan)] text-black border-[var(--accent-cyan)] shadow-[0_0_20px_rgba(0,255,222,0.4)]'
                            : 'bg-gradient-to-r from-[rgba(0,255,222,0.12)] to-[rgba(168,85,247,0.12)] border-[var(--accent-cyan)]/40 text-white hover:border-[var(--accent-cyan)] hover:shadow-[0_0_20px_rgba(0,255,222,0.25)]'
                    }`}
                >
                    <Sparkles className={`w-4 h-4 transition-transform group-hover:scale-110 ${isAiDrawerOpen ? 'text-black' : 'text-[var(--accent-cyan)] animate-pulse'}`} />
                    <span>AI Copilot</span>
                    <kbd className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest font-mono ${
                        isAiDrawerOpen ? 'bg-black/20 text-black font-bold' : 'bg-black/50 border border-white/10 text-[var(--accent-cyan)] shadow-inner'
                    }`}>Ctrl+Space</kbd>
                </button>

                {/* Search */}
                <button
                    onClick={() => setSearchOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-[var(--text-secondary)] hover:text-white hover:bg-white/10 rounded-2xl transition-all text-[11px] font-black tracking-widest uppercase border border-transparent hover:border-white/10 group"
                >
                    <Search className="w-4 h-4 group-hover:text-[var(--accent-cyan)] transition-colors" />
                    <span>Search</span>
                    <kbd className="ml-1 px-2 py-0.5 bg-black/60 border border-white/10 rounded-2xl text-[9px] uppercase tracking-widest text-[var(--accent-cyan)] shadow-inner">Ctrl+K</kbd>
                </button>

                {/* Profiles */}
                <button
                    onClick={() => setProfilesOpen(true)}
                    className="px-4 py-2 text-[var(--text-secondary)] hover:text-white hover:bg-white/10 rounded-2xl transition-all text-[11px] font-black tracking-widest uppercase border border-transparent hover:border-white/10 mx-1"
                >
                    Profiles
                </button>

                {/* Undo */}
                <button
                    onClick={handleUndo}
                    title="Undo last change (Ctrl+Z)"
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[rgba(0,255,222,0.1)] rounded-2xl transition-all mx-1 group"
                >
                    <Undo2 className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_rgba(0,255,222,0.5)] transition-all" />
                </button>

                <div className="w-px h-8 bg-white/10 mx-3" />

                {/* Compact HUD Toggle (N.E.K.O Style Overlay) */}
                <button
                    onClick={() => toggleSurfaceMode()}
                    title="Switch to Compact Gaming HUD (Ctrl+M)"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/5 hover:bg-accent-cyan/15 text-text-muted hover:text-accent-cyan border border-white/10 hover:border-accent-cyan/30 text-[10px] font-black uppercase tracking-wider transition-all mr-1"
                >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>HUD Mode</span>
                </button>

                {/* Window controls */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => window.api?.window.minimize()}
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => window.api?.window.maximize()}
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <Square className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => window.api?.window.close()}
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-[var(--text-secondary)] hover:bg-[#FF003C] hover:text-white hover:shadow-[0_0_15px_rgba(255,0,60,0.5)] transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
    )
}
