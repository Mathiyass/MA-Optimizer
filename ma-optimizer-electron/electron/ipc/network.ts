import { ipcMain, BrowserWindow } from 'electron'
import { escapePS, execPromise, spawnPromise } from './utils'
import { spawn } from 'child_process'
import { sendLog, sendError } from './logger'

async function runCmd(cmd: string, args: string[] = [], timeout = 30000): Promise<string> {
    try {
        if (args.length > 0) {
            const { stdout } = await spawnPromise(cmd, args, { timeout })
            return stdout.trim()
        }
        const { stdout } = await execPromise(cmd, { timeout, windowsHide: true })
        return stdout.trim()
    } catch (e: any) {
        return e.stdout?.toString()?.trim() || e.message || ''
    }
}

// TCP Parameters
ipcMain.handle('network:getTcpParams', async () => {
    try {
        const ps = "Get-NetTCPSetting | Select-Object SettingName,AutoTuningLevelLocal,ScalingHeuristics,CongestionProvider,EcnCapability,InitialRto,MinRto | ConvertTo-Json"
        const result = await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        return JSON.parse(result)
    } catch {
        return null
    }
})

ipcMain.handle('network:setTcpParam', async (_, name: string, val: any) => {
    try {
        const safeName = String(name).replace(/[^a-zA-Z0-9]/g, '')
        const safeVal = String(val).replace(/[^a-zA-Z0-9]/g, '')
        await runCmd('netsh', ['int', 'tcp', 'set', 'global', `${safeName}=${safeVal}`])
        sendLog(`[Network] Set TCP ${name} = ${val}`)
        return true
    } catch (e: any) {
        sendError(`Failed to set TCP param ${name}: ${e.message}`)
        return false
    }
})

ipcMain.handle('network:netsh', async (_, args: string) => {
    // Basic argument scrubbing to defend against generic injection if someone manages to pass & or |
    const safeArgs = args.replace(/[&|;'`"]/g, '')
    return await runCmd(`netsh ${safeArgs}`)
})

ipcMain.handle('network:flushDns', async () => {
    const result = await runCmd('ipconfig', ['/flushdns'])
    sendLog('[Network] DNS cache flushed')
    return result
})

ipcMain.handle('network:resetWinsock', async () => {
    const result = await runCmd('netsh', ['winsock', 'reset'])
    sendLog('[Network] Winsock reset — restart required')
    return result
})

ipcMain.handle('network:resetTcpIp', async () => {
    const result = await runCmd('netsh', ['int', 'ip', 'reset'])
    sendLog('[Network] TCP/IP stack reset — restart required')
    return result
})

ipcMain.handle('network:setDns', async (_, adapter: string, primary: string, secondary: string) => {
    try {
        const safeAdapter = String(adapter)
        const safePrimary = String(primary).replace(/[^0-9.:a-fA-F]/g, '')
        const safeSecondary = String(secondary).replace(/[^0-9.:a-fA-F]/g, '')
        await runCmd('netsh', ['interface', 'ip', 'set', 'dns', `name=${safeAdapter}`, 'static', safePrimary])
        if (secondary) {
            await runCmd('netsh', ['interface', 'ip', 'add', 'dns', `name=${safeAdapter}`, safeSecondary, 'index=2'])
        }
        sendLog(`[Network] DNS set on ${adapter}: ${primary} / ${secondary}`)
        return true
    } catch (e: any) {
        sendError(`Failed to set DNS: ${e.message}`)
        return false
    }
})

ipcMain.handle('network:getAdapters', async () => {
    try {
        const ps = `Get-NetAdapter | Select-Object Name,InterfaceDescription,Status,MacAddress,LinkSpeed,MediaType | ConvertTo-Json`
        const result = await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        const parsed = JSON.parse(result)
        return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
        return []
    }
})

ipcMain.handle('network:ping', async (_, host: string) => {
    try {
        const safeHost = escapePS(host)
        const ps = `Test-Connection -ComputerName '${safeHost}' -Count 4 -ErrorAction SilentlyContinue | Select-Object Address,ResponseTime,StatusCode | ConvertTo-Json`
        const result = await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps], 15000)
        const data = JSON.parse(result)
        const pings = Array.isArray(data) ? data : [data]
        const times = pings.map((p: any) => p.ResponseTime || p.Latency || 0).filter((t: number) => t > 0)
        return {
            host,
            min: times.length ? Math.min(...times) : 0,
            avg: times.length ? Math.round(times.reduce((a: number, b: number) => a + b, 0) / times.length) : 0,
            max: times.length ? Math.max(...times) : 0,
            loss: Math.round(((4 - times.length) / 4) * 100),
        }
    } catch {
        return { host, min: 0, avg: 0, max: 0, loss: 100 }
    }
})

