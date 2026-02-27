import { ipcMain, BrowserWindow, shell } from 'electron'
import { execSync } from 'child_process'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import { sendLog, sendError } from './logger'

// Get installed UWP apps
ipcMain.handle('advanced:getApps', async () => {
    try {
        const ps = `Get-AppxPackage -AllUsers | Select-Object Name,PackageFullName,InstallLocation,Publisher,IsFramework | Where-Object { $_.IsFramework -ne $true } | ConvertTo-Json -Depth 2`
        const result = execSync(`powershell -NonInteractive -NoProfile -Command "${ps}"`, {
            encoding: 'utf-8', timeout: 60000, windowsHide: true, maxBuffer: 10 * 1024 * 1024,
        }).trim()
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
    let removed = 0
    for (const name of names) {
        try {
            const ps = `Get-AppxPackage -AllUsers '*${name}*' | Remove-AppxPackage -AllUsers -ErrorAction SilentlyContinue`
            execSync(`powershell -NonInteractive -NoProfile -Command "${ps}"`, {
                encoding: 'utf-8', timeout: 30000, windowsHide: true,
            })
            removed++
            sendLog(`[Advanced] Removed ${name}`)
        } catch {
            sendLog(`[Advanced] Failed to remove ${name}`)
        }
    }
    sendLog(`[Advanced] Removed ${removed}/${names.length} apps`)
    return { removed, total: names.length }
})

// Get Windows Features
ipcMain.handle('advanced:getFeatures', async () => {
    try {
        const ps = `Get-WindowsOptionalFeature -Online | Select-Object FeatureName,State | ConvertTo-Json`
        const result = execSync(`powershell -NonInteractive -NoProfile -Command "${ps}"`, {
            encoding: 'utf-8', timeout: 60000, windowsHide: true, maxBuffer: 10 * 1024 * 1024,
        }).trim()
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
        const cmd = enable
            ? `Enable-WindowsOptionalFeature -Online -FeatureName '${name}' -All -NoRestart`
            : `Disable-WindowsOptionalFeature -Online -FeatureName '${name}' -NoRestart`
        execSync(`powershell -NonInteractive -NoProfile -Command "${cmd}"`, {
            encoding: 'utf-8', timeout: 120000, windowsHide: true,
        })
        sendLog(`[Advanced] ${enable ? 'Enabled' : 'Disabled'} feature: ${name}`)
        return true
    } catch (e: any) {
        sendError(`Failed to toggle feature ${name}: ${e.message}`)
        return false
    }
})

// BCDedit
ipcMain.handle('advanced:bcdedit', async (_, args: string) => {
    try {
        const result = execSync(`bcdedit ${args}`, {
            encoding: 'utf-8', timeout: 10000, windowsHide: true,
        }).trim()
        sendLog(`[Advanced] bcdedit ${args}`)
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
        const ps = `Rename-Computer -NewName '${name}' -Force`
        execSync(`powershell -NonInteractive -NoProfile -Command "${ps}"`, {
            encoding: 'utf-8', timeout: 15000, windowsHide: true,
        })
        sendLog(`[Advanced] Computer name changed to ${name} — restart required`)
        return true
    } catch (e: any) {
        sendError(`Failed to change computer name: ${e.message}`)
        return false
    }
})
