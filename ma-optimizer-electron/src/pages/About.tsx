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
            className="space-y-6 max-w-3xl mx-auto"
            variants={container}
            initial={false}
            animate="show"
        >
            {/* Hero */}
            <motion.div variants={item} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card-bg via-[#111827] to-[#2a0a0f] border border-card-border p-10 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(0,255,222,0.08),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(255,0,60,0.06),transparent_50%)]" />
                <div className="relative z-10">
                    <motion.div
                        className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden shadow-2xl bg-black/40 border border-white/10 relative"
                        animate={{
                            boxShadow: [
                                '0 0 20px rgba(0,255,222,0.2), 0 25px 50px rgba(0,0,0,0.3)',
                                '0 0 40px rgba(0,255,222,0.4), 0 25px 50px rgba(0,0,0,0.3)',
                                '0 0 20px rgba(0,255,222,0.2), 0 25px 50px rgba(0,0,0,0.3)',
                            ]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
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
                    <h1 className="text-3xl font-bold text-text-primary mb-1">MA-Optimizer</h1>
                    <p className="text-accent-cyan text-sm font-medium mb-4">Version 7.1.0</p>
                    <p className="text-text-muted text-sm max-w-md mx-auto leading-relaxed">
                        The most comprehensive Windows optimization suite—exceeding the combined feature sets of WinUtil, Winhance, and SG TCP Optimizer.
                    </p>
                </div>
            </motion.div>

            {/* Credits */}
            <motion.div variants={item} className="bg-card-bg border border-card-border rounded-xl p-6 card-premium">
                <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2"><Heart className="w-4 h-4 text-danger" />Created By</h3>
                <div className="flex items-center gap-4 mb-4">
                    <motion.img
                        src={meImg}
                        alt="Mathisha Angirasa"
                        className="w-14 h-14 rounded-full object-cover shadow-lg border-2 border-accent-violet/50"
                        whileHover={{ scale: 1.1 }}
                    />
                    <div>
                        <div className="text-text-primary font-semibold text-lg">Mathisha Angirasa</div>
                        <div className="text-text-muted text-sm">Windows Systems Engineer & Developer</div>
                    </div>
                </div>
                <div className="flex gap-3 mt-4">
                    <a href="https://github.com/Mathiyass/MA-Optimizer" target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-card-border rounded-xl text-sm text-text-muted hover:text-text-primary hover:border-accent-cyan/20 transition-all group">
                        <Github className="w-4 h-4" />GitHub
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    <a href="https://mathiyass.github.io/MAportfolio/" target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-card-border rounded-xl text-sm text-text-muted hover:text-text-primary hover:border-accent-cyan/20 transition-all group">
                        <Globe className="w-4 h-4" />Portfolio
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                </div>
            </motion.div>

            {/* Features */}
            <motion.div variants={item} className="bg-card-bg border border-card-border rounded-xl p-6 card-premium">
                <h3 className="text-text-primary font-semibold mb-3 flex items-center gap-2"><Crown className="w-4 h-4 text-accent-violet" />Key Features</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
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
                        <div key={i} className="flex items-center gap-2 text-text-muted">
                            <f.icon className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
                            <span>{f.text}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Changelog */}
            <motion.div variants={item} className="bg-card-bg border border-card-border rounded-xl p-6 card-premium">
                <h3 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
                    <Code className="w-4 h-4 text-accent-cyan" />Changelog
                </h3>
                <div className="space-y-3">
                    <div className="relative pl-4 border-l-2 border-accent-cyan/30">
                        <div className="absolute left-[-5px] top-0.5 w-2 h-2 bg-accent-cyan rounded-full" />
                        <div className="text-text-primary text-sm font-medium">v7.1.0 <span className="text-accent-cyan text-xs ml-1">Latest</span></div>
                        <ul className="text-text-muted text-xs space-y-0.5 mt-1">
                            <li>• Complete Electron rewrite with React 18 + TypeScript</li>
                            <li>• 110+ registry tweaks across 5 categories</li>
                            <li>• System health score dashboard</li>
                            <li>• Game Boost one-click mode</li>
                            <li>• DNS presets with live ping diagnostics</li>
                        </ul>
                    </div>
                    <div className="relative pl-4 border-l-2 border-card-border">
                        <div className="absolute left-[-5px] top-0.5 w-2 h-2 bg-card-border rounded-full" />
                        <div className="text-text-primary text-sm font-medium">v6.x</div>
                        <ul className="text-text-muted text-xs space-y-0.5 mt-1">
                            <li>• WinForms-based optimizer</li>
                            <li>• Basic registry tweaks and cleaner</li>
                        </ul>
                    </div>
                </div>
            </motion.div>

            {/* Safety */}
            <motion.div variants={item} className="bg-card-bg border border-card-border rounded-xl p-6 card-premium">
                <h3 className="text-text-primary font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-success" />Safety Guarantees</h3>
                <ul className="space-y-2 text-text-muted text-sm">
                    <li className="flex items-start gap-2"><span className="text-success shrink-0">✅</span> Automatic registry backup before every change</li>
                    <li className="flex items-start gap-2"><span className="text-success shrink-0">✅</span> One-click undo for all modifications (Ctrl+Z)</li>
                    <li className="flex items-start gap-2"><span className="text-success shrink-0">✅</span> Confirmation dialog for aggressive tweaks</li>
                    <li className="flex items-start gap-2"><span className="text-success shrink-0">✅</span> System restore point creation on demand</li>
                    <li className="flex items-start gap-2"><span className="text-success shrink-0">✅</span> Color-coded risk levels (🟢 Safe / 🟡 Moderate / 🔴 Aggressive)</li>
                    <li className="flex items-start gap-2"><span className="text-success shrink-0">✅</span> Full export/import of settings profiles</li>
                </ul>
            </motion.div>

            {/* Tech Stack */}
            <motion.div variants={item} className="bg-card-bg border border-card-border rounded-xl p-6 card-premium">
                <h3 className="text-text-primary font-semibold mb-3 flex items-center gap-2"><Code className="w-4 h-4 text-accent-cyan" />Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                    {['Electron 30', 'React 18', 'TypeScript 5', 'Vite 5', 'Tailwind CSS 3', 'Zustand', 'Framer Motion', 'Recharts', 'Winston Logger', 'electron-builder', 'Lucide Icons'].map(t => (
                        <span key={t} className="px-3 py-1.5 bg-white/5 border border-card-border rounded-full text-text-muted text-xs hover:border-accent-cyan/20 hover:text-text-primary transition-all cursor-default">{t}</span>
                    ))}
                </div>
            </motion.div>

            <motion.div variants={item} className="text-center text-text-dim text-xs py-4">
                © {new Date().getFullYear()} Mathisha Angirasa. All rights reserved.<br />
                MA-Optimizer is open-source software under MIT License.
            </motion.div>
        </motion.div>
    )
}
