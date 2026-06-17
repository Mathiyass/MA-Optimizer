import React from 'react'
import { motion } from 'framer-motion'
import { Crown, Github, Globe, Heart, Shield, Code, Zap, Star, ExternalLink } from 'lucide-react'
import meImg from '../../img/me.jpg'
import logoVideo from '../../img/logo.mp4'

export function About() {
    const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
    const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

    return (
        <motion.div
            className="space-y-8 max-w-[90rem] mx-auto w-full pb-10"
            variants={container}
            initial={false}
            animate="show"
        >
            {/* Ultra-Premium Hero Section */}
            <motion.div variants={item} className="relative overflow-hidden rounded-[2.5rem] p-12 transition-all duration-700 border bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center">
                <div className="absolute -top-32 -right-32 w-80 h-80 blur-[120px] rounded-full pointer-events-none bg-[var(--accent-cyan)]/20 animate-pulse" style={{ animationDuration: '5s' }}></div>
                <div className="absolute -bottom-32 -left-32 w-80 h-80 blur-[120px] rounded-full pointer-events-none bg-[#00FFDE]/20 animate-pulse" style={{ animationDuration: '7s' }}></div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <motion.div
                        className="w-28 h-28 mx-auto mb-6 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,255,222,0.3)] bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 border-[var(--accent-cyan)]/30 relative border"
                        animate={{
                            boxShadow: [
                                '0 0 20px rgba(0,255,222,0.2), 0 25px 50px rgba(0,0,0,0.3)',
                                '0 0 50px rgba(0,255,222,0.5), 0 25px 50px rgba(0,0,0,0.3)',
                                '0 0 20px rgba(0,255,222,0.2), 0 25px 50px rgba(0,0,0,0.3)',
                            ],
                            borderColor: [
                                'rgba(0, 255, 222, 0.3)',
                                'rgba(0, 255, 222, 0.8)',
                                'rgba(0, 255, 222, 0.3)',
                            ]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
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
                    <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[var(--accent-cyan)] to-[#00FFDE] mb-2 tracking-tighter drop-shadow-lg">MA-Optimizer</h1>
                    <div className="flex items-center gap-4 mb-6">
                        <span className="px-3 py-1 bg-[var(--accent-cyan)]/10 border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] rounded-2xl text-xs font-black uppercase tracking-widest border">Version 7.1.0</span>
                        <span className="px-3 py-1 bg-[#00FFDE]/10 border-[#00FFDE]/30 text-[#00FFDE] rounded-2xl text-xs font-black uppercase tracking-widest border">Stable</span>
                    </div>
                    <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed font-medium">
                        The definitive Windows optimization suite. Unprecedented control, absolute performance telemetry, and deep OS configuration.
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Credits */}
                <motion.div variants={item} className="card-premium border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl rounded-[2rem] p-8 shadow-xl flex flex-col justify-between h-full hover:border-white/20 transition-all duration-300 border">
                    <div>
                        <h3 className="text-white text-xl font-black tracking-wide flex items-center gap-3 mb-6"><Heart className="w-5 h-5 text-[#ff003c] drop-shadow-[0_0_8px_rgba(255,0,60,0.8)]" /> Architecture & Design</h3>
                        <div className="flex items-center gap-5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 p-5 rounded-2xl border">
                            <motion.img
                                src={meImg}
                                alt="Mathisha Angirasa"
                                className="w-20 h-20 rounded-2xl object-cover shadow-[0_0_15px_rgba(0,255,222,0.3)] border-[var(--accent-violet)]/50 border"
                                whileHover={{ scale: 1.05, rotate: 2 }}
                            />
                            <div>
                                <div className="text-white font-black text-xl tracking-tight">Mathisha Angirasa</div>
                                <div className="text-[#FF003C] text-[11px] uppercase tracking-widest font-black mt-1">Lead Systems Engineer</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                        <a href="https://github.com/Mathiyass/MA-Optimizer" target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest text-white hover:bg-[rgba(255,255,255,0.05)] hover:border-white/30 transition-all group shadow-inner border">
                            <Github className="w-4 h-4" /> Repository
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4" />
                        </a>
                        <a href="https://mathiyass.github.io/MAportfolio/" target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[var(--accent-cyan)]/10 border-[var(--accent-cyan)]/30 rounded-2xl text-xs font-black uppercase tracking-widest text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/20 hover:border-[var(--accent-cyan)]/60 transition-all group shadow-[0_0_15px_rgba(0,255,222,0.1)] border">
                            <Globe className="w-4 h-4" /> Portfolio
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4" />
                        </a>
                    </div>
                </motion.div>

                {/* Tech Stack */}
                <motion.div variants={item} className="card-premium border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl rounded-[2rem] p-8 shadow-xl hover:border-white/20 transition-all duration-300 border">
                    <h3 className="text-white text-xl font-black tracking-wide flex items-center gap-3 mb-6"><Code className="w-5 h-5 text-[var(--accent-cyan)] drop-shadow-[0_0_8px_rgba(0,255,222,0.8)]" /> Core Technologies</h3>
                    <div className="flex flex-wrap gap-3">
                        {['Electron 30', 'React 18', 'TypeScript 5', 'Vite 5', 'Tailwind CSS 3', 'Zustand', 'Framer Motion', 'Recharts', 'Winston Logger', 'electron-builder', 'Lucide Icons'].map(t => (
                            <span key={t} className="px-4 py-2 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl border-white/5 rounded-2xl text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest hover:border-[var(--accent-cyan)]/40 hover:text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10 transition-all cursor-default shadow-inner border">{t}</span>
                        ))}
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Features */}
                <motion.div variants={item} className="card-premium border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl rounded-[2rem] p-8 shadow-xl hover:border-white/20 transition-all duration-300 border">
                    <h3 className="text-white text-xl font-black tracking-wide flex items-center gap-3 mb-6"><Crown className="w-5 h-5 text-[#FF003C] drop-shadow-[0_0_8px_rgba(0,255,222,0.8)]" /> System Capabilities</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { icon: Star, text: 'Exclusive MA Power Plan' },
                            { icon: Zap, text: '110+ Registry Tweaks' },
                            { icon: Shield, text: 'Automatic Registry Backup' },
                            { icon: Zap, text: 'One-Click Undo (Ctrl+Z)' },
                            { icon: Zap, text: 'Full System Cleaner' },
                            { icon: Globe, text: 'TCP/IP Network Optimizer' },
                            { icon: Code, text: 'winget Package Manager' },
                            { icon: Zap, text: 'CPU/RAM/Disk Benchmark' },
                            { icon: Shield, text: 'SFC/DISM Repair Tools' },
                            { icon: Shield, text: 'Privacy & Telemetry Control' },
                            { icon: Zap, text: 'Startup Manager' },
                            { icon: Zap, text: 'UWP App Remover' },
                        ].map((f, i) => (
                            <div key={i} className="flex items-center gap-3 bg-[rgba(255,255,255,0.01)] backdrop-blur-3xl border-white/5 p-3 rounded-2xl border">
                                <f.icon className="w-4 h-4 text-[var(--accent-cyan)] shrink-0" />
                                <span className="text-[var(--text-muted)] text-[13px] font-bold">{f.text}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <div className="space-y-8">
                    {/* Safety */}
                    <motion.div variants={item} className="card-premium border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl rounded-[2rem] p-8 shadow-xl hover:border-white/20 transition-all duration-300 border">
                        <h3 className="text-white text-xl font-black tracking-wide flex items-center gap-3 mb-6"><Shield className="w-5 h-5 text-[#00FFDE] drop-shadow-[0_0_8px_rgba(0,255,222,0.8)]" /> Safety Protocols</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3"><div className="mt-0.5 w-4 h-4 rounded-full bg-[#00FFDE]/20 flex items-center justify-center shrink-0 border-[#00FFDE]/50 border"><div className="w-1.5 h-1.5 rounded-full bg-[#00FFDE]" /></div><span className="text-[var(--text-muted)] text-[13px] font-bold">Automatic registry backup before every change</span></li>
                            <li className="flex items-start gap-3"><div className="mt-0.5 w-4 h-4 rounded-full bg-[#00FFDE]/20 flex items-center justify-center shrink-0 border-[#00FFDE]/50 border"><div className="w-1.5 h-1.5 rounded-full bg-[#00FFDE]" /></div><span className="text-[var(--text-muted)] text-[13px] font-bold">One-click undo for all modifications (Ctrl+Z)</span></li>
                            <li className="flex items-start gap-3"><div className="mt-0.5 w-4 h-4 rounded-full bg-[#00FFDE]/20 flex items-center justify-center shrink-0 border-[#00FFDE]/50 border"><div className="w-1.5 h-1.5 rounded-full bg-[#00FFDE]" /></div><span className="text-[var(--text-muted)] text-[13px] font-bold">Confirmation dialog for aggressive tweaks</span></li>
                            <li className="flex items-start gap-3"><div className="mt-0.5 w-4 h-4 rounded-full bg-[#00FFDE]/20 flex items-center justify-center shrink-0 border-[#00FFDE]/50 border"><div className="w-1.5 h-1.5 rounded-full bg-[#00FFDE]" /></div><span className="text-[var(--text-muted)] text-[13px] font-bold">Color-coded risk levels profiling</span></li>
                        </ul>
                    </motion.div>

                    {/* Changelog */}
                    <motion.div variants={item} className="card-premium border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-3xl rounded-[2rem] p-8 shadow-xl hover:border-white/20 transition-all duration-300 border">
                        <h3 className="text-white text-xl font-black tracking-wide flex items-center gap-3 mb-6">
                            <Code className="w-5 h-5 text-[var(--accent-cyan)] drop-shadow-[0_0_8px_rgba(0,255,222,0.8)]" /> Release History
                        </h3>
                        <div className="space-y-6">
                            <div className="relative pl-6 border-l-2 border-[var(--accent-cyan)]/50">
                                <div className="absolute left-[-6px] top-1.5 w-2.5 h-2.5 bg-[var(--accent-cyan)] rounded-full shadow-[0_0_10px_rgba(0,255,222,0.8)]" />
                                <div className="text-white text-[15px] font-black tracking-wide flex items-center gap-3">v7.1.0 <span className="bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-2xl border-[var(--accent-cyan)]/30 border">Latest</span></div>
                                <ul className="text-[var(--text-muted)] text-[13px] font-medium space-y-1.5 mt-3 list-disc pl-4 marker:text-[var(--accent-cyan)]/50">
                                    <li>Complete Electron rewrite with React 18 + TypeScript</li>
                                    <li>Ultra-Premium Glassmorphism UI redesign</li>
                                    <li>System health score dashboard integration</li>
                                    <li>Game Boost one-click mode implementation</li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <motion.div variants={item} className="text-center text-[var(--text-dim)] text-[11px] font-black uppercase tracking-widest py-8 opacity-50">
                © {new Date().getFullYear()} Mathisha Angirasa. All rights reserved.<br />
                MA-Optimizer is open-source software under MIT License.
            </motion.div>
        </motion.div>
    )
}
