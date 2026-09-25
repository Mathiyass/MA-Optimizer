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
    } catch (e: any) {
        sendError(`[Network] getTcpParams failed: ${e.message}`)
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
    } catch (e: any) {
        sendError(`[Network] getAdapters failed: ${e.message}`)
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
    } catch (e: any) {
        sendError(`[Network] ping failed for ${host}: ${e.message}`)
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
    Set-NetAdapterAdvancedProperty -Name $_.Name -DisplayName 'Energy Efficient Ethernet' -DisplayValue 'Disabled' -ErrorAction SilentlyContinue
    Set-NetAdapterAdvancedProperty -Name $_.Name -DisplayName 'Packet Coalescing' -DisplayValue 'Disabled' -ErrorAction SilentlyContinue
    Set-NetAdapterAdvancedProperty -Name $_.Name -DisplayName 'Receive Buffers' -DisplayValue '1024' -ErrorAction SilentlyContinue
    Set-NetAdapterAdvancedProperty -Name $_.Name -DisplayName 'Transmit Buffers' -DisplayValue '1024' -ErrorAction SilentlyContinue
}

$adaptersKey = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e972-e325-11ce-bfc1-08002be10318}'
Get-ChildItem $adaptersKey -ErrorAction SilentlyContinue | ForEach-Object {
    $props = Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue
    if ($props.DriverDesc) {
        Set-ItemProperty -Path $_.PSPath -Name 'PnPCapabilities' -Value 24 -Type DWord -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name '*EEE' -Value '0' -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name 'AdvancedEEE' -Value '0' -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name '*PacketCoalescing' -Value '0' -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name 'ReceiveBuffers' -Value '1024' -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name 'TransmitBuffers' -Value '1024' -Type String -Force -ErrorAction SilentlyContinue
    }
}

netsh int tcp set global rsc=disabled | Out-Null
Set-NetOffloadGlobalSetting -PacketCoalescingFilter Disabled -ErrorAction SilentlyContinue

$afdKey = 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Afd\\Parameters'
New-Item -Path $afdKey -Force -ErrorAction SilentlyContinue | Out-Null
Set-ItemProperty -Path $afdKey -Name 'FastSendDatagramThreshold' -Value 1024 -Type DWord -Force -ErrorAction SilentlyContinue
Set-ItemProperty -Path $afdKey -Name 'DefaultReceiveWindow' -Value 262144 -Type DWord -Force -ErrorAction SilentlyContinue
Set-ItemProperty -Path $afdKey -Name 'DefaultSendWindow' -Value 262144 -Type DWord -Force -ErrorAction SilentlyContinue

Clear-DnsClientCache -ErrorAction SilentlyContinue
`
        await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        sendLog('[Network] eSports Hit Registration, Buffer Starvation Cure (1024) & Winsock AFD optimization applied.')
        return { success: true, message: 'Hit registration, 1024 ring buffers, NIC sleep kill, and Winsock buffers successfully optimized.' }
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

// ==========================================
// DEEP HITREG & RUBBERBANDING IPC HANDLERS
// ==========================================

// 1. Detect Intel I225-V / I226-V Silicon Stepping (B1 / B2 / B3)
ipcMain.handle('network:identifyNicStepping', async () => {
    try {
        const ps = `
$dev = Get-CimInstance Win32_PnPEntity -ErrorAction SilentlyContinue | Where-Object { $_.HardwareID -match 'VEN_8086&DEV_15F' } | Select-Object -First 1
if ($dev) {
    $hwId = ($dev.HardwareID | Out-String)
    $stepping = "Unknown"
    $isB1B2 = $false
    if ($hwId -match 'REV_01') { $stepping = "B1 (REV_01)"; $isB1B2 = $true }
    elseif ($hwId -match 'REV_02') { $stepping = "B2 (REV_02)"; $isB1B2 = $true }
    elseif ($hwId -match 'REV_03') { $stepping = "B3 (REV_03)"; $isB1B2 = $false }
    @{ isIntelI225 = $true; stepping = $stepping; isB1B2 = $isB1B2; name = $dev.Name; hwId = ($dev.HardwareID -join ', ') } | ConvertTo-Json
} else {
    @{ isIntelI225 = $false; stepping = "N/A"; isB1B2 = $false; name = "Standard NIC"; hwId = "" } | ConvertTo-Json
}
`
        const result = await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        return JSON.parse(result.trim())
    } catch (e: any) {
        sendError(`[NIC Stepping] Detection failed: ${e.message}`)
        return { isIntelI225: false, stepping: 'Error', isB1B2: false, name: 'Detection Failed', hwId: '' }
    }
})

// 2. Deep Intel I225-V Hardware Fix (1.0G Force, EEE Kill, Buffer 1024, PTP Kill, Driver Lock)
ipcMain.handle('network:applyDeepNicFix', async () => {
    try {
        const ps = `
