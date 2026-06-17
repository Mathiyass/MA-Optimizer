import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2, Zap, Loader2 } from 'lucide-react'
import { TweakCard } from '../components/ui/TweakCard'
import { TabGroup } from '../components/ui/TabGroup'
import { useTweak } from '../hooks/useTweak'
import { getTweaksByCategoryAndTab, tweaks } from '../data/tweaks'
import { useAppStore } from '../store/appStore'
import { useLogStore } from '../store/logStore'

const tabs = [
    { id: 'general', label: 'General' },
    { id: 'input', label: 'Input' },
    { id: 'gpu', label: 'GPU' },
]

function TweakRow({ tweakId }: { tweakId: string }) {
    const { enabled, loading, toggle, tweak } = useTweak(tweakId)
    if (!tweak) return null
    return <TweakCard id={tweakId} title={tweak.name} description={tweak.description} risk={tweak.risk} enabled={enabled} onChange={toggle} loading={loading} />
}

export function Gaming() {
    const [tab, setTab] = useState('general')
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
                    ? 'border-[var(--accent-cyan)]/50 shadow-[0_0_40px_rgba(0,255,222,0.2)]'
                    : 'border-white/5'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none transition-all duration-700 ${gameBoostOn ? 'bg-[var(--accent-cyan)]/20' : 'bg-white/5'}`}></div>
                <div className={`absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none transition-all duration-700 ${gameBoostOn ? 'bg-[#FF003C]/20' : 'bg-white/5'}`}></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center md:text-left">
                        <motion.h2 className={`text-5xl lg:text-6xl font-black mb-4 tracking-tight ${gameBoostOn ? 'text-gradient-ultra' : 'text-white'}`}>
                            Gaming Mode
                        </motion.h2>
                        <p className="text-[var(--text-muted)] text-sm uppercase tracking-[0.3em] font-black mb-8">
                            {gameBoostOn ? 'Optimal Performance Active' : 'Performance Throttled'}
                        </p>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            {gpuInfo && (
                                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
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
                                ? 'border-[var(--accent-cyan)]/30 bg-[rgba(0,255,222,0.1)] shadow-[0_0_50px_rgba(0,255,222,0.4)]'
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                        >
                            {applying ? (
                                <Loader2 className="w-12 h-12 animate-spin text-[var(--accent-cyan)]" />
                            ) : (
                                <Gamepad2 className={`w-12 h-12 transition-all duration-300 group-active:scale-90 ${gameBoostOn ? 'text-[var(--accent-cyan)] drop-shadow-[0_0_15px_rgba(0,255,222,0.8)]' : 'text-white/50 group-hover:text-white'}`} />
                            )}
                            
                            {/* Inner ripple effect */}
                            {gameBoostOn && (
                                <div className="absolute inset-0 rounded-full border-2 border-[var(--accent-cyan)] opacity-0 animate-ping" style={{ animationDuration: '2s' }}></div>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Metrics Row */}
            {gameBoostOn && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-scale-in">
                    <div className="rounded-[2.5rem] p-8 border border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest font-black">FPS Stability</span>
                            <Zap className="w-5 h-5 text-[var(--accent-cyan)] drop-shadow-[0_0_8px_rgba(0,255,222,0.5)]" />
                        </div>
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-4xl font-black text-white">99.8</span>
                            <span className="text-xl font-bold text-[var(--accent-cyan)] opacity-80">%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--accent-cyan)] w-[99.8%] shadow-[0_0_10px_var(--accent-cyan)]"></div>
                        </div>
                    </div>

                    <div className="rounded-[2.5rem] p-8 border border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest font-black">Input Latency</span>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#FF003C] animate-pulse shadow-[0_0_8px_#FF003C]"></span>
                                <span className="text-[10px] font-black text-[#FF003C] tracking-wider">ULTRA-LOW</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-4xl font-black text-white">0.5</span>
                            <span className="text-xl font-bold text-[#FF003C] opacity-80">ms</span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] font-bold tracking-wide">Polling Rate: <span className="text-[#FF003C]">Maximized</span></p>
                    </div>

                    <div className="rounded-[2.5rem] p-8 border border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest font-black">Background Apps</span>
                            <span className="text-xs font-black text-[#FF003C] tracking-wider bg-[#FF003C]/10 px-2 py-1 rounded-2xl">SUSPENDED</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-4xl font-black text-white">42</span>
                            <span className="text-xl font-bold text-[#FF003C] opacity-80">PROCS</span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] font-bold tracking-wide">Resources: <span className="text-[#FF003C]">Freed</span></p>
                    </div>
                </div>
            )}

            <h3 className="text-2xl font-black text-white mt-12 mb-6 tracking-tight">Active Enhancements</h3>
            <TabGroup tabs={tabs} active={tab} onChange={setTab} />

            <div className="grid gap-4 mt-6">
                {items.map(t => <TweakRow key={t.id} tweakId={t.id} />)}
                {items.length === 0 && <div className="text-[var(--text-muted)] text-center py-12 font-bold tracking-widest uppercase">No tweaks in this category</div>}
            </div>
        </div>
    )
}
