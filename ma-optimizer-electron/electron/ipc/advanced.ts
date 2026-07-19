import { ipcMain, BrowserWindow, shell } from 'electron'
import { execSync, spawnSync } from 'child_process'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import { sendLog, sendError } from './logger'
import { escapePS, spawnPromise } from './utils'

// Get installed UWP apps
ipcMain.handle('advanced:getApps', async () => {
    try {
        const ps = `Get-AppxPackage -AllUsers | Select-Object Name,PackageFullName,InstallLocation,Publisher,IsFramework | Where-Object { $_.IsFramework -ne $true } | ConvertTo-Json -Depth 2`
        const { stdout } = await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], {
            encoding: 'utf-8', timeout: 60000, maxBuffer: 10 * 1024 * 1024,
        })
        const result = stdout.trim()
        if (!result) return []
        const parsed = JSON.parse(result)
        return (Array.isArray(parsed) ? parsed : [parsed]).map((a: any) => ({
            name: a.Name,
            fullName: a.PackageFullName,
            publisher: a.Publisher,
            installLocation: a.InstallLocation,
        }))
    } catch (e: any) {
        sendError(`Failed to get installed apps: ${e.message}`)
        return []
    }
})

// Remove UWP apps
ipcMain.handle('advanced:removeApps', async (_, names: string[]) => {
    if (!names || names.length === 0) return { removed: 0, total: 0 }
    let removed = 0
    try {
        const filterList = names.map(n => `'*${escapePS(n)}*'`).join(', ')
        const ps = `@(${filterList}) | ForEach-Object { Get-AppxPackage -AllUsers $_ | Remove-AppxPackage -AllUsers -ErrorAction SilentlyContinue }`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], {
            timeout: 60000, encoding: 'utf-8',
        })
        removed = names.length
        sendLog(`[Advanced] Removed apps: ${names.join(', ')}`)
    } catch (e: any) {
        sendError(`[Advanced] Failed to remove apps: ${e.message}`)
    }
    return { removed, total: names.length }
})

// Get Windows Features
ipcMain.handle('advanced:getFeatures', async () => {
    try {
        const ps = `Get-WindowsOptionalFeature -Online | Select-Object FeatureName,State | ConvertTo-Json`
        const { stdout } = await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], {
            encoding: 'utf-8', timeout: 60000, maxBuffer: 10 * 1024 * 1024,
        })
        const result = stdout.trim()
        if (!result) return []
        const parsed = JSON.parse(result)
        return (Array.isArray(parsed) ? parsed : [parsed]).map((f: any) => ({
            name: f.FeatureName,
            enabled: f.State === 2 || f.State === 'Enabled',
        }))
    } catch (e: any) {
        sendError(`Failed to get Windows features: ${e.message}`)
        return []
    }
})

// Toggle Windows Feature
ipcMain.handle('advanced:toggleFeature', async (_, name: string, enable: boolean) => {
    try {
        const safeName = escapePS(name)
        const cmd = enable
            ? `Enable-WindowsOptionalFeature -Online -FeatureName '${safeName}' -All -NoRestart`
            : `Disable-WindowsOptionalFeature -Online -FeatureName '${safeName}' -NoRestart`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', cmd], {
            timeout: 120000, encoding: 'utf-8',
        })
        sendLog(`[Advanced] ${enable ? 'Enabled' : 'Disabled'} feature: ${name}`)
        return true
    } catch (e: any) {
        sendError(`Failed to toggle feature ${name}: ${e.message}`)
        return false
    }
})

// BCDedit
ipcMain.handle('advanced:bcdedit', async (_, args: string[]) => {
    try {
        if (!Array.isArray(args) || args.length === 0) {
            throw new Error('Invalid arguments: expected non-empty array')
        }

        // Restrict to informational subcommands only to prevent unauthorized system changes
        const allowedSubcommands = ['/enum', '/v', '/get']
        if (!allowedSubcommands.includes(args[0].toLowerCase())) {
            throw new Error(`Unauthorized bcdedit subcommand: ${args[0]}`)
        }

        // Regex to ensure arguments only contain safe characters
        const safeRegex = /^[a-zA-Z0-9\s\/\-\{\}\.]+$/
        for (const arg of args) {
            if (!safeRegex.test(arg)) {
                throw new Error(`Invalid characters in argument: ${arg}`)
            }
        }

        const { stdout } = await spawnPromise('bcdedit', args, {
            encoding: 'utf-8', timeout: 10000,
        })
        const result = stdout.trim()
        sendLog(`[Advanced] bcdedit ${args.join(' ')}`)
        return result
    } catch (e: any) {
        sendError(`bcdedit failed: ${e.message}`)
        return null
    }
})

// Enable God Mode
ipcMain.handle('advanced:godMode', async () => {
    try {
        const desktop = path.join(os.homedir(), 'Desktop')
        const godModeFolder = path.join(desktop, 'GodMode.{ED7BA470-8E54-465E-825C-99712043E01C}')
        if (!fs.existsSync(godModeFolder)) {
            fs.mkdirSync(godModeFolder)
        }
        sendLog('[Advanced] God Mode folder created on Desktop')
        shell.openPath(godModeFolder)
        return true
    } catch (e: any) {
        sendError(`Failed to create God Mode: ${e.message}`)
        return false
    }
})

// Change computer name
ipcMain.handle('advanced:computerName', async (_, name: string) => {
    try {
        const ps = `Rename-Computer -NewName '${escapePS(name)}' -Force`
        await spawnPromise('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], {
            timeout: 15000, encoding: 'utf-8',
        })
        sendLog(`[Advanced] Computer name changed to ${name} — restart required`)
        return true
    } catch (e: any) {
        sendError(`Failed to change computer name: ${e.message}`)
        return false
    }
})
