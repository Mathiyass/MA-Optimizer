import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Network, Zap, ShieldCheck, Activity, RefreshCw, Loader2, Globe, Radio, Cpu } from 'lucide-react'
import { useAppStore } from '../store/appStore'

export function ExitLagPage() {
    const [config, setConfig] = useState<any>({ multipathEnabled: true, jitterGuardEnabled: true, protocolPreference: 'UDP' })
    const [routes, setRoutes] = useState<any[]>([])
    const [selectedGame, setSelectedGame] = useState('cs2')
    const [scanning, setScanning] = useState(false)
    const [routeActive, setRouteActive] = useState(false)
    const addNotification = useAppStore(s => s.addNotification)

    const fetchConfig = async () => {
        try {
            const cfg = await window.api?.exitlag.getConfig()
            if (cfg) setConfig(cfg)
        } catch {}
    }

    const scanRoutes = async (gameId: string) => {
        setScanning(true)
        try {
            const list = await window.api?.exitlag.pingRoutes(gameId)
            setRoutes(list || [])
        } catch {}
        setScanning(false)
    }

    useEffect(() => {
        fetchConfig()
        scanRoutes(selectedGame)
    }, [selectedGame])

    const handleToggleMultipath = async (enabled: boolean) => {
        const updated = await window.api?.exitlag.updateConfig({ multipathEnabled: enabled })
        if (updated) setConfig(updated)
        addNotification('info', `Multi-Path Routing ${enabled ? 'ENABLED' : 'DISABLED'}`)
    }

    const handleToggleJitterGuard = async (enabled: boolean) => {
        const updated = await window.api?.exitlag.updateConfig({ jitterGuardEnabled: enabled })
        if (updated) setConfig(updated)
        addNotification('info', `Jitter Guard ${enabled ? 'ENABLED' : 'DISABLED'}`)
    }

    const handleProtocolChange = async (proto: 'UDP' | 'TCP' | 'AUTO') => {
        const updated = await window.api?.exitlag.updateConfig({ protocolPreference: proto })
        if (updated) setConfig(updated)
        addNotification('info', `Network Protocol set to ${proto}`)
    }

    const handleApplyRoute = async () => {
        try {
            const ok = await window.api?.exitlag.enableMultipathRoute(`${selectedGame}.exe`)
            if (ok) {
                setRouteActive(true)
                addNotification('success', `Multi-Path Connection Active for ${selectedGame.toUpperCase()}!`)
            }
        } catch {
            addNotification('error', 'Failed engaging Multipath route')
        }
    }

    const handleStopRoute = async () => {
        await window.api?.exitlag.stopRoute()
        setRouteActive(false)
        addNotification('info', 'Multipath route stopped')
    }

    return (
        <div className="space-y-8 max-w-[90rem] mx-auto w-full pb-10">
            {/* Multi-Path Hero Banner */}
            <div className="relative overflow-hidden rounded-[2.5rem] p-12 transition-all duration-700 glass-shell shadow-[0_20px_50px_rgba(0,0,0,0.5)] border">
                <div className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[#FF003C]/20 animate-pulse" style={{ animationDuration: '5s' }}></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[#00FFDE]/20 animate-pulse" style={{ animationDuration: '7s' }}></div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF003C]/10 border border-[#FF003C]/20 text-[#FF003C] text-[10px] font-black uppercase tracking-widest mb-4">
                            <Radio className="w-3.5 h-3.5" /> MA-Optimizer Multi-Path Technology
                        </div>
                        <h2 className="text-5xl lg:text-6xl font-black mb-4 tracking-tight text-white flex items-center justify-center lg:justify-start gap-4">
                            <Network className="w-12 h-12 text-[#FF003C] drop-shadow-[0_0_15px_rgba(255,0,60,0.8)]" />
                            Multi-Path Connection Engine
                        </h2>
                        <p className="text-[var(--text-secondary)] max-w-xl font-medium leading-relaxed">
                            Simultaneous multi-path packet delivery, real-time Jitter Guard, zero packet loss routing, and traffic shaping for competitive online gaming.
                        </p>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                        {routeActive ? (
                            <button
                                onClick={handleStopRoute}
                                className="px-10 py-5 rounded-2xl bg-[#FF003C]/20 border border-[#FF003C]/50 text-[#FF003C] font-black uppercase text-xs tracking-widest hover:bg-[#FF003C]/30 transition-all shadow-[0_0_30px_rgba(255,0,60,0.4)]"
                            >
                                Stop Multi-Path Route
                            </button>
                        ) : (
                            <button
                                onClick={handleApplyRoute}
                                className="px-10 py-5 rounded-2xl bg-[#FF003C] text-white font-black uppercase text-xs tracking-widest hover:bg-[#e00034] transition-all border border-[#FF003C]/50 shadow-[0_0_30px_rgba(255,0,60,0.4)] flex items-center gap-3"
                            >
                                <Zap className="w-5 h-5" /> Engage Multi-Path Route
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Controls Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Multipath Toggle */}
                <div className="card-premium glass-shell p-6 rounded-[2rem] space-y-3 flex items-center justify-between border">
                    <div>
                        <div className="text-white font-bold text-base tracking-wide flex items-center gap-2">
                            <Globe className="w-5 h-5 text-[var(--accent-cyan)]" /> Multipath Packet Delivery
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">Routes packets through 2+ parallel server nodes simultaneously.</div>
                    </div>
                    <input
                        type="checkbox"
                        checked={config.multipathEnabled}
                        onChange={(e) => handleToggleMultipath(e.target.checked)}
                        className="w-6 h-6 accent-[var(--accent-cyan)] cursor-pointer"
                    />
                </div>

                {/* Jitter Guard Toggle */}
                <div className="card-premium glass-shell p-6 rounded-[2rem] space-y-3 flex items-center justify-between border">
                    <div>
                        <div className="text-white font-bold text-base tracking-wide flex items-center gap-2">
                            <Activity className="w-5 h-5 text-[#FF003C]" /> Jitter Guard Protection
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">Eliminates ping variance spikes and network lag spikes.</div>
                    </div>
                    <input
                        type="checkbox"
                        checked={config.jitterGuardEnabled}
                        onChange={(e) => handleToggleJitterGuard(e.target.checked)}
                        className="w-6 h-6 accent-[#FF003C] cursor-pointer"
                    />
                </div>

                {/* Protocol Selector */}
                <div className="card-premium glass-shell p-6 rounded-[2rem] space-y-3 flex items-center justify-between border">
                    <div>
                        <div className="text-white font-bold text-base tracking-wide flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-amber-400" /> Protocol Mode
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">UDP for max speed / TCP for reliability.</div>
                    </div>
                    <select
                        value={config.protocolPreference}
                        onChange={(e) => handleProtocolChange(e.target.value as any)}
                        className="bg-black/40 text-white font-bold text-xs px-3 py-2 rounded-xl border border-white/10"
                    >
                        <option value="UDP">UDP</option>
                        <option value="TCP">TCP</option>
                        <option value="AUTO">AUTO</option>
                    </select>
                </div>
            </div>

            {/* ExitLag Server Routes Matrix */}
            <div className="card-premium glass-shell p-8 rounded-[2.5rem] space-y-6 border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-white text-xl font-black tracking-wide">Multi-Path Server Route Nodes</h3>
                        <p className="text-xs text-[var(--text-muted)] mt-1">Real-time latency, ping variance jitter, and packet loss diagnostic per route.</p>
                    </div>

                    <button
                        onClick={() => scanRoutes(selectedGame)}
                        disabled={scanning}
                        className="px-5 py-2.5 glass-shell text-white text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-white/10"
                    >
                        <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin text-[#FF003C]' : ''}`} /> Scan Routes
                    </button>
                </div>

                {/* Node Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {routes.map((r, idx) => (
                        <div key={idx} className="p-5 rounded-2xl glass-shell border border-white/5 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-bold text-white truncate max-w-[180px]">{r.nodeName}</div>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${r.status === 'OPTIMAL' ? 'bg-[#00FFDE]/20 text-[#00FFDE]' : 'bg-amber-400/20 text-amber-400'}`}>
                                    {r.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/5">
                                <div>
                                    <div className="text-[10px] text-[var(--text-muted)] uppercase font-black">Ping</div>
                                    <div className="text-sm font-mono font-black text-[#00FFDE]">{r.ping > 0 ? `${r.ping}ms` : '-'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-[var(--text-muted)] uppercase font-black">Jitter</div>
                                    <div className="text-sm font-mono font-black text-amber-400">{r.jitter}ms</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-[var(--text-muted)] uppercase font-black">Loss</div>
                                    <div className="text-sm font-mono font-black text-emerald-400">{r.packetLoss}%</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
