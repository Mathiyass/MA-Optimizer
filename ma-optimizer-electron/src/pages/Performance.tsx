import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Zap, RefreshCw, Loader2 } from 'lucide-react'
import { TweakCard } from '../components/ui/TweakCard'
import { TabGroup } from '../components/ui/TabGroup'
import { useTweak } from '../hooks/useTweak'
import { getTweaksByCategoryAndTab, getSafeTweaks } from '../data/tweaks'
import { useAppStore } from '../store/appStore'
import { useLogStore } from '../store/logStore'

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
                    className="flex-1 px-3 py-2 bg-app-bg border border-card-border rounded-lg text-sm text-text-primary placeholder:text-text-dim outline-none focus:border-accent-cyan/40"
                />
                <button onClick={applyAllRecommended} className="px-4 py-2 bg-accent-cyan/10 border border-accent-cyan/30 rounded-lg text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors">
                    Apply All Recommended
                </button>
                <button onClick={refresh} className="p-2 border border-card-border rounded-lg text-text-muted hover:text-text-primary transition-colors">
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
                            <div key={svc.name} className="flex items-center gap-3 p-3 bg-card-bg border border-card-border rounded-xl">
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
                                            className="px-2 py-1 text-xs border border-card-border rounded-md text-text-muted hover:text-text-primary transition-colors"
                                        >
                                            {live.status === 'Running' ? 'Stop' : 'Start'}
                                        </button>
                                        <select
                                            value={live.startType?.toLowerCase() || 'automatic'}
                                            onChange={e => setStartup(svc.name, e.target.value)}
                                            className="px-2 py-1 text-xs bg-app-bg border border-card-border rounded-md text-text-muted outline-none"
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
                            <div key={svc.name} className="flex items-center gap-3 px-3 py-2 bg-card-bg/50 border border-card-border/50 rounded-lg text-xs">
                                <span className="text-text-primary font-medium flex-1 truncate">{svc.displayName || svc.name}</span>
                                <span className={`px-1.5 py-0.5 rounded ${svc.status === 'Running' ? 'bg-success/10 text-success' : 'bg-card-border/50 text-text-dim'}`}>
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
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <Zap className="w-6 h-6 text-accent-cyan" /> Performance
                    </h2>
                    <p className="text-text-muted text-sm mt-1">Optimize system speed, responsiveness, and resource usage</p>
                </div>
                <button
                    onClick={applyAllSafe}
                    className="px-4 py-2 bg-accent-cyan/10 border border-accent-cyan/30 rounded-lg text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors"
                >
                    ⚡ Apply All Safe Tweaks
                </button>
            </div>

            <TabGroup tabs={tabs} active={tab} onChange={setTab} />

            {tab === 'services' ? (
                <ServicesTab />
            ) : (
                <div className="grid gap-3">
                    {items.map(t => <TweakRow key={t.id} tweakId={t.id} />)}
                    {items.length === 0 && <div className="text-text-dim text-center py-8">No tweaks in this category</div>}
                </div>
            )}

            {optimizing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card-bg border border-accent-cyan/30 rounded-2xl p-6 w-[400px] shadow-2xl shadow-accent-cyan/10"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
                            <h3 className="text-lg font-bold text-text-primary">Optimizing Performance...</h3>
                        </div>
                        <p className="text-text-muted text-sm mb-4 truncate">Applying: {optCurrent}</p>
                        <div className="w-full h-2 bg-app-bg rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-accent-cyan"
                                initial={{ width: 0 }}
                                animate={{ width: `${optProgress}%` }}
                                transition={{ duration: 0.2 }}
                            />
                        </div>
                        <div className="text-right text-text-dim text-xs mt-2">{optProgress}%</div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
