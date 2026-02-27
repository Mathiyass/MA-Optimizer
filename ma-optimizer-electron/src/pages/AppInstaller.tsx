import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Trash2, Loader2, RefreshCw, Search, Package, CheckCircle2, XCircle, ArrowUpCircle, X, Globe } from 'lucide-react'
import { apps, appCategories } from '../data/apps'
import { useAppStore } from '../store/appStore'
import { useLogStore } from '../store/logStore'

type QueueItem = { id: string; name: string; action: 'install' | 'uninstall' | 'update'; status: 'queued' | 'running' | 'done' | 'error' }
type WingetResult = { name: string; id: string; version: string; source: string }

export function AppInstaller() {
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [installed, setInstalled] = useState<string[]>([])
    const [category, setCategory] = useState('all')
    const [search, setSearch] = useState('')
    const [wingetOk, setWingetOk] = useState(true)
    const [loading, setLoading] = useState(true)
    const [queue, setQueue] = useState<QueueItem[]>([])
    const [processing, setProcessing] = useState(false)
    const [searchResults, setSearchResults] = useState<WingetResult[]>([])
    const [searching, setSearching] = useState(false)
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const addNotification = useAppStore(s => s.addNotification)
    const addLog = useLogStore(s => s.addLine)
    const queueRef = useRef(queue)
    queueRef.current = queue

    // Load initial data
    useEffect(() => {
        const init = async () => {
            const result = await window.api?.winget.isInstalled()
            setWingetOk(result?.installed || false)
            if (result?.installed) {
                const list = await window.api?.winget.listInstalled()
                setInstalled(list || [])
            }
            setLoading(false)
        }
        init()
    }, [])

    const refreshInstalled = useCallback(async () => {
        setLoading(true)
        const list = await window.api?.winget.listInstalled()
        setInstalled(list || [])
        setLoading(false)
    }, [])

    const isInstalled = useCallback((appId: string) => {
        return installed.some(i => i.toLowerCase().includes(appId.split('.').pop()?.toLowerCase() || ''))
    }, [installed])

    const toggle = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    // Live winget search with debounce
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current)

        if (!search.trim() || search.trim().length < 2) {
            setSearchResults([])
            setSearching(false)
            return
        }

        setSearching(true)
        searchTimerRef.current = setTimeout(async () => {
            try {
                const results = await window.api?.winget.search(search.trim())
                setSearchResults(results || [])
            } catch {
                setSearchResults([])
            }
            setSearching(false)
        }, 500) // 500ms debounce

        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
        }
    }, [search])

    // Queue management
    const addToQueue = (id: string, name: string, action: 'install' | 'uninstall' | 'update') => {
        if (queueRef.current.some(q => q.id === id && q.status !== 'done' && q.status !== 'error')) return
        setQueue(prev => [...prev, { id, name, action, status: 'queued' }])
    }

    const removeFromQueue = (id: string) => {
        setQueue(prev => prev.filter(q => !(q.id === id && q.status === 'queued')))
    }

    const clearCompletedQueue = () => {
        setQueue(prev => prev.filter(q => q.status === 'queued' || q.status === 'running'))
    }

    // Process queue
    useEffect(() => {
        if (processing) return
        const next = queue.find(q => q.status === 'queued')
        if (!next) return

        setProcessing(true)
        setQueue(prev => prev.map(q => q.id === next.id && q.status === 'queued' ? { ...q, status: 'running' } : q))

        const run = async () => {
            let success = false
            try {
                if (next.action === 'install' || next.action === 'update') {
                    success = await window.api?.winget.install(next.id)
                } else {
                    success = await window.api?.winget.uninstall(next.id)
                }
            } catch {
                success = false
            }

            setQueue(prev => prev.map(q => q.id === next.id && q.status === 'running' ? { ...q, status: success ? 'done' : 'error' } : q))
            addLog(`[winget] ${next.action} ${next.name}: ${success ? 'success' : 'failed'}`)
            if (success) addNotification('success', `${next.action === 'uninstall' ? 'Uninstalled' : 'Installed'} ${next.name}`)
            else addNotification('error', `Failed to ${next.action} ${next.name}`)
            setProcessing(false)
            const list = await window.api?.winget.listInstalled()
            setInstalled(list || [])
        }
        run()
    }, [queue, processing, addLog, addNotification])

    // Batch install
    const installSelected = () => {
        for (const id of selected) {
            const app = apps.find(a => a.id === id) || searchResults.find(r => r.id === id)
            if (app) addToQueue(id, app.name, 'install')
        }
        setSelected(new Set())
    }

    const upgradeAll = () => {
        window.api?.winget.upgradeAll()
        addNotification('info', 'Upgrading all packages via winget...')
    }

    // Filter local apps
    const filteredLocal = apps.filter(a =>
        (category === 'all' || a.category === category) &&
        (a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase()))
    )

    // Filter search results to exclude apps already in local catalog
    const filteredRemote = searchResults.filter(r =>
        !apps.some(a => a.id.toLowerCase() === r.id.toLowerCase())
    )

    const activeQueue = queue.filter(q => q.status === 'queued' || q.status === 'running')
    const completedQueue = queue.filter(q => q.status === 'done' || q.status === 'error')
    const isSearching = search.trim().length >= 2

    if (!wingetOk && !loading) return (
        <div className="max-w-5xl text-center py-20">
            <Package className="w-16 h-16 text-text-dim mx-auto mb-4" />
            <h2 className="text-xl font-bold text-text-primary mb-2">winget not detected</h2>
            <p className="text-text-muted text-sm mb-4">Install winget from the Microsoft Store to use the App Installer</p>
            <a href="https://aka.ms/getwinget" target="_blank" rel="noreferrer"
                className="px-6 py-2.5 bg-accent-cyan text-white rounded-lg text-sm font-medium inline-block hover:bg-accent-cyan/90 transition-colors">
                Get winget from Microsoft
            </a>
        </div>
    )

    return (
        <div className="space-y-5 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <Package className="w-6 h-6 text-accent-cyan" /> App Installer
                    </h2>
                    <p className="text-text-muted text-sm mt-1">Search & install apps via winget package manager</p>
                </div>
                <div className="flex items-center gap-2">
                    {selected.size > 0 && (
                        <motion.button
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={installSelected}
                            className="px-4 py-2 bg-accent-cyan text-black rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,222,0.2)]"
                        >
                            <Download className="w-4 h-4" />
                            Install {selected.size} Apps
                        </motion.button>
                    )}
                    <button onClick={upgradeAll}
                        className="px-4 py-2 bg-card-bg border border-card-border rounded-lg text-sm text-text-muted hover:text-text-primary transition-all flex items-center gap-1.5">
                        <ArrowUpCircle className="w-3.5 h-3.5" /> Update All
                    </button>
                </div>
            </div>

            {/* Search bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search winget packages..."
                    className="w-full pl-10 pr-10 py-2.5 bg-card-bg border border-card-border rounded-xl text-sm text-text-primary placeholder:text-text-dim outline-none focus:border-accent-cyan/40 transition-colors"
                />
                {searching && <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-accent-cyan" />}
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Category tabs - only show when not searching */}
            {!isSearching && (
                <div className="flex gap-1 bg-card-bg border border-card-border rounded-xl p-1 overflow-x-auto">
                    <button onClick={() => setCategory('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${category === 'all' ? 'bg-accent-cyan/15 text-accent-cyan' : 'text-text-muted hover:text-text-primary'
                            }`}>All</button>
                    {appCategories.map(c => (
                        <button key={c.id} onClick={() => setCategory(c.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${category === c.id ? 'bg-accent-cyan/15 text-accent-cyan' : 'text-text-muted hover:text-text-primary'
                                }`}>{c.label}</button>
                    ))}
                </div>
            )}

            {/* Active install queue */}
            <AnimatePresence>
                {queue.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-3 bg-card-bg border border-accent-cyan/20 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-accent-cyan flex items-center gap-1.5">
                                    <Loader2 className={`w-3 h-3 ${processing ? 'animate-spin' : ''}`} />
                                    Queue ({activeQueue.length} pending)
                                </span>
                                {completedQueue.length > 0 && (
                                    <button onClick={clearCompletedQueue} className="text-text-dim text-[10px] hover:text-text-muted transition-colors">
                                        Clear completed
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {queue.map(q => (
                                    <div key={`${q.id}-${q.action}`} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${q.status === 'running' ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20' :
                                        q.status === 'done' ? 'bg-success/10 text-success border border-success/20' :
                                            q.status === 'error' ? 'bg-danger/10 text-danger border border-danger/20' :
                                                'bg-app-bg text-text-muted border border-card-border'
                                        }`}>
                                        {q.status === 'running' && <Loader2 className="w-3 h-3 animate-spin" />}
                                        {q.status === 'done' && <CheckCircle2 className="w-3 h-3" />}
                                        {q.status === 'error' && <XCircle className="w-3 h-3" />}
                                        <span>{q.name}</span>
                                        <span className="text-text-dim capitalize">({q.action})</span>
                                        {q.status === 'queued' && (
                                            <button onClick={() => removeFromQueue(q.id)} className="hover:text-danger">
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* App grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-accent-cyan" />
                </div>
            ) : (
                <>
                    {/* Local catalog results */}
                    {filteredLocal.length > 0 && (
                        <div>
                            {isSearching && <h3 className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">📦 Curated Apps</h3>}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredLocal.map(app => {
                                    const appInstalled = isInstalled(app.id)
                                    const inQueue = queue.some(q => q.id === app.id && (q.status === 'queued' || q.status === 'running'))
                                    return (
                                        <AppCard
                                            key={app.id}
                                            id={app.id}
                                            name={app.name}
                                            desc={app.desc}
                                            installed={appInstalled}
                                            inQueue={inQueue}
                                            selected={selected.has(app.id)}
                                            onToggle={() => toggle(app.id)}
                                            onInstall={() => addToQueue(app.id, app.name, 'install')}
                                            onUninstall={() => addToQueue(app.id, app.name, 'uninstall')}
                                            onUpdate={() => addToQueue(app.id, app.name, 'update')}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Winget search results */}
                    {isSearching && filteredRemote.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider flex items-center gap-1.5">
                                <Globe className="w-3 h-3" /> Winget Repository ({filteredRemote.length} results)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredRemote.map(r => {
                                    const appInstalled = isInstalled(r.id)
                                    const inQueue = queue.some(q => q.id === r.id && (q.status === 'queued' || q.status === 'running'))
                                    return (
                                        <AppCard
                                            key={r.id}
                                            id={r.id}
                                            name={r.name}
                                            desc={r.id}
                                            version={r.version}
                                            source={r.source}
                                            installed={appInstalled}
                                            inQueue={inQueue}
                                            selected={selected.has(r.id)}
                                            onToggle={() => toggle(r.id)}
                                            onInstall={() => addToQueue(r.id, r.name, 'install')}
                                            onUninstall={() => addToQueue(r.id, r.name, 'uninstall')}
                                            onUpdate={() => addToQueue(r.id, r.name, 'update')}
                                            isRemote
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Searching indicator */}
                    {isSearching && searching && (
                        <div className="flex items-center justify-center gap-2 py-8 text-text-muted text-sm">
                            <Loader2 className="w-5 h-5 animate-spin text-accent-cyan" />
                            Searching winget repository...
                        </div>
                    )}

                    {/* Empty state */}
                    {!searching && filteredLocal.length === 0 && filteredRemote.length === 0 && search.trim() && (
                        <div className="text-center py-12">
                            <Package className="w-12 h-12 text-text-dim mx-auto mb-3" />
                            <p className="text-text-muted text-sm">No apps found for "{search}"</p>
                            <p className="text-text-dim text-xs mt-1">Try a different search term</p>
                        </div>
                    )}
                </>
            )}

            {/* Footer stats */}
            <div className="text-text-dim text-xs text-center pt-2">
                {apps.length} curated apps · {installed.length} installed · Powered by winget
            </div>
        </div>
    )
}

// Extracted app card component
function AppCard({
    id, name, desc, version, source, installed, inQueue, selected, isRemote,
    onToggle, onInstall, onUninstall, onUpdate,
}: {
    id: string; name: string; desc: string; version?: string; source?: string
    installed: boolean; inQueue: boolean; selected: boolean; isRemote?: boolean
    onToggle: () => void; onInstall: () => void; onUninstall: () => void; onUpdate: () => void
}) {
    return (
        <motion.div
            initial={false}
            whileHover={{ y: -1 }}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all group ${selected
                ? 'border-accent-cyan/30 bg-accent-cyan/5'
                : 'border-card-border bg-card-bg hover:border-white/10'
                }`}
        >
            <input
                type="checkbox"
                checked={selected}
                onChange={onToggle}
                className="accent-accent-cyan w-4 h-4 shrink-0 cursor-pointer"
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-text-primary text-sm font-semibold">{name}</span>
                    {installed && (
                        <span className="text-[10px] bg-success/15 text-success px-1.5 py-0.5 rounded font-medium">Installed</span>
                    )}
                    {isRemote && (
                        <span className="text-[10px] bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded font-medium">winget</span>
                    )}
                </div>
                <div className="text-text-dim text-xs mt-0.5 flex items-center gap-2">
                    <span className="truncate">{desc}</span>
                    {version && <span className="text-text-dim/60 shrink-0">v{version}</span>}
                </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {inQueue ? (
                    <span className="px-2 py-1 text-[10px] text-accent-cyan flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> In queue
                    </span>
                ) : installed ? (
                    <>
                        <button onClick={onUpdate} title="Update"
                            className="p-1.5 rounded-lg text-text-dim hover:text-accent-cyan hover:bg-accent-cyan/10 transition-all">
                            <ArrowUpCircle className="w-4 h-4" />
                        </button>
                        <button onClick={onUninstall} title="Uninstall"
                            className="p-1.5 rounded-lg text-text-dim hover:text-danger hover:bg-danger/10 transition-all">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <button onClick={onInstall} title="Install"
                        className="p-1.5 rounded-lg text-text-dim hover:text-accent-cyan hover:bg-accent-cyan/10 transition-all">
                        <Download className="w-4 h-4" />
                    </button>
                )}
            </div>
        </motion.div>
    )
}