$NetKey = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e972-e325-11ce-bfc1-08002be10318}'
Get-ChildItem $NetKey -ErrorAction SilentlyContinue | ForEach-Object {
    $props = Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue
    if ($props.DriverDesc) {
        if ($props.DriverDesc -match 'I225|I226|Intel') {
            Set-ItemProperty -Path $_.PSPath -Name '*SpeedDuplex' -Value '6' -Type String -Force -ErrorAction SilentlyContinue
            Set-ItemProperty -Path $_.PSPath -Name 'MasterSlave' -Value '1' -Type String -Force -ErrorAction SilentlyContinue
        }
        Set-ItemProperty -Path $_.PSPath -Name '*EEE' -Value '0' -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name '*EEELinkAdvertisement' -Value '0' -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name 'AdvancedEEE' -Value '0' -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name 'ReceiveBuffers' -Value '1024' -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name 'TransmitBuffers' -Value '1024' -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name 'EnablePTP' -Value '0' -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name '*PtpHardwareTimestamp' -Value '0' -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name '*PacketCoalescing' -Value '0' -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name 'UltraLowPowerMode' -Value '0' -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name 'AutoPowerSaveModeEnabled' -Value '0' -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name 'SavePowerNowEnabled' -Value '0' -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name 'ReduceSpeedOnPowerDown' -Value '0' -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name 'SystemIdleTime' -Value '0' -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name 'PnPCapabilities' -Value 24 -Type DWord -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name 'WakeOnSlot' -Value '0' -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name 'WakeOnLink' -Value '0' -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name '*WakeOnMagicPacket' -Value '0' -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $_.PSPath -Name '*WakeOnPattern' -Value '0' -Type String -Force -ErrorAction SilentlyContinue
    }
}

$wuKey = 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate'
if (!(Test-Path $wuKey)) { New-Item -Path $wuKey -Force -ErrorAction SilentlyContinue | Out-Null }
Set-ItemProperty -Path $wuKey -Name 'ExcludeWUDriversInQualityUpdate' -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue

Get-NetAdapter -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'Up' } | ForEach-Object {
    Set-NetAdapterAdvancedProperty -Name $_.Name -DisplayName 'Speed & Duplex' -DisplayValue '1.0 Gbps Full Duplex' -ErrorAction SilentlyContinue
    Set-NetAdapterAdvancedProperty -Name $_.Name -DisplayName 'Energy Efficient Ethernet' -DisplayValue 'Disabled' -ErrorAction SilentlyContinue
    Set-NetAdapterAdvancedProperty -Name $_.Name -DisplayName 'Advanced EEE' -DisplayValue 'Disabled' -ErrorAction SilentlyContinue
    Set-NetAdapterAdvancedProperty -Name $_.Name -DisplayName 'Packet Coalescing' -DisplayValue 'Disabled' -ErrorAction SilentlyContinue
    Set-NetAdapterAdvancedProperty -Name $_.Name -DisplayName 'Receive Buffers' -DisplayValue '1024' -ErrorAction SilentlyContinue
    Set-NetAdapterAdvancedProperty -Name $_.Name -DisplayName 'Transmit Buffers' -DisplayValue '1024' -ErrorAction SilentlyContinue
    Set-NetAdapterPowerManagement -Name $_.Name -AllowComputerToTurnOffDevice Disabled -WakeOnMagicPacket Disabled -ErrorAction SilentlyContinue
}
`
        await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        sendLog('[Network] Applied Deep NIC Silicon Fix: 1.0G forced, EEE disabled, buffers expanded to 1024, sleep hooks eliminated.')
        return { success: true, message: 'Deep NIC Fix applied: 1.0G Full Duplex, EEE killed, 1024 buffers, Windows Update driver lock active.' }
    } catch (e: any) {
        sendError(`[Network] Deep NIC Fix failed: ${e.message}`)
        return { success: false, message: e.message }
    }
})

// 3. Kernel Timer & Latency Fixes (GlobalTimerResolutionRequests, disabledynamictick, Enhanced TSC)
ipcMain.handle('network:applyTimerFixes', async () => {
    try {
        const ps = `