ipcMain.handle('network:detectMtu', async () => {
    try {
        let low = 576
        let high = 1500
        let mtu = 1500

        // Test targets: Cloudflare (1.1.1.1) and Google (8.8.8.8)
        const target = '1.1.1.1'

        while (low <= high) {
            const mid = Math.floor((low + high) / 2)
            const result = await runCmd('ping', ['-f', '-l', String(mid - 28), '-n', '1', target], 4000)

            if (!result.toLowerCase().includes('fragmented') && !result.toLowerCase().includes('too large') && !result.toLowerCase().includes('timed out')) {
                mtu = mid
                low = mid + 1
            } else {
                high = mid - 1
            }
        }

        sendLog(`[Network] Detected optimal MTU: ${mtu}`)
        return mtu
    } catch {
        return 1500
    }
})


ipcMain.handle('network:setMtu', async (_, adapter: string, size: number) => {
    try {
        const safeAdapter = String(adapter)
        const safeSize = parseInt(String(size)) || 1500
        await runCmd('netsh', ['interface', 'ipv4', 'set', 'subinterface', safeAdapter, `mtu=${safeSize}`, 'store=persistent'])
        sendLog(`[Network] Set MTU on ${adapter} to ${safeSize}`)
        return true
    } catch (e: any) {
        sendError(`Failed to set MTU: ${e.message}`)
        return false
    }
})

ipcMain.handle('network:openPorts', async () => {
    try {
        const ps = `Get-NetTCPConnection | Where-Object {$_.State -eq 'Listen' -or $_.State -eq 'Established'} | Select-Object LocalAddress,LocalPort,RemoteAddress,RemotePort,State,OwningProcess | ConvertTo-Json -Depth 2`
        const result = await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        const parsed = JSON.parse(result)
        return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
        return []
    }
})

