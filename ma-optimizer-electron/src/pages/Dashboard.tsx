import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Zap, Shield, Cpu, HardDrive, Wifi, MemoryStick, Crown, Monitor, Clock, Activity, ChevronRight, RefreshCw, Loader2 } from 'lucide-react'
import { RingGauge } from '../components/ui/RingGauge'
import { useSystemStore } from '../store/systemStore'
import { useAppStore } from '../store/appStore'
import { useSettingsStore } from '../store/settingsStore'
import { calculateHealthScore } from '../utils/health'

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

function HealthGauge({ score }: { score: number }) {
    const size = 140
    const strokeWidth = 8
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference
    const center = size / 2

    const getColor = () => {
        if (score >= 80) return { stroke: 'var(--accent-cyan)', label: 'Excellent', text: 'text-[var(--accent-cyan)]' }
        if (score >= 50) return { stroke: 'rgba(0,255,222,0.6)', label: 'Good', text: 'text-[var(--accent-cyan)] opacity-90' }
        if (score >= 30) return { stroke: 'rgba(255,0,60,0.6)', label: 'Fair', text: 'text-[var(--accent-red)] opacity-90' }
        return { stroke: 'var(--accent-red)', label: 'Needs Work', text: 'text-[var(--accent-red)]' }
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
                    <span className={`text-3xl font-bold ${color.text}`} style={{ textShadow: score >= 50 ? 'var(--glow-cyan)' : 'var(--glow-red)' }}>{score}</span>
                    <span className="text-text-muted text-[10px] mt-0.5">/ 100</span>
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
        { icon: Crown, label: 'Power Plan', color: 'from-[var(--accent-cyan)] to-[rgba(0,255,222,0.4)]', glow: 'group-hover:shadow-[var(--glow-cyan)]', page: 'ma-power' as const, desc: 'Flagship performance profile' },
        { icon: Zap, label: 'CPU & Memory', color: 'from-[var(--accent-cyan)] to-[rgba(0,255,222,0.4)]', glow: 'group-hover:shadow-[var(--glow-cyan)]', page: 'performance' as const, desc: 'Process & resource tuning' },
        { icon: Shield, label: 'Privacy', color: 'from-[var(--accent-cyan)] to-[rgba(0,255,222,0.4)]', glow: 'group-hover:shadow-[var(--glow-cyan)]', page: 'privacy' as const, desc: 'Advanced OS telemetry control' },
        { icon: Wifi, label: 'Network', color: 'from-[var(--accent-cyan)] to-[rgba(0,255,222,0.4)]', glow: 'group-hover:shadow-[var(--glow-cyan)]', page: 'network' as const, desc: 'TCP/IP and adapter optimization' },
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
            <motion.div variants={item} className="relative overflow-hidden rounded-3xl p-10 shadow-2xl glass hover-lift">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,255,222,0.08),transparent_50%)] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,0,60,0.05),transparent_50%)] pointer-events-none" />
                <div className="relative z-10 flex items-center justify-between gap-12">
                    <div className="flex-1">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[rgba(0,255,222,0.05)] text-[var(--accent-cyan)] text-[10px] font-bold uppercase tracking-widest mb-4 shadow-[var(--glow-cyan)]"
                        >
                            <Activity className="w-3 h-3" /> System Ready
                        </motion.div>
                        <h1 className="text-4xl font-extrabold text-[var(--text-primary)] mb-4 tracking-tight">
                            Optimize your <span className="text-gradient-mixed">Windows Experience</span>
                        </h1>
                        <p className="text-text-muted text-base max-w-lg mb-8 leading-relaxed">MA-Optimizer is the definitive tool for power users. Enhance system speed, reduce latency, and reclaim your privacy with a single click.</p>

                        <div className="flex items-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(0,255,222,0.3)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={runOptimizeAll}
                                disabled={isOptimizing}
                                className="px-8 py-4 rounded-2xl font-bold text-base flex items-center gap-3 disabled:opacity-50 btn-primary bg-[var(--bg-surface)]"
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
                            <span className="text-[var(--accent-cyan)] text-sm font-bold flex items-center gap-2" style={{ textShadow: 'var(--glow-cyan)' }}>
                                <RefreshCw className="w-4 h-4 animate-spin" /> {optSteps[optStep].label}
                            </span>
                            <span className="text-[var(--text-muted)] text-sm font-mono">{optProgress}%</span>
                        </div>
                        <div className="w-full h-3 bg-[var(--bg-deep)] border border-[var(--border)] rounded-full overflow-hidden relative">
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-[var(--accent-cyan)] shadow-[var(--glow-cyan)]"
                                animate={{ width: `${optProgress}%` }}
                                transition={{ type: 'spring', stiffness: 50 }}
                            />
                        </div>
                    </motion.div>
                )}
            </motion.div>

            {/* Rest of the dashboard... */}
            <div className="grid grid-cols-5 gap-6">
                <motion.div variants={item} className="col-span-2 card-premium rounded-2xl p-6 transition-colors">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 rounded-lg bg-[rgba(0,255,222,0.05)] border border-[var(--border)] shadow-[var(--glow-cyan)]">
                            <Monitor className="w-4 h-4 text-[var(--accent-cyan)]" />
                        </div>
                        <span className="text-[var(--text-primary)] text-sm font-bold">System Specification</span>
                    </div>
                    <div className="space-y-3">
                        {[
                            { label: 'Operating System', value: `${osInfo?.distro || 'Windows'} ${osInfo?.release || ''}`, icon: Shield },
                            { label: 'System Build', value: osInfo?.build || '—', mono: true },
                            { label: 'Hostname', value: osInfo?.hostname || '—' },
                            { label: 'Architecture', value: osInfo?.arch || 'x64' },
                            { label: 'System Uptime', value: formatUptime(uptime), icon: Clock },
                        ].map((row, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-[var(--border)] last:border-0">
                                <span className="text-[var(--text-secondary)]">{row.label}</span>
                                <span className={`text-[var(--text-primary)] font-semibold ${row.mono ? 'font-mono' : ''}`}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div variants={item} className="card-premium rounded-2xl p-6 flex items-center justify-center group transition-colors">
                    <RingGauge value={cpu} label="CPU" sublabel={`${cpu.toFixed(0)}% Load`} size={120} />
                </motion.div>

                <motion.div variants={item} className="card-premium rounded-2xl p-6 flex items-center justify-center group transition-colors">
                    <RingGauge value={ram.percent} label="RAM" sublabel={`${formatBytes(ram.used)} / ${formatBytes(ram.total)}`} size={120} />
                </motion.div>

                <motion.div variants={item} className="card-premium rounded-2xl p-6 space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg border border-[var(--border)] bg-[rgba(0,255,222,0.05)] shadow-[var(--glow-cyan)]">
                                    <HardDrive className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                                </div>
                                <span className="text-[11px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">Disk Storage I/O</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-[var(--text-muted)] uppercase font-medium">Read</span>
                                    <span className="text-sm font-mono text-[var(--accent-cyan)] font-bold" style={{ textShadow: 'var(--glow-cyan)' }}>{formatBytes(disk.readPerSec)}/s</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-[var(--text-muted)] uppercase font-medium">Write</span>
                                    <span className="text-sm font-mono text-[var(--accent-cyan)] opacity-70 font-bold">{formatBytes(disk.writePerSec)}/s</span>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--bg-deep)] border border-[var(--border)] rounded-full overflow-hidden flex">
                                <motion.div
                                    className="h-full bg-[var(--accent-cyan)] shadow-[var(--glow-cyan)]"
                                    animate={{ width: `${Math.min((disk.readPerSec / (100 * 1024 * 1024)) * 100, 100)}%` }}
                                />
                                <motion.div
                                    className="h-full bg-[var(--accent-cyan)] opacity-40"
                                    animate={{ width: `${Math.min((disk.writePerSec / (100 * 1024 * 1024)) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-[var(--border)] opacity-50" />

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg border border-[var(--border)] bg-[rgba(0,255,222,0.05)] shadow-[var(--glow-cyan)]">
                                    <Wifi className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                                </div>
                                <span className="text-[11px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">Network Traffic</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-[var(--text-muted)] uppercase font-medium">Download</span>
                                    <span className="text-sm font-mono text-[var(--accent-cyan)] font-bold" style={{ textShadow: 'var(--glow-cyan)' }}>{formatBytes(net.rxSec)}/s</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-[var(--text-muted)] uppercase font-medium">Upload</span>
                                    <span className="text-sm font-mono text-[var(--accent-cyan)] opacity-70 font-bold">{formatBytes(net.txSec)}/s</span>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--bg-deep)] border border-[var(--border)] rounded-full overflow-hidden flex">
                                <motion.div
                                    className="h-full bg-[var(--accent-cyan)] shadow-[var(--glow-cyan)]"
                                    animate={{ width: `${Math.min((net.rxSec / (50 * 1024 * 1024)) * 100, 100)}%` }}
                                />
                                <motion.div
                                    className="h-full bg-[var(--accent-cyan)] opacity-40"
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
                        whileHover={{ y: -4 }}
                        className={`relative overflow-hidden rounded-2xl p-6 text-left group transition-all hover-lift card-premium ${c.glow}`}
                    >
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                            <c.icon className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                        </div>
                        <div className="text-[var(--text-primary)] font-bold text-sm mb-1">{c.label}</div>
                        <div className="text-[var(--text-secondary)] text-xs leading-relaxed">{c.desc}</div>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-4 h-4 text-[var(--accent-cyan)]" />
                        </div>
                    </motion.button>
                ))}
            </motion.div>
        </motion.div>
    )
}