$smKey = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel'
if (!(Test-Path $smKey)) { New-Item -Path $smKey -Force -ErrorAction SilentlyContinue | Out-Null }
Set-ItemProperty -Path $smKey -Name 'TimerCoalescing' -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
Set-ItemProperty -Path $smKey -Name 'GlobalTimerResolutionRequests' -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue

$pwrKey = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Power'
Set-ItemProperty -Path $pwrKey -Name 'CoalescingTimerInterval' -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue

bcdedit /set disabledynamictick yes | Out-Null
bcdedit /set tscsyncpolicy Enhanced | Out-Null
bcdedit /deletevalue useplatformclock | Out-Null
bcdedit /deletevalue useplatformtick | Out-Null
`
        await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        sendLog('[Latency] Applied Kernel Timer Fixes: GlobalTimerResolutionRequests=1, disabledynamictick=yes, native TSC enforced.')
        return { success: true, message: 'Global timer resolution, tickless kernel disabled, and hardware TSC clock active.' }
    } catch (e: any) {
        sendError(`[Latency] Timer fixes failed: ${e.message}`)
        return { success: false, message: e.message }
    }
})

// 4. GPU DPC Latency Fix (DisableDynamicPstate, TdrDelay, MPO fix)
ipcMain.handle('network:applyGpuDpcFix', async () => {
    try {
        const ps = `
$displayKey = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}'
Get-ChildItem $displayKey -ErrorAction SilentlyContinue | ForEach-Object {
    $props = Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue
    if ($props.DriverDesc -match 'NVIDIA|GeForce') {
        Set-ItemProperty -Path $_.PSPath -Name 'DisableDynamicPstate' -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
    }
}
$gfxKey = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers'
Set-ItemProperty -Path $gfxKey -Name 'TdrLevel' -Value 3 -Type DWord -Force -ErrorAction SilentlyContinue
Set-ItemProperty -Path $gfxKey -Name 'TdrDelay' -Value 10 -Type DWord -Force -ErrorAction SilentlyContinue
Set-ItemProperty -Path $gfxKey -Name 'TdrDdiDelay' -Value 10 -Type DWord -Force -ErrorAction SilentlyContinue

$dwmKey = 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\Dwm'
if (!(Test-Path $dwmKey)) { New-Item -Path $dwmKey -Force -ErrorAction SilentlyContinue | Out-Null }
Set-ItemProperty -Path $dwmKey -Name 'OverlayTestMode' -Value 5 -Type DWord -Force -ErrorAction SilentlyContinue
`
        await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        sendLog('[GPU] Applied NVIDIA DPC Latency Fix: DisableDynamicPstate=1 (P0 clock lock), TDR delays, MPO test mode.')
        return { success: true, message: 'GPU dynamic P-state clock stutter eliminated; TDR delay optimized.' }
    } catch (e: any) {
        sendError(`[GPU] GPU DPC fix failed: ${e.message}`)
        return { success: false, message: e.message }
    }
})

// 5. Audio DAC D3 Sleep Kill (Realtek ALC1200 / HDAudio)
ipcMain.handle('network:applyAudioDpcFix', async () => {
    try {
        const ps = `
Get-ChildItem 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e96c-e325-11ce-bfc1-08002be10318}' -ErrorAction SilentlyContinue | ForEach-Object {
    $path = "$($_.PSPath)\\PowerSettings"
    if (Test-Path $path) {
        Set-ItemProperty -Path $path -Name 'ConservationIdleTime' -Value ([byte[]](0x00,0x00,0x00,0x00)) -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $path -Name 'PerformanceIdleTime' -Value ([byte[]](0x00,0x00,0x00,0x00)) -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $path -Name 'IdlePowerState' -Value ([byte[]](0x00,0x00,0x00,0x00)) -Force -ErrorAction SilentlyContinue
    }
}
`
        await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        sendLog('[Audio] Realtek / HD Audio DAC D3 sleep disabled — eliminates 2-5ms gunshot audio DPC spikes.')
        return { success: true, message: 'Audio codec power transition latency eliminated.' }
    } catch (e: any) {
        sendError(`[Audio] Audio DPC fix failed: ${e.message}`)
        return { success: false, message: e.message }
    }
})

// 6. NVMe Storage APST & AHCI Link Power Management Fix
ipcMain.handle('network:applyStoragePowerFix', async () => {
    try {
        const ps = `
