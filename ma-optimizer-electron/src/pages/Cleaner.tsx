import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Trash2, Search, HardDrive, Globe, Recycle, Loader2, FileText, Image, File, Database } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { useSettingsStore } from '../store/settingsStore'

function fmt(b: number) {
    if (!b) return '0 B'
    const k = 1024, s = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(Math.abs(b) || 1) / Math.log(k))
    return (b / Math.pow(k, i)).toFixed(1) + ' ' + s[i]
}

const categoryIcons: Record<string, any> = {
    temp: File,
    logs: FileText,
    cache: Database,
    thumbnails: Image,
    updates: HardDrive,
    recycle: Recycle,
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
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [scanning, setScanning] = useState(false)
    const [cleaning, setCleaning] = useState(false)
    const [lastCleaned, setLastCleaned] = useState(0)
    const addNotification = useAppStore(s => s.addNotification)
    const addCleaned = useSettingsStore(s => s.addCleaned)

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
        browsers?.forEach((b: any) => { if (b.detected && b.size > 0) all.add(`browser_${b.id}`) })
        setSelected(all)
        setScanning(false)
    }

    const clean = async () => {
        setCleaning(true)
        const sysCats = [...selected].filter(s => !s.startsWith('browser_'))
        const browserCats = [...selected].filter(s => s.startsWith('browser_')).map(s => s.replace('browser_', ''))
        let total = 0
        if (sysCats.length > 0) { const r = await window.api?.cleaner.clean(sysCats); total += r?.freed || 0 }
        if (browserCats.length > 0) { const r = await window.api?.cleaner.cleanBrowsers(browserCats, ['cache']); total += r?.freed || 0 }
        addCleaned(total)
        setLastCleaned(total)
        addNotification('success', `Cleaned ${fmt(total)}`)
        setCleaning(false)
        scan()
    }

    const toggle = (id: string) => {
        const s = new Set(selected)
        s.has(id) ? s.delete(id) : s.add(id)
        setSelected(s)
    }

    const totalSelected = scanResults.filter(c => selected.has(c.id)).reduce((a, c) => a + c.size, 0) +
        browserResults.filter(b => selected.has(`browser_${b.id}`)).reduce((a, b) => a + b.size, 0)

    const totalFound = scanResults.reduce((a, c) => a + c.size, 0) +
        browserResults.filter(b => b.detected).reduce((a, b) => a + b.size, 0)

    const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
    const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }

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
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card-bg border border-card-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-text-primary text-sm font-semibold">Total Junk Found</span>
                        <span className="text-warning text-lg font-bold">{fmt(totalFound)}</span>
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
                        {lastCleaned > 0 && <span className="text-success text-xs font-medium">✅ Last cleaned: {fmt(lastCleaned)}</span>}
                    </div>
                </motion.div>
            )}

            {scanResults.length > 0 && !scanning && (
                <motion.div className="space-y-4" variants={container} initial={false} animate="show">
                    <motion.div variants={item} className="bg-card-bg border border-card-border rounded-xl p-5">
                        <h3 className="text-text-primary font-semibold mb-3 flex items-center gap-2"><HardDrive className="w-4 h-4 text-accent-cyan" />System Files</h3>
                        <div className="space-y-1">
                            {scanResults.map(c => {
                                const CatIcon = categoryIcons[c.id] || File
                                return (
                                    <label key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                                        <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="accent-accent-cyan" />
                                        <CatIcon className="w-4 h-4 text-text-dim" />
                                        <span className="text-text-primary text-sm flex-1">{c.name}</span>
                                        <span className={`text-sm font-mono ${c.size > 0 ? 'text-warning' : 'text-text-dim'}`}>{fmt(c.size)}</span>
                                    </label>
                                )
                            })}
                        </div>
                    </motion.div>
                    <motion.div variants={item} className="bg-card-bg border border-card-border rounded-xl p-5">
                        <h3 className="text-text-primary font-semibold mb-3 flex items-center gap-2"><Globe className="w-4 h-4 text-accent-cyan" />Browser Caches</h3>
                        <div className="space-y-1">
                            {browserResults.filter(b => b.detected).map(b => (
                                <label key={b.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                                    <input type="checkbox" checked={selected.has(`browser_${b.id}`)} onChange={() => toggle(`browser_${b.id}`)} className="accent-accent-cyan" />
                                    <Globe className="w-4 h-4 text-text-dim" />
                                    <span className="text-text-primary text-sm flex-1">{b.name}</span>
                                    <span className="text-warning text-sm font-mono">{fmt(b.size)}</span>
                                </label>
                            ))}
                        </div>
                    </motion.div>
                    <motion.button
                        variants={item}
                        onClick={() => window.api?.cleaner.emptyRecycleBin()}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2.5 bg-card-bg border border-card-border rounded-xl text-sm text-text-muted hover:text-text-primary transition-all flex items-center gap-2 hover-lift"
                    >
                        <Recycle className="w-4 h-4" />Empty Recycle Bin
                    </motion.button>
                </motion.div>
            )}
            {scanResults.length === 0 && !scanning && (
                <div className="text-center py-16">
                    <Search className="w-12 h-12 text-text-dim mx-auto mb-4 opacity-30" />
                    <p className="text-text-dim text-sm">Click "Scan" to analyze your system for junk files</p>
                </div>
            )}
        </div>
    )
}
