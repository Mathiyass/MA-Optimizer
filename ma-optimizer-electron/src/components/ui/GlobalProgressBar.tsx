import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../store/appStore'

export function GlobalProgressBar() {
    const { open, downloadProgress, installProgress, stage, message } = useAppStore((s) => s.progress)

    if (!open) return null

    const currentProgress = stage === 'install' ? installProgress : downloadProgress
    const barColor = stage === 'install' ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-accent-cyan shadow-[0_0_10px_rgba(0,255,136,0.5)]'
    const statusText = message || (stage === 'install' ? 'Installing Update...' : 'Downloading...')

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-card-bg/90 backdrop-blur-md border border-card-border rounded-xl shadow-2xl overflow-hidden flex flex-col w-[380px]"
            >
                {/* Content */}
                <div className="px-5 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary truncate pr-4">{statusText}</span>
                    <span className="text-xs text-text-muted font-mono font-bold bg-app-bg/50 px-2 py-1 rounded-md">
                        {currentProgress}%
                    </span>
                </div>

                {/* The HTML Bar */}
                <div className="h-1.5 w-full bg-app-bg flex">
                    <motion.div
                        className={`h-full ${barColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${currentProgress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
