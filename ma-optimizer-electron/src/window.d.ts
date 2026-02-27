export interface WindowApi {
    registry: {
        get: (hive: string, path: string, name: string) => Promise<any>
        set: (hive: string, path: string, name: string, value: any, type: string) => Promise<boolean>
        delete: (hive: string, path: string, name: string) => Promise<boolean>
        backup: () => Promise<any>
        restoreAll: () => Promise<{ success: boolean; restored: number }>
        restoreLast: () => Promise<{ success: boolean; key?: string; error?: string }>
    }
    powerPlan: {
        create: () => Promise<boolean>
        activate: () => Promise<boolean>
        deactivate: () => Promise<boolean>
        isActive: () => Promise<boolean>
        exists: () => Promise<boolean>
        getActive: () => Promise<{ guid: string; name: string } | null>
        listAll: () => Promise<Array<{ guid: string; name: string; active: boolean }>>
        activatePlanByGuid: (guid: string) => Promise<boolean>
        setTimerResolution: (ns: number) => Promise<boolean>
        getTimerResolution: () => Promise<number>
        applyProfile: (profile: string) => Promise<boolean>
        generateEnergyReport: () => Promise<string>
        generateBatteryReport: () => Promise<string>
        generateSleepStudy: () => Promise<string>
        exportPlan: (path: string) => Promise<boolean>
        importPlan: (path: string) => Promise<boolean>
        delete: () => Promise<boolean>
    }
    system: {
        getCpuUsage: () => Promise<{ currentLoad: number; cpus: number[] }>
        getRamUsage: () => Promise<{ total: number; used: number; free: number; usedPercent: number; swapTotal: number; swapUsed: number }>
        getDiskIO: () => Promise<{ readPerSec: number; writePerSec: number; readBytesPerSec: number; writeBytesPerSec: number }>
        getNetworkSpeed: () => Promise<{ rxSec: number; txSec: number; rxBytes: number; txBytes: number }>
        getFullInfo: () => Promise<any>
        getProcesses: () => Promise<any[]>
        killProcess: (pid: number) => Promise<boolean>
        setProcessPriority: (pid: number, p: number) => Promise<boolean>
        openPath: (p: string) => Promise<boolean>
        runTool: (cmd: string) => Promise<boolean>
    }
    services: {
        list: () => Promise<any[]>
        setStartup: (name: string, mode: string) => Promise<boolean>
        start: (name: string) => Promise<boolean>
        stop: (name: string) => Promise<boolean>
        applyRecommended: () => Promise<{ applied: number; total: number }>
    }
    network: {
        getTcpParams: () => Promise<any>
        setTcpParam: (name: string, val: any) => Promise<boolean>
        runNetsh: (args: string) => Promise<string>
        flushDns: () => Promise<string>
        resetWinsock: () => Promise<string>
        resetTcpIp: () => Promise<string>
        setDns: (adapter: string, p: string, s: string) => Promise<boolean>
        getAdapters: () => Promise<any[]>
        pingTest: (host: string) => Promise<{ host: string; min: number; avg: number; max: number; loss: number }>
        detectMtu: () => Promise<number>
        setMtu: (adapter: string, size: number) => Promise<boolean>
        getOpenPorts: () => Promise<any[]>
        tracert: (host: string) => Promise<string>
        nslookup: (host: string) => Promise<string>
    }
    cleaner: {
        scan: (categories: string[]) => Promise<{ categories: Array<{ id: string; name: string; size: number }> }>
        clean: (categories: string[]) => Promise<{ freed: number }>
        scanBrowsers: () => Promise<Array<{ id: string; name: string; detected: boolean; size: number }>>
        cleanBrowsers: (browsers: string[], types: string[]) => Promise<{ freed: number }>
        getLargeFiles: (path: string, minSize: number) => Promise<any[]>
        getDiskUsage: (drive: string) => Promise<any>
        scanRegistry: () => Promise<any[]>
        cleanRegistry: (items: any[]) => Promise<{ cleaned: number }>
        emptyRecycleBin: () => Promise<boolean>
    }
    startup: {
        list: () => Promise<any[]>
        toggle: (id: string, enabled: boolean) => Promise<boolean>
        delete: (id: string) => Promise<boolean>
        add: (name: string, path: string) => Promise<boolean>
        refresh: () => Promise<any[]>
    }
    winget: {
        isInstalled: () => Promise<{ installed: boolean; version: string | null }>
        listInstalled: () => Promise<string[]>
        install: (id: string) => Promise<boolean>
        uninstall: (id: string) => Promise<boolean>
        upgradeAll: () => Promise<boolean>
        checkUpdate: (id: string) => Promise<boolean>
    }
    repair: {
        runSfc: () => Promise<string>
        runDism: (action: string) => Promise<string>
        createRestorePoint: (desc: string) => Promise<boolean>
        listRestorePoints: () => Promise<any[]>
        resetNetwork: () => Promise<boolean>
        resetWindowsUpdate: () => Promise<boolean>
        wsreset: () => Promise<boolean>
        reregisterApps: () => Promise<string>
        fixHosts: () => Promise<boolean>
        rebuildIconCache: () => Promise<boolean>
        checkDisk: (drive: string) => Promise<string>
        runMemDiag: () => Promise<boolean>
    }
    advanced: {
        getInstalledApps: () => Promise<any[]>
        removeApps: (names: string[]) => Promise<{ removed: number; total: number }>
        getWindowsFeatures: () => Promise<Array<{ name: string; enabled: boolean }>>
        toggleFeature: (name: string, enable: boolean) => Promise<boolean>
        runBcdedit: (args: string) => Promise<string | null>
        enableGodMode: () => Promise<boolean>
        changeComputerName: (name: string) => Promise<boolean>
    }
    benchmark: {
        runCpu: () => Promise<any>
        runMemory: () => Promise<any>
        runDisk: (drive: string) => Promise<any>
    }
    backup: {
        export: (path: string) => Promise<{ success: boolean; error?: string }>
        import: (path: string) => Promise<{ success: boolean; data?: any; error?: string }>
        undoAll: () => Promise<{ success: boolean; restored: number; failed: number }>
        undoLast: () => Promise<{ success: boolean; key?: string; error?: string }>
    }
    admin: {
        isAdmin: () => Promise<boolean>
        relaunchAsAdmin: () => void
    }
    window: {
        minimize: () => void
        maximize: () => void
        close: () => void
        isMaximized: () => Promise<boolean>
    }
    updates: {
        checkForUpdates: () => Promise<any>
        downloadUpdate: () => void
        installUpdate: () => void
    }
    onLogLine: (cb: (line: string) => void) => void
    offLogLine: () => void
    onAdminStatus: (cb: (ok: boolean) => void) => void
    openDialog: (opts: any) => Promise<any>
    saveDialog: (opts: any) => Promise<any>
}

declare global {
    interface Window {
        api: WindowApi
    }
}

export { }
