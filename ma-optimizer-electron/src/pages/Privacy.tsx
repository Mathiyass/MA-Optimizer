import React, { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
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

    const applyAllSafe = async () => {
        const safeTweaks = getSafeTweaks().filter(t => t.category === 'privacy')
        let count = 0
        for (const tweak of safeTweaks) {
            try {
                await window.api?.registry.set(tweak.hive, tweak.path, tweak.key, tweak.applyValue, tweak.regType)
                count++
            } catch { }
        }
        addNotification('success', `Applied ${count} safe privacy tweaks`)
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
        </div>
    )
}
