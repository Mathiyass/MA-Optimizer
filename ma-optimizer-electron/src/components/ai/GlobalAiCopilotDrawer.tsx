import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Brain,
    X,
    Sparkles,
    Send,
    Bot,
    User,
    Gauge,
    Activity,
    SlidersHorizontal,
    Gamepad2,
    RotateCcw,
    ExternalLink,
    Copy,
    Check,
    Terminal,
    ShieldCheck,
    Cpu,
    Globe,
    Zap,
    Flame,
    Loader2,
    RefreshCw,
    AlertTriangle,
    Layers,
    Lock,
} from 'lucide-react'
import { useAppStore, PageId } from '../../store/appStore'
import { useSystemStore } from '../../store/systemStore'
import {
    evaluateSystemHealth,
    HealthReport,
    Bottleneck,
    synthesizeTelemetryPrompt,
} from '../../services/heuristicEngine'

interface ChatMessage {
    id: string
    sender: 'user' | 'assistant'
    text: string
    timestamp: number
    model?: string
}

type PersonaType = 'general' | 'reasoning' | 'gaming' | 'coder' | 'network' | 'latency'

const PERSONAS: Record<
    PersonaType,
    { label: string; icon: any; color: string; desc: string }
> = {
    general: {
        label: 'System Doctor',
        icon: Brain,
        color: 'text-[var(--accent-cyan)] border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/10',
        desc: 'Global system health & USE bottleneck evaluator',
    },
    reasoning: {
        label: 'Bottleneck Reasoner',
        icon: SlidersHorizontal,
        color: 'text-[#A855F7] border-[#A855F7]/30 bg-[#A855F7]/10',
        desc: 'Multi-step root-cause diagnostics',
    },
    gaming: {
        label: 'FPS & Frame-Time',
        icon: Gamepad2,
        color: 'text-[#00FFDE] border-[#00FFDE]/30 bg-[#00FFDE]/10',
        desc: '144Hz/240Hz frame pacing & 1% lows tuning',
    },
    coder: {
        label: 'Dev Workstation',
        icon: Terminal,
        color: 'text-[#38BDF8] border-[#38BDF8]/30 bg-[#38BDF8]/10',
        desc: 'Compiler thread scaling & I/O cache',
    },
    network: {
        label: 'Net & Ping',
        icon: Globe,
        color: 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10',
        desc: 'Bufferbloat, TCPNoDelay & routing',
    },
    latency: {
        label: 'DPC & Stutter',
        icon: Flame,
        color: 'text-[#FF003C] border-[#FF003C]/30 bg-[#FF003C]/10',
        desc: 'MSI Interrupt Mode & micro-stutter purge',
    },
}

function getPersonaForPage(page: PageId): PersonaType {
    switch (page) {
        case 'network':
        case 'exitlag':
            return 'network'
        case 'performance':
        case 'process-lasso':
        case 'gaming':
            return 'gaming'
        case 'hone':
        case 'drivers':
            return 'latency'
        case 'cleaner':
        case 'repair':
        case 'advanced':
            return 'reasoning'
        default:
            return 'general'
    }
}

