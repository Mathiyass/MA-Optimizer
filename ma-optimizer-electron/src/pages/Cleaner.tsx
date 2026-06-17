import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Search, HardDrive, Globe, Recycle, Loader2, FileText, Image, File, Database, ChevronDown, ChevronRight, Check, LucideIcon } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { useSettingsStore } from '../store/settingsStore'

function fmt(b: number) {
    if (!b) return '0 B'
    const k = 1024, s = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(Math.abs(b) || 1) / Math.log(k))
    return (b / Math.pow(k, i)).toFixed(1) + ' ' + s[i]
}

const categoryIcons: Record<string, LucideIcon> = {
    // Windows Explorer
    recent: File,
    thumbnails: Image,
    iconcache: Image,
    // System
    usertemp: File,
    wintemp: File,
    prefetch: Database,
    wupdate: HardDrive,
    shader: Database,
    wer: FileText,
    dumps: FileText,
    logs: FileText,
    delivery: HardDrive,
    fontcache: Database,
    actioncenter: Database,
    windefender: FileText,
    // Applications
    discord: Database,
    vscode: File,
    slack: Database,
    spotify: Database,
    steam: HardDrive,
}

// System file groups simply for display purposes based on BleachBit
const systemGroups = {
    'Windows Explorer': ['recent', 'thumbnails', 'iconcache'],
    'System': ['wintemp', 'usertemp', 'prefetch', 'wupdate', 'shader', 'wer', 'dumps', 'logs', 'delivery', 'fontcache', 'actioncenter', 'windefender'],
    'Applications': ['discord', 'vscode', 'slack', 'spotify', 'steam']
}

function ScanProgressRing({ scanning }: { scanning: boolean }) {
    if (!scanning) return null
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="relative w-24 h-24">
                <svg className="w-24 h-24 animate-spin-slow" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#21262d" strokeWidth="4" />
                    <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke="url(#scan-gradient)" strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray="165 100"
                    />
                    <defs>
                        <linearGradient id="scan-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00FFDE" />
                            <stop offset="100%" stopColor="#FF003C" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Search className="w-6 h-6 text-accent-cyan animate-pulse" />
                </div>
            </div>
            <p className="text-text-muted text-sm mt-4 animate-pulse">Scanning your system...</p>
        </div>
    )
}

