import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2, Zap, Loader2 } from 'lucide-react'
import { TweakCard } from '../components/ui/TweakCard'
import { TabGroup } from '../components/ui/TabGroup'
import { useTweak } from '../hooks/useTweak'
import { getTweaksByCategoryAndTab, tweaks } from '../data/tweaks'
import { useAppStore } from '../store/appStore'
import { useLogStore } from '../store/logStore'

const tabs = [
    { id: 'general', label: 'General' },
    { id: 'input', label: 'Input' },
    { id: 'gpu', label: 'GPU' },
]

function TweakRow({ tweakId }: { tweakId: string }) {
    const { enabled, loading, toggle, tweak } = useTweak(tweakId)
    if (!tweak) return null
    return <TweakCard id={tweakId} title={tweak.name} description={tweak.description} risk={tweak.risk} enabled={enabled} onChange={toggle} loading={loading} />
}

export function Gaming() {
    const [tab, setTab] = useState('general')
    const [gameBoostOn, setGameBoostOn] = useState(false)
    const [applying, setApplying] = useState(false)
    const [gpuInfo, setGpuInfo] = useState<{ vendor: string; model: string; vram: number } | null>(null)
    const items = getTweaksByCategoryAndTab('gaming', tab)
    const addNotification = useAppStore(s => s.addNotification)
    const addLog = useLogStore(s => s.addLine)

    useEffect(() => {
        window.api?.system.getFullInfo().then((info: any) => {
            if (info?.graphics?.controllers?.[0]) {
                const gpu = info.graphics.controllers[0]
                setGpuInfo({ vendor: gpu.vendor || '', model: gpu.model || 'Unknown GPU', vram: gpu.vram || 0 })
            }
        }).catch(() => { })
    }, [])

    const isNvidia = gpuInfo?.vendor?.toLowerCase().includes('nvidia')
    const isAmd = gpuInfo?.vendor?.toLowerCase().includes('amd') || gpuInfo?.vendor?.toLowerCase().includes('advanced micro')

    const toggleGameBoost = async () => {
        setApplying(true)
        const gamingTweaks = tweaks.filter(t => t.category === 'gaming' && t.risk === 'safe')
        let count = 0
        const newState = !gameBoostOn

        for (const tweak of gamingTweaks) {
            try {
                const value = newState ? tweak.applyValue : tweak.revertValue
                await window.api?.registry.set(tweak.hive, tweak.path, tweak.key, value, tweak.regType)
                count++
            } catch { }
        }

        if (newState) {
            try { await window.api?.powerPlan.setTimerResolution(5000) } catch { }
        }

        setGameBoostOn(newState)
        setApplying(false)
        addNotification('success', `Game Boost ${newState ? 'activated' : 'deactivated'} — ${count} tweaks applied`)
        addLog(`[GAME BOOST] ${newState ? 'ON' : 'OFF'} — ${count} tweaks`)
    }

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Game Boost Hero */}
            <motion.div
                className={`relative p-6 rounded-2xl border transition-all duration-500 overflow-hidden ${gameBoostOn
                        ? 'bg-gradient-to-br from-green-900/30 to-green-950/10 border-success/30 shadow-[0_0_30px_rgba(0,255,136,0.1)]'
                        : 'bg-card-bg border-card-border'
                    }`}
            >
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                            <Gamepad2 className="w-7 h-7 text-success" />
                            🎮 GAME BOOST
                        </h2>
                        <p className="text-text-muted text-sm mt-1">One-click gaming optimization: Game Mode, HAGS, Nagle off, timer 0.5ms, Xbox overlay off</p>
                        <div className="mt-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${gameBoostOn ? 'bg-success/15 text-success' : 'bg-card-border text-text-dim'
                                }`}>
                                {gameBoostOn ? '● ACTIVE' : '○ INACTIVE'}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={toggleGameBoost}
                        disabled={applying}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${gameBoostOn
                                ? 'bg-card-border text-text-muted hover:bg-card-border/80'
                                : 'bg-success text-black hover:bg-success/90 shadow-[0_0_20px_rgba(0,255,136,0.3)]'
                            }`}
                    >
                        {applying ? <Loader2 className="w-5 h-5 animate-spin" /> : gameBoostOn ? 'DEACTIVATE' : 'ACTIVATE GAME BOOST'}
                    </button>
                </div>
            </motion.div>

            {/* GPU Detection */}
            {gpuInfo && (
                <div className="p-4 bg-card-bg border border-card-border rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${isNvidia ? 'bg-green-500' : isAmd ? 'bg-red-500' : 'bg-blue-500'}`} />
                        <span className="text-text-primary font-medium text-sm">{gpuInfo.model}</span>
                        {gpuInfo.vram > 0 && <span className="text-text-muted text-xs">{gpuInfo.vram} MB VRAM</span>}
                        {isNvidia && <span className="text-green-400 text-xs px-2 py-0.5 bg-green-400/10 rounded-full">NVIDIA Detected</span>}
                        {isAmd && <span className="text-red-400 text-xs px-2 py-0.5 bg-red-400/10 rounded-full">AMD Detected</span>}
                    </div>
                </div>
            )}

            <TabGroup tabs={tabs} active={tab} onChange={setTab} />

            <div className="grid gap-3">
                {items.map(t => <TweakRow key={t.id} tweakId={t.id} />)}
                {items.length === 0 && <div className="text-text-dim text-center py-8">No tweaks in this tab</div>}
            </div>
        </div>
    )
}
