import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { TweakCard } from '../components/ui/TweakCard'
import { TabGroup } from '../components/ui/TabGroup'
import { useTweak } from '../hooks/useTweak'
import { getTweaksByCategoryAndTab, getSafeTweaks } from '../data/tweaks'
import { useAppStore } from '../store/appStore'

const tabs = [
    { id: 'telemetry', label: 'Telemetry' },
    { id: 'cortana', label: 'Cortana & Search' },
    { id: 'advertising', label: 'Advertising' },
    { id: 'update', label: 'Windows Update' },
    { id: 'defender', label: 'Defender' },
    { id: 'edge', label: 'Edge' },
    { id: 'misc', label: 'Misc' },
]

function TweakRow({ tweakId }: { tweakId: string }) {
    const { enabled, loading, toggle, tweak } = useTweak(tweakId)
    if (!tweak) return null
    return <TweakCard id={tweakId} title={tweak.name} description={tweak.description} risk={tweak.risk} enabled={enabled} onChange={toggle} loading={loading} />
}

export function Privacy() {
    const [tab, setTab] = useState('telemetry')
    const items = getTweaksByCategoryAndTab('privacy', tab)
    const addNotification = useAppStore(s => s.addNotification)

    const [optimizing, setOptimizing] = useState(false)
    const [optProgress, setOptProgress] = useState(0)
    const [optCurrent, setOptCurrent] = useState('')

    const applyAllSafe = async () => {
        const safeTweaks = getSafeTweaks().filter(t => t.category === 'privacy')
        if (!safeTweaks.length) return
        setOptimizing(true)
        setOptProgress(0)
        let count = 0
        for (let i = 0; i < safeTweaks.length; i++) {
            const tweak = safeTweaks[i]
            setOptCurrent(tweak.name)
            try {
                await window.api?.registry.set(tweak.hive, tweak.path, tweak.key, tweak.applyValue, tweak.regType)
                count++
            } catch { }
            setOptProgress(Math.round(((i + 1) / safeTweaks.length) * 100))
            await new Promise(r => setTimeout(r, 150)) // Animation delay
        }
        setTimeout(() => {
            setOptimizing(false)
            addNotification('success', `Applied ${count} safe privacy tweaks`)
        }, 500)
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-accent-cyan" /> Privacy & Telemetry
                    </h2>
                    <p className="text-text-muted text-sm mt-1">Take control of your data. Disable tracking, telemetry, and advertising.</p>
                </div>
                <button
                    onClick={applyAllSafe}
                    className="px-4 py-2 bg-accent-cyan/10 border border-accent-cyan/30 rounded-lg text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors"
                >
                    🔒 Apply All Safe Tweaks
                </button>
            </div>

            <TabGroup tabs={tabs} active={tab} onChange={setTab} />

            <div className="grid gap-3">
                {items.map(t => <TweakRow key={t.id} tweakId={t.id} />)}
                {items.length === 0 && <div className="text-text-dim text-center py-8">No tweaks in this tab</div>}
            </div>

            {optimizing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card-bg border border-accent-cyan/30 rounded-2xl p-6 w-[400px] shadow-2xl shadow-accent-cyan/10"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
                            <h3 className="text-lg font-bold text-text-primary">Optimizing Privacy...</h3>
                        </div>
                        <p className="text-text-muted text-sm mb-4 truncate">Applying: {optCurrent}</p>
                        <div className="w-full h-2 bg-app-bg rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-accent-cyan"
                                initial={{ width: 0 }}
                                animate={{ width: `${optProgress}%` }}
                                transition={{ duration: 0.2 }}
                            />
                        </div>
                        <div className="text-right text-text-dim text-xs mt-2">{optProgress}%</div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
