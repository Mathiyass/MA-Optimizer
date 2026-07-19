import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Zap, RefreshCw, Loader2, MemoryStick, Check } from 'lucide-react'
import { TweakCard } from '../components/ui/TweakCard'
import { TabGroup } from '../components/ui/TabGroup'
import { useTweak } from '../hooks/useTweak'
import { getTweaksByCategoryAndTab, getSafeTweaks } from '../data/tweaks'
import { useAppStore } from '../store/appStore'
import { useLogStore } from '../store/logStore'
import { useSystemStore } from '../store/systemStore'

const tabs = [
    { id: 'visual', label: 'Visual Effects' },
    { id: 'power', label: 'Power' },
    { id: 'cpu', label: 'CPU' },
    { id: 'memory', label: 'Memory' },
    { id: 'storage', label: 'Storage' },
    { id: 'services', label: 'Services' },
]

function TweakRow({ tweakId }: { tweakId: string }) {
    const { enabled, loading, toggle, tweak } = useTweak(tweakId)
    if (!tweak) return null
    return <TweakCard id={tweakId} title={tweak.name} description={tweak.description} risk={tweak.risk} enabled={enabled} onChange={toggle} loading={loading} />
}

interface ServiceRow {
    name: string; displayName: string; status: string; startType: string; recommended?: string
}

const recommendedServices: { name: string; displayName: string; recommended: string; reason: string }[] = [
    { name: 'SysMain', displayName: 'SysMain (Superfetch)', recommended: 'Disable', reason: 'Saves RAM, minor impact' },
    { name: 'WSearch', displayName: 'Windows Search', recommended: 'Disable', reason: 'Saves CPU/disk if unused' },
    { name: 'DiagTrack', displayName: 'Connected User Experiences', recommended: 'Disable', reason: 'Stops telemetry' },
    { name: 'WerSvc', displayName: 'Windows Error Reporting', recommended: 'Disable', reason: 'Error reporting' },
    { name: 'MapsBroker', displayName: 'Downloaded Maps Manager', recommended: 'Disable', reason: 'Unused service' },
    { name: 'RetailDemo', displayName: 'Retail Demo Service', recommended: 'Disable', reason: 'Demo mode service' },
    { name: 'XblGameSave', displayName: 'Xbox Live Game Save', recommended: 'Disable', reason: 'Xbox service' },
    { name: 'XblAuthManager', displayName: 'Xbox Live Auth Manager', recommended: 'Disable', reason: 'Xbox service' },
    { name: 'XboxNetApiSvc', displayName: 'Xbox Live Networking', recommended: 'Disable', reason: 'Xbox service' },
    { name: 'lfsvc', displayName: 'Geolocation Service', recommended: 'Disable', reason: 'Location tracking' },
    { name: 'wisvc', displayName: 'Windows Insider Service', recommended: 'Disable', reason: 'Insider builds' },
    { name: 'PrintSpooler', displayName: 'Print Spooler', recommended: 'Optional', reason: 'Disable if no printer' },
    { name: 'Fax', displayName: 'Fax Service', recommended: 'Disable', reason: 'Legacy fax support' },
    { name: 'RemoteRegistry', displayName: 'Remote Registry', recommended: 'Disable', reason: 'Security risk' },
]

