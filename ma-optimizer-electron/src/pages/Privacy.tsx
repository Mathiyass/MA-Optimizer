import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { TweakCard } from '../components/ui/TweakCard'
import { TabGroup } from '../components/ui/TabGroup'
import { useTweak } from '../hooks/useTweak'
import { getTweaksByCategoryAndTab, getSafeTweaks } from '../data/tweaks'
import { useAppStore } from '../store/appStore'

const tabs = [
    { id: 'telemetry', label: 'Telemetry' },
    { id: 'cortana', label: 'Cortana & Search' },
    { id: 'advertising', label: 'Advertising' },
    { id: 'update', label: 'Windows Update' },
    { id: 'defender', label: 'Defender' },
    { id: 'edge', label: 'Edge' },
    { id: 'misc', label: 'Misc' },
]

function TweakRow({ tweakId }: { tweakId: string }) {
    const { enabled, loading, toggle, tweak } = useTweak(tweakId)
    if (!tweak) return null
    return <TweakCard id={tweakId} title={tweak.name} description={tweak.description} risk={tweak.risk} enabled={enabled} onChange={toggle} loading={loading} />
}

export function Privacy() {
    const [tab, setTab] = useState('telemetry')
    const items = getTweaksByCategoryAndTab('privacy', tab)
    const addNotification = useAppStore(s => s.addNotification)

    const [optimizing, setOptimizing] = useState(false)
    const [optProgress, setOptProgress] = useState(0)
    const [optCurrent, setOptCurrent] = useState('')

    const applyAllSafe = async () => {
        const safeTweaks = getSafeTweaks().filter(t => t.category === 'privacy')
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
            addNotification('success', `Applied ${count} safe privacy tweaks`)
        }, 500)
    }

    return (
        <div className="space-y-8 max-w-[90rem] mx-auto w-full pb-10">
            {/* Ultra-Premium Privacy Hero Section */}
            <motion.div
                className="relative overflow-hidden rounded-[2.5rem] p-12 transition-all duration-700 border bg-[rgba(15,17,26,0.7)] backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[#00ff88]/20 animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[var(--accent-cyan)]/20 animate-pulse" style={{ animationDuration: '6s' }}></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center md:text-left">
                        <motion.h2 className="text-5xl lg:text-6xl font-black mb-4 tracking-tight text-white flex items-center justify-center md:justify-start gap-4">
                            <ShieldCheck className="w-12 h-12 text-[#00ff88] drop-shadow-[0_0_15px_rgba(0,255,136,0.8)]" />
                            Privacy & Telemetry
                        </motion.h2>
                        <p className="text-[var(--text-muted)] text-sm uppercase tracking-[0.3em] font-black mb-8">
                            Take back your data
                        </p>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <p className="text-[var(--text-secondary)] max-w-xl font-medium leading-relaxed">
                                Lock down your system by disabling unnecessary telemetry, background data harvesting, and advertising IDs. Secure your OS to ensure maximum privacy without breaking essential functionality.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-center">
                        <button
                            onClick={applyAllSafe}
                            disabled={optimizing}
                            className="group relative px-8 py-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#00ff88]/50 hover:bg-[rgba(0,255,136,0.1)] transition-all duration-500 overflow-hidden shadow-xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#00ff88]/0 via-[#00ff88]/10 to-[#00ff88]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                            <span className="relative z-10 font-black tracking-widest uppercase text-sm flex items-center gap-3 text-white group-hover:text-[#00ff88] transition-colors">
                                {optimizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                {optimizing ? 'Securing...' : 'Apply Safe Tweaks'}
                            </span>
                        </button>
                    </div>
                </div>
            </motion.div>

            <div className="mt-8">
                <TabGroup tabs={tabs} active={tab} onChange={setTab} />
            </div>

            <div className="grid gap-4 mt-6">
                {items.map(t => <TweakRow key={t.id} tweakId={t.id} />)}
                {items.length === 0 && <div className="text-[var(--text-muted)] text-center py-12 font-bold tracking-widest uppercase">No tweaks in this category</div>}
            </div>

            {optimizing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,12,20,0.85)] backdrop-blur-3xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="card-premium border border-[#00ff88]/30 rounded-3xl p-10 w-[500px] shadow-[0_0_50px_rgba(0,255,136,0.15)] bg-[rgba(15,17,26,0.9)] relative overflow-hidden"
                    >
                        {/* Scanning beam effect */}
                        <motion.div 
                            className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00ff88]/10 to-transparent h-[200%]"
                            animate={{ top: ['-100%', '100%'] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        />

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8 justify-center">
                                <Loader2 className="w-10 h-10 text-[#00ff88] animate-spin drop-shadow-[0_0_15px_rgba(0,255,136,0.8)]" />
                                <h3 className="text-2xl font-black text-white tracking-wide">Securing Privacy...</h3>
                            </div>
                            
                            <div className="bg-black/40 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-md">
                                <p className="text-[#00ff88] font-mono text-xs mb-1 uppercase tracking-widest">Executing Payload</p>
                                <p className="text-white text-sm truncate font-medium">{optCurrent}</p>
                            </div>

                            <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-[#00ff88] to-[#00aaff] shadow-[0_0_15px_rgba(0,255,136,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${optProgress}%` }}
                                    transition={{ duration: 0.2 }}
                                />
                            </div>
                            <div className="text-right text-[#00ff88] font-black text-xs mt-3 tracking-widest">{optProgress}% SECURED</div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
