import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Terminal, HardDrive, Cog, Settings, Monitor, TerminalSquare, FileCog, Search,
    Globe, Wifi, Activity, Shield, Eye
} from 'lucide-react'

interface Tool {
    label: string
    cmd: string
    icon: any
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
    'System': 'from-cyan-500 to-blue-500',
    'Terminal': 'from-violet-500 to-purple-500',
    'Network': 'from-orange-500 to-amber-500',
    'Storage': 'from-green-500 to-emerald-500',
    'Diagnostics': 'from-rose-500 to-pink-500',
}

const categoryIcons: Record<string, any> = {
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
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <Settings className="w-6 h-6 text-accent-cyan" /> System Tools
                    </h2>
                    <p className="text-text-muted text-sm mt-1">Quick access to Windows administration tools</p>
                </div>
            </div>

            {/* Search + Category filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                    <input
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        placeholder="Search tools..."
                        className="w-full pl-10 pr-4 py-2.5 bg-app-bg border border-card-border rounded-xl text-sm text-text-primary placeholder:text-text-dim outline-none focus:border-accent-cyan/40 transition-colors"
                    />
                </div>
                <div className="flex gap-1.5">
                    <button
                        onClick={() => setActiveCategory(null)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${!activeCategory ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/20' : 'bg-card-bg border border-card-border text-text-muted hover:text-text-primary'}`}
                    >
                        All
                    </button>
                    {categories.map(cat => {
                        const CatIcon = categoryIcons[cat] || Monitor
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${activeCategory === cat ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/20' : 'bg-card-bg border border-card-border text-text-muted hover:text-text-primary'}`}
                            >
                                <CatIcon className="w-3 h-3" />{cat}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Tools grid */}
            <motion.div
                className="grid grid-cols-2 gap-3"
                variants={container}
                initial="hidden"
                animate="show"
                key={`${activeCategory}-${filter}`}
            >
                {filtered.map(t => {
                    const gradient = categoryColors[t.category] || 'from-gray-500 to-gray-600'
                    return (
                        <motion.button
                            key={t.cmd}
                            variants={item}
                            onClick={() => launch(t.cmd)}
                            whileHover={{ scale: 1.01, y: -2 }}
                            whileTap={{ scale: 0.99 }}
                            className="flex items-center gap-4 p-4 rounded-xl border border-card-border bg-card-bg text-left hover:border-accent-cyan/20 transition-all group card-premium hover-lift"
                        >
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                                <t.icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-text-primary text-sm font-medium">{t.label}</div>
                                <div className="text-text-dim text-xs">{t.desc}</div>
                            </div>
                            <span className="text-[10px] text-text-dim px-2 py-0.5 bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">{t.category}</span>
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