function ServicesTab() {
    const [services, setServices] = useState<ServiceRow[]>([])
    const [loading, setLoading] = useState(false)
    const [filter, setFilter] = useState('')
    const addLog = useLogStore(s => s.addLine)
    const addNotification = useAppStore(s => s.addNotification)

    const refresh = useCallback(async () => {
        if (!window.api) return
        setLoading(true)
        try {
            const list = await window.api.services.list()
            setServices(list || [])
        } catch (e) {
            addLog(`[ERROR] Failed to list services: ${e}`)
        } finally {
            setLoading(false)
        }
    }, [addLog])

    useEffect(() => { refresh() }, [refresh])

    const toggleService = async (name: string, start: boolean) => {
        try {
            if (start) await window.api?.services.start(name)
            else await window.api?.services.stop(name)
            addLog(`[SERVICE] ${start ? 'Started' : 'Stopped'} ${name}`)
            await refresh()
        } catch (e) {
            addLog(`[ERROR] Failed to toggle ${name}: ${e}`)
        }
    }

    const setStartup = async (name: string, mode: string) => {
        try {
            await window.api?.services.setStartup(name, mode)
            addLog(`[SERVICE] Set ${name} startup → ${mode}`)
            await refresh()
        } catch (e) {
            addLog(`[ERROR] Failed to set startup for ${name}: ${e}`)
        }
    }

    const applyAllRecommended = async () => {
        let count = 0
        for (const svc of recommendedServices) {
            if (svc.recommended === 'Disable') {
                try {
                    await window.api?.services.setStartup(svc.name, 'disabled')
                    await window.api?.services.stop(svc.name)
                    count++
                } catch { }
            }
        }
        addNotification('success', `Applied ${count} recommended service changes`)
        await refresh()
    }

    const filtered = services.filter(s =>
        !filter || s.displayName?.toLowerCase().includes(filter.toLowerCase()) || s.name?.toLowerCase().includes(filter.toLowerCase())
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <input
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    placeholder="Filter services..."
                    className="flex-1 px-3 py-2 bg-app-bg border-white/5 rounded-2xl text-sm text-text-primary placeholder:text-text-dim outline-none focus:border-accent-cyan/40 border"
                />
                <button onClick={applyAllRecommended} className="px-4 py-2 bg-accent-cyan/10 border-accent-cyan/30 rounded-2xl text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors border">
                    Apply All Recommended
                </button>
                <button onClick={refresh} className="p-2 border-white/5 rounded-2xl text-text-muted hover:text-text-primary transition-colors border">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Recommended services */}
            <div className="space-y-2">
                <h3 className="text-sm font-semibold text-text-primary">Recommended Service Changes</h3>
                <div className="grid gap-2">
                    {recommendedServices.map(svc => {
                        const live = services.find(s => s.name === svc.name)
                        return (
                            <div key={svc.name} className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-2xl border">
                                <div className="flex-1 min-w-0">
                                    <span className="text-text-primary text-sm font-medium">{svc.displayName}</span>
                                    <span className="text-text-dim text-xs ml-2">({svc.name})</span>
                                    <p className="text-text-muted text-xs">{svc.reason}</p>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${live?.status === 'Running' ? 'bg-success/15 text-success' : 'bg-card-border text-text-dim'
                                    }`}>
                                    {live?.status || 'Unknown'}
                                </span>
                                <span className={`text-xs font-medium ${svc.recommended === 'Disable' ? 'text-warning' : 'text-text-muted'}`}>
                                    {svc.recommended}
                                </span>
                                {live && (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => toggleService(svc.name, live.status !== 'Running')}
                                            className="px-2 py-1 text-xs border-white/5 rounded-2xl text-text-muted hover:text-text-primary transition-colors border"
                                        >
                                            {live.status === 'Running' ? 'Stop' : 'Start'}
                                        </button>
                                        <select
                                            value={live.startType?.toLowerCase() || 'automatic'}
                                            onChange={e => setStartup(svc.name, e.target.value)}
                                            className="px-2 py-1 text-xs bg-app-bg border-white/5 rounded-2xl text-text-muted outline-none border"
                                        >
                                            <option value="automatic">Auto</option>
                                            <option value="manual">Manual</option>
                                            <option value="disabled">Disabled</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Full service list */}
            {filtered.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-text-primary">All Services ({filtered.length})</h3>
                    <div className="max-h-96 overflow-y-auto space-y-1">
                        {filtered.slice(0, 50).map(svc => (
                            <div key={svc.name} className="flex items-center gap-3 px-3 py-2 bg-[rgba(255,255,255,0.01)] backdrop-blur-xl border-white/5 rounded-2xl text-xs border">
                                <span className="text-text-primary font-medium flex-1 truncate">{svc.displayName || svc.name}</span>
                                <span className={`px-1.5 py-0.5 rounded-2xl ${svc.status === 'Running' ? 'bg-success/10 text-success' : 'bg-card-border/50 text-text-dim'}`}>
                                    {svc.status}
                                </span>
                                <span className="text-text-dim w-16 text-right">{svc.startType}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {loading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-accent-cyan" /></div>}
        </div>
    )
}

function formatGb(bytes: number) {
    if (!bytes) return '0.0 GB'
    return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB'
}

function MemoryOptimizerPanel() {
    const ram = useSystemStore(s => s.ram)
    const [cleaning, setCleaning] = useState(false)
    const addLog = useLogStore(s => s.addLine)
    const addNotification = useAppStore(s => s.addNotification)

    const cleanRam = async () => {
        setCleaning(true)
        addLog('[Memory] Initializing RAM Cache Optimization...')
        try {
            const success = await window.api?.system.cleanRam()
            if (success) {
                addNotification('success', 'RAM cache optimization complete!')
                addLog('[Memory] RAM working sets and standby list released')
            } else {
                addNotification('error', 'Failed to optimize RAM cache')
            }
        } catch (e: any) {
            addLog(`[ERROR] RAM optimization failed: ${e.message}`)
        } finally {
            setCleaning(false)
        }
    }

    const percent = ram.percent || 0

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 w-full space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white text-lg font-black tracking-wide flex items-center gap-2">
                            <MemoryStick className="w-5 h-5 text-[var(--accent-cyan)]" /> Real-time RAM Optimizer
                        </h3>
                        <p className="text-[var(--text-muted)] text-xs mt-1 font-medium">Reclaim standby cache and working sets from inactive applications.</p>
                    </div>
                    <span className="text-white text-sm font-mono font-bold">{formatGb(ram.used)} / {formatGb(ram.total)} ({percent}%)</span>
                </div>
                
                <div className="w-full h-3 bg-black/40 border border-white/5 rounded-full overflow-hidden relative">
                    <motion.div 
                        className="h-full bg-gradient-to-r from-[var(--accent-cyan)] to-[#00FFDE]/50 shadow-[0_0_15px_rgba(0,255,222,0.4)]"
                        style={{ width: `${percent}%` }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>
            </div>

            <button
                onClick={cleanRam}
                disabled={cleaning}
                className="px-8 py-4 bg-[var(--accent-cyan)] border-[var(--accent-cyan)]/50 rounded-2xl text-black text-xs font-black tracking-widest uppercase hover:bg-[#00e6c8] transition-all disabled:opacity-40 disabled:cursor-not-allowed w-full md:w-auto shadow-[0_0_20px_rgba(0,255,222,0.3)] whitespace-nowrap border flex items-center justify-center gap-2 cursor-pointer"
            >
                {cleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {cleaning ? 'Releasing...' : 'Release RAM Cache'}
            </button>
        </div>
    )
}

export function Performance() {
    const [tab, setTab] = useState('visual')
    const items = getTweaksByCategoryAndTab('performance', tab)
    const addNotification = useAppStore(s => s.addNotification)
    const [optimizing, setOptimizing] = useState(false)
    const [optProgress, setOptProgress] = useState(0)
    const [optCurrent, setOptCurrent] = useState('')

    const applyAllSafe = async () => {
        const safeTweaks = getSafeTweaks().filter(t => t.category === 'performance')
        if (!safeTweaks.length) return
        setOptimizing(true)
        setOptProgress(0)
        let count = 0
        for (let i = 0; i < safeTweaks.length; i++) {
            const tweak = safeTweaks[i]
            setOptCurrent(tweak.name)
            try {
                await window.api?.registry.set(tweak.hive, tweak.path, tweak.key, tweak.applyValue, tweak.regType)
                count++
            } catch { }
            setOptProgress(Math.round(((i + 1) / safeTweaks.length) * 100))
            await new Promise(r => setTimeout(r, 150)) // Animation delay
        }
        setTimeout(() => {
            setOptimizing(false)
            addNotification('success', `Applied ${count} safe performance tweaks`)
        }, 500)
    }

    return (
        <div className="space-y-8 max-w-[90rem] mx-auto w-full pb-10">
            {/* Ultra-Premium Performance Hero Section */}
            <motion.div
                className="relative overflow-hidden rounded-[2.5rem] p-12 transition-all duration-700 border bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[var(--accent-cyan)]/20 animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[#00FFDE]/20 animate-pulse" style={{ animationDuration: '6s' }}></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center md:text-left">
                        <motion.h2 className="text-5xl lg:text-6xl font-black mb-4 tracking-tight text-white flex items-center justify-center md:justify-start gap-4">
                            <Zap className="w-12 h-12 text-[var(--accent-cyan)] drop-shadow-[0_0_15px_rgba(0,255,222,0.8)]" />
                            Performance
                        </motion.h2>
                        <p className="text-[var(--text-muted)] text-sm uppercase tracking-[0.3em] font-black mb-8">
                            System Wide Optimization
                        </p>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <p className="text-[var(--text-secondary)] max-w-xl font-medium leading-relaxed">
                                Finely tune your system's underlying behavior. Manage services, visual effects, and hardware scheduling to achieve the perfect balance of latency and throughput.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-center">
                        <button
                            onClick={applyAllSafe}
                            disabled={optimizing}
                            className="group relative px-8 py-5 rounded-2xl bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 hover:border-[var(--accent-cyan)]/50 hover:bg-[rgba(0,255,222,0.1)] transition-all duration-500 overflow-hidden shadow-xl border"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-cyan)]/0 via-[var(--accent-cyan)]/10 to-[var(--accent-cyan)]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                            <span className="relative z-10 font-black tracking-widest uppercase text-sm flex items-center gap-3 text-white group-hover:text-[var(--accent-cyan)] transition-colors">
                                {optimizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                {optimizing ? 'Optimizing...' : 'Apply Safe Tweaks'}
                            </span>
                        </button>
                    </div>
                </div>
            </motion.div>

            <div className="mt-8">
                <TabGroup tabs={tabs} active={tab} onChange={setTab} />
            </div>

            {tab === 'services' ? (
                <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-[2.5rem] p-8 transition-all hover:bg-[rgba(255,255,255,0.05)] hover:border-white/10 mt-6 border">
                    <ServicesTab />
                </div>
            ) : tab === 'memory' ? (
                <div className="space-y-6 mt-6">
                    <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-[2.5rem] p-8 transition-all hover:bg-[rgba(255,255,255,0.05)] hover:border-white/10 border">
                        <MemoryOptimizerPanel />
                    </div>
                    <div className="grid gap-4">
                        {items.map(t => <TweakRow key={t.id} tweakId={t.id} />)}
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 mt-6">
                    {items.map(t => <TweakRow key={t.id} tweakId={t.id} />)}
                    {items.length === 0 && <div className="text-[var(--text-muted)] text-center py-12 font-bold tracking-widest uppercase">No tweaks in this category</div>}
                </div>
            )}

            {optimizing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,12,20,0.85)] backdrop-blur-3xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-[var(--accent-cyan)]/30 rounded-[2.5rem] p-10 w-[500px] shadow-[0_0_50px_rgba(0,255,222,0.15)] relative overflow-hidden border"
                    >
                        {/* Scanning beam effect */}
                        <motion.div 
                            className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--accent-cyan)]/10 to-transparent h-[200%]"
                            animate={{ top: ['-100%', '100%'] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        />

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8 justify-center">
                                <Loader2 className="w-10 h-10 text-[var(--accent-cyan)] animate-spin drop-shadow-[0_0_15px_rgba(0,255,222,0.8)]" />
                                <h3 className="text-2xl font-black text-white tracking-wide">Optimizing...</h3>
                            </div>
                            
                            <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-2xl p-4 mb-6 border">
                                <p className="text-[var(--accent-cyan)] font-mono text-xs mb-1 uppercase tracking-widest">Executing Payload</p>
                                <p className="text-white text-sm truncate font-medium">{optCurrent}</p>
                            </div>

                            <div className="w-full h-3 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-full overflow-hidden shadow-inner border">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-[var(--accent-cyan)] to-[#00FFDE]/50 shadow-[0_0_15px_rgba(0,255,222,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${optProgress}%` }}
                                    transition={{ duration: 0.2 }}
                                />
                            </div>
                            <div className="text-right text-[var(--accent-cyan)] font-black text-xs mt-3 tracking-widest">{optProgress}% COMPLETE</div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
