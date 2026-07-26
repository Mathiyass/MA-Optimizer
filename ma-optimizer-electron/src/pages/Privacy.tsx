import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Loader2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'
import { TweakCard } from '../components/ui/TweakCard'
import { TabGroup } from '../components/ui/TabGroup'
import { useTweak } from '../hooks/useTweak'
import { getTweaksByCategoryAndTab, tweaks } from '../data/tweaks'
import { useAppStore } from '../store/appStore'

const tabs = [
    { id: 'telemetry', label: 'Telemetry & DiagTrack' },
    { id: 'cortana', label: 'Cortana, Search & Copilot' },
    { id: 'advertising', label: 'Advertising & Activity' },
    { id: 'update', label: 'Windows Update' },
    { id: 'defender', label: 'Defender & Security' },
    { id: 'edge', label: 'Edge Browser' },
    { id: 'misc', label: 'Misc Privacy' },
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

    const applyPreset = async (type: 'recommended' | 'moderate' | 'default') => {
        const privacyTweaks = tweaks.filter(t => t.category === 'privacy')
        let targetTweaks = []

        if (type === 'recommended') {
            targetTweaks = privacyTweaks.filter(t => t.risk === 'safe')
        } else if (type === 'moderate') {
            targetTweaks = privacyTweaks.filter(t => t.risk === 'safe' || t.risk === 'moderate')
        } else {
            targetTweaks = privacyTweaks
        }

        if (!targetTweaks.length) return
        setOptimizing(true)
        setOptProgress(0)
        let count = 0

        for (let i = 0; i < targetTweaks.length; i++) {
            const tweak = targetTweaks[i]
            setOptCurrent(tweak.name)
            try {
                if (type === 'default') {
                    await window.api?.registry.set(tweak.hive, tweak.path, tweak.key, tweak.revertValue, tweak.regType)
                } else {
                    await window.api?.registry.set(tweak.hive, tweak.path, tweak.key, tweak.applyValue, tweak.regType)
                }
                count++
            } catch { }
            setOptProgress(Math.round(((i + 1) / targetTweaks.length) * 100))
            await new Promise(r => setTimeout(r, 120))
        }

        setTimeout(() => {
            setOptimizing(false)
            if (type === 'default') {
                addNotification('info', `Reset ${count} privacy settings to Windows Factory Defaults`)
            } else {
                addNotification('success', `Applied ${count} ${type} privacy tweaks (ShutUp10++ preset)`)
            }
        }, 300)
    }

    return (
        <div className="space-y-8 max-w-[90rem] mx-auto w-full pb-10">
            {/* Ultra-Premium Privacy Hero Section */}
            <motion.div
                className="relative overflow-hidden rounded-[2.5rem] p-12 transition-all duration-700 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 border shadow-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[#00FFDE]/20 animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[var(--accent-cyan)]/20 animate-pulse" style={{ animationDuration: '6s' }}></div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center lg:text-left">
                        <motion.h2 className="text-5xl lg:text-6xl font-black mb-4 tracking-tight text-white flex items-center justify-center lg:justify-start gap-4">
                            <ShieldCheck className="w-12 h-12 text-[#00FFDE] drop-shadow-[0_0_15px_rgba(0,255,222,0.8)]" />
                            Privacy & Anti-Telemetry
                        </motion.h2>
                        <p className="text-[var(--text-muted)] text-sm uppercase tracking-[0.3em] font-black mb-6">
                            MA-Optimizer Anti-Telemetry Engine
                        </p>
                        
                        <p className="text-[var(--text-secondary)] max-w-xl font-medium leading-relaxed">
                            Complete system privacy protection. Disable telemetry, activity harvesting, Windows Copilot/Recall, and location tracking with granular safety recommendations.
                        </p>
                    </div>
                    
                    {/* ShutUp10++ One-Click Presets */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full lg:w-auto">
                        <button
                            onClick={() => applyPreset('recommended')}
                            disabled={optimizing}
                            className="px-6 py-4 rounded-2xl bg-[#00FFDE]/10 border-[#00FFDE]/30 hover:border-[#00FFDE]/80 hover:bg-[#00FFDE]/20 transition-all font-black text-xs uppercase tracking-widest text-[#00FFDE] flex items-center justify-center gap-3 border shadow-[0_0_20px_rgba(0,255,222,0.15)]"
                        >
                            <CheckCircle className="w-4 h-4" /> Apply Recommended (Safe)
                        </button>
                        <button
                            onClick={() => applyPreset('moderate')}
                            disabled={optimizing}
                            className="px-6 py-4 rounded-2xl bg-[var(--accent-cyan)]/10 border-[var(--accent-cyan)]/30 hover:border-[var(--accent-cyan)]/80 hover:bg-[var(--accent-cyan)]/20 transition-all font-black text-xs uppercase tracking-widest text-[var(--accent-cyan)] flex items-center justify-center gap-3 border shadow-lg"
                        >
                            <ShieldCheck className="w-4 h-4" /> Apply Recommended + Moderate
                        </button>
                        <button
                            onClick={() => applyPreset('default')}
                            disabled={optimizing}
                            className="px-6 py-4 rounded-2xl bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10 transition-all font-black text-xs uppercase tracking-widest text-text-muted hover:text-white flex items-center justify-center gap-3 border"
                        >
                            <RefreshCw className="w-4 h-4" /> Reset Factory Defaults
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Category tabs */}
            <div className="mt-8">
                <TabGroup tabs={tabs} active={tab} onChange={setTab} />
            </div>

            {/* Tweaks list */}
            <div className="grid gap-4 mt-6">
                {items.map(t => <TweakRow key={t.id} tweakId={t.id} />)}
                {items.length === 0 && <div className="text-[var(--text-muted)] text-center py-12 font-bold tracking-widest uppercase">No tweaks in this category</div>}
            </div>

            {/* Progress modal */}
            {optimizing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,12,20,0.85)] backdrop-blur-3xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="border-[#00FFDE]/30 rounded-[2.5rem] p-10 w-[500px] shadow-[0_0_50px_rgba(0,255,222,0.15)] bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl relative overflow-hidden border"
                    >
                        <motion.div 
                            className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00FFDE]/10 to-transparent h-[200%]"
                            animate={{ top: ['-100%', '100%'] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        />

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8 justify-center">
                                <Loader2 className="w-10 h-10 text-[#00FFDE] animate-spin drop-shadow-[0_0_15px_rgba(0,255,222,0.8)]" />
                                <h3 className="text-2xl font-black text-white tracking-wide">Executing Privacy Profile...</h3>
                            </div>
                            
                            <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-2xl p-4 mb-6 border">
                                <p className="text-[#00FFDE] font-mono text-xs mb-1 uppercase tracking-widest">Active Payload</p>
                                <p className="text-white text-sm truncate font-medium">{optCurrent}</p>
                            </div>

                            <div className="w-full h-3 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-full overflow-hidden shadow-inner border">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-[#00FFDE] to-[#00FFDE] shadow-[0_0_15px_rgba(0,255,222,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${optProgress}%` }}
                                    transition={{ duration: 0.2 }}
                                />
                            </div>
                            <div className="text-right text-[#00FFDE] font-black text-xs mt-3 tracking-widest">{optProgress}% COMPLETED</div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

