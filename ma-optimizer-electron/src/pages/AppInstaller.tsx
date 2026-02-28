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
            const showProgress = useAppStore.getState().showProgress
            const closeProgress = useAppStore.getState().closeProgress

            showProgress(`${next.action === 'uninstall' ? 'Uninstalling' : 'Installing'} ${next.name}`, 'Initializing winget...')

            try {
                if (next.action === 'install' || next.action === 'update') {
                    success = await window.api?.winget.install(next.id)
                } else {
                    success = await window.api?.winget.uninstall(next.id)
                }
            } catch {
                success = false
            }

            closeProgress()
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

    const upgradeAll = async () => {
        const showProgress = useAppStore.getState().showProgress
        const closeProgress = useAppStore.getState().closeProgress
        showProgress('Upgrading Packages', 'Checking for updates...')
        await window.api?.winget.upgradeAll()
        closeProgress()
        addNotification('info', 'Upgraded all packages via winget')
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
                    className="w-full pl-10 pr-10 py-2.5 bg-card-bg border border-card-border rounded-xl text-sm text-text-primary placeholder:text-text-dim outline-none focus:border-[var(--accent-cyan)] focus:shadow-[var(--glow-cyan)] transition-all"
                />
                {searching && <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--accent-cyan)]" />}
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
                        <div>
                            <h3 className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider flex items-center gap-1.5">
                                <Loader2 className="w-3 h-3 animate-spin text-[var(--accent-cyan)]" /> Fetching packages...
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-card-border bg-card-bg animate-shimmer">
                                        <div className="w-4 h-4 rounded bg-white/5 shrink-0"></div>
                                        <div className="w-10 h-10 rounded-lg bg-white/5 shrink-0"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-white/5 rounded w-1/3"></div>
                                            <div className="h-3 bg-white/5 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        if (!isRemote && (window as any).apps_cache_icon?.[id]) {
            setImgSrc((window as any).apps_cache_icon[id]);
            return;
        }

        const fetchNativeIcon = async () => {
            try {
                if (window.api?.winget?.getIcon) {
                    const base64 = await window.api.winget.getIcon(name);
                    if (base64) {
                        setImgSrc(base64);
                        return;
                    }
                }

                // Fallback to domain logo if native extraction fails
                const publisher = id.split('.')[0].toLowerCase();
                const domainMap: Record<string, string> = {
                    google: 'google.com', mozilla: 'mozilla.org', brave: 'brave.com', opera: 'opera.com', vivaldi: 'vivaldi.com',
                    microsoft: 'microsoft.com', github: 'github.com', docker: 'docker.com', postman: 'postman.com',
                    jetbrains: 'jetbrains.com', videolan: 'videolan.org', obsproject: 'obsproject.com',
                    spotify: 'spotify.com', discord: 'discord.com', telegram: 'telegram.org',
                    whatsapp: 'whatsapp.com', slacktechnologies: 'slack.com', zoom: 'zoom.us',
                    bitwarden: 'bitwarden.com', epicgames: 'epicgames.com', valve: 'steampowered.com',
                    gog: 'gog.com', "7zip": "7-zip.org", python: "python.org", openjs: "nodejs.org",
                    oracle: "oracle.com", rustlang: "rust-lang.org", dbeaver: "dbeaver.io",
                    handbrake: "handbrake.fr", audacity: "audacityteam.org", gimp: "gimp.org",
                    kde: "kde.org", dotpdn: "getpaint.net", inkscape: "inkscape.org", qbittorrent: "qbittorrent.org",
                    playnite: "playnite.link", autohotkey: "autohotkey.com", cpuid: "cpuid.com", realix: "hwinfo.com",
                    voidtools: "voidtools.com", sharex: "getsharex.com", rufus: "rufus.ie", windirstat: "windirstat.net",
                    thedocumentfoundation: "libreoffice.org", sumatrapdf: "sumatrapdfreader.org", obsidian: "obsidian.md",
                    notion: "notion.so", keepassxcteam: "keepassxc.org", malwarebytes: "malwarebytes.com",
                    protontechnologies: "protonvpn.com", eloston: "chromium.org", librewolf: "librewolf.net"
                };
                const domain = domainMap[publisher] || `${publisher}.com`;
                setImgSrc(`https://logo.clearbit.com/${domain}`);
            } catch {
                setImgError(true);
            }
        };

        fetchNativeIcon();
    }, [id, name, isRemote]);

    const handleImgError = () => {
        if (imgSrc && imgSrc.includes('clearbit')) {
            const domain = imgSrc.split('/').pop();
            setImgSrc(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
        } else {
            setImgError(true);
        }
    };

    const confirmUninstall = () => {
        if (confirm(`Are you sure you want to uninstall ${name}?`)) {
            onUninstall();
        }
    };

    return (
        <motion.div
            initial={false}
            whileHover={{ y: -1 }}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all group ${selected
                ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/5 shadow-[var(--glow-cyan)]'
                : 'border-card-border bg-card-bg hover:border-white/10 hover:shadow-lg'
                }`}
        >
            <input
                type="checkbox"
                checked={selected}
                onChange={onToggle}
                className="accent-[var(--accent-cyan)] w-4 h-4 shrink-0 cursor-pointer"
            />
            {/* 🔧 FIX: Display App Icon with robust fallback */}
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-deep)] border border-[var(--border)] flex flex-shrink-0 items-center justify-center p-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                {imgSrc && !imgError ? (
                    <img key={imgSrc} src={imgSrc} alt={name} onError={handleImgError} className="w-full h-full object-contain rounded drop-shadow-md" />
                ) : (
                    <Package className="w-6 h-6 text-[var(--accent-cyan)] opacity-70" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-[var(--text-primary)] text-sm font-semibold">{name}</span>
                    {installed && (
                        <span className="text-[10px] border border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] shadow-[var(--glow-cyan)] px-1.5 py-0.5 rounded font-medium">Installed</span>
                    )}
                    {isRemote && (
                        <span className="text-[10px] bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded font-medium">winget</span>
                    )}
                </div>
                <div className="text-text-dim text-xs mt-0.5 flex items-center gap-2">
                    <span className="truncate">{desc}</span>
                    {version && <span className="text-[var(--accent-cyan)] shrink-0 font-mono tracking-widest bg-black/20 rounded px-1">v{version}</span>}
                </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {inQueue ? (
                    <span className="px-2 py-1 text-[10px] text-[var(--accent-cyan)] flex items-center gap-1 bg-[var(--accent-cyan)]/10 rounded-lg shadow-[var(--glow-cyan)]">
                        <Loader2 className="w-3 h-3 animate-spin" /> In queue
                    </span>
                ) : installed ? (
                    <>
                        {/* 🔧 FIX: Enhanced semantic color styling for AppCard action buttons */}
                        <button onClick={onUpdate} title="Update App"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold
                                       border border-[var(--accent-cyan)] text-[var(--accent-cyan)]
                                       hover:bg-[var(--accent-cyan)]/10 hover:shadow-[var(--glow-cyan)] transition-all">
                            <ArrowUpCircle className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Update</span>
                        </button>
                        <button onClick={confirmUninstall} title="Uninstall App"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold
                                       border border-[var(--accent-red)] text-[var(--accent-red)]
                                       hover:bg-[var(--accent-red)]/10 hover:shadow-[var(--glow-red)] transition-all">
                            <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Uninstall</span>
                        </button>
                    </>
                ) : (
                    <button onClick={onInstall} title="Install App"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold
                                   border border-[var(--accent-cyan)] text-[var(--accent-cyan)]
                                   hover:bg-[var(--accent-cyan)]/10 hover:shadow-[var(--glow-cyan)] transition-all">
                        <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Install</span>
                    </button>
                )}
            </div>
        </motion.div>
    )
}
