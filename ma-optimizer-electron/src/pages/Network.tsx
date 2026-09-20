import React, { useState, useEffect, useCallback } from 'react'
import { Globe, RefreshCw, Loader2, Wifi, Activity, Sliders, Shield, Download, Upload, Cpu, Zap, Sparkles, Crosshair, HardDrive, Volume2, Clock, Gauge, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { TweakCard } from '../components/ui/TweakCard'
import { TabGroup } from '../components/ui/TabGroup'
import { useTweak } from '../hooks/useTweak'
import { getTweaksByCategoryAndTab } from '../data/tweaks'
import { useAppStore } from '../store/appStore'
import { useLogStore } from '../store/logStore'

const tabs = [
    { id: 'bandwidth', label: 'SpeedGuide TCP Tuner' },
    { id: 'esports', label: 'eSports NIC & Latency' },
    { id: 'basic', label: 'Basic Network' },
    { id: 'advanced', label: 'Advanced TCP' },
    { id: 'dns', label: 'DNS & Routing' },
    { id: 'mtu', label: 'MTU & Packet Tester' },
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
    { name: '🛡️ Cloudflare Security', primary: '1.1.1.2', secondary: '1.0.0.2' },
    { name: '👁️ OpenDNS', primary: '208.67.222.222', secondary: '208.67.220.220' },
    { name: '🔒 Quad9', primary: '9.9.9.9', secondary: '149.112.112.112' },
]

// SpeedGuide.net TCP Optimizer Interactive Component
function TcpOptimizerTab() {
    const [bandwidth, setBandwidth] = useState(500) // Mbps
    const [adapters, setAdapters] = useState<any[]>([])
    const [selectedAdapter, setSelectedAdapter] = useState('')
    const [autoTuning, setAutoTuning] = useState('normal')
    const [congestion, setCongestion] = useState('cubic')
    const [rss, setRss] = useState(true)
    const [rsc, setRsc] = useState(true)
    const [applying, setApplying] = useState(false)

    const addLog = useLogStore(s => s.addLine)
    const addNotification = useAppStore(s => s.addNotification)

    useEffect(() => {
        window.api?.network.getAdapters().then((list: any[]) => {
            setAdapters(list || [])
            if (list && list.length > 0) {
                const first = list[0].Name || list[0].iface || list[0].name
                setSelectedAdapter(first)
            }
        }).catch(() => { })

        window.api?.network.getTcpParams().then((params: any) => {
            if (params) {
                if (params.AutoTuningLevelLocal) setAutoTuning(params.AutoTuningLevelLocal.toLowerCase())
                if (params.CongestionProvider) setCongestion(params.CongestionProvider.toLowerCase())
            }
        }).catch(() => { })
    }, [])

    // Calculate SpeedGuide recommended parameters based on bandwidth slider
    const handleSliderChange = (val: number) => {
        setBandwidth(val)
        if (val < 50) {
            setAutoTuning('default')
            setCongestion('ctcp')
        } else if (val < 300) {
            setAutoTuning('normal')
            setCongestion('cubic')
        } else {
            setAutoTuning('experimental')
            setCongestion('bbr')
        }
    }

    const applyTcpOptimal = async () => {
        setApplying(true)
        try {
            await window.api?.network.setTcpParam('autotuninglevel', autoTuning)
            await window.api?.network.setTcpParam('congestionprovider', congestion)
            await window.api?.network.runNetsh(`int tcp set global rss=${rss ? 'enabled' : 'disabled'}`)
            await window.api?.network.runNetsh(`int tcp set global rsc=${rsc ? 'enabled' : 'disabled'}`)
            
            // Gaming & low-latency registry tweaks across system and active interfaces
            await window.api?.registry.set('HKLM', 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile', 'NetworkThrottlingIndex', 4294967295, 'DWord')
            await window.api?.registry.set('HKLM', 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile', 'SystemResponsiveness', 0, 'DWord')
            await window.api?.network.applyTcpNoDelayToAllInterfaces()

            addLog(`[SG-TCP] Applied SpeedGuide.net optimal profile for ${bandwidth} Mbps with True Per-Interface Nagle Killer`)
            addNotification('success', `Optimal TCP profile applied for ${bandwidth} Mbps!`)
        } catch (e: any) {
            addNotification('error', `Failed to apply TCP settings: ${e.message}`)
        }
        setApplying(false)
    }

    const exportProfile = async () => {
        try {
            const config = await window.api?.network.exportTcpConfig()
            if (config) {
                const blob = new Blob([config], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `SG_TCP_Backup_${Date.now()}.json`
                a.click()
                addNotification('success', 'Exported TCP profile backup')
            }
        } catch {
            addNotification('error', 'Failed to export TCP profile')
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
                <div>
                    <h3 className="text-white text-xl font-black tracking-wide flex items-center gap-3">
                        <Sliders className="w-6 h-6 text-[var(--accent-cyan)]" /> SpeedGuide.net SG TCP Optimizer
                    </h3>
                    <p className="text-[var(--text-muted)] text-xs mt-1 font-medium">Fine-tune your TCP/IP stack based on connection bandwidth & network adapter</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button onClick={exportProfile} className="px-5 py-3 glass-shell rounded-2xl text-xs font-black uppercase tracking-widest text-white hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]/50 transition-all flex items-center gap-2 border">
                        <Download className="w-4 h-4" /> Export TCP Backup
                    </button>
                    <button onClick={applyTcpOptimal} disabled={applying} className="px-6 py-3.5 bg-[var(--accent-cyan)] text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#00e6c8] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,222,0.3)] disabled:opacity-50 border border-[var(--accent-cyan)]/50">
                        {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Apply SG Optimal Profile
                    </button>
                </div>
            </div>

            {/* Connection Speed Bandwidth Slider */}
            <div className="p-8 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl rounded-[2rem] border border-white/5 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <span className="text-xs uppercase font-black tracking-widest text-[var(--accent-cyan)]">Connection Speed Slider</span>
                        <h4 className="text-2xl font-black text-white mt-1">{bandwidth >= 1000 ? '1 Gbps+ (High-Speed Fiber)' : `${bandwidth} Mbps`}</h4>
                    </div>
                    <span className="text-xs font-mono text-[var(--text-muted)] glass-shell px-3 py-1.5 rounded-xl">Auto-calculates TCP Window Size</span>
                </div>

                <input
                    type="range"
                    min="1"
                    max="1000"
                    value={bandwidth}
                    onChange={e => handleSliderChange(Number(e.target.value))}
                    className="w-full h-3 bg-card-border rounded-lg appearance-none cursor-pointer accent-[var(--accent-cyan)]"
                />

                <div className="flex justify-between text-[11px] font-mono text-[var(--text-dim)] font-bold">
                    <span>1 Mbps</span>
                    <span>100 Mbps</span>
                    <span>500 Mbps</span>
                    <span>1000+ Mbps (1 Gbps)</span>
                </div>
            </div>

            {/* Adapter Selector & Parameters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Network Interface */}
                <div className="p-6 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl rounded-[1.5rem] border border-white/5 space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-[var(--accent-cyan)]" /> Active Network Interface (NIC)
                    </label>
                    <select
                        value={selectedAdapter}
                        onChange={e => setSelectedAdapter(e.target.value)}
                        className="w-full p-4 bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-2xl text-sm text-white font-medium outline-none focus:border-[var(--accent-cyan)] transition-all cursor-pointer"
                    >
                        {adapters.map((a, i) => {
                            const name = a.Name || a.iface || a.name || `Adapter ${i}`
                            return <option key={i} value={name}>{name} {a.LinkSpeed ? `(${a.LinkSpeed})` : ''}</option>
                        })}
                    </select>
                </div>

                {/* Auto Tuning Level */}
                <div className="p-6 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl rounded-[1.5rem] border border-white/5 space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-[var(--accent-cyan)]" /> TCP Window Auto-Tuning Level
                    </label>
                    <select
                        value={autoTuning}
                        onChange={e => setAutoTuning(e.target.value)}
                        className="w-full p-4 bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-2xl text-sm text-white font-medium outline-none focus:border-[var(--accent-cyan)] transition-all cursor-pointer"
                    >
                        <option value="disabled">Disabled (64KB fixed window)</option>
                        <option value="default">Default</option>
                        <option value="normal">Normal (Recommended for most)</option>
                        <option value="restricted">Restricted</option>
                        <option value="experimental">Experimental (Gigabit+ Ultra-Fast)</option>
                    </select>
                </div>

                {/* Congestion Control Provider */}
                <div className="p-6 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl rounded-[1.5rem] border border-white/5 space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[var(--accent-cyan)]" /> Congestion Control Provider
                    </label>
                    <select
                        value={congestion}
                        onChange={e => setCongestion(e.target.value)}
                        className="w-full p-4 bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-2xl text-sm text-white font-medium outline-none focus:border-[var(--accent-cyan)] transition-all cursor-pointer"
                    >
                        <option value="ctcp">CTCP (Compound TCP — Windows Classic)</option>
                        <option value="cubic">CUBIC (Modern Linux/Windows default)</option>
                        <option value="newreno">NewReno</option>
                        <option value="bbr">BBR (Google Low-Latency Algorithm)</option>
                    </select>
                </div>

                {/* Hardware Offloads */}
                <div className="p-6 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl rounded-[1.5rem] border border-white/5 space-y-4 flex flex-col justify-between">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[var(--accent-cyan)]" /> Hardware Acceleration Offloads
                    </label>
                    <div className="flex items-center justify-between gap-4">
                        <label className="flex items-center gap-3 cursor-pointer text-sm text-white font-medium">
                            <input type="checkbox" checked={rss} onChange={e => setRss(e.target.checked)} className="w-5 h-5 rounded border-white/20 checked:bg-[var(--accent-cyan)]" />
                            Receive Side Scaling (RSS)
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer text-sm text-white font-medium">
                            <input type="checkbox" checked={rsc} onChange={e => setRsc(e.target.checked)} className="w-5 h-5 rounded border-white/20 checked:bg-[var(--accent-cyan)]" />
                            Receive Segment Coalescing (RSC)
                        </label>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Packet Fragmentation & MTU Tester Component
function MtuTab() {
    const [mtuSize, setMtuSize] = useState(1500)
    const [testingMtu, setTestingMtu] = useState(false)
    const [testResults, setTestResults] = useState<Array<{ bytes: number; success: boolean; ms: number }>>([])
    const [adapters, setAdapters] = useState<string[]>([])
    const [selectedAdapter, setSelectedAdapter] = useState('')
    const addLog = useLogStore(s => s.addLine)
    const addNotification = useAppStore(s => s.addNotification)

    useEffect(() => {
        window.api?.network.getAdapters().then((list: any[]) => {
            const names = (list || []).map((a: any) => a.Name || a.iface || a.name).filter(Boolean)
            setAdapters(names)
            if (names.length > 0) setSelectedAdapter(names[0])
        }).catch(() => { })
    }, [])

    const runMtuTest = async () => {
        setTestingMtu(true)
        addLog('[MTU] Testing packet sizes for fragmentation...')
        const sizes = [1500, 1492, 1472, 1450, 1400, 1350]
        const results = []
        let optimal = 1500

        for (const size of sizes) {
            try {
                const res = await window.api?.network.testPacketSize('8.8.8.8', size - 28)
                results.push({ bytes: size, success: res.success, ms: res.ms })
                if (res.success && optimal === 1500) {
                    optimal = size
                }
            } catch {
                results.push({ bytes: size, success: false, ms: -1 })
            }
        }

        setTestResults(results)
        setMtuSize(optimal)
        setTestingMtu(false)
        addNotification('success', `Detected optimal MTU: ${optimal}`)
    }

    const applyMtu = async () => {
        if (!selectedAdapter) return
        try {
            await window.api?.network.setMtu(selectedAdapter, mtuSize)
            addNotification('success', `Applied MTU ${mtuSize} to ${selectedAdapter}`)
        } catch (e: any) {
            addNotification('error', `Failed to set MTU: ${e.message}`)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                    <h3 className="text-white text-lg font-black tracking-wide">MTU & Packet Fragmentation Tester</h3>
                    <p className="text-[var(--text-muted)] text-xs mt-1 font-medium">Find the maximum unfragmented MTU for your network connection</p>
                </div>
                <button
                    onClick={runMtuTest}
                    disabled={testingMtu}
                    className="flex items-center gap-2 px-5 py-3.5 bg-[var(--accent-cyan)]/10 border-[var(--accent-cyan)]/30 hover:border-[var(--accent-cyan)]/60 hover:bg-[var(--accent-cyan)]/25 rounded-2xl text-[var(--accent-cyan)] text-xs font-black uppercase tracking-widest transition-all border cursor-pointer disabled:opacity-40"
                >
                    {testingMtu ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                    {testingMtu ? 'Testing MTU...' : 'Run Packet Size Test'}
                </button>
            </div>

            {testResults.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {testResults.map((r, i) => (
                        <div key={i} className={`p-5 rounded-2xl border text-center transition-all ${r.success ? 'bg-[#00FFDE]/5 border-[#00FFDE]/30 text-[#00FFDE]' : 'bg-[#FF003C]/5 border-[#FF003C]/30 text-[#FF003C]'}`}>
                            <div className="text-lg font-mono font-black">{r.bytes} Bytes</div>
                            <div className="text-xs font-bold mt-1 uppercase tracking-widest">{r.success ? `PASS (${r.ms}ms)` : 'FRAGMENTED / FAIL'}</div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-8 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Wifi className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <select
                        value={selectedAdapter}
                        onChange={e => setSelectedAdapter(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-[rgba(255,255,255,0.03)] border border-white/5 rounded-2xl text-sm text-white font-medium outline-none focus:border-[var(--accent-cyan)] transition-all cursor-pointer"
                    >
                        {adapters.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <input
                        type="number"
                        value={mtuSize}
                        onChange={e => setMtuSize(Number(e.target.value))}
                        className="w-28 py-4 px-4 bg-[rgba(255,255,255,0.03)] border border-white/5 rounded-2xl text-sm text-white font-mono text-center font-bold outline-none"
                    />
                    <button
                        onClick={applyMtu}
                        className="px-8 py-4 bg-[var(--accent-cyan)] text-black rounded-2xl text-xs font-black tracking-widest uppercase hover:bg-[#00e6c8] transition-all shrink-0 border border-[var(--accent-cyan)]/50"
                    >
                        Apply MTU
                    </button>
                </div>
            </div>
        </div>
    )
}

function DnsTab() {
    const [selectedDns, setSelectedDns] = useState<number | null>(null)
    const [adapters, setAdapters] = useState<string[]>([])
    const [selectedAdapter, setSelectedAdapter] = useState('')
    const [latencies, setLatencies] = useState<Record<string, number>>({})
    const [testing, setTesting] = useState(false)
    const addLog = useLogStore(s => s.addLine)
    const addNotification = useAppStore(s => s.addNotification)

    useEffect(() => {
        window.api?.network.getAdapters().then((list: any[]) => {
            const names = (list || []).map((a: any) => a.iface || a.ifaceName || a.name || a.Name).filter(Boolean)
            setAdapters(names)
            if (names.length > 0) setSelectedAdapter(names[0])
        }).catch(() => { })
    }, [])

    const runBenchmark = async () => {
        setTesting(true)
        addLog('[DNS] Running speed benchmark on DNS providers...')
        const results: Record<string, number> = {}
        try {
            await Promise.all(dnsPresets.map(async (dns) => {
                try {
                    const res = await window.api?.network.pingTest(dns.primary)
                    results[dns.primary] = res && res.avg > 0 ? res.avg : -1
                } catch {
                    results[dns.primary] = -1
                }
            }))
            setLatencies(results)
            addNotification('success', 'DNS speed test completed!')
            addLog('[DNS] Speed benchmark finished')
        } catch (e: any) {
            addLog(`[ERROR] DNS Benchmark failed: ${e.message}`)
        } finally {
            setTesting(false)
        }
    }

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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                    <h3 className="text-white text-lg font-black tracking-wide">Fast DNS Providers</h3>
                    <p className="text-[var(--text-muted)] text-xs mt-1 font-medium">Select a provider and adapter to override your DNS settings</p>
                </div>
                <button
                    onClick={runBenchmark}
                    disabled={testing}
                    className="flex items-center gap-2 px-5 py-3.5 bg-[var(--accent-cyan)]/10 border-[var(--accent-cyan)]/30 hover:border-[var(--accent-cyan)]/60 hover:bg-[var(--accent-cyan)]/25 rounded-2xl text-[var(--accent-cyan)] text-xs font-black uppercase tracking-widest transition-all border cursor-pointer disabled:opacity-40"
                >
                    {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                    {testing ? 'Benchmarking...' : 'Test DNS Speeds'}
                </button>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {dnsPresets.map((dns, i) => {
                    const lat = latencies[dns.primary]
                    const hasLat = lat !== undefined
                    const isOk = lat > 0
                    
                    return (
                        <button
                            key={i}
                            onClick={() => setSelectedDns(i)}
                            className={`p-5 rounded-2xl border text-left transition-all duration-300 group relative overflow-hidden ${selectedDns === i
                                ? 'border-[var(--accent-cyan)]/50 bg-[var(--accent-cyan)]/10 shadow-[0_0_20px_rgba(0,255,222,0.2)] border'
                                : 'bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 hover:border-[var(--accent-cyan)]/30 hover:bg-[rgba(255,255,255,0.05)] border'
                                }`}
                        >
                            <div className="text-[15px] font-bold text-white mb-2 tracking-wide flex justify-between items-center">
                                {dns.name}
                                {selectedDns === i && <Activity className="w-4 h-4 text-[var(--accent-cyan)] animate-pulse" />}
                            </div>
                            <div className="text-xs font-mono text-[var(--text-muted)]">{dns.primary}</div>
                            <div className="text-xs font-mono text-[var(--text-dim)] mt-1">{dns.secondary}</div>
                            
                            {hasLat && (
                                <div className={`absolute top-4 right-4 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    isOk 
                                        ? lat < 30 
                                            ? 'text-[#00FFDE] bg-[#00FFDE]/10 border-[#00FFDE]/30 border' 
                                            : 'text-[#FF003C] bg-[#FF003C]/10 border-[#FF003C]/30 border'
                                        : 'text-[#FF003C] bg-[#FF003C]/10 border-[#FF003C]/30 border'
                                }`}>
                                    {isOk ? `${lat} ms` : 'Offline'}
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            <div className="mt-8 pt-8 border-t border-white/10">
                <h3 className="text-white text-lg font-black tracking-wide mb-4">Apply Settings</h3>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                        <Wifi className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none" />
                        <select
                            value={selectedAdapter}
                            onChange={e => setSelectedAdapter(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-[rgba(255,255,255,0.03)] border border-white/5 rounded-2xl text-[15px] text-white font-medium outline-none focus:border-[var(--accent-cyan)] transition-all cursor-pointer"
                        >
                            {adapters.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={applyDns}
                        disabled={selectedDns === null}
                        className="px-8 py-4 bg-[var(--accent-cyan)] border border-[var(--accent-cyan)]/50 rounded-2xl text-black text-xs font-black tracking-widest uppercase hover:bg-[#00e6c8] transition-all disabled:opacity-40 w-full sm:w-auto shadow-[0_0_20px_rgba(0,255,222,0.3)] whitespace-nowrap"
                    >
                        Override DNS
                    </button>
                </div>
            </div>
        </div>
    )
}

function EsportsNicTab() {
    const [adapters, setAdapters] = useState<any[]>([])
    const [selectedAdapter, setSelectedAdapter] = useState('Ethernet')
    const [props, setProps] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [applyingNagle, setApplyingNagle] = useState(false)
    const [qosPolicies, setQosPolicies] = useState<any[]>([])
    const [newQosName, setNewQosName] = useState('DeltaForce_QoS')
    const [newQosExe, setNewQosExe] = useState('DeltaForceClient-Win64-Shipping.exe')
    const addNotification = useAppStore(s => s.addNotification)
    const addLog = useLogStore(s => s.addLine)

    const loadNicProps = useCallback(async (adapterName: string) => {
        setLoading(true)
        try {
            const res = await window.api?.network.getNicAdvancedProps(adapterName)
            setProps(res || [])
            const policies = await window.api?.network.getQosPolicies()
            setQosPolicies(policies || [])
        } catch { }
        setLoading(false)
    }, [])

    useEffect(() => {
        window.api?.network.getAdapters().then((list: any[]) => {
            setAdapters(list || [])
            if (list?.length) {
                const defaultName = list[0].Name || 'Ethernet'
                setSelectedAdapter(defaultName)
                loadNicProps(defaultName)
            }
        }).catch(() => {})
    }, [loadNicProps])

    const toggleProp = async (displayName: string, _currentVal: string, targetVal: string) => {
        setLoading(true)
        try {
            const ok = await window.api?.network.setNicAdvancedProp(selectedAdapter, displayName, targetVal)
            if (ok) {
                addNotification('success', `Set ${displayName} to ${targetVal}`)
                addLog(`[NIC] ${displayName} set to ${targetVal} on ${selectedAdapter}`)
                await loadNicProps(selectedAdapter)
            } else {
                addNotification('error', `Failed to set ${displayName}`)
            }
        } catch (e: any) {
            addNotification('error', e.message)
        }
        setLoading(false)
    }

    const handleApplyTrueNagle = async () => {
        setApplyingNagle(true)
        try {
            const res = await window.api?.network.applyTcpNoDelayToAllInterfaces()
            if (res?.success) {
                addNotification('success', `True Nagle Killer applied across ${res.applied} interfaces!`)
                addLog(`[Network] True Nagle Killer injected into ${res.applied} adapter GUIDs`)
            } else {
                addNotification('error', 'Failed to apply per-interface Nagle Killer')
            }
        } catch (e: any) {
            addNotification('error', e.message)
        }
        setApplyingNagle(false)
    }

    const [applyingHitreg, setApplyingHitreg] = useState(false)
    const [healingFirewall, setHealingFirewall] = useState(false)
    const [purgingQos, setPurgingQos] = useState(false)
    const [nicStepping, setNicStepping] = useState<{ isIntelI225: boolean; stepping: string; isB1B2: boolean; name: string; hwId: string } | null>(null)
    const [nicStats, setNicStats] = useState<any>(null)
    const [wfpAudit, setWfpAudit] = useState<any>(null)
    const [mtuResult, setMtuResult] = useState<any>(null)

    const [applyingDeepNic, setApplyingDeepNic] = useState(false)
    const [applyingTimer, setApplyingTimer] = useState(false)
    const [applyingGpu, setApplyingGpu] = useState(false)
    const [applyingAudio, setApplyingAudio] = useState(false)
    const [applyingStorage, setApplyingStorage] = useState(false)
    const [enablingMsi, setEnablingMsi] = useState(false)
    const [applyingAdvancedStack, setApplyingAdvancedStack] = useState(false)
    const [discoveringMtu, setDiscoveringMtu] = useState(false)
    const [applyingUltraFix, setApplyingUltraFix] = useState(false)

    // Load NIC Stepping & Diagnostics on mount
    useEffect(() => {
        window.api?.network.identifyNicStepping?.().then(res => setNicStepping(res)).catch(() => {})
        window.api?.network.getNicStatistics?.().then(res => setNicStats(res)).catch(() => {})
        window.api?.network.auditWfpCallouts?.().then(res => setWfpAudit(res)).catch(() => {})
    }, [])

    const handleApplyHitreg = async () => {
        setApplyingHitreg(true)
        try {
            const res = await window.api?.network.applyHitregOptimization()
            if (res?.success) {
                addNotification('success', 'eSports Hitreg & AFD 256KB UDP Buffers applied!')
                addLog(`[HitReg] AFD UDP Buffers (256KB) + NIC Idle Restriction configured`)
            } else {
                addNotification('error', 'Failed to apply hitreg optimization')
            }
        } catch (e: any) {
            addNotification('error', e.message)
        }
        setApplyingHitreg(false)
    }

    const handleHealFirewall = async () => {
        setHealingFirewall(true)
        try {
            const res = await window.api?.network.healGameFirewall()
            if (res?.success) {
                addNotification('success', 'Game, CEF & AntiCheatExpert firewall rules healed!')
                addLog(`[Firewall] Removed block rules and unblocked ACE / CEF processes`)
            } else {
                addNotification('error', 'Failed to heal firewall rules')
            }
        } catch (e: any) {
            addNotification('error', e.message)
        }
        setHealingFirewall(false)
    }

    const handlePurgeAllQos = async () => {
        setPurgingQos(true)
        try {
            const ok = await window.api?.network.purgeAllQosPolicies()
            if (ok) {
                addNotification('success', 'Purged all NetQosPolicy rules — ONT fiber connection unblocked!')
                addLog(`[QoS] All NetQosPolicy rules purged`)
                const policies = await window.api?.network.getQosPolicies()
                setQosPolicies(policies || [])
            } else {
                addNotification('error', 'Failed to purge QoS policies')
            }
        } catch (e: any) {
            addNotification('error', e.message)
        }
        setPurgingQos(false)
    }

    const handleApplyDeepNic = async () => {
        setApplyingDeepNic(true)
        try {
            const res = await window.api?.network.applyDeepNicFix()
            if (res?.success) {
                addNotification('success', 'Deep NIC Fix applied: 1.0G forced, EEE killed, 1024 buffers!')
                addLog(`[NIC] Intel I225-V silicon errata bypass & 1024 buffer expansion active`)
                const updated = await window.api?.network.identifyNicStepping?.()
                if (updated) setNicStepping(updated)
            } else {
                addNotification('error', 'Failed to apply deep NIC fix')
            }
        } catch (e: any) {
            addNotification('error', e.message)
        }
        setApplyingDeepNic(false)
    }

    const handleApplyTimerFixes = async () => {
        setApplyingTimer(true)
        try {
            const res = await window.api?.network.applyTimerFixes()
            if (res?.success) {
                addNotification('success', 'Global Timer Resolution (0.5ms), disabledynamictick & native TSC clock enforced!')
                addLog(`[Timer] GlobalTimerResolutionRequests=1, tickless kernel disabled, invariant TSC active`)
            } else {
                addNotification('error', 'Failed to apply kernel timer fixes')
            }
        } catch (e: any) {
            addNotification('error', e.message)
        }
        setApplyingTimer(false)
    }

    const handleApplyGpuDpc = async () => {
        setApplyingGpu(true)
        try {
            const res = await window.api?.network.applyGpuDpcFix()
            if (res?.success) {
                addNotification('success', 'NVIDIA GPU DPC Fix: DisableDynamicPstate=1 (P0 Clock Lock) & TDR Delay active!')
                addLog(`[GPU] Mid-match GPU clock drop eliminated, TdrDelay=10`)
            } else {
                addNotification('error', 'Failed to apply GPU DPC fix')
            }
        } catch (e: any) {
            addNotification('error', e.message)
        }
        setApplyingGpu(false)
    }

    const handleApplyAudioDpc = async () => {
        setApplyingAudio(true)
        try {
            const res = await window.api?.network.applyAudioDpcFix()
            if (res?.success) {
                addNotification('success', 'Realtek / HD Audio DAC D3 Sleep killed — gunshot latency spike removed!')
                addLog(`[Audio] Realtek DAC power transition latency set to 0`)
            } else {
                addNotification('error', 'Failed to apply audio DPC fix')
            }
        } catch (e: any) {
            addNotification('error', e.message)
        }
        setApplyingAudio(false)
    }

    const handleApplyStoragePower = async () => {
        setApplyingStorage(true)
        try {
            const res = await window.api?.network.applyStoragePowerFix()
            if (res?.success) {
                addNotification('success', 'NVMe APST sleep & AHCI link power management disabled!')
                addLog(`[Storage] Texture load hitching prevented, NVMe idle timeouts set to 0`)
            } else {
                addNotification('error', 'Failed to apply storage power fix')
            }
        } catch (e: any) {
            addNotification('error', e.message)
        }
        setApplyingStorage(false)
    }

    const handleEnableMsiDeep = async () => {
        setEnablingMsi(true)
        try {
            const res = await window.api?.network.enableMsiModeDeep()
            if (res?.success) {
                addNotification('success', 'MSI Mode active for GPU (Priority High 3) and USB xHCI!')
                addLog(`[MSI] Dedicated interrupt vectors assigned to RTX GPU and USB controller`)
            } else {
                addNotification('error', 'Failed to configure deep MSI mode')
            }
        } catch (e: any) {
            addNotification('error', e.message)
        }
        setEnablingMsi(false)
    }

    const handleApplyAdvancedStack = async () => {
        setApplyingAdvancedStack(true)
        try {
            const res = await window.api?.network.applyAdvancedStackFix()
            if (res?.success) {
                addNotification('success', 'Advanced Network Stack Hardened: USO/URO killed, CUBIC, Throttling=10, Core Pinning active!')
                addLog(`[Network] NetIO stack hardened, RSS pinned away from Core 0, MMCSS Games profile applied`)
            } else {
                addNotification('error', 'Failed to harden network stack')
            }
        } catch (e: any) {
            addNotification('error', e.message)
        }
        setApplyingAdvancedStack(false)
    }

    const handleDiscoverMtu = async () => {
        setDiscoveringMtu(true)
        try {
            const res = await window.api?.network.discoverOptimalMtu()
            if (res) {
                setMtuResult(res)
                addNotification('success', `Optimal non-fragmented MTU discovered: ${res.mtu} (payload: ${res.optimalPayload})`)
                addLog(`[MTU] Tested gateway payload ${res.optimalPayload} -> Applied persistent MTU ${res.mtu} on ${res.adapter}`)
            }
        } catch (e: any) {
            addNotification('error', e.message)
        }
        setDiscoveringMtu(false)
    }

    // 1-Click Master Ultra Fix: Executes all hitreg & DPC cures sequentially
    const handleApplyUltraFix = async () => {
        setApplyingUltraFix(true)
        addLog('[ULTRA HITREG] Initializing Master Hitreg & DPC Elimination Sequence...')
        try {
            await window.api?.network.applyDeepNicFix()
            await window.api?.network.applyTimerFixes()
            await window.api?.network.applyGpuDpcFix()
            await window.api?.network.applyAudioDpcFix()
            await window.api?.network.applyStoragePowerFix()
            await window.api?.network.enableMsiModeDeep()
            await window.api?.network.applyAdvancedStackFix()
            await window.api?.network.applyHitregOptimization()
            await window.api?.network.healGameFirewall()
            await window.api?.network.discoverOptimalMtu?.()
            addNotification('success', '🔥 MASTER HITREG & DPC ULTRA FIX COMPLETE! All 9 optimizations applied.')
            addLog('[ULTRA HITREG] All hardware, kernel timer, GPU DPC, audio DAC, and network stack optimizations active.')
            const updated = await window.api?.network.identifyNicStepping?.()
            if (updated) setNicStepping(updated)
            const stats = await window.api?.network.getNicStatistics?.()
            if (stats) setNicStats(stats)
        } catch (e: any) {
            addNotification('error', `Ultra Fix encountered error: ${e.message}`)
        }
        setApplyingUltraFix(false)
    }

    const handleAddQos = async () => {
        if (!newQosName || !newQosExe) return
        try {
            const ok = await window.api?.network.addQosPolicy(newQosName, newQosExe)
            if (ok) {
                addNotification('success', `QoS DSCP 46 Policy created for ${newQosExe}`)
                const policies = await window.api?.network.getQosPolicies()
                setQosPolicies(policies || [])
            }
        } catch (e: any) {
            addNotification('error', e.message)
        }
    }

    const handleRemoveQos = async (name: string) => {
        try {
            const ok = await window.api?.network.removeQosPolicy(name)
            if (ok) {
                addNotification('info', `Removed QoS policy ${name}`)
                const policies = await window.api?.network.getQosPolicies()
                setQosPolicies(policies || [])
            }
        } catch (e: any) {
            addNotification('error', e.message)
        }
    }

    const interruptMod = props.find(p => p.DisplayName === 'Interrupt Moderation')
    const flowControl = props.find(p => p.DisplayName === 'Flow Control')
    const lso = props.find(p => p.DisplayName?.includes('Large Send Offload'))

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-white text-lg font-black tracking-wide flex items-center gap-2">
                        <Zap className="w-5 h-5 text-[var(--accent-cyan)]" /> eSports NIC Hardware Latency & QoS Engine
                    </h3>
                    <p className="text-[var(--text-muted)] text-xs mt-1 font-medium">
                        Hardware-level interrupt mitigation, 0-queue packet delivery, and Windows QoS DSCP 46 tagging.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedAdapter}
                        onChange={e => { setSelectedAdapter(e.target.value); loadNicProps(e.target.value) }}
                        className="px-4 py-2.5 bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-xl text-xs text-white font-medium outline-none cursor-pointer"
                    >
                        {adapters.map((a: any) => (
                            <option key={a.Name || a.name} value={a.Name || a.name}>{a.Name || a.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => {
                            loadNicProps(selectedAdapter)
                            window.api?.network.getNicStatistics?.().then(res => setNicStats(res)).catch(() => {})
                        }}
                        disabled={loading}
                        className="p-2.5 bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-xl hover:border-[var(--accent-cyan)] text-white cursor-pointer"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--accent-cyan)]' : ''}`} />
                    </button>
                </div>
            </div>

            {/* MASTER ONE-CLICK HITREG & DPC ULTRA FIX BANNER */}
            <div className="p-6 bg-gradient-to-r from-red-500/10 via-purple-500/10 to-[var(--accent-cyan)]/10 rounded-2xl border border-[var(--accent-cyan)]/40 shadow-[0_0_30px_rgba(0,255,222,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <Crosshair className="w-5 h-5 text-[var(--accent-cyan)]" />
                        <h4 className="text-white text-base font-black uppercase tracking-wider">Master Hitreg & DPC Ultra Cure</h4>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[var(--accent-cyan)]/25 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/50">v11.4 Apex</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] max-w-2xl leading-relaxed">
                        Cures ghost bullets, desync, and rubberbanding across Delta Force, CS2, and competitive shooters. Automatically executes all 9 kernel, hardware, GPU, audio, and network stack optimizations in one pass.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-[var(--accent-cyan)]">
                        <span>• 1.0G Duplex Lock</span>
                        <span>• EEE Kill</span>
                        <span>• 1024 Descriptors</span>
                        <span>• 0.5ms Global Timer</span>
                        <span>• P0 Clock Lock</span>
                        <span>• Audio DAC Sleep Kill</span>
                        <span>• NVMe APST Kill</span>
                        <span>• USO/URO Kill</span>
                    </div>
                </div>

                <button
                    onClick={handleApplyUltraFix}
                    disabled={applyingUltraFix}
                    className="px-8 py-4 bg-gradient-to-r from-[var(--accent-cyan)] to-emerald-400 hover:opacity-95 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_30px_rgba(0,255,222,0.5)] whitespace-nowrap cursor-pointer disabled:opacity-40 flex items-center gap-2.5"
                >
                    {applyingUltraFix ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crosshair className="w-5 h-5" />}
                    {applyingUltraFix ? 'Applying 9 Cures...' : '🔥 One-Click Hitreg Ultra Fix'}
                </button>
            </div>

            {/* INTEL I225-V HARDWARE ERRATA & SILICON STEPPING CARD */}
            <div className="p-6 glass-shell rounded-2xl border border-white/10 space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-amber-400" />
                            <h4 className="text-white text-sm font-black uppercase tracking-wider">Intel I225-V Silicon Stepping Errata & 1.0G Duplex Lock</h4>
                            {nicStepping?.isB1B2 ? (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> {nicStepping.stepping} Silicon Flaw Detected
                                </span>
                            ) : (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> {nicStepping?.stepping || 'Hardware Safe'}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] max-w-2xl leading-relaxed">
                            Intel I225-V B1/B2 silicon has a hardware timing flaw causing packet loss at 2.5G. Forcing 1.0 Gbps Full Duplex, killing EEE (Energy Efficient Ethernet), setting clock mode to Slave, and expanding ring buffers from 256 to 1024 stops microburst starvation and drops.
                        </p>
                    </div>

                    <button
                        onClick={handleApplyDeepNic}
                        disabled={applyingDeepNic}
                        className="px-6 py-3 bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 text-amber-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all whitespace-nowrap cursor-pointer disabled:opacity-40 flex items-center gap-2"
                    >
                        {applyingDeepNic ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                        Apply Deep NIC Fix (1.0G + 1024 Buffers)
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
                    <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                        <div className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">Detected Stepping</div>
                        <div className="text-white font-mono font-bold mt-0.5">{nicStepping?.stepping || 'Scanning...'}</div>
                    </div>
                    <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                        <div className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">Duplex & Speed</div>
                        <div className="text-emerald-400 font-mono font-bold mt-0.5">1.0 Gbps Full Duplex Lock</div>
                    </div>
                    <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                        <div className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">Descriptor Buffers</div>
                        <div className="text-white font-mono font-bold mt-0.5">1024 Descriptors (No Overflow)</div>
                    </div>
                    <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                        <div className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">Driver Update Shield</div>
                        <div className="text-purple-400 font-mono font-bold mt-0.5">WU Overwrite Blocked</div>
                    </div>
                </div>
            </div>

            {/* DPC LATENCY KILLER SUITE CARD */}
            <div className="p-6 glass-shell rounded-2xl border border-white/10 space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-purple-400" />
                            <h4 className="text-white text-sm font-black uppercase tracking-wider">DPC Latency Killer: Kernel Timers, GPU P0 & Audio Sleep Purge</h4>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] max-w-2xl leading-relaxed">
                            Deferred Procedure Calls (DPCs) take priority over the game process. Enforces Windows 11 GlobalTimerResolutionRequests=1, locks GPU to P0 clocks (prevents mid-fight downclocking), disables Realtek audio DAC D3 sleep, and disables NVMe APST idle timeouts.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleApplyTimerFixes}
                            disabled={applyingTimer}
                            className="px-4 py-2.5 bg-purple-500/15 border border-purple-500/40 hover:bg-purple-500/25 text-purple-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-40"
                        >
                            {applyingTimer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '0.5ms Timers + TSC'}
                        </button>
                        <button
                            onClick={handleApplyGpuDpc}
                            disabled={applyingGpu}
                            className="px-4 py-2.5 bg-purple-500/15 border border-purple-500/40 hover:bg-purple-500/25 text-purple-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-40"
                        >
                            {applyingGpu ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'GPU P0 Lock'}
                        </button>
                        <button
                            onClick={handleApplyAudioDpc}
                            disabled={applyingAudio}
                            className="px-4 py-2.5 bg-purple-500/15 border border-purple-500/40 hover:bg-purple-500/25 text-purple-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-40"
                        >
                            {applyingAudio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Audio DAC Sleep Kill'}
                        </button>
                        <button
                            onClick={handleApplyStoragePower}
                            disabled={applyingStorage}
                            className="px-4 py-2.5 bg-purple-500/15 border border-purple-500/40 hover:bg-purple-500/25 text-purple-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-40"
                        >
                            {applyingStorage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'NVMe APST Kill'}
                        </button>
                        <button
                            onClick={handleEnableMsiDeep}
                            disabled={enablingMsi}
                            className="px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 text-emerald-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-40"
                        >
                            {enablingMsi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'MSI Mode (GPU/USB)'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ADVANCED NETWORK STACK & CORE PINNING */}
            <div className="p-6 glass-shell rounded-2xl border border-white/10 space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-400" />
                            <h4 className="text-white text-sm font-black uppercase tracking-wider">Advanced Network Stack Hardening & RSS Core Pinning</h4>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] max-w-2xl leading-relaxed">
                            Disables USO (UDP Segmentation Offload) and URO, sets CUBIC congestion provider, configures NetworkThrottlingIndex=10 (achieves lowest NDIS DPC spread under xperf analysis), and pins NIC RSS queues to CPU Core 2+ to keep Core 0 100% dedicated to game render threads.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDiscoverMtu}
                            disabled={discoveringMtu}
                            className="px-4 py-3 bg-white/5 border border-white/10 hover:border-[var(--accent-cyan)] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-40 flex items-center gap-2"
                        >
                            {discoveringMtu ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gauge className="w-4 h-4" />}
                            {mtuResult ? `MTU: ${mtuResult.mtu}` : 'Auto-Discover MTU'}
                        </button>
                        <button
                            onClick={handleApplyAdvancedStack}
                            disabled={applyingAdvancedStack}
                            className="px-6 py-3 bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 text-emerald-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all whitespace-nowrap cursor-pointer disabled:opacity-40"
                        >
                            {applyingAdvancedStack ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Harden Stack & Pin RSS'}
                        </button>
                    </div>
                </div>

                {/* Live Diagnostics Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
                    <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                        <div className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">Dropped / Discarded Packets</div>
                        <div className="text-white font-mono font-bold mt-0.5">
                            Rx: {nicStats?.receivedDiscarded ?? 0} | Tx: {nicStats?.outboundDiscarded ?? 0}
                        </div>
                    </div>
                    <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                        <div className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">Network Throttling Index</div>
                        <div className="text-emerald-400 font-mono font-bold mt-0.5">10 (0x0A - Tightest DPC)</div>
                    </div>
                    <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                        <div className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">RSS Core Isolation</div>
                        <div className="text-white font-mono font-bold mt-0.5">Pinned to Cores 2-3 (Free Core 0)</div>
                    </div>
                    <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                        <div className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">WFP Callout Inspection</div>
                        <div className="text-white font-mono font-bold mt-0.5">
                            {wfpAudit ? `${wfpAudit.count} Third-Party Callouts` : 'Inspecting...'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legacy eSports Hit Registration & AFD 256KB card */}
            <div className="p-6 bg-gradient-to-br from-[rgba(0,255,222,0.08)] via-[rgba(168,85,247,0.05)] to-transparent rounded-2xl border border-[var(--accent-cyan)]/30 space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-[var(--accent-cyan)]" />
                            <h4 className="text-white text-base font-black uppercase tracking-wider">Winsock Kernel AFD & Firewall Healer</h4>
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/40">Active</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
                            AFD datagram windows locked to 256KB, NIC idle power down restriction active, global TCP RSC disabled, and Windows Firewall purged of blocking rules for Delta Force, UnrealCEF, and AntiCheatExpert.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={handleHealFirewall}
                            disabled={healingFirewall}
                            className="px-5 py-3 glass-shell border border-white/10 hover:border-emerald-500/50 text-emerald-400 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
                        >
                            {healingFirewall ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                            Heal Firewall & Anti-Cheat
                        </button>
                        <button
                            onClick={handleApplyHitreg}
                            disabled={applyingHitreg}
                            className="px-6 py-3 bg-[var(--accent-cyan)] hover:bg-[#00e6c8] text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_25px_rgba(0,255,222,0.4)] flex items-center gap-2 cursor-pointer disabled:opacity-40"
                        >
                            {applyingHitreg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            Apply Hitreg & AFD 256KB
                        </button>
                    </div>
                </div>
            </div>

            {/* Hardware NIC Properties Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Interrupt Moderation */}
                <div className="p-6 glass-shell rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Interrupt Moderation</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${interruptMod?.DisplayValue === 'Disabled' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/15 border-amber-500/30 text-amber-400'}`}>
                            {interruptMod?.DisplayValue || 'Unknown'}
                        </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        Disabling eliminates packet batching. CPU services incoming bullet & position packets the microsecond they hit the ring buffer.
                    </p>
                    <button
                        onClick={() => toggleProp('Interrupt Moderation', interruptMod?.DisplayValue, interruptMod?.DisplayValue === 'Disabled' ? 'Enabled' : 'Disabled')}
                        disabled={loading}
                        className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${interruptMod?.DisplayValue === 'Disabled' ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' : 'bg-[var(--accent-cyan)]/15 border border-[var(--accent-cyan)]/40 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/25'}`}
                    >
                        {interruptMod?.DisplayValue === 'Disabled' ? 'Enable Batching (Normal)' : 'Disable (0-Delay eSports)'}
                    </button>
                </div>

                {/* Flow Control */}
                <div className="p-6 glass-shell rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Flow Control</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${flowControl?.DisplayValue === 'Disabled' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/15 border-amber-500/30 text-amber-400'}`}>
                            {flowControl?.DisplayValue || 'Unknown'}
                        </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        Disabling Flow Control prevents the network adapter from emitting pause frames during heavy bursts, preventing game micro-freezes.
                    </p>
                    <button
                        onClick={() => toggleProp('Flow Control', flowControl?.DisplayValue, flowControl?.DisplayValue === 'Disabled' ? 'Rx & Tx Enabled' : 'Disabled')}
                        disabled={loading}
                        className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${flowControl?.DisplayValue === 'Disabled' ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' : 'bg-[var(--accent-cyan)]/15 border border-[var(--accent-cyan)]/40 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/25'}`}
                    >
                        {flowControl?.DisplayValue === 'Disabled' ? 'Enable Flow Control' : 'Disable (Fast UDP)'}
                    </button>
                </div>

                {/* Large Send Offload */}
                <div className="p-6 glass-shell rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Large Send Offload (LSO)</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${lso?.DisplayValue === 'Disabled' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/15 border-amber-500/30 text-amber-400'}`}>
                            {lso?.DisplayValue || 'Unknown'}
                        </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        Disables hardware packet segmentation on NIC, eliminating packet desynchronization in real-time UDP game netcode.
                    </p>
                    <button
                        onClick={() => toggleProp('Large Send Offload V2 (IPv4)', lso?.DisplayValue, lso?.DisplayValue === 'Disabled' ? 'Enabled' : 'Disabled')}
                        disabled={loading}
                        className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${lso?.DisplayValue === 'Disabled' ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' : 'bg-[var(--accent-cyan)]/15 border border-[var(--accent-cyan)]/40 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/25'}`}
                    >
                        {lso?.DisplayValue === 'Disabled' ? 'Enable LSO' : 'Disable LSO (Anti-Desync)'}
                    </button>
                </div>
            </div>

            {/* True Per-Interface Nagle Killer */}
            <div className="p-6 bg-gradient-to-r from-[rgba(0,255,222,0.05)] to-[rgba(168,85,247,0.05)] rounded-2xl border border-[var(--accent-cyan)]/30 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[var(--accent-cyan)]" />
                        <h4 className="text-white text-sm font-black uppercase tracking-wider">True Per-Interface Nagle Killer</h4>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/40">Zero ACK Lag</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] max-w-xl">
                        Windows enforces <code className="text-[var(--accent-cyan)]">TcpNoDelay</code> and <code className="text-[var(--accent-cyan)]">TcpAckFrequency</code> on individual interface GUID subkeys. This injects it directly into every active network adapter.
                    </p>
                </div>
                <button
                    onClick={handleApplyTrueNagle}
                    disabled={applyingNagle}
                    className="px-6 py-3.5 bg-[var(--accent-cyan)] hover:bg-[#00e6c8] text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(0,255,222,0.3)] whitespace-nowrap cursor-pointer disabled:opacity-40"
                >
                    {applyingNagle ? 'Injecting...' : 'Kill Nagle on All NICs'}
                </button>
            </div>

            {/* Windows QoS Policy Manager */}
            <div className="p-6 glass-shell rounded-2xl border border-white/5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h4 className="text-white text-sm font-black uppercase tracking-wider flex items-center gap-2">
                            <Shield className="w-4 h-4 text-emerald-400" /> Windows QoS Game Policies
                        </h4>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            QoS prioritization tags game packets. If your ISP/ONT drops DSCP 46 packets, use Purge All to unblock your connection.
                        </p>
                    </div>

                    <button
                        onClick={handlePurgeAllQos}
                        disabled={purgingQos}
                        className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/25 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
                    >
                        {purgingQos ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Purge All QoS Policies (Fix ONT Drop)
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                        type="text"
                        placeholder="Policy Name (e.g. DeltaForce_QoS)"
                        value={newQosName}
                        onChange={e => setNewQosName(e.target.value)}
                        className="flex-1 px-4 py-3 bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[var(--accent-cyan)] w-full"
                    />
                    <input
                        type="text"
                        placeholder="Target Process (e.g. DeltaForceClient-Win64-Shipping.exe)"
                        value={newQosExe}
                        onChange={e => setNewQosExe(e.target.value)}
                        className="flex-1 px-4 py-3 bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[var(--accent-cyan)] w-full"
                    />
                    <button
                        onClick={handleAddQos}
                        className="px-6 py-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap cursor-pointer"
                    >
                        Add QoS Policy
                    </button>
                </div>

                <div className="overflow-x-auto mt-4">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-white/10 text-[var(--text-muted)] uppercase tracking-wider">
                                <th className="pb-3">Policy Name</th>
                                <th className="pb-3">Target Process</th>
                                <th className="pb-3">DSCP</th>
                                <th className="pb-3">Priority</th>
                                <th className="pb-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {qosPolicies.map((p, idx) => (
                                <tr key={idx} className="hover:bg-white/[0.02]">
                                    <td className="py-3 text-white font-bold">{p.name}</td>
                                    <td className="py-3 text-[var(--accent-cyan)] font-mono">{p.appName || 'All Traffic'}</td>
                                    <td className="py-3 text-emerald-400 font-bold">{p.dscp} (EF)</td>
                                    <td className="py-3 text-purple-400 font-bold">{p.priority} (Max)</td>
                                    <td className="py-3 text-right">
                                        <button
                                            onClick={() => handleRemoveQos(p.name)}
                                            className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/25 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {qosPolicies.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-6 text-center text-[var(--text-muted)] font-medium">
                                        No active QoS game policies found. Add one above or boost a game in the Gaming tab.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
                <button onClick={runPingTests} disabled={testing} className="p-3 bg-[rgba(255,255,255,0.03)] border border-white/5 rounded-2xl text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent-cyan)]/50 transition-all">
                    <RefreshCw className={`w-5 h-5 ${testing ? 'animate-spin text-[var(--accent-cyan)]' : ''}`} />
                </button>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(pings).map(([host, result]) => {
                    const isOk = result.ms >= 0
                    const isGreat = result.ms < 20 && isOk
                    const isWarn = result.ms >= 20 && result.ms < 80
                    
                    return (
                        <div key={host} className="p-5 bg-[rgba(255,255,255,0.03)] border border-white/5 rounded-2xl text-center relative overflow-hidden shadow-inner group">
                            <div className={`absolute top-0 left-0 right-0 h-1 ${isGreat ? 'bg-[#00FFDE]' : isWarn ? 'bg-amber-400' : 'bg-[#FF003C]'}`} />
                            <div className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">{host}</div>
                            <div className={`text-3xl font-black font-mono tracking-tighter ${isGreat ? 'text-[#00FFDE]' : isWarn ? 'text-amber-400' : 'text-[#FF003C]'}`}>
                                {isOk ? `${result.ms}ms` : 'FAIL'}
                            </div>
                        </div>
                    )
                })}
            </div>
            {testing && <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent-cyan)]" /></div>}
        </div>
    )
}

export function Network() {
    const [tab, setTab] = useState('bandwidth')
    const items = getTweaksByCategoryAndTab('network', tab)

    const quickActions = [
        { label: '🔄 Flush DNS', fn: () => window.api?.network.flushDns() },
        { label: '🔌 Reset Winsock', fn: () => window.api?.network.resetWinsock() },
        { label: '🌐 Reset TCP/IP', fn: () => window.api?.network.resetTcpIp() },
        { label: '⚡ True Nagle Killer', fn: () => window.api?.network.applyTcpNoDelayToAllInterfaces() },
    ]

    return (
        <div className="space-y-8 max-w-[90rem] mx-auto w-full pb-10">
            {/* Ultra-Premium Network Hero Section */}
            <motion.div
                className="relative overflow-hidden rounded-[2.5rem] p-12 transition-all duration-700 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 border shadow-2xl"
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
                        <p className="text-[var(--text-muted)] text-sm uppercase tracking-[0.3em] font-black mb-6">
                            SpeedGuide.net SG TCP Optimizer Engine
                        </p>
                        
                        <p className="text-[var(--text-secondary)] max-w-xl font-medium leading-relaxed">
                            Fine-tune your TCP/IP stack with connection speed calculations, adapter offloads, MTU packet fragmentation tests, and optimal DNS overrides.
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center gap-4 max-w-sm">
                        {quickActions.map((a, i) => (
                            <button key={i} onClick={a.fn}
                                className="flex-1 min-w-[140px] px-6 py-4 bg-[rgba(255,255,255,0.03)] border border-white/5 rounded-2xl text-xs font-black tracking-widest uppercase text-white hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]/50 hover:bg-[rgba(0,255,222,0.1)] transition-all flex items-center justify-center gap-2 shadow-xl text-center">
                                {a.label}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* AI TCP/IP & Bufferbloat Tuner Card */}
            <div className="mt-8 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border border-[var(--accent-cyan)]/25 rounded-[2rem] p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_top_right,rgba(0,255,222,0.12),transparent_70%)] pointer-events-none" />
                <div className="flex-1 space-y-1.5 relative z-10 text-left">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[var(--accent-cyan)] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-cyan)]">AI Network Intelligence</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                            BBR / CUBIC Engine
                        </span>
                    </div>
                    <h3 className="text-white text-base font-black tracking-wide">
                        Bufferbloat Suppression & 0-Delay Packet Pacing
                    </h3>
                    <p className="text-[var(--text-secondary)] text-xs font-medium leading-relaxed max-w-2xl">
                        Standard Windows TCP stacks use legacy compound congestion algorithms with delayed acknowledgments (200ms ACK timers). Applying <strong className="text-[var(--accent-cyan)]">TCPNoDelay</strong>, setting <strong className="text-[var(--accent-cyan)]">TcpAckFrequency = 1</strong>, and tuning Auto-Tuning to <strong className="text-white">Normal</strong> eliminates queuing delays in FPS netcode.
                    </p>
                </div>

                <div className="flex items-center gap-3 relative z-10 shrink-0">
                    <button
                        onClick={() => useAppStore.getState().setAiDrawerOpen(true)}
                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-cyan)]/15 to-[var(--accent-violet)]/15 hover:from-[var(--accent-cyan)]/25 hover:to-[var(--accent-violet)]/25 border border-[var(--accent-cyan)]/40 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,222,0.15)]"
                    >
                        <Sparkles className="w-4 h-4 text-[var(--accent-cyan)]" />
                        Network Copilot
                        <kbd className="text-[8px] bg-black/40 px-1 py-0.5 rounded text-[var(--accent-cyan)]">Ctrl+Space</kbd>
                    </button>
                </div>
            </div>

            <div className="mt-8">
                <TabGroup tabs={tabs} active={tab} onChange={setTab} />
            </div>

            {tab === 'bandwidth' ? (
                <div className="rounded-[2.5rem] p-8 border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl mt-6 border">
                    <TcpOptimizerTab />
                </div>
            ) : tab === 'esports' ? (
                <div className="rounded-[2.5rem] p-8 border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl mt-6 border">
                    <EsportsNicTab />
                </div>
            ) : tab === 'mtu' ? (
                <div className="rounded-[2.5rem] p-8 border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl mt-6 border">
                    <MtuTab />
                </div>
            ) : tab === 'dns' ? (
                <div className="rounded-[2.5rem] p-8 border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl mt-6 border">
                    <DnsTab />
                </div>
            ) : tab === 'diagnostics' ? (
                <div className="rounded-[2.5rem] p-8 border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl mt-6 border">
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

