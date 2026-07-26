import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Cpu, HardDrive, Download, ShieldAlert, MonitorPlay, Usb, Loader2, Save, DownloadCloud, FolderInput, ShieldCheck, Search, Filter } from 'lucide-react'
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
    const [restoring, setRestoring] = useState(false)
    const [classFilter, setClassFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

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
                addNotification('success', 'All drivers are up to date!')
            }
        } catch (e) {
            addNotification('error', 'Failed to scan for driver updates')
        }
        setScanning(false)
    }

    const createRestorePoint = async () => {
        try {
            addNotification('info', 'Creating System Restore Point...')
            const ok = await window.api?.repair.createRestorePoint('SDI Driver Update Restore Point')
            if (ok) addNotification('success', 'System Restore Point created successfully')
            else addNotification('error', 'Failed to create Restore Point')
        } catch {
            addNotification('error', 'Error creating Restore Point')
        }
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
                title: 'Select Backup Folder for Drivers',
                properties: ['openDirectory', 'createDirectory']
            })
            if (path && !path.canceled && path.filePaths.length > 0) {
                const success = await window.api?.drivers.backup(path.filePaths[0])
                if (success) {
                    addNotification('success', 'Drivers exported successfully!')
                } else {
                    addNotification('error', 'Failed to export drivers')
                }
            }
        } catch (e) {
            addNotification('error', 'Error exporting drivers')
        }
        setBackingUp(false)
    }

    const restoreDrivers = async () => {
        setRestoring(true)
        try {
            const path = await window.api?.openDialog({
                title: 'Select Folder Containing Driver Backup (.inf)',
                properties: ['openDirectory']
            })
            if (path && !path.canceled && path.filePaths.length > 0) {
                addNotification('info', 'Restoring drivers via pnputil...')
                const success = await window.api?.drivers.restore(path.filePaths[0])
                if (success) {
                    addNotification('success', 'Drivers imported successfully!')
                } else {
                    addNotification('error', 'Failed to import drivers')
                }
            }
        } catch (e) {
            addNotification('error', 'Error restoring drivers')
        }
        setRestoring(false)
    }

    const getIconForClass = (deviceClass?: string) => {
        const c = deviceClass?.toLowerCase() || ''
        if (c.includes('display')) return <MonitorPlay className="w-5 h-5" />
        if (c.includes('net')) return <Download className="w-5 h-5" />
        if (c.includes('usb')) return <Usb className="w-5 h-5" />
        if (c.includes('disk') || c.includes('storage')) return <HardDrive className="w-5 h-5" />
        return <Cpu className="w-5 h-5" />
    }

    const filteredDrivers = drivers.filter(d => {
        const matchesSearch = d.DeviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.Manufacturer?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesClass = classFilter === 'all' || (d.DeviceClass?.toLowerCase() || '').includes(classFilter.toLowerCase())
        return matchesSearch && matchesClass
    })

    return (
        <div className="space-y-8 max-w-[90rem] mx-auto w-full pb-10">
            {/* Ultra-Premium Driver Updater Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] p-12 transition-all duration-700 glass-shell shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[var(--accent-cyan)]/20 animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] rounded-full pointer-events-none bg-[#00FFDE]/20 animate-pulse" style={{ animationDuration: '6s' }}></div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center lg:text-left">
                        <h2 className="text-5xl lg:text-6xl font-black mb-4 tracking-tight text-white flex items-center justify-center lg:justify-start gap-4">
                            <DownloadCloud className="w-12 h-12 text-[var(--accent-cyan)] drop-shadow-[0_0_15px_rgba(0,255,222,0.8)]" />
                            Hardware Driver Manager
                        </h2>
                        <p className="text-[var(--text-muted)] text-sm uppercase tracking-[0.3em] font-black mb-6">
                            MA-Optimizer Hardware Driver Engine
                        </p>
                        
                        <p className="text-[var(--text-secondary)] max-w-xl font-medium leading-relaxed">
                            Full hardware device tree scanner. Scan, update, backup, and restore chipset, GPU, network, and audio drivers with built-in restore point protection.
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-3 w-full lg:w-auto">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={scanForUpdates}
                            disabled={scanning}
                            className="px-8 py-4 rounded-2xl bg-[#00FFDE]/10 border-[#00FFDE]/30 hover:border-[#00FFDE]/80 hover:bg-[#00FFDE]/20 transition-all duration-300 w-full overflow-hidden shadow-[0_0_30px_rgba(0,255,222,0.15)] disabled:opacity-50 min-w-[220px] border font-black uppercase text-xs tracking-widest text-[#00FFDE] flex items-center justify-center gap-3"
                        >
                            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                            {scanning ? 'Scanning...' : 'Scan for Driver Updates'}
                        </motion.button>
                        
                        <div className="flex items-center gap-3 w-full">
                            <button
                                onClick={backupDrivers}
                                disabled={backingUp}
                                className="flex-1 px-4 py-3.5 rounded-2xl glass-shell text-white text-xs font-black tracking-widest uppercase hover:bg-white/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 border"
                            >
                                {backingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[var(--accent-cyan)]" />} Export
                            </button>
                            <button
                                onClick={restoreDrivers}
                                disabled={restoring}
                                className="flex-1 px-4 py-3.5 rounded-2xl glass-shell text-white text-xs font-black tracking-widest uppercase hover:bg-white/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 border"
                            >
                                {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderInput className="w-4 h-4 text-[var(--accent-cyan)]" />} Import
                            </button>
                        </div>

                        <button
                            onClick={createRestorePoint}
                            className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 text-text-muted hover:text-white text-xs font-black tracking-widest uppercase transition-colors flex items-center justify-center gap-2"
                        >
                            <ShieldCheck className="w-4 h-4 text-[#00FFDE]" /> Create Restore Point
                        </button>
                    </div>
                </div>
            </div>

            {/* Updates Section */}
            {updates.length > 0 && (
                <div className="space-y-4 mt-8">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#FF003C] flex items-center gap-3 drop-shadow-[0_0_8px_rgba(255,0,60,0.5)]">
                        <ShieldAlert className="w-5 h-5" /> SDI Pending Driver Updates ({updates.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {updates.map(u => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={u.UpdateID}
                                className="p-6 bg-[rgba(255,0,60,0.05)] border-[#FF003C]/30 rounded-[1.5rem] flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md shadow-[0_0_20px_rgba(255,0,60,0.1)] card-premium border"
                            >
                                <div className="flex-1 w-full text-center md:text-left">
                                    <div className="font-bold text-white text-[15px] tracking-wide">{u.Title}</div>
                                    {u.Description && <div className="text-xs text-[var(--text-muted)] mt-1.5 line-clamp-2 font-medium leading-relaxed">{u.Description}</div>}
                                </div>
                                <button
                                    onClick={() => installUpdate(u.Title, u.UpdateID)}
                                    disabled={installing !== null}
                                    className="w-full md:w-auto px-8 py-3 bg-[#FF003C]/10 border-[#FF003C]/40 text-[#FF003C] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#FF003C]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shrink-0 border"
                                >
                                    {installing === u.UpdateID ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Deploying Driver...
                                        </>
                                    ) : (
                                        <>Deploy Driver Payload</>
                                    )}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        placeholder="Search devices by name or manufacturer..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 glass-shell rounded-2xl text-sm text-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent-cyan)] transition-all"
                    />
                </div>
                
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {['all', 'display', 'net', 'sound', 'disk', 'usb'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setClassFilter(cat)}
                            className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${classFilter === cat ? 'bg-[var(--accent-cyan)] text-black font-bold shadow-lg' : 'glass-shell text-text-muted hover:text-white'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Installed Drivers Device Tree */}
            <div className="space-y-6 mt-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--accent-cyan)] flex items-center gap-3">
                    Hardware Device Tree ({filteredDrivers.length} devices)
                </h3>
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent-cyan)]" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDrivers.map((d, i) => (
                            <div key={i} className="card-premium glass-shell p-6 rounded-[1.5rem] hover:border-white/20 transition-all duration-300 shadow-xl group">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl glass-shell flex items-center justify-center shrink-0 text-[var(--accent-cyan)] group-hover:bg-[var(--accent-cyan)]/10 transition-colors">
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

