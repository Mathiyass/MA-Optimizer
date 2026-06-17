import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Cpu, MemoryStick, HardDrive, Loader2, BarChart3, Play, Trophy } from 'lucide-react'
import { useAppStore } from '../store/appStore'

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const percent = Math.min((value / max) * 100, 100)
    return (
        <div className="space-y-2 relative">
            <div className="flex items-center justify-between relative z-10">
                <span className="text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest">{label}</span>
                <span className="text-white text-[13px] font-mono font-bold">{value?.toLocaleString()}</span>
            </div>
            <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden shadow-inner border border-white/5 relative z-10">
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                />
            </div>
            {/* Ambient glow behind bar */}
            <motion.div
                className="absolute bottom-0 left-0 h-4 blur-md opacity-30"
                style={{ background: color, width: `${percent}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />
        </div>
    )
}

function AnimatedScore({ value }: { value: number }) {
    const [display, setDisplay] = useState(0)
    React.useEffect(() => {
        const duration = 1200
        const start = performance.now()
        function animate(time: number) {
            const elapsed = time - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplay(Math.round(value * eased))
            if (progress < 1) requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
    }, [value])
    return <>{display.toLocaleString()}</>
}

export function Benchmark() {
    const [results, setResults] = useState<any>(null)
    const [running, setRunning] = useState<string | null>(null)
    const addNotification = useAppStore(s => s.addNotification)

    const runBench = async (type: string) => {
        setRunning(type)
        let result: any = null
        if (type === 'cpu') result = await window.api?.benchmark.runCpu()
        else if (type === 'memory') result = await window.api?.benchmark.runMemory()
        else if (type === 'disk') result = await window.api?.benchmark.runDisk('C:')
        setResults((prev: any) => ({ ...prev, [type]: result }))
        setRunning(null)
        addNotification('success', `${type.toUpperCase()} benchmark complete`)
    }

    const runAll = async () => {
        for (const type of ['cpu', 'memory', 'disk']) {
            await runBench(type)
        }
        addNotification('success', 'All benchmarks complete!')
    }

    const totalScore = (results?.cpu?.totalScore || 0) + (results?.memory?.totalScore || 0) + (results?.disk?.totalScore || 0)

    const benchmarks = [
        { id: 'cpu', icon: Cpu, label: 'CPU Benchmark', desc: 'Prime number calculation', color: 'from-cyan-500 to-blue-500' },
        { id: 'memory', icon: MemoryStick, label: 'Memory Benchmark', desc: 'Sequential R/W + random access', color: 'from-violet-500 to-purple-500' },
        { id: 'disk', icon: HardDrive, label: 'Disk Benchmark', desc: 'Sequential + 4K random IOPS', color: 'from-orange-500 to-amber-500' },
    ]

    const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
    const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

    return (
        <motion.div className="space-y-8 max-w-[90rem] mx-auto w-full pb-10" variants={container} initial={false} animate="show">
            {/* Ultra-Premium Benchmark Hero Section */}
            <motion.div variants={item}
                className="relative overflow-hidden rounded-[2.5rem] p-12 transition-all duration-700 border bg-[rgba(15,17,26,0.7)] backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/5"
            >
                <div className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[#ff003c]/20 animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[#ffaa00]/20 animate-pulse" style={{ animationDuration: '6s' }}></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center md:text-left">
                        <motion.h2 className="text-5xl lg:text-6xl font-black mb-4 tracking-tight text-white flex items-center justify-center md:justify-start gap-4">
                            <BarChart3 className="w-12 h-12 text-[#ff003c] drop-shadow-[0_0_15px_rgba(255,0,60,0.8)]" />
                            Hardware Telemetry
                        </motion.h2>
                        <p className="text-[var(--text-muted)] text-sm uppercase tracking-[0.3em] font-black mb-8">
                            Absolute Performance Metrics
                        </p>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <p className="text-[var(--text-secondary)] max-w-xl font-medium leading-relaxed">
                                Subject your hardware to rigorous multi-threaded stress tests. Quantify CPU compute limits, memory bandwidth, and raw NVMe throughput.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center gap-4">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={runAll}
                            disabled={running !== null}
                            className="group relative px-8 py-5 rounded-2xl bg-[#ff003c]/10 border border-[#ff003c]/30 hover:border-[#ff003c]/80 hover:bg-[#ff003c]/20 transition-all duration-300 w-full overflow-hidden shadow-[0_0_30px_rgba(255,0,60,0.15)] disabled:opacity-50 disabled:cursor-not-allowed min-w-[240px]"
                        >
                            <span className="relative z-10 font-black tracking-widest uppercase text-sm flex items-center justify-center gap-3 text-[#ff003c] drop-shadow-[0_0_8px_rgba(255,0,60,0.8)]">
                                {running !== null ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                                {running !== null ? 'Benchmarking...' : 'Initiate Full Sequence'}
                            </span>
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Overall score card */}
            {totalScore > 0 && (
                <motion.div
                    variants={item}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[rgba(15,17,26,0.8)] via-[#1f0810] to-[#2a0a0f] border border-[#ff003c]/30 p-12 text-center shadow-[0_0_50px_rgba(255,0,60,0.1)] backdrop-blur-2xl"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,0,60,0.15),transparent_60%)]" />
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ff003c] to-transparent opacity-50"></div>
                    <div className="relative z-10">
                        <Trophy className="w-12 h-12 text-[#ffaa00] mx-auto mb-4 drop-shadow-[0_0_15px_rgba(255,170,0,0.8)]" />
                        <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#ff003c] via-[#ffaa00] to-[#ff003c] mb-2 tracking-tighter drop-shadow-sm font-mono">
                            <AnimatedScore value={totalScore} />
                        </div>
                        <div className="text-[var(--text-muted)] text-sm font-black tracking-[0.3em] uppercase">Global MA Score</div>
                    </div>
                </motion.div>
            )}

            {/* Benchmark cards */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {benchmarks.map(b => (
                    <motion.button
                        key={b.id}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => runBench(b.id)}
                        disabled={running !== null}
                        className={`relative overflow-hidden rounded-[2rem] border bg-[rgba(15,17,26,0.6)] backdrop-blur-xl p-8 text-left transition-all duration-300 group shadow-xl ${running === b.id ? 'border-[var(--accent-cyan)]/50 shadow-[0_0_20px_rgba(0,255,222,0.2)]' : 'border-white/5 hover:border-white/20 hover:bg-[rgba(15,17,26,0.8)]'} ${running !== null && running !== b.id ? 'opacity-40 grayscale' : ''}`}
                    >
                        <div className={`absolute -right-10 -bottom-10 w-40 h-40 blur-[50px] rounded-full pointer-events-none bg-gradient-to-br ${b.color} opacity-10 group-hover:opacity-30 transition-opacity duration-500`}></div>
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${b.color} flex items-center justify-center mb-6 shadow-lg relative z-10 border border-white/20`}>
                            {running === b.id ? <Loader2 className="w-7 h-7 text-white animate-spin" /> : <b.icon className="w-7 h-7 text-white" />}
                        </div>
                        <div className="text-white text-lg font-black tracking-wide relative z-10">{b.label}</div>
                        <div className="text-[var(--text-muted)] text-xs mt-1 font-medium relative z-10">{b.desc}</div>
                        {results?.[b.id] && (
                            <motion.div
                                className="mt-6 pt-6 border-t border-white/10 relative z-10"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="text-white text-3xl font-black font-mono tracking-tight drop-shadow-md">
                                    <AnimatedScore value={results[b.id].totalScore || 0} />
                                </div>
                                <div className="text-[var(--text-dim)] text-[10px] uppercase font-black tracking-widest mt-1">Component Score</div>
                            </motion.div>
                        )}
                    </motion.button>
                ))}
            </motion.div>

            {/* Detailed results */}
            <div className="grid grid-cols-1 gap-6">
                {results?.cpu && (
                    <motion.div variants={item} className="card-premium border border-white/5 bg-[rgba(15,17,26,0.6)] backdrop-blur-xl rounded-[2rem] p-8 space-y-6 shadow-xl">
                        <h3 className="text-white text-lg font-black tracking-wide flex items-center gap-3"><Cpu className="w-5 h-5 text-[var(--accent-cyan)] drop-shadow-[0_0_8px_rgba(0,255,222,0.5)]" /> Processor Micro-Metrics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <ScoreBar label="Single-Thread Pipeline" value={results.cpu.singleThread?.score || 0} max={5000} color="#00ff88" />
                            <ScoreBar label="Multi-Core Matrix" value={results.cpu.multiThread?.score || 0} max={50000} color="#ff003c" />
                        </div>
                        <div className="flex gap-4 pt-4 border-t border-white/5">
                            <span className="text-[var(--text-dim)] text-[11px] font-black tracking-widest uppercase bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">Time: {results.cpu.singleThread?.time}ms</span>
                            <span className="text-[var(--text-dim)] text-[11px] font-black tracking-widest uppercase bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">Threads: {results.cpu.multiThread?.cores}</span>
                        </div>
                    </motion.div>
                )}
                {results?.memory && (
                    <motion.div variants={item} className="card-premium border border-white/5 bg-[rgba(15,17,26,0.6)] backdrop-blur-xl rounded-[2rem] p-8 space-y-6 shadow-xl">
                        <h3 className="text-white text-lg font-black tracking-wide flex items-center gap-3"><MemoryStick className="w-5 h-5 text-[var(--accent-violet)] drop-shadow-[0_0_8px_rgba(204,0,255,0.5)]" /> DIMM Bandwidth Profile</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <ScoreBar label="Sequential Read (MB/s)" value={results.memory.sequentialRead?.mbps || 0} max={100000} color="#00ff88" />
                            <ScoreBar label="Sequential Write (MB/s)" value={results.memory.sequentialWrite?.mbps || 0} max={80000} color="#ff003c" />
                            <ScoreBar label="Random Latency (ns)" value={results.memory.randomAccess?.latencyNs || 0} max={200} color="#ffaa00" />
                        </div>
                    </motion.div>
                )}
                {results?.disk && (
                    <motion.div variants={item} className="card-premium border border-white/5 bg-[rgba(15,17,26,0.6)] backdrop-blur-xl rounded-[2rem] p-8 space-y-6 shadow-xl">
                        <h3 className="text-white text-lg font-black tracking-wide flex items-center gap-3"><HardDrive className="w-5 h-5 text-[#ffaa00] drop-shadow-[0_0_8px_rgba(255,170,0,0.5)]" /> NVMe / Storage Analytics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <ScoreBar label="Sequential Read (MB/s)" value={results.disk.sequentialRead?.mbps || 0} max={7000} color="#00ff88" />
                            <ScoreBar label="Sequential Write (MB/s)" value={results.disk.sequentialWrite?.mbps || 0} max={5000} color="#ff003c" />
                            <ScoreBar label="4K Random IOPS" value={results.disk.random4kRead?.iops || 0} max={500000} color="#00ff88" />
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}
