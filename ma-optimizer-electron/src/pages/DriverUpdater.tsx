import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Cpu, HardDrive, Download, ShieldAlert, MonitorPlay, Usb, Loader2, Save, DownloadCloud } from 'lucide-react'
import { useAppStore } from '../store/appStore'

type DriverInfo = {
    DeviceName: string
    Manufacturer?: string
    DriverVersion?: string
    DriverDate?: string
    DeviceClass?: string
    HardwareID?: string | string[]
}

type UpdateInfo = {
    Title: string
    Description?: string
    IsDownloaded: boolean
    UpdateID: string
    RevisionNumber: string
}

export function DriverUpdater() {
    const [drivers, setDrivers] = useState<DriverInfo[]>([])
    const [updates, setUpdates] = useState<UpdateInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [scanning, setScanning] = useState(false)
    const [installing, setInstalling] = useState<string | null>(null)
    const [backingUp, setBackingUp] = useState(false)

    const addNotification = useAppStore(s => s.addNotification)

    useEffect(() => {
        const loadInstalled = async () => {
            try {
                const list = await window.api?.drivers.getInstalled()
                setDrivers(list || [])
            } catch (e) {
                addNotification('error', 'Failed to load installed drivers')
            }
            setLoading(false)
        }
        loadInstalled()
    }, [addNotification])

    const scanForUpdates = async () => {
        setScanning(true)
        try {
            const result = await window.api?.drivers.scanUpdates()
            setUpdates(result || [])
            if (result?.length) {
                addNotification('info', `Found ${result.length} driver update(s)`)
            } else {
                addNotification('success', 'All drivers are up to date! (Windows Update)')
            }
        } catch (e) {
            addNotification('error', 'Failed to scan for updates')
        }
        setScanning(false)
    }

    const installUpdate = async (title: string, updateId: string) => {
        setInstalling(updateId)
        const showProgress = useAppStore.getState().showProgress
        const closeProgress = useAppStore.getState().closeProgress

        showProgress(`Installing Driver Update`, title)

        try {
            const success = await window.api?.drivers.installUpdate(updateId)
            if (success) {
                addNotification('success', `Successfully installed: ${title}`)
                // Remove from list
                setUpdates(prev => prev.filter(u => u.UpdateID !== updateId))
            } else {
                addNotification('error', `Failed to install: ${title}`)
            }
        } catch (e) {
            addNotification('error', `Error installing: ${title}`)
        }

        closeProgress()
        setInstalling(null)
    }

    const backupDrivers = async () => {
        setBackingUp(true)
        try {
            const path = await window.api?.openDialog({
                title: 'Select Backup Folder',
                properties: ['openDirectory', 'createDirectory']
            })
            if (path && !path.canceled && path.filePaths.length > 0) {
                const success = await window.api?.drivers.backup(path.filePaths[0])
                if (success) {
                    addNotification('success', 'Drivers exported successfully')
                } else {
                    addNotification('error', 'Failed to export drivers')
                }
            }
        } catch (e) {
            addNotification('error', 'Error exporting drivers')
        }
        setBackingUp(false)
    }

    const getIconForClass = (deviceClass?: string) => {
        const c = deviceClass?.toLowerCase() || ''
        if (c.includes('display')) return <MonitorPlay className="w-5 h-5" />
        if (c.includes('net')) return <Download className="w-5 h-5" />
        if (c.includes('usb')) return <Usb className="w-5 h-5" />
        if (c.includes('disk') || c.includes('storage')) return <HardDrive className="w-5 h-5" />
        return <Cpu className="w-5 h-5" />
    }

    return (
        <div className="space-y-8 max-w-[90rem] mx-auto w-full pb-10">
            {/* Ultra-Premium Driver Updater Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] p-12 transition-all duration-700 border bg-[rgba(15,17,26,0.7)] backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/5">
                <div className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[var(--accent-cyan)]/20 animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[#00ff88]/20 animate-pulse" style={{ animationDuration: '6s' }}></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-5xl lg:text-6xl font-black mb-4 tracking-tight text-white flex items-center justify-center md:justify-start gap-4">
                            <DownloadCloud className="w-12 h-12 text-[var(--accent-cyan)] drop-shadow-[0_0_15px_rgba(0,255,222,0.8)]" />
                            Hardware Drivers
                        </h2>
                        <p className="text-[var(--text-muted)] text-sm uppercase tracking-[0.3em] font-black mb-8">
                            Peripheral & Core Firmware
                        </p>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <p className="text-[var(--text-secondary)] max-w-xl font-medium leading-relaxed">
                                Maintain optimal system stability by keeping chipset, GPU, and peripheral drivers synchronized with the latest OEM releases.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center gap-4">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={scanForUpdates}
                            disabled={scanning}
                            className="group relative px-8 py-5 rounded-2xl bg-[#00ff88]/10 border border-[#00ff88]/30 hover:border-[#00ff88]/80 hover:bg-[#00ff88]/20 transition-all duration-300 w-full overflow-hidden shadow-[0_0_30px_rgba(0,255,136,0.15)] disabled:opacity-50 disabled:cursor-not-allowed min-w-[240px]"
                        >
                            <span className="relative z-10 font-black tracking-widest uppercase text-sm flex items-center justify-center gap-3 text-[#00ff88] drop-shadow-[0_0_8px_rgba(0,255,136,0.8)]">
                                {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <DownloadCloud className="w-5 h-5" />}
                                {scanning ? 'Scanning...' : 'Scan for Updates'}
                            </span>
                        </motion.button>
                        <button
                            onClick={backupDrivers}
                            disabled={backingUp}
                            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-black tracking-widest uppercase hover:bg-white/10 transition-colors w-full flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {backingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Export Drivers
                        </button>
                    </div>
                </div>
            </div>

            {/* Updates Section */}
            {updates.length > 0 && (
                <div className="space-y-4 mt-8">
                    <h3 className="text-sm font-black text-[#ffaa00] uppercase tracking-[0.2em] flex items-center gap-3 drop-shadow-[0_0_8px_rgba(255,170,0,0.5)]">
                        <ShieldAlert className="w-5 h-5" /> Pending Updates ({updates.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {updates.map(u => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={u.UpdateID}
                                className="p-6 bg-[rgba(255,170,0,0.05)] border border-[#ffaa00]/30 rounded-[1.5rem] flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md shadow-[0_0_20px_rgba(255,170,0,0.1)] card-premium"
                            >
                                <div className="flex-1 w-full text-center md:text-left">
                                    <div className="font-bold text-white text-[15px] tracking-wide">{u.Title}</div>
                                    {u.Description && <div className="text-xs text-[var(--text-muted)] mt-1.5 line-clamp-2 font-medium leading-relaxed">{u.Description}</div>}
                                </div>
                                <button
                                    onClick={() => installUpdate(u.Title, u.UpdateID)}
                                    disabled={installing !== null}
                                    className="w-full md:w-auto px-8 py-3 bg-[#ffaa00]/10 border border-[#ffaa00]/40 text-[#ffaa00] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#ffaa00]/20 hover:border-[#ffaa00]/60 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_0_15px_rgba(255,170,0,0.2)] shrink-0"
                                >
                                    {installing === u.UpdateID ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Installing Payload...
                                        </>
                                    ) : (
                                        <>Deploy Firmware</>
                                    )}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Installed Drivers Section */}
            <div className="space-y-6 mt-12">
                <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-[0.2em] px-2">Hardware Device Tree</h3>
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent-cyan)]" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {drivers.map((d, i) => (
                            <div key={i} className="card-premium border border-white/5 bg-[rgba(15,17,26,0.6)] backdrop-blur-xl p-6 rounded-[1.5rem] hover:border-white/20 transition-all duration-300 shadow-xl group">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[var(--accent-cyan)] group-hover:bg-[var(--accent-cyan)]/10 group-hover:border-[var(--accent-cyan)]/30 transition-colors shadow-inner">
                                        {getIconForClass(d.DeviceClass)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-white text-[14px] truncate tracking-wide" title={d.DeviceName}>
                                            {d.DeviceName}
                                        </div>
                                        <div className="text-[11px] text-[var(--text-dim)] mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 max-w-full font-medium">
                                            <span className="uppercase tracking-widest font-black opacity-50">Version</span>
                                            <span className="truncate text-[var(--text-muted)] font-mono">{d.DriverVersion || 'Unknown'}</span>

                                            <span className="uppercase tracking-widest font-black opacity-50">Provider</span>
                                            <span className="truncate text-[var(--text-muted)]" title={d.Manufacturer}>{d.Manufacturer || 'Unknown'}</span>

                                            <span className="uppercase tracking-widest font-black opacity-50">Date</span>
                                            <span className="text-[var(--text-muted)] font-mono">
                                                {d.DriverDate
                                                    ? `${d.DriverDate.substring(0, 4)}-${d.DriverDate.substring(4, 6)}-${d.DriverDate.substring(6, 8)}`
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
