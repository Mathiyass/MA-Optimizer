import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Zap, RefreshCw, Loader2, MemoryStick, Check, Brain, Sparkles, Cpu, AlertTriangle, CheckCircle2 } from 'lucide-react'
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
    const [autoPurge, setAutoPurge] = useState(false)
    const [compression, setCompression] = useState(true)
    const [pageCombining, setPageCombining] = useState(true)
    const [optPagefileLoading, setOptPagefileLoading] = useState(false)
    const addLog = useLogStore(s => s.addLine)
    const addNotification = useAppStore(s => s.addNotification)

    const fetchMemStatus = useCallback(async () => {
        if (!window.api?.memory) return
        try {
            const comp = await window.api.memory.getCompressionStatus()
            if (comp.success) {
                setCompression(comp.compression)
                setPageCombining(comp.pageCombining)
            }
        } catch {}
    }, [])

    useEffect(() => {
        fetchMemStatus()
    }, [fetchMemStatus])

    const purgeStandby = async () => {
        setCleaning(true)
        addLog('[Memory] Executing ISLC Standby List Cache Purge...')
        try {
            const res = await window.api?.memory?.purgeStandbyList()
            if (res?.success) {
                addNotification('success', 'Purged Standby Cache! Frame time consistency restored.')
                addLog(`[Memory] ${res.message}`)
                await fetchMemStatus()
            } else {
                addNotification('error', res?.message || 'Purge failed')
            }
        } catch (e: any) {
            addLog(`[ERROR] Standby purge failed: ${e.message}`)
        } finally {
            setCleaning(false)
        }
    }

    const toggleAutoPurge = async () => {
        const next = !autoPurge
        setAutoPurge(next)
        try {
            await window.api?.memory?.configureAutoPurge(next, 2048, 60)
            addNotification('success', next ? 'Auto Standby Purge (ISLC Mode) enabled' : 'Auto Standby Purge disabled')
        } catch {}
    }

    const toggleComp = async () => {
        const next = !compression
        setCompression(next)
        try {
            const res = await window.api?.memory?.toggleCompression(next)
            addNotification('success', res.message)
        } catch {}
    }

    const togglePageComb = async () => {
        const next = !pageCombining
        setPageCombining(next)
        try {
            const res = await window.api?.memory?.togglePageCombining(next)
            addNotification('success', res.message)
        } catch {}
    }

    const optimizePagefile = async () => {
        setOptPagefileLoading(true)
        try {
            const res = await window.api?.memory?.optimizePagefile()
            if (res.success) {
                addNotification('success', res.message)
            } else {
                addNotification('error', res.message)
            }
        } catch (e: any) {
            addNotification('error', e.message)
        } finally {
            setOptPagefileLoading(false)
        }
    }

    const percent = ram.percent || 0

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 w-full space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-white text-lg font-black tracking-wide flex items-center gap-2">
                                <MemoryStick className="w-5 h-5 text-[var(--accent-cyan)]" /> Real-time RAM & ISLC Standby Optimizer
                            </h3>
                            <p className="text-[var(--text-muted)] text-xs mt-1 font-medium">Reclaim standby cache, trim working sets, and prevent micro-stuttering in memory-heavy titles.</p>
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

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={purgeStandby}
                        disabled={cleaning}
                        className="px-6 py-3.5 bg-[var(--accent-cyan)] border-[var(--accent-cyan)]/50 rounded-2xl text-black text-xs font-black tracking-widest uppercase hover:bg-[#00e6c8] transition-all disabled:opacity-40 disabled:cursor-not-allowed w-full md:w-auto shadow-[0_0_20px_rgba(0,255,222,0.3)] whitespace-nowrap border flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {cleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {cleaning ? 'Purging...' : 'Purge Standby Cache (ISLC)'}
                    </button>
                </div>
            </div>

            {/* Granular Memory Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-white/5">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-white">Auto ISLC Loop</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Purge when free RAM &lt; 2GB</div>
                    </div>
                    <button
                        onClick={toggleAutoPurge}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${autoPurge ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/10 text-text-dim'}`}
                    >
                        {autoPurge ? 'ACTIVE' : 'OFF'}
                    </button>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-white">Memory Compression</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Saves CPU decompress cycles</div>
                    </div>
                    <button
                        onClick={toggleComp}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${!compression ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/10 text-text-dim'}`}
                    >
                        {!compression ? 'DISABLED' : 'ENABLED'}
                    </button>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-white">Page Combining</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Deduplicate identical pages</div>
                    </div>
                    <button
                        onClick={togglePageComb}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${!pageCombining ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/10 text-text-dim'}`}
                    >
                        {!pageCombining ? 'DISABLED' : 'ENABLED'}
                    </button>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-white">Fixed NVMe Pagefile</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Eliminate resize stutter</div>
                    </div>
                    <button
                        onClick={optimizePagefile}
                        disabled={optPagefileLoading}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/25 transition-all"
                    >
                        {optPagefileLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Optimize'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function AdvancedCpuPanel() {
    const [boostMode, setBoostMode] = useState<number>(2)
    const [cStateDisabled, setCStateDisabled] = useState<boolean>(false)
    const [freqLocked, setFreqLocked] = useState<boolean>(false)
    const [prioritySeparation, setPrioritySeparation] = useState<number>(38)
    const [loading, setLoading] = useState(false)
    const addNotification = useAppStore(s => s.addNotification)

    const fetchCpuControls = useCallback(async () => {
        if (!window.api?.powerPlan || !window.api?.performance) return
        try {
            const [b, c, t, p] = await Promise.all([
                window.api.powerPlan.getBoostMode(),
                window.api.powerPlan.getCStateConfig(),
                window.api.powerPlan.getProcessorThrottle(),
                window.api.performance.getWin32PrioritySeparation()
            ])
            if (b.success) setBoostMode(b.mode)
            if (c.success) setCStateDisabled(c.idleDisabled)
            if (t.success) setFreqLocked(t.minPercent === 100)
            if (p.success) setPrioritySeparation(p.value)
        } catch {}
    }, [])

    useEffect(() => {
        fetchCpuControls()
    }, [fetchCpuControls])

    const handleSetBoost = async (val: number) => {
        setLoading(true)
        try {
            const res = await window.api?.powerPlan?.setBoostMode(val)
            if (res.success) {
                setBoostMode(val)
                addNotification('success', res.message)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleToggleCState = async () => {
        const next = !cStateDisabled
        setLoading(true)
        try {
            const res = await window.api?.powerPlan?.setCStateDisabled(next)
            if (res.success) {
                setCStateDisabled(next)
                addNotification('success', res.message)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleToggleFreqLock = async () => {
        const next = !freqLocked
        setLoading(true)
        try {
            const res = await window.api?.powerPlan?.lockMaxFrequency(next)
            if (res.success) {
                setFreqLocked(next)
                addNotification('success', res.message)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleSetPriority = async () => {
        setLoading(true)
        try {
            const res = await window.api?.performance?.setWin32PrioritySeparation(38)
            if (res.success) {
                setPrioritySeparation(38)
                addNotification('success', 'Foreground Priority 3:1 Boost applied!')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-white text-lg font-black tracking-wide flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-[var(--accent-cyan)]" /> Advanced CPU Governor & Clock Latency Killer
                    </h3>
                    <p className="text-[var(--text-muted)] text-xs mt-1 font-medium">
                        Direct kernel and ACPI power management controls to eliminate frequency scaling downclock stutter and idle wakeup delay.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="text-xs font-bold text-white">Processor Boost Mode</div>
                    <p className="text-[11px] text-text-muted">Controls aggressiveness of AMD Precision Boost / Intel Turbo Boost.</p>
                    <select
                        value={boostMode}
                        onChange={(e) => handleSetBoost(parseInt(e.target.value, 10))}
                        disabled={loading}
                        className="w-full py-2 px-3 bg-black/40 border border-white/15 rounded-xl text-xs text-white font-semibold outline-none"
                    >
                        <option value={2}>Aggressive (Recommended)</option>
                        <option value={4}>Efficient Aggressive</option>
                        <option value={1}>Enabled (Standard)</option>
                        <option value={0}>Disabled</option>
                    </select>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="text-xs font-bold text-white">CPU Idle C-States</div>
                    <p className="text-[11px] text-text-muted">Disables CPU sleep states. Eliminates microsecond wake latency spikes.</p>
                    <button
                        onClick={handleToggleCState}
                        disabled={loading}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all border ${cStateDisabled ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-white/10 text-text-dim border-white/10'}`}
                    >
                        {cStateDisabled ? 'Idle States Disabled (Fast)' : 'Idle States Allowed (Default)'}
                    </button>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="text-xs font-bold text-white">100% Minimum Frequency</div>
                    <p className="text-[11px] text-text-muted">Locks CPU clocks to maximum state. Stops downclocking during match loading.</p>
                    <button
                        onClick={handleToggleFreqLock}
                        disabled={loading}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all border ${freqLocked ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-white/10 text-text-dim border-white/10'}`}
                    >
                        {freqLocked ? 'Locked at 100% (No Drops)' : 'Dynamic 5%-100%'}
                    </button>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="text-xs font-bold text-white">Foreground Quantum 3:1</div>
                    <p className="text-[11px] text-text-muted">Win32PrioritySeparation = 38 (0x26). 3:1 CPU time dedicated to game window.</p>
                    <button
                        onClick={handleSetPriority}
                        disabled={loading || prioritySeparation === 38}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all border ${prioritySeparation === 38 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30 hover:bg-accent-cyan/25'}`}
                    >
                        {prioritySeparation === 38 ? '3:1 Boost Active (38)' : 'Apply 3:1 Boost (38)'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function AiCpuAdvisorPanel() {
    const [cpuInfo, setCpuInfo] = useState<{ brand: string; cores: number; threads: number } | null>(null)
    const setAiDrawerOpen = useAppStore(s => s.setAiDrawerOpen)
    const addNotification = useAppStore(s => s.addNotification)
    const [unparking, setUnparking] = useState(false)

    useEffect(() => {
        window.api?.system?.getFullInfo?.().then((info: any) => {
            if (info?.cpu) {
                setCpuInfo({
                    brand: info.cpu.brand || 'Processor',
                    cores: info.cpu.cores || 8,
                    threads: info.cpu.threads || 16
                })
            }
        }).catch(() => {})
    }, [])

    const brand = (cpuInfo?.brand || '').toLowerCase()
    const isAmdX3d = brand.includes('x3d') || (brand.includes('ryzen') && (brand.includes('7800') || brand.includes('7950') || brand.includes('9800')))
    const isIntelHybrid = brand.includes('intel') && ((cpuInfo?.cores || 0) >= 10 || brand.includes('i7') || brand.includes('i9') || brand.includes('ultra'))

    const handleUnpark = async () => {
        setUnparking(true)
        try {
            await window.api?.processLasso?.toggleCoreParking?.(true)
            addNotification('success', 'All CPU Cores unparked for 0-latency gaming!')
        } catch {
            addNotification('error', 'Core unparking failed')
        }
        setUnparking(false)
    }

    return (
        <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border border-[var(--accent-cyan)]/25 rounded-[2.5rem] p-8 relative overflow-hidden transition-all hover:bg-[rgba(255,255,255,0.05)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_top_right,rgba(0,255,222,0.12),transparent_70%)] pointer-events-none" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex-1 space-y-2 text-left">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[var(--accent-cyan)] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-cyan)]">AI CPU & Thread Director Intelligence</span>
                        <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30 tracking-wider font-mono">Neural Core</span>
                    </div>
                    <h3 className="text-white text-lg font-black tracking-wide flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-[var(--accent-cyan)]" />
                        {cpuInfo?.brand || 'Multi-Core Processor Architecture'}
                    </h3>
                    <div className="text-[var(--text-secondary)] text-xs font-medium leading-relaxed max-w-2xl">
                        {isAmdX3d ? (
                            <span className="text-emerald-400 font-semibold">
                                AMD 3D V-Cache Topology Detected: We recommend parking non-cache CCD cores during gaming to eliminate cross-CCX interconnect latency and maximize L3 cache hits.
                            </span>
                        ) : isIntelHybrid ? (
                            <span className="text-sky-400 font-semibold">
                                Intel Hybrid Architecture Detected (Thread Director): Foreground game processes should be pinned to Performance Cores (P-Cores) to prevent micro-stutter from background E-Core starvation.
                            </span>
                        ) : (
                            <span>
                                Symmetrical Multi-Core Architecture ({cpuInfo?.cores || 8}C/{cpuInfo?.threads || 16}T): Unparking CPU cores and optimizing Windows multimedia scheduling ensures instant burst clock frequencies without power-transition spikes.
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                    <button
                        onClick={handleUnpark}
                        disabled={unparking}
                        className="px-6 py-3.5 bg-gradient-to-r from-[var(--accent-cyan)] to-[#00FFDE] text-black text-xs font-black uppercase tracking-wider rounded-2xl shadow-[0_0_20px_rgba(0,255,222,0.3)] hover:brightness-110 transition-all flex items-center gap-2"
                    >
                        {unparking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        Unpark All Cores
                    </button>
                    <button
                        onClick={() => setAiDrawerOpen(true)}
                        className="px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[var(--accent-cyan)]/40 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4 text-[var(--accent-cyan)]" />
                        Copilot Advice
                    </button>
                </div>
            </div>
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
                <AiCpuAdvisorPanel />
            </div>

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
            ) : tab === 'cpu' ? (
                <div className="space-y-6 mt-6">
                    <AdvancedCpuPanel />
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
