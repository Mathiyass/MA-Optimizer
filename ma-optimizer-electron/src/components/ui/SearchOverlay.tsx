import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { tweaks } from '../../data/tweaks'
import { RiskBadge } from './RiskBadge'

export function SearchOverlay() {
    const open = useAppStore(s => s.searchOpen)
    const setOpen = useAppStore(s => s.setSearchOpen)
    const setPage = useAppStore(s => s.setPage)
    const [query, setQuery] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open) {
            setQuery('')
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [open])

    const results = useMemo(() => {
        if (!query.trim()) return []
        const q = query.toLowerCase()
        return tweaks
            .filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.id.includes(q))
            .slice(0, 12)
    }, [query])

    const pageMap: Record<string, string> = {
        performance: 'performance',
        privacy: 'privacy',
        gaming: 'gaming',
        network: 'network',
        advanced: 'advanced',
    }

    const navigateTo = (category: string) => {
        const page = (pageMap[category] || 'dashboard') as import('../../store/appStore').PageId
        setPage(page)
        setOpen(false)
    }

    if (!open) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
                onClick={() => setOpen(false)}
            >
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="w-full max-w-xl bg-card-bg border border-card-border rounded-2xl shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-card-border">
                        <Search className="w-5 h-5 text-accent-cyan" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search tweaks... (Ctrl+K)"
                            className="flex-1 bg-transparent text-text-primary text-sm outline-none placeholder:text-text-dim"
                        />
                        <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {results.length > 0 && (
                        <div className="max-h-80 overflow-y-auto p-2">
                            {results.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => navigateTo(t.category)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-text-primary text-sm font-medium">{t.name}</span>
                                            <RiskBadge risk={t.risk} />
                                        </div>
                                        <p className="text-text-muted text-xs truncate">{t.description}</p>
                                    </div>
                                    <span className="text-text-dim text-xs capitalize shrink-0">{t.category}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {query.trim() && results.length === 0 && (
                        <div className="p-8 text-center text-text-dim text-sm">No tweaks found for "{query}"</div>
                    )}

                    {!query.trim() && (
                        <div className="p-6 text-center text-text-dim text-xs">
                            Type to search across all {tweaks.length} tweaks
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