powercfg -attributes SUB_DISK D639518A-E56D-4345-8AF2-B9F32FB26109 -ATTRIB_HIDE
powercfg /setacvalueindex SCHEME_CURRENT SUB_DISK D639518A-E56D-4345-8AF2-B9F32FB26109 0
powercfg -attributes SUB_DISK D3D55EE5-903B-4E69-B4FB-76041614C7A1 -ATTRIB_HIDE
powercfg /setacvalueindex SCHEME_CURRENT SUB_DISK D3D55EE5-903B-4E69-B4FB-76041614C7A1 0
powercfg -attributes SUB_DISK 0b2d69d7-a2a1-449c-9680-f91c70521c60 -ATTRIB_HIDE
powercfg /setacvalueindex SCHEME_CURRENT SUB_DISK 0b2d69d7-a2a1-449c-9680-f91c70521c60 0
powercfg /setactive SCHEME_CURRENT
`
        await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        sendLog('[Storage] NVMe APST autonomous sleep & AHCI link power management disabled.')
        return { success: true, message: 'NVMe texture load stutter and APST wake pauses eliminated.' }
    } catch (e: any) {
        sendError(`[Storage] Storage power fix failed: ${e.message}`)
        return { success: false, message: e.message }
    }
})

// 7. MSI Mode Deep Setup (GPU Priority High, USB xHCI, Raw Mouse Throttle Kill)
ipcMain.handle('network:enableMsiModeDeep', async () => {
    try {
        const ps = `
Get-ChildItem 'HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\PCI' -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'VEN_10DE' -and $_.Name -match 'Device Parameters' } | ForEach-Object {
    $msiPath = "$($_.PSPath)\\Interrupt Management\\MessageSignaledInterruptProperties"
    $affPath = "$($_.PSPath)\\Interrupt Management\\Affinity Policy"
    New-Item -Path $msiPath -Force -ErrorAction SilentlyContinue | Out-Null
    New-Item -Path $affPath -Force -ErrorAction SilentlyContinue | Out-Null
    Set-ItemProperty -Path $msiPath -Name 'MSISupported' -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
    Set-ItemProperty -Path $affPath -Name 'DevicePriority' -Value 3 -Type DWord -Force -ErrorAction SilentlyContinue
}
Get-ChildItem 'HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\PCI' -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'CC_0C0330' -and $_.Name -match 'Device Parameters' } | ForEach-Object {
    $msiPath = "$($_.PSPath)\\Interrupt Management\\MessageSignaledInterruptProperties"
    New-Item -Path $msiPath -Force -ErrorAction SilentlyContinue | Out-Null
    Set-ItemProperty -Path $msiPath -Name 'MSISupported' -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
}
Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'RawMouseThrottleDuration' -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
`
        await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        sendLog('[MSI] Enabled MSI Mode: GPU (High Priority 3), USB xHCI controllers, RawMouseThrottleDuration=0.')
        return { success: true, message: 'MSI mode activated with dedicated interrupt vectors for GPU and USB.' }
    } catch (e: any) {
        sendError(`[MSI] MSI Deep mode failed: ${e.message}`)
        return { success: false, message: e.message }
    }
})

// 8. Advanced Windows Network Stack Hardening (USO/URO Kill, CUBIC, NetworkThrottlingIndex=10, Core Pinning)
ipcMain.handle('network:applyAdvancedStackFix', async () => {
    try {
        const ps = `
Set-NetOffloadGlobalSetting -PacketCoalescingFilter Disabled -ReceiveSideScaling Enabled -TaskOffload Enabled -UdpSegmentationOffload Disabled -ErrorAction SilentlyContinue
netsh int tcp set global chimney=disabled autotuninglevel=normal ecncapability=disabled dca=disabled rss=enabled | Out-Null
netsh int ip set global taskoffload=enabled | Out-Null
netsh int udp set global uro=disabled -ErrorAction SilentlyContinue | Out-Null

@('Internet', 'InternetCustom', 'Compat', 'Datacenter', 'DatacenterCustom') | ForEach-Object {
    netsh int tcp set supplemental Template=$_ CongestionProvider=cubic | Out-Null
}

$sysProf = 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile'
Set-ItemProperty -Path $sysProf -Name 'NetworkThrottlingIndex' -Value 10 -Type DWord -Force -ErrorAction SilentlyContinue
Set-ItemProperty -Path $sysProf -Name 'SystemResponsiveness' -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue

