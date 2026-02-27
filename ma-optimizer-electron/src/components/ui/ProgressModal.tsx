import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useAppStore } from '../../store/appStore'

export function ProgressModal() {
    const progress = useAppStore((s) => s.progress)

    return (
        <AnimatePresence>
            {progress.open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-card-bg border border-card-border rounded-2xl w-[380px] p-6 shadow-2xl"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 text-accent-cyan animate-spin" />
                            <div className="text-center">
                                <h3 className="text-text-primary font-semibold text-base mb-1">{progress.title}</h3>
                                <p className="text-text-muted text-sm">{progress.message}</p>
                            </div>
                            {progress.progress > 0 && (
                                <div className="w-full">
                                    <div className="h-2 bg-card-border rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-accent-cyan rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress.progress}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                    <div className="text-text-dim text-xs text-center mt-1">{progress.progress}%</div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
