import { ipcMain } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { sendLog, sendError } from './logger'
import { escapePS, execPromise, spawnPromise } from './utils'

interface CleanerCategory {
    id: string
    name: string
    paths: string[]
    pattern?: string
}

function getEnv(name: string): string {
    return process.env[name] || ''
}

const categories: CleanerCategory[] = [
    // Windows Explorer
    { id: 'recent', name: 'Recent Documents', paths: [path.join(getEnv('APPDATA'), 'Microsoft', 'Windows', 'Recent')] },
    { id: 'thumbnails', name: 'Thumbnail Cache', paths: [path.join(getEnv('LOCALAPPDATA'), 'Microsoft', 'Windows', 'Explorer')], pattern: 'thumbcache_*.db' },
    { id: 'iconcache', name: 'Icon Cache', paths: [path.join(getEnv('LOCALAPPDATA'), 'Microsoft', 'Windows', 'Explorer')], pattern: 'iconcache_*.db' },
    // System
    { id: 'usertemp', name: 'User Temp', paths: [path.join(getEnv('LOCALAPPDATA'), 'Temp')] },
    { id: 'wintemp', name: 'Windows Temp', paths: ['C:\\Windows\\Temp'] },
    { id: 'prefetch', name: 'Prefetch', paths: ['C:\\Windows\\Prefetch'] },
    { id: 'wupdate', name: 'Windows Update Cache', paths: ['C:\\Windows\\SoftwareDistribution\\Download'] },
    { id: 'shader', name: 'DirectX Shader Cache', paths: [path.join(getEnv('LOCALAPPDATA'), 'D3DSCache'), path.join(getEnv('LOCALAPPDATA'), 'NVIDIA', 'GLCache')] },
    { id: 'wer', name: 'Windows Error Reports', paths: ['C:\\ProgramData\\Microsoft\\Windows\\WER'] },
    { id: 'dumps', name: 'Crash Dumps', paths: ['C:\\Windows\\Minidump', path.join(getEnv('LOCALAPPDATA'), 'CrashDumps')] },
    { id: 'logs', name: 'System Log Files', paths: ['C:\\Windows\\Logs'] },
    { id: 'delivery', name: 'Delivery Optimization', paths: ['C:\\Windows\\SoftwareDistribution\\DeliveryOptimization'] },
    { id: 'fontcache', name: 'Font Cache', paths: ['C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Local\\FontCache'] },
    { id: 'actioncenter', name: 'Action Center Backup', paths: [path.join(getEnv('LOCALAPPDATA'), 'Microsoft', 'Windows', 'ActionCenterCache')] },
    { id: 'windefender', name: 'Windows Defender History', paths: ['C:\\ProgramData\\Microsoft\\Windows Defender\\Scans\\History\\Results'] },
    // Applications (Third Party)
    { id: 'discord', name: 'Discord Cache', paths: [path.join(getEnv('APPDATA'), 'discord', 'Cache'), path.join(getEnv('APPDATA'), 'discord', 'Code Cache'), path.join(getEnv('APPDATA'), 'discord', 'GPUCache')] },
    { id: 'vscode', name: 'VS Code Cache', paths: [path.join(getEnv('APPDATA'), 'Code', 'Cache'), path.join(getEnv('APPDATA'), 'Code', 'CachedData'), path.join(getEnv('APPDATA'), 'Code', 'Code Cache')] },
    { id: 'slack', name: 'Slack Cache', paths: [path.join(getEnv('APPDATA'), 'Slack', 'Cache'), path.join(getEnv('APPDATA'), 'Slack', 'GPUCache')] },
    { id: 'spotify', name: 'Spotify Cache', paths: [path.join(getEnv('LOCALAPPDATA'), 'Spotify', 'Storage')] },
    {
        id: 'steam',
        name: 'Steam Caches',
        paths: [
            path.join(getEnv('PROGRAMFILES(X86)') || 'C:\\Program Files (x86)', 'Steam', 'appcache'),
            path.join(getEnv('PROGRAMFILES(X86)') || 'C:\\Program Files (x86)', 'Steam', 'depotcache'),
            path.join(getEnv('PROGRAMFILES(X86)') || 'C:\\Program Files (x86)', 'Steam', 'htmlcache'),
            path.join(getEnv('LOCALAPPDATA'), 'Steam', 'htmlcache')
        ]
    }
]