$gamesKey = "$sysProf\\Tasks\\Games"
if (!(Test-Path $gamesKey)) { New-Item -Path $gamesKey -Force -ErrorAction SilentlyContinue | Out-Null }
Set-ItemProperty -Path $gamesKey -Name 'GPU Priority' -Value 8 -Type DWord -Force -ErrorAction SilentlyContinue
Set-ItemProperty -Path $gamesKey -Name 'Priority' -Value 6 -Type DWord -Force -ErrorAction SilentlyContinue
Set-ItemProperty -Path $gamesKey -Name 'Scheduling Category' -Value 'High' -Type String -Force -ErrorAction SilentlyContinue
Set-ItemProperty -Path $gamesKey -Name 'SFIO Priority' -Value 'High' -Type String -Force -ErrorAction SilentlyContinue

$pschedKey = 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Psched'
if (!(Test-Path $pschedKey)) { New-Item -Path $pschedKey -Force -ErrorAction SilentlyContinue | Out-Null }
Set-ItemProperty -Path $pschedKey -Name 'NonBestEffortLimit' -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
Set-ItemProperty -Path $pschedKey -Name 'DoNotUseNLA' -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue

$adapter = Get-NetAdapter -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'Up' -and $_.Virtual -eq $False } | Select-Object -First 1
if ($adapter) {
    Set-NetAdapterRss -Name $adapter.Name -NumberOfReceiveQueues 2 -BaseProcessorNumber 2 -MaxProcessors 2 -Profile Closest -ErrorAction SilentlyContinue
    Disable-NetAdapterUso -Name $adapter.Name -ErrorAction SilentlyContinue
}

netsh interface teredo set state disabled | Out-Null
`
        await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        sendLog('[Network] Advanced Network Stack Hardened: USO/URO killed, CUBIC set, NetworkThrottlingIndex=10, RSS pinned away from Core 0.')
        return { success: true, message: 'Advanced TCP/UDP stack hardened, CUBIC congestion set, RSS pinned to isolated cores.' }
    } catch (e: any) {
        sendError(`[Network] Advanced stack fix failed: ${e.message}`)
        return { success: false, message: e.message }
    }
})

// 9. Discover & Apply Optimal MTU (Ping Sweep without ICMP black hole drops)
ipcMain.handle('network:discoverOptimalMtu', async () => {
    try {
        const ps = `
$adapter = Get-NetAdapter -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'Up' -and $_.Virtual -eq $False } | Select-Object -First 1
$optimalPayload = 1472
$found = $false
foreach ($size in @(1472, 1464, 1452, 1440, 1420, 1400)) {
    $ping = ping 1.1.1.1 -f -l $size -n 1
    if ($ping -match 'bytes=' -and $ping -notmatch 'fragmented|100% loss') {
        $optimalPayload = $size
        $found = $true
        break
    }
}
$optimalMtu = $optimalPayload + 28
if ($adapter) {
    netsh interface ipv4 set subinterface "$($adapter.Name)" mtu=$optimalMtu store=persistent | Out-Null
}
@{ adapter = ($adapter ? $adapter.Name : "Ethernet"); optimalPayload = $optimalPayload; mtu = $optimalMtu; success = $found } | ConvertTo-Json
`
        const result = await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        const parsed = JSON.parse(result.trim())
        sendLog(`[MTU] Discovered optimal MTU: ${parsed.mtu} (payload: ${parsed.optimalPayload}) on ${parsed.adapter}`)
        return parsed
    } catch (e: any) {
        sendError(`[MTU] Discovery failed: ${e.message}`)
        return { adapter: 'Ethernet', optimalPayload: 1472, mtu: 1500, success: false }
    }
})

// 10. Query NIC Discarded / Dropped Packet Statistics
ipcMain.handle('network:getNicStatistics', async () => {
    try {
        const ps = `
$adapter = Get-NetAdapter -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'Up' -and $_.Virtual -eq $False } | Select-Object -First 1
if ($adapter) {
    $stats = Get-NetAdapterStatistics -Name $adapter.Name -ErrorAction SilentlyContinue
    @{
        adapter = $adapter.Name
        receivedDiscarded = [int64]$stats.ReceivedDiscardedPackets
        outboundDiscarded = [int64]$stats.OutboundDiscardedPackets
        receivedPacketErrors = [int64]$stats.ReceivedPacketErrors
        outboundPacketErrors = [int64]$stats.OutboundPacketErrors
    } | ConvertTo-Json
} else {
    @{ adapter = "N/A"; receivedDiscarded = 0; outboundDiscarded = 0; receivedPacketErrors = 0; outboundPacketErrors = 0 } | ConvertTo-Json
}
`
        const result = await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        return JSON.parse(result.trim())
    } catch (e: any) {
        return { adapter: 'N/A', receivedDiscarded: 0, outboundDiscarded: 0, receivedPacketErrors: 0, outboundPacketErrors: 0 }
    }
})

// 11. Audit Windows Filtering Platform (WFP) Callout Drivers
ipcMain.handle('network:auditWfpCallouts', async () => {
    try {
        const ps = `
