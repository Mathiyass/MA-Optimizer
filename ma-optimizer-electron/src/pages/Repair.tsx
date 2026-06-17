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
    'System Files': 'from-cyan-500 to-blue-500',
    'Network': 'from-orange-500 to-amber-500',
    'Storage': 'from-green-500 to-emerald-500',
    'Misc': 'from-violet-500 to-purple-500',
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
        <motion.div className="space-y-6 max-w-5xl" variants={container} initial={false} animate="show">
            <motion.div variants={item} className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <HeartPulse className="w-6 h-6 text-accent-cyan" /> Repair & Fix
                    </h2>
                    <p className="text-text-muted text-sm mt-1">System repair tools and recovery options</p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={createRP}
                    disabled={running === 'rp'}
                    className="px-5 py-2.5 bg-success/15 text-success rounded-xl text-sm font-medium hover:bg-success/25 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    {running === 'rp' ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : '📌 Create Restore Point'}
                </motion.button>
            </motion.div>

            {/* Progress indicator for running action */}
            {running && running !== 'rp' && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-accent-cyan/5 border border-accent-cyan/20 rounded-xl p-4 flex items-center gap-4"
                >
                    <Loader2 className="w-5 h-5 animate-spin text-accent-cyan shrink-0" />
                    <div className="flex-1">
                        <div className="text-text-primary text-sm font-medium">Running: {actions.find(a => a.id === running)?.label}</div>
                        <div className="text-text-dim text-xs mt-0.5">
                            Estimated time: {actions.find(a => a.id === running)?.estimatedTime}
                        </div>
                    </div>
                    <div className="w-32 h-1.5 bg-card-border rounded-full overflow-hidden">
                        <div className="h-full bg-accent-cyan rounded-full animate-shimmer" style={{ width: '60%' }} />
                    </div>
                </motion.div>
            )}

            {/* Grouped actions */}
            {categories.map(category => (
                <motion.div key={category} variants={item} className="space-y-2">
                    <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
                        <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${categoryColors[category] || 'from-gray-500 to-gray-600'}`} />
                        {category}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {actions.filter(a => a.category === category).map(a => {
                            const isCompleted = completed.has(a.id)
                            const isRunning = running === a.id
                            return (
                                <motion.button
                                    key={a.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => run(a)}
                                    disabled={running !== null}
                                    className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all card-premium ${isRunning
                                        ? 'border-accent-cyan/30 bg-accent-cyan/5'
                                        : isCompleted
                                            ? 'border-success/20 bg-success/5'
                                            : 'border-card-border bg-card-bg hover:border-white/10'
                                        } ${running !== null && !isRunning ? 'opacity-40' : ''}`}
                                >
                                    {isRunning ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-accent-cyan shrink-0" />
                                    ) : isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                                    ) : (
                                        <a.icon className="w-5 h-5 text-accent-cyan shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-text-primary text-sm font-medium">{a.label}</div>
                                        <div className="text-text-dim text-xs">{a.desc}</div>
                                    </div>
                                    <div className="flex items-center gap-1 text-text-dim">
                                        <Clock className="w-3 h-3" />
                                        <span className="text-[10px]">{a.estimatedTime}</span>
                                    </div>
                                </motion.button>
                            )
                        })}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    )
}
