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
            ? 'border-[#ff003c]/40 bg-[#ff003c]/[0.03] shadow-[0_0_30px_rgba(255,0,60,0.1)]'
            : 'border-[var(--accent-cyan)]/40 bg-[var(--accent-cyan)]/[0.03] shadow-[0_0_30px_rgba(0,255,222,0.1)]'
        : 'border-white/5 bg-[rgba(15,17,26,0.6)] hover:border-white/20'

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            whileHover={{ scale: 1.01, translateY: -2 }}
            className={`
                relative p-5 rounded-2xl border transition-all duration-300 card-premium backdrop-blur-xl
                ${borderColor}
                ${disabled ? 'opacity-50 pointer-events-none' : ''}
            `}
        >
            <div className="flex items-start justify-between gap-5">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-white font-bold text-[15px] tracking-wide">{title}</span>
                        <RiskBadge risk={risk} />
                        {registryPath && (
                            <button
                                onMouseEnter={() => setShowInfo(true)}
                                onMouseLeave={() => setShowInfo(false)}
                                className="relative p-1 text-[var(--text-muted)] hover:text-white transition-colors bg-white/5 rounded-md hover:bg-white/10"
                            >
                                <Info className="w-4 h-4" />
                                {showInfo && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2 bg-[rgba(10,12,20,0.95)] border border-white/10 rounded-xl shadow-2xl z-50 whitespace-nowrap backdrop-blur-3xl">
                                        <div className="text-xs text-[var(--text-muted)] font-mono tracking-wider">{registryPath}</div>
                                    </div>
                                )}
                            </button>
                        )}
                    </div>
                    <p className="text-[var(--text-muted)] text-sm leading-relaxed line-clamp-2 font-medium">{description}</p>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end">
                    {loading || enabled === null ? (
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-cyan)] drop-shadow-[0_0_10px_rgba(0,255,222,0.5)]" />
                    ) : (
                        <button
                            onClick={() => onChange(!enabled)}
                            className={`
                                relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none shadow-inner
                                ${enabled
                                    ? risk === 'aggressive'
                                        ? 'bg-[#ff003c] shadow-[0_0_20px_rgba(255,0,60,0.4)]'
                                        : 'bg-gradient-to-r from-[var(--accent-cyan)] to-[#00aaff] shadow-[0_0_20px_rgba(0,255,222,0.4)]'
                                    : 'bg-black/40 border border-white/10 hover:bg-black/60'
                                }
                            `}
                        >
                            <motion.div
                                className={`absolute top-1 left-1 w-5 h-5 rounded-full shadow-lg ${enabled ? 'bg-white' : 'bg-[var(--text-muted)]'}`}
                                animate={{ x: enabled ? 28 : 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        </button>
                    )}
                    {enabled && !loading && (
                        <span className={`text-[10px] font-black uppercase mt-2 tracking-widest ${risk === 'aggressive' ? 'text-[#ff003c]' : 'text-[var(--accent-cyan)]'}`}>
                            Active
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