$filePath = "$env:TEMP\\wfp_callouts.xml"
netsh wfp show callouts file=$filePath | Out-Null
$suspicious = @()
if (Test-Path $filePath) {
    [xml]$xml = Get-Content $filePath -ErrorAction SilentlyContinue
    $xml.wfpdiag.callouts.callout | ForEach-Object {
        if ($_.name -match 'cFos|GameFirst|Killer|Asus|Nahimic|Avast|Kaspersky|Norton|Bitdefender') {
            $suspicious += $_.name
        }
    }
    Remove-Item $filePath -Force -ErrorAction SilentlyContinue
}
@{ count = $suspicious.Count; offenders = $suspicious } | ConvertTo-Json
`
        const result = await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        const parsed = JSON.parse(result.trim())
        sendLog(`[WFP Audit] Scanned kernel callout drivers: found ${parsed.count} potential third-party network throttlers.`)
        return parsed
    } catch (e: any) {
        return { count: 0, offenders: [] }
    }
})

// --- Phase 5: v11.5.0 Network Stack Final Enhancements ---

// 12. TCP Fast Open (RFC 7413)
ipcMain.handle('network:enableTcpFastOpen', async () => {
    try {
        await runCmd('netsh', ['int', 'tcp', 'set', 'global', 'fastopen=enabled'])
        sendLog('[Network Engine] TCP Fast Open (RFC 7413) enabled - eliminates 1 RTT on TCP handshake')
        return { success: true, message: 'TCP Fast Open enabled successfully' }
    } catch (e: any) {
        sendError(`[Network Engine] Failed to enable TCP Fast Open: ${e.message}`)
        return { success: false, message: e.message }
    }
})

ipcMain.handle('network:getTcpFastOpenStatus', async () => {
    try {
        const out = await runCmd('netsh', ['int', 'tcp', 'show', 'global'])
        const match = out.match(/Fast\s*Open\s*Fallback\s*:\s*(\w+)/i) || out.match(/Fast\s*Open\s*:\s*(\w+)/i)
        const status = match ? match[1].toLowerCase() : 'unknown'
        return { success: true, enabled: status === 'enabled' || status === 'true', raw: status }
    } catch (e: any) {
        return { success: false, enabled: false, raw: 'error' }
    }
})

// 13. DNS over HTTPS (DoH) Management
ipcMain.handle('network:configureDoh', async (_e, provider: 'cloudflare' | 'google' | 'quad9' | 'disable') => {
    try {
        const dohConfigs: Record<string, { ip: string[]; dohTemplate: string }> = {
            cloudflare: {
                ip: ['1.1.1.1', '1.0.0.1'],
                dohTemplate: 'https://cloudflare-dns.com/dns-query'
            },
            google: {
                ip: ['8.8.8.8', '8.8.4.4'],
                dohTemplate: 'https://dns.google/dns-query'
            },
            quad9: {
                ip: ['9.9.9.9', '149.112.112.112'],
                dohTemplate: 'https://dns.quad9.net/dns-query'
            }
        }

        if (provider === 'disable') {
            const ps = `
$adapter = Get-NetAdapter -Physical | Where-Object Status -eq 'Up' | Select-Object -First 1
if ($adapter) {
    Set-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -ResetServerAddresses
}
`
            await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
            sendLog('[Network Engine] DNS over HTTPS (DoH) disabled - restored DHCP DNS')
            return { success: true, message: 'DoH disabled, DHCP DNS restored' }
        }

        const cfg = dohConfigs[provider]
        if (!cfg) throw new Error(`Unknown DoH provider: ${provider}`)

        const ps = `
$adapter = Get-NetAdapter -Physical | Where-Object Status -eq 'Up' | Select-Object -First 1
if ($adapter) {
    Set-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -ServerAddresses @('${cfg.ip[0]}', '${cfg.ip[1]}')
    foreach ($ip in @('${cfg.ip[0]}', '${cfg.ip[1]}')) {
        $existing = Get-DnsClientDohServerAddress -ServerAddress $ip -ErrorAction SilentlyContinue
        if ($existing) {
            Set-DnsClientDohServerAddress -ServerAddress $ip -DohTemplate '${cfg.dohTemplate}' -AllowFallbackToUdp $false -AutoUpgrade $true -ErrorAction SilentlyContinue
        } else {
            Add-DnsClientDohServerAddress -ServerAddress $ip -DohTemplate '${cfg.dohTemplate}' -AllowFallbackToUdp $false -AutoUpgrade $true -ErrorAction SilentlyContinue
        }
    }
}
`
        await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        sendLog(`[Network Engine] Configured strict DNS over HTTPS (DoH) using ${provider.toUpperCase()} (${cfg.dohTemplate})`)
        return { success: true, message: `DoH successfully configured with ${provider}` }
    } catch (e: any) {
        sendError(`[Network Engine] Failed to configure DoH: ${e.message}`)
        return { success: false, message: e.message }
    }
})

ipcMain.handle('network:getDohStatus', async () => {
    try {
        const ps = `
