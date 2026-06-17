import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Terminal, HardDrive, Cog, Settings, Monitor, TerminalSquare, FileCog, Search,
    Globe, Wifi, Activity, Shield, Eye, LucideIcon
} from 'lucide-react'

interface Tool {
    label: string
    cmd: string
    icon: LucideIcon
    desc: string
    category: string
}

const tools: Tool[] = [
    // System
    { label: 'Task Manager', cmd: 'taskmgr.exe', icon: Monitor, desc: 'Monitor processes', category: 'System' },
    { label: 'System Configuration', cmd: 'msconfig.exe', icon: Settings, desc: 'Boot and startup settings', category: 'System' },
    { label: 'Computer Management', cmd: 'compmgmt.msc', icon: Cog, desc: 'Full system management', category: 'System' },
    { label: 'System Information', cmd: 'msinfo32.exe', icon: Monitor, desc: 'Detailed system info', category: 'System' },
    { label: 'Resource Monitor', cmd: 'resmon.exe', icon: Activity, desc: 'Real-time resource usage', category: 'System' },
    { label: 'Performance Monitor', cmd: 'perfmon.exe', icon: Activity, desc: 'Performance counters', category: 'System' },
    // Terminal
    { label: 'Command Prompt', cmd: 'cmd.exe', icon: Terminal, desc: 'Open CMD as Admin', category: 'Terminal' },
    { label: 'PowerShell', cmd: 'powershell.exe', icon: TerminalSquare, desc: 'Open PowerShell as Admin', category: 'Terminal' },
    { label: 'Registry Editor', cmd: 'regedit.exe', icon: FileCog, desc: 'Windows Registry Editor', category: 'Terminal' },
    // Network
    { label: 'Services', cmd: 'services.msc', icon: Settings, desc: 'Windows services manager', category: 'Network' },
    // Storage
    { label: 'Device Manager', cmd: 'devmgmt.msc', icon: Cog, desc: 'Manage hardware devices', category: 'Storage' },
    { label: 'Disk Management', cmd: 'diskmgmt.msc', icon: HardDrive, desc: 'Manage disk partitions', category: 'Storage' },
    { label: 'Disk Cleanup', cmd: 'cleanmgr.exe', icon: HardDrive, desc: 'Windows disk cleanup', category: 'Storage' },
    // Diagnostics
    { label: 'Event Viewer', cmd: 'eventvwr.msc', icon: Eye, desc: 'System event logs', category: 'Diagnostics' },
    { label: 'Group Policy Editor', cmd: 'gpedit.msc', icon: Shield, desc: 'Local Group Policy', category: 'Diagnostics' },
    { label: 'DirectX Diagnostic', cmd: 'dxdiag.exe', icon: Monitor, desc: 'DirectX diagnostics', category: 'Diagnostics' },
]

const categoryColors: Record<string, string> = {
    'System': 'from-[#00FFDE] to-[#00FFDE]/50',
    'Terminal': 'from-[#FF003C] to-[#FF003C]/50',
    'Network': 'from-[#FF003C] to-[#00FFDE]',
    'Storage': 'from-[#00FFDE] to-[#00FFDE]/50',
    'Diagnostics': 'from-[#FF003C] to-[#00FFDE]/50',
}

const categoryIcons: Record<string, LucideIcon> = {
    'System': Monitor,
    'Terminal': Terminal,
    'Network': Globe,
    'Storage': HardDrive,
    'Diagnostics': Eye,
}

