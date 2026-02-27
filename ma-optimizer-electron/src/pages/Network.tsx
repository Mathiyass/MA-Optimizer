import React, { useState, useEffect, useCallback } from 'react'
import { Globe, RefreshCw, Loader2, Wifi, Activity } from 'lucide-react'
import { TweakCard } from '../components/ui/TweakCard'
import { TabGroup } from '../components/ui/TabGroup'
import { useTweak } from '../hooks/useTweak'
import { getTweaksByCategoryAndTab } from '../data/tweaks'
import { useAppStore } from '../store/appStore'
import { useLogStore } from '../store/logStore'

const tabs = [
    { id: 'basic', label: 'Basic' },
    { id: 'advanced', label: 'Advanced TCP' },
    { id: 'dns', label: 'DNS & Routing' },
    { id: 'diagnostics', label: 'Diagnostics' },
]

function TweakRow({ tweakId }: { tweakId: string }) {
    const { enabled, loading, toggle, tweak } = useTweak(tweakId)
    if (!tweak) return null
    return <TweakCard id={tweakId} title={tweak.name} description={tweak.description} risk={tweak.risk} enabled={enabled} onChange={toggle} loading={loading} />
}

const dnsPresets = [
    { name: '🌐 Google', primary: '8.8.8.8', secondary: '8.8.4.4' },
    { name: '☁️ Cloudflare', primary: '1.1.1.1', secondary: '1.0.0.1' },
    { name: '🛡️ Cloudflare Malware', primary: '1.1.1.2', secondary: '1.0.0.2' },
    { name: '👁️ OpenDNS', primary: '208.67.222.222', secondary: '208.67.220.220' },
    { name: '🔒 Quad9', primary: '9.9.9.9', secondary: '149.112.112.112' },
]

