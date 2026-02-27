import React from 'react'

interface RingGaugeProps {
    value: number
    label: string
    sublabel?: string
    size?: number
}

export function RingGauge({ value, label, sublabel, size = 100 }: RingGaugeProps) {
    const strokeWidth = 6
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (Math.min(value, 100) / 100) * circumference
    const center = size / 2

    // Color based on value thresholds
    const getColor = () => {
        if (value < 50) return { stroke: '#00ff88', glow: 'rgba(0, 255, 136, 0.3)', text: 'text-success' }
        if (value < 75) return { stroke: '#00FFDE', glow: 'rgba(0, 255, 222, 0.3)', text: 'text-accent-cyan' }
        if (value < 90) return { stroke: '#ffd700', glow: 'rgba(255, 215, 0, 0.3)', text: 'text-warning' }
        return { stroke: '#ff4444', glow: 'rgba(255, 68, 68, 0.3)', text: 'text-danger' }
    }

    const color = getColor()
    const gradientId = `ring-gradient-${label.replace(/\s/g, '')}`

    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={color.stroke} stopOpacity="1" />
                            <stop offset="100%" stopColor={color.stroke} stopOpacity="0.5" />
                        </linearGradient>
                        <filter id={`glow-${label.replace(/\s/g, '')}`}>
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    {/* Track */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke="#21262d"
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    {/* Value arc */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke={`url(#${gradientId})`}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        filter={`url(#glow-${label.replace(/\s/g, '')})`}
                        style={{
                            transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.3s ease',
                        }}
                    />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-lg font-bold ${color.text}`}>
                        {Math.round(value)}%
                    </span>
                </div>
            </div>
            <div className="text-center">
                <div className="text-text-primary text-xs font-semibold">{label}</div>
                {sublabel && <div className="text-text-dim text-[10px] mt-0.5">{sublabel}</div>}
            </div>
        </div>
    )
}
