import { ipcMain, BrowserWindow } from 'electron'
import { execSync, exec, spawn } from 'child_process'
import { sendLog, sendError } from './logger'

function runCmd(cmd: string, timeout = 30000): string {
    try {
        return execSync(cmd, { encoding: 'utf-8', timeout, windowsHide: true }).trim()
    } catch (e: any) {
        return e.stdout?.toString()?.trim() || e.message || ''
    }
}

// TCP Parameters
ipcMain.handle('network:getTcpParams', async () => {
    try {
        const result = runCmd('powershell -NonInteractive -NoProfile -Command "Get-NetTCPSetting | Select-Object SettingName,AutoTuningLevelLocal,ScalingHeuristics,CongestionProvider,EcnCapability,InitialRto,MinRto | ConvertTo-Json"')
        return JSON.parse(result)
    } catch {
        return null
    }
})

ipcMain.handle('network:setTcpParam', async (_, name: string, val: any) => {
    try {
        runCmd(`netsh int tcp set global ${name}=${val}`)
        sendLog(`[Network] Set TCP ${name} = ${val}`)
        return true
    } catch (e: any) {
        sendError(`Failed to set TCP param ${name}: ${e.message}`)
        return false
    }
})

ipcMain.handle('network:netsh', async (_, args: string) => {
    return runCmd(`netsh ${args}`)
})

ipcMain.handle('network:flushDns', async () => {
    const result = runCmd('ipconfig /flushdns')
    sendLog('[Network] DNS cache flushed')
    return result
})

ipcMain.handle('network:resetWinsock', async () => {
    const result = runCmd('netsh winsock reset')
    sendLog('[Network] Winsock reset — restart required')
    return result
})

ipcMain.handle('network:resetTcpIp', async () => {
    const result = runCmd('netsh int ip reset')
    sendLog('[Network] TCP/IP stack reset — restart required')
    return result
})

ipcMain.handle('network:setDns', async (_, adapter: string, primary: string, secondary: string) => {
    try {
        runCmd(`netsh interface ip set dns name="${adapter}" static ${primary}`)
        if (secondary) {
            runCmd(`netsh interface ip add dns name="${adapter}" ${secondary} index=2`)
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
        const result = runCmd(`powershell -NonInteractive -NoProfile -Command "${ps}"`)
        const parsed = JSON.parse(result)
        return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
        return []
    }
})

ipcMain.handle('network:ping', async (_, host: string) => {
    try {
        const ps = `Test-Connection -ComputerName '${host}' -Count 4 -ErrorAction SilentlyContinue | Select-Object Address,ResponseTime,StatusCode | ConvertTo-Json`
        const result = runCmd(`powershell -NonInteractive -NoProfile -Command "${ps}"`, 15000)
        const data = JSON.parse(result)
        const pings = Array.isArray(data) ? data : [data]
        const times = pings.map((p: any) => p.ResponseTime || p.Latency || 0).filter((t: number) => t > 0)
        return {
            host,
            min: Math.min(...times),
            avg: Math.round(times.reduce((a: number, b: number) => a + b, 0) / times.length),
            max: Math.max(...times),
            loss: Math.round(((4 - times.length) / 4) * 100),
        }
    } catch {
        return { host, min: 0, avg: 0, max: 0, loss: 100 }
    }
})

ipcMain.handle('network:detectMtu', async () => {
    try {
        let mtu = 1500
        for (let size = 1500; size >= 576; size -= 10) {
            const result = runCmd(`ping -f -l ${size - 28} -n 1 8.8.8.8`, 5000)
            if (!result.toLowerCase().includes('fragmented') && !result.toLowerCase().includes('too large')) {
                mtu = size
                break
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
        runCmd(`netsh interface ipv4 set subinterface "${adapter}" mtu=${size} store=persistent`)
        sendLog(`[Network] Set MTU on ${adapter} to ${size}`)
        return true
    } catch (e: any) {
        sendError(`Failed to set MTU: ${e.message}`)
        return false
    }
})

ipcMain.handle('network:openPorts', async () => {
    try {
        const ps = `Get-NetTCPConnection | Where-Object {$_.State -eq 'Listen' -or $_.State -eq 'Established'} | Select-Object LocalAddress,LocalPort,RemoteAddress,RemotePort,State,OwningProcess | ConvertTo-Json -Depth 2`
        const result = runCmd(`powershell -NonInteractive -NoProfile -Command "${ps}"`)
        const parsed = JSON.parse(result)
        return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
        return []
    }
})

ipcMain.handle('network:tracert', async (_, host: string) => {
    const win = BrowserWindow.getAllWindows()[0]
    return new Promise((resolve) => {
        const proc = spawn('tracert', ['-d', '-w', '3000', host], { windowsHide: true })
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
    return runCmd(`nslookup ${host}`, 10000)
})
