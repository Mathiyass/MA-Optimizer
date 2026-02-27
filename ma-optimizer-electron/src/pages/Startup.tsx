import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Power, Trash2, Search, Zap, AlertTriangle, ArrowDownCircle } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { useLogStore } from '../store/logStore'

// Known high-impact startup programs
const highImpact = ['discord', 'steam', 'spotify', 'onedrive', 'teams', 'skype', 'slack', 'brave', 'chrome', 'firefox', 'edge']
const mediumImpact = ['adobe', 'cortana', 'nvidia', 'realtek', 'logitech', 'razer', 'corsair', 'msi']

function getImpact(name: string): { level: 'High' | 'Medium' | 'Low'; color: string } {
    const lower = name.toLowerCase()
    if (highImpact.some(h => lower.includes(h))) return { level: 'High', color: 'text-danger bg-danger/10' }
    if (mediumImpact.some(m => lower.includes(m))) return { level: 'Medium', color: 'text-warning bg-warning/10' }
    return { level: 'Low', color: 'text-success bg-success/10' }
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
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <Zap className="w-6 h-6 text-accent-cyan" /> Startup Manager
                    </h2>
                    <p className="text-text-muted text-sm mt-1">Control what runs when Windows starts</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={disableAllNonEssential}
                        disabled={loading || items.length === 0}
                        className="px-4 py-2 bg-warning/10 border border-warning/30 rounded-lg text-warning text-sm font-medium hover:bg-warning/20 transition-colors disabled:opacity-40"
                    >
                        <ArrowDownCircle className="w-4 h-4 inline mr-1.5" />Disable Non-Essential
                    </button>
                    <button onClick={load} className="px-4 py-2 bg-card-bg border border-card-border rounded-lg text-sm text-text-muted hover:text-text-primary transition-all">Refresh</button>
                </div>
            </div>

            {/* Summary bar */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                    <input
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        placeholder="Filter startup items..."
                        className="w-full pl-10 pr-4 py-2.5 bg-app-bg border border-card-border rounded-xl text-sm text-text-primary placeholder:text-text-dim outline-none focus:border-accent-cyan/40 transition-colors"
                    />
                </div>
                <div className="flex gap-3 text-xs">
                    <span className="px-3 py-1.5 bg-success/10 text-success rounded-lg font-medium">{enabledCount} Enabled</span>
                    <span className="px-3 py-1.5 bg-card-border text-text-dim rounded-lg font-medium">{disabledCount} Disabled</span>
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
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${item.enabled ? 'bg-card-bg border-card-border' : 'bg-card-bg/50 border-card-border/50 opacity-70'}`}
                            >
                                <button
                                    onClick={() => toggle(item.id, !item.enabled)}
                                    className={`relative w-11 h-6 rounded-full transition-all duration-200 ${item.enabled ? 'bg-success shadow-[0_0_8px_rgba(0,255,136,0.2)]' : 'bg-card-border'}`}
                                >
                                    <motion.div
                                        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                                        animate={{ x: item.enabled ? 20 : 0 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-text-primary text-sm font-medium">{item.name}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${impact.color}`}>
                                            {impact.level} Impact
                                        </span>
                                    </div>
                                    <div className="text-text-dim text-xs truncate mt-0.5">{item.path}</div>
                                    <div className="text-text-dim text-[10px]">{item.source}</div>
                                </div>
                                <button onClick={() => remove(item.id)} className="p-2 text-text-dim hover:text-danger transition-colors rounded-lg hover:bg-danger/10">
                                    <Trash2 className="w-4 h-4" />
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
