import { contextBridge, ipcRenderer } from 'electron'

// 🔧 FIX: Strict Input Validation Helper
// Validates types of arguments before hitting IPC to prevent injection, DoS, and unexpected behavior
function validate(args: any[], types: string[]) {
    if (args.length !== types.length) {
        throw new Error('Argument length mismatch');
    }
    for (let i = 0; i < types.length; i++) {
        const type = types[i];
        const arg = args[i];

        if (type === 'array') {
            if (!Array.isArray(arg)) throw new Error(`Argument ${i} must be an array`);
        } else if (type === 'object') {
            if (arg === null || typeof arg !== 'object' || Array.isArray(arg)) {
                throw new Error(`Argument ${i} must be a non-null object`);
            }
        } else if (typeof arg !== type) {
            throw new Error(`Argument ${i} must be of type ${type}`);
        }
    }
}

contextBridge.exposeInMainWorld('api', {
    registry: {
        get: (hive: string, path: string, name: string) => {
            validate([hive, path, name], ['string', 'string', 'string'])
            return ipcRenderer.invoke('registry:get', hive, path, name)
        },
        set: (hive: string, path: string, name: string, value: any, type: string) => {
            validate([hive, path, name, type], ['string', 'string', 'string', 'string'])
            return ipcRenderer.invoke('registry:set', hive, path, name, value, type)
        },
        delete: (hive: string, path: string, name: string) => {
            validate([hive, path, name], ['string', 'string', 'string'])
            return ipcRenderer.invoke('registry:delete', hive, path, name)
        },
        backup: () => ipcRenderer.invoke('registry:backup'),
        restoreAll: () => ipcRenderer.invoke('registry:restoreAll'),
        restoreLast: () => ipcRenderer.invoke('registry:restoreLast'),
    },
    powerPlan: {
        create: () => ipcRenderer.invoke('powerplan:create'),
        activate: () => ipcRenderer.invoke('powerplan:activate'),
        deactivate: () => ipcRenderer.invoke('powerplan:deactivate'),
        isActive: () => ipcRenderer.invoke('powerplan:isActive'),
        exists: () => ipcRenderer.invoke('powerplan:exists'),
        getActive: () => ipcRenderer.invoke('powerplan:getActive'),
        listAll: () => ipcRenderer.invoke('powerplan:listAll'),
        activatePlanByGuid: (guid: string) => {
            validate([guid], ['string'])
            return ipcRenderer.invoke('powerplan:activateByGuid', guid)
        },
        setTimerResolution: (ns: number) => {
            validate([ns], ['number'])
            return ipcRenderer.invoke('powerplan:setTimer', ns)
        },
        getTimerResolution: () => ipcRenderer.invoke('powerplan:getTimer'),
        applyProfile: (p: string) => {
            validate([p], ['string'])
            return ipcRenderer.invoke('powerplan:applyProfile', p)
        },
        generateEnergyReport: () => ipcRenderer.invoke('powerplan:energyReport'),
        generateBatteryReport: () => ipcRenderer.invoke('powerplan:batteryReport'),
        generateSleepStudy: () => ipcRenderer.invoke('powerplan:sleepStudy'),
        exportPlan: (path: string) => {
            validate([path], ['string'])
            return ipcRenderer.invoke('powerplan:export', path)
        },
        importPlan: (path: string) => {
            validate([path], ['string'])
            return ipcRenderer.invoke('powerplan:import', path)
        },
        delete: () => ipcRenderer.invoke('powerplan:delete'),
    },
    system: {
        getCpuUsage: () => ipcRenderer.invoke('system:cpuUsage'),
        getRamUsage: () => ipcRenderer.invoke('system:ramUsage'),
        getDiskIO: () => ipcRenderer.invoke('system:diskIO'),
        getNetworkSpeed: () => ipcRenderer.invoke('system:networkSpeed'),
        getFullInfo: () => ipcRenderer.invoke('system:fullInfo'),
        getProcesses: () => ipcRenderer.invoke('system:processes'),
        killProcess: (pid: number) => {
            validate([pid], ['number'])
            return ipcRenderer.invoke('system:killProcess', pid)
        },
        setProcessPriority: (pid: number, p: number) => {
            validate([pid, p], ['number', 'number'])
            return ipcRenderer.invoke('system:setPriority', pid, p)
        },
        openPath: (p: string) => {
            validate([p], ['string'])
            return ipcRenderer.invoke('system:openPath', p)
        },
        runTool: (cmd: string) => {
            validate([cmd], ['string'])
            return ipcRenderer.invoke('system:runTool', cmd)
        },
        cleanRam: () => ipcRenderer.invoke('system:cleanRam'),
    },
    services: {
        list: () => ipcRenderer.invoke('services:list'),
        setStartup: (name: string, mode: string) => {
            validate([name, mode], ['string', 'string'])
            return ipcRenderer.invoke('services:setStartup', name, mode)
        },
        start: (name: string) => {
            validate([name], ['string'])
            return ipcRenderer.invoke('services:start', name)
        },
        stop: (name: string) => {
            validate([name], ['string'])
            return ipcRenderer.invoke('services:stop', name)
        },
        applyRecommended: () => ipcRenderer.invoke('services:applyRecommended'),
    },
    network: {
        getTcpParams: () => ipcRenderer.invoke('network:getTcpParams'),
        setTcpParam: (name: string, val: any) => {
            validate([name], ['string'])
            return ipcRenderer.invoke('network:setTcpParam', name, val)
        },
        runNetsh: (args: string) => {
            validate([args], ['string'])
            return ipcRenderer.invoke('network:netsh', args)
        },
        flushDns: () => ipcRenderer.invoke('network:flushDns'),
        resetWinsock: () => ipcRenderer.invoke('network:resetWinsock'),
        resetTcpIp: () => ipcRenderer.invoke('network:resetTcpIp'),
        setDns: (adapter: string, p: string, s: string) => {
            validate([adapter, p, s], ['string', 'string', 'string'])
            return ipcRenderer.invoke('network:setDns', adapter, p, s)
        },
        getAdapters: () => ipcRenderer.invoke('network:getAdapters'),
        pingTest: (host: string) => {
            validate([host], ['string'])
            return ipcRenderer.invoke('network:ping', host)
        },
        detectMtu: () => ipcRenderer.invoke('network:detectMtu'),
        setMtu: (adapter: string, size: number) => {
            validate([adapter, size], ['string', 'number'])
            return ipcRenderer.invoke('network:setMtu', adapter, size)
        },
        getOpenPorts: () => ipcRenderer.invoke('network:openPorts'),
        tracert: (host: string) => {
            validate([host], ['string'])
            return ipcRenderer.invoke('network:tracert', host)
        },
        nslookup: (host: string) => {
            validate([host], ['string'])
            return ipcRenderer.invoke('network:nslookup', host)
        },
    },
    cleaner: {
        scan: (categories: string[]) => {
            validate([categories], ['array'])
            return ipcRenderer.invoke('cleaner:scan', categories)
        },
        clean: (categories: string[]) => {
            validate([categories], ['array'])
            return ipcRenderer.invoke('cleaner:clean', categories)
        },
        scanBrowsers: () => ipcRenderer.invoke('cleaner:scanBrowsers'),
        cleanBrowsers: (selections: { id: string, types: string[] }[]) => {
            validate([selections], ['array'])
            return ipcRenderer.invoke('cleaner:cleanBrowsers', selections)
        },
        getLargeFiles: (path: string, minSize: number) => {
            validate([path, minSize], ['string', 'number'])
            return ipcRenderer.invoke('cleaner:largeFiles', path, minSize)
        },
        getDiskUsage: (drive: string) => {
            validate([drive], ['string'])
            return ipcRenderer.invoke('cleaner:diskUsage', drive)
        },
        scanRegistry: () => ipcRenderer.invoke('cleaner:scanRegistry'),
        cleanRegistry: (items: any[]) => {
            validate([items], ['array'])
            return ipcRenderer.invoke('cleaner:cleanRegistry', items)
        },
        emptyRecycleBin: () => ipcRenderer.invoke('cleaner:emptyRecycleBin'),
    },
    startup: {
        list: () => ipcRenderer.invoke('startup:list'),
        toggle: (id: string, enabled: boolean) => {
            validate([id, enabled], ['string', 'boolean'])
            return ipcRenderer.invoke('startup:toggle', id, enabled)
        },
        delete: (id: string) => {
            validate([id], ['string'])
            return ipcRenderer.invoke('startup:delete', id)
        },
        add: (name: string, path: string) => {
            validate([name, path], ['string', 'string'])
            return ipcRenderer.invoke('startup:add', name, path)
        },
        refresh: () => ipcRenderer.invoke('startup:list'),
    },
    winget: {
        isInstalled: () => ipcRenderer.invoke('winget:isInstalled'),
        listInstalled: () => ipcRenderer.invoke('winget:listInstalled'),
        install: (id: string) => {
            validate([id], ['string'])
            return ipcRenderer.invoke('winget:install', id)
        },
        uninstall: (id: string) => {
            validate([id], ['string'])
            return ipcRenderer.invoke('winget:uninstall', id)
        },
        upgradeAll: () => ipcRenderer.invoke('winget:upgradeAll'),
        search: (query: string) => {
            validate([query], ['string'])
            return ipcRenderer.invoke('winget:search', query)
        },
        checkUpdate: (id: string) => {
            validate([id], ['string'])
            return ipcRenderer.invoke('winget:checkUpdate', id)
        },
        getIcon: (appName: string) => {
            validate([appName], ['string'])
            return ipcRenderer.invoke('winget:getIcon', appName)
        },
    },
    repair: {
        runSfc: () => ipcRenderer.invoke('repair:sfc'),
        runDism: (action: string) => {
            validate([action], ['string'])
            return ipcRenderer.invoke('repair:dism', action)
        },
        createSystemRestorePoint: (desc: string) => {
            validate([desc], ['string'])
            return ipcRenderer.invoke('repair:createRestorePoint', desc)
        },
        listRestorePoints: () => ipcRenderer.invoke('repair:listRestorePoints'),
        resetNetwork: () => ipcRenderer.invoke('repair:resetNetwork'),
        resetWindowsUpdate: () => ipcRenderer.invoke('repair:resetWU'),
        wsreset: () => ipcRenderer.invoke('repair:wsreset'),
        reregisterApps: () => ipcRenderer.invoke('repair:reregisterApps'),
        fixHosts: () => ipcRenderer.invoke('repair:fixHosts'),
        rebuildIconCache: () => ipcRenderer.invoke('repair:iconCache'),
        checkDisk: (drive: string) => {
            validate([drive], ['string'])
            return ipcRenderer.invoke('repair:chkdsk', drive)
        },
        runMemDiag: () => ipcRenderer.invoke('repair:memdiag'),
    },
    createRestorePoint: () => ipcRenderer.invoke('create-restore-point'),
    advanced: {
        getInstalledApps: () => ipcRenderer.invoke('advanced:getApps'),
        removeApps: (names: string[]) => {
            validate([names], ['array'])
            return ipcRenderer.invoke('advanced:removeApps', names)
        },
        getWindowsFeatures: () => ipcRenderer.invoke('advanced:getFeatures'),
        toggleFeature: (name: string, enable: boolean) => {
            validate([name, enable], ['string', 'boolean'])
            return ipcRenderer.invoke('advanced:toggleFeature', name, enable)
        },
        runBcdedit: (args: string[]) => {
            validate([args], ['array'])
            return ipcRenderer.invoke('advanced:bcdedit', args)
        },
        enableGodMode: () => ipcRenderer.invoke('advanced:godMode'),
        changeComputerName: (name: string) => {
            validate([name], ['string'])
            return ipcRenderer.invoke('advanced:computerName', name)
        },
    },
    benchmark: {
        runCpu: () => ipcRenderer.invoke('benchmark:cpu'),
        runMemory: () => ipcRenderer.invoke('benchmark:memory'),
        runDisk: (drive: string) => {
            validate([drive], ['string'])
            return ipcRenderer.invoke('benchmark:disk', drive)
        },
    },
    backup: {
        export: (path: string) => {
            validate([path], ['string'])
            return ipcRenderer.invoke('backup:export', path)
        },
        import: (path: string) => {
            validate([path], ['string'])
            return ipcRenderer.invoke('backup:import', path)
        },
        undoAll: () => ipcRenderer.invoke('backup:undoAll'),
        undoLast: () => ipcRenderer.invoke('backup:undoLast'),
    },
    admin: {
        isAdmin: () => ipcRenderer.invoke('admin:isAdmin'),
        relaunchAsAdmin: () => ipcRenderer.send('admin:relaunch'),
    },
    window: {
        minimize: () => ipcRenderer.send('window:minimize'),
        maximize: () => ipcRenderer.send('window:maximize'),
        close: () => ipcRenderer.send('window:close'),
        isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    },
    updates: {
        checkForUpdates: () => ipcRenderer.invoke('updates:check'),
        downloadUpdate: () => ipcRenderer.send('updates:download'),
        installUpdate: () => ipcRenderer.send('updates:install'),
    },
    drivers: {
        getInstalled: () => ipcRenderer.invoke('drivers:getInstalled'),
        scanUpdates: () => ipcRenderer.invoke('drivers:scanUpdates'),
        installUpdate: (title: string) => {
            validate([title], ['string'])
            return ipcRenderer.invoke('drivers:installUpdate', title)
        },
        backup: (folderPath: string) => {
            validate([folderPath], ['string'])
            return ipcRenderer.invoke('drivers:backup', folderPath)
        },
    },
    onLogLine: (cb: (line: string) => void) => {
        const listener = (_: any, line: string) => cb(line)
        ipcRenderer.on('log:line', listener)
        return () => ipcRenderer.removeListener('log:line', listener)
    },
    onProgress: (cb: (data: { percent: number; message: string }) => void) => {
        const listener = (_: any, data: { percent: number; message: string }) => cb(data)
        ipcRenderer.on('log:progress', listener)
        return () => ipcRenderer.removeListener('log:progress', listener)
    },
    offLogLine: () => ipcRenderer.removeAllListeners('log:line'),
    onAdminStatus: (cb: (ok: boolean) => void) => {
        const listener = (_: any, ok: boolean) => cb(ok)
        ipcRenderer.on('admin:status', listener)
        return () => ipcRenderer.removeListener('admin:status', listener)
    },
    onSystemStats: (cb: (stats: any) => void) => {
        const listener = (_: any, stats: any) => cb(stats)
        ipcRenderer.on('system:stats', listener)
        return () => ipcRenderer.removeListener('system:stats', listener)
    },
    openDialog: (opts: any) => {
        validate([opts], ['object'])
        return ipcRenderer.invoke('dialog:open', opts)
    },
    saveDialog: (opts: any) => {
        validate([opts], ['object'])
        return ipcRenderer.invoke('dialog:save', opts)
    },
})
