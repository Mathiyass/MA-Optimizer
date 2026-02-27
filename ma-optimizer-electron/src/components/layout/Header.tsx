import React, { useState, useEffect } from 'react'
import { Minus, Square, X, Search, Undo2, UserCog } from 'lucide-react'
import { useAppStore } from '../../store/appStore'

export function Header() {
    const [isMaximized, setIsMaximized] = useState(false)
    const isAdmin = useAppStore((s) => s.isAdmin)
    const setSearchOpen = useAppStore((s) => s.setSearchOpen)
    const setProfilesOpen = useAppStore((s) => s.setProfilesOpen)

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

    return (
        <header className="h-12 bg-header-bg border-b border-card-border flex items-center shrink-0 select-none" style={{ WebkitAppRegion: 'drag' } as any}>
            {/* Left section */}
            <div className="flex items-center gap-2 pl-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
                {/* Admin badge */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold ${isAdmin ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                    }`}>
                    <UserCog className="w-3 h-3" />
                    {isAdmin ? 'Admin' : 'No Admin'}
                </div>
            </div>

            {/* Center - draggable */}
            <div className="flex-1" />

            {/* Right section */}
            <div className="flex items-center gap-1 pr-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
                {/* Search */}
                <button
                    onClick={() => setSearchOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-text-dim hover:text-text-primary hover:bg-white/5 rounded transition-all text-xs"
                >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                    <kbd className="ml-1 px-1.5 py-0.5 bg-card-bg border border-card-border rounded text-[10px]">Ctrl+K</kbd>
                </button>

                {/* Profiles */}
                <button
                    onClick={() => setProfilesOpen(true)}
                    className="px-3 py-1.5 text-text-dim hover:text-text-primary hover:bg-white/5 rounded transition-all text-xs"
                >
                    Profiles
                </button>

                {/* Undo */}
                <button
                    onClick={handleUndo}
                    title="Undo last change (Ctrl+Z)"
                    className="p-2 text-text-dim hover:text-text-primary hover:bg-white/5 rounded transition-all"
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
                        className="w-11 h-8 flex items-center justify-center text-text-muted hover:bg-red-500 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
    )
}
