import React, { useState, useEffect, useCallback } from 'react'
import { SlidersHorizontal, Loader2, Trash2, RefreshCw } from 'lucide-react'
import { TweakCard } from '../components/ui/TweakCard'
import { TabGroup } from '../components/ui/TabGroup'
import { useTweak } from '../hooks/useTweak'
import { getTweaksByCategoryAndTab } from '../data/tweaks'
import { useAppStore } from '../store/appStore'
import { useLogStore } from '../store/logStore'

const tabs = [
    { id: 'explorer', label: 'Explorer' },
    { id: 'taskbar', label: 'Taskbar' },
    { id: 'boot', label: 'Boot & Login' },
    { id: 'bloatware', label: 'Bloatware' },
    { id: 'features', label: 'Windows Features' },
]

function TweakRow({ tweakId }: { tweakId: string }) {
    const { enabled, loading, toggle, tweak } = useTweak(tweakId)
    if (!tweak) return null
    return <TweakCard id={tweakId} title={tweak.name} description={tweak.description} risk={tweak.risk} enabled={enabled} onChange={toggle} loading={loading} />
}

const safeRemovals = [
    'Microsoft.3DViewer', 'Microsoft.BingFinance', 'Microsoft.BingNews', 'Microsoft.BingSports',
    'Microsoft.BingWeather', 'Microsoft.GetHelp', 'Microsoft.Getstarted', 'Microsoft.MixedReality.Portal',
    'Microsoft.People', 'Microsoft.SkypeApp', 'Microsoft.MicrosoftSolitaireCollection',
    'Microsoft.Xbox.TCUI', 'Microsoft.XboxGameOverlay', 'Microsoft.XboxGamingOverlay',
    'Microsoft.XboxIdentityProvider', 'Microsoft.XboxSpeechToTextOverlay',
    'Microsoft.YourPhone', 'Microsoft.ZuneMusic', 'Microsoft.ZuneVideo',
    'Microsoft.WindowsFeedbackHub', 'Microsoft.MicrosoftOfficeHub',
]