export function isDangerousPath(dirPath: string): boolean {
    if (!dirPath || typeof dirPath !== 'string' || !dirPath.trim()) return true
    const trimmed = dirPath.trim()
    // Block drive roots like C:, C:\, D:, D:\
    if (/^[a-zA-Z]:\\?$/.test(trimmed)) return true

    const normalized = path.resolve(trimmed).toLowerCase()
    const root = path.parse(normalized).root.toLowerCase()
    if (normalized === root || normalized.length <= 3) return true
    const userProfile = (getEnv('USERPROFILE') || '').toLowerCase()
    const appData = (getEnv('APPDATA') || '').toLowerCase()
    const localAppData = (getEnv('LOCALAPPDATA') || '').toLowerCase()
    const winDir = (getEnv('WINDIR') || 'c:\\windows').toLowerCase()
    const progFiles = (getEnv('PROGRAMFILES') || 'c:\\program files').toLowerCase()
    const progFilesX86 = (getEnv('PROGRAMFILES(X86)') || 'c:\\program files (x86)').toLowerCase()

    const blockedRoots = [
        'c:\\', 'd:\\', 'e:\\',
        winDir,
        path.join(winDir, 'system32').toLowerCase(),
        progFiles,
        progFilesX86,
        userProfile,
        appData,
        localAppData,
        path.join(appData, 'mozilla', 'firefox', 'profiles').toLowerCase(),
        path.join(progFilesX86, 'steam', 'userdata').toLowerCase(),
        path.join(progFiles, 'steam', 'userdata').toLowerCase()
    ]
    if (blockedRoots.some(b => b && normalized === b)) {
        return true
    }
    return false
}

async function getDirSize(dirPath: string, pattern?: string): Promise<number> {
    let size = 0
    try {
        if (!fs.existsSync(dirPath)) return 0
        const items = await fs.promises.readdir(dirPath, { withFileTypes: true })
        const promises = items.map(async (item) => {
            const full = path.join(dirPath, item.name)
            try {
                if (item.isDirectory()) {
                    return await getDirSize(full, pattern)
                } else if (item.isFile()) {
                    if (pattern) {
                        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i')
                        if (regex.test(item.name)) {
                            const stats = await fs.promises.stat(full)
                            return stats.size
                        }
                    } else {
                        const stats = await fs.promises.stat(full)
                        return stats.size
                    }
                }
            } catch { }
            return 0
        })
        const results = await Promise.all(promises)
        size = results.reduce((acc, s) => acc + s, 0)
    } catch { }
    return size
}

async function deleteDir(dirPath: string, pattern?: string): Promise<number> {
    if (isDangerousPath(dirPath)) {
        sendError(`[Cleaner] Blocked attempt to delete protected path: ${dirPath}`)
        return 0
    }
    let freed = 0
    try {
        if (!fs.existsSync(dirPath)) return 0
        const items = await fs.promises.readdir(dirPath, { withFileTypes: true })
        const promises = items.map(async (item) => {
            const full = path.join(dirPath, item.name)
            try {
                if (item.isDirectory()) {
                    const subFreed = await deleteDir(full, pattern)
                    try { await fs.promises.rmdir(full) } catch { }
                    return subFreed
                } else if (item.isFile()) {
                    if (pattern) {
                        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i')
                        if (regex.test(item.name)) {
                            const stats = await fs.promises.stat(full)
                            await fs.promises.unlink(full)
                            return stats.size
                        }
                    } else {
                        const stats = await fs.promises.stat(full)
                        await fs.promises.unlink(full)
                        return stats.size
                    }
                }
            } catch { }
            return 0
        })
        const results = await Promise.all(promises)
        freed = results.reduce((acc, f) => acc + f, 0)
    } catch { }
    return freed
}

