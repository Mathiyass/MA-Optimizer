import React, { useState, useEffect } from 'react'
import { Minus, Square, X, Search, Undo2, UserCog, Shield, Loader, Check, AlertTriangle } from 'lucide-react'
import { useAppStore } from '../../store/appStore'

export function Header() {
    const [isMaximized, setIsMaximized] = useState(false)
    const isAdmin = useAppStore((s) => s.isAdmin)
    const setSearchOpen = useAppStore((s) => s.setSearchOpen)
    const setProfilesOpen = useAppStore((s) => s.setProfilesOpen)
    const [restoreStatus, setRestoreStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

    useEffect(() => {
        const check = async () => {
            if (window.api) {
                setIsMaximized(await window.api.window.isMaximized())
            }
        }
        check()
        const interval = setInterval(check, 1000)
        return () => clearInterval(interval)
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
        <header className="h-12 glass-panel flex items-center shrink-0 select-none z-20" style={{ WebkitAppRegion: 'drag' } as any}>
            {/* Left section */}
            <div className="flex items-center gap-2 pl-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
                {/* Admin badge */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border ${isAdmin ? 'bg-success/10 border-success/20 text-success shadow-[0_0_10px_rgba(0,255,136,0.1)]' : 'bg-danger/10 border-danger/20 text-danger shadow-[0_0_10px_rgba(255,68,68,0.1)]'
                    }`}>
                    <UserCog className="w-3 h-3" />
                    {isAdmin ? 'Admin Mode' : 'Standard User'}
                </div>
            </div>

            {/* Center - draggable */}
            <div className="flex-1" />

            {/* Right section */}
            <div className="flex items-center gap-1 pr-1" style={{ WebkitAppRegion: 'no-drag' } as any}>

                {/* 🛡️ Create Restore Point Button */}
                <button
                    onClick={handleRestorePoint}
                    disabled={restoreStatus === 'loading'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-xs font-semibold mr-2
                        ${restoreStatus === 'idle' ? 'border border-[var(--accent-cyan)] text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10 hover:shadow-[var(--glow-cyan)]' : ''}
                        ${restoreStatus === 'loading' ? 'border border-[var(--accent-cyan)] text-[var(--accent-cyan)] opacity-80' : ''}
                        ${restoreStatus === 'success' ? 'border border-[var(--accent-cyan)] text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10 shadow-[var(--glow-cyan)]' : ''}
                        ${restoreStatus === 'error' ? 'border border-[var(--accent-red)] text-[var(--accent-red)] bg-[var(--accent-red)]/10 shadow-[var(--glow-red)]' : ''}
                    `}
                >
                    {restoreStatus === 'idle' && <><span>🛡️ Create Restore Point</span></>}
                    {restoreStatus === 'loading' && <><Loader className="w-3.5 h-3.5 animate-spin" /> <span>Creating...</span></>}
                    {restoreStatus === 'success' && <><span>✓ Restore Point Created</span></>}
                    {restoreStatus === 'error' && <><span>✕ Failed</span></>}
                </button>

                {/* Search */}
                <button
                    onClick={() => setSearchOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-text-dim hover:text-[var(--text-primary)] hover:bg-white/5 rounded transition-all text-xs"
                >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                    <kbd className="ml-1 px-1.5 py-0.5 bg-card-bg border border-card-border rounded text-[10px]">Ctrl+K</kbd>
                </button>

                {/* Profiles */}
                <button
                    onClick={() => setProfilesOpen(true)}
                    className="px-3 py-1.5 text-text-dim hover:text-[var(--text-primary)] hover:bg-white/5 rounded transition-all text-xs"
                >
                    Profiles
                </button>

                {/* Undo */}
                <button
                    onClick={handleUndo}
                    title="Undo last change (Ctrl+Z)"
                    className="p-2 text-text-dim hover:text-[var(--text-primary)] hover:bg-white/5 rounded transition-all"
                >
                    <Undo2 className="w-4 h-4" />
                </button>

                {/* Window controls */}
                <div className="flex items-center ml-2">
                    <button
                        onClick={() => window.api?.window.minimize()}
                        className="w-11 h-8 flex items-center justify-center text-text-muted hover:bg-white/10 transition-colors"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => window.api?.window.maximize()}
                        className="w-11 h-8 flex items-center justify-center text-text-muted hover:bg-white/10 transition-colors"
                    >
                        <Square className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => window.api?.window.close()}
                        className="w-11 h-8 flex items-center justify-center text-text-muted hover:bg-[var(--accent-red)] hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
    )
}
