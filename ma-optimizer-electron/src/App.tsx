import React, { useEffect, Component, ErrorInfo, lazy, Suspense, memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { StatusBar } from './components/layout/StatusBar'
import { LogConsole } from './components/layout/LogConsole'
import { ConfirmDialog } from './components/ui/ConfirmDialog'
import { GlobalProgressBar } from './components/ui/GlobalProgressBar'
import { SearchOverlay } from './components/ui/SearchOverlay'
import { ProfileSelector } from './components/ui/ProfileSelector'
import { useAppStore } from './store/appStore'
import { useLogStore } from './store/logStore'
import { useSystemMonitor } from './hooks/useSystemMonitor'

// Lazy loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const MaPowerPlan = lazy(() => import('./pages/MaPowerPlan').then(m => ({ default: m.MaPowerPlan })))
const Performance = lazy(() => import('./pages/Performance').then(m => ({ default: m.Performance })))
const Network = lazy(() => import('./pages/Network').then(m => ({ default: m.Network })))
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })))
const Gaming = lazy(() => import('./pages/Gaming').then(m => ({ default: m.Gaming })))
const Cleaner = lazy(() => import('./pages/Cleaner').then(m => ({ default: m.Cleaner })))
const Startup = lazy(() => import('./pages/Startup').then(m => ({ default: m.Startup })))
const AppInstaller = lazy(() => import('./pages/AppInstaller').then(m => ({ default: m.AppInstaller })))
const Tools = lazy(() => import('./pages/Tools').then(m => ({ default: m.Tools })))
const Repair = lazy(() => import('./pages/Repair').then(m => ({ default: m.Repair })))
const Advanced = lazy(() => import('./pages/Advanced').then(m => ({ default: m.Advanced })))
const Benchmark = lazy(() => import('./pages/Benchmark').then(m => ({ default: m.Benchmark })))
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })))
const DriverUpdater = lazy(() => import('./pages/DriverUpdater').then(m => ({ default: m.DriverUpdater })))

const pages: Record<string, React.ComponentType> = {
    dashboard: Dashboard,
    performance: Performance,
    'ma-power': MaPowerPlan,
    network: Network,
    privacy: Privacy,
    gaming: Gaming,
    cleaner: Cleaner,
    startup: Startup,
    apps: AppInstaller,
    drivers: DriverUpdater,
    tools: Tools,
    repair: Repair,
    advanced: Advanced,
    benchmark: Benchmark,
    about: About,
}

// Memoized Layout Components to prevent re-renders from system monitor updates
const MemoizedSidebar = memo(Sidebar)
const MemoizedHeader = memo(Header)
const MemoizedStatusBar = memo(StatusBar)

class ErrorBoundary extends Component<{ children: React.ReactNode; resetKey: string }, { hasError: boolean; error: Error | null }> {
    constructor(props: any) {
        super(props)
        this.state = { hasError: false, error: null }
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }
    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Page render error:', error, errorInfo)
        console.error('Error stack:', error.stack)
    }
    componentDidUpdate(prevProps: any) {
        if (prevProps.resetKey !== this.props.resetKey) {
            this.setState({ hasError: false, error: null })
        }
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="text-danger text-lg font-bold">⚠️ Page Error</div>
                    <div className="text-text-muted text-sm max-w-md text-center">{this.state.error?.message}</div>
                    <pre className="text-text-dim text-xs max-w-lg overflow-auto bg-card-bg p-4 rounded-xl border border-card-border">{this.state.error?.stack}</pre>
                    <button onClick={() => this.setState({ hasError: false, error: null })} className="px-4 py-2 bg-accent-cyan/15 text-accent-cyan rounded-lg text-sm hover:bg-accent-cyan/25">Retry</button>
                </div>
            )
        }
        return this.props.children
    }
}

const LoadingFallback = () => (
    <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in">
        <div className="w-12 h-12 border-2 border-accent-cyan/20 border-t-accent-cyan rounded-full animate-spin"></div>
        <div className="text-accent-cyan text-sm font-medium tracking-wider uppercase opacity-50">Loading Module...</div>
    </div>
)