ipcMain.handle('network:tracert', async (_, host: string) => {
    const safeHost = host.replace(/[&|;'`"<>]/g, '')
    const win = BrowserWindow.getAllWindows()[0]
    return new Promise((resolve) => {
        const proc = spawn('tracert', ['-d', '-w', '3000', safeHost], { windowsHide: true, shell: false })
        let output = ''
        proc.stdout.on('data', (d: Buffer) => {
            const line = d.toString().trim()
            if (line) {
                output += line + '\n'
                win?.webContents.send('log:line', `[tracert] ${line}`)
            }
        })
        proc.stderr.on('data', (d: Buffer) => {
            const line = d.toString().trim()
            if (line) output += line + '\n'
        })
        proc.on('close', () => resolve(output))
        setTimeout(() => { proc.kill(); resolve(output) }, 60000)
    })
})

ipcMain.handle('network:nslookup', async (_, host: string) => {
    const safeHost = String(host).replace(/[&|;'`"<>]/g, '')
    return await runCmd('nslookup', [safeHost], 10000)
})

ipcMain.handle('network:testPacketSize', async (_, host: string, bytes: number) => {
    try {
        const safeHost = String(host).replace(/[&|;'`"<>]/g, '')
        const safeBytes = Math.min(Math.max(64, parseInt(String(bytes)) || 1472), 1500)
        const start = Date.now()
        const result = await runCmd('ping', ['-f', '-l', String(safeBytes), '-n', '1', safeHost], 4000)
        const ms = Date.now() - start
        const isFragmented = result.toLowerCase().includes('fragmented') || result.toLowerCase().includes('too large')
        const isSuccess = !isFragmented && (result.toLowerCase().includes('bytes=') || result.toLowerCase().includes('reply from'))
        return { bytes: safeBytes, success: isSuccess, ms: isSuccess ? ms : -1 }
    } catch {
        return { bytes, success: false, ms: -1 }
    }
})

ipcMain.handle('network:exportTcpConfig', async () => {
    try {
        const ps = `Get-NetTCPSetting | ConvertTo-Json`
        const result = await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        return result
    } catch {
        return null
    }
})

ipcMain.handle('network:importTcpConfig', async (_, settings: any) => {
    try {
        if (!settings || typeof settings !== 'object') return false
        if (settings.AutoTuningLevelLocal) {
            await runCmd('netsh', ['int', 'tcp', 'set', 'global', `autotuninglevel=${settings.AutoTuningLevelLocal}`])
        }
        if (settings.CongestionProvider) {
            await runCmd('netsh', ['int', 'tcp', 'set', 'global', `congestionprovider=${settings.CongestionProvider}`])
        }
        if (settings.EcnCapability) {
            await runCmd('netsh', ['int', 'tcp', 'set', 'global', `ecncapability=${settings.EcnCapability}`])
        }
        sendLog('[Network] Imported TCP Configuration profile successfully')
        return true
    } catch (e: any) {
        sendError(`Failed to import TCP config: ${e.message}`)
        return false
    }
})

ipcMain.handle('network:benchmarkDns', async () => {
    const servers = [
        { name: 'Cloudflare', primary: '1.1.1.1', secondary: '1.0.0.1' },
        { name: 'Google Public DNS', primary: '8.8.8.8', secondary: '8.8.4.4' },
        { name: 'Quad9 Security', primary: '9.9.9.9', secondary: '149.112.112.112' },
        { name: 'AdGuard AdBlock', primary: '94.140.14.14', secondary: '94.140.15.15' },
        { name: 'OpenDNS Home', primary: '208.67.222.222', secondary: '208.67.220.220' },
    ]

    const results = []
    for (const s of servers) {
        try {
            const start = Date.now()
            const pingRes = await runCmd('ping', ['-n', '3', '-w', '1000', s.primary], 3500)
            const msMatch = pingRes.match(/Average\s*=\s*(\d+)ms/) || pingRes.match(/(\d+)ms/g)
            const latency = msMatch ? parseInt(Array.isArray(msMatch) ? msMatch[msMatch.length - 1] : msMatch[1]) : (Date.now() - start)
            results.push({ ...s, latency: isNaN(latency) ? 999 : latency })
        } catch {
            results.push({ ...s, latency: 999 })
        }
    }
    return results.sort((a, b) => a.latency - b.latency)
})

// NIC Hardware Advanced Properties (Interrupt Moderation, Flow Control, EEE, Selective Suspend)
ipcMain.handle('network:getNicAdvancedProps', async (_, adapterName: string) => {
    try {
        const safeAdapter = escapePS(adapterName || 'Ethernet')
        const ps = `Get-NetAdapterAdvancedProperty -Name '${safeAdapter}' -ErrorAction SilentlyContinue | Select-Object DisplayName,DisplayValue,RegistryKeyword,RegistryValue | ConvertTo-Json`
        const result = await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        if (!result) return []
        const parsed = JSON.parse(result)
        return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
        return []
    }
})

ipcMain.handle('network:setNicAdvancedProp', async (_, adapterName: string, propName: string, propValue: string) => {
    try {
        const safeAdapter = escapePS(adapterName || 'Ethernet')
        const safeProp = escapePS(propName)
        const safeVal = escapePS(propValue)
        const ps = `Set-NetAdapterAdvancedProperty -Name '${safeAdapter}' -DisplayName '${safeProp}' -DisplayValue '${safeVal}' -ErrorAction Stop`
        await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        sendLog(`[Network] Configured NIC hardware setting: ${propName} = ${propValue} on ${adapterName}`)
        return true
    } catch (e: any) {
        sendError(`[Network] Failed to set NIC property ${propName}: ${e.message}`)
        return false
    }
})

// True per-interface Nagle Killer (TcpNoDelay & TcpAckFrequency across active interface GUIDs)
ipcMain.handle('network:applyTcpNoDelayToAllInterfaces', async () => {
    try {
        const ps = `
$count = 0
$interfaces = Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\*'
foreach ($iface in $interfaces) {
    if ($iface.DhcpIPAddress -or $iface.IPAddress) {
        $path = $iface.PSPath
        Set-ItemProperty -Path $path -Name 'TcpNoDelay' -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $path -Name 'TcpAckFrequency' -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $path -Name 'TCPDelAckTicks' -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
        $count++
    }
}
$count
`
        const result = await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        const appliedCount = parseInt(result.trim()) || 0
        sendLog(`[Network] Injected True Nagle Killer (TcpNoDelay=1, TcpAckFrequency=1) across ${appliedCount} network adapter interfaces.`)
        return { applied: appliedCount, success: true }
    } catch (e: any) {
        sendError(`[Network] Failed to inject per-interface TCPNoDelay: ${e.message}`)
        return { applied: 0, success: false }
    }
})

// Windows QoS Game Policy Management
ipcMain.handle('network:getQosPolicies', async () => {
    try {
        const ps = `Get-NetQosPolicy -ErrorAction SilentlyContinue | Select-Object Name,AppPathName,DSCPValue,PriorityValue | ConvertTo-Json`
        const result = await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        if (!result) return []
        const parsed = JSON.parse(result)
        const list = Array.isArray(parsed) ? parsed : [parsed]
        return list.map((p: any) => ({
            name: p.Name || '',
            appName: p.AppPathName || '',
            dscp: p.DSCPValue || 0,
            priority: p.PriorityValue || 0
        }))
    } catch {
        return []
    }
})

ipcMain.handle('network:addQosPolicy', async (_, policyName: string, exeName: string) => {
    try {
        const safeName = escapePS(policyName)
        const safeExe = escapePS(exeName)
        const ps = `New-NetQosPolicy -Name '${safeName}' -AppPathName '${safeExe}' -DSCPAction 46 -PriorityValue 7 -NetworkProfile All -ErrorAction SilentlyContinue`
        await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        sendLog(`[Network] Created Windows QoS DSCP 46 high-priority routing policy: ${policyName} for ${exeName}`)
        return true
    } catch (e: any) {
        sendError(`[Network] Failed to create QoS policy: ${e.message}`)
        return false
    }
})

ipcMain.handle('network:removeQosPolicy', async (_, policyName: string) => {
    try {
        const safeName = escapePS(policyName)
        const ps = `Remove-NetQosPolicy -Name '${safeName}' -Confirm:$false -ErrorAction SilentlyContinue`
        await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        sendLog(`[Network] Removed Windows QoS policy: ${policyName}`)
        return true
    } catch (e: any) {
        sendError(`[Network] Failed to remove QoS policy: ${e.message}`)
        return false
    }
})

// eSports Hit Registration, NIC Sleep Kill & Winsock Kernel AFD Datagram Buffering
ipcMain.handle('network:applyHitregOptimization', async () => {
    try {
        const ps = `
Get-NetAdapter -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'Up' } | ForEach-Object {
    Set-NetAdapterAdvancedProperty -Name $_.Name -DisplayName 'Packet Priority & VLAN' -DisplayValue 'Packet Priority & VLAN Disabled' -ErrorAction SilentlyContinue
    Set-NetAdapterAdvancedProperty -Name $_.Name -DisplayName 'Idle power down restriction' -DisplayValue 'Enabled' -ErrorAction SilentlyContinue
}

$adaptersKey = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e972-e325-11ce-bfc1-08002be10318}'
Get-ChildItem $adaptersKey -ErrorAction SilentlyContinue | ForEach-Object {
    $props = Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue
    if ($props.DriverDesc) {
        Set-ItemProperty -Path $_.PSPath -Name 'PnPCapabilities' -Value 24 -Type DWord -Force -ErrorAction SilentlyContinue
    }
}

netsh int tcp set global rsc=disabled | Out-Null

$afdKey = 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Afd\\Parameters'
New-Item -Path $afdKey -Force -ErrorAction SilentlyContinue | Out-Null
Set-ItemProperty -Path $afdKey -Name 'FastSendDatagramThreshold' -Value 1024 -Type DWord -Force -ErrorAction SilentlyContinue
Set-ItemProperty -Path $afdKey -Name 'DefaultReceiveWindow' -Value 262144 -Type DWord -Force -ErrorAction SilentlyContinue
Set-ItemProperty -Path $afdKey -Name 'DefaultSendWindow' -Value 262144 -Type DWord -Force -ErrorAction SilentlyContinue

Clear-DnsClientCache -ErrorAction SilentlyContinue
`
        await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        sendLog('[Network] eSports Hit Registration & UDP Buffer optimization applied successfully.')
        return { success: true, message: 'Hit registration, NIC sleep kill, and Winsock buffers successfully optimized.' }
    } catch (e: any) {
        sendError(`[Network] Hitreg optimization failed: ${e.message}`)
        return { success: false, message: e.message }
    }
})

// Game Firewall & Anti-Cheat Healer
ipcMain.handle('network:healGameFirewall', async () => {
    try {
        const ps = `
$blockedRules = Get-NetFirewallRule -Action Block -Enabled True -ErrorAction SilentlyContinue | Where-Object {
    $_.DisplayName -match 'DeltaForce|UnrealCEF|Steam|Epic|AntiCheat|ACE|SGuard|EasyAntiCheat|BattlEye|Riot|Vanguard' -or
    (Get-NetFirewallApplicationFilter -AssociatedNetFirewallRule $_ -ErrorAction SilentlyContinue).Program -match 'DeltaForce|UnrealCEF|SGuard|ACE-Service|EasyAntiCheat|BEService'
}
$removed = 0
foreach ($r in $blockedRules) {
    Remove-NetFirewallRule -Name $r.Name -ErrorAction SilentlyContinue
    $removed++
}

$acePath = 'C:\\Program Files\\AntiCheatExpert'
if (Test-Path $acePath) {
    Get-ChildItem -Path $acePath -Filter '*.exe' -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
        New-NetFirewallRule -DisplayName "MA_Allow_$($_.BaseName)" -Direction Inbound -Program $_.FullName -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
        New-NetFirewallRule -DisplayName "MA_Allow_$($_.BaseName)_Out" -Direction Outbound -Program $_.FullName -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
    }
}
$removed
`
        const result = await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        const removedCount = parseInt(result.trim()) || 0
        sendLog(`[Firewall] Scanned and purged ${removedCount} blocking firewall rules; whitelisted anti-cheat services.`)
        return { success: true, removedBlocks: removedCount }
    } catch (e: any) {
        sendError(`[Firewall] Failed to heal firewall: ${e.message}`)
        return { success: false, removedBlocks: 0 }
    }
})

ipcMain.handle('network:purgeAllQosPolicies', async () => {
    try {
        const ps = `Get-NetQosPolicy -ErrorAction SilentlyContinue | Remove-NetQosPolicy -Confirm:$false -ErrorAction SilentlyContinue`
        await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        sendLog('[Network] Purged all active Windows NetQosPolicy rules to eliminate ONT packet-dropping traps.')
        return true
    } catch (e: any) {
        sendError(`[Network] Failed to purge QoS policies: ${e.message}`)
        return false
    }
})