function getFirefoxCacheDirs(): string[] {
    const localProfiles = path.join(getEnv('LOCALAPPDATA'), 'Mozilla', 'Firefox', 'Profiles')
    const dirs: string[] = []
    if (fs.existsSync(localProfiles)) {
        try {
            const entries = fs.readdirSync(localProfiles, { withFileTypes: true })
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const c2 = path.join(localProfiles, entry.name, 'cache2')
                    const sc = path.join(localProfiles, entry.name, 'startupCache')
                    if (fs.existsSync(c2)) dirs.push(c2)
                    if (fs.existsSync(sc)) dirs.push(sc)
                }
            }
        } catch { }
    }
    return dirs
}

function getFirefoxRoamingFiles(filename: string): string[] {
    const roamingProfiles = path.join(getEnv('APPDATA'), 'Mozilla', 'Firefox', 'Profiles')
    const files: string[] = []
    if (fs.existsSync(roamingProfiles)) {
        try {
            const entries = fs.readdirSync(roamingProfiles, { withFileTypes: true })
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const f = path.join(roamingProfiles, entry.name, filename)
                    if (fs.existsSync(f)) files.push(f)
                }
            }
        } catch { }
    }
    return files
}

// Scan categories for sizes
ipcMain.handle('cleaner:scan', async (_, categoryIds: string[]) => {
    const results: Record<string, number> = {}
    const cats = categoryIds.length > 0
        ? categories.filter(c => categoryIds.includes(c.id))
        : categories

    for (const cat of cats) {
        let totalSize = 0
        const pathsPromises = cat.paths.map(p => getDirSize(p, cat.pattern))
        const sizes = await Promise.all(pathsPromises)
        totalSize = sizes.reduce((acc, s) => acc + s, 0)

        results[cat.id] = totalSize
        sendLog(`[Cleaner] Scanned ${cat.name}: ${(totalSize / 1024 / 1024).toFixed(1)} MB`)
    }
    return { categories: categories.map(c => ({ id: c.id, name: c.name, size: results[c.id] || 0 })) }
})

// Clean selected categories
ipcMain.handle('cleaner:clean', async (_, categoryIds: string[]) => {
    let totalFreed = 0
    const cats = categoryIds.length > 0
        ? categories.filter(c => categoryIds.includes(c.id))
        : categories

    for (const cat of cats) {
        for (const p of cat.paths) {
            const freed = await deleteDir(p, cat.pattern)
            totalFreed += freed
            if (freed > 0) {
                sendLog(`[Cleaner] Cleaned ${cat.name} (${p}): ${(freed / 1024 / 1024).toFixed(1)} MB freed`)
            }
        }
    }

    // Flush DNS cache too
    try { await spawnPromise('ipconfig', ['/flushdns']) } catch { }

    sendLog(`[Cleaner] Total space freed: ${(totalFreed / 1024 / 1024).toFixed(1)} MB`)
    return { freed: totalFreed }
})

