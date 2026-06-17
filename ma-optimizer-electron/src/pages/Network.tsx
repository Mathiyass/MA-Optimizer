import React, { useState, useEffect, useCallback } from 'react'
import { Globe, RefreshCw, Loader2, Wifi, Activity } from 'lucide-react'
import { motion } from 'framer-motion'
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
        <div className="space-y-6">
            <h3 className="text-white text-lg font-black tracking-wide mb-4">Fast DNS Providers</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {dnsPresets.map((dns, i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedDns(i)}
                        className={`p-5 rounded-2xl border text-left transition-all duration-300 group ${selectedDns === i
                            ? 'border-[var(--accent-cyan)]/50 bg-[var(--accent-cyan)]/10 shadow-[0_0_20px_rgba(0,255,222,0.2)]'
                            : 'border-white/10 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 hover:border-[var(--accent-cyan)]/30 hover:bg-[rgba(255,255,255,0.05)] shadow-inner'
                            }`}
                    >
                        <div className="text-[15px] font-bold text-white mb-2 tracking-wide flex justify-between items-center">
                            {dns.name}
                            {selectedDns === i && <Activity className="w-4 h-4 text-[var(--accent-cyan)] animate-pulse" />}
                        </div>
                        <div className="text-xs font-mono text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">{dns.primary}</div>
                        <div className="text-xs font-mono text-[var(--text-dim)] group-hover:text-[var(--text-muted)] transition-colors mt-1">{dns.secondary}</div>
                    </button>
                ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/10">
                <h3 className="text-white text-lg font-black tracking-wide mb-4">Apply Settings</h3>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                        <Wifi className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none" />
                        <select
                            value={selectedAdapter}
                            onChange={e => setSelectedAdapter(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 border-white/10 rounded-2xl text-[15px] text-white font-medium outline-none focus:border-[var(--accent-cyan)] focus:shadow-[0_0_15px_rgba(0,255,222,0.2)] transition-all appearance-none cursor-pointer"
                        >
                            {adapters.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={applyDns}
                        disabled={selectedDns === null}
                        className="px-8 py-4 bg-[var(--accent-cyan)] border-[var(--accent-cyan)]/50 rounded-2xl text-black text-xs font-black tracking-widest uppercase hover:bg-[#00e6c8] transition-all disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto shadow-[0_0_20px_rgba(0,255,222,0.3)] whitespace-nowrap"
                    >
                        Override DNS
                    </button>
                </div>
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
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-white text-lg font-black tracking-wide">Live Latency Monitor</h3>
                    <p className="text-[var(--text-muted)] text-xs mt-1 font-medium">Real-time ping testing to major backbone servers</p>
                </div>
                <button onClick={runPingTests} disabled={testing} className="p-3 border-white/10 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-2xl text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent-cyan)]/50 transition-all hover:bg-[rgba(0,255,222,0.1)] shadow-md">
                    <RefreshCw className={`w-5 h-5 ${testing ? 'animate-spin text-[var(--accent-cyan)]' : ''}`} />
                </button>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(pings).map(([host, result]) => {
                    const isOk = result.ms >= 0;
                    const isGreat = result.ms < 20 && isOk;
                    const isWarn = result.ms >= 20 && result.ms < 80;
                    const isBad = result.ms >= 80 || !isOk;
                    
                    return (
                        <div key={host} className="p-5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 border-white/10 rounded-2xl text-center relative overflow-hidden shadow-inner group hover:border-white/20 transition-all duration-300">
                            {/* Status Indicator Glow */}
                            <div className={`absolute top-0 left-0 right-0 h-1 ${isGreat ? 'bg-[#00FFDE] shadow-[0_0_10px_rgba(0,255,222,0.8)]' : isWarn ? 'bg-[#FF003C] shadow-[0_0_10px_rgba(255,0,60,0.8)]' : 'bg-[#FF003C] shadow-[0_0_10px_rgba(255,0,60,0.8)]'}`} />
                            
                            <div className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">{host}</div>
                            <div className={`text-3xl font-black font-mono tracking-tighter ${isGreat ? 'text-[#00FFDE]' : isWarn ? 'text-[#FF003C]' : 'text-[#FF003C]'}`}>
                                {isOk ? `${result.ms}ms` : 'FAIL'}
                            </div>
                            
                            {/* Mini chart visualizer placeholder */}
                            {isOk && (
                                <div className="flex items-end justify-center gap-1 mt-4 h-6 opacity-30 group-hover:opacity-100 transition-opacity">
                                    {[1,2,3,4,5].map(bar => (
                                        <div key={bar} className={`w-1.5 rounded-full ${isGreat ? 'bg-[#00FFDE]' : isWarn ? 'bg-[#FF003C]' : 'bg-[#FF003C]'}`} style={{ height: `${Math.max(10, Math.random() * 100)}%` }}></div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
            {testing && <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent-cyan)]" /></div>}
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
        <div className="space-y-8 max-w-[90rem] mx-auto w-full pb-10">
            {/* Ultra-Premium Network Hero Section */}
            <motion.div
                className="relative overflow-hidden rounded-[2.5rem] p-12 transition-all duration-700 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[var(--accent-cyan)]/20 animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[#FF003C]/20 animate-pulse" style={{ animationDuration: '6s' }}></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center md:text-left">
                        <motion.h2 className="text-5xl lg:text-6xl font-black mb-4 tracking-tight text-white flex items-center justify-center md:justify-start gap-4">
                            <Globe className="w-12 h-12 text-[var(--accent-cyan)] drop-shadow-[0_0_15px_rgba(0,255,222,0.8)]" />
                            Network Optimization
                        </motion.h2>
                        <p className="text-[var(--text-muted)] text-sm uppercase tracking-[0.3em] font-black mb-8">
                            TCP/IP Stack Tuning
                        </p>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <p className="text-[var(--text-secondary)] max-w-xl font-medium leading-relaxed">
                                Fine-tune your TCP stack for absolute minimum latency and maximum throughput. Bypass congested DNS routes and flush stale connections instantly.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center gap-4 max-w-sm">
                        {quickActions.map((a, i) => (
                            <button key={i} onClick={a.fn}
                                className="flex-1 min-w-[140px] px-6 py-4 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 border-white/10 rounded-2xl text-xs font-black tracking-widest uppercase text-white hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]/50 hover:bg-[rgba(0,255,222,0.1)] transition-all flex items-center justify-center gap-2 shadow-xl text-center">
                                {a.label}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            <div className="mt-8">
                <TabGroup tabs={tabs} active={tab} onChange={setTab} />
            </div>

            {tab === 'dns' ? (
                <div className="rounded-[2.5rem] p-8 border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl mt-6">
                    <DnsTab />
                </div>
            ) : tab === 'diagnostics' ? (
                <div className="rounded-[2.5rem] p-8 border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl mt-6">
                    <DiagnosticsTab />
                </div>
            ) : (
                <div className="grid gap-4 mt-6">
                    {items.map(t => <TweakRow key={t.id} tweakId={t.id} />)}
                    {items.length === 0 && <div className="text-[var(--text-muted)] text-center py-12 font-bold tracking-widest uppercase">No tweaks in this category</div>}
                </div>
            )}
        </div>
    )
}
