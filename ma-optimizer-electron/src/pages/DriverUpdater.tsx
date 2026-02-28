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
        <div className="space-y-6 max-w-6xl relative pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <DownloadCloud className="w-6 h-6 text-accent-cyan" /> Driver Updater
                    </h2>
                    <p className="text-text-muted text-sm mt-1">Keep your hardware running at peak performance</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={backupDrivers}
                        disabled={backingUp}
                        className="px-4 py-2 bg-card-bg border border-card-border rounded-lg text-sm text-text-muted hover:text-text-primary transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                        {backingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Backup Drivers
                    </button>
                    <button
                        onClick={scanForUpdates}
                        disabled={scanning}
                        className="px-4 py-2 bg-accent-cyan text-black rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,222,0.2)] disabled:opacity-50"
                    >
                        {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                        Scan for Updates
                    </button>
                </div>
            </div>

            {/* Updates Section */}
            {updates.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-accent-cyan uppercase tracking-wider flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" /> Pending Updates ({updates.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        {updates.map(u => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={u.UpdateID}
                                className="p-4 bg-accent-cyan/5 border border-accent-cyan/30 rounded-xl flex items-center justify-between"
                            >
                                <div>
                                    <div className="font-semibold text-text-primary text-sm">{u.Title}</div>
                                    {u.Description && <div className="text-xs text-text-muted mt-0.5 line-clamp-1">{u.Description}</div>}
                                </div>
                                <button
                                    onClick={() => installUpdate(u.Title, u.UpdateID)}
                                    disabled={installing !== null}
                                    className="px-4 py-1.5 bg-accent-cyan/20 text-accent-cyan rounded-lg text-xs font-semibold hover:bg-accent-cyan/30 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {installing === u.UpdateID ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Installing...
                                        </>
                                    ) : (
                                        <>Install</>
                                    )}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Installed Drivers Section */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Installed Hardware Devices</h3>
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-accent-cyan" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {drivers.map((d, i) => (
                            <div key={i} className="p-4 bg-card-bg border border-card-border rounded-xl hover:border-white/10 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#ffffff08] flex items-center justify-center shrink-0 text-text-dim">
                                        {getIconForClass(d.DeviceClass)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-text-primary text-sm truncate" title={d.DeviceName}>
                                            {d.DeviceName}
                                        </div>
                                        <div className="text-xs text-text-dim mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 max-w-full">
                                            <span className="opacity-60">Version:</span>
                                            <span className="truncate">{d.DriverVersion || 'Unknown'}</span>

                                            <span className="opacity-60">Provider:</span>
                                            <span className="truncate" title={d.Manufacturer}>{d.Manufacturer || 'Unknown'}</span>

                                            <span className="opacity-60">Date:</span>
                                            <span>
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
