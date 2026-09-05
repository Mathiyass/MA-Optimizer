import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, MousePointer, Cpu, ShieldCheck, Loader2, Sparkles, CheckCircle2, Flame } from 'lucide-react'
import { useAppStore } from '../store/appStore'

export function HoneOptimizerPage() {
    const [applying, setApplying] = useState(false)
    const [msiLoading, setMsiLoading] = useState(false)
    const [mouseLoading, setMouseLoading] = useState(false)

    const addNotification = useAppStore(s => s.addNotification)

    const applyHonePreset = async () => {
        setApplying(true)
        try {
            addNotification('info', 'Applying Hone Competitive Gaming Preset...')
            const res = await window.api?.hone.applyPreset()
            if (res?.success) {
                addNotification('success', `Hone Competitive Preset Engaged! (${res.appliedTweaks} tweaks applied)`)
            } else {
                addNotification('error', `Failed applying Hone preset: ${res?.message || 'Error'}`)
            }
        } catch {
            addNotification('error', 'Hone preset execution failed')
        }
        setApplying(false)
    }

    const enableMsi = async () => {
        setMsiLoading(true)
        try {
            const ok = await window.api?.hone.enableMsiMode()
            if (ok) addNotification('success', 'MSI Interrupt Mode enabled for GPU & Network Card!')
            else addNotification('error', 'Failed enabling MSI Mode')
        } catch {
            addNotification('error', 'MSI Mode operation error')
        }
        setMsiLoading(false)
    }

    const disableMouseAccel = async () => {
        setMouseLoading(true)
        try {
            const ok = await window.api?.hone.disableMouseAccel()
            if (ok) addNotification('success', '1:1 Raw Mouse Input enabled! Mouse acceleration curves removed.')
            else addNotification('error', 'Failed disabling mouse acceleration')
        } catch {
            addNotification('error', 'Mouse optimization error')
        }
        setMouseLoading(false)
    }

    return (
        <div className="space-y-8 max-w-[90rem] mx-auto w-full pb-10">
            {/* Hone Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] p-12 transition-all duration-700 glass-shell shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[#00FFDE]/20 animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[#FF003C]/20 animate-pulse" style={{ animationDuration: '6s' }}></div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00FFDE]/10 border border-[#00FFDE]/20 text-[#00FFDE] text-[10px] font-black uppercase tracking-widest mb-4">
                            <Sparkles className="w-3.5 h-3.5" /> MA-Optimizer Core Latency Engine
                        </div>
                        <h2 className="text-5xl lg:text-6xl font-black mb-4 tracking-tight text-white flex items-center justify-center lg:justify-start gap-4">
                            <Flame className="w-12 h-12 text-[var(--accent-cyan)] drop-shadow-[0_0_15px_rgba(0,255,222,0.8)]" />
                            Low Latency & FPS Engine
                        </h2>
                        <p className="text-[var(--text-secondary)] max-w-xl font-medium leading-relaxed">
                            System-level Windows tweaks, MSI GPU/NIC driver interrupt optimizations, raw mouse input 1:1 curve stripping, and high-performance power management.
                        </p>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                        <button
                            onClick={applyHonePreset}
                            disabled={applying}
                            className="px-10 py-5 rounded-2xl bg-[var(--accent-cyan)] text-black font-black uppercase text-xs tracking-widest hover:bg-[#00e6c8] transition-all border border-[var(--accent-cyan)]/50 shadow-[0_0_30px_rgba(0,255,222,0.4)] flex items-center gap-3 disabled:opacity-50"
                        >
                            {applying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                            {applying ? 'Engaging Latency Payload...' : 'Apply Competitive Latency Preset'}
                        </button>
                    </div>
                </div>
            </div>

            {/* AI DPC Latency & Interrupt Advisor Card */}
            <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border border-[var(--accent-cyan)]/25 rounded-[2rem] p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_top_right,rgba(0,255,222,0.12),transparent_70%)] pointer-events-none" />
                <div className="flex-1 space-y-1.5 relative z-10 text-left">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[var(--accent-cyan)] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-cyan)]">AI Latency & DPC Advisor</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[var(--accent-cyan)]/15 border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)]">
                            Ultra-Low Latency Core
                        </span>
                    </div>
                    <h3 className="text-white text-base font-black tracking-wide">
                        Hardware Interrupt (MSI) & Sub-Millisecond Input Latency
                    </h3>
                    <p className="text-[var(--text-secondary)] text-xs font-medium leading-relaxed max-w-2xl">
                        Traditional Windows devices utilize pin-based shared IRQ lines, causing CPU core interrupt stalls during intensive rendering. Enabling Message Signaled Interrupts (MSI Mode) routes hardware interrupts directly into CPU L1 cache buffers, reducing DPC driver execution jitter from ~400µs to &lt;15µs.
                    </p>
                </div>

                <div className="flex items-center gap-3 relative z-10 shrink-0">
                    <button
                        onClick={() => useAppStore.getState().setAiDrawerOpen(true)}
                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-cyan)]/15 to-[var(--accent-violet)]/15 hover:from-[var(--accent-cyan)]/25 hover:to-[var(--accent-violet)]/25 border border-[var(--accent-cyan)]/40 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,222,0.15)]"
                    >
                        <Sparkles className="w-4 h-4 text-[var(--accent-cyan)]" />
                        Ask Latency Persona
                        <kbd className="text-[8px] bg-black/40 px-1 py-0.5 rounded text-[var(--accent-cyan)]">Ctrl+Space</kbd>
                    </button>
                </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1:1 Raw Mouse Input */}
                <div className="card-premium glass-shell p-8 rounded-[2rem] space-y-4 flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 rounded-2xl glass-shell flex items-center justify-center text-[var(--accent-cyan)] mb-4">
                            <MousePointer className="w-6 h-6" />
                        </div>
                        <h3 className="text-white font-bold text-lg tracking-wide">1:1 Raw Mouse Input</h3>
                        <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
                            Completely strips Windows mouse pointer acceleration curves (`SmoothMouseXCurve` & `SmoothMouseYCurve`) for true 1:1 pixel-accurate mouse tracking in competitive games.
                        </p>
                    </div>
                    <button
                        onClick={disableMouseAccel}
                        disabled={mouseLoading}
                        className="w-full py-3.5 glass-shell text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 border"
                    >
                        {mouseLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-[var(--accent-cyan)]" />}
                        Strip Mouse Acceleration
                    </button>
                </div>

                {/* MSI Mode DPC Latency */}
                <div className="card-premium glass-shell p-8 rounded-[2rem] space-y-4 flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 rounded-2xl glass-shell flex items-center justify-center text-[#00FFDE] mb-4">
                            <Cpu className="w-6 h-6" />
                        </div>
                        <h3 className="text-white font-bold text-lg tracking-wide">MSI Interrupt Driver Mode</h3>
                        <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
                            Forces GPU (NVIDIA/AMD) and Network Adapter drivers to run in Message Signaled Interrupts (MSI) mode, drastically eliminating DPC latency spikes and frame stuttering.
                        </p>
                    </div>
                    <button
                        onClick={enableMsi}
                        disabled={msiLoading}
                        className="w-full py-3.5 glass-shell text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 border"
                    >
                        {msiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-[#00FFDE]" />}
                        Enable Hardware MSI Mode
                    </button>
                </div>

                {/* Hone System Responsiveness */}
                <div className="card-premium glass-shell p-8 rounded-[2rem] space-y-4 flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 rounded-2xl glass-shell flex items-center justify-center text-[#FF003C] mb-4">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h3 className="text-white font-bold text-lg tracking-wide">Multimedia & Gaming Priority</h3>
                        <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
                            Allocates 100% CPU thread priority to active games (`SystemResponsiveness = 0`) and sets GPU Priority to `8` in Windows Multimedia Class Scheduler.
                        </p>
                    </div>
                    <div className="px-4 py-3 bg-[#FF003C]/10 border border-[#FF003C]/30 text-[#FF003C] rounded-xl text-xs font-black uppercase tracking-widest text-center">
                        Included in Competitive Preset
                    </div>
                </div>
            </div>
        </div>
    )
}
