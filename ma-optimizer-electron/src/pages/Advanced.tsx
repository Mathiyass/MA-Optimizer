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
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <button onClick={removeSelected} disabled={selected.size === 0 || removing}
                    className="px-4 py-2 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm font-medium hover:bg-danger/20 transition-colors disabled:opacity-40 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    {removing ? 'Removing...' : `Remove Selected (${selected.size})`}
                </button>
                <button onClick={() => setSelected(new Set(apps.map(a => a.fullName || a.name)))}
                    className="px-3 py-2 border border-card-border rounded-lg text-xs text-text-muted hover:text-text-primary transition-colors">
                    Select All
                </button>
                <button onClick={() => setSelected(new Set())}
                    className="px-3 py-2 border border-card-border rounded-lg text-xs text-text-muted hover:text-text-primary transition-colors">
                    Deselect All
                </button>
                <button onClick={refresh} className="p-2 border border-card-border rounded-lg text-text-muted hover:text-text-primary">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-accent-cyan" /></div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[500px] overflow-y-auto">
                    {apps.map(app => {
                        const isSafe = safeRemovals.some(s => app.name?.includes(s))
                        const key = app.fullName || app.name
                        return (
                            <label key={key}
                                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${selected.has(key) ? 'border-danger/30 bg-danger/5' : 'border-card-border bg-card-bg hover:border-card-border/80'
                                    }`}>
                                <input
                                    type="checkbox"
                                    checked={selected.has(key)}
                                    onChange={() => toggleApp(key)}
                                    className="accent-danger"
                                />
                                <div className="flex-1 min-w-0">
                                    <span className="text-text-primary text-xs font-medium truncate block">{app.name}</span>
                                </div>
                                {isSafe && <span className="text-success text-[10px] px-1.5 py-0.5 bg-success/10 rounded-full shrink-0">Safe</span>}
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

    if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-accent-cyan" /></div>

    return (
        <div className="grid gap-2">
            {features.filter(f => knownFeatures.some(k => f.name?.includes(k)) || features.length <= 20).slice(0, 20).map(f => (
                <div key={f.name} className="flex items-center justify-between p-3 bg-card-bg border border-card-border rounded-xl">
                    <div>
                        <span className="text-text-primary text-sm font-medium">{f.name}</span>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${f.state?.includes('Enable') ? 'bg-success/10 text-success' : 'bg-card-border text-text-dim'
                            }`}>{f.state}</span>
                    </div>
                    <button
                        onClick={() => toggleFeature(f.name, !f.state?.includes('Enable'))}
                        className="px-3 py-1.5 text-xs border border-card-border rounded-lg text-text-muted hover:text-text-primary transition-colors"
                    >
                        {f.state?.includes('Enable') ? 'Disable' : 'Enable'}
                    </button>
                </div>
            ))}
            {features.length === 0 && <div className="text-text-dim text-center py-8">No features detected (requires admin)</div>}
        </div>
    )
}

export function Advanced() {
    const [tab, setTab] = useState('explorer')
    const items = getTweaksByCategoryAndTab('advanced', tab)

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                    <SlidersHorizontal className="w-6 h-6 text-accent-cyan" /> Advanced Tweaks
                </h2>
                <p className="text-text-muted text-sm mt-1">Explorer, taskbar, boot customizations, bloatware removal, and Windows features</p>
            </div>

            <TabGroup tabs={tabs} active={tab} onChange={setTab} />

            {tab === 'bloatware' ? (
                <BloatwareTab />
            ) : tab === 'features' ? (
                <FeaturesTab />
            ) : (
                <div className="grid gap-3">
                    {items.map(t => <TweakRow key={t.id} tweakId={t.id} />)}
                    {items.length === 0 && <div className="text-text-dim text-center py-8">No tweaks in this tab</div>}
                </div>
            )}
        </div>
    )
}
