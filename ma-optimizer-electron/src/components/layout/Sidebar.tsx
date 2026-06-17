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
        <aside className="w-64 h-full flex flex-col magnetic-dock relative z-20 shrink-0">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[var(--accent-cyan)]/5 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-[var(--accent-violet)]/5 to-transparent pointer-events-none" />
            
            {/* Logo */}
            <div className="flex items-center gap-4 px-6 py-8 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[rgba(0,255,222,0.1)] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <motion.div 
                    className="w-14 h-14 rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(0,255,222,0.3)] group-hover:shadow-[0_0_35px_rgba(0,255,222,0.5)] transition-shadow duration-500 border border-white/10 shrink-0 flex items-center justify-center bg-black relative z-10"
                    whileHover={{ scale: 1.05, rotate: 2 }}
                >
                    <video
                        src={logoVideo}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-[120%] h-[120%] object-cover absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    />
                </motion.div>
                <div className="z-10 flex flex-col">
                    <h1 className="text-white font-black text-xl tracking-tight leading-none text-gradient-ultra pb-1 drop-shadow-[0_0_8px_rgba(0,255,222,0.3)]">MA-Optimizer</h1>
                    <span className="text-[var(--accent-cyan)] text-[9px] tracking-[0.3em] uppercase font-black bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/20 px-2 py-0.5 rounded-2xl shadow-[0_0_10px_rgba(0,255,222,0.1)] self-start mt-1">PRO EDITION</span>
                </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-card-border">
                {navItems.map((item) => {
                    const active = currentPage === item.id
                    const isViolet = item.accent === 'violet'
                    const Icon = item.icon

                    return (
                        <button
                            key={item.id}
                            onClick={() => setPage(item.id)}
                            className={`w-full flex items-center gap-3 px-6 py-3.5 transition-all duration-300 group relative
                                ${active 
                                    ? 'text-[#00FFDE] bg-[rgba(0,255,222,0.05)]' 
                                    : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
                        >
                            {active && (
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#00FFDE] shadow-[0_0_10px_#00FFDE]" />
                            )}
                            <Icon className="w-5 h-5 shrink-0 z-10 transition-all duration-300" />
                            <span className="text-[13px] font-bold uppercase tracking-widest truncate z-10">{item.label}</span>

                            {item.badge && (
                                <span className={`ml-auto text-[9px] font-black px-2 py-0.5 rounded-2xl border shadow-lg ${isViolet
                                    ? 'bg-[#FF003C]/20 text-[#FF003C] border-[#FF003C]/40 shadow-[0_0_10px_rgba(255,0,60,0.3)]'
                                    : 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] border-[var(--accent-cyan)]/40 shadow-[0_0_10px_rgba(0,255,222,0.3)]'
                                    }`}>
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="px-6 py-6 border-t border-white/5 bg-black/20 backdrop-blur-md relative z-10">
                <a
                    href="https://maportfolio.mathishaangirasass.workers.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center text-[var(--text-dim)] hover:text-[var(--accent-cyan)] transition-colors cursor-pointer group"
                >
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] mb-1">Architected By</span>
                    <span className="text-xs font-black tracking-widest text-white group-hover:text-[var(--accent-cyan)] transition-colors drop-shadow-[0_0_8px_rgba(0,255,222,0)] group-hover:drop-shadow-[0_0_8px_rgba(0,255,222,0.5)]">Mathisha Angirasa</span>
                </a>
            </div>
        </aside>
    )
}
