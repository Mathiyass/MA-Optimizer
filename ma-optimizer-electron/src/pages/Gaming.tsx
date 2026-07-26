import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2, Zap, Loader2, Download, ShieldCheck, Activity, Globe, Wifi } from 'lucide-react'
import { TweakCard } from '../components/ui/TweakCard'
import { TabGroup } from '../components/ui/TabGroup'
import { useTweak } from '../hooks/useTweak'
import { getTweaksByCategoryAndTab, tweaks } from '../data/tweaks'
import { useAppStore } from '../store/appStore'
import { useLogStore } from '../store/logStore'

const tabs = [
    { id: 'gearup', label: 'Network & FPS Booster' },
    { id: 'general', label: 'General' },
    { id: 'input', label: 'Input' },
    { id: 'gpu', label: 'GPU' },
]

function TweakRow({ tweakId }: { tweakId: string }) {
    const { enabled, loading, toggle, tweak } = useTweak(tweakId)
    if (!tweak) return null
    return <TweakCard id={tweakId} title={tweak.name} description={tweak.description} risk={tweak.risk} enabled={enabled} onChange={toggle} loading={loading} />
}

function GearUpBoosterTab() {
    const [catalog, setCatalog] = useState<any[]>([])
    const [selectedGame, setSelectedGame] = useState<string>('cs2')
    const [nodes, setNodes] = useState<any[]>([])
    const [pinging, setPinging] = useState(false)
    const [boosting, setBoosting] = useState(false)
    const [boostActive, setBoostActive] = useState(false)
    const addNotification = useAppStore(s => s.addNotification)

    useEffect(() => {
        window.api?.gearup.getCatalog().then((list: any[]) => {
            setCatalog(list || [])
            if (list?.length) setSelectedGame(list[0].id)
        }).catch(() => {})
    }, [])

    const testPingNodes = async (gameId: string) => {
        setPinging(true)
        try {
            const updated = await window.api?.gearup.pingGameNodes(gameId)
            setNodes(updated || [])
        } catch {}
        setPinging(false)
    }

    useEffect(() => {
        if (selectedGame) testPingNodes(selectedGame)
    }, [selectedGame])

    const handleBoost = async () => {
        setBoosting(true)
        try {
            const target = catalog.find(g => g.id === selectedGame)
            if (target) {
                await window.api?.gearup.enableQosRouting(target.exe)
            }
            const ok = await window.api?.gearup.boostGame(selectedGame)
            if (ok) {
                setBoostActive(true)
                addNotification('success', `Game Boost engaged for ${target?.name || 'game'}! Ping & RAM optimized.`)
            }
        } catch {
            addNotification('error', 'Game boost failed')
        }
        setBoosting(false)
    }

    const handleStopBoost = async () => {
        await window.api?.gearup.stopBoost()
        setBoostActive(false)
        addNotification('info', 'Game Boost deactivated')
    }

    const handleDownloadBoost = async () => {
        try {
            await window.api?.gearup.boostDownloads()
            addNotification('success', 'Steam / Epic Games download acceleration enabled!')
        } catch {
            addNotification('error', 'Download booster failed')
        }
    }

    const currentGame = catalog.find(g => g.id === selectedGame)

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 glass-shell rounded-[2rem] border border-white/5">
                <div>
                    <h3 className="text-white text-lg font-black tracking-wide flex items-center gap-2">
                        <Globe className="w-5 h-5 text-[var(--accent-cyan)]" /> Multi-Path Network & FPS Booster
                    </h3>
                    <p className="text-[var(--text-muted)] text-xs mt-1">Direct game server routing, packet loss prevention, and QoS DSCP 46 prioritization.</p>
                </div>

                <button
                    onClick={handleDownloadBoost}
                    className="px-6 py-3 bg-[#00FFDE]/10 border-[#00FFDE]/30 text-[#00FFDE] font-black uppercase text-xs tracking-widest hover:bg-[#00FFDE]/20 transition-all rounded-2xl border flex items-center gap-2"
                >
                    <Download className="w-4 h-4" /> Accelerate Launcher Downloads
                </button>
            </div>

            {/* Game Selector Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {catalog.map(g => (
                    <button
                        key={g.id}
                        onClick={() => setSelectedGame(g.id)}
                        className={`p-4 rounded-2xl border text-left transition-all ${selectedGame === g.id ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10 shadow-[0_0_20px_rgba(0,255,222,0.2)]' : 'glass-shell hover:border-white/20'}`}
                    >
                        <div className="font-bold text-white text-sm truncate">{g.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-1 uppercase font-black tracking-widest">{g.category}</div>
                    </button>
                ))}
            </div>

            {/* Selected Game Node Ping Card */}
            {currentGame && (
                <div className="card-premium glass-shell p-6 rounded-[2rem] space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <div className="text-xs font-black uppercase tracking-widest text-[var(--accent-cyan)]">Target Game</div>
                            <div className="text-2xl font-black text-white">{currentGame.name}</div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => testPingNodes(selectedGame)}
                                disabled={pinging}
                                className="px-4 py-2.5 glass-shell text-xs text-white font-bold rounded-xl flex items-center gap-2 hover:bg-white/10"
                            >
                                <Activity className={`w-4 h-4 ${pinging ? 'animate-spin text-[var(--accent-cyan)]' : ''}`} /> Re-ping
                            </button>

                            {boostActive ? (
                                <button
                                    onClick={handleStopBoost}
                                    className="px-6 py-3 bg-[#FF003C]/20 border-[#FF003C]/40 text-[#FF003C] font-black text-xs uppercase tracking-widest rounded-2xl border"
                                >
                                    Stop Boost
                                </button>
                            ) : (
                                <button
                                    onClick={handleBoost}
                                    disabled={boosting}
                                    className="px-8 py-3 bg-[var(--accent-cyan)] text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(0,255,222,0.4)] flex items-center gap-2 border border-[var(--accent-cyan)]/50"
                                >
                                    {boosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                    BOOST {currentGame.name} NOW
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Regional Server Nodes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                        {(nodes.length ? nodes : currentGame.serverNodes).map((node: any, idx: number) => (
                            <div key={idx} className="p-4 rounded-xl glass-shell border border-white/5 flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-bold text-white">{node.region}</div>
                                    <div className="text-[10px] font-mono text-[var(--text-muted)]">{node.ip}</div>
                                </div>
                                <div className={`text-sm font-mono font-black ${node.ping > 0 && node.ping < 60 ? 'text-[#00FFDE]' : node.ping < 120 ? 'text-amber-400' : 'text-[#FF003C]'}`}>
                                    {node.ping > 0 ? `${node.ping}ms` : 'Checking...'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export function Gaming() {
    const [tab, setTab] = useState('gearup')
    const [gameBoostOn, setGameBoostOn] = useState(false)
    const [applying, setApplying] = useState(false)
    const [gpuInfo, setGpuInfo] = useState<{ vendor: string; model: string; vram: number } | null>(null)
    const items = getTweaksByCategoryAndTab('gaming', tab)
    const addNotification = useAppStore(s => s.addNotification)
    const addLog = useLogStore(s => s.addLine)

    useEffect(() => {
        window.api?.system.getFullInfo().then((info: any) => {
            if (info?.graphics?.controllers?.[0]) {
                const gpu = info.graphics.controllers[0]
                setGpuInfo({ vendor: gpu.vendor || '', model: gpu.model || 'Unknown GPU', vram: gpu.vram || 0 })
            }
        }).catch(() => { })
    }, [])

    const isNvidia = gpuInfo?.vendor?.toLowerCase().includes('nvidia')
    const isAmd = gpuInfo?.vendor?.toLowerCase().includes('amd') || gpuInfo?.vendor?.toLowerCase().includes('advanced micro')

    const toggleGameBoost = async () => {
        setApplying(true)
        const gamingTweaks = tweaks.filter(t => t.category === 'gaming' && t.risk === 'safe')
        let count = 0
        const newState = !gameBoostOn

        for (const tweak of gamingTweaks) {
            try {
                const value = newState ? tweak.applyValue : tweak.revertValue
                await window.api?.registry.set(tweak.hive, tweak.path, tweak.key, value, tweak.regType)
                count++
            } catch { }
        }

        if (newState) {
            try { await window.api?.powerPlan.setTimerResolution(5000) } catch { }
        }

        setGameBoostOn(newState)
        setApplying(false)
        addNotification('success', `Game Boost ${newState ? 'activated' : 'deactivated'} — ${count} tweaks applied`)
        addLog(`[GAME BOOST] ${newState ? 'ON' : 'OFF'} — ${count} tweaks`)
    }

    return (
        <div className="space-y-8 max-w-[90rem] mx-auto w-full pb-10">
            {/* Ultra-Premium Gaming Hero Section */}
            <motion.div
                className={`relative overflow-hidden rounded-[2.5rem] p-12 transition-all duration-700 border bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl ${gameBoostOn
                    ? 'border-[var(--accent-cyan)]/50 shadow-[0_0_40px_rgba(0,255,222,0.2)] border'
                    : 'border-white/5 border'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none transition-all duration-700 ${gameBoostOn ? 'bg-[var(--accent-cyan)]/20' : 'bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 border'}`}></div>
                <div className={`absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none transition-all duration-700 ${gameBoostOn ? 'bg-[#FF003C]/20' : 'bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 border'}`}></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center md:text-left">
                        <motion.h2 className={`text-5xl lg:text-6xl font-black mb-4 tracking-tight ${gameBoostOn ? 'text-gradient-ultra' : 'text-white'}`}>
                            Gaming Mode
                        </motion.h2>
                        <p className="text-[var(--text-muted)] text-sm uppercase tracking-[0.3em] font-black mb-8">
                            MA-Optimizer Game Engine Integration
                        </p>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            {gpuInfo && (
                                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 border">
                                    <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${isNvidia ? 'bg-[#00FFDE] text-[#00FFDE]' : isAmd ? 'bg-[#FF003C] text-[#FF003C]' : 'bg-[var(--accent-cyan)] text-[var(--accent-cyan)]'}`} />
                                    <span className="text-white font-bold text-sm tracking-wide">{gpuInfo.model}</span>
                                    {gpuInfo.vram > 0 && <span className="text-[var(--text-muted)] text-xs font-black">{gpuInfo.vram} MB VRAM</span>}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-center">
                        <button
                            onClick={toggleGameBoost}
                            disabled={applying}
                            className={`w-32 h-32 rounded-full border-[6px] flex items-center justify-center transition-all duration-500 shadow-2xl relative group ${gameBoostOn
                                ? 'border-[var(--accent-cyan)]/30 bg-[rgba(0,255,222,0.1)] shadow-[0_0_50px_rgba(0,255,222,0.4)] border'
                                : 'bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 hover:border-white/20 border'
                            } border`}
                        >
                            {applying ? (
                                <Loader2 className="w-12 h-12 animate-spin text-[var(--accent-cyan)]" />
                            ) : (
                                <Gamepad2 className={`w-12 h-12 transition-all duration-300 group-active:scale-90 ${gameBoostOn ? 'text-[var(--accent-cyan)] drop-shadow-[0_0_15px_rgba(0,255,222,0.8)]' : 'text-white/50 group-hover:text-white'}`} />
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>

            <TabGroup tabs={tabs} active={tab} onChange={setTab} />

            {tab === 'gearup' ? (
                <div className="mt-6">
                    <GearUpBoosterTab />
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