export default function App() {
    const currentPage = useAppStore((s) => s.currentPage)
    const setIsAdmin = useAppStore((s) => s.setIsAdmin)
    const setSearchOpen = useAppStore((s) => s.setSearchOpen)
    const setLogOpen = useAppStore((s) => s.setLogOpen)
    const addLog = useLogStore((s) => s.addLine)
    const notifications = useAppStore((s) => s.notifications)
    const removeNotification = useAppStore((s) => s.removeNotification)

    // System monitor — polls every 2 seconds as requested for balance
    useSystemMonitor(true)

    // Listen for IPC events
    useEffect(() => {
        if (!window.api) return
        window.api.onLogLine((line: string) => addLog(line))
        window.api.onAdminStatus((ok: boolean) => setIsAdmin(ok))
        window.api.onProgress((data: { percent: number; message: string; stage?: 'download' | 'install' }) => {
            useAppStore.getState().updateProgress(data.percent, data.message, data.stage)
        })
        return () => {
            window.api?.offLogLine()
        }
    }, [])

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault()
                setSearchOpen(true)
            }
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault()
                setLogOpen(useAppStore.getState().logOpen ? false : true)
            }
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault()
                window.api?.backup.undoLast()
            }
            if (e.ctrlKey && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault()
                window.api?.backup.undoAll()
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [])

    const PageComponent = pages[currentPage] || Dashboard

    return (
        <div className="flex h-screen bg-transparent overflow-hidden font-sans select-none relative">
            {/* Ambient Aurora Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[rgba(15,17,26,0.6)] backdrop-blur-3xl">
                <div className="absolute top-[15%] left-[20%] w-[40vw] h-[40vw] bg-[#00FFDE] rounded-full mix-blend-screen filter blur-[120px] opacity-20"></div>
                <div className="absolute bottom-[15%] right-[20%] w-[40vw] h-[40vw] bg-[#FF003C] rounded-full mix-blend-screen filter blur-[120px] opacity-20"></div>
                <div className="aurora-bg opacity-40"></div>
            </div>

            <div className="flex h-full w-full relative z-10">
                <MemoizedSidebar />

                <div className="flex flex-col flex-1 overflow-hidden">
                    <MemoizedHeader />

                    <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-card-border">
                        <div className="p-6 h-full">
                            <ErrorBoundary resetKey={currentPage}>
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentPage}
                                        initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                        exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
                                        transition={{ duration: 0.3, ease: 'easeOut' }}
                                        className="h-full"
                                    >
                                        <Suspense fallback={<LoadingFallback />}>
                                            <PageComponent />
                                        </Suspense>
                                    </motion.div>
                                </AnimatePresence>
                            </ErrorBoundary>
                        </div>
                    </main>

                    <MemoizedStatusBar />
                </div>

                {/* Log console */}
                <LogConsole />

                {/* Global UI */}
                <ConfirmDialog />
                <GlobalProgressBar />
                <SearchOverlay />
                <ProfileSelector />

                {/* Toast notifications */}
                <div className="fixed bottom-12 right-4 z-50 flex flex-col gap-2 max-w-sm">
                    <AnimatePresence>
                        {notifications.map((n) => (
                            <motion.div
                                key={n.id}
                                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 50, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => removeNotification(n.id)}
                                className={`
                px-4 py-3 rounded-xl border cursor-pointer shadow-lg backdrop-blur-sm
                ${n.type === 'success' ? 'bg-success/10 border-success/30 text-success' : ''}
                ${n.type === 'error' ? 'bg-danger/10 border-danger/30 text-danger' : ''}
                ${n.type === 'warning' ? 'bg-warning/10 border-warning/30 text-warning' : ''}
                ${n.type === 'info' ? 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan' : ''}
              `}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">
                                        {n.type === 'success' && '✅'}
                                        {n.type === 'error' && '❌'}
                                        {n.type === 'warning' && '⚠️'}
                                        {n.type === 'info' && 'ℹ️'}
                                    </span>
                                    <span className="text-sm font-medium">{n.message}</span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
