import React from 'react'
import { motion } from 'framer-motion'
import { Crown, Zap, Timer, FileText, Trash2, Download, Upload, Battery, Activity } from 'lucide-react'
import { usePowerPlan } from '../hooks/usePowerPlan'
import { useAppStore } from '../store/appStore'

function PowerMeter({ active }: { active: boolean }) {
    const bars = 12
    return (
        <div className="flex items-end gap-1 h-8">
            {Array.from({ length: bars }).map((_, i) => {
                const height = 8 + (i / bars) * 24
                const isLit = active && i < bars
                const delay = i * 0.05
                return (
                    <motion.div
                        key={i}
                        className="w-1.5 rounded-full"
                        style={{
                            background: isLit
                                ? i < bars * 0.4 ? '#00ff88' : i < bars * 0.7 ? '#ffd700' : '#ff4444'
                                : '#21262d',
                        }}
                        initial={{ height: 0 }}
                        animate={{ height: isLit ? height : 8 }}
                        transition={{ duration: 0.3, delay }}
                    />
                )
            })}
        </div>
    )
}

export function MaPowerPlan() {
    const { isActive, exists, loading, activePlan, allPlans, activate, deactivate, applyProfile, deletePlan, activateByGuid, refresh } = usePowerPlan()
    const addNotification = useAppStore(s => s.addNotification)

    const profiles = [
        { id: 'performance', label: 'Max Performance', desc: 'All cores unlocked, no throttle', icon: '🔥', gradient: 'from-red-500 to-orange-500' },
        { id: 'balanced', label: 'Balanced', desc: 'Moderate parking, some sleep', icon: '⚖️', gradient: 'from-cyan-500 to-blue-500' },
        { id: 'battery', label: 'Battery Saver', desc: 'Aggressive parking, sleep enabled', icon: '🔋', gradient: 'from-green-500 to-emerald-500' },
    ]

    const handleExport = async () => {
        const result = await window.api?.saveDialog({ title: 'Export MA Power Plan', filters: [{ name: 'Power Plan', extensions: ['pow'] }] })
        if (result?.filePath) {
            await window.api?.powerPlan.exportPlan(result.filePath)
            addNotification('success', 'Power plan exported')
        }
    }

    const handleImport = async () => {
        const result = await window.api?.openDialog({ title: 'Import Power Plan', filters: [{ name: 'Power Plan', extensions: ['pow'] }], properties: ['openFile'] })
        if (result?.filePaths?.[0]) {
            await window.api?.powerPlan.importPlan(result.filePaths[0])
            addNotification('success', 'Power plan imported')
            refresh()
        }
    }

    const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
    const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

    return (
        <motion.div className="space-y-6 max-w-5xl" variants={container} initial={false} animate="show">
            {/* Hero */}
            <motion.div variants={item} className="relative overflow-hidden rounded-2xl border border-accent-violet/30 bg-gradient-to-br from-[#2a0a0f] via-[#1f0810] to-card-bg p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,0,60,0.15),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,255,222,0.05),transparent_50%)]" />
                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <motion.div
                                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-violet to-red-700 flex items-center justify-center shadow-xl"
                                animate={{
                                    boxShadow: isActive
                                        ? ['0 0 20px rgba(255,0,60,0.3)', '0 0 40px rgba(255,0,60,0.5)', '0 0 20px rgba(255,0,60,0.3)']
                                        : '0 10px 30px rgba(255,0,60,0.2)'
                                }}
                                transition={isActive ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
                            >
                                <Crown className="w-7 h-7 text-white" />
                            </motion.div>
                            <div>
                                <h2 className="text-2xl font-bold text-text-primary">MA Power Plan</h2>
                                <p className="text-accent-violet text-sm font-medium">★ Flagship Feature</p>
                            </div>
                        </div>
                        <p className="text-text-muted text-sm max-w-lg mb-4">Custom power plan with 40+ sub-settings: zero CPU throttling, no core parking, disabled sleep states, PCIe link state off, USB suspend off, optimized timer resolution, and multimedia profile tuning.</p>
                        <div className="flex items-center gap-4">
                            <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${isActive ? 'bg-success/15 text-success' : 'bg-card-border text-text-dim'}`}>
                                {isActive ? '✅ Active' : exists ? '⏸️ Inactive' : '❌ Not Created'}
                            </div>
                            {activePlan && <div className="text-text-dim text-xs">Current: {activePlan.name}</div>}
                            <PowerMeter active={isActive} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <motion.button whileTap={{ scale: 0.95 }} onClick={isActive ? deactivate : activate} disabled={loading}
                            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${isActive
                                ? 'bg-card-border text-text-muted hover:bg-white/10'
                                : 'bg-gradient-to-r from-accent-violet to-red-700 text-white shadow-lg shadow-accent-violet/30 hover:shadow-accent-violet/50'
                                } ${loading ? 'opacity-50 cursor-wait' : ''}`}>
                            {loading ? '⏳ Working...' : isActive ? 'Deactivate' : exists ? 'Activate' : '⚡ Create & Activate'}
                        </motion.button>
                        {exists && (
                            <button onClick={deletePlan} className="text-danger text-xs hover:underline text-right">
                                <Trash2 className="w-3 h-3 inline mr-1" />Delete Plan
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Plan Features */}
            <motion.div variants={item} className="grid grid-cols-4 gap-3">
                {[
                    { icon: Zap, label: 'Zero Core Parking', desc: '100% cores active' },
                    { icon: Activity, label: 'No Throttling', desc: 'Maximum P-states' },
                    { icon: Timer, label: 'Timer 0.5ms', desc: 'Low-latency timer' },
                    { icon: Battery, label: 'No Sleep States', desc: 'C-states disabled' },
                ].map((f, i) => (
                    <div key={i} className="bg-card-bg border border-card-border rounded-xl p-4 text-center card-premium">
                        <f.icon className="w-5 h-5 text-accent-violet mx-auto mb-2" />
                        <div className="text-text-primary text-xs font-semibold">{f.label}</div>
                        <div className="text-text-dim text-[10px] mt-0.5">{f.desc}</div>
                    </div>
                ))}
            </motion.div>

            {/* Profiles */}
            <motion.div variants={item}>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Quick Profiles</h3>
                <div className="grid grid-cols-3 gap-4">
                    {profiles.map(p => (
                        <motion.button
                            key={p.id}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => applyProfile(p.id)}
                            disabled={!exists || loading}
                            className="bg-card-bg border border-card-border rounded-xl p-5 text-left hover:border-accent-violet/30 transition-all disabled:opacity-40 card-premium hover-lift"
                        >
                            <div className="text-2xl mb-2">{p.icon}</div>
                            <div className="text-text-primary font-semibold text-sm">{p.label}</div>
                            <div className="text-text-dim text-xs mt-0.5">{p.desc}</div>
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Reports & Tools */}
            <motion.div variants={item} className="grid grid-cols-2 gap-4">
                <div className="bg-card-bg border border-card-border rounded-xl p-5 card-premium">
                    <h3 className="text-text-primary font-semibold mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-accent-cyan" />Reports</h3>
                    <div className="space-y-1">
                        {[
                            { label: 'Energy Report', fn: () => window.api?.powerPlan.generateEnergyReport() },
                            { label: 'Battery Report', fn: () => window.api?.powerPlan.generateBatteryReport() },
                            { label: 'Sleep Study', fn: () => window.api?.powerPlan.generateSleepStudy() },
                        ].map(r => (
                            <button key={r.label} onClick={r.fn} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-text-muted hover:bg-white/5 hover:text-text-primary transition-all">
                                {r.label} →
                            </button>
                        ))}
                    </div>
                </div>
                <div className="bg-card-bg border border-card-border rounded-xl p-5 card-premium">
                    <h3 className="text-text-primary font-semibold mb-3 flex items-center gap-2"><Download className="w-4 h-4 text-accent-cyan" />Import / Export</h3>
                    <div className="space-y-1">
                        <button onClick={handleExport} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-text-muted hover:bg-white/5 hover:text-text-primary transition-all flex items-center gap-2"><Upload className="w-3.5 h-3.5" />Export Plan</button>
                        <button onClick={handleImport} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-text-muted hover:bg-white/5 hover:text-text-primary transition-all flex items-center gap-2"><Download className="w-3.5 h-3.5" />Import Plan</button>
                    </div>
                </div>
            </motion.div>

            {/* All Plans */}
            <motion.div variants={item} className="bg-card-bg border border-card-border rounded-xl p-5 card-premium">
                <h3 className="text-text-primary font-semibold mb-3">All Power Plans</h3>
                <div className="space-y-2">
                    {allPlans.map(p => (
                        <div key={p.guid} className={`flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all ${p.active ? 'border-accent-violet/30 bg-accent-violet/5' : 'border-card-border hover:border-card-border/80'}`}>
                            <div>
                                <span className="text-text-primary text-sm font-medium">{p.name}</span>
                                {p.active && <span className="ml-2 text-accent-violet text-xs font-semibold">● Active</span>}
                                <div className="text-text-dim text-[10px] font-mono">{p.guid}</div>
                            </div>
                            {!p.active && (
                                <button onClick={() => activateByGuid(p.guid)} className="px-3 py-1 text-xs bg-card-border rounded-lg hover:bg-white/10 text-text-muted transition-all">
                                    Activate
                                </button>
                            )}
                        </div>
                    ))}
                    {allPlans.length === 0 && <div className="text-text-dim text-sm text-center py-4">Loading plans...</div>}
                </div>
            </motion.div>
        </motion.div>
    )
}
