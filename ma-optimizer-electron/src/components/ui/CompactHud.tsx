import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Maximize2, Database, Cpu, Activity, X } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useSystemStore } from '../../store/systemStore'

export function CompactHud() {
    const toggleSurfaceMode = useAppStore((s) => s.toggleSurfaceMode)
    const addNotification = useAppStore((s) => s.addNotification)
    const cpu = useSystemStore((s) => s.cpu)
    const ram = useSystemStore((s) => s.ram)
    const network = useSystemStore((s) => s.network)

    const [isBoosting, setIsBoosting] = useState(false)

    const handleTurboBoost = async () => {
        setIsBoosting(true)
        try {
            if (window.api?.heuristic?.turboBoost) {
                const res = await window.api.heuristic.turboBoost()
                addNotification('success', `🚀 Turbo Boost: Cleaned ${res.freedMb} MB RAM`)
            } else if (window.api?.system?.cleanRam) {
                await window.api.system.cleanRam()
                addNotification('success', 'Turbo Boost: RAM Working set optimized')
            }
        } catch {
            addNotification('error', 'Turbo Boost failed')
        } finally {
            setTimeout(() => setIsBoosting(false), 800)
        }
    }

    const handleSmartTrim = async () => {
        try {
            if (window.api?.heuristic?.runSmartTrim) {
                const res = await window.api.heuristic.runSmartTrim()
                addNotification('success', `SmartTrim: Freed ~${res.freedMb} MB`)
            } else if (window.api?.system?.cleanRam) {
                await window.api.system.cleanRam()
                addNotification('success', 'RAM working set trimmed')
            }
        } catch {}
    }

    return (
        <div className="w-full h-full p-2 flex flex-col justify-between select-none bg-[#090b12]/95 border border-accent-cyan/30 rounded-2xl shadow-[0_0_25px_rgba(0,255,222,0.25)] relative overflow-hidden backdrop-blur-2xl">
            {/* Ambient subtle glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-cyan/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header / Drag Bar */}
            <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-white/10" style={{ WebkitAppRegion: 'drag' } as any}>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-white">MA HUD</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
                        GAMING
                    </span>
                </div>

                <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
                    <button
                        onClick={() => toggleSurfaceMode()}
                        title="Expand to Full Dashboard"
                        className="p-1 rounded-lg text-text-muted hover:text-accent-cyan hover:bg-white/10 transition-colors"
                    >
                        <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => window.api?.window?.close()}
                        title="Close"
                        className="p-1 rounded-lg text-text-muted hover:text-rose-400 hover:bg-white/10 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-2 px-1 py-1 text-center">
                <div className="p-1.5 rounded-xl bg-black/40 border border-white/5 flex flex-col items-center">
                    <span className="text-[9px] font-bold text-text-muted uppercase">CPU</span>
                    <span className="text-sm font-black text-white">{cpu}%</span>
                </div>
                <div className="p-1.5 rounded-xl bg-black/40 border border-white/5 flex flex-col items-center">
                    <span className="text-[9px] font-bold text-text-muted uppercase">RAM</span>
                    <span className="text-sm font-black text-accent-cyan">{ram.percent}%</span>
                </div>
                <div className="p-1.5 rounded-xl bg-black/40 border border-white/5 flex flex-col items-center">
                    <span className="text-[9px] font-bold text-text-muted uppercase">DOWN</span>
                    <span className="text-xs font-black text-emerald-400 mt-0.5">
                        {Math.round(network.rxSec / 1024)} KB/s
                    </span>
                </div>
            </div>

            {/* Quick Boost Button Bar */}
            <div className="flex items-center gap-2 px-1 pb-1">
                <button
                    onClick={handleTurboBoost}
                    disabled={isBoosting}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-accent-cyan to-[#00c9a7] text-black font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,255,222,0.4)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                    <Zap className={`w-3.5 h-3.5 ${isBoosting ? 'animate-spin' : ''}`} />
                    {isBoosting ? 'Optimizing...' : 'Turbo Boost'}
                </button>
                <button
                    onClick={handleSmartTrim}
                    title="Trim Inactive RAM"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-text-muted hover:text-white transition-colors"
                >
                    <Database className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}