export function Tools() {
    const [filter, setFilter] = useState('')
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const launch = (cmd: string) => window.api?.system.runTool(cmd)

    const categories = Array.from(new Set(tools.map(t => t.category)))
    const filtered = tools.filter(t => {
        const matchesFilter = !filter || t.label.toLowerCase().includes(filter.toLowerCase()) || t.desc.toLowerCase().includes(filter.toLowerCase())
        const matchesCategory = !activeCategory || t.category === activeCategory
        return matchesFilter && matchesCategory
    })

    const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
    const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }

    return (
        <div className="space-y-8 max-w-[90rem] mx-auto w-full pb-10">
            {/* Ultra-Premium Tools Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] p-12 transition-all duration-700 border bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[var(--accent-cyan)]/20 animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[#ff003c]/20 animate-pulse" style={{ animationDuration: '6s' }}></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-5xl lg:text-6xl font-black mb-4 tracking-tight text-white flex items-center justify-center md:justify-start gap-4">
                            <Settings className="w-12 h-12 text-[var(--accent-cyan)] drop-shadow-[0_0_15px_rgba(0,255,222,0.8)]" />
                            System Arsenal
                        </h2>
                        <p className="text-[var(--text-muted)] text-sm uppercase tracking-[0.3em] font-black mb-8">
                            Administrative Payload
                        </p>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <p className="text-[var(--text-secondary)] max-w-xl font-medium leading-relaxed">
                                Direct launch endpoints for core Windows administrative tools, bypassing conventional navigation. Immediate execution of diagnostic and management payloads.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search + Category filters */}
            <div className="card-premium bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-[2rem] p-6 flex flex-col xl:flex-row items-center gap-6 shadow-xl border">
                <div className="relative w-full xl:w-auto xl:flex-1">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-dim)]" />
                    <input
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        placeholder="Search payload index..."
                        className="w-full pl-14 pr-6 py-4 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-2xl text-[15px] text-white placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent-cyan)] focus:shadow-[0_0_15px_rgba(0,255,222,0.2)] transition-all border"
                    />
                </div>
                <div className="flex flex-wrap gap-3 justify-center w-full xl:w-auto">
                    <button
                        onClick={() => setActiveCategory(null)}
                        className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${!activeCategory ? 'bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)] border-[var(--accent-cyan)]/30 shadow-[0_0_10px_rgba(0,255,222,0.1)]' : 'bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 border-white/10 text-[var(--text-muted)] hover:text-white hover:border-white/30'}`}
                    >
                        All Classes
                    </button>
                    {categories.map(cat => {
                        const CatIcon = categoryIcons[cat] || Monitor
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                                className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeCategory === cat ? 'bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)] border-[var(--accent-cyan)]/30 shadow-[0_0_10px_rgba(0,255,222,0.1)]' : 'bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 border-white/10 text-[var(--text-muted)] hover:text-white hover:border-white/30'}`}
                            >
                                <CatIcon className="w-4 h-4" />{cat}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Tools grid */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                variants={container}
                initial="hidden"
                animate="show"
                key={`${activeCategory}-${filter}`}
            >
                {filtered.map(t => {
                    const gradient = categoryColors[t.category] || 'from-[rgba(255,255,255,0.2)] to-[rgba(255,255,255,0.1)]'
                    return (
                        <motion.button
                            key={t.cmd}
                            variants={item}
                            onClick={() => launch(t.cmd)}
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex flex-col items-center text-center gap-4 p-8 rounded-[2rem] border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl hover:bg-[rgba(255,255,255,0.03)] hover:border-white/20 transition-all duration-300 group card-premium shadow-xl relative overflow-hidden border"
                        >
                            <div className={`absolute -right-8 -top-8 w-32 h-32 blur-[40px] rounded-full pointer-events-none bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-30 transition-opacity duration-500`}></div>
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-shadow relative z-10 border-white/20 border`}>
                                <t.icon className="w-8 h-8 text-white drop-shadow-md" />
                            </div>
                            <div className="w-full relative z-10 flex flex-col items-center">
                                <div className="text-white text-[15px] font-black tracking-wide mb-2">{t.label}</div>
                                <div className="text-[var(--text-muted)] text-[11px] font-medium leading-relaxed">{t.desc}</div>
                                <div className="mt-4 px-3 py-1 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-2xl text-[var(--accent-cyan)] font-mono text-[10px] tracking-widest border">{t.cmd}</div>
                            </div>
                        </motion.button>
                    )
                })}
            </motion.div>

            {filtered.length === 0 && (
                <div className="text-text-dim text-center py-12 text-sm">No tools match your search</div>
            )}
        </div>
    )
}
