import React, { useEffect, Component, ErrorInfo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { StatusBar } from './components/layout/StatusBar'
import { LogConsole } from './components/layout/LogConsole'
import { ConfirmDialog } from './components/ui/ConfirmDialog'
import { ProgressModal } from './components/ui/ProgressModal'
import { SearchOverlay } from './components/ui/SearchOverlay'
import { ProfileSelector } from './components/ui/ProfileSelector'
import { useAppStore } from './store/appStore'
import { useLogStore } from './store/logStore'
import { useSystemMonitor } from './hooks/useSystemMonitor'

// Pages
import { Dashboard } from './pages/Dashboard'
import { MaPowerPlan } from './pages/MaPowerPlan'
import { Performance } from './pages/Performance'
import { Network } from './pages/Network'
import { Privacy } from './pages/Privacy'
import { Gaming } from './pages/Gaming'
import { Cleaner } from './pages/Cleaner'
import { Startup } from './pages/Startup'
import { AppInstaller } from './pages/AppInstaller'
import { Tools } from './pages/Tools'
import { Repair } from './pages/Repair'
import { Advanced } from './pages/Advanced'
import { Benchmark } from './pages/Benchmark'
import { About } from './pages/About'

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
    tools: Tools,
    repair: Repair,
    advanced: Advanced,
    benchmark: Benchmark,
    about: About,
}

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

export default function App() {
    const currentPage = useAppStore((s) => s.currentPage)
    const setIsAdmin = useAppStore((s) => s.setIsAdmin)
    const setSearchOpen = useAppStore((s) => s.setSearchOpen)
    const setLogOpen = useAppStore((s) => s.setLogOpen)
    const addLog = useLogStore((s) => s.addLine)
    const notifications = useAppStore((s) => s.notifications)
    const removeNotification = useAppStore((s) => s.removeNotification)

    // System monitor — polls every 1 second
    useSystemMonitor(true, 1000)

    // Listen for IPC events
    useEffect(() => {
        if (!window.api) return
        window.api.onLogLine((line: string) => addLog(line))
        window.api.onAdminStatus((ok: boolean) => setIsAdmin(ok))
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
        <div className="flex h-screen bg-app-bg overflow-hidden font-sans select-none">
            {/* Sidebar */}
            <Sidebar />

            {/* Main content */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-app-bg scrollbar-thumb-card-border">
                    <div key={currentPage} className="p-6">
                        <ErrorBoundary resetKey={currentPage}>
                            <PageComponent />
                        </ErrorBoundary>
                    </div>
                </main>

                <StatusBar />
            </div>

            {/* Log console */}
            <LogConsole />

            {/* Global modals */}
            <ConfirmDialog />
            <ProgressModal />
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
    )
}
