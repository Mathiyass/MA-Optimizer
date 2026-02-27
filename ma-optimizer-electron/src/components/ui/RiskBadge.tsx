import React from 'react'

interface RiskBadgeProps {
    risk: 'safe' | 'moderate' | 'aggressive'
}

export function RiskBadge({ risk }: RiskBadgeProps) {
    const config = {
        safe: { emoji: '🟢', label: 'Safe', className: 'bg-success/15 text-success' },
        moderate: { emoji: '🟡', label: 'Moderate', className: 'bg-warning/15 text-warning' },
        aggressive: { emoji: '🔴', label: 'Aggressive', className: 'bg-danger/15 text-danger' },
    }

    const { emoji, label, className } = config[risk]

    return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${className}`}>
            {emoji} {label}
        </span>
    )
}
