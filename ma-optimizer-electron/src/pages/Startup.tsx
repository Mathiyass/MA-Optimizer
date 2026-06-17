import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Power, Trash2, Search, Zap, AlertTriangle, ArrowDownCircle, RefreshCw } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { useLogStore } from '../store/logStore'

const highImpact = ['discord', 'steam', 'spotify', 'onedrive', 'teams', 'skype', 'slack', 'brave', 'chrome', 'firefox', 'edge']
const mediumImpact = ['adobe', 'cortana', 'nvidia', 'realtek', 'logitech', 'razer', 'corsair', 'msi']

function getImpact(name: string): { level: 'High' | 'Medium' | 'Low'; color: string } {
    const lower = name.toLowerCase()
    if (highImpact.some(h => lower.includes(h))) return { level: 'High', color: 'text-[#ff003c] bg-[#ff003c]/10 border-[#ff003c]/30' }
    if (mediumImpact.some(m => lower.includes(m))) return { level: 'Medium', color: 'text-[#FF003C] bg-[#FF003C]/10 border-[#FF003C]/30' }
    return { level: 'Low', color: 'text-[#00FFDE] bg-[#00FFDE]/10 border-[#00FFDE]/30' }
}

export function Startup() {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const addLog = useLogStore(s => s.addLine)
    const addNotification = useAppStore(s => s.addNotification)

    const load = async () => {
        setLoading(true)
        const data = await window.api?.startup.list()
        setItems(data || [])
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    const toggle = async (id: string, enabled: boolean) => {
        await window.api?.startup.toggle(id, enabled)
        addLog(`[STARTUP] ${enabled ? 'Enabled' : 'Disabled'} ${id}`)
        load()
    }

    const remove = async (id: string) => {
        await window.api?.startup.delete(id)
        addLog(`[STARTUP] Removed ${id}`)
        addNotification('info', `Removed ${id} from startup`)
        load()
    }

    const disableAllNonEssential = async () => {
        let count = 0
        for (const item of items) {
            if (item.enabled) {
                const impact = getImpact(item.name)
                if (impact.level === 'High' || impact.level === 'Medium') {
                    await window.api?.startup.toggle(item.id, false)
                    count++
                }
            }
        }
        addNotification('success', `Disabled ${count} non-essential startup items`)
        addLog(`[STARTUP] Disabled ${count} non-essential items`)
        load()
    }

    const enabledCount = items.filter(i => i.enabled).length
    const disabledCount = items.filter(i => !i.enabled).length
    const filtered = items.filter(i =>
        i.name?.toLowerCase().includes(filter.toLowerCase()) ||
        i.path?.toLowerCase().includes(filter.toLowerCase())
    )

    const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } }
    const itemAnim = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { duration: 0.2 } } }

    return (
        <div className="space-y-8 max-w-[90rem] mx-auto w-full pb-10">
            {/* Ultra-Premium Startup Hero Section */}
            <motion.div
                className="relative overflow-hidden rounded-[2.5rem] p-12 transition-all duration-700 border bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[var(--accent-cyan)]/20 animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[#FF003C]/20 animate-pulse" style={{ animationDuration: '6s' }}></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center md:text-left">
                        <motion.h2 className="text-5xl lg:text-6xl font-black mb-4 tracking-tight text-white flex items-center justify-center md:justify-start gap-4">
                            <Zap className="w-12 h-12 text-[var(--accent-cyan)] drop-shadow-[0_0_15px_rgba(0,255,222,0.8)]" />
                            Startup Intelligence
                        </motion.h2>
                        <p className="text-[var(--text-muted)] text-sm uppercase tracking-[0.3em] font-black mb-8">
                            Boot Time Optimization
                        </p>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <p className="text-[var(--text-secondary)] max-w-xl font-medium leading-relaxed">
                                Identify and neutralize high-impact applications that bottleneck your system boot sequence. Achieve instant desktop readiness.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center gap-4">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={disableAllNonEssential}
                            disabled={loading || items.length === 0}
                            className="group relative px-8 py-5 rounded-2xl bg-[#FF003C]/10 border-[#FF003C]/30 hover:border-[#FF003C]/80 hover:bg-[#FF003C]/20 transition-all duration-300 w-full overflow-hidden shadow-[0_0_30px_rgba(255,0,60,0.15)] disabled:opacity-50 disabled:cursor-not-allowed min-w-[240px] border"
                        >
                            <span className="relative z-10 font-black tracking-widest uppercase text-sm flex items-center justify-center gap-3 text-[#FF003C] drop-shadow-[0_0_8px_rgba(255,0,60,0.8)]">
                                <ArrowDownCircle className="w-5 h-5" /> Auto-Disable Bloatware
                            </span>
                        </motion.button>
                        <button onClick={load} className="px-6 py-3 rounded-2xl bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 text-white text-xs font-black tracking-widest uppercase hover:bg-[rgba(255,255,255,0.05)] transition-colors w-full flex items-center justify-center gap-2 border">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Search and Summary */}
            <div className="card-premium bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-[2rem] p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl border">
                <div className="flex-1 relative w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-dim)]" />
                    <input
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        placeholder="Search startup payload..."
                        className="w-full pl-14 pr-6 py-4 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-2xl text-[15px] text-white placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent-cyan)] focus:shadow-[0_0_15px_rgba(0,255,222,0.2)] transition-all border"
                    />
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="flex-1 md:flex-none px-6 py-4 bg-[#00FFDE]/10 border-[#00FFDE]/30 text-[#00FFDE] rounded-2xl flex flex-col items-center justify-center min-w-[120px] border">
                        <span className="text-2xl font-black">{enabledCount}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest mt-1">Active</span>
                    </div>
                    <div className="flex-1 md:flex-none px-6 py-4 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 text-[var(--text-muted)] rounded-2xl flex flex-col items-center justify-center min-w-[120px] border">
                        <span className="text-2xl font-black text-white">{disabledCount}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest mt-1">Disabled</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-accent-cyan" /><span className="ml-2 text-text-muted">Loading...</span></div>
            ) : (
                <motion.div className="space-y-2" variants={container} initial={false} animate="show">
                    {filtered.map(item => {
                        const impact = getImpact(item.name)
                        return (
                                <motion.div
                                    key={item.id}
                                    variants={itemAnim}
                                    className={`flex flex-col sm:flex-row items-center gap-6 p-6 rounded-[2rem] border transition-all duration-300 card-premium ${item.enabled ? 'bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 border-[var(--accent-cyan)]/20 shadow-lg' : 'bg-[rgba(255,255,255,0.01)] backdrop-blur-3xl border-white/5 opacity-60 grayscale'}`}
                                >
                                    {/* Custom Apple-style Glow Toggle */}
                                    <div className="shrink-0 flex items-center justify-center">
                                        <button
                                            onClick={() => toggle(item.id, !item.enabled)}
                                            className={`relative w-14 h-8 rounded-full transition-all duration-300 outline-none flex items-center px-1 border ${item.enabled ? 'bg-[#00FFDE]/20 border-[#00FFDE]/50 shadow-[0_0_15px_rgba(0,255,222,0.3)]' : 'bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 border-white/10'}`}
                                        >
                                            <motion.div
                                                className={`w-6 h-6 rounded-full shadow-md ${item.enabled ? 'bg-[#00FFDE] drop-shadow-[0_0_8px_rgba(0,255,222,0.8)]' : 'bg-[var(--text-dim)]'}`}
                                                animate={{ x: item.enabled ? 24 : 0 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            />
                                        </button>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 text-center sm:text-left w-full">
                                        <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-3 mb-1">
                                            <span className={`text-[17px] font-bold tracking-wide ${item.enabled ? 'text-white' : 'text-[var(--text-muted)]'}`}>{item.name}</span>
                                            <span className={`text-[10px] px-2.5 py-1 rounded-2xl font-black uppercase tracking-widest border ${impact.color}`}>
                                                {impact.level} Impact
                                            </span>
                                        </div>
                                        <div className="text-[var(--text-dim)] text-xs truncate mt-1.5 font-mono bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 px-3 py-1.5 rounded-2xl inline-block max-w-full overflow-hidden border">{item.path}</div>
                                        <div className="text-[var(--text-dim)] text-[10px] uppercase tracking-widest mt-2">{item.source}</div>
                                    </div>
                                    <button onClick={() => remove(item.id)} className="p-3 text-[var(--text-dim)] hover:text-[#ff003c] transition-all rounded-2xl border-transparent hover:border-[#ff003c]/30 hover:bg-[#ff003c]/10 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 shrink-0 border">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </motion.div>
                        )
                    })}
                    {filtered.length === 0 && <div className="text-text-dim text-center py-8">{filter ? 'No matching items' : 'No startup items found'}</div>}
                </motion.div>
            )}
        </div>
    )
}
