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
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <Trash2 className="w-6 h-6 text-accent-cyan" /> System Cleaner
                    </h2>
                    <p className="text-text-muted text-sm mt-1">Free disk space by removing junk files</p>
                </div>
                <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={scan} disabled={scanning}
                        className="px-5 py-2.5 bg-accent-cyan/15 text-accent-cyan rounded-xl text-sm font-medium hover:bg-accent-cyan/25 transition-all disabled:opacity-50 flex items-center gap-2">
                        {scanning ? <><Loader2 className="w-4 h-4 animate-spin" />Scanning...</> : <><Search className="w-4 h-4" />Scan</>}
                    </motion.button>
                    {scanResults.length > 0 && (
                        <motion.button whileTap={{ scale: 0.95 }} onClick={clean} disabled={cleaning || selected.size === 0}
                            className="px-5 py-2.5 bg-danger/15 text-danger rounded-xl text-sm font-medium hover:bg-danger/25 transition-all disabled:opacity-50 flex items-center gap-2">
                            {cleaning ? <><Loader2 className="w-4 h-4 animate-spin" />Cleaning...</> : <><Trash2 className="w-4 h-4" />Clean {fmt(totalSelected)}</>}
                        </motion.button>
                    )}
                </div>
            </div>

            <ScanProgressRing scanning={scanning} />

            {/* Total waste bar */}
            {scanResults.length > 0 && !scanning && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card-bg border border-card-border rounded-xl p-5 relative overflow-hidden">
                    {lastCleaned > 0 && (
                        <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-5 top-4 flex items-center gap-2 text-success bg-success/10 px-3 py-1.5 rounded-full border border-success/20">
                            <Check className="w-4 h-4" />
                            <span className="text-xs font-bold font-mono">Cleaned {fmt(lastCleaned)}</span>
                        </motion.div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-text-primary text-sm font-semibold">Total Junk Found</span>
                        <span className="text-warning text-lg font-bold font-mono">{fmt(totalFound)}</span>
                    </div>
                    <div className="w-full h-3 bg-app-bg rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-warning to-danger"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((totalSelected / (totalFound || 1)) * 100, 100)}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="text-text-dim text-xs">Selected: {fmt(totalSelected)}</span>
                    </div>
                </motion.div>
            )}

            {scanResults.length > 0 && !scanning && (
                <motion.div className="space-y-4" variants={container} initial={false} animate="show">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* System Categories */}
                        <motion.div variants={itemMotion} className="bg-card-bg border border-card-border rounded-xl p-0 overflow-hidden">
                            <div className="px-5 py-4 border-b border-card-border bg-black/20 flex items-center gap-2">
                                <HardDrive className="w-4 h-4 text-accent-cyan" />
                                <h3 className="text-text-primary font-semibold">System Categories</h3>
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
                                        <div key={groupName} className="rounded-lg bg-black/10 border border-white/5 overflow-hidden">
                                            <div className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer transition-colors" onClick={() => toggleExpand(groupKey)}>
                                                {isExpanded ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    ref={input => { if (input) input.indeterminate = someSelected }}
                                                    onChange={(e) => { e.stopPropagation(); toggle('grp', groupItems.map(r => r.id)) }}
                                                    className="accent-accent-cyan"
                                                />
                                                <span className="text-text-primary text-sm font-medium flex-1">{groupName}</span>
                                                <span className="text-xs font-mono text-text-dim">{fmt(groupSize)}</span>
                                            </div>
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                        <div className="pl-9 pr-3 py-2 space-y-1 bg-black/20">
                                                            {groupItems.map(c => {
                                                                const CatIcon = categoryIcons[c.id] || File
                                                                return (
                                                                    <label key={c.id} className="flex items-center gap-3 py-1.5 cursor-pointer hover:bg-white/5 rounded px-2 transition-colors">
                                                                        <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="accent-accent-cyan" />
                                                                        <CatIcon className="w-3.5 h-3.5 text-text-dim" />
                                                                        <span className="text-text-secondary text-sm flex-1">{c.name}</span>
                                                                        <span className={`text-xs font-mono ${c.size > 0 ? 'text-warning/80' : 'text-text-dim'}`}>{fmt(c.size)}</span>
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
                        <motion.div variants={itemMotion} className="bg-card-bg border border-card-border rounded-xl p-0 overflow-hidden">
                            <div className="px-5 py-4 border-b border-card-border bg-black/20 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-accent-cyan" />
                                <h3 className="text-text-primary font-semibold">Browsers</h3>
                            </div>

                            <div className="p-3 space-y-2">
                                {browserResults.filter(b => b.detected).map(b => {
                                    const groupKey = `browser_${b.id}`
                                    const isExpanded = !!expanded[groupKey]
                                    const childIds = b.items.map((i: any) => `${groupKey}_${i.id}`)
                                    const allSelected = childIds.every((id: string) => selected.has(id))
                                    const someSelected = childIds.some((id: string) => selected.has(id)) && !allSelected

                                    return (
                                        <div key={b.id} className="rounded-lg bg-black/10 border border-white/5 overflow-hidden">
                                            <div className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer transition-colors" onClick={() => toggleExpand(groupKey)}>
                                                {isExpanded ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    ref={input => { if (input) input.indeterminate = someSelected }}
                                                    onChange={(e) => { e.stopPropagation(); toggle('grp', childIds) }}
                                                    className="accent-accent-cyan"
                                                />
                                                <Globe className="w-3.5 h-3.5 text-text-dim" />
                                                <span className="text-text-primary text-sm font-medium flex-1">{b.name}</span>
                                                <span className="text-xs font-mono text-text-dim">{fmt(b.size)}</span>
                                            </div>
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                        <div className="pl-9 pr-3 py-2 space-y-1 bg-black/20">
                                                            {b.items.map((item: any) => {
                                                                const itemId = `${groupKey}_${item.id}`
                                                                return (
                                                                    <label key={item.id} className="flex items-center gap-3 py-1.5 cursor-pointer hover:bg-white/5 rounded px-2 transition-colors">
                                                                        <input type="checkbox" checked={selected.has(itemId)} onChange={() => toggle(itemId)} className="accent-accent-cyan" />
                                                                        <span className="text-text-secondary text-sm flex-1">{item.name}</span>
                                                                        <span className={`text-xs font-mono ${item.size > 0 ? 'text-warning/80' : 'text-text-dim'}`}>{fmt(item.size)}</span>
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
                        className="px-4 py-2.5 bg-card-bg border border-card-border rounded-xl text-sm text-text-muted hover:text-[var(--accent-red)] transition-all flex items-center gap-2 hover-lift w-full sm:w-auto mt-4"
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
