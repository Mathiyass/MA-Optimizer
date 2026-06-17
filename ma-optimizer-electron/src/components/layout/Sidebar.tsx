import React from 'react'
import { motion } from 'framer-motion'
import { useAppStore, PageId } from '../../store/appStore'
import {
    LayoutDashboard, Zap, Crown, Globe, ShieldCheck, Gamepad2,
    Trash2, Rocket, Package, Wrench, HeartPulse, SlidersHorizontal,
    BarChart3, Info, LucideIcon,
} from 'lucide-react'
import logoVideo from '../../../img/logo.mp4'

const navItems: Array<{
    id: PageId; icon: LucideIcon; label: string; accent?: string; badge?: string
}> = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'performance', icon: Zap, label: 'CPU & Memory' },
        { id: 'ma-power', icon: Crown, label: 'Power Plan', accent: 'violet', badge: '★' },
        { id: 'network', icon: Globe, label: 'Network' },
        { id: 'privacy', icon: ShieldCheck, label: 'Privacy' },
        { id: 'gaming', icon: Gamepad2, label: 'Gaming Mode' },
        { id: 'cleaner', icon: Trash2, label: 'System Cleaner' },
        { id: 'startup', icon: Rocket, label: 'Boot / Startup' },
        { id: 'apps', icon: Package, label: 'App Installer' },
        { id: 'drivers', icon: Package, label: 'Drivers' },
        { id: 'tools', icon: Wrench, label: 'System Tools' },
        { id: 'repair', icon: HeartPulse, label: 'Repair & Fix' },
        { id: 'advanced', icon: SlidersHorizontal, label: 'Advanced' },
        { id: 'benchmark', icon: BarChart3, label: 'Benchmark' },
        { id: 'about', icon: Info, label: 'About' },
    ]

export function Sidebar() {
    const currentPage = useAppStore((s) => s.currentPage)
    const setPage = useAppStore((s) => s.setPage)

    return (
        <aside className="w-[240px] h-full glass-panel flex flex-col overflow-hidden shrink-0 z-20">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5">
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(0,255,255,0.3)] border border-white/10 shrink-0 flex items-center justify-center bg-black/40 relative">
                    <video
                        src={logoVideo}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-[120%] h-[120%] object-cover absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    />
                </div>
                <div>
                    <h1 className="text-text-primary font-bold text-base tracking-tight leading-none text-gradient-cyan">MA-Optimizer</h1>
                    <span className="text-text-dim text-[10px] tracking-wider uppercase font-bold">v7.1</span>
                </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-card-border">
                {navItems.map((item) => {
                    const active = currentPage === item.id
                    const isViolet = item.accent === 'violet'
                    const Icon = item.icon

                    return (
                        <motion.button
                            key={item.id}
                            onClick={() => setPage(item.id)}
                            whileTap={{ scale: 0.98 }}
                            className={`
                relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group
                border-l-[3px]
                ${active
                                    ? 'bg-[var(--bg-elevated)] text-[var(--accent-cyan)] border-[var(--accent-cyan)] rounded-l-none'
                                    : 'text-[var(--text-secondary)] border-transparent hover:bg-white/5 hover:text-[var(--text-primary)]'
                                }
              `}
                        >
                            {/* Removed absolute layout bar as border-l suffices */}

                            <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? '' : 'opacity-60 group-hover:opacity-100'}`} />
                            <span className="text-[13px] font-medium truncate">{item.label}</span>

                            {item.badge && (
                                <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isViolet
                                    ? 'bg-accent-violet/20 text-accent-violet'
                                    : 'bg-accent-cyan/20 text-accent-cyan'
                                    }`}>
                                    {item.badge}
                                </span>
                            )}
                        </motion.button>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-card-border">
                <a
                    href="https://mathiyass.github.io/MAportfolio/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-dim text-[10px] hover:text-accent-cyan transition-colors cursor-pointer"
                >
                    © Mathisha Angirasa
                </a>
            </div>
        </aside>
    )
}
