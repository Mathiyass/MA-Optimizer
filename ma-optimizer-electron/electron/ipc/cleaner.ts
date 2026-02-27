import { ipcMain, BrowserWindow } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { execSync } from 'child_process'
import { sendLog, sendError } from './logger'

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
    { id: 'wintemp', name: 'Windows Temp', paths: [path.join(os.tmpdir()), 'C:\\Windows\\Temp'] },
    { id: 'prefetch', name: 'Prefetch', paths: ['C:\\Windows\\Prefetch'] },
    { id: 'wupdate', name: 'Windows Update Cache', paths: ['C:\\Windows\\SoftwareDistribution\\Download'] },
    { id: 'thumbnails', name: 'Thumbnail Cache', paths: [path.join(getEnv('LOCALAPPDATA'), 'Microsoft', 'Windows', 'Explorer')], pattern: 'thumbcache_*.db' },
    { id: 'shader', name: 'DirectX Shader Cache', paths: [path.join(getEnv('LOCALAPPDATA'), 'D3DSCache')] },
    { id: 'wer', name: 'Windows Error Reports', paths: ['C:\\ProgramData\\Microsoft\\Windows\\WER'] },
    { id: 'dumps', name: 'Crash Dumps', paths: ['C:\\Windows\\Minidump', path.join(getEnv('LOCALAPPDATA'), 'CrashDumps')] },
    { id: 'logs', name: 'System Log Files', paths: ['C:\\Windows\\Logs'] },
    { id: 'delivery', name: 'Delivery Optimization', paths: ['C:\\Windows\\SoftwareDistribution\\DeliveryOptimization'] },
]

function getDirSize(dirPath: string, pattern?: string): number {
    let size = 0
    try {
        if (!fs.existsSync(dirPath)) return 0
        const items = fs.readdirSync(dirPath, { withFileTypes: true })
        for (const item of items) {
            const full = path.join(dirPath, item.name)
            try {
                if (item.isDirectory()) {
                    size += getDirSize(full, pattern)
                } else if (item.isFile()) {
                    if (pattern) {
                        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i')
                        if (regex.test(item.name)) {
                            size += fs.statSync(full).size
                        }
                    } else {
                        size += fs.statSync(full).size
                    }
                }
            } catch { }
        }
    } catch { }
    return size
}

function deleteDir(dirPath: string, pattern?: string): number {
    let freed = 0
    try {
        if (!fs.existsSync(dirPath)) return 0
        const items = fs.readdirSync(dirPath, { withFileTypes: true })
        for (const item of items) {
            const full = path.join(dirPath, item.name)
            try {
                if (item.isDirectory()) {
                    freed += deleteDir(full, pattern)
                    // Try removing empty dir
                    try { fs.rmdirSync(full) } catch { }
                } else if (item.isFile()) {
                    if (pattern) {
                        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i')
                        if (regex.test(item.name)) {
                            const size = fs.statSync(full).size
                            fs.unlinkSync(full)
                            freed += size
                        }
                    } else {
                        const size = fs.statSync(full).size
                        fs.unlinkSync(full)
                        freed += size
                    }
                }
            } catch { }
        }
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
        for (const p of cat.paths) {
            totalSize += getDirSize(p, cat.pattern)
        }
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
            const freed = deleteDir(p, cat.pattern)
            totalFreed += freed
            sendLog(`[Cleaner] Cleaned ${cat.name} (${p}): ${(freed / 1024 / 1024).toFixed(1)} MB freed`)
        }
    }

    // Flush DNS cache too
    if (categoryIds.includes('dns') || categoryIds.length === 0) {
        try { execSync('ipconfig /flushdns', { windowsHide: true }) } catch { }
    }

    sendLog(`[Cleaner] Total space freed: ${(totalFreed / 1024 / 1024).toFixed(1)} MB`)
    return { freed: totalFreed }
})