// Scan browsers
ipcMain.handle('cleaner:scanBrowsers', async () => {
    const localAppData = getEnv('LOCALAPPDATA')
    const appData = getEnv('APPDATA')

    const chromiumBrowsers = [
        {
            id: 'chrome', name: 'Google Chrome', profiles: [path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default')],
            items: [
                { id: 'cache', name: 'Internet Cache', sub: ['Cache', 'Code Cache'] },
                { id: 'cookies', name: 'Cookies', sub: ['Network\\Cookies'] },
                { id: 'history', name: 'History', sub: ['History'] }
            ]
        },
        {
            id: 'edge', name: 'Microsoft Edge', profiles: [path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default')],
            items: [
                { id: 'cache', name: 'Internet Cache', sub: ['Cache', 'Code Cache'] },
                { id: 'cookies', name: 'Cookies', sub: ['Network\\Cookies'] },
                { id: 'history', name: 'History', sub: ['History'] }
            ]
        },
        {
            id: 'brave', name: 'Brave', profiles: [path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data', 'Default')],
            items: [
                { id: 'cache', name: 'Internet Cache', sub: ['Cache', 'Code Cache'] },
                { id: 'cookies', name: 'Cookies', sub: ['Network\\Cookies'] },
                { id: 'history', name: 'History', sub: ['History'] }
            ]
        },
        {
            id: 'vivaldi', name: 'Vivaldi', profiles: [path.join(localAppData, 'Vivaldi', 'User Data', 'Default')],
            items: [
                { id: 'cache', name: 'Internet Cache', sub: ['Cache', 'Code Cache'] },
                { id: 'cookies', name: 'Cookies', sub: ['Network\\Cookies'] },
                { id: 'history', name: 'History', sub: ['History'] }
            ]
        },
        {
            id: 'opera', name: 'Opera', profiles: [path.join(appData, 'Opera Software', 'Opera Stable', 'Default')],
            items: [
                { id: 'cache', name: 'Internet Cache', sub: ['Cache', 'Code Cache'] },
                { id: 'cookies', name: 'Cookies', sub: ['Network\\Cookies'] },
                { id: 'history', name: 'History', sub: ['History'] }
            ]
        },
        {
            id: 'operagx', name: 'Opera GX', profiles: [path.join(appData, 'Opera Software', 'Opera GX Stable', 'Default')],
            items: [
                { id: 'cache', name: 'Internet Cache', sub: ['Cache', 'Code Cache'] },
                { id: 'cookies', name: 'Cookies', sub: ['Network\\Cookies'] },
                { id: 'history', name: 'History', sub: ['History'] }
            ]
        }
    ]

    const results = await Promise.all(chromiumBrowsers.map(async b => {
        let detected = false
        const scanItems = await Promise.all(b.items.map(async item => {
            let itemSize = 0
            const promises: Promise<number>[] = []
            for (const profile of b.profiles) {
                if (fs.existsSync(profile)) {
                    detected = true
                    if (item.sub.length > 0) {
                        const targets = item.sub.map(s => path.join(profile, s))
                        for (const t of targets) {
                            promises.push(getDirSize(t))
                        }
                    }
                }
            }
            const sizes = await Promise.all(promises)
            itemSize += sizes.reduce((acc, curr) => acc + curr, 0)
            return { id: item.id, name: item.name, size: itemSize }
        }))
        const totalSize = scanItems.reduce((acc, curr) => acc + curr.size, 0)
        return { id: b.id, name: b.name, detected, size: totalSize, items: scanItems }
    }))

    // Add Firefox specifically with safe path resolution
    const ffLocal = path.join(localAppData, 'Mozilla', 'Firefox')
    const ffRoaming = path.join(appData, 'Mozilla', 'Firefox')
    const ffDetected = fs.existsSync(ffLocal) || fs.existsSync(ffRoaming)

    let ffCacheSize = 0
    for (const cDir of getFirefoxCacheDirs()) {
        ffCacheSize += await getDirSize(cDir)
    }

    let ffCookiesSize = 0
    for (const cFile of getFirefoxRoamingFiles('cookies.sqlite')) {
        try {
            const st = await fs.promises.stat(cFile)
            ffCookiesSize += st.size
        } catch { }
    }

    let ffHistorySize = 0
    for (const hFile of getFirefoxRoamingFiles('places.sqlite')) {
        try {
            const st = await fs.promises.stat(hFile)
            ffHistorySize += st.size
        } catch { }
    }

    const ffItems = [
        { id: 'cache', name: 'Internet Cache', size: ffCacheSize },
        { id: 'cookies', name: 'Cookies', size: ffCookiesSize },
        { id: 'history', name: 'History', size: ffHistorySize }
    ]

    results.push({
        id: 'firefox',
        name: 'Firefox',
        detected: ffDetected,
        size: ffCacheSize + ffCookiesSize + ffHistorySize,
        items: ffItems
    })

    return results
})

// Clean browser caches
ipcMain.handle('cleaner:cleanBrowsers', async (_, browserSelections: { id: string, types: string[] }[]) => {
    const localAppData = getEnv('LOCALAPPDATA')
    const appData = getEnv('APPDATA')
    let totalFreed = 0

    const chromiumBrowsers = [
        {
            id: 'chrome', profiles: [path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default')],
            items: { cache: ['Cache', 'Code Cache'], cookies: ['Network\\Cookies'], history: ['History'] }
        },
        {
            id: 'edge', profiles: [path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default')],
            items: { cache: ['Cache', 'Code Cache'], cookies: ['Network\\Cookies'], history: ['History'] }
        },
        {
            id: 'brave', profiles: [path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data', 'Default')],
            items: { cache: ['Cache', 'Code Cache'], cookies: ['Network\\Cookies'], history: ['History'] }
        },
        {
            id: 'vivaldi', profiles: [path.join(localAppData, 'Vivaldi', 'User Data', 'Default')],
            items: { cache: ['Cache', 'Code Cache'], cookies: ['Network\\Cookies'], history: ['History'] }
        },
        {
            id: 'opera', profiles: [path.join(appData, 'Opera Software', 'Opera Stable', 'Default')],
            items: { cache: ['Cache', 'Code Cache'], cookies: ['Network\\Cookies'], history: ['History'] }
        },
        {
            id: 'operagx', profiles: [path.join(appData, 'Opera Software', 'Opera GX Stable', 'Default')],
            items: { cache: ['Cache', 'Code Cache'], cookies: ['Network\\Cookies'], history: ['History'] }
        }
    ]

    const promises: Promise<number>[] = []

    for (const selection of browserSelections) {
        const bid = selection.id

        if (bid === 'firefox') {
            for (const type of selection.types) {
                if (type === 'cache') {
                    for (const cDir of getFirefoxCacheDirs()) {
                        promises.push((async () => {
                            const freed = await deleteDir(cDir)
                            if (freed > 0) sendLog(`[Cleaner] Cleaned Firefox cache: ${(freed / 1024 / 1024).toFixed(1)} MB`)
                            return freed
                        })())
                    }
                } else if (type === 'cookies') {
                    for (const cFile of getFirefoxRoamingFiles('cookies.sqlite')) {
                        promises.push((async () => {
                            try {
                                const st = await fs.promises.stat(cFile)
                                await fs.promises.unlink(cFile)
                                sendLog(`[Cleaner] Cleaned Firefox cookies: ${(st.size / 1024 / 1024).toFixed(1)} MB`)
                                return st.size
                            } catch { return 0 }
                        })())
                    }
                } else if (type === 'history') {
                    for (const hFile of getFirefoxRoamingFiles('places.sqlite')) {
                        promises.push((async () => {
                            try {
                                const st = await fs.promises.stat(hFile)
                                await fs.promises.unlink(hFile)
                                sendLog(`[Cleaner] Cleaned Firefox history: ${(st.size / 1024 / 1024).toFixed(1)} MB`)
                                return st.size
                            } catch { return 0 }
                        })())
                    }
                }
            }
            continue
        }

        const browserDef = chromiumBrowsers.find(b => b.id === bid)
        if (!browserDef) continue

        for (const type of selection.types) {
            const subs = (browserDef.items as any)[type]
            if (subs && Array.isArray(subs) && subs.length > 0) {
                for (const profile of browserDef.profiles) {
                    const targets = subs.map((s: string) => path.join(profile, s))
                    for (const t of targets) {
                        promises.push((async () => {
                            const freed = await deleteDir(t)
                            if (freed > 0) sendLog(`[Cleaner] Cleaned ${bid} ${type}: ${(freed / 1024 / 1024).toFixed(1)} MB`)
                            return freed
                        })())
                    }
                }
            }
        }
    }

    const results = await Promise.all(promises)
    totalFreed = results.reduce((acc, f) => acc + f, 0)

    return { freed: totalFreed }
})

// Large files scanner
ipcMain.handle('cleaner:largeFiles', async (_, scanPath: string, minSize: number) => {
    const results: any[] = []
    async function scan(dir: string, depth = 0) {
        if (depth > 5 || results.length > 500) return
        try {
            const items = await fs.promises.readdir(dir, { withFileTypes: true })
            const promises = items.map(async (item) => {
                if (results.length > 500) return
                const full = path.join(dir, item.name)
                try {
                    if (item.isDirectory() && !item.name.startsWith('$') && item.name !== 'Windows' && item.name !== 'System Volume Information') {
                        await scan(full, depth + 1)
                    } else if (item.isFile()) {
                        const stats = await fs.promises.stat(full)
                        if (stats.size >= minSize) {
                            results.push({
                                name: item.name,
                                path: full,
                                size: stats.size,
                                modified: stats.mtime.toISOString(),
                                ext: path.extname(item.name).toLowerCase(),
                            })
                        }
                    }
                } catch { }
            })
            await Promise.all(promises)
        } catch { }
    }
    await scan(scanPath)
    results.sort((a, b) => b.size - a.size)
    return results.slice(0, 200)
})

// Disk usage
ipcMain.handle('cleaner:diskUsage', async (_, drive: string) => {
    try {
        const si = require('systeminformation')
        const fsData = await si.fsSize()
        const d = fsData.find((f: any) => f.mount?.startsWith(drive) || f.fs?.startsWith(drive))
        if (d) {
            return { total: d.size, used: d.used, free: d.available, usedPercent: d.use }
        }
        return null
    } catch { return null }
})

// Registry cleaner (simplified scan)
ipcMain.handle('cleaner:scanRegistry', async () => {
    sendLog('[Cleaner] Scanning registry for issues...')
    const results: any[] = []
    try {
        const ps = `Get-ChildItem "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall" | ForEach-Object { $key = $_; $path = (Get-ItemProperty $key.PSPath -ErrorAction SilentlyContinue).InstallLocation; if ($path -and !(Test-Path $path -ErrorAction SilentlyContinue)) { [PSCustomObject]@{ Type='Invalid Uninstall Entry'; Path=$key.PSPath; Detail="Missing: $path" } } } | ConvertTo-Json`
        const { stdout } = await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], {
            timeout: 30000,
        })
        const result = stdout.trim()
        if (result) {
            const parsed = JSON.parse(result)
            const items = Array.isArray(parsed) ? parsed : [parsed]
            results.push(...items)
        }
    } catch { }
    sendLog(`[Cleaner] Found ${results.length} registry issues`)
    return results
})

ipcMain.handle('cleaner:cleanRegistry', async (_, items: any[]) => {
    if (!items || items.length === 0) return { cleaned: 0 }
    let cleaned = 0
    try {
        const commands = items.map(item => `Remove-Item -LiteralPath '${escapePS(item.Path)}' -Recurse -Force -ErrorAction SilentlyContinue`).join('\n')
        const b64 = Buffer.from(commands, 'utf16le').toString('base64')
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-EncodedCommand', b64], {
            timeout: 30000,
            windowsHide: true
        })
        cleaned = items.length
    } catch (e: any) {
        sendError(`[Cleaner] Failed to clean registry: ${e.message}`)
    }
    sendLog(`[Cleaner] Fixed ${cleaned} registry issues`)
    return { cleaned }
})

ipcMain.handle('cleaner:emptyRecycleBin', async () => {
    try {
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', 'Clear-RecycleBin -Force -ErrorAction SilentlyContinue'], {
            timeout: 15000,
        })
        sendLog('[Cleaner] Recycle Bin emptied')
        return true
    } catch { return false }
})
