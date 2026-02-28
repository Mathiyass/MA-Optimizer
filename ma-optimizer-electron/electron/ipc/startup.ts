import { ipcMain } from 'electron'
import { escapePS, execPromise } from './utils'
import * as path from 'path'
import * as fs from 'fs'
import { sendLog, sendError } from './logger'

interface StartupItem {
    id: string
    name: string
    path: string
    source: string
    enabled: boolean
    publisher?: string
}

async function runPS(cmd: string): Promise<string> {
    try {
        const { stdout } = await execPromise(`powershell -NonInteractive -NoProfile -Command "${cmd}"`, {
            timeout: 10000, windowsHide: true,
        })
        return stdout.trim()
    } catch {
        return ''
    }
}

async function parseRunKey(hive: 'HKCU' | 'HKLM', source: string): Promise<StartupItem[]> {
    const items: StartupItem[] = []
    const regPath = `${hive}:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run`
    const ps = `$p = Get-ItemProperty -Path '${regPath}' -ErrorAction SilentlyContinue; if ($p) { $p | Get-Member -MemberType NoteProperty | Where-Object { $_.Name -notin @('PSPath','PSParentPath','PSChildName','PSDrive','PSProvider') } | ForEach-Object { [PSCustomObject]@{ Name=$_.Name; Value=$p."$($_.Name)" } } | ConvertTo-Json } else { '[]' }`
    const result = await runPS(ps)
    if (result && result !== '[]') {
        try {
            const parsed = JSON.parse(result)
            const entries = Array.isArray(parsed) ? parsed : [parsed]
            for (const e of entries) {
                if (e.Name && e.Value) {
                    items.push({
                        id: `${hive.toLowerCase()}_run_${e.Name}`,
                        name: e.Name,
                        path: String(e.Value),
                        source,
                        enabled: true,
                    })
                }
            }
        } catch { }
    }
    return items
}

async function getStartupItems(): Promise<StartupItem[]> {
    const items: StartupItem[] = []

    // HKCU Run
    const hkcuItems = await parseRunKey('HKCU', 'HKCU Run')
    items.push(...hkcuItems)

    // HKLM Run
    const hklmItems = await parseRunKey('HKLM', 'HKLM Run')
    items.push(...hklmItems)

    // Startup folders
    const startupFolders = [
        { source: 'Startup Folder', path: path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup') },
        { source: 'Common Startup', path: path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup') },
    ]

    for (const folder of startupFolders) {
        try {
            if (fs.existsSync(folder.path)) {
                const files = await fs.promises.readdir(folder.path)
                for (const file of files) {
                    if (file !== 'desktop.ini') {
                        items.push({
                            id: `folder_${folder.source}_${file}`,
                            name: path.basename(file, path.extname(file)),
                            path: path.join(folder.path, file),
                            source: folder.source,
                            enabled: true,
                        })
                    }
                }
            }
        } catch { }
    }

    // Disabled items from StartupApproved
    const approvedPath = `HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run`
    const ps = `$p = Get-ItemProperty -Path '${approvedPath}' -ErrorAction SilentlyContinue; if ($p) { $p | Get-Member -MemberType NoteProperty | Where-Object { $_.Name -notin @('PSPath','PSParentPath','PSChildName','PSDrive','PSProvider') } | ForEach-Object { $val = $p."$($_.Name)"; $bytes = [byte[]]$val; $enabled = $bytes[0] -ne 3; [PSCustomObject]@{ Name=$_.Name; Enabled=$enabled } } | ConvertTo-Json } else { '[]' }`
    const result = await runPS(ps)
    if (result && result !== '[]') {
        try {
            const parsed = JSON.parse(result)
            const entries = Array.isArray(parsed) ? parsed : [parsed]
            for (const e of entries) {
                const existing = items.find(i => i.name === e.Name)
                if (existing) {
                    existing.enabled = e.Enabled
                }
            }
        } catch { }
    }

    return items
}

ipcMain.handle('startup:list', async () => {
    try {
        return await getStartupItems()
    } catch (e: any) {
        sendError(`Failed to list startup items: ${e.message}`)
        return []
    }
})

ipcMain.handle('startup:toggle', async (_, id: string, enabled: boolean) => {
    try {
        if (id.startsWith('hkcu_run_')) {
            const name = id.replace('hkcu_run_', '')
            const ps = `$bytes = @(${enabled ? '2' : '3'},0,0,0,0,0,0,0,0,0,0,0); Set-ItemProperty -Path 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run' -Name '${escapePS(name)}' -Value ([byte[]]$bytes) -Type Binary`
            await runPS(ps)
        } else if (id.startsWith('hklm_run_')) {
            const name = id.replace('hklm_run_', '')
            const ps = `$bytes = @(${enabled ? '2' : '3'},0,0,0,0,0,0,0,0,0,0,0); Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run' -Name '${escapePS(name)}' -Value ([byte[]]$bytes) -Type Binary`
            await runPS(ps)
        }
        sendLog(`[Startup] ${enabled ? 'Enabled' : 'Disabled'} ${id}`)
        return true
    } catch (e: any) {
        sendError(`Failed to toggle startup ${id}: ${e.message}`)
        return false
    }
})

ipcMain.handle('startup:delete', async (_, id: string) => {
    try {
        if (id.startsWith('hkcu_run_')) {
            const name = id.replace('hkcu_run_', '')
            await runPS(`Remove-ItemProperty -Path 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run' -Name '${escapePS(name)}' -Force -ErrorAction SilentlyContinue`)
        } else if (id.startsWith('hklm_run_')) {
            const name = id.replace('hklm_run_', '')
            await runPS(`Remove-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run' -Name '${escapePS(name)}' -Force -ErrorAction SilentlyContinue`)
        } else if (id.startsWith('folder_')) {
            const currentItems = await getStartupItems()
            const item = currentItems.find(i => i.id === id)
            if (item && fs.existsSync(item.path)) {
                await fs.promises.unlink(item.path)
            }
        }
        sendLog(`[Startup] Deleted ${id}`)
        return true
    } catch (e: any) {
        sendError(`Failed to delete startup ${id}: ${e.message}`)
        return false
    }
})

ipcMain.handle('startup:add', async (_, name: string, exePath: string) => {
    try {
        await runPS(`Set-ItemProperty -Path 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run' -Name '${escapePS(name)}' -Value '"${escapePS(exePath)}"'`)
        sendLog(`[Startup] Added ${name}: ${exePath}`)
        return true
    } catch (e: any) {
        sendError(`Failed to add startup ${name}: ${e.message}`)
        return false
    }
})
