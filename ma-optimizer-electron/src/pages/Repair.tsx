import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { HeartPulse, Shield, Wifi, RefreshCw, HardDrive, Loader2, Image, FileText, Clock, CheckCircle2, LucideIcon } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { useLogStore } from '../store/logStore'

interface RepairAction {
    id: string
    icon: LucideIcon
    label: string
    desc: string
    category: string
    estimatedTime: string
    fn: () => Promise<any>
    msg: string
}

const actions: RepairAction[] = [
    // System Files
    { id: 'sfc', icon: Shield, label: 'SFC /scannow', desc: 'Scan and repair system files', category: 'System Files', estimatedTime: '~10 min', fn: () => window.api?.repair.runSfc(), msg: 'SFC scan complete' },
    { id: 'dism_check', icon: HeartPulse, label: 'DISM Check Health', desc: 'Quick component store health check', category: 'System Files', estimatedTime: '~2 min', fn: () => window.api?.repair.runDism('checkHealth'), msg: 'DISM check complete' },
    { id: 'dism_scan', icon: HeartPulse, label: 'DISM Scan Health', desc: 'Deep integrity scan of component store', category: 'System Files', estimatedTime: '~5 min', fn: () => window.api?.repair.runDism('scanHealth'), msg: 'DISM scan complete' },
    { id: 'dism_restore', icon: HeartPulse, label: 'DISM Restore Health', desc: 'Repair component store from Windows Update', category: 'System Files', estimatedTime: '~15 min', fn: () => window.api?.repair.runDism('restoreHealth'), msg: 'DISM restore complete' },
    // Network
    { id: 'net_reset', icon: Wifi, label: 'Full Network Reset', desc: 'Reset Winsock, TCP/IP, DNS cache', category: 'Network', estimatedTime: '~1 min', fn: () => window.api?.repair.resetNetwork(), msg: 'Network reset — restart required' },
    { id: 'wu_reset', icon: RefreshCw, label: 'Reset Windows Update', desc: 'Fix stuck or broken Windows Updates', category: 'Network', estimatedTime: '~2 min', fn: () => window.api?.repair.resetWindowsUpdate(), msg: 'Windows Update reset complete' },
    { id: 'wsreset', icon: RefreshCw, label: 'Reset Windows Store', desc: 'Clear Microsoft Store cache', category: 'Network', estimatedTime: '~30 sec', fn: () => window.api?.repair.wsreset(), msg: 'Store reset complete' },
    // Storage
    { id: 'chkdsk', icon: HardDrive, label: 'Check Disk (C:)', desc: 'Scan disk for filesystem errors', category: 'Storage', estimatedTime: '~5 min', fn: () => window.api?.repair.checkDisk('C:'), msg: 'Disk check complete' },
    // Misc
    { id: 'icon_cache', icon: Image, label: 'Rebuild Icon Cache', desc: 'Fix broken or missing desktop icons', category: 'Misc', estimatedTime: '~30 sec', fn: () => window.api?.repair.rebuildIconCache(), msg: 'Icon cache rebuilt' },
    { id: 'hosts', icon: FileText, label: 'Reset Hosts File', desc: 'Restore default Windows hosts file', category: 'Misc', estimatedTime: '~10 sec', fn: () => window.api?.repair.fixHosts(), msg: 'Hosts file restored' },
]

const categoryColors: Record<string, string> = {
    'System Files': 'from-[#00FFDE] to-[#00FFDE]/50',
    'Network': 'from-[#FF003C] to-[#00FFDE]',
    'Storage': 'from-[#00FFDE] to-[#00FFDE]/50',
    'Misc': 'from-[#FF003C] to-[#FF003C]/50',
}

