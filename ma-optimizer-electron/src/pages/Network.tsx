import React, { useState, useEffect, useCallback } from 'react'
import { Globe, RefreshCw, Loader2, Wifi, Activity, Sliders, Shield, Download, Upload, Cpu, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { TweakCard } from '../components/ui/TweakCard'
import { TabGroup } from '../components/ui/TabGroup'
import { useTweak } from '../hooks/useTweak'
import { getTweaksByCategoryAndTab } from '../data/tweaks'
import { useAppStore } from '../store/appStore'
import { useLogStore } from '../store/logStore'

const tabs = [
    { id: 'bandwidth', label: 'SpeedGuide TCP Tuner' },
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
            
            // Gaming & low-latency registry tweaks
            await window.api?.registry.set('HKLM', 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile', 'NetworkThrottlingIndex', 4294967295, 'DWord')
            await window.api?.registry.set('HKLM', 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile', 'SystemResponsiveness', 0, 'DWord')
            await window.api?.registry.set('HKLM', 'SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters', 'TcpNoDelay', 1, 'DWord')
            await window.api?.registry.set('HKLM', 'SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters', 'TcpAckFrequency', 1, 'DWord')

            addLog(`[SG-TCP] Applied SpeedGuide.net optimal profile for ${bandwidth} Mbps`)
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

            <div className="mt-8">
                <TabGroup tabs={tabs} active={tab} onChange={setTab} />
            </div>

            {tab === 'bandwidth' ? (
                <div className="rounded-[2.5rem] p-8 border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl mt-6 border">
                    <TcpOptimizerTab />
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

