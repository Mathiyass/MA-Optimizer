import React from 'react'

interface SectionHeaderProps {
    title: string
    subtitle?: string
    accent?: string
}

export function SectionHeader({ title, subtitle, accent = 'accent-cyan' }: SectionHeaderProps) {
    return (
        <div className="mb-4">
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                {title}
                <div className={`h-0.5 flex-1 bg-gradient-to-r from-${accent}/40 to-transparent rounded-full`} />
            </h2>
            {subtitle && <p className="text-text-muted text-sm mt-1">{subtitle}</p>}
        </div>
    )
}
