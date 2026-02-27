import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gamepad2, Briefcase, Battery, Shield, Trash2, Save, X } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { tweaks, getSafeTweaks } from '../../data/tweaks'

const profiles = [
    {
        id: 'gamer', icon: Gamepad2, name: '🎮 Gamer', color: 'text-green-400',
        desc: 'All safe gaming + performance + network tweaks',
        filter: (t: typeof tweaks[0]) => t.risk === 'safe' && ['gaming', 'performance', 'network'].includes(t.category),
    },
    {
        id: 'office', icon: Briefcase, name: '💼 Office', color: 'text-blue-400',
        desc: 'Privacy + startup cleaner + visual effects',
        filter: (t: typeof tweaks[0]) => t.risk === 'safe' && ['privacy', 'performance'].includes(t.category) && ['visual', 'telemetry', 'cortana', 'advertising'].includes(t.tab),
    },
    {
        id: 'laptop', icon: Battery, name: '🔋 Laptop', color: 'text-yellow-400',
        desc: 'Balanced performance with battery optimizations',
        filter: (t: typeof tweaks[0]) => t.risk === 'safe' && t.category === 'performance' && ['power', 'visual'].includes(t.tab),
    },
    {
        id: 'privacy', icon: Shield, name: '🔒 Privacy Focus', color: 'text-purple-400',
        desc: 'All privacy + telemetry tweaks',
        filter: (t: typeof tweaks[0]) => t.risk === 'safe' && t.category === 'privacy',
    },
    {
        id: 'clean', icon: Trash2, name: '🧹 Clean Install', color: 'text-red-400',
        desc: 'Debloat + cleaner + startup optimization',
        filter: (t: typeof tweaks[0]) => t.risk === 'safe' && ['advanced', 'performance'].includes(t.category),
    },
    {
        id: 'custom', icon: Save, name: '📁 Custom', color: 'text-accent-cyan',
        desc: 'Save current toggle state as named profile',
        filter: () => false,
    },
]

export function ProfileSelector() {
    const open = useAppStore(s => s.profilesOpen)
    const setOpen = useAppStore(s => s.setProfilesOpen)
    const addNotification = useAppStore(s => s.addNotification)
    const [applying, setApplying] = useState<string | null>(null)

    const applyProfile = async (profileId: string) => {
        const profile = profiles.find(p => p.id === profileId)
        if (!profile || profileId === 'custom') return

        const matching = tweaks.filter(profile.filter)
        if (matching.length === 0) return

        setApplying(profileId)
        let applied = 0

        for (const tweak of matching) {
            try {
                await window.api?.registry.set(tweak.hive, tweak.path, tweak.key, tweak.applyValue, tweak.regType)
                applied++
            } catch { }
        }

        setApplying(null)
        addNotification('success', `Applied ${applied} tweaks from ${profile.name} profile`)
        setOpen(false)
    }

    if (!open) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center"
                onClick={() => setOpen(false)}
            >
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="w-full max-w-2xl bg-card-bg border border-card-border rounded-2xl shadow-2xl p-6"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-bold text-text-primary">⚡ Preset Profiles</h2>
                        <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {profiles.map(p => {
                            const count = tweaks.filter(p.filter).length
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => applyProfile(p.id)}
                                    disabled={applying !== null || p.id === 'custom'}
                                    className="text-left p-4 rounded-xl border border-card-border bg-app-bg hover:border-accent-cyan/30 transition-all group disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <p.icon className={`w-5 h-5 ${p.color}`} />
                                        <span className="font-semibold text-text-primary text-sm">{p.name}</span>
                                    </div>
                                    <p className="text-text-muted text-xs mb-2">{p.desc}</p>
                                    {p.id !== 'custom' && (
                                        <span className="text-text-dim text-xs">{count} tweaks</span>
                                    )}
                                    {applying === p.id && (
                                        <span className="text-accent-cyan text-xs ml-2 animate-pulse">Applying...</span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
