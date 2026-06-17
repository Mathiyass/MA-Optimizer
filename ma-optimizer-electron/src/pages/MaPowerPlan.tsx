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
                                ? i < bars * 0.4 ? '#00FFDE' : i < bars * 0.7 ? '#FF003C' : '#ff4444'
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
        { id: 'performance', label: 'Max Performance', desc: 'All cores unlocked, no throttle', icon: '🔥', gradient: 'from-[#FF003C] to-[#FF003C]/50' },
        { id: 'balanced', label: 'Balanced', desc: 'Moderate parking, some sleep', icon: '⚖️', gradient: 'from-[#00FFDE] to-[#00FFDE]/50' },
        { id: 'battery', label: 'Battery Saver', desc: 'Aggressive parking, sleep enabled', icon: '🔋', gradient: 'from-[#00FFDE] to-[#00FFDE]/50' },
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
        <motion.div className="space-y-8 max-w-[90rem] mx-auto w-full pb-10" variants={container} initial={false} animate="show">
            {/* Ultra-Premium Power Plan Hero Section */}
            <motion.div variants={item}
                className="relative overflow-hidden rounded-[2.5rem] p-12 transition-all duration-700 border bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/5"
            >
                <div className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[var(--accent-violet)]/20 animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[#ff003c]/20 animate-pulse" style={{ animationDuration: '6s' }}></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                            <motion.div
                                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-violet)] to-[#ff003c] flex items-center justify-center shadow-xl relative"
                                animate={{
                                    boxShadow: isActive
                                        ? ['0 0 20px rgba(255,0,60,0.3)', '0 0 40px rgba(255,0,60,0.5)', '0 0 20px rgba(255,0,60,0.3)']
                                        : '0 10px 30px rgba(255,0,60,0.2)'
                                }}
                                transition={isActive ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
                            >
                                <Crown className="w-8 h-8 text-white relative z-10" />
                                {isActive && <div className="absolute inset-0 rounded-2xl border-2 border-white/50 animate-ping opacity-20"></div>}
                            </motion.div>
                            <div>
                                <h2 className="text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,0,60,0.5)]">
                                    MA Power
                                </h2>
                            </div>
                        </div>

                        <p className="text-[#FF003C] text-sm uppercase tracking-[0.3em] font-black mb-8">
                            ★ Flagship Hardware Control
                        </p>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
                            <p className="text-[var(--text-secondary)] max-w-xl font-medium leading-relaxed">
                                Deploy our proprietary custom power plan with 40+ tuned sub-settings. Zero CPU throttling, disabled core parking, and hyper-optimized P-states for maximum framerates.
                            </p>
                        </div>

                        <div className="flex items-center justify-center md:justify-start gap-4 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 p-4 rounded-2xl border-white/5 inline-flex backdrop-blur-md">
                            <div className={`px-4 py-2 rounded-2xl text-xs font-black tracking-widest uppercase border ${isActive ? 'bg-[#00FFDE]/10 text-[#00FFDE] border-[#00FFDE]/30 shadow-[0_0_15px_rgba(0,255,222,0.2)]' : 'bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 text-[var(--text-muted)] border-white/10'}`}>
                                {isActive ? '● Active' : exists ? '⏸️ Standby' : '❌ Unconfigured'}
                            </div>
                            {activePlan && <div className="text-[var(--text-secondary)] text-sm font-bold tracking-wide">Profile: <span className="text-white">{activePlan.name}</span></div>}
                            <div className="h-8 w-px bg-white/10 mx-2"></div>
                            <PowerMeter active={isActive} />
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center gap-4 w-full md:w-auto min-w-[240px]">
                        <motion.button whileTap={{ scale: 0.95 }} onClick={isActive ? deactivate : activate} disabled={loading}
                            className={`group relative px-8 py-5 rounded-2xl transition-all duration-500 w-full overflow-hidden shadow-xl border ${isActive
                                ? 'bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 border-white/10 hover:border-[#ff003c]/50 hover:bg-[rgba(255,0,60,0.1)]'
                                : 'bg-gradient-to-r from-[var(--accent-violet)] to-[#ff003c] border-white/20 hover:shadow-[0_0_30px_rgba(255,0,60,0.4)]'
                                } ${loading ? 'opacity-50 cursor-wait' : ''}`}>
                            {!isActive && <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-500"></div>}
                            <span className="relative z-10 font-black tracking-widest uppercase text-sm flex items-center justify-center gap-3 text-white">
                                {loading ? 'Working...' : isActive ? 'Deactivate' : exists ? 'Activate' : 'Create & Activate'}
                            </span>
                        </motion.button>
                        
                        {exists && (
                            <button onClick={deletePlan} className="text-[#ff003c] text-xs font-bold tracking-widest uppercase hover:text-white transition-colors flex items-center gap-2 px-4 py-2 bg-[#ff003c]/5 rounded-2xl border-[#ff003c]/20 hover:bg-[#ff003c]/20 w-full justify-center">
                                <Trash2 className="w-4 h-4" /> Purge Plan
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Plan Features */}
            <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: Zap, label: 'Zero Core Parking', desc: '100% cores active' },
                    { icon: Activity, label: 'No Throttling', desc: 'Maximum P-states' },
                    { icon: Timer, label: 'Timer 0.5ms', desc: 'Low-latency timer' },
                    { icon: Battery, label: 'No Sleep States', desc: 'C-states disabled' },
                ].map((f, i) => (
                    <div key={i} className="card-premium bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 backdrop-blur-xl border-white/5 rounded-[2rem] p-6 text-center hover:border-[var(--accent-violet)]/30 hover:shadow-[0_0_20px_rgba(0,255,222,0.1)] transition-all duration-300">
                        <div className="w-12 h-12 rounded-2xl bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 border-white/10 mx-auto mb-4 flex items-center justify-center shadow-inner">
                            <f.icon className="w-6 h-6 text-[#FF003C] drop-shadow-[0_0_10px_rgba(0,255,222,0.5)]" />
                        </div>
                        <div className="text-white text-sm font-black tracking-wide mb-1">{f.label}</div>
                        <div className="text-[var(--text-muted)] text-xs font-medium">{f.desc}</div>
                    </div>
                ))}
            </motion.div>

            {/* Profiles */}
            <motion.div variants={item}>
                <h3 className="text-white text-xl font-black tracking-wide mb-6">Quick Profiles</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {profiles.map(p => (
                        <motion.button
                            key={p.id}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => applyProfile(p.id)}
                            disabled={!exists || loading}
                            className="relative overflow-hidden text-left p-6 rounded-[2rem] border transition-all duration-300 disabled:opacity-40 group bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 backdrop-blur-xl border-white/5 hover:border-[var(--accent-violet)]/40 hover:shadow-[0_0_30px_rgba(0,255,222,0.15)]"
                        >
                            <div className={`absolute -right-10 -top-10 w-32 h-32 blur-[60px] rounded-full pointer-events-none bg-gradient-to-br ${p.gradient} opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
                            <div className="text-3xl mb-4 relative z-10 drop-shadow-xl">{p.icon}</div>
                            <div className="text-white font-black tracking-wide text-lg relative z-10">{p.label}</div>
                            <div className="text-[var(--text-muted)] text-xs mt-2 relative z-10 font-medium">{p.desc}</div>
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Reports & Tools */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-premium border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 backdrop-blur-xl rounded-[2rem] p-8 shadow-xl">
                    <h3 className="text-white text-lg font-black tracking-wide mb-6 flex items-center gap-3"><FileText className="w-5 h-5 text-[var(--accent-cyan)]" />System Reports</h3>
                    <div className="space-y-2">
                        {[
                            { label: 'Energy Report', fn: () => window.api?.powerPlan.generateEnergyReport() },
                            { label: 'Battery Report', fn: () => window.api?.powerPlan.generateBatteryReport() },
                            { label: 'Sleep Study', fn: () => window.api?.powerPlan.generateSleepStudy() },
                        ].map(r => (
                            <button key={r.label} onClick={r.fn} className="w-full text-left px-5 py-4 rounded-2xl text-sm font-bold text-[var(--text-secondary)] bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 hover:border-[var(--accent-cyan)]/30 hover:bg-[rgba(0,255,222,0.05)] hover:text-white transition-all duration-300 flex justify-between items-center group">
                                {r.label} <span className="text-[var(--text-dim)] group-hover:text-[var(--accent-cyan)] transition-colors">→</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="card-premium border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 backdrop-blur-xl rounded-[2rem] p-8 shadow-xl">
                    <h3 className="text-white text-lg font-black tracking-wide mb-6 flex items-center gap-3"><Download className="w-5 h-5 text-[var(--accent-cyan)]" />Import / Export</h3>
                    <div className="space-y-2">
                        <button onClick={handleExport} className="w-full text-left px-5 py-4 rounded-2xl text-sm font-bold text-[var(--text-secondary)] bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 hover:border-[var(--accent-cyan)]/30 hover:bg-[rgba(0,255,222,0.05)] hover:text-white transition-all duration-300 flex items-center gap-3"><Upload className="w-4 h-4" />Export Profile</button>
                        <button onClick={handleImport} className="w-full text-left px-5 py-4 rounded-2xl text-sm font-bold text-[var(--text-secondary)] bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 hover:border-[var(--accent-cyan)]/30 hover:bg-[rgba(0,255,222,0.05)] hover:text-white transition-all duration-300 flex items-center gap-3"><Download className="w-4 h-4" />Import Profile</button>
                    </div>
                </div>
            </motion.div>

            {/* All Plans */}
            <motion.div variants={item} className="card-premium border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 backdrop-blur-xl rounded-[2rem] p-8 shadow-xl">
                <h3 className="text-white text-xl font-black tracking-wide mb-6">System Power Plans</h3>
                <div className="space-y-3">
                    {allPlans.map(p => (
                        <div key={p.guid} className={`flex items-center justify-between px-6 py-4 rounded-2xl border transition-all duration-300 ${p.active ? 'border-[var(--accent-violet)]/50 bg-[var(--accent-violet)]/10 shadow-[0_0_15px_rgba(0,255,222,0.15)]' : 'border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 hover:border-white/20'}`}>
                            <div>
                                <span className="text-white text-[15px] font-bold tracking-wide">{p.name}</span>
                                {p.active && <span className="ml-3 text-[#FF003C] text-[10px] font-black tracking-widest uppercase border-[var(--accent-violet)]/30 px-2 py-0.5 rounded-2xl bg-[var(--accent-violet)]/20 shadow-[0_0_8px_rgba(0,255,222,0.4)]">● Active</span>}
                                <div className="text-[var(--text-dim)] text-xs mt-1 font-mono tracking-wider">{p.guid}</div>
                            </div>
                            {!p.active && (
                                <button onClick={() => activateByGuid(p.guid)} className="px-5 py-2.5 text-xs font-black tracking-widest uppercase bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-2xl border-white/10 hover:bg-[rgba(255,255,255,0.05)] hover:border-[var(--accent-cyan)]/50 hover:text-[var(--accent-cyan)] hover:shadow-[0_0_15px_rgba(0,255,222,0.2)] text-white transition-all">
                                    Activate
                                </button>
                            )}
                        </div>
                    ))}
                    {allPlans.length === 0 && <div className="text-[var(--text-muted)] font-black tracking-widest uppercase text-sm text-center py-8">Scanning system plans...</div>}
                </div>
            </motion.div>
        </motion.div>
    )
}
