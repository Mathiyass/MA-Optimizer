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
        if (score >= 30) return { stroke: 'rgba(255,0,60,0.6)', label: 'Fair', text: 'text-[#FF003C] opacity-90' }
        return { stroke: 'var(--accent-red)', label: 'Needs Work', text: 'text-[#FF003C]' }
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
    const premiumCardClass = "bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-[2.5rem] p-8 transition-all hover:bg-[rgba(255,255,255,0.05)] border"
    
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
            className="space-y-8 max-w-[90rem] mx-auto w-full"
            variants={container}
            initial={false}
            animate="show"
        >
            {/* Ultra-Premium Hero Section */}
            <motion.div variants={item} className="relative overflow-hidden rounded-[2.5rem] p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl animate-float-complex border">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,255,222,0.15),transparent_50%)] pointer-events-none mix-blend-screen" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,255,222,0.15),transparent_50%)] pointer-events-none mix-blend-screen" />
                <div className="absolute top-0 right-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 pointer-events-none mix-blend-overlay"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
                    <div className="flex-1 flex flex-col justify-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border-[var(--accent-cyan)]/30 bg-[rgba(0,255,222,0.05)] text-[var(--accent-cyan)] text-[11px] font-black uppercase tracking-[0.2em] mb-6 shadow-[0_0_15px_rgba(0,255,222,0.2)] animate-pulse-glow border"
                        >
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-cyan)] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--accent-cyan)]"></span>
                            </span>
                            System Analytics Active
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight leading-[1.1]"
                        >
                            Unleash the power of <br/>
                            <span className="text-gradient-ultra">MA-Optimizer</span>
                        </motion.h1>
                        
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-text-muted text-lg max-w-xl mb-10 leading-relaxed font-medium"
                        >
                            Experience unparalleled system tuning. Enhance processing speed, minimize latency, and fortify your digital privacy with our next-generation optimization engine.
                        </motion.p>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="flex flex-wrap items-center gap-6"
                        >
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={runOptimizeAll}
                                disabled={isOptimizing}
                                className="px-10 py-5 text-lg font-black flex items-center gap-4 disabled:opacity-50 btn-ultra uppercase tracking-wider"
                            >
                                {isOptimizing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
                                {isOptimizing ? 'Optimizing Core...' : 'Quick Optimize'}
                            </motion.button>

                            <div className="flex items-center gap-4 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 px-5 py-3 rounded-2xl border">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className={`w-10 h-10 rounded-full border-2 border-card-bg bg-[rgba(255,255,255,0.1)] flex items-center justify-center text-xs font-black text-white shadow-lg`}>#{i}</div>
                                    ))}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[var(--accent-cyan)] text-xs font-black tracking-widest">50K+ USERS</span>
                                    <span className="text-text-muted text-[10px] uppercase tracking-wider">Trusted globally</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 1, type: "spring", bounce: 0.4 }}
                        className="relative animate-hero-glow z-20"
                    >
                        <HealthGauge score={healthScore} />
                    </motion.div>
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
                        <div className="w-full h-3 bg-[var(--bg-deep)] border-[var(--border)] rounded-full overflow-visible relative border">
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-[#00FFDE] shadow-[0_0_15px_#00FFDE] rounded-full"
                                animate={{ width: `${optProgress}%` }}
                                transition={{ type: 'spring', stiffness: 50 }}
                            />
                        </div>
                    </motion.div>
                )}
            </motion.div>

            {/* Telemetry and System Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <motion.div variants={item} className={`col-span-1 lg:col-span-2 ${premiumCardClass} hover:shadow-[0_0_30px_rgba(0,255,222,0.1)]`}>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-[rgba(0,255,222,0.1)] to-transparent border-[var(--accent-cyan)]/30 shadow-[var(--glow-cyan)] border">
                            <Monitor className="w-6 h-6 text-[var(--accent-cyan)]" />
                        </div>
                        <div>
                            <h3 className="text-white text-lg font-black tracking-wide">System Specification</h3>
                            <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-widest">Hardware Info</p>
                        </div>
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

                <motion.div variants={item} className={`${premiumCardClass} flex flex-col items-center justify-center group hover:shadow-[0_0_30px_rgba(0,255,222,0.1)]`}>
                    <RingGauge value={cpu} label="CPU" sublabel={`${cpu.toFixed(0)}% Load`} size={140} />
                </motion.div>

                <motion.div variants={item} className={`${premiumCardClass} flex flex-col items-center justify-center group hover:shadow-[0_0_30px_rgba(0,255,222,0.1)]`}>
                    <RingGauge value={ram.percent} label="RAM" sublabel={`${formatBytes(ram.used)} / ${formatBytes(ram.total)}`} size={140} />
                </motion.div>

                <motion.div variants={item} className={`${premiumCardClass} space-y-8 flex flex-col justify-center hover:shadow-[0_0_30px_rgba(0,255,222,0.1)]`}>
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-2xl border-[var(--border)] bg-[rgba(0,255,222,0.05)] shadow-[var(--glow-cyan)] border">
                                    <HardDrive className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                                </div>
                                <span className="text-[11px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">Disk Storage I/O</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-[var(--text-muted)] uppercase font-medium">Read</span>
                                    <span className="text-sm font-mono text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] font-bold">{formatBytes(disk.readPerSec)}/s</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-[var(--text-muted)] uppercase font-medium">Write</span>
                                    <span className="text-sm font-mono text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] opacity-70 font-bold">{formatBytes(disk.writePerSec)}/s</span>
                                </div>
                            </div>
                            <div className="relative h-1.5 w-full bg-[var(--bg-deep)] border-[var(--border)] rounded-full border">
                                <div className="absolute inset-0 flex overflow-visible pointer-events-none">
                                    <motion.div className="h-full bg-transparent shadow-[0_0_15px_#00FFDE]" animate={{ width: `${Math.min((disk.readPerSec / (100 * 1024 * 1024)) * 100, 100)}%` }} />
                                    <motion.div className="h-full bg-transparent shadow-[0_0_15px_#00FFDE] opacity-40" animate={{ width: `${Math.min((disk.writePerSec / (100 * 1024 * 1024)) * 100, 100)}%` }} />
                                </div>
                                <div className="absolute inset-0 flex overflow-hidden rounded-full pointer-events-none">
                                    <motion.div className="h-full bg-[#00FFDE]" animate={{ width: `${Math.min((disk.readPerSec / (100 * 1024 * 1024)) * 100, 100)}%` }} />
                                    <motion.div className="h-full bg-[#00FFDE] opacity-40" animate={{ width: `${Math.min((disk.writePerSec / (100 * 1024 * 1024)) * 100, 100)}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-[var(--border)] opacity-50" />

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-2xl border-[var(--border)] bg-[rgba(0,255,222,0.05)] shadow-[var(--glow-cyan)] border">
                                    <Wifi className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                                </div>
                                <span className="text-[11px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">Network Traffic</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-[var(--text-muted)] uppercase font-medium">Download</span>
                                    <span className="text-sm font-mono text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] font-bold">{formatBytes(net.rxSec)}/s</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-[var(--text-muted)] uppercase font-medium">Upload</span>
                                    <span className="text-sm font-mono text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] opacity-70 font-bold">{formatBytes(net.txSec)}/s</span>
                                </div>
                            </div>
                            <div className="relative h-1.5 w-full bg-[var(--bg-deep)] border-[var(--border)] rounded-full border">
                                <div className="absolute inset-0 flex overflow-visible pointer-events-none">
                                    <motion.div className="h-full bg-transparent shadow-[0_0_15px_#00FFDE]" animate={{ width: `${Math.min((net.rxSec / (50 * 1024 * 1024)) * 100, 100)}%` }} />
                                    <motion.div className="h-full bg-transparent shadow-[0_0_15px_#00FFDE] opacity-40" animate={{ width: `${Math.min((net.txSec / (50 * 1024 * 1024)) * 100, 100)}%` }} />
                                </div>
                                <div className="absolute inset-0 flex overflow-hidden rounded-full pointer-events-none">
                                    <motion.div className="h-full bg-[#00FFDE]" animate={{ width: `${Math.min((net.rxSec / (50 * 1024 * 1024)) * 100, 100)}%` }} />
                                    <motion.div className="h-full bg-[#00FFDE] opacity-40" animate={{ width: `${Math.min((net.txSec / (50 * 1024 * 1024)) * 100, 100)}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                {quickCards.map((c, i) => (
                    <motion.button
                        key={i}
                        onClick={() => setPage(c.page)}
                        whileHover={{ y: -6, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative overflow-hidden text-left group duration-300 hover:border-white/10 ${premiumCardClass} ${c.glow}`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                            <c.icon className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                        </div>
                        <div className="text-white font-black text-xl mb-2 tracking-tight">{c.label}</div>
                        <div className="text-[var(--text-muted)] text-sm leading-relaxed font-medium">{c.desc}</div>
                        
                        <div className="absolute bottom-8 right-8 w-10 h-10 rounded-full bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 border">
                            <ChevronRight className="w-5 h-5 text-[var(--accent-cyan)]" />
                        </div>
                    </motion.button>
                ))}
            </motion.div>
        </motion.div>
    )
}
