import React, { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Trash2 } from 'lucide-react'
import { useLogStore } from '../../store/logStore'
import { useAppStore } from '../../store/appStore'

export function LogConsole() {
    const logOpen = useAppStore((s) => s.logOpen)
    const setLogOpen = useAppStore((s) => s.setLogOpen)
    const lines = useLogStore((s) => s.lines)
    const clear = useLogStore((s) => s.clear)
    const scrollRef = useRef<HTMLDivElement>(null)
    const [autoScroll, setAutoScroll] = useState(true)

    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [lines, autoScroll])

    const handleScroll = () => {
        if (!scrollRef.current) return
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
        setAutoScroll(scrollHeight - scrollTop - clientHeight < 50)
    }

    const exportLog = () => {
        const text = lines.map((l) => `[${l.timestamp}] ${l.text}`).join('\n')
        const blob = new Blob([text], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ma-optimizer-log-${new Date().toISOString().slice(0, 10)}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <AnimatePresence>
            {logOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 280, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="fixed bottom-8 left-[240px] right-0 z-40 bg-[#0a0a0a] border-t border-card-border overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-card-border shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                            <span className="text-[11px] text-text-muted font-mono">Console Output</span>
                            <span className="text-[10px] text-text-dim">{lines.length} lines</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setAutoScroll(!autoScroll)}
                                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${autoScroll ? 'bg-success/15 text-success' : 'bg-card-bg text-text-dim'
                                    }`}
                            >
                                {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
                            </button>
                            <button onClick={exportLog} className="p-1 text-text-dim hover:text-text-primary transition-colors" title="Export log">
                                <Download className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={clear} className="p-1 text-text-dim hover:text-text-primary transition-colors" title="Clear">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setLogOpen(false)} className="p-1 text-text-dim hover:text-text-primary transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Log lines */}
                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto px-4 py-2 font-mono text-[11px] leading-[1.7] select-text"
                    >
                        {lines.length === 0 ? (
                            <div className="text-text-dim italic">No log entries yet...</div>
                        ) : (
                            lines.map((line) => (
                                <div key={line.id} className="whitespace-pre-wrap">
                                    <span className="text-text-dim">[{line.timestamp}]</span>{' '}
                                    <span className={
                                        line.text.includes('[ERROR]') ? 'text-danger' :
                                            line.text.includes('[APPLY]') ? 'text-success' :
                                                line.text.includes('[REVERT]') ? 'text-warning' :
                                                    line.text.includes('✅') ? 'text-success' :
                                                        'text-[#00ff88]'
                                    }>
                                        {line.text}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