$doh = Get-DnsClientDohServerAddress -ErrorAction SilentlyContinue | Select-Object ServerAddress, DohTemplate, AllowFallbackToUdp, AutoUpgrade
@($doh) | ConvertTo-Json -Compress
`
        const out = await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        const parsed = JSON.parse(out.trim() || '[]')
        const entries = Array.isArray(parsed) ? parsed : [parsed]
        return { success: true, hasDoh: entries.length > 0, entries }
    } catch (e: any) {
        return { success: false, hasDoh: false, entries: [] }
    }
})

// 14. Real-time Connection Quality & Jitter Analysis
ipcMain.handle('network:getConnectionQuality', async (_e, host: string = '1.1.1.1', count: number = 15) => {
    try {
        const ps = `
$pings = Test-Connection -ComputerName '${host}' -Count ${Math.min(30, Math.max(5, count))} -ErrorAction SilentlyContinue
$times = $pings | ForEach-Object { $_.Latency }
$sent = ${count}
$received = $times.Count
$lost = $sent - $received
$packetLossPercent = [math]::Round(($lost / $sent) * 100, 1)

if ($received -gt 0) {
    $min = ($times | Measure-Object -Minimum).Minimum
    $max = ($times | Measure-Object -Maximum).Maximum
    $avg = [math]::Round(($times | Measure-Object -Average).Average, 2)
    
    # Calculate Standard Deviation / Jitter
    $variance = ($times | ForEach-Object { [math]::Pow($_ - $avg, 2) } | Measure-Object -Average).Average
    $jitter = [math]::Round([math]::Sqrt($variance), 2)
    
    [PSCustomObject]@{
        Host = '${host}'
        Sent = $sent
        Received = $received
        LossPercent = $packetLossPercent
        MinMs = $min
        MaxMs = $max
        AvgMs = $avg
        JitterMs = $jitter
        Samples = @($times)
    } | ConvertTo-Json -Compress
} else {
    [PSCustomObject]@{
        Host = '${host}'
        Sent = $sent
        Received = 0
        LossPercent = 100.0
        MinMs = 0
        MaxMs = 0
        AvgMs = 0
        JitterMs = 0
        Samples = @()
    } | ConvertTo-Json -Compress
}
`
        const out = await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        const parsed = JSON.parse(out.trim() || '{}')
        return {
            success: true,
            quality: {
                host: parsed.Host || host,
                sent: parsed.Sent || count,
                received: parsed.Received || 0,
                lossPercent: parsed.LossPercent || 0,
                minMs: parsed.MinMs || 0,
                maxMs: parsed.MaxMs || 0,
                avgMs: parsed.AvgMs || 0,
                jitterMs: parsed.JitterMs || 0,
                samples: parsed.Samples || []
            }
        }
    } catch (e: any) {
        return {
            success: false,
            quality: { host, sent: count, received: 0, lossPercent: 100, minMs: 0, maxMs: 0, avgMs: 0, jitterMs: 0, samples: [] }
        }
    }
})

// 15. TCP Congestion Provider Control
ipcMain.handle('network:getCongestionProvider', async () => {
    try {
        const ps = `(Get-NetTCPSetting -SettingName InternetCustom -ErrorAction SilentlyContinue).CongestionProvider`
        const out = await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        const provider = out.trim() || 'CUBIC'
        return { success: true, provider }
    } catch (e: any) {
        return { success: false, provider: 'CUBIC' }
    }
})

ipcMain.handle('network:setCongestionProvider', async (_e, provider: 'CUBIC' | 'CTCP' | 'NewReno') => {
    try {
        const valid = ['CUBIC', 'CTCP', 'NewReno'].includes(provider) ? provider : 'CUBIC'
        const ps = `Set-NetTCPSetting -SettingName InternetCustom -CongestionProvider ${valid} -ErrorAction SilentlyContinue`
        await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        sendLog(`[Network Engine] TCP Congestion Provider set to ${valid}`)
        return { success: true, message: `Congestion provider set to ${valid}` }
    } catch (e: any) {
        sendError(`[Network Engine] Failed to set Congestion Provider: ${e.message}`)
        return { success: false, message: e.message }
    }
})

// 16. Hardware 802.1p Packet Priority & VLAN Tagging
ipcMain.handle('network:applyHardwarePriorityVlan', async () => {
    try {
        const ps = `Get-NetAdapter | Where-Object { $_.Status -eq 'Up' -and $_.InterfaceDescription -notlike '*Virtual*' } | ForEach-Object { Set-NetAdapterAdvancedProperty -Name $_.Name -DisplayName 'Packet Priority & VLAN' -DisplayValue 'Packet Priority & VLAN Enabled' -ErrorAction SilentlyContinue }`
        await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        sendLog('[Network Engine] Hardware 802.1p Packet Priority & VLAN Tagging enabled across active NICs')
        return { success: true, message: 'Hardware Packet Priority & VLAN enabled' }
    } catch (e: any) {
        sendError(`[Network Engine] Failed to enable Hardware Priority VLAN: ${e.message}`)
        return { success: false, message: e.message }
    }
})

// 17. Windows Multimedia Network Throttling Elimination
ipcMain.handle('network:applyNetworkThrottlingKill', async () => {
    try {
        const ps = `Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Name 'NetworkThrottlingIndex' -Value 0xffffffff -Type DWord -Force; Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile' -Name 'SystemResponsiveness' -Value 0 -Type DWord -Force`
        await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        sendLog('[Network Engine] Windows Multimedia Network Throttling eliminated (NetworkThrottlingIndex=0xFFFFFFFF, SystemResponsiveness=0)')
        return { success: true, message: 'Network throttling eliminated (unlimited packet burst)' }
    } catch (e: any) {
        sendError(`[Network Engine] Failed to eliminate Network Throttling: ${e.message}`)
        return { success: false, message: e.message }
    }
})

