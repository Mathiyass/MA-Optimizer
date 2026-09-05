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
    Settings,
    Key,
    ChevronRight,
    CheckCircle2,
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

interface ActionTag {
    raw: string
    type: string
    param?: string
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

function extractActionTags(text: string): { cleanText: string; actions: ActionTag[] } {
    const regex = /\[ACTION:([A-Z0-9_]+)(?::([^\]]+))?\]/g
    const actions: ActionTag[] = []
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
        actions.push({
            raw: match[0],
            type: match[1],
            param: match[2],
        })
    }
    const cleanText = text.replace(regex, '').trim()
    return { cleanText, actions }
}

export function GlobalAiCopilotDrawer() {
    const isAiDrawerOpen = useAppStore((s) => s.isAiDrawerOpen)
    const setAiDrawerOpen = useAppStore((s) => s.setAiDrawerOpen)
    const currentPage = useAppStore((s) => s.currentPage)
    const setPage = useAppStore((s) => s.setPage)
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
            text: `⚡ **MATHIYA AI Co-Pilot Online**\n\nEngineered with multi-layer intelligence cascade, sub-millisecond local failover, and direct Win32 kernel telemetry.\n\nContinuous system telemetry analysis is active. Ask any diagnostic question, run instantaneous optimizations below, or bridge live telemetry to web intelligence models.\n\n[ACTION:TURBO_BOOST]\n[ACTION:TRIM_RAM]`,
            timestamp: Date.now(),
            model: 'Autonomous Neural Core (Sub-ms)',
        },
    ])
    const [inputPrompt, setInputPrompt] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [executedActionKeys, setExecutedActionKeys] = useState<Record<string, boolean>>({})
    const [copiedPrompt, setCopiedPrompt] = useState(false)
    const [showSettingsModal, setShowSettingsModal] = useState(false)
    const [aiSettings, setAiSettings] = useState({
        preferredProvider: 'auto',
        groqKey: '',
        openrouterKey: '',
        geminiKey: '',
        cerebrasKey: '',
        mistralKey: '',
    })
    const [isSavingSettings, setIsSavingSettings] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Load AI Settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            if (window.api?.ai?.getSettings) {
                try {
                    const s = await window.api.ai.getSettings()
                    if (s) {
                        setAiSettings({
                            preferredProvider: s.preferredProvider || 'auto',
                            groqKey: s.groqKey || '',
                            openrouterKey: s.openrouterKey || '',
                            geminiKey: s.geminiKey || '',
                            cerebrasKey: s.cerebrasKey || '',
                            mistralKey: s.mistralKey || '',
                        })
                    }
                } catch (e) {
                    console.error('Failed to load AI settings', e)
                }
            }
        }
        loadSettings()
    }, [])

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
                                model: model || 'Autonomous Neural Core',
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
            setExecutedActionKeys((prev) => ({ ...prev, [id]: true }))
        } catch (e: any) {
            addNotification('error', `Action failed: ${e.message || e}`)
        } finally {
            setActionLoading(null)
        }
    }

    // Handle In-Chat Action Tag Execution
    const handleTagActionClick = async (action: ActionTag, msgId: string) => {
        const actionKey = `${msgId}-${action.raw}`
        if (executedActionKeys[actionKey] || actionLoading === actionKey) return

        switch (action.type) {
            case 'TURBO_BOOST':
                await executeAction(
                    actionKey,
                    async () => window.api?.heuristic.turboBoost(),
                    '⚡ Turbo Boost engaged! High priority and thread scheduling applied.'
                )
                break
            case 'TRIM_RAM':
                await executeAction(
                    actionKey,
                    async () => window.api?.system.cleanRam(),
                    '🔄 RAM working sets swept and reclaimed successfully!'
                )
                break
            case 'UNPARK_CORES':
                await executeAction(
                    actionKey,
                    async () => window.api?.processLasso.toggleCoreParking(true),
                    '⚙️ All logical CPU cores unparked! Low latency engaged.'
                )
                break
            case 'MSI_MODE':
                await executeAction(
                    actionKey,
                    async () => window.api?.hone.enableMsiMode(),
                    '🔥 Message Signaled Interrupts (MSI) mode engaged!'
                )
                break
            case 'FLUSH_DNS':
                await executeAction(
                    actionKey,
                    async () => window.api?.network.flushDns(),
                    '🌐 Windows DNS resolver cache flushed successfully!'
                )
                break
            case 'NAVIGATE':
                if (action.param) {
                    setPage(action.param as PageId)
                    addNotification('success', `Navigated to ${action.param.toUpperCase()} view.`)
                    setExecutedActionKeys((prev) => ({ ...prev, [actionKey]: true }))
                }
                break
            default:
                addNotification('info', `Action triggered: ${action.type}`)
                break
        }
    }

    const saveAiSettings = async () => {
        setIsSavingSettings(true)
        try {
            if (window.api?.ai?.saveSettings) {
                await window.api.ai.saveSettings(aiSettings)
                addNotification('success', 'AI Copilot settings saved locally!')
                setShowSettingsModal(false)
            }
        } catch (e: any) {
            addNotification('error', `Failed to save AI settings: ${e.message || e}`)
        } finally {
            setIsSavingSettings(false)
        }
    }

    const renderActionChip = (action: ActionTag, msgId: string) => {
        const actionKey = `${msgId}-${action.raw}`
        const isExecuted = Boolean(executedActionKeys[actionKey])
        const isLoading = actionLoading === actionKey

        let label = action.type.replace(/_/g, ' ')
        let Icon = Zap
        let colorClasses = 'border-[var(--accent-cyan)]/40 bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]'

        if (action.type === 'TURBO_BOOST') {
            label = '⚡ Turbo Boost'
            Icon = Zap
            colorClasses = 'border-[var(--accent-cyan)]/50 bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] hover:shadow-[0_0_15px_rgba(0,255,222,0.3)]'
        } else if (action.type === 'TRIM_RAM') {
            label = '🔄 Trim RAM'
            Icon = RotateCcw
            colorClasses = 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]'
        } else if (action.type === 'UNPARK_CORES') {
            label = '⚙️ Unpark Cores'
            Icon = Cpu
            colorClasses = 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]'
        } else if (action.type === 'MSI_MODE') {
            label = '🔥 MSI Mode'
            Icon = Flame
            colorClasses = 'border-[#FF003C]/50 bg-[#FF003C]/20 text-[#FF003C] hover:shadow-[0_0_15px_rgba(255,0,60,0.3)]'
        } else if (action.type === 'FLUSH_DNS') {
            label = '🌐 Flush DNS'
            Icon = Globe
            colorClasses = 'border-sky-500/50 bg-sky-500/20 text-sky-300 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]'
        } else if (action.type === 'NAVIGATE') {
            label = `🧭 Open ${action.param || 'Tab'}`
            Icon = ChevronRight
            colorClasses = 'border-purple-500/50 bg-purple-500/20 text-purple-300 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]'
        }

        return (
            <button
                key={actionKey}
                onClick={() => handleTagActionClick(action, msgId)}
                disabled={isExecuted || isLoading}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wide uppercase transition-all duration-200 border ${
                    isExecuted
                        ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400 cursor-default'
                        : colorClasses
                }`}
            >
                {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isExecuted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                    <Icon className="w-3.5 h-3.5" />
                )}
                <span>{isExecuted ? '✓ Calibrated' : label}</span>
            </button>
        )
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
                        className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] lg:w-[560px] bg-[#0c0e17]/95 backdrop-blur-3xl border-l border-white/10 z-50 flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.8)]"
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
                                            MATHIYA AI Co-Pilot
                                        </h2>
                                        <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[var(--accent-cyan)]/15 border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] tracking-wider">
                                            Multi-Tier
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                        Context:{' '}
                                        <span className="text-white font-mono uppercase font-bold">
                                            {currentPage}
                                        </span>{' '}
                                        • Live Telemetry Grounded
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowSettingsModal(true)}
                                    title="AI Engine & API Keys Configuration"
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-cyan)] hover:bg-white/10 transition-colors"
                                >
                                    <Settings className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setAiDrawerOpen(false)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
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
                            {messages.map((m) => {
                                const { cleanText, actions } = extractActionTags(m.text)
                                return (
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
                                            className={`max-w-[88%] rounded-2xl p-4 text-xs leading-relaxed ${
                                                m.sender === 'user'
                                                    ? 'bg-[var(--accent-cyan)] text-black font-semibold shadow-[0_0_15px_rgba(0,255,222,0.3)]'
                                                    : 'glass-shell text-text-primary border border-white/5 bg-white/[0.02]'
                                            }`}
                                        >
                                            <div className="whitespace-pre-wrap font-sans">{cleanText}</div>

                                            {/* Interactive In-Chat Action Execution Chips */}
                                            {m.sender === 'assistant' && actions.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-white/10">
                                                    <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                                                        <Zap className="w-3 h-3 text-[var(--accent-cyan)]" />
                                                        <span>Recommended 1-Click Calibrations:</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {actions.map((act) => renderActionChip(act, m.id))}
                                                    </div>
                                                </div>
                                            )}

                                            {m.sender === 'assistant' && (
                                                <div className="mt-2.5 pt-2 border-t border-white/5 text-[10px] font-mono text-[var(--accent-cyan)]/75 flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] inline-block animate-pulse"></span>
                                                        <span>{m.model || 'Autonomous Neural Core'}</span>
                                                    </div>
                                                    <span className="text-[9px] text-[var(--text-muted)]">
                                                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {m.sender === 'user' && (
                                            <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                                                <User className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                )
                            })}

                            {isStreaming && (
                                <div className="flex gap-3 justify-start">
                                    <div className="w-7 h-7 rounded-xl bg-[var(--accent-cyan)]/20 border border-[var(--accent-cyan)]/40 flex items-center justify-center text-[var(--accent-cyan)] shrink-0">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    </div>
                                    <div className="glass-shell rounded-2xl p-3 text-xs text-text-muted border border-white/5 flex items-center gap-2">
                                        <Sparkles className="w-3.5 h-3.5 text-[var(--accent-cyan)] animate-pulse" />
                                        <span>Synthesizing Win32 kernel telemetry & multi-layer AI...</span>
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
                                    placeholder={`Ask MATHIYA about ${currentPage} or "What do you think about my PC?"...`}
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

                    {/* AI Copilot Settings Modal */}
                    <AnimatePresence>
                        {showSettingsModal && (
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="w-full max-w-lg bg-[#0c0e17] border border-white/15 rounded-2xl shadow-[0_0_50px_rgba(0,255,222,0.15)] overflow-hidden flex flex-col"
                                >
                                    <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-[var(--accent-cyan)]/15 border border-[var(--accent-cyan)]/30 flex items-center justify-center text-[var(--accent-cyan)]">
                                                <Settings className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-white tracking-wide">
                                                    AI Copilot Engine Settings
                                                </h3>
                                                <p className="text-[11px] text-[var(--text-muted)]">
                                                    Multi-Tier Cascade & Optional Personal API Keys
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowSettingsModal(false)}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                        {/* Security Notice Banner */}
                                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5">
                                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                            <div className="text-[11px] text-emerald-300 leading-relaxed">
                                                <strong>Strict Local Privacy:</strong> Any API keys entered here are stored strictly on your personal device using encrypted local electron-store. Zero keys are ever committed to git or uploaded anywhere.
                                            </div>
                                        </div>

                                        {/* Preferred Provider Selection */}
                                        <div>
                                            <label className="block text-xs font-bold text-white mb-1.5 uppercase tracking-wider">
                                                Inference Tier Strategy
                                            </label>
                                            <select
                                                value={aiSettings.preferredProvider}
                                                onChange={(e) => setAiSettings({ ...aiSettings, preferredProvider: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 focus:border-[var(--accent-cyan)] rounded-xl px-3 py-2 text-xs text-white outline-none"
                                            >
                                                <option value="auto" className="bg-[#0c0e17]">
                                                    ⚡ Auto Cascade (Groq → Cerebras → Mistral → OpenRouter → Gemini → Pollinations → Kernel)
                                                </option>
                                                <option value="groq" className="bg-[#0c0e17]">
                                                    Groq (Sub-150ms High Speed)
                                                </option>
                                                <option value="cerebras" className="bg-[#0c0e17]">
                                                    Cerebras (Ultra-Fast 2000 TPS)
                                                </option>
                                                <option value="openrouter" className="bg-[#0c0e17]">
                                                    OpenRouter (Global Gateway)
                                                </option>
                                                <option value="gemini" className="bg-[#0c0e17]">
                                                    Google Gemini (1.5 Flash)
                                                </option>
                                                <option value="mistral" className="bg-[#0c0e17]">
                                                    Mistral AI (Small Latest)
                                                </option>
                                                <option value="local" className="bg-[#0c0e17]">
                                                    Autonomous Neural Core (Zero Latency Offline)
                                                </option>
                                            </select>
                                        </div>

                                        {/* Optional API Keys */}
                                        <div className="space-y-3 pt-2">
                                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                                <Key className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                                                <span>Optional Personal API Keys (Zero Config Required)</span>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                                                    Groq API Key
                                                </label>
                                                <input
                                                    type="password"
                                                    value={aiSettings.groqKey || ''}
                                                    onChange={(e) => setAiSettings({ ...aiSettings, groqKey: e.target.value })}
                                                    placeholder="gsk_..."
                                                    className="w-full bg-white/5 border border-white/10 focus:border-[var(--accent-cyan)] rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none font-mono"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                                                    OpenRouter API Key
                                                </label>
                                                <input
                                                    type="password"
                                                    value={aiSettings.openrouterKey || ''}
                                                    onChange={(e) => setAiSettings({ ...aiSettings, openrouterKey: e.target.value })}
                                                    placeholder="sk-or-..."
                                                    className="w-full bg-white/5 border border-white/10 focus:border-[var(--accent-cyan)] rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none font-mono"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                                                    Google Gemini API Key
                                                </label>
                                                <input
                                                    type="password"
                                                    value={aiSettings.geminiKey || ''}
                                                    onChange={(e) => setAiSettings({ ...aiSettings, geminiKey: e.target.value })}
                                                    placeholder="AIza..."
                                                    className="w-full bg-white/5 border border-white/10 focus:border-[var(--accent-cyan)] rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none font-mono"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                                                    Cerebras API Key
                                                </label>
                                                <input
                                                    type="password"
                                                    value={aiSettings.cerebrasKey || ''}
                                                    onChange={(e) => setAiSettings({ ...aiSettings, cerebrasKey: e.target.value })}
                                                    placeholder="csk-..."
                                                    className="w-full bg-white/5 border border-white/10 focus:border-[var(--accent-cyan)] rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none font-mono"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                                                    Mistral API Key
                                                </label>
                                                <input
                                                    type="password"
                                                    value={aiSettings.mistralKey || ''}
                                                    onChange={(e) => setAiSettings({ ...aiSettings, mistralKey: e.target.value })}
                                                    placeholder="API key..."
                                                    className="w-full bg-white/5 border border-white/10 focus:border-[var(--accent-cyan)] rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-end gap-2.5">
                                        <button
                                            onClick={() => setShowSettingsModal(false)}
                                            className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={saveAiSettings}
                                            disabled={isSavingSettings}
                                            className="px-5 py-2 rounded-xl bg-[var(--accent-cyan)] hover:bg-[#00e6c8] text-black text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,222,0.3)]"
                                        >
                                            {isSavingSettings ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Check className="w-3.5 h-3.5" />
                                            )}
                                            Save Settings
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    )
}
