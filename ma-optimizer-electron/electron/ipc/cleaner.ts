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
    { id: 'steam', name: 'Steam Caches', paths: [path.join(getEnv('PROGRAMFILES(X86)') || 'C:\\Program Files (x86)', 'Steam', 'appcache'), path.join(getEnv('PROGRAMFILES(X86)') || 'C:\\Program Files (x86)', 'Steam', 'depotcache'), path.join(getEnv('PROGRAMFILES(X86)') || 'C:\\Program Files (x86)', 'Steam', 'userdata')] }
]

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

    const browsers = [
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
        },
        // Firefox uses dynamic profiles, simplified for now
        {
            id: 'firefox', name: 'Firefox', profiles: [path.join(appData, 'Mozilla', 'Firefox', 'Profiles')],
            items: [
                { id: 'cache', name: 'Internet Cache', sub: [] }
            ]
        }
    ]

    const results = await Promise.all(browsers.map(async b => {
        let detected = false
        const scanItems = await Promise.all(b.items.map(async item => {
            let itemSize = 0
            const promises: Promise<number>[] = []
            for (const profile of b.profiles) {
                if (fs.existsSync(profile)) {
                    detected = true
                    // if sub is empty, it means we scan the profile root itself (like Firefox)
                    const targets = item.sub.length > 0 ? item.sub.map(s => path.join(profile, s)) : [profile]
                    for (const t of targets) {
                        promises.push(getDirSize(t))
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
    return results
})

// Clean browser caches
ipcMain.handle('cleaner:cleanBrowsers', async (_, browserSelections: { id: string, types: string[] }[]) => {
    const localAppData = getEnv('LOCALAPPDATA')
    const appData = getEnv('APPDATA')
    let totalFreed = 0

    const browsers = [
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
        },
        {
            id: 'firefox', profiles: [path.join(appData, 'Mozilla', 'Firefox', 'Profiles')],
            items: { cache: [] }
        }
    ]

    const promises: Promise<number>[] = []

    for (const selection of browserSelections) {
        const bid = selection.id
        const browserDef = browsers.find(b => b.id === bid)
        if (!browserDef) continue

        for (const type of selection.types) {
            const subs = (browserDef.items as any)[type]
            if (subs) {
                for (const profile of browserDef.profiles) {
                    const targets = subs.length > 0 ? subs.map((s: string) => path.join(profile, s)) : [profile]
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