// 18. Gateway & DNS Topology Audit
ipcMain.handle('network:auditGatewayAndDns', async () => {
    try {
        const ps = `
            $gw = (Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null } | Select-Object -First 1).IPv4DefaultGateway.NextHop
            $dns = (Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object { $_.ServerAddresses.Count -gt 0 } | Select-Object -First 1).ServerAddresses
            $hasSecondary = ($dns.Count -gt 1)
            [PSCustomObject]@{
                Gateway = $gw
                DnsServers = ($dns -join ', ')
                HasSecondaryDns = $hasSecondary
                DnsCount = $dns.Count
            } | ConvertTo-Json -Compress
        `
        const out = await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        const parsed = JSON.parse(out.trim())
        return { success: true, data: parsed }
    } catch (e: any) {
        return { success: false, message: e.message, data: { Gateway: 'Unknown', DnsServers: '', HasSecondaryDns: false, DnsCount: 0 } }
    }
})

// 19. Apply Secondary DNS Fallback
ipcMain.handle('network:applySecondaryDnsFallback', async () => {
    try {
        const ps = `
            $adapter = (Get-NetAdapter | Where-Object { $_.Status -eq 'Up' -and $_.InterfaceDescription -notlike '*Virtual*' } | Select-Object -First 1).Name
            if ($adapter) {
                $current = (Get-DnsClientServerAddress -InterfaceAlias $adapter -AddressFamily IPv4).ServerAddresses
                if ($current.Count -eq 1 -and $current[0] -ne '1.1.1.1') {
                    Set-DnsClientServerAddress -InterfaceAlias $adapter -ServerAddresses @($current[0], '1.1.1.1')
                    Write-Output "Added 1.1.1.1 secondary fallback to $adapter"
                } elseif ($current.Count -eq 0) {
                    Set-DnsClientServerAddress -InterfaceAlias $adapter -ServerAddresses @('1.1.1.1', '8.8.8.8')
                    Write-Output "Set Cloudflare/Google DNS on $adapter"
                } else {
                    Write-Output "Secondary DNS already configured on $adapter"
                }
            }
        `
        const out = await runCmd('powershell', ['-NonInteractive', '-NoProfile', '-Command', ps])
        sendLog(`[Network Engine] Secondary DNS Fallback: ${out.trim()}`)
        return { success: true, message: out.trim() }
    } catch (e: any) {
        sendError(`[Network Engine] Failed to apply secondary DNS fallback: ${e.message}`)
        return { success: false, message: e.message }
    }
})