// Scan browsers
ipcMain.handle('cleaner:scanBrowsers', async () => {
    const localAppData = getEnv('LOCALAPPDATA')
    const appData = getEnv('APPDATA')

    const browsers = [
        { id: 'chrome', name: 'Google Chrome', paths: [path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Cache')] },
        { id: 'edge', name: 'Microsoft Edge', paths: [path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache')] },
        { id: 'firefox', name: 'Firefox', paths: [path.join(appData, 'Mozilla', 'Firefox', 'Profiles')] },
        { id: 'brave', name: 'Brave', paths: [path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data', 'Default', 'Cache')] },
        { id: 'opera', name: 'Opera', paths: [path.join(appData, 'Opera Software', 'Opera Stable', 'Cache')] },
        { id: 'operagx', name: 'Opera GX', paths: [path.join(appData, 'Opera Software', 'Opera GX Stable', 'Cache')] },
        { id: 'vivaldi', name: 'Vivaldi', paths: [path.join(localAppData, 'Vivaldi', 'User Data', 'Default', 'Cache')] },
    ]

    return browsers.map(b => {
        const exists = b.paths.some(p => fs.existsSync(p))
        let size = 0
        if (exists) {
            for (const p of b.paths) {
                size += getDirSize(p)
            }
        }
        return { id: b.id, name: b.name, detected: exists, size }
    })
})

// Clean browser caches
ipcMain.handle('cleaner:cleanBrowsers', async (_, browserIds: string[], types: string[]) => {
    const localAppData = getEnv('LOCALAPPDATA')
    const appData = getEnv('APPDATA')
    let totalFreed = 0

    const browserPaths: Record<string, string[]> = {
        chrome: [path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Cache')],
        edge: [path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache')],
        brave: [path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data', 'Default', 'Cache')],
        opera: [path.join(appData, 'Opera Software', 'Opera Stable', 'Cache')],
        operagx: [path.join(appData, 'Opera Software', 'Opera GX Stable', 'Cache')],
        vivaldi: [path.join(localAppData, 'Vivaldi', 'User Data', 'Default', 'Cache')],
    }

    for (const bid of browserIds) {
        const paths = browserPaths[bid] || []
        for (const p of paths) {
            const freed = deleteDir(p)
            totalFreed += freed
            sendLog(`[Cleaner] Cleaned ${bid} cache: ${(freed / 1024 / 1024).toFixed(1)} MB`)
        }
    }

    return { freed: totalFreed }
})

// Large files scanner
ipcMain.handle('cleaner:largeFiles', async (_, scanPath: string, minSize: number) => {
    const results: any[] = []
    function scan(dir: string, depth = 0) {
        if (depth > 5 || results.length > 500) return
        try {
            const items = fs.readdirSync(dir, { withFileTypes: true })
            for (const item of items) {
                if (results.length > 500) break
                const full = path.join(dir, item.name)
                try {
                    if (item.isDirectory() && !item.name.startsWith('$') && item.name !== 'Windows' && item.name !== 'System Volume Information') {
                        scan(full, depth + 1)
                    } else if (item.isFile()) {
                        const stats = fs.statSync(full)
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
            }
        } catch { }
    }
    scan(scanPath)
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
    // Scan for invalid uninstall entries
    const results: any[] = []
    try {
        const ps = `Get-ChildItem "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall" | ForEach-Object { $key = $_; $path = (Get-ItemProperty $key.PSPath -ErrorAction SilentlyContinue).InstallLocation; if ($path -and !(Test-Path $path -ErrorAction SilentlyContinue)) { [PSCustomObject]@{ Type='Invalid Uninstall Entry'; Path=$key.PSPath; Detail="Missing: $path" } } } | ConvertTo-Json`
        const result = execSync(`powershell -NonInteractive -NoProfile -Command "${ps}"`, {
            encoding: 'utf-8', timeout: 30000, windowsHide: true,
        }).trim()
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
    let cleaned = 0
    for (const item of items) {
        try {
            execSync(`powershell -NonInteractive -NoProfile -Command "Remove-Item '${item.Path}' -Recurse -Force -ErrorAction SilentlyContinue"`, {
                encoding: 'utf-8', timeout: 10000, windowsHide: true,
            })
            cleaned++
        } catch { }
    }
    sendLog(`[Cleaner] Fixed ${cleaned} registry issues`)
    return { cleaned }
})

ipcMain.handle('cleaner:emptyRecycleBin', async () => {
    try {
        execSync('powershell -NonInteractive -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"', {
            encoding: 'utf-8', timeout: 15000, windowsHide: true,
        })
        sendLog('[Cleaner] Recycle Bin emptied')
        return true
    } catch { return false }
})
