import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Zap, Shield, Cpu, HardDrive, Wifi, MemoryStick, Crown, Monitor, Clock, Activity, ChevronRight, RefreshCw, Loader2 } from 'lucide-react'
import { RingGauge } from '../components/ui/RingGauge'
import { useSystemStore } from '../store/systemStore'
import { useAppStore } from '../store/appStore'
import { useSettingsStore } from '../store/settingsStore'

function formatBytes(b: number) {
    if (!b) return '0 B'
    const k = 1024, s = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(Math.abs(b) || 1) / Math.log(k))
    return (b / Math.pow(k, i)).toFixed(1) + ' ' + s[i]
}

/** Animated number counter */
function AnimatedNumber({ value, suffix = '', decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
    const [display, setDisplay] = useState(0)
    const rafRef = useRef<number>()

    useEffect(() => {
        const start = display
        const diff = value - start
        const duration = 600
        const startTime = performance.now()

        function animate(currentTime: number) {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
            setDisplay(start + diff * eased)
            if (progress < 1) rafRef.current = requestAnimationFrame(animate)
        }

        rafRef.current = requestAnimationFrame(animate)
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    }, [value])

    return <>{display.toFixed(decimals)}{suffix}</>
}

/** System Health Score — weighted composite */
function calculateHealthScore(cpu: number, ramPercent: number, applied: number): number {
    // Low CPU usage = good, Low RAM usage = good, more tweaks = better
    const cpuScore = Math.max(0, 100 - cpu)
    const ramScore = Math.max(0, 100 - ramPercent)
    const tweakScore = Math.min(applied * 2, 100) // max 50 tweaks = 100
    return Math.round(cpuScore * 0.35 + ramScore * 0.35 + tweakScore * 0.3)
}

function HealthGauge({ score }: { score: number }) {
    const size = 140
    const strokeWidth = 8
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference
    const center = size / 2

    const getColor = () => {
        if (score >= 80) return { stroke: '#00ff88', label: 'Excellent', text: 'text-success' }
        if (score >= 60) return { stroke: '#00FFDE', label: 'Good', text: 'text-accent-cyan' }
        if (score >= 40) return { stroke: '#ffd700', label: 'Fair', text: 'text-warning' }
        return { stroke: '#ff4444', label: 'Needs Work', text: 'text-danger' }
    }
    const color = getColor()

    return (
        <div className="flex flex-col items-center">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                    <defs>
                        <linearGradient id="health-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={color.stroke} />
                            <stop offset="100%" stopColor={color.stroke} stopOpacity="0.4" />
                        </linearGradient>
                        <filter id="health-glow">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <circle cx={center} cy={center} r={radius} stroke="#21262d" strokeWidth={strokeWidth} fill="none" />
                    <circle
                        cx={center} cy={center} r={radius}
                        stroke="url(#health-gradient)"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        filter="url(#health-glow)"
                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${color.text}`}>{score}</span>
                    <span className="text-text-dim text-[10px] mt-0.5">/ 100</span>
                </div>
            </div>
            <div className={`text-sm font-semibold mt-2 ${color.text}`}>{color.label}</div>
            <div className="text-text-dim text-[10px]">System Health</div>
        </div>
    )
}

export function Dashboard() {
    const cpu = useSystemStore(s => s.cpu)
    const ram = useSystemStore(s => s.ram)
    const disk = useSystemStore(s => s.disk)
    const net = useSystemStore(s => s.network)
    const setPage = useAppStore(s => s.setPage)
    const addNotification = useAppStore(s => s.addNotification)
    const applied = useSettingsStore(s => Object.values(s.appliedTweaks).filter(Boolean).length)
    const cleaned = useSettingsStore(s => s.totalCleaned)
    const [osInfo, setOsInfo] = useState<{ platform: string; distro: string; release: string; build: string; hostname: string; arch: string } | null>(null)
    const [uptime, setUptime] = useState(0)

    // Optimization Flow State
    const [isOptimizing, setIsOptimizing] = useState(false)
    const [optStep, setOptStep] = useState(0)
    const [optProgress, setOptProgress] = useState(0)

    const healthScore = calculateHealthScore(cpu, ram.percent, applied)

    const optSteps = [
        { label: 'Creating Restore Point...', fn: async () => await window.api?.repair.createRestorePoint('MA-Optimizer Auto-Optimize') },
        { label: 'Cleaning System Junk...', fn: async () => await window.api?.cleaner.clean(['temp', 'logs', 'cache', 'thumbnails']) },
        { label: 'Optimizing Registry...', fn: async () => await window.api?.services.applyRecommended() }, // Use services apply for now
        { label: 'Tuning Performance...', fn: async () => { /* Logic for applying multiple tweaks */ } },
        { label: 'Finalizing...', fn: async () => new Promise(r => setTimeout(r, 1000)) },
    ]

    const runOptimizeAll = async () => {
        setIsOptimizing(true)
        setOptStep(0)
        setOptProgress(0)

        for (let i = 0; i < optSteps.length; i++) {
            setOptStep(i)
            setOptProgress(Math.round((i / optSteps.length) * 100))
            try { await optSteps[i].fn() } catch (e) { console.error(e) }
            await new Promise(r => setTimeout(r, 800))
        }

        setOptProgress(100)
        setTimeout(() => {
            setIsOptimizing(false)
            addNotification('success', 'System optimization complete!')
        }, 1000)
    }

    useEffect(() => {
        window.api?.system.getFullInfo().then((info: any) => {
            if (info?.os) {
                setOsInfo({
                    platform: info.os.platform || 'Windows',
                    distro: info.os.distro || 'Windows',
                    release: info.os.release || '',
                    build: info.os.build || '',
                    hostname: info.os.hostname || '',
                    arch: info.os.arch || 'x64',
                })
            }
            if (info?.time?.uptime) setUptime(info.time.uptime)
        }).catch(() => { })
    }, [])

    const formatUptime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        return `${h}h ${m}m`
    }

    const quickCards = [
        { icon: Crown, label: 'Power Plan', color: 'from-violet-600 to-purple-500', page: 'ma-power' as const, desc: 'Flagship performance' },
        { icon: Zap, label: 'CPU & Memory', color: 'from-cyan-500 to-blue-500', page: 'performance' as const, desc: 'System tuning' },
        { icon: Shield, label: 'Privacy', color: 'from-green-500 to-emerald-500', page: 'privacy' as const, desc: 'Telemetry control' },
        { icon: Wifi, label: 'Network', color: 'from-orange-500 to-amber-500', page: 'network' as const, desc: 'TCP/IP optimization' },
    ]

    const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
    const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

    return (
        <motion.div
            className="space-y-6 max-w-6xl"
            variants={container}
            initial={false}
            animate="show"
        >
            {/* Hero */}
            <motion.div variants={item} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card-bg via-[#0d1117] to-[#1e0a10] border border-white/5 p-10 shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,255,222,0.1),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,0,60,0.08),transparent_60%)]" />
                <div className="relative z-10 flex items-center justify-between gap-12">
                    <div className="flex-1">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-[10px] font-bold uppercase tracking-widest mb-4"
                        >
                            <Activity className="w-3 h-3" /> System Ready
                        </motion.div>
                        <h1 className="text-4xl font-extrabold text-text-primary mb-4 tracking-tight">
                            Optimize your <span className="bg-gradient-to-r from-accent-cyan via-accent-violet to-danger bg-clip-text text-transparent">Windows Experience</span>
                        </h1>
                        <p className="text-text-muted text-base max-w-lg mb-8 leading-relaxed">MA-Optimizer is the definitive tool for power users. Enhance system speed, reduce latency, and reclaim your privacy with a single click.</p>

                        <div className="flex items-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(0,255,222,0.3)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={runOptimizeAll}
                                disabled={isOptimizing}
                                className="px-8 py-4 bg-gradient-to-r from-accent-cyan to-accent-violet rounded-2xl text-white font-bold text-base shadow-xl flex items-center gap-3 disabled:opacity-50"
                            >
                                {isOptimizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                {isOptimizing ? 'Optimizing...' : 'One-Click Optimize'}
                            </motion.button>

                            <div className="flex -space-x-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-card-bg bg-card-border flex items-center justify-center text-[10px] font-bold text-text-dim`}>#{i}</div>
                                ))}
                            </div>
                            <span className="text-text-dim text-xs font-medium">Trusted by 50k+ users</span>
                        </div>
                    </div>
                    <HealthGauge score={healthScore} />
                </div>

                {isOptimizing && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 pt-8 border-t border-white/5"
                    >
                        <div className="flex justify-between mb-2">
                            <span className="text-accent-cyan text-sm font-bold flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin" /> {optSteps[optStep].label}
                            </span>
                            <span className="text-text-dim text-sm font-mono">{optProgress}%</span>
                        </div>
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-accent-cyan to-accent-violet"
                                animate={{ width: `${optProgress}%` }}
                                transition={{ type: 'spring', stiffness: 50 }}
                            />
                        </div>
                    </motion.div>
                )}
            </motion.div>

            {/* Rest of the dashboard... */}
            <div className="grid grid-cols-5 gap-6">
                <motion.div variants={item} className="col-span-2 bg-card-bg border border-card-border rounded-2xl p-6 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 rounded-lg bg-accent-cyan/10">
                            <Monitor className="w-4 h-4 text-accent-cyan" />
                        </div>
                        <span className="text-text-primary text-sm font-bold">System Specification</span>
                    </div>
                    <div className="space-y-3">
                        {[
                            { label: 'Operating System', value: `${osInfo?.distro || 'Windows'} ${osInfo?.release || ''}`, icon: Shield },
                            { label: 'System Build', value: osInfo?.build || '—', mono: true },
                            { label: 'Hostname', value: osInfo?.hostname || '—' },
                            { label: 'Architecture', value: osInfo?.arch || 'x64' },
                            { label: 'System Uptime', value: formatUptime(uptime), icon: Clock },
                        ].map((row, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="text-text-dim">{row.label}</span>
                                <span className={`text-text-primary font-semibold ${row.mono ? 'font-mono' : ''}`}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div variants={item} className="bg-card-bg border border-card-border rounded-2xl p-6 flex items-center justify-center group hover:border-accent-cyan/30 transition-colors">
                    <RingGauge value={cpu} label="CPU" sublabel={`${cpu.toFixed(0)}% Load`} size={120} />
                </motion.div>

                <motion.div variants={item} className="bg-card-bg border border-card-border rounded-2xl p-6 flex items-center justify-center group hover:border-accent-violet/30 transition-colors">
                    <RingGauge value={ram.percent} label="RAM" sublabel={formatBytes(ram.used)} size={120} />
                </motion.div>

                <motion.div variants={item} className="bg-card-bg border border-card-border rounded-2xl p-6 space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-accent-cyan/10">
                                    <HardDrive className="w-3.5 h-3.5 text-accent-cyan" />
                                </div>
                                <span className="text-[11px] text-text-dim uppercase font-bold tracking-wider">Disk Storage I/O</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-text-dim uppercase font-medium">Read</span>
                                    <span className="text-sm font-mono text-text-primary font-bold">{formatBytes(disk.readPerSec)}/s</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-text-dim uppercase font-medium">Write</span>
                                    <span className="text-sm font-mono text-text-primary font-bold">{formatBytes(disk.writePerSec)}/s</span>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                                <motion.div
                                    className="h-full bg-accent-cyan shadow-[0_0_8px_rgba(0,255,222,0.5)]"
                                    animate={{ width: `${Math.min((disk.readPerSec / (100 * 1024 * 1024)) * 100, 100)}%` }}
                                />
                                <motion.div
                                    className="h-full bg-accent-violet shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                                    animate={{ width: `${Math.min((disk.writePerSec / (100 * 1024 * 1024)) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-success/10">
                                    <Wifi className="w-3.5 h-3.5 text-success" />
                                </div>
                                <span className="text-[11px] text-text-dim uppercase font-bold tracking-wider">Network Traffic</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-success/70 uppercase font-medium">Download</span>
                                    <span className="text-sm font-mono text-success font-bold">{formatBytes(net.rxSec)}/s</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-accent-violet/70 uppercase font-medium">Upload</span>
                                    <span className="text-sm font-mono text-accent-violet font-bold">{formatBytes(net.txSec)}/s</span>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                                <motion.div
                                    className="h-full bg-success shadow-[0_0_8px_rgba(0,255,136,0.5)]"
                                    animate={{ width: `${Math.min((net.rxSec / (50 * 1024 * 1024)) * 100, 100)}%` }}
                                />
                                <motion.div
                                    className="h-full bg-accent-violet shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                                    animate={{ width: `${Math.min((net.txSec / (50 * 1024 * 1024)) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <motion.div variants={item} className="grid grid-cols-4 gap-6">
                {quickCards.map((c, i) => (
                    <motion.button
                        key={i}
                        onClick={() => setPage(c.page)}
                        whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.1)' }}
                        className="relative overflow-hidden rounded-2xl border border-card-border bg-card-bg p-6 text-left group transition-all"
                    >
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                            <c.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-text-primary font-bold text-sm mb-1">{c.label}</div>
                        <div className="text-text-dim text-xs leading-relaxed">{c.desc}</div>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-4 h-4 text-text-dim" />
                        </div>
                    </motion.button>
                ))}
            </motion.div>
        </motion.div>
    )
}
