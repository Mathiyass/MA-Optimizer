import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Cpu, Zap, ShieldAlert, MemoryStick, RefreshCw, Check, Loader2, Layers, Sliders, Ban, Activity } from 'lucide-react'
import { useAppStore } from '../store/appStore'

interface ProcessItem {
    pid: number
    name: string
    cpu: number
    mem: number
    path: string
}

export function ProcessLassoPage() {
    const [config, setConfig] = useState<{
        proBalanceEnabled: boolean
        proBalanceCpuThreshold: number
        smartTrimEnabled: boolean
        smartTrimRamThreshold: number
        coreParkingDisabled: boolean
        disallowedProcesses: string[]
    }>({
        proBalanceEnabled: false,
        proBalanceCpuThreshold: 20,
        smartTrimEnabled: false,
        smartTrimRamThreshold: 80,
        coreParkingDisabled: false,
        disallowedProcesses: ['telemetry.exe', 'compattelrunner.exe']
    })

    const [processes, setProcesses] = useState<ProcessItem[]>([])
    const [loadingProcs, setLoadingProcs] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [newDisallowed, setNewDisallowed] = useState('')

    const addNotification = useAppStore(s => s.addNotification)

    const loadConfig = async () => {
        try {
            const cfg = await window.api?.processLasso.getConfig()
            if (cfg) setConfig(cfg)
        } catch {}
    }

    const refreshProcesses = async () => {
        setLoadingProcs(true)
        try {
            const list = await window.api?.system.getProcesses()
            setProcesses(list || [])
        } catch {}
        setLoadingProcs(false)
    }

    useEffect(() => {
        loadConfig()
        refreshProcesses()
        const interval = setInterval(refreshProcesses, 3000)
        return () => clearInterval(interval)
    }, [])

    const updateConfig = async (partial: Partial<typeof config>) => {
        const updated = { ...config, ...partial }
        setConfig(updated)
        try {
            await window.api?.processLasso.updateConfig(partial)
            addNotification('success', 'Process Lasso rules updated!')
        } catch {
            addNotification('error', 'Failed updating rules')
        }
    }

    const toggleCoreParking = async (disable: boolean) => {
        try {
            addNotification('info', disable ? 'Disabling CPU Core Parking...' : 'Restoring Core Parking...')
            const ok = await window.api?.processLasso.toggleCoreParking(disable)
            if (ok) {
                setConfig(prev => ({ ...prev, coreParkingDisabled: disable }))
                addNotification('success', disable ? 'All CPU cores unparked!' : 'Core Parking restored')
            } else {
                addNotification('error', 'Failed changing Core Parking')
            }
        } catch {
            addNotification('error', 'Core Parking operation failed')
        }
    }

    const runSmartTrim = async () => {
        try {
            addNotification('info', 'Running SmartTrim Working Set Memory Optimization...')
            await window.api?.processLasso.runSmartTrim()
            addNotification('success', 'SmartTrim memory release completed!')
        } catch {
            addNotification('error', 'SmartTrim execution failed')
        }
    }

    const setPriority = async (pid: number, priorityVal: number) => {
        try {
            const ok = await window.api?.system.setProcessPriority(pid, priorityVal)
            if (ok) {
                addNotification('success', `Set PID ${pid} CPU Priority`)
                refreshProcesses()
            } else {
                addNotification('error', `Failed setting priority for PID ${pid}`)
            }
        } catch {
            addNotification('error', 'Error setting priority')
        }
    }

    const setIoPriority = async (pid: number, level: string) => {
        try {
            const ok = await window.api?.processLasso.setIoPriority(pid, level)
            if (ok) {
                addNotification('success', `Set PID ${pid} I/O Priority to ${level}`)
            } else {
                addNotification('error', `Failed setting I/O priority for PID ${pid}`)
            }
        } catch {
            addNotification('error', 'Error setting I/O priority')
        }
    }

    const addDisallowed = () => {
        if (!newDisallowed.trim()) return
        const updated = Array.from(new Set([...config.disallowedProcesses, newDisallowed.trim()]))
        updateConfig({ disallowedProcesses: updated })
        setNewDisallowed('')
    }

    const removeDisallowed = (name: string) => {
        const updated = config.disallowedProcesses.filter(n => n !== name)
        updateConfig({ disallowedProcesses: updated })
    }

    const filteredProcesses = processes.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))

    return (
        <div className="space-y-8 max-w-[90rem] mx-auto w-full pb-10">
            {/* Process Lasso Hero Header */}
            <div className="relative overflow-hidden rounded-[2.5rem] p-12 transition-all duration-700 glass-shell shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[var(--accent-cyan)]/20 animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[#FF003C]/20 animate-pulse" style={{ animationDuration: '6s' }}></div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center lg:text-left">
                        <h2 className="text-5xl lg:text-6xl font-black mb-4 tracking-tight text-white flex items-center justify-center lg:justify-start gap-4">
                            <Zap className="w-12 h-12 text-[var(--accent-cyan)] drop-shadow-[0_0_15px_rgba(0,255,222,0.8)]" />
                            Process Lasso Engine
                        </h2>
                        <p className="text-[var(--text-muted)] text-sm uppercase tracking-[0.3em] font-black mb-6">
                            ProBalance & Dynamic Real-Time Optimization
                        </p>
                        <p className="text-[var(--text-secondary)] max-w-xl font-medium leading-relaxed">
                            Prevent system micro-stutters under CPU load via ProBalance. Fine-tune CPU Affinity, I/O Priority, CPU Core Parking, and SmartTrim memory release.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 w-full lg:w-auto min-w-[280px]">
                        <button
                            onClick={runSmartTrim}
                            className="px-6 py-4 rounded-2xl bg-[#00FFDE]/10 border-[#00FFDE]/30 text-[#00FFDE] font-black uppercase text-xs tracking-widest hover:bg-[#00FFDE]/20 transition-all flex items-center justify-center gap-3 border shadow-[0_0_20px_rgba(0,255,222,0.15)]"
                        >
                            <MemoryStick className="w-4 h-4" /> Run SmartTrim Memory Release
                        </button>
                        
                        <button
                            onClick={() => toggleCoreParking(!config.coreParkingDisabled)}
                            className={`px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3 border ${config.coreParkingDisabled ? 'bg-[#FF003C]/15 border-[#FF003C]/40 text-[#FF003C]' : 'glass-shell text-white hover:border-white/20'}`}
                        >
                            <Cpu className="w-4 h-4" />
                            {config.coreParkingDisabled ? 'Core Parking: Disabled (Unparked)' : 'Disable CPU Core Parking'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ProBalance & SmartTrim Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ProBalance Controls */}
                <div className="card-premium glass-shell p-8 rounded-[2rem] space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl glass-shell flex items-center justify-center text-[var(--accent-cyan)]">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg tracking-wide">ProBalance Dynamic CPU Priority</h3>
                                <p className="text-xs text-[var(--text-muted)]">Automatically lowers priority of background tasks under load</p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={config.proBalanceEnabled}
                            onChange={e => updateConfig({ proBalanceEnabled: e.target.checked })}
                            className="w-5 h-5 accent-[var(--accent-cyan)] cursor-pointer"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-white">
                            <span>CPU Trigger Threshold:</span>
                            <span className="text-[var(--accent-cyan)]">{config.proBalanceCpuThreshold}% CPU</span>
                        </div>
                        <input
                            type="range"
                            min={10}
                            max={50}
                            value={config.proBalanceCpuThreshold}
                            onChange={e => updateConfig({ proBalanceCpuThreshold: parseInt(e.target.value) })}
                            className="w-full accent-[var(--accent-cyan)]"
                        />
                    </div>
                </div>

                {/* Watchdog / Disallowed Processes */}
                <div className="card-premium glass-shell p-8 rounded-[2rem] space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl glass-shell flex items-center justify-center text-[#FF003C]">
                            <Ban className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg tracking-wide">Disallowed Processes Watchdog</h3>
                            <p className="text-xs text-[var(--text-muted)]">Automatically terminates specified executables</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="e.g. telemetry.exe"
                            value={newDisallowed}
                            onChange={e => setNewDisallowed(e.target.value)}
                            className="flex-1 px-4 py-2.5 glass-shell rounded-xl text-xs text-white outline-none focus:border-[var(--accent-cyan)]"
                        />
                        <button
                            onClick={addDisallowed}
                            className="px-4 py-2.5 bg-[#FF003C]/10 border-[#FF003C]/30 text-[#FF003C] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#FF003C]/20 border"
                        >
                            Block
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                        {config.disallowedProcesses.map(proc => (
                            <span key={proc} className="px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-xs text-white flex items-center gap-2">
                                {proc}
                                <button onClick={() => removeDisallowed(proc)} className="text-[#FF003C] hover:text-white font-bold">×</button>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Process Explorer & Rule Applicator */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[var(--accent-cyan)] flex items-center gap-2">
                        <Sliders className="w-4 h-4" /> Live Process Rules & Priorities ({filteredProcesses.length})
                    </h3>
                    
                    <input
                        type="text"
                        placeholder="Search processes..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full md:w-64 px-4 py-2.5 glass-shell rounded-xl text-xs text-white placeholder:text-[var(--text-muted)] outline-none"
                    />
                </div>

                <div className="glass-shell rounded-[2rem] p-4 max-h-[500px] overflow-y-auto custom-scrollbar border">
                    <div className="grid grid-cols-1 gap-2">
                        {filteredProcesses.slice(0, 50).map(p => (
                            <div key={p.pid} className="flex flex-col md:flex-row items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl gap-4 transition-all border border-white/5">
                                <div className="min-w-0 flex-1">
                                    <div className="font-bold text-white text-sm tracking-wide">{p.name} <span className="text-[11px] text-[var(--text-muted)] font-mono">PID: {p.pid}</span></div>
                                    <div className="text-[11px] text-[var(--text-muted)] mt-1 flex gap-4">
                                        <span>CPU: <strong className="text-[var(--accent-cyan)]">{p.cpu}%</strong></span>
                                        <span>RAM: <strong className="text-white">{p.mem}%</strong></span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] mb-1">CPU Priority</span>
                                        <select
                                            onChange={e => setPriority(p.pid, parseInt(e.target.value))}
                                            className="px-3 py-1.5 glass-shell rounded-xl text-xs text-white outline-none border"
                                        >
                                            <option value="32">Normal</option>
                                            <option value="128">High</option>
                                            <option value="32768">Above Normal</option>
                                            <option value="16384">Below Normal</option>
                                            <option value="64">Idle</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] mb-1">I/O Priority</span>
                                        <select
                                            onChange={e => setIoPriority(p.pid, e.target.value)}
                                            className="px-3 py-1.5 glass-shell rounded-xl text-xs text-white outline-none border"
                                        >
                                            <option value="Normal">Normal</option>
                                            <option value="High">High</option>
                                            <option value="Low">Low</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
