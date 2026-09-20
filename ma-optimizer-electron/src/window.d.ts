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
        getBoostMode: () => Promise<{ success: boolean; mode: number }>
        setBoostMode: (mode: number) => Promise<{ success: boolean; message: string }>
        getCStateConfig: () => Promise<{ success: boolean; idleDisabled: boolean }>
        setCStateDisabled: (disable: boolean) => Promise<{ success: boolean; message: string }>
        getProcessorThrottle: () => Promise<{ success: boolean; minPercent: number; maxPercent: number }>
        lockMaxFrequency: (lock: boolean) => Promise<{ success: boolean; message: string }>
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
        cleanRam: () => Promise<boolean>
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
        testPacketSize: (host: string, bytes: number) => Promise<{ bytes: number; success: boolean; ms: number }>
        exportTcpConfig: () => Promise<string | null>
        importTcpConfig: (settings: any) => Promise<boolean>
        benchmarkDns: () => Promise<Array<{ name: string; primary: string; secondary: string; latency: number }>>
        getNicAdvancedProps: (adapter?: string) => Promise<Array<{ DisplayName: string; DisplayValue: string; RegistryKeyword?: string; RegistryValue?: any }>>
        setNicAdvancedProp: (adapter: string, name: string, value: string) => Promise<boolean>
        applyTcpNoDelayToAllInterfaces: () => Promise<{ applied: number; success: boolean }>
        getQosPolicies: () => Promise<Array<{ name: string; appName: string; dscp: number; priority: number }>>
        addQosPolicy: (name: string, exeName: string) => Promise<boolean>
        removeQosPolicy: (name: string) => Promise<boolean>
        applyHitregOptimization: () => Promise<{ success: boolean; message: string }>
        healGameFirewall: () => Promise<{ success: boolean; removedBlocks: number }>
        purgeAllQosPolicies: () => Promise<boolean>
        identifyNicStepping: () => Promise<{ isIntelI225: boolean; stepping: string; isB1B2: boolean; name: string; hwId: string }>
        applyDeepNicFix: () => Promise<{ success: boolean; message: string }>
        applyTimerFixes: () => Promise<{ success: boolean; message: string }>
        applyGpuDpcFix: () => Promise<{ success: boolean; message: string }>
        applyAudioDpcFix: () => Promise<{ success: boolean; message: string }>
        applyStoragePowerFix: () => Promise<{ success: boolean; message: string }>
        enableMsiModeDeep: () => Promise<{ success: boolean; message: string }>
        applyAdvancedStackFix: () => Promise<{ success: boolean; message: string }>
        discoverOptimalMtu: () => Promise<{ adapter: string; optimalPayload: number; mtu: number; success: boolean }>
        getNicStatistics: () => Promise<{ adapter: string; receivedDiscarded: number; outboundDiscarded: number; receivedPacketErrors: number; outboundPacketErrors: number }>
        auditWfpCallouts: () => Promise<{ count: number; offenders: string[] }>
        enableTcpFastOpen: () => Promise<{ success: boolean; message: string }>
        getTcpFastOpenStatus: () => Promise<{ success: boolean; enabled: boolean; raw: string }>
        configureDoh: (provider: 'cloudflare' | 'google' | 'quad9' | 'disable') => Promise<{ success: boolean; message: string }>
        getDohStatus: () => Promise<{ success: boolean; hasDoh: boolean; entries: any[] }>
        getConnectionQuality: (host?: string, count?: number) => Promise<{ success: boolean; quality: { host: string; sent: number; received: number; lossPercent: number; minMs: number; maxMs: number; avgMs: number; jitterMs: number; samples: number[] } }>
        getCongestionProvider: () => Promise<{ success: boolean; provider: string }>
        setCongestionProvider: (provider: 'CUBIC' | 'CTCP' | 'NewReno') => Promise<{ success: boolean; message: string }>
    }
    cleaner: {
        scan: (categories: string[]) => Promise<{ categories: Array<{ id: string; name: string; size: number }> }>
        clean: (categories: string[]) => Promise<{ freed: number }>
        scanBrowsers: () => Promise<Array<{ id: string; name: string; detected: boolean; size: number; items: any[] }>>
        cleanBrowsers: (selections: { id: string, types: string[] }[]) => Promise<{ freed: number }>
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
        search: (query: string) => Promise<any[]>
        checkUpdate: (id: string) => Promise<boolean>
        getIcon: (appName: string) => Promise<string | null>
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
    createRestorePoint: () => Promise<{ success: boolean; error?: string }>
    advanced: {
        getInstalledApps: () => Promise<any[]>
        removeApps: (names: string[]) => Promise<{ removed: number; total: number }>
        getWindowsFeatures: () => Promise<Array<{ name: string; enabled: boolean }>>
        toggleFeature: (name: string, enable: boolean) => Promise<boolean>
        runBcdedit: (args: string[]) => Promise<string | null>
        enableGodMode: () => Promise<boolean>
        changeComputerName: (name: string) => Promise<boolean>
        launchControlPanel: (applet: string) => Promise<boolean>
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
        toggleCompactMode: (isCompact: boolean) => Promise<{ isCompact: boolean }>
    }
    updates: {
        checkForUpdates: () => Promise<any>
        downloadUpdate: () => void
        installUpdate: () => void
    }
    drivers: {
        getInstalled: () => Promise<any[]>
        scanUpdates: () => Promise<any[]>
        installUpdate: (title: string) => Promise<boolean>
        backup: (folderPath: string) => Promise<boolean>
        restore: (folderPath: string) => Promise<boolean>
    }
    processLasso: {
        getConfig: () => Promise<any>
        updateConfig: (cfg: any) => Promise<any>
        setAffinity: (pid: number, mask: number) => Promise<boolean>
        setIoPriority: (pid: number, level: string) => Promise<boolean>
        toggleCoreParking: (disable: boolean) => Promise<boolean>
        runSmartTrim: () => Promise<boolean>
    }
    gearup: {
        getCatalog: () => Promise<any[]>
        pingGameNodes: (gameId: string) => Promise<any[]>
        enableQosRouting: (gameExe: string, safeMode?: boolean) => Promise<boolean>
        boostGame: (gameId: string, safeMode?: boolean) => Promise<boolean>
        stopBoost: () => Promise<boolean>
        boostDownloads: () => Promise<boolean>
        addCustomGame: (name: string, exe: string) => Promise<any>
        purgeAllQosPolicies: () => Promise<boolean>
        syncDisplayRefreshRate: () => Promise<{ success: boolean; refreshRate: number; updatedConfigs: number }>
    }
    hone: {
        enableMsiMode: () => Promise<boolean>
        disableMsiMode: () => Promise<boolean>
        disableMouseAccel: () => Promise<boolean>
        applyPreset: () => Promise<{ success: boolean; appliedTweaks: number; message: string }>
    }
    exitlag: {
        getConfig: () => Promise<any>
        updateConfig: (cfg: any) => Promise<any>
        pingRoutes: (gameId: string) => Promise<any[]>
        enableMultipathRoute: (gameExe: string) => Promise<boolean>
        stopRoute: () => Promise<boolean>
    }
    heuristic: {
        getState: () => Promise<any>
        updateConfig: (cfg: any) => Promise<any>
        runSmartTrim: () => Promise<{ freedMb: number; success: boolean }>
        turboBoost: () => Promise<{ success: boolean; freedMb: number }>
    }
    performance: {
        getWin32PrioritySeparation: () => Promise<{ success: boolean; value: number }>
        setWin32PrioritySeparation: (value: number) => Promise<{ success: boolean; message: string }>
        getSpectreMitigationsStatus: () => Promise<{ success: boolean; disabled: boolean }>
        toggleSpectreMitigations: (disable: boolean) => Promise<{ success: boolean; message: string }>
        getHagsStatus: () => Promise<{ success: boolean; enabled: boolean; supported: boolean }>
        toggleHags: (enable: boolean) => Promise<{ success: boolean; message: string }>
        getMpoStatus: () => Promise<{ success: boolean; disabled: boolean }>
        disableMpo: () => Promise<{ success: boolean; message: string }>
        enableMpo: () => Promise<{ success: boolean; message: string }>
        disableFullscreenOptimizations: () => Promise<{ success: boolean; message: string }>
        killGameDvr: () => Promise<{ success: boolean; message: string }>
        getGpuInfo: () => Promise<{ success: boolean; gpus: Array<{ name: string; vram: string; driverVersion: string; driverDate: string }> }>
    }
    security: {
        getVbsStatus: () => Promise<{ success: boolean; enabled: boolean; hypervisorType: string }>
        toggleVbs: (enable: boolean) => Promise<{ success: boolean; message: string }>
        getHvciStatus: () => Promise<{ success: boolean; enabled: boolean }>
        toggleHvci: (enable: boolean) => Promise<{ success: boolean; message: string }>
        getExploitProtection: () => Promise<{ success: boolean; cfgEnabled: boolean; depEnabled: boolean; aslrEnabled: boolean }>
        toggleCfg: (enable: boolean) => Promise<{ success: boolean; message: string }>
        getSecurityOverview: () => Promise<{ success: boolean; status: { vbsEnabled: boolean; hvciEnabled: boolean; spectreDisabled: boolean; cfgEnabled: boolean; hypervisorType: string; securityScore: number } }>
    }
    memory: {
        getCompressionStatus: () => Promise<{ success: boolean; compression: boolean; pageCombining: boolean }>
        toggleCompression: (enable: boolean) => Promise<{ success: boolean; message: string }>
        togglePageCombining: (enable: boolean) => Promise<{ success: boolean; message: string }>
        getMemoryPressure: () => Promise<{ success: boolean; metrics: { totalPhysicalMB: number; freePhysicalMB: number; standbyCacheMB: number; committedMB: number; commitLimitMB: number; memoryCompression: boolean; pageCombining: boolean } }>
        purgeStandbyList: () => Promise<{ success: boolean; freedMB: number; message: string }>
        configureAutoPurge: (enabled: boolean, thresholdMB?: number, intervalSec?: number) => Promise<{ success: boolean; message: string }>
        getPagefileConfig: () => Promise<{ success: boolean; automatic: boolean; files: Array<{ path: string; initialMB: number; maxMB: number }> }>
        optimizePagefile: () => Promise<{ success: boolean; message: string }>
    }
    monitor: {
        getDpcMetrics: () => Promise<{ dpcPercent: number; interruptsPerSec: number; estimatedDpcLatencyUs: number }>
        getNetworkJitter: (target?: string) => Promise<{ latencyMs: number; jitterMs: number }>
        getOptimizationScore: () => Promise<{ score: number; breakdown: { network: number; kernel: number; gpu: number; memory: number; power: number } }>
        getSystemSnapshot: () => Promise<{ success: boolean; snapshot: any }>
        startLiveMonitor: () => Promise<{ success: boolean }>
        stopLiveMonitor: () => Promise<{ success: boolean }>
    }
    onLiveMonitorUpdate: (cb: (data: any) => void) => () => void
    ai: {
        checkStatus: () => Promise<{ online: boolean; endpoint: string; activeModel: string; availableModels: string[] }>
        setModel: (modelName: string) => Promise<{ activeModel: string }>
        query: (prompt: string, context?: any, queryId?: string, persona?: string) => void
        openWebModel: (service: string) => Promise<{ success: boolean; url: string }>
        getSettings: () => Promise<{ preferredProvider: string; hasCustomKeys: boolean; groqKey?: string; openrouterKey?: string; geminiKey?: string; cerebrasKey?: string; mistralKey?: string; sambanovaKey?: string }>
        saveSettings: (settings: any) => Promise<{ success: boolean }>
        getCatalogInfo: () => Promise<{ lastSynced: number; openrouterFreeModels: string[]; pollinationsModels: string[] }>
        refreshCatalog: () => Promise<{ lastSynced: number; openrouterFreeModels: string[]; pollinationsModels: string[] }>
    }
    onAiChunk: (cb: (data: { queryId: string; chunk: string; done: boolean; model?: string }) => void) => () => void
    onActivityState: (cb: (state: { activeGame: string | null; isGaming: boolean }) => void) => () => void
    onLogLine: (cb: (line: string) => void) => () => void
    offLogLine: () => void
    onAdminStatus: (cb: (ok: boolean) => void) => () => void
    onProgress: (cb: (data: { percent: number; message: string }) => void) => () => void
    onSystemStats: (cb: (stats: any) => void) => () => void
    openDialog: (opts: any) => Promise<any>
    saveDialog: (opts: any) => Promise<any>
}

declare global {
    interface Window {
        api: WindowApi
    }
}

export { }
