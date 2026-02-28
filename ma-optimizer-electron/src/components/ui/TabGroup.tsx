import React, { useId } from 'react'
import { motion } from 'framer-motion'

interface Tab {
    id: string
    label: string
    count?: number
}

interface TabGroupProps {
    tabs: Tab[]
    active: string
    onChange: (id: string) => void
    accent?: 'cyan' | 'violet'
}

const accentStyles = {
    cyan: {
        text: 'text-accent-cyan',
        bg: 'bg-accent-cyan/10 border border-accent-cyan/20',
        badge: 'bg-accent-cyan/20 text-accent-cyan',
    },
    violet: {
        text: 'text-accent-violet',
        bg: 'bg-accent-violet/10 border border-accent-violet/20',
        badge: 'bg-accent-violet/20 text-accent-violet',
    },
}

export function TabGroup({ tabs, active, onChange, accent = 'cyan' }: TabGroupProps) {
    const instanceId = useId()
    const styles = accentStyles[accent]

    return (
        <div className="relative flex gap-1 p-1 glass-light rounded-xl backdrop-blur-md">
            {tabs.map((tab) => {
                const isActive = active === tab.id
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 z-10 ${isActive ? styles.text : 'text-text-muted hover:text-text-primary'
                            }`}
                    >
                        {isActive && (
                            <motion.div
                                layoutId={`tab-indicator-${instanceId}`}
                                className={`absolute inset-0 rounded-lg ${styles.bg}`}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? styles.badge : 'bg-card-border text-text-dim'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