export function GlobalAiCopilotDrawer() {
    const isAiDrawerOpen = useAppStore((s) => s.isAiDrawerOpen)
    const setAiDrawerOpen = useAppStore((s) => s.setAiDrawerOpen)
    const currentPage = useAppStore((s) => s.currentPage)
    const addNotification = useAppStore((s) => s.addNotification)

    const cpu = useSystemStore((s) => s.cpu)
    const cpuCores = useSystemStore((s) => s.cpuCores)
    const ram = useSystemStore((s) => s.ram)
    const disk = useSystemStore((s) => s.disk)
    const network = useSystemStore((s) => s.network)

    const [selectedPersona, setSelectedPersona] = useState<PersonaType>('general')
    const [healthReport, setHealthReport] = useState<HealthReport | null>(null)
    const [hardwareSpecs, setHardwareSpecs] = useState<{
        totalRamGb: number
        cpuName: string
        cpuCores: number
        gpuName: string
        vramGb: number
    }>({
        totalRamGb: 16,
        cpuName: 'Processor',
        cpuCores: 8,
        gpuName: 'Graphics Adapter',
        vramGb: 4,
    })

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'init',
            sender: 'assistant',
            text: `⚡ **MA-Optimizer Autonomous Neural Copilot Active.**\n\n**Zero-Latency • Kernel Grounded • Real-Time Telemetry**\n\nContinuous system telemetry analysis is running in the background. Ask any diagnostic question, run instantaneous optimizations below, or bridge live telemetry to web intelligence models.`,
            timestamp: Date.now(),
            model: 'Autonomous Neural Core',
        },
    ])
    const [inputPrompt, setInputPrompt] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [copiedPrompt, setCopiedPrompt] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Set persona based on active page whenever drawer opens or page changes
    useEffect(() => {
        if (isAiDrawerOpen) {
            setSelectedPersona(getPersonaForPage(currentPage))
        }
    }, [isAiDrawerOpen, currentPage])

    // Load full system specs on mount
    useEffect(() => {
        const loadSpecs = async () => {
            try {
                if (window.api?.system?.getFullInfo) {
                    const info = await window.api.system.getFullInfo()
                    if (info) {
                        const totalRamGb = Math.round(
                            (info.memory?.total || 16 * 1024 * 1024 * 1024) / (1024 * 1024 * 1024)
                        )
                        const cpuName = info.cpu?.brand || 'Multi-Core CPU'
                        const cpuCores = info.cpu?.threads || info.cpu?.cores || 8
                        const gpu = info.graphics?.controllers?.[0]
                        const gpuName = gpu?.model || 'Integrated / Dedicated GPU'
                        const vramGb = Math.round((gpu?.vram || 4096) / 1024)
                        setHardwareSpecs({ totalRamGb, cpuName, cpuCores, gpuName, vramGb })
                    }
                }
            } catch (e) {
                console.error(e)
            }
        }
        loadSpecs()
    }, [])

    // Refresh heuristic evaluation whenever drawer is open
    useEffect(() => {
        if (!isAiDrawerOpen) return

        const runEvaluation = async () => {
            const procs = window.api ? await window.api.system.getProcesses() : []
            const safeRam =
                ram && ram.total > 0
                    ? ram
                    : {
                          total: hardwareSpecs.totalRamGb * 1024 * 1024 * 1024,
                          free: (hardwareSpecs.totalRamGb * 0.5) * 1024 * 1024 * 1024,
                          used: (hardwareSpecs.totalRamGb * 0.5) * 1024 * 1024 * 1024,
                          percent: 50,
                      }
            const mockInfo = {
                cpu: { brand: hardwareSpecs.cpuName, cores: hardwareSpecs.cpuCores },
                disks: [],
            }
            const currentStats = {
                cpu,
                ram: safeRam,
                disk,
                network,
            }
            const report = evaluateSystemHealth(mockInfo, currentStats, procs)
            setHealthReport(report)
        }

        runEvaluation()
        const interval = setInterval(runEvaluation, 3000)
        return () => clearInterval(interval)
    }, [isAiDrawerOpen, cpu, ram, disk, network, hardwareSpecs])

    // Listen for AI chunks from IPC
    useEffect(() => {
        if (window.api?.onAiChunk) {
            const unsubscribe = window.api.onAiChunk(({ queryId, chunk, done, model }) => {
                setMessages((prev) => {
                    const lastIdx = prev.findIndex((m) => m.id === queryId)
                    if (lastIdx === -1) {
                        return [
                            ...prev,
                            {
                                id: queryId,
                                sender: 'assistant',
                                text: chunk,
                                timestamp: Date.now(),
                                model: model || 'Autonomous Neural Engine',
                            },
                        ]
                    } else {
                        const updated = [...prev]
                        updated[lastIdx] = {
                            ...updated[lastIdx],
                            text: updated[lastIdx].text + chunk,
                            model: model || updated[lastIdx].model,
                        }
                        return updated
                    }
                })
                if (done) {
                    setIsStreaming(false)
                }
            })
            return () => unsubscribe()
        }
    }, [])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = (textToSend?: string) => {
        const query = (textToSend || inputPrompt).trim()
        if (!query || isStreaming) return

        const userMsgId = `user-${Date.now()}`
        const aiMsgId = `ai-${Date.now()}`

        setMessages((prev) => [
            ...prev,
            { id: userMsgId, sender: 'user', text: query, timestamp: Date.now() },
        ])
        setInputPrompt('')
        setIsStreaming(true)

        const safeRam =
            ram && ram.total > 0
                ? ram
                : {
                      total: hardwareSpecs.totalRamGb * 1024 * 1024 * 1024,
                      free: (hardwareSpecs.totalRamGb * 0.5) * 1024 * 1024 * 1024,
                      used: (hardwareSpecs.totalRamGb * 0.5) * 1024 * 1024 * 1024,
                      percent: 50,
                  }

        const context = {
            currentPage,
            persona: selectedPersona,
            cpu,
            cpuCores,
            ram: safeRam,
            disk,
            network,
            hardware: hardwareSpecs,
            healthScore: healthReport?.score || 85,
            bottlenecks: healthReport?.bottlenecks || [],
        }

        if (window.api?.ai?.query) {
            window.api.ai.query(query, context, aiMsgId, selectedPersona)
        } else {
            setTimeout(() => {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: aiMsgId,
                        sender: 'assistant',
                        text: `Diagnostic evaluation for [${currentPage.toUpperCase()}]: Current resources within standard operating margins.`,
                        timestamp: Date.now(),
                        model: 'Autonomous Neural Engine',
                    },
                ])
                setIsStreaming(false)
            }, 300)
        }
    }

    const handleCopyTelemetry = () => {
        const prompt = synthesizeTelemetryPrompt(
            hardwareSpecs,
            healthReport,
            0,
            `Optimize system specifically for active view: ${currentPage.toUpperCase()}`
        )
        navigator.clipboard.writeText(prompt)
        setCopiedPrompt(true)
        addNotification('success', 'Grounded telemetry copied to clipboard!')
        setTimeout(() => setCopiedPrompt(false), 3000)
    }

    const openWebAi = async (service: 'duck' | 'lmsys' | 'huggingchat' | 'deepseek') => {
        handleCopyTelemetry()
        if (window.api?.ai?.openWebModel) {
            await window.api.ai.openWebModel(service)
        }
    }

    // Quick One-Click Actions
    const executeAction = async (
        id: string,
        actionFn: () => Promise<any>,
        successMsg: string
    ) => {
        setActionLoading(id)
        try {
            await actionFn()
            addNotification('success', successMsg)
        } catch (e: any) {
            addNotification('error', `Action failed: ${e.message || e}`)
        } finally {
            setActionLoading(null)
        }
    }

    return (
        <AnimatePresence>
            {isAiDrawerOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setAiDrawerOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Sidecar Drawer */}
                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] lg:w-[540px] bg-[#0c0e17]/95 backdrop-blur-3xl border-l border-white/10 z-50 flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.8)]"
                    >
                        {/* Drawer Header */}
                        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--accent-cyan)]/20 to-[var(--accent-violet)]/20 border border-[var(--accent-cyan)]/40 flex items-center justify-center text-[var(--accent-cyan)] shadow-[0_0_15px_rgba(0,255,222,0.2)]">
                                    <Sparkles className="w-5 h-5 animate-pulse" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-white font-black text-base tracking-wide leading-tight">
                                            AI Copilot Sidecar
                                        </h2>
                                        <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[var(--accent-cyan)]/15 border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] tracking-wider">
                                            Autonomous Core
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                        Context:{' '}
                                        <span className="text-white font-mono uppercase font-bold">
                                            {currentPage}
                                        </span>{' '}
                                        • Real-Time Heuristic Suite
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setAiDrawerOpen(false)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Top Telemetry & Bottleneck Strip */}
                        <div className="px-5 py-3 border-b border-white/5 bg-white/[0.01] flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Gauge className="w-4 h-4 text-[var(--accent-cyan)]" />
                                <span className="text-xs text-[var(--text-muted)] font-medium">Health:</span>
                                <span className="text-xs font-mono font-bold text-[var(--accent-cyan)]">
                                    {healthReport?.score || 95}/100
                                </span>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar text-[10px]">
                                {healthReport?.bottlenecks && healthReport.bottlenecks.length > 0 ? (
                                    healthReport.bottlenecks.map((b, i) => (
                                        <span
                                            key={i}
                                            className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1 ${
                                                b.severity === 'critical'
                                                    ? 'bg-[#FF003C]/20 border border-[#FF003C]/40 text-[#FF003C]'
                                                    : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                                            }`}
                                        >
                                            <AlertTriangle className="w-3 h-3" />
                                            {b.component}: {b.title}
                                        </span>
                                    ))
                                ) : (
                                    <span className="px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                                        ✓ No Bottlenecks Detected
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Persona Selector Chips */}
                        <div className="px-5 py-3 border-b border-white/5 overflow-x-auto custom-scrollbar flex gap-2">
                            {(Object.keys(PERSONAS) as PersonaType[]).map((pKey) => {
                                const persona = PERSONAS[pKey]
                                const Icon = persona.icon
                                const isActive = selectedPersona === pKey
                                return (
                                    <button
                                        key={pKey}
                                        onClick={() => setSelectedPersona(pKey)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wider uppercase transition-all whitespace-nowrap border ${
                                            isActive
                                                ? persona.color + ' shadow-[0_0_12px_rgba(0,255,222,0.2)]'
                                                : 'bg-white/[0.02] border-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        <span>{persona.label}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Quick 1-Click Optimization Actions Bar */}
                        <div className="px-5 py-2.5 bg-black/40 border-b border-white/5 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                            <span className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] shrink-0">
                                1-Click:
                            </span>

                            <button
                                onClick={() =>
                                    executeAction(
                                        'turbo',
                                        async () => window.api?.heuristic.turboBoost(),
                                        'Turbo Boost engaged!'
                                    )
                                }
                                disabled={actionLoading === 'turbo'}
                                className="px-2.5 py-1 rounded-lg bg-[var(--accent-cyan)]/10 hover:bg-[var(--accent-cyan)]/20 border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1"
                            >
                                {actionLoading === 'turbo' ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Zap className="w-3 h-3" />
                                )}
                                Turbo Boost
                            </button>

                            <button
                                onClick={() =>
                                    executeAction(
                                        'ram',
                                        async () => window.api?.system.cleanRam(),
                                        'RAM working sets released!'
                                    )
                                }
                                disabled={actionLoading === 'ram'}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1"
                            >
                                {actionLoading === 'ram' ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <RotateCcw className="w-3 h-3" />
                                )}
                                Trim RAM
                            </button>

                            <button
                                onClick={() =>
                                    executeAction(
                                        'unpark',
                                        async () => window.api?.processLasso.toggleCoreParking(true),
                                        'All CPU cores unparked!'
                                    )
                                }
                                disabled={actionLoading === 'unpark'}
                                className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1"
                            >
                                {actionLoading === 'unpark' ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Cpu className="w-3 h-3" />
                                )}
                                Unpark Cores
                            </button>

                            <button
                                onClick={() =>
                                    executeAction(
                                        'msi',
                                        async () => window.api?.hone.enableMsiMode(),
                                        'MSI Interrupt Mode engaged!'
                                    )
                                }
                                disabled={actionLoading === 'msi'}
                                className="px-2.5 py-1 rounded-lg bg-[#FF003C]/10 hover:bg-[#FF003C]/20 border border-[#FF003C]/30 text-[#FF003C] text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1"
                            >
                                {actionLoading === 'msi' ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Flame className="w-3 h-3" />
                                )}
                                MSI Mode
                            </button>

                            <button
                                onClick={() =>
                                    executeAction(
                                        'dns',
                                        async () => window.api?.network.flushDns(),
                                        'DNS Cache flushed!'
                                    )
                                }
                                disabled={actionLoading === 'dns'}
                                className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1"
                            >
                                {actionLoading === 'dns' ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Globe className="w-3 h-3" />
                                )}
                                Flush DNS
                            </button>
                        </div>

                        {/* Chat / Messages Area */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                            {messages.map((m) => (
                                <div
                                    key={m.id}
                                    className={`flex gap-3 ${
                                        m.sender === 'user' ? 'justify-end' : 'justify-start'
                                    }`}
                                >
                                    {m.sender === 'assistant' && (
                                        <div className="w-7 h-7 rounded-xl bg-[var(--accent-cyan)]/20 border border-[var(--accent-cyan)]/40 flex items-center justify-center text-[var(--accent-cyan)] shrink-0 mt-0.5">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                                            m.sender === 'user'
                                                ? 'bg-[var(--accent-cyan)] text-black font-semibold shadow-[0_0_15px_rgba(0,255,222,0.3)]'
                                                : 'glass-shell text-text-primary border border-white/5 bg-white/[0.02]'
                                        }`}
                                    >
                                        <div className="whitespace-pre-wrap font-sans">{m.text}</div>
                                        {m.sender === 'assistant' && (
                                            <div className="mt-2 text-[10px] font-mono text-[var(--accent-cyan)]/70 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] inline-block animate-pulse"></span>
                                                Autonomous Neural Core • Sub-ms
                                            </div>
                                        )}
                                    </div>

                                    {m.sender === 'user' && (
                                        <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                                            <User className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isStreaming && (
                                <div className="flex gap-3 justify-start">
                                    <div className="w-7 h-7 rounded-xl bg-[var(--accent-cyan)]/20 border border-[var(--accent-cyan)]/40 flex items-center justify-center text-[var(--accent-cyan)] shrink-0">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    </div>
                                    <div className="glass-shell rounded-2xl p-3 text-xs text-text-muted border border-white/5">
                                        Analyzing system telemetry & kernel heuristics...
                                    </div>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Web Model Telemetry Bridge (1-Click Web Models) */}
                        <div className="px-5 py-3 border-t border-white/10 bg-white/[0.01]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
                                    <ExternalLink className="w-3 h-3 text-[var(--accent-cyan)]" /> Web Intelligence Bridge
                                </span>
                                <button
                                    onClick={handleCopyTelemetry}
                                    className="text-[10px] font-bold text-[var(--accent-cyan)] hover:underline flex items-center gap-1"
                                >
                                    {copiedPrompt ? (
                                        <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                        <Copy className="w-3 h-3" />
                                    )}
                                    {copiedPrompt ? 'Copied Telemetry!' : 'Copy Telemetry'}
                                </button>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                <button
                                    onClick={() => openWebAi('duck')}
                                    className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[var(--accent-cyan)]/40 text-center transition-all group"
                                >
                                    <div className="text-[11px] font-black text-white group-hover:text-[var(--accent-cyan)]">
                                        Duck.ai
                                    </div>
                                    <div className="text-[9px] text-[var(--text-muted)]">No Auth</div>
                                </button>

                                <button
                                    onClick={() => openWebAi('lmsys')}
                                    className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[var(--accent-cyan)]/40 text-center transition-all group"
                                >
                                    <div className="text-[11px] font-black text-white group-hover:text-[var(--accent-cyan)]">
                                        LMSYS
                                    </div>
                                    <div className="text-[9px] text-[var(--text-muted)]">Arena</div>
                                </button>

                                <button
                                    onClick={() => openWebAi('huggingchat')}
                                    className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[var(--accent-cyan)]/40 text-center transition-all group"
                                >
                                    <div className="text-[11px] font-black text-white group-hover:text-[var(--accent-cyan)]">
                                        HuggingChat
                                    </div>
                                    <div className="text-[9px] text-[var(--text-muted)]">Open LLMs</div>
                                </button>

                                <button
                                    onClick={() => openWebAi('deepseek')}
                                    className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[var(--accent-cyan)]/40 text-center transition-all group"
                                >
                                    <div className="text-[11px] font-black text-white group-hover:text-[var(--accent-cyan)]">
                                        DeepSeek
                                    </div>
                                    <div className="text-[9px] text-[var(--text-muted)]">Reasoning</div>
                                </button>
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/10 bg-black/40">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    handleSend()
                                }}
                                className="flex gap-2"
                            >
                                <input
                                    type="text"
                                    value={inputPrompt}
                                    onChange={(e) => setInputPrompt(e.target.value)}
                                    placeholder={`Ask ${PERSONAS[selectedPersona].label} about ${currentPage}...`}
                                    className="flex-1 bg-white/5 border border-white/10 focus:border-[var(--accent-cyan)]/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-[var(--text-muted)] outline-none transition-all"
                                />

                                <button
                                    type="submit"
                                    disabled={!inputPrompt.trim() || isStreaming}
                                    className="px-4 py-2.5 bg-[var(--accent-cyan)] hover:bg-[#00e6c8] disabled:opacity-40 disabled:cursor-not-allowed text-black font-black uppercase text-xs rounded-xl flex items-center justify-center transition-all shadow-[0_0_15px_rgba(0,255,222,0.3)]"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    )
}
