import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Cpu, MemoryStick, HardDrive, Loader2, BarChart3, Play, Trophy } from 'lucide-react'
import { useAppStore } from '../store/appStore'

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const percent = Math.min((value / max) * 100, 100)
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <span className="text-text-muted text-xs">{label}</span>
                <span className="text-text-primary text-xs font-bold">{value?.toLocaleString()}</span>
            </div>
            <div className="w-full h-2 bg-app-bg rounded-full overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                />
            </div>
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
        <motion.div className="space-y-6 max-w-5xl" variants={container} initial={false} animate="show">
            <motion.div variants={item} className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-accent-cyan" /> Benchmark
                    </h2>
                    <p className="text-text-muted text-sm mt-1">Test your system performance</p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={runAll}
                    disabled={running !== null}
                    className="px-5 py-2.5 bg-accent-cyan/15 text-accent-cyan rounded-xl text-sm font-medium hover:bg-accent-cyan/25 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    <Play className="w-4 h-4" /> Run All
                </motion.button>
            </motion.div>

            {/* Overall score card */}
            {totalScore > 0 && (
                <motion.div
                    variants={item}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card-bg via-[#111827] to-[#2a0a0f] border border-card-border p-8 text-center"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(0,255,222,0.08),transparent_60%)]" />
                    <div className="relative z-10">
                        <Trophy className="w-8 h-8 text-warning mx-auto mb-2" />
                        <div className="text-4xl font-bold text-gradient-mixed mb-1">
                            <AnimatedScore value={totalScore} />
                        </div>
                        <div className="text-text-dim text-sm">Overall Score</div>
                    </div>
                </motion.div>
            )}

            {/* Benchmark cards */}
            <motion.div variants={item} className="grid grid-cols-3 gap-4">
                {benchmarks.map(b => (
                    <motion.button
                        key={b.id}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => runBench(b.id)}
                        disabled={running !== null}
                        className={`relative overflow-hidden rounded-xl border border-card-border bg-card-bg p-6 text-left transition-all card-premium hover-lift ${running === b.id ? 'border-accent-cyan/30 animate-pulse-glow' : 'hover:border-white/10'} ${running !== null && running !== b.id ? 'opacity-40' : ''}`}
                    >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${b.color} flex items-center justify-center mb-4 shadow-lg`}>
                            {running === b.id ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <b.icon className="w-6 h-6 text-white" />}
                        </div>
                        <div className="text-text-primary font-semibold">{b.label}</div>
                        <div className="text-text-dim text-xs mt-0.5">{b.desc}</div>
                        {results?.[b.id] && (
                            <motion.div
                                className="mt-4 pt-4 border-t border-card-border"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="text-accent-cyan text-2xl font-bold">
                                    <AnimatedScore value={results[b.id].totalScore || 0} />
                                </div>
                                <div className="text-text-dim text-xs">Score</div>
                            </motion.div>
                        )}
                    </motion.button>
                ))}
            </motion.div>

            {/* Detailed results */}
            {results?.cpu && (
                <motion.div variants={item} className="bg-card-bg border border-card-border rounded-xl p-6 space-y-4">
                    <h3 className="text-text-primary font-semibold flex items-center gap-2"><Cpu className="w-4 h-4 text-accent-cyan" /> CPU Results</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <ScoreBar label="Single-Thread" value={results.cpu.singleThread?.score || 0} max={5000} color="#00FFDE" />
                        <ScoreBar label="Multi-Thread" value={results.cpu.multiThread?.score || 0} max={50000} color="#FF003C" />
                    </div>
                    <div className="flex gap-4 text-xs text-text-dim">
                        <span>Time: {results.cpu.singleThread?.time}ms</span>
                        <span>Threads: {results.cpu.multiThread?.cores}</span>
                    </div>
                </motion.div>
            )}
            {results?.memory && (
                <motion.div variants={item} className="bg-card-bg border border-card-border rounded-xl p-6 space-y-4">
                    <h3 className="text-text-primary font-semibold flex items-center gap-2"><MemoryStick className="w-4 h-4 text-accent-violet" /> Memory Results</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <ScoreBar label="Seq Read" value={results.memory.sequentialRead?.mbps || 0} max={100000} color="#00FFDE" />
                        <ScoreBar label="Seq Write" value={results.memory.sequentialWrite?.mbps || 0} max={80000} color="#FF003C" />
                        <ScoreBar label="Random Latency" value={results.memory.randomAccess?.latencyNs || 0} max={200} color="#ff9f43" />
                    </div>
                </motion.div>
            )}
            {results?.disk && (
                <motion.div variants={item} className="bg-card-bg border border-card-border rounded-xl p-6 space-y-4">
                    <h3 className="text-text-primary font-semibold flex items-center gap-2"><HardDrive className="w-4 h-4 text-accent-orange" /> Disk Results</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <ScoreBar label="Seq Read" value={results.disk.sequentialRead?.mbps || 0} max={7000} color="#00FFDE" />
                        <ScoreBar label="Seq Write" value={results.disk.sequentialWrite?.mbps || 0} max={5000} color="#FF003C" />
                        <ScoreBar label="4K Random IOPS" value={results.disk.random4kRead?.iops || 0} max={500000} color="#00ff88" />
                    </div>
                </motion.div>
            )}
        </motion.div>
    )
}
