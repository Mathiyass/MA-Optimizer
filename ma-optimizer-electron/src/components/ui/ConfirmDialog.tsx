import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { useAppStore } from '../../store/appStore'

export function ConfirmDialog() {
    const confirm = useAppStore((s) => s.confirm)
    const [checked, setChecked] = useState(false)

    if (!confirm.open) return null

    const canConfirm = !confirm.requireCheckbox || checked

    return (
        <AnimatePresence>
            {confirm.open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => { setChecked(false); confirm.onCancel?.() }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-card-bg border border-card-border rounded-2xl w-[420px] max-w-[90vw] overflow-hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-card-border bg-danger/5">
                            <div className="w-10 h-10 rounded-full bg-danger/15 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-danger" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-text-primary font-semibold text-base">{confirm.title}</h3>
                            </div>
                            <button
                                onClick={() => { setChecked(false); confirm.onCancel?.() }}
                                className="p-1 text-text-dim hover:text-text-primary transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4">
                            <p className="text-text-muted text-sm leading-relaxed">{confirm.message}</p>

                            {confirm.requireCheckbox && (
                                <label className="flex items-start gap-3 mt-4 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => setChecked(e.target.checked)}
                                        className="w-4 h-4 mt-0.5 accent-danger rounded"
                                    />
                                    <span className="text-text-muted text-sm group-hover:text-text-primary transition-colors">
                                        {confirm.checkboxLabel}
                                    </span>
                                </label>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-card-border">
                            <button
                                onClick={() => { setChecked(false); confirm.onCancel?.() }}
                                className="px-4 py-2 text-sm text-text-muted hover:text-text-primary bg-card-bg border border-card-border rounded-lg hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { setChecked(false); confirm.onConfirm?.() }}
                                disabled={!canConfirm}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${canConfirm
                                        ? 'bg-danger text-white hover:bg-danger/80'
                                        : 'bg-card-border text-text-dim cursor-not-allowed'
                                    }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
