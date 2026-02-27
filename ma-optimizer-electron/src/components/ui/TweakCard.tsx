import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Info } from 'lucide-react'
import { RiskBadge } from './RiskBadge'

interface TweakCardProps {
    id: string
    title: string
    description: string
    risk: 'safe' | 'moderate' | 'aggressive'
    enabled: boolean | null
    onChange: (val: boolean) => void
    loading?: boolean
    disabled?: boolean
    registryPath?: string
}

export function TweakCard({ title, description, risk, enabled, onChange, loading, disabled, registryPath }: TweakCardProps) {
    const [showInfo, setShowInfo] = useState(false)

    const borderColor = enabled
        ? risk === 'aggressive'
            ? 'border-danger/30 shadow-[0_0_20px_rgba(255,68,68,0.08)]'
            : 'border-accent-cyan/25 shadow-[0_0_20px_rgba(0,255,222,0.06)]'
        : 'border-card-border hover:border-white/10'

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            whileHover={{ scale: 1.005 }}
            className={`
                relative p-4 rounded-xl border transition-all duration-250 card-premium
                bg-card-bg ${borderColor}
                ${disabled ? 'opacity-50 pointer-events-none' : ''}
            `}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-text-primary font-semibold text-sm leading-tight">{title}</span>
                        <RiskBadge risk={risk} />
                        {registryPath && (
                            <button
                                onMouseEnter={() => setShowInfo(true)}
                                onMouseLeave={() => setShowInfo(false)}
                                className="relative p-0.5 text-text-dim hover:text-text-muted transition-colors"
                            >
                                <Info className="w-3.5 h-3.5" />
                                {showInfo && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1c2333] border border-card-border rounded-lg shadow-xl z-50 whitespace-nowrap animate-fade-in">
                                        <div className="text-[10px] text-text-dim font-mono">{registryPath}</div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1c2333] border-r border-b border-card-border rotate-45 -mt-1" />
                                    </div>
                                )}
                            </button>
                        )}
                    </div>
                    <p className="text-text-muted text-xs leading-relaxed line-clamp-2">{description}</p>
                </div>
                <div className="flex-shrink-0 mt-0.5">
                    {loading || enabled === null ? (
                        <Loader2 className="w-5 h-5 animate-spin text-text-dim" />
                    ) : (
                        <button
                            onClick={() => onChange(!enabled)}
                            className={`
                                relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none
                                ${enabled
                                    ? risk === 'aggressive'
                                        ? 'bg-danger shadow-[0_0_10px_rgba(255,68,68,0.3)]'
                                        : 'bg-accent-cyan shadow-[0_0_10px_rgba(0,255,222,0.3)]'
                                    : 'bg-card-border hover:bg-[#30363d]'
                                }
                            `}
                        >
                            <motion.div
                                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                                animate={{ x: enabled ? 20 : 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        </button>
                    )}
                </div>
            </div>

            {/* Subtle active indicator line */}
            {enabled && (
                <motion.div
                    layoutId={`tweak-active-${title}`}
                    className={`absolute left-0 top-3 bottom-3 w-[2px] rounded-r-full ${risk === 'aggressive' ? 'bg-danger' : 'bg-accent-cyan'
                        }`}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.2 }}
                />
            )}
        </motion.div>
    )
}
