import React from 'react'
import { Cpu, MemoryStick, HardDrive, Wifi, Terminal, Clock } from 'lucide-react'
import { useSystemStore } from '../../store/systemStore'
import { useAppStore } from '../../store/appStore'

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(Math.abs(bytes) || 1) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function MiniBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
    const percent = Math.min((value / max) * 100, 100)
    return (
        <div className="mini-bar w-12">
            <div className="mini-bar-fill" style={{ width: `${percent}%`, background: color }} />
        </div>
    )
}

export function StatusBar() {
    const cpu = useSystemStore((s) => s.cpu)
    const ram = useSystemStore((s) => s.ram)
    const disk = useSystemStore((s) => s.disk)
    const network = useSystemStore((s) => s.network)
    const logOpen = useAppStore((s) => s.logOpen)
    const setLogOpen = useAppStore((s) => s.setLogOpen)

    const cpuColor = cpu > 80 ? '#FF003C' : cpu > 60 ? '#ffd700' : '#00FFDE'
    const ramColor = ram.percent > 85 ? '#FF003C' : ram.percent > 60 ? '#ffd700' : '#00FFDE'

    return (
        <footer className="h-8 bg-[rgba(15,17,26,0.6)] backdrop-blur-3xl border-t border-white/5 flex items-center px-4 shrink-0 select-none text-[11px] z-20">
            {/* System stats */}
            <div className="flex items-center gap-5 flex-1">
                <div className="flex items-center gap-1.5 text-text-muted">
                    <Cpu className="w-3 h-3" />
                    <span style={{ color: cpuColor, transition: 'color 0.3s' }}>
                        {cpu.toFixed(0)}%
                    </span>
                    <MiniBar value={cpu} color={cpuColor} />
                </div>
                <div className="flex items-center gap-1.5 text-text-muted">
                    <MemoryStick className="w-3 h-3" />
                    <span style={{ color: ramColor, transition: 'color 0.3s' }}>
                        {ram.percent.toFixed(0)}%
                    </span>
                    <MiniBar value={ram.percent} color={ramColor} />
                </div>
                <div className="flex items-center gap-1.5 text-text-muted">
                    <HardDrive className="w-3 h-3" />
                    <span>{formatBytes(disk.readPerSec)}/s</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-muted">
                    <Wifi className="w-3 h-3" />
                    <span>↓{formatBytes(network.rxSec)}/s</span>
                </div>
            </div>

            {/* Log console toggle */}
            <button
                onClick={() => setLogOpen(!logOpen)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all ${logOpen ? 'text-accent-cyan bg-accent-cyan/10' : 'text-text-dim hover:text-text-primary'
                    }`}
            >
                <Terminal className="w-3 h-3" />
                <span>Console</span>
                <kbd className="ml-1 px-1 bg-card-bg border border-card-border rounded text-[9px]">Ctrl+L</kbd>
            </button>
        </footer>
    )
}
