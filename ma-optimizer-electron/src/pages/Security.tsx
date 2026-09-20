import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, Zap, RefreshCw, Loader2, CheckCircle2, Cpu, Lock, Unlock, HelpCircle } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { useLogStore } from '../store/logStore'

export function Security() {
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [securityData, setSecurityData] = useState<{
        vbsEnabled: boolean
        hvciEnabled: boolean
        spectreDisabled: boolean
        cfgEnabled: boolean
        hypervisorType: string
        securityScore: number
    }>({
        vbsEnabled: true,
        hvciEnabled: true,
        spectreDisabled: false,
        cfgEnabled: true,
        hypervisorType: 'Default',
        securityScore: 100
    })

    const addNotification = useAppStore((s) => s.addNotification)
    const addLog = useLogStore((s) => s.addLine)

    const fetchStatus = useCallback(async () => {
        if (!window.api?.security) return
        setLoading(true)
        try {
            const res = await window.api.security.getSecurityOverview()
            if (res.success) {
                setSecurityData(res.status)
            }
        } catch (e: any) {
            addNotification('error', 'Failed to query security status')
        } finally {
            setLoading(false)
        }
    }, [addNotification])

    useEffect(() => {
        fetchStatus()
    }, [fetchStatus])

    const handleToggleVbs = async () => {
        if (!window.api?.security) return
        const target = !securityData.vbsEnabled
        setActionLoading('vbs')
        try {
            const res = await window.api.security.toggleVbs(target)
            if (res.success) {
                addNotification('success', res.message)
                addLog(`[Security] VBS toggled to ${target ? 'Enabled' : 'Disabled'}`)
                await fetchStatus()
            } else {
                addNotification('error', res.message)
            }
        } catch (err: any) {
            addNotification('error', err.message)
        } finally {
            setActionLoading(null)
        }
    }

    const handleToggleHvci = async () => {
        if (!window.api?.security) return
        const target = !securityData.hvciEnabled
        setActionLoading('hvci')
        try {
            const res = await window.api.security.toggleHvci(target)
            if (res.success) {
                addNotification('success', res.message)
                addLog(`[Security] HVCI toggled to ${target ? 'Enabled' : 'Disabled'}`)
                await fetchStatus()
            } else {
                addNotification('error', res.message)
            }
        } catch (err: any) {
            addNotification('error', err.message)
        } finally {
            setActionLoading(null)
        }
    }

    const handleToggleSpectre = async () => {
        if (!window.api?.performance) return
        const target = !securityData.spectreDisabled
        setActionLoading('spectre')
        try {
            const res = await window.api.performance.toggleSpectreMitigations(target)
            if (res.success) {
                addNotification('success', res.message)
                addLog(`[Security] Spectre mitigations ${target ? 'Disabled' : 'Enabled'}`)
                await fetchStatus()
            } else {
                addNotification('error', res.message)
            }
        } catch (err: any) {
            addNotification('error', err.message)
        } finally {
            setActionLoading(null)
        }
    }

    const handleToggleCfg = async () => {
        if (!window.api?.security) return
        const target = !securityData.cfgEnabled
        setActionLoading('cfg')
        try {
            const res = await window.api.security.toggleCfg(target)
            if (res.success) {
                addNotification('success', res.message)
                addLog(`[Security] Control Flow Guard toggled to ${target ? 'Enabled' : 'Disabled'}`)
                await fetchStatus()
            } else {
                addNotification('error', res.message)
            }
        } catch (err: any) {
            addNotification('error', err.message)
        } finally {
            setActionLoading(null)
        }
    }

    const applyPureGamingProfile = async () => {
        if (!window.api?.security || !window.api?.performance) return
        setActionLoading('all')
        try {
            await window.api.security.toggleVbs(false)
            await window.api.security.toggleHvci(false)
            await window.api.performance.toggleSpectreMitigations(true)
            await window.api.security.toggleCfg(false)
            addNotification('success', 'Applied Pure Gaming Profile (Maximum FPS / 0 virtualization overhead). Reboot required.')
            addLog('[Security Engine] Applied Pure Gaming Profile: VBS Off, HVCI Off, Spectre Off, CFG Off')
            await fetchStatus()
        } catch (err: any) {
            addNotification('error', err.message)
        } finally {
            setActionLoading(null)
        }
    }

    const restoreDefaultProfile = async () => {
        if (!window.api?.security || !window.api?.performance) return
        setActionLoading('all')
        try {
            await window.api.security.toggleVbs(true)
            await window.api.security.toggleHvci(true)
            await window.api.performance.toggleSpectreMitigations(false)
            await window.api.security.toggleCfg(true)
            addNotification('success', 'Restored Windows Standard Security Profile')
            addLog('[Security Engine] Restored Windows Standard Security Profile')
            await fetchStatus()
        } catch (err: any) {
            addNotification('error', err.message)
        } finally {
            setActionLoading(null)
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
        if (score >= 35) return 'text-amber-400 border-amber-500/30 bg-amber-500/10'
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10'
    }

    const getScoreLabel = (score: number) => {
        if (score >= 70) return 'Maximum Protection (High Security)'
        if (score >= 35) return 'Balanced Gaming / Workstation'
        return 'Pure eSports Performance (Zero Overhead)'
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in text-text-primary">
            {/* Header / Hero */}
            <div className="relative overflow-hidden rounded-2xl border border-card-border bg-gradient-to-r from-card-bg via-card-bg to-accent-violet/10 p-8 shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-accent-violet/20 border border-accent-violet/30 text-accent-violet">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Security ↔ Performance Matrix</h1>
                                <p className="text-sm text-text-muted">
                                    Windows 11 kernel virtualization & exploit mitigation trade-offs
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchStatus}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Security Score Badge */}
                <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${getScoreColor(securityData.securityScore)}`}>
                        <div>
                            <div className="text-xs uppercase font-bold tracking-wider opacity-75">Security Posture</div>
                            <div className="text-lg font-bold">{getScoreLabel(securityData.securityScore)}</div>
                        </div>
                        <div className="text-3xl font-black">{securityData.securityScore}<span className="text-sm opacity-50">/100</span></div>
                    </div>

                    <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between">
                        <div>
                            <div className="text-xs uppercase font-bold text-text-muted tracking-wider">Hypervisor State</div>
                            <div className="text-sm font-semibold">{securityData.hypervisorType}</div>
                        </div>
                        <Cpu className="w-6 h-6 text-accent-cyan" />
                    </div>

                    <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between">
                        <div>
                            <div className="text-xs uppercase font-bold text-text-muted tracking-wider">FPS Potential Recaptured</div>
                            <div className="text-sm font-semibold text-emerald-400">
                                {securityData.securityScore < 30 ? '+8% to +15% 1% Lows' : securityData.securityScore < 70 ? '+3% to +7% 1% Lows' : '0% (Stock Protection)'}
                            </div>
                        </div>
                        <Zap className="w-6 h-6 text-accent-violet" />
                    </div>
                </div>
            </div>

            {/* Warning Alert */}
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-text-muted space-y-1">
                    <p className="font-semibold text-amber-300">Competitive eSports vs Daily Workstation Note</p>
                    <p>
                        Disabling VBS, HVCI, and Spectre mitigations yields significant 1% low frame time consistency and eliminates kernel virtualization hook jitter. However, these features protect against memory exploits and rogue drivers. Do not disable if this PC is used for banking, corporate networks, or untrusted downloads.
                    </p>
                </div>
            </div>

            {/* Quick Profile Presets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="p-6 rounded-2xl border border-rose-500/30 bg-gradient-to-br from-card-bg to-rose-500/5 space-y-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-400">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">Pure eSports Profile (Max FPS)</h3>
                            <p className="text-xs text-text-muted">Disables VBS, HVCI, Spectre, and CFG for maximum 1% low framerate</p>
                        </div>
                    </div>
                    <button
                        onClick={applyPureGamingProfile}
                        disabled={actionLoading !== null}
                        className="w-full py-2.5 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        {actionLoading === 'all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                        Apply Pure Gaming Profile (Reboot Required)
                    </button>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-card-bg to-emerald-500/5 space-y-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">Restore Standard Security</h3>
                            <p className="text-xs text-text-muted">Restores Windows 11 default virtualization and hardware security</p>
                        </div>
                    </div>
                    <button
                        onClick={restoreDefaultProfile}
                        disabled={actionLoading !== null}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        {actionLoading === 'all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        Restore Windows Default Security
                    </button>
                </motion.div>
            </div>

            {/* Granular Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. VBS */}
                <div className="p-6 rounded-2xl border border-card-border bg-card-bg space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base">Virtualization-Based Security (VBS)</h3>
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${securityData.vbsEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                                    {securityData.vbsEnabled ? 'ENABLED' : 'DISABLED'}
                                </span>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed">
                                Uses hardware virtualization to create an isolated memory region. Disabling recaptures 5-15% CPU throughput in CPU-bound games (Delta Force, CS2, Valorant).
                            </p>
                        </div>
                    </div>
                    <div className="text-xs text-amber-400/80 bg-amber-500/5 p-3 rounded-lg border border-amber-500/20">
                        ⚠️ Note: Disabling VBS disables Windows Subsystem for Linux (WSL2) and Android emulators.
                    </div>
                    <button
                        onClick={handleToggleVbs}
                        disabled={actionLoading !== null}
                        className={`w-full py-2 px-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${securityData.vbsEnabled ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}
                    >
                        {actionLoading === 'vbs' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {securityData.vbsEnabled ? 'Disable VBS (Boost FPS)' : 'Enable VBS (Restore Defense)'}
                    </button>
                </div>

                {/* 2. HVCI */}
                <div className="p-6 rounded-2xl border border-card-border bg-card-bg space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base">Memory Integrity (HVCI)</h3>
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${securityData.hvciEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                                    {securityData.hvciEnabled ? 'ENABLED' : 'DISABLED'}
                                </span>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed">
                                Hypervisor-Protected Code Integrity verifies kernel code before execution. Known cause of micro-stutters and input latency during high frame rates.
                            </p>
                        </div>
                    </div>
                    <div className="text-xs text-text-dim bg-white/5 p-3 rounded-lg border border-white/10">
                        Primary cause of 1% low frame time instability in Windows 11 23H2/24H2/25H2.
                    </div>
                    <button
                        onClick={handleToggleHvci}
                        disabled={actionLoading !== null}
                        className={`w-full py-2 px-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${securityData.hvciEnabled ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}
                    >
                        {actionLoading === 'hvci' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {securityData.hvciEnabled ? 'Disable Core Isolation (Eliminate Stutter)' : 'Enable Core Isolation'}
                    </button>
                </div>

                {/* 3. Spectre / Meltdown */}
                <div className="p-6 rounded-2xl border border-card-border bg-card-bg space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base">Spectre / Meltdown CPU Mitigations</h3>
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${securityData.spectreDisabled ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                    {securityData.spectreDisabled ? 'DISABLED (FAST)' : 'ENABLED (SECURE)'}
                                </span>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed">
                                Software branch prediction barriers added to mitigate speculative execution side-channel flaws. Disabling removes CPU pipeline stalls.
                            </p>
                        </div>
                    </div>
                    <div className="text-xs text-rose-400/80 bg-rose-500/5 p-3 rounded-lg border border-rose-500/20">
                        ⚠️ High Risk: Only recommended on isolated gaming computers.
                    </div>
                    <button
                        onClick={handleToggleSpectre}
                        disabled={actionLoading !== null}
                        className={`w-full py-2 px-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${securityData.spectreDisabled ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'}`}
                    >
                        {actionLoading === 'spectre' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {securityData.spectreDisabled ? 'Enable CPU Mitigations (Safe)' : 'Disable CPU Mitigations (+5-15% Throughput)'}
                    </button>
                </div>

                {/* 4. Control Flow Guard (CFG) */}
                <div className="p-6 rounded-2xl border border-card-border bg-card-bg space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base">Control Flow Guard (CFG)</h3>
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${securityData.cfgEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                                    {securityData.cfgEnabled ? 'ENABLED' : 'DISABLED'}
                                </span>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed">
                                Exploit mitigation that checks indirect call targets. Disabling reduces CPU branch instructions during complex game physics loops.
                            </p>
                        </div>
                    </div>
                    <div className="text-xs text-text-dim bg-white/5 p-3 rounded-lg border border-white/10">
                        Disabling CFG improves instruction cache throughput for Unreal Engine 5.
                    </div>
                    <button
                        onClick={handleToggleCfg}
                        disabled={actionLoading !== null}
                        className={`w-full py-2 px-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${securityData.cfgEnabled ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}
                    >
                        {actionLoading === 'cfg' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {securityData.cfgEnabled ? 'Disable CFG (Reduce CPU Branches)' : 'Enable CFG'}
                    </button>
                </div>
            </div>
        </div>
    )
}