function BloatwareTab() {
    const [apps, setApps] = useState<{ name: string; fullName: string }[]>([])
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(false)
    const [removing, setRemoving] = useState(false)
    const addLog = useLogStore(s => s.addLine)
    const addNotification = useAppStore(s => s.addNotification)

    const refresh = useCallback(async () => {
        setLoading(true)
        try {
            const list = await window.api?.advanced.getInstalledApps()
            setApps(list || [])
            const autoSelect = new Set<string>()
            for (const app of (list || [])) {
                if (safeRemovals.some(s => app.name?.includes(s))) {
                    autoSelect.add(app.fullName || app.name)
                }
            }
            setSelected(autoSelect)
        } catch (e) {
            addLog(`[ERROR] Failed to get apps: ${e}`)
        } finally {
            setLoading(false)
        }
    }, [addLog])

    useEffect(() => { refresh() }, [refresh])

    const toggleApp = (name: string) => {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(name)) next.delete(name)
            else next.add(name)
            return next
        })
    }

    const removeSelected = async () => {
        if (selected.size === 0) return
        setRemoving(true)
        try {
            await window.api?.advanced.removeApps(Array.from(selected))
            addNotification('success', `Removed ${selected.size} apps`)
            addLog(`[BLOATWARE] Removed ${selected.size} apps`)
            setSelected(new Set())
            await refresh()
        } catch (e) {
            addLog(`[ERROR] Bloatware removal failed: ${e}`)
        } finally {
            setRemoving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-2xl p-4 shadow-lg border">
                <button onClick={removeSelected} disabled={selected.size === 0 || removing}
                    className="px-6 py-2.5 bg-[#ff003c]/10 border-[#ff003c]/30 rounded-2xl text-[#ff003c] text-sm font-black tracking-widest uppercase hover:bg-[#ff003c]/20 hover:border-[#ff003c]/60 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_0_15px_rgba(255,0,60,0.1)] border">
                    {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {removing ? 'Removing...' : `Remove Selected (${selected.size})`}
                </button>
                <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block"></div>
                <button onClick={() => setSelected(new Set(apps.map(a => a.fullName || a.name)))}
                    className="px-4 py-2.5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-2xl text-xs font-bold text-[var(--text-muted)] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all uppercase tracking-wider border">
                    Select All
                </button>
                <button onClick={() => setSelected(new Set())}
                    className="px-4 py-2.5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-2xl text-xs font-bold text-[var(--text-muted)] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all uppercase tracking-wider border">
                    Deselect All
                </button>
                <button onClick={refresh} className="ml-auto p-2.5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-2xl text-[var(--text-muted)] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider border">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> <span className="hidden sm:inline">Refresh</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent-cyan)]" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {apps.map(app => {
                        const isSafe = safeRemovals.some(s => app.name?.includes(s))
                        const key = app.fullName || app.name
                        return (
                            <label key={key}
                                className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300 card-premium ${selected.has(key) ? 'border-[#ff003c]/40 bg-[#ff003c]/10 shadow-[0_0_15px_rgba(255,0,60,0.15)] border' : 'border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 hover:border-white/20 border'
                                    }`}>
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={selected.has(key)}
                                        onChange={() => toggleApp(key)}
                                        className="peer sr-only"
                                    />
                                    <div className={`w-6 h-6 rounded-2xl border flex items-center justify-center transition-all ${selected.has(key) ? 'bg-[#ff003c] border-[#ff003c] border' : 'bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 peer-hover:border-white/40 border'}`}>
                                        {selected.has(key) && <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className={`text-[15px] font-bold truncate block ${selected.has(key) ? 'text-white' : 'text-[var(--text-muted)]'}`}>{app.name}</span>
                                </div>
                                {isSafe && <span className="text-[#00FFDE] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-[#00FFDE]/10 border-[#00FFDE]/20 rounded-2xl shrink-0 border">Safe</span>}
                            </label>
                        )
                    })}
                </div>
            )}
            {!loading && apps.length === 0 && <div className="text-text-dim text-center py-8">No UWP apps detected (requires admin)</div>}
        </div>
    )
}

function FeaturesTab() {
    const [features, setFeatures] = useState<{ name: string; state: string }[]>([])
    const [loading, setLoading] = useState(false)
    const addLog = useLogStore(s => s.addLine)
    const addNotification = useAppStore(s => s.addNotification)

    useEffect(() => {
        setLoading(true)
        window.api?.advanced.getWindowsFeatures().then((list: any) => {
            setFeatures(list || [])
        }).catch(() => { }).finally(() => setLoading(false))
    }, [])

    const toggleFeature = async (name: string, enable: boolean) => {
        try {
            await window.api?.advanced.toggleFeature(name, enable)
            addLog(`[FEATURE] ${enable ? 'Enabled' : 'Disabled'} ${name}`)
            addNotification('info', `${name} ${enable ? 'enabled' : 'disabled'} — restart may be required`)
            setFeatures(prev => prev.map(f => f.name === name ? { ...f, state: enable ? 'Enabled' : 'Disabled' } : f))
        } catch (e) {
            addLog(`[ERROR] Feature toggle failed: ${e}`)
        }
    }

    const knownFeatures = [
        'Microsoft-Hyper-V-All', 'Microsoft-Windows-Subsystem-Linux', 'Containers-DisposableClientVM',
        'VirtualMachinePlatform', 'NetFx3', 'NetFx4-AdvSrvs', 'TelnetClient', 'OpenSSH.Client',
        'Microsoft-Windows-Printing-PrintToPDFServices-Feature', 'SMB1Protocol',
    ]

    if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent-cyan)]" /></div>

    return (
        <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {features.filter(f => knownFeatures.some(k => f.name?.includes(k)) || features.length <= 20).slice(0, 20).map(f => {
                const isEnabled = f.state?.includes('Enable')
                return (
                    <div key={f.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-[1.5rem] card-premium hover:border-white/10 transition-all gap-4 border">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-white text-[15px] font-bold tracking-wide">{f.name}</span>
                            <span className={`self-start text-[10px] px-2.5 py-1 rounded-2xl font-black uppercase tracking-widest border ${isEnabled ? 'bg-[#00FFDE]/10 text-[#00FFDE] border-[#00FFDE]/20 border' : 'bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 text-[var(--text-dim)] border'
                                }`}>{f.state}</span>
                        </div>
                        <button
                            onClick={() => toggleFeature(f.name, !isEnabled)}
                            className={`px-6 py-3 border rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isEnabled ? 'border-[#ff003c]/30 text-[#ff003c] bg-[#ff003c]/10 hover:bg-[#ff003c]/20 hover:border-[#ff003c]/50 border' : 'border-[#00FFDE]/30 text-[#00FFDE] bg-[#00FFDE]/10 hover:bg-[#00FFDE]/20 hover:border-[#00FFDE]/50 border'}`}
                        >
                            {isEnabled ? 'Disable' : 'Enable'}
                        </button>
                    </div>
                )
            })}
            {features.length === 0 && <div className="text-text-dim text-center py-8">No features detected (requires admin)</div>}
        </div>
    )
}

export function Advanced() {
    const [tab, setTab] = useState('explorer')
    const items = getTweaksByCategoryAndTab('advanced', tab)

    return (
        <div className="space-y-8 max-w-[90rem] mx-auto w-full pb-10">
            {/* Ultra-Premium Advanced Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] p-12 transition-all duration-700 border bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[var(--accent-cyan)]/20 animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[var(--accent-violet)]/20 animate-pulse" style={{ animationDuration: '6s' }}></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-5xl lg:text-6xl font-black mb-4 tracking-tight text-white flex items-center justify-center md:justify-start gap-4">
                            <SlidersHorizontal className="w-12 h-12 text-[var(--accent-cyan)] drop-shadow-[0_0_15px_rgba(0,255,222,0.8)]" />
                            Advanced Engineering
                        </h2>
                        <p className="text-[var(--text-muted)] text-sm uppercase tracking-[0.3em] font-black mb-8">
                            Low-Level OS Configuration
                        </p>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <p className="text-[var(--text-secondary)] max-w-xl font-medium leading-relaxed">
                                Modify registry keys, strip Universal Windows Platform (UWP) bloatware, and customize core Explorer behavior for absolute minimalism.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <TabGroup tabs={tabs} active={tab} onChange={setTab} />

            <div className="mt-8">
                {tab === 'bloatware' ? (
                    <BloatwareTab />
                ) : tab === 'features' ? (
                    <FeaturesTab />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map(t => <TweakRow key={t.id} tweakId={t.id} />)}
                        {items.length === 0 && <div className="col-span-full text-[var(--text-dim)] text-center py-16 font-medium">No tweaks in this category</div>}
                    </div>
                )}
            </div>
        </div>
    )
}