function DnsTab() {
    const [selectedDns, setSelectedDns] = useState<number | null>(null)
    const [adapters, setAdapters] = useState<string[]>([])
    const [selectedAdapter, setSelectedAdapter] = useState('')
    const addLog = useLogStore(s => s.addLine)
    const addNotification = useAppStore(s => s.addNotification)

    useEffect(() => {
        window.api?.network.getAdapters().then((list: any[]) => {
            const names = (list || []).map((a: any) => a.iface || a.ifaceName || a.name).filter(Boolean)
            setAdapters(names)
            if (names.length > 0) setSelectedAdapter(names[0])
        }).catch(() => { })
    }, [])

    const applyDns = async () => {
        if (selectedDns === null || !selectedAdapter) return
        const preset = dnsPresets[selectedDns]
        try {
            await window.api?.network.setDns(selectedAdapter, preset.primary, preset.secondary)
            addLog(`[DNS] Set ${preset.name} DNS on ${selectedAdapter}`)
            addNotification('success', `Applied ${preset.name} DNS`)
        } catch (e) {
            addLog(`[ERROR] DNS set failed: ${e}`)
        }
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {dnsPresets.map((dns, i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedDns(i)}
                        className={`p-3 rounded-xl border text-left transition-all ${selectedDns === i
                            ? 'border-accent-cyan/50 bg-accent-cyan/10 shadow-[0_0_12px_rgba(0,255,222,0.1)]'
                            : 'border-card-border bg-card-bg hover:border-accent-cyan/20'
                            }`}
                    >
                        <div className="text-sm font-medium text-text-primary">{dns.name}</div>
                        <div className="text-xs text-text-muted mt-1">{dns.primary} / {dns.secondary}</div>
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <select
                    value={selectedAdapter}
                    onChange={e => setSelectedAdapter(e.target.value)}
                    className="flex-1 px-3 py-2 bg-app-bg border border-card-border rounded-lg text-sm text-text-primary outline-none"
                >
                    {adapters.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <button
                    onClick={applyDns}
                    disabled={selectedDns === null}
                    className="px-4 py-2 bg-accent-cyan/10 border border-accent-cyan/30 rounded-lg text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors disabled:opacity-40"
                >
                    Apply DNS
                </button>
            </div>

            <div className="flex gap-2 flex-wrap">
                <button onClick={() => window.api?.network.flushDns()} className="px-3 py-1.5 bg-card-bg border border-card-border rounded-lg text-xs text-text-muted hover:text-text-primary transition-colors">
                    Flush DNS
                </button>
            </div>
        </div>
    )
}

function DiagnosticsTab() {
    const [pings, setPings] = useState<Record<string, { ms: number; status: string }>>({})
    const [testing, setTesting] = useState(false)
    const addLog = useLogStore(s => s.addLine)

    const runPingTests = async () => {
        setTesting(true)
        const hosts = ['google.com', '1.1.1.1', '8.8.8.8', 'cloudflare.com']
        const results: Record<string, { ms: number; status: string }> = {}
        for (const host of hosts) {
            try {
                const result = await window.api?.network.pingTest(host)
                results[host] = { ms: result?.avg ?? -1, status: result?.loss === 0 ? 'ok' : 'timeout' }
            } catch {
                results[host] = { ms: -1, status: 'error' }
            }
        }
        setPings(results)
        setTesting(false)
        addLog('[DIAG] Ping tests completed')
    }

    useEffect(() => { runPingTests() }, [])

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
                <h3 className="text-sm font-semibold text-text-primary">Live Ping Test</h3>
                <button onClick={runPingTests} disabled={testing} className="p-1.5 border border-card-border rounded-lg text-text-muted hover:text-text-primary">
                    <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
                </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(pings).map(([host, result]) => (
                    <div key={host} className="p-3 bg-card-bg border border-card-border rounded-xl text-center">
                        <div className="text-xs text-text-muted mb-1">{host}</div>
                        <div className={`text-lg font-bold ${result.ms < 0 ? 'text-danger' :
                            result.ms < 20 ? 'text-success' :
                                result.ms < 80 ? 'text-warning' : 'text-danger'
                            }`}>
                            {result.ms >= 0 ? `${result.ms}ms` : 'Timeout'}
                        </div>
                        <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${result.status === 'ok' ? 'bg-success' : 'bg-danger'
                            }`} />
                    </div>
                ))}
            </div>
            {testing && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-accent-cyan" /></div>}
        </div>
    )
}

export function Network() {
    const [tab, setTab] = useState('basic')
    const items = getTweaksByCategoryAndTab('network', tab)

    const quickActions = [
        { label: '🔄 Flush DNS', fn: () => window.api?.network.flushDns() },
        { label: '🔌 Reset Winsock', fn: () => window.api?.network.resetWinsock() },
        { label: '🌐 Reset TCP/IP', fn: () => window.api?.network.resetTcpIp() },
    ]

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                    <Globe className="w-6 h-6 text-accent-cyan" /> Network / TCP Optimizer
                </h2>
                <p className="text-text-muted text-sm mt-1">Optimize network stack for lower latency and higher throughput</p>
            </div>

            <div className="flex gap-2 flex-wrap">
                {quickActions.map(a => (
                    <button key={a.label} onClick={a.fn} className="px-4 py-2 bg-card-bg border border-card-border rounded-lg text-sm text-text-muted hover:text-text-primary hover:border-accent-cyan/30 transition-all">
                        {a.label}
                    </button>
                ))}
            </div>

            <TabGroup tabs={tabs} active={tab} onChange={setTab} />

            {tab === 'dns' ? (
                <DnsTab />
            ) : tab === 'diagnostics' ? (
                <DiagnosticsTab />
            ) : (
                <div className="grid gap-3">
                    {items.map(t => <TweakRow key={t.id} tweakId={t.id} />)}
                    {items.length === 0 && <div className="text-text-dim text-center py-8">No tweaks in this tab</div>}
                </div>
            )}
        </div>
    )
}
