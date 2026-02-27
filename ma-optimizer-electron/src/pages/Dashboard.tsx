import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Zap, Shield, Cpu, HardDrive, Wifi, MemoryStick, Crown, Monitor, Clock, Activity, ChevronRight } from 'lucide-react'
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
    const applied = useSettingsStore(s => Object.values(s.appliedTweaks).filter(Boolean).length)
    const cleaned = useSettingsStore(s => s.totalCleaned)
    const [osInfo, setOsInfo] = useState<{ platform: string; distro: string; release: string; build: string; hostname: string; arch: string } | null>(null)
    const [uptime, setUptime] = useState(0)

    const healthScore = calculateHealthScore(cpu, ram.percent, applied)

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
        { icon: Crown, label: 'MA Power Plan', color: 'from-violet-600 to-purple-500', page: 'ma-power' as const, desc: 'Flagship performance plan' },
        { icon: Zap, label: 'Performance', color: 'from-cyan-500 to-blue-500', page: 'performance' as const, desc: 'System optimization tweaks' },
        { icon: Shield, label: 'Privacy', color: 'from-green-500 to-emerald-500', page: 'privacy' as const, desc: 'Telemetry & tracking control' },
        { icon: Wifi, label: 'Network', color: 'from-orange-500 to-amber-500', page: 'network' as const, desc: 'TCP/IP optimization' },
    ]

    const container = {
        hidden: {},
        show: { transition: { staggerChildren: 0.06 } }
    }
    const item = {
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    }

    return (
        <motion.div
            className="space-y-6 max-w-6xl"
            variants={container}
            initial={false}
            animate="show"
        >
            {/* Hero */}
            <motion.div variants={item} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card-bg via-[#111827] to-[#2a0a0f] border border-card-border p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,222,0.08),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,0,60,0.06),transparent_50%)]" />
                <div className="relative z-10 flex items-start justify-between gap-8">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-text-primary mb-2">
                            Welcome to <span className="bg-gradient-to-r from-accent-cyan to-accent-violet bg-clip-text text-transparent">MA-Optimizer</span>
                        </h1>
                        <p className="text-text-muted max-w-lg">The most comprehensive Windows optimization suite. Fine‑tune performance, privacy, networking and more — all with automatic backup and one‑click undo.</p>
                        <div className="flex items-center gap-6 mt-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-accent-cyan">
                                    <AnimatedNumber value={applied} />
                                </div>
                                <div className="text-text-dim text-xs">Tweaks Applied</div>
                            </div>
                            <div className="w-px h-10 bg-card-border" />
                            <div className="text-center">
                                <div className="text-2xl font-bold text-success">{formatBytes(cleaned)}</div>
                                <div className="text-text-dim text-xs">Space Freed</div>
                            </div>
                            <div className="w-px h-10 bg-card-border" />
                            <div className="text-center">
                                <div className="text-2xl font-bold text-accent-violet">
                                    <AnimatedNumber value={healthScore} suffix="%" />
                                </div>
                                <div className="text-text-dim text-xs">Health Score</div>
                            </div>
                        </div>
                    </div>
                    <HealthGauge score={healthScore} />
                </div>
            </motion.div>

            {/* OS Info + Quick Stats */}
            <motion.div variants={item} className="grid grid-cols-5 gap-4">
                {/* OS Info card */}
                <div className="col-span-2 bg-card-bg border border-card-border rounded-xl p-5 card-premium">
                    <div className="flex items-center gap-2 mb-3">
                        <Monitor className="w-4 h-4 text-accent-cyan" />
                        <span className="text-text-primary text-sm font-semibold">System Info</span>
                    </div>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-text-dim">OS</span>
                            <span className="text-text-primary font-medium">{osInfo?.distro || 'Windows'} {osInfo?.release || ''}</span>
                        </div>
                        {osInfo?.build && (
                            <div className="flex justify-between">
                                <span className="text-text-dim">Build</span>
                                <span className="text-text-muted font-mono">{osInfo.build}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-text-dim">Hostname</span>
                            <span className="text-text-muted">{osInfo?.hostname || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-dim">Architecture</span>
                            <span className="text-text-muted">{osInfo?.arch || 'x64'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-dim">Uptime</span>
                            <span className="text-text-muted flex items-center gap-1"><Clock className="w-3 h-3" />{formatUptime(uptime)}</span>
                        </div>
                    </div>
                </div>

                {/* Quick stat cards */}
                <div className="bg-card-bg border border-card-border rounded-xl p-5 flex items-center justify-center">
                    <RingGauge value={cpu} label="CPU" sublabel={`${cpu.toFixed(0)}% usage`} size={100} />
                </div>
                <div className="bg-card-bg border border-card-border rounded-xl p-5 flex items-center justify-center">
                    <RingGauge value={ram.percent} label="RAM" sublabel={`${formatBytes(ram.used)} / ${formatBytes(ram.total)}`} size={100} />
                </div>
                <div className="bg-card-bg border border-card-border rounded-xl p-5 flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-3">
                        <div className="text-center">
                            <HardDrive className="w-5 h-5 text-accent-cyan mx-auto mb-1" />
                            <div className="text-text-primary text-xs font-semibold">Disk I/O</div>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-text-muted text-[11px]">R: {formatBytes(disk.readPerSec)}/s</div>
                        <div className="text-text-muted text-[11px]">W: {formatBytes(disk.writePerSec)}/s</div>
                    </div>
                    <div className="w-full h-px bg-card-border mt-1" />
                    <div className="text-center">
                        <Wifi className="w-5 h-5 text-success mx-auto mb-1" />
                        <div className="text-text-muted text-[11px]">↓ {formatBytes(net.rxSec)}/s</div>
                        <div className="text-text-muted text-[11px]">↑ {formatBytes(net.txSec)}/s</div>
                    </div>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={item} className="grid grid-cols-4 gap-4">
                {quickCards.map((c, i) => (
                    <motion.button
                        key={i}
                        onClick={() => setPage(c.page)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative overflow-hidden rounded-xl border border-card-border bg-card-bg p-5 text-left group transition-all hover:border-white/10 card-premium hover-lift"
                    >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-3 shadow-lg`}>
                            <c.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-text-primary font-semibold text-sm">{c.label}</div>
                        <div className="text-text-dim text-xs mt-0.5 flex items-center gap-1">
                            {c.desc}
                            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </motion.button>
                ))}
            </motion.div>
        </motion.div>
    )
}