export function Repair() {
    const [running, setRunning] = useState<string | null>(null)
    const [completed, setCompleted] = useState<Set<string>>(new Set())
    const addNotification = useAppStore(s => s.addNotification)
    const addLog = useLogStore(s => s.addLine)

    const run = async (action: RepairAction) => {
        setRunning(action.id)
        addLog(`[REPAIR] Starting ${action.label}...`)
        try {
            await action.fn()
            addNotification('success', action.msg)
            addLog(`[REPAIR] ✅ ${action.label} completed`)
            setCompleted(prev => new Set(prev).add(action.id))
        } catch (e) {
            addLog(`[ERROR] ${action.label} failed: ${e}`)
            addNotification('error', `${action.label} failed`)
        }
        setRunning(null)
    }

    const createRP = async () => {
        setRunning('rp')
        addLog('[REPAIR] Creating system restore point...')
        await window.api?.repair.createRestorePoint('MA-Optimizer Backup')
        setRunning(null)
        addNotification('success', 'Restore point created')
        addLog('[REPAIR] ✅ Restore point created')
    }

    const categories = Array.from(new Set(actions.map(a => a.category)))

    const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
    const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }

    return (
        <motion.div className="space-y-8 max-w-[90rem] mx-auto w-full pb-10" variants={container} initial={false} animate="show">
            {/* Ultra-Premium Repair Hero Section */}
            <motion.div variants={item}
                className="relative overflow-hidden rounded-[2.5rem] p-12 transition-all duration-700 border bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/5"
            >
                <div className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[var(--accent-cyan)]/20 animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[#00FFDE]/20 animate-pulse" style={{ animationDuration: '6s' }}></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center md:text-left">
                        <motion.h2 className="text-5xl lg:text-6xl font-black mb-4 tracking-tight text-white flex items-center justify-center md:justify-start gap-4">
                            <HeartPulse className="w-12 h-12 text-[var(--accent-cyan)] drop-shadow-[0_0_15px_rgba(0,255,222,0.8)]" />
                            System Repair
                        </motion.h2>
                        <p className="text-[var(--text-muted)] text-sm uppercase tracking-[0.3em] font-black mb-8">
                            Integrity & Recovery Tools
                        </p>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <p className="text-[var(--text-secondary)] max-w-xl font-medium leading-relaxed">
                                Diagnose and repair corrupted system files, broken network stacks, and registry inconsistencies. Restore stability safely.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center gap-4">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={createRP}
                            disabled={running === 'rp'}
                            className="group relative px-8 py-5 rounded-2xl bg-[#00FFDE]/10 border-[#00FFDE]/30 hover:border-[#00FFDE]/80 hover:bg-[#00FFDE]/20 transition-all duration-300 w-full overflow-hidden shadow-[0_0_30px_rgba(0,255,222,0.15)] disabled:opacity-50 disabled:cursor-not-allowed min-w-[240px]"
                        >
                            <span className="relative z-10 font-black tracking-widest uppercase text-sm flex items-center justify-center gap-3 text-[#00FFDE] drop-shadow-[0_0_8px_rgba(0,255,222,0.8)]">
                                {running === 'rp' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                                {running === 'rp' ? 'Creating...' : 'Create Restore Point'}
                            </span>
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Progress indicator for running action */}
            {running && running !== 'rp' && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="card-premium bg-[rgba(0,255,222,0.05)] border-[var(--accent-cyan)]/30 rounded-[2rem] p-8 flex items-center gap-6 shadow-[0_0_30px_rgba(0,255,222,0.1)] relative overflow-hidden backdrop-blur-xl"
                >
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[var(--accent-cyan)] to-transparent"></div>
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-cyan)] shrink-0 drop-shadow-[0_0_10px_rgba(0,255,222,0.8)]" />
                    <div className="flex-1">
                        <div className="text-white text-lg font-black tracking-wide">Executing: {actions.find(a => a.id === running)?.label}</div>
                        <div className="text-[var(--text-muted)] text-sm mt-1 font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Estimated duration: {actions.find(a => a.id === running)?.estimatedTime}
                        </div>
                    </div>
                    <div className="w-48 h-2 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-full overflow-hidden border-white/5 shadow-inner">
                        <div className="h-full bg-gradient-to-r from-[var(--accent-cyan)] to-[#00FFDE] rounded-full animate-shimmer" style={{ width: '60%' }} />
                    </div>
                </motion.div>
            )}

            {/* Grouped actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {categories.map(category => (
                    <motion.div key={category} variants={item} className="card-premium border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 backdrop-blur-xl rounded-[2rem] p-8 shadow-xl">
                        <h3 className="text-white text-xl font-black tracking-wide flex items-center gap-3 mb-6">
                            <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${categoryColors[category] || 'from-[rgba(255,255,255,0.2)] to-[rgba(255,255,255,0.1)]'} shadow-[0_0_10px_rgba(255,255,255,0.3)]`} />
                            {category}
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {actions.filter(a => a.category === category).map(a => {
                                const isCompleted = completed.has(a.id)
                                const isRunning = running === a.id
                                return (
                                    <motion.button
                                        key={a.id}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => run(a)}
                                        disabled={running !== null}
                                        className={`flex items-center gap-5 p-5 rounded-2xl border text-left transition-all duration-300 ${isRunning
                                            ? 'border-[var(--accent-cyan)]/50 bg-[var(--accent-cyan)]/10 shadow-[0_0_15px_rgba(0,255,222,0.1)]'
                                            : isCompleted
                                                ? 'border-[#00FFDE]/30 bg-[#00FFDE]/10'
                                                : 'border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 hover:border-white/20 hover:bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 shadow-inner'
                                            } ${running !== null && !isRunning ? 'opacity-40 grayscale' : ''}`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${isRunning ? 'border-[var(--accent-cyan)]/50 bg-[var(--accent-cyan)]/20' : isCompleted ? 'border-[#00FFDE]/30 bg-[#00FFDE]/20' : 'border-white/10 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5'}`}>
                                            {isRunning ? (
                                                <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-cyan)]" />
                                            ) : isCompleted ? (
                                                <CheckCircle2 className="w-6 h-6 text-[#00FFDE]" />
                                            ) : (
                                                <a.icon className="w-6 h-6 text-[var(--accent-cyan)]" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white text-[15px] font-bold tracking-wide">{a.label}</div>
                                            <div className="text-[var(--text-muted)] text-xs mt-1 font-medium">{a.desc}</div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[var(--text-dim)] bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 px-3 py-1.5 rounded-2xl border-white/5 whitespace-nowrap">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-black tracking-widest uppercase">{a.estimatedTime}</span>
                                        </div>
                                    </motion.button>
                                )
                            })}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}