export function Cleaner() {
    const [scanResults, setScanResults] = useState<any[]>([])
    const [browserResults, setBrowserResults] = useState<any[]>([])
    // Set of selected item IDs:
    // system items simply use their 'id' (e.g. 'wintemp')
    // browser items use 'browser_{bid}_{item.id}' (e.g. 'browser_chrome_cache')
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [scanning, setScanning] = useState(false)
    const [cleaning, setCleaning] = useState(false)
    const [lastCleaned, setLastCleaned] = useState(0)
    // Map to keep track of expanded groups
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        'sys_Windows Explorer': true,
        'sys_System': true,
        'sys_Applications': true,
    })

    const addNotification = useAppStore(s => s.addNotification)
    const addCleaned = useSettingsStore(s => s.addCleaned)

    const toggleExpand = (key: string) => setExpanded(p => ({ ...p, [key]: !p[key] }))

    const scan = async () => {
        setScanning(true)
        setLastCleaned(0)
        const [sys, browsers] = await Promise.all([
            window.api?.cleaner.scan([]),
            window.api?.cleaner.scanBrowsers(),
        ])
        setScanResults(sys?.categories || [])
        setBrowserResults(browsers || [])

        const all = new Set<string>()
        sys?.categories?.forEach((c: any) => { if (c.size > 0) all.add(c.id) })
        browsers?.forEach((b: any) => {
            if (b.detected) {
                b.items.forEach((item: any) => {
                    if (item.size > 0) all.add(`browser_${b.id}_${item.id}`)
                })
            }
        })
        setSelected(all)
        // Also expand detected browsers by default
        const newExpanded = { ...expanded }
        browsers?.forEach((b: any) => { if (b.detected) newExpanded[`browser_${b.id}`] = true })
        setExpanded(newExpanded)

        setScanning(false)
    }

    const clean = async () => {
        setCleaning(true)
        const sysCats = [...selected].filter(s => !s.startsWith('browser_'))

        // Group browser selections by bid: { id: string, types: string[] }[]
        const browserSelectionsMap: Record<string, Set<string>> = {}
        const browserSelectedItems = [...selected].filter(s => s.startsWith('browser_'))
        for (const s of browserSelectedItems) {
            const parts = s.split('_')
            const bid = parts[1]
            const type = parts[2]
            if (!browserSelectionsMap[bid]) browserSelectionsMap[bid] = new Set()
            browserSelectionsMap[bid].add(type)
        }

        const browserSelections = Object.entries(browserSelectionsMap).map(([id, typesSet]) => ({
            id, types: Array.from(typesSet)
        }))

        let total = 0
        if (sysCats.length > 0) { const r = await window.api?.cleaner.clean(sysCats); total += r?.freed || 0 }
        if (browserSelections.length > 0) { const r = await window.api?.cleaner.cleanBrowsers(browserSelections); total += r?.freed || 0 }

        addCleaned(total)
        setLastCleaned(total)
        addNotification('success', `Cleaned ${fmt(total)}`)
        setCleaning(false)
        scan()
    }

    const toggle = (id: string, groupChildren?: string[]) => {
        const s = new Set(selected)
        if (groupChildren) { // Toggle whole group
            const allSelected = groupChildren.every(c => s.has(c))
            if (allSelected) {
                groupChildren.forEach(c => s.delete(c))
            } else {
                groupChildren.forEach(c => s.add(c))
            }
        } else {
            s.has(id) ? s.delete(id) : s.add(id)
        }
        setSelected(s)
    }

    // Calculations
    const totalSelected = scanResults.filter(c => selected.has(c.id)).reduce((a, c) => a + c.size, 0) +
        browserResults.flatMap(b => b.items.filter((item: any) => selected.has(`browser_${b.id}_${item.id}`))).reduce((a, item) => a + item.size, 0)

    const totalFound = scanResults.reduce((a, c) => a + c.size, 0) +
        browserResults.filter(b => b.detected).reduce((a, b) => a + b.size, 0)

    const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
    const itemMotion = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }

    return (
        <div className="space-y-8 max-w-[90rem] mx-auto w-full pb-10">
            {/* Ultra-Premium Cleaner Hero Section */}
            <motion.div
                className="relative overflow-hidden rounded-[2.5rem] p-12 transition-all duration-700 border bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[#ff003c]/20 animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[var(--accent-cyan)]/20 animate-pulse" style={{ animationDuration: '6s' }}></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center md:text-left">
                        <motion.h2 className="text-5xl lg:text-6xl font-black mb-4 tracking-tight text-white flex items-center justify-center md:justify-start gap-4">
                            <Trash2 className="w-12 h-12 text-[#ff003c] drop-shadow-[0_0_15px_rgba(255,0,60,0.8)]" />
                            System Cleaner
                        </motion.h2>
                        <p className="text-[var(--text-muted)] text-sm uppercase tracking-[0.3em] font-black mb-8">
                            Reclaim Disk Space
                        </p>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <p className="text-[var(--text-secondary)] max-w-xl font-medium leading-relaxed">
                                Aggressively sweep your drives for temporary files, cache, log dumps, and bloatware residue. Optimize browser performance and free up gigabytes in seconds.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center gap-4">
                        <motion.button whileTap={{ scale: 0.95 }} onClick={scan} disabled={scanning}
                            className="group relative px-8 py-4 rounded-2xl bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 hover:border-[var(--accent-cyan)]/50 hover:bg-[rgba(0,255,222,0.1)] transition-all duration-300 w-full overflow-hidden shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border">
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-cyan)]/0 via-[var(--accent-cyan)]/10 to-[var(--accent-cyan)]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                            <span className="relative z-10 font-black tracking-widest uppercase text-sm flex items-center justify-center gap-3 text-white group-hover:text-[var(--accent-cyan)] transition-colors">
                                {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                {scanning ? 'Scanning System...' : 'Initiate Scan'}
                            </span>
                        </motion.button>

                        {scanResults.length > 0 && (
                            <motion.button whileTap={{ scale: 0.95 }} onClick={clean} disabled={cleaning || selected.size === 0}
                                className="group relative px-8 py-4 rounded-2xl bg-[#ff003c]/10 border-[#ff003c]/30 hover:border-[#ff003c]/80 hover:bg-[#ff003c]/20 transition-all duration-300 w-full overflow-hidden shadow-[0_0_30px_rgba(255,0,60,0.2)] disabled:opacity-50 disabled:cursor-not-allowed border">
                                <span className="relative z-10 font-black tracking-widest uppercase text-sm flex items-center justify-center gap-3 text-[#ff003c] drop-shadow-[0_0_8px_rgba(255,0,60,0.8)]">
                                    {cleaning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                    {cleaning ? 'Erasing Data...' : `Clean ${fmt(totalSelected)}`}
                                </span>
                            </motion.button>
                        )}
                    </div>
                </div>
            </motion.div>

            <ScanProgressRing scanning={scanning} />

            {/* Total waste bar */}
            {scanResults.length > 0 && !scanning && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-premium border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl rounded-[2rem] p-8 relative overflow-hidden shadow-xl mt-6 border">
                    {lastCleaned > 0 && (
                        <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-8 top-6 flex items-center gap-2 text-[#00FFDE] bg-[#00FFDE]/10 px-4 py-2 rounded-2xl border-[#00FFDE]/30 shadow-[0_0_15px_rgba(0,255,222,0.2)] border">
                            <Check className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-widest">Cleaned {fmt(lastCleaned)}</span>
                        </motion.div>
                    )}
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[var(--text-muted)] text-sm font-black uppercase tracking-[0.2em]">Total Junk Identified</span>
                        <span className="text-[#ff003c] text-3xl font-black tracking-tight drop-shadow-[0_0_15px_rgba(255,0,60,0.5)]">{fmt(totalFound)}</span>
                    </div>
                    <div className="w-full h-4 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-full overflow-hidden shadow-inner border">
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-[#ff003c] via-[#FF003C] to-[#ff003c]"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((totalSelected / (totalFound || 1)) * 100, 100)}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            style={{ backgroundSize: '200% 100%', animation: 'gradientMove 3s linear infinite' }}
                        />
                    </div>
                    <div className="flex justify-between mt-4">
                        <span className="text-[var(--text-secondary)] text-sm font-bold tracking-wide">Selected for removal: <span className="text-white">{fmt(totalSelected)}</span></span>
                    </div>
                </motion.div>
            )}

            {scanResults.length > 0 && !scanning && (
                <motion.div className="space-y-6 mt-6" variants={container} initial={false} animate="show">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* System Categories */}
                        <motion.div variants={itemMotion} className="card-premium border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl rounded-[2rem] p-0 overflow-hidden shadow-xl border">
                            <div className="px-8 py-6 border-b bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 flex items-center gap-4">
                                <HardDrive className="w-6 h-6 text-[var(--accent-cyan)]" />
                                <h3 className="text-white text-lg font-black tracking-wide">System Repositories</h3>
                            </div>

                            <div className="p-3 space-y-2">
                                {Object.entries(systemGroups).map(([groupName, sysIds]) => {
                                    const groupItems = sysIds.map(id => scanResults.find(r => r.id === id)).filter(Boolean)
                                    if (groupItems.length === 0) return null

                                    const groupKey = `sys_${groupName}`
                                    const isExpanded = !!expanded[groupKey]
                                    const allSelected = groupItems.every(r => selected.has(r.id))
                                    const someSelected = groupItems.some(r => selected.has(r.id)) && !allSelected
                                    const groupSize = groupItems.reduce((a, c) => a + c.size, 0)

                                    return (
                                        <div key={groupName} className="rounded-2xl bg-[rgba(255,255,255,0.01)] backdrop-blur-3xl border-white/5 overflow-hidden mb-2 shadow-inner border">
                                            <div className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.05)] cursor-pointer transition-colors" onClick={() => toggleExpand(groupKey)}>
                                                {isExpanded ? <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" /> : <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />}
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={allSelected}
                                                        ref={input => { if (input) input.indeterminate = someSelected }}
                                                        onChange={(e) => { e.stopPropagation(); toggle('grp', groupItems.map(r => r.id)) }}
                                                        className="appearance-none w-5 h-5 border-2 border-white/20 rounded-2xl checked:bg-[var(--accent-cyan)] checked:border-[var(--accent-cyan)] indeterminate:bg-[var(--accent-cyan)]/50 indeterminate:border-[var(--accent-cyan)]/50 cursor-pointer transition-all"
                                                    />
                                                    {allSelected && <Check className="w-3.5 h-3.5 text-black absolute pointer-events-none font-bold" />}
                                                </div>
                                                <span className="text-white text-[15px] font-bold tracking-wide flex-1">{groupName}</span>
                                                <span className="text-[11px] font-black tracking-widest uppercase text-[var(--text-muted)] bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 px-2 py-1 rounded-2xl border">{fmt(groupSize)}</span>
                                            </div>
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                        <div className="pl-12 pr-4 py-2 space-y-1 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 border-t">
                                                            {groupItems.map(c => {
                                                                const CatIcon = categoryIcons[c.id] || File
                                                                return (
                                                                    <label key={c.id} className="flex items-center gap-4 py-2 cursor-pointer hover:bg-[rgba(255,255,255,0.05)] rounded-2xl px-3 transition-colors group">
                                                                        <div className="relative flex items-center justify-center">
                                                                            <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="appearance-none w-4 h-4 border-2 border-white/20 rounded-2xl md checked:bg-[var(--accent-cyan)] checked:border-[var(--accent-cyan)] cursor-pointer transition-all" />
                                                                            {selected.has(c.id) && <Check className="w-3 h-3 text-black absolute pointer-events-none font-bold" />}
                                                                        </div>
                                                                        <CatIcon className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-cyan)] transition-colors" />
                                                                        <span className="text-[var(--text-secondary)] text-sm flex-1 font-medium group-hover:text-white transition-colors">{c.name}</span>
                                                                        <span className={`text-[11px] font-mono tracking-widest ${c.size > 0 ? 'text-[#ff003c]' : 'text-[var(--text-dim)]'}`}>{fmt(c.size)}</span>
                                                                    </label>
                                                                )
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )
                                })}
                            </div>
                        </motion.div>

                        {/* Browser Categories */}
                        <motion.div variants={itemMotion} className="card-premium border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl rounded-[2rem] p-0 overflow-hidden shadow-xl border">
                            <div className="px-8 py-6 border-b bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 flex items-center gap-4">
                                <Globe className="w-6 h-6 text-[#ff003c]" />
                                <h3 className="text-white text-lg font-black tracking-wide">Web Browsers</h3>
                            </div>

                            <div className="p-4 space-y-3">
                                {browserResults.filter(b => b.detected).map(b => {
                                    const groupKey = `browser_${b.id}`
                                    const isExpanded = !!expanded[groupKey]
                                    const childIds = b.items.map((i: any) => `${groupKey}_${i.id}`)
                                    const allSelected = childIds.every((id: string) => selected.has(id))
                                    const someSelected = childIds.some((id: string) => selected.has(id)) && !allSelected

                                    return (
                                        <div key={b.id} className="rounded-2xl bg-[rgba(255,255,255,0.01)] backdrop-blur-3xl border-white/5 overflow-hidden mb-2 shadow-inner border">
                                            <div className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.05)] cursor-pointer transition-colors" onClick={() => toggleExpand(groupKey)}>
                                                {isExpanded ? <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" /> : <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />}
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={allSelected}
                                                        ref={input => { if (input) input.indeterminate = someSelected }}
                                                        onChange={(e) => { e.stopPropagation(); toggle('grp', childIds) }}
                                                        className="appearance-none w-5 h-5 border-2 border-white/20 rounded-2xl checked:bg-[#ff003c] checked:border-[#ff003c] indeterminate:bg-[#ff003c]/50 indeterminate:border-[#ff003c]/50 cursor-pointer transition-all"
                                                    />
                                                    {allSelected && <Check className="w-3.5 h-3.5 text-white absolute pointer-events-none font-bold" />}
                                                </div>
                                                <Globe className="w-4 h-4 text-[var(--text-dim)]" />
                                                <span className="text-white text-[15px] font-bold tracking-wide flex-1">{b.name}</span>
                                                <span className="text-[11px] font-black tracking-widest uppercase text-[var(--text-muted)] bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 px-2 py-1 rounded-2xl border">{fmt(b.size)}</span>
                                            </div>
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                        <div className="pl-12 pr-4 py-2 space-y-1 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 border-t">
                                                            {b.items.map((item: any) => {
                                                                const itemId = `${groupKey}_${item.id}`
                                                                return (
                                                                    <label key={item.id} className="flex items-center gap-4 py-2 cursor-pointer hover:bg-[rgba(255,255,255,0.05)] rounded-2xl px-3 transition-colors group">
                                                                        <div className="relative flex items-center justify-center">
                                                                            <input type="checkbox" checked={selected.has(itemId)} onChange={() => toggle(itemId)} className="appearance-none w-4 h-4 border-2 border-white/20 rounded-2xl md checked:bg-[#ff003c] checked:border-[#ff003c] cursor-pointer transition-all" />
                                                                            {selected.has(itemId) && <Check className="w-3 h-3 text-white absolute pointer-events-none font-bold" />}
                                                                        </div>
                                                                        <span className="text-[var(--text-secondary)] text-sm flex-1 font-medium group-hover:text-white transition-colors">{item.name}</span>
                                                                        <span className={`text-[11px] font-mono tracking-widest ${item.size > 0 ? 'text-[#ff003c]' : 'text-[var(--text-dim)]'}`}>{fmt(item.size)}</span>
                                                                    </label>
                                                                )
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )
                                })}
                                {browserResults.filter(b => b.detected).length === 0 && (
                                    <div className="text-center py-6">
                                        <p className="text-text-dim text-sm">No supported browsers detected.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    <motion.button
                        variants={itemMotion}
                        onClick={() => window.api?.cleaner.emptyRecycleBin()}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2.5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-2xl text-sm text-text-muted hover:text-[#FF003C] transition-all flex items-center gap-2 hover-lift w-full sm:w-auto mt-4 border"
                    >
                        <Recycle className="w-4 h-4" />Empty Recycle Bin
                    </motion.button>
                </motion.div>
            )}
            {scanResults.length === 0 && !scanning && (
                <div className="text-center py-16">
                    <Search className="w-12 h-12 text-text-dim mx-auto mb-4 opacity-30" />
                    <p className="text-text-dim text-sm">Click "Scan" to analyze your system for junk files.</p>
                </div>
            )}
        </div>
    )
}
