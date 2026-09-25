import { ipcMain } from 'electron';
import { spawnPromise, escapePS } from './utils';

// Phase 1: Input Lag Elimination Engine
// Cures mouse acceleration curves, optimizes keyboard repeat delays, forces Fullscreen Exclusive (FSE), and audits USB polling.

export interface MouseSettings {
    mouseSpeed: string;
    mouseThreshold1: string;
    mouseThreshold2: string;
    accelerationKilled: boolean;
}

export interface KeyboardSettings {
    keyboardDelay: string;
    keyboardSpeed: string;
    isOptimal: boolean;
}

export interface UsbDevicePollInfo {
    name: string;
    deviceID: string;
    status: string;
    service: string;
}

ipcMain.handle('input:getMouseSettings', async (): Promise<MouseSettings> => {
    try {
        const ps = `
            $speed = (Get-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name MouseSpeed -ErrorAction SilentlyContinue).MouseSpeed
            $t1 = (Get-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name MouseThreshold1 -ErrorAction SilentlyContinue).MouseThreshold1
            $t2 = (Get-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name MouseThreshold2 -ErrorAction SilentlyContinue).MouseThreshold2
            [PSCustomObject]@{
                MouseSpeed = [string]$speed
                MouseThreshold1 = [string]$t1
                MouseThreshold2 = [string]$t2
            } | ConvertTo-Json
        `;
        const { stdout } = await spawnPromise('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps]);
        const data = JSON.parse(stdout || '{}');
        const speed = String(data.MouseSpeed ?? '1');
        const t1 = String(data.MouseThreshold1 ?? '6');
        const t2 = String(data.MouseThreshold2 ?? '10');
        const accelerationKilled = speed === '0' && t1 === '0' && t2 === '0';

        return {
            mouseSpeed: speed,
            mouseThreshold1: t1,
            mouseThreshold2: t2,
            accelerationKilled,
        };
    } catch (e: any) {
        console.error('[InputLag] getMouseSettings error:', e.message);
        return {
            mouseSpeed: 'unknown',
            mouseThreshold1: 'unknown',
            mouseThreshold2: 'unknown',
            accelerationKilled: false,
        };
    }
});

ipcMain.handle('input:killMouseAcceleration', async (): Promise<boolean> => {
    try {
        const ps = `
            Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name MouseSpeed -Value '0' -Type String -Force
            Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name MouseThreshold1 -Value '0' -Type String -Force
            Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name MouseThreshold2 -Value '0' -Type String -Force

            # Reload mouse parameters live via user32 SystemParametersInfo
            Add-Type @"
                using System;
                using System.Runtime.InteropServices;
                public class MouseReload {
                    [DllImport("user32.dll", SetLastError = true)]
                    public static extern bool SystemParametersInfo(int uAction, int uParam, IntPtr lpvParam, int fuWinIni);
                }
"@
            [MouseReload]::SystemParametersInfo(0x0071, 0, [IntPtr]::Zero, 0x0001 -bor 0x0002)
        `;
        await spawnPromise('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps]);
        return true;
    } catch (e: any) {
        console.error('[InputLag] killMouseAcceleration error:', e.message);
        return false;
    }
});

ipcMain.handle('input:getKeyboardRepeat', async (): Promise<KeyboardSettings> => {
    try {
        const ps = `
            $delay = (Get-ItemProperty -Path 'HKCU:\\Control Panel\\Keyboard' -Name KeyboardDelay -ErrorAction SilentlyContinue).KeyboardDelay
            $speed = (Get-ItemProperty -Path 'HKCU:\\Control Panel\\Keyboard' -Name KeyboardSpeed -ErrorAction SilentlyContinue).KeyboardSpeed
            [PSCustomObject]@{
                KeyboardDelay = [string]$delay
                KeyboardSpeed = [string]$speed
            } | ConvertTo-Json
        `;
        const { stdout } = await spawnPromise('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps]);
        const data = JSON.parse(stdout || '{}');
        const delay = String(data.KeyboardDelay ?? '1');
        const speed = String(data.KeyboardSpeed ?? '31');
        const isOptimal = delay === '0' && speed === '31';

        return {
            keyboardDelay: delay,
            keyboardSpeed: speed,
            isOptimal,
        };
    } catch (e: any) {
        console.error('[InputLag] getKeyboardRepeat error:', e.message);
        return {
            keyboardDelay: 'unknown',
            keyboardSpeed: 'unknown',
            isOptimal: false,
        };
    }
});

ipcMain.handle('input:optimizeKeyboard', async (): Promise<boolean> => {
    try {
        const ps = `
            Set-ItemProperty -Path 'HKCU:\\Control Panel\\Keyboard' -Name KeyboardDelay -Value '0' -Type String -Force
            Set-ItemProperty -Path 'HKCU:\\Control Panel\\Keyboard' -Name KeyboardSpeed -Value '31' -Type String -Force

            # Reload keyboard delay and speed live via user32 SystemParametersInfo
            Add-Type @"
                using System;
                using System.Runtime.InteropServices;
                public class KeyboardReload {
                    [DllImport("user32.dll", SetLastError = true)]
                    public static extern bool SystemParametersInfo(int uAction, int uParam, int lpvParam, int fuWinIni);
                }
"@
            [KeyboardReload]::SystemParametersInfo(0x0017, 0, 0, 0x0001 -bor 0x0002) # SPI_SETKEYBOARDDELAY
            [KeyboardReload]::SystemParametersInfo(0x000B, 31, 0, 0x0001 -bor 0x0002) # SPI_SETKEYBOARDSPEED
        `;
        await spawnPromise('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps]);
        return true;
    } catch (e: any) {
        console.error('[InputLag] optimizeKeyboard error:', e.message);
        return false;
    }
});

ipcMain.handle('input:applyFseBehavior', async (): Promise<boolean> => {
    try {
        const ps = `
            if (-not (Test-Path 'HKCU:\\System\\GameConfigStore')) {
                New-Item -Path 'HKCU:\\System\\GameConfigStore' -Force | Out-Null
            }
            Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name GameDVR_FSEBehaviorMode -Value 2 -Type DWord -Force
            Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name GameDVR_HonorUserFSEBehaviorMode -Value 1 -Type DWord -Force
            Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name GameDVR_DXGIHonorFSEWindowsCompatible -Value 1 -Type DWord -Force
        `;
        await spawnPromise('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps]);
        return true;
    } catch (e: any) {
        console.error('[InputLag] applyFseBehavior error:', e.message);
        return false;
    }
});

ipcMain.handle('input:getUsbDevices', async (): Promise<UsbDevicePollInfo[]> => {
    try {
        const ps = `
            Get-CimInstance Win32_PnPEntity | Where-Object { 
                $_.PNPClass -eq 'Mouse' -or $_.PNPClass -eq 'Keyboard' -or $_.PNPClass -eq 'HIDClass' 
            } | Select-Object -Property Name, DeviceID, Status, Service | ConvertTo-Json -Compress
        `;
        const { stdout } = await spawnPromise('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps]);
        if (!stdout || stdout.trim() === '') return [];
        const parsed = JSON.parse(stdout);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        return list.map((item: any) => ({
            name: String(item.Name || 'HID Device'),
            deviceID: String(item.DeviceID || ''),
            status: String(item.Status || 'OK'),
            service: String(item.Service || 'hidusb'),
        }));
    } catch (e: any) {
        console.error('[InputLag] getUsbDevices error:', e.message);
        return [];
    }
});

ipcMain.handle('input:applyMasterInputLagFix', async (): Promise<{ success: boolean; message: string }> => {
    try {
        const ps = `
            # 1. Kill mouse acceleration
            Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name MouseSpeed -Value '0' -Type String -Force
            Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name MouseThreshold1 -Value '0' -Type String -Force
            Set-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name MouseThreshold2 -Value '0' -Type String -Force

            # 2. Optimize keyboard repeat
            Set-ItemProperty -Path 'HKCU:\\Control Panel\\Keyboard' -Name KeyboardDelay -Value '0' -Type String -Force
            Set-ItemProperty -Path 'HKCU:\\Control Panel\\Keyboard' -Name KeyboardSpeed -Value '31' -Type String -Force

            # 3. Force FSE Exclusive Fullscreen Mode
            if (-not (Test-Path 'HKCU:\\System\\GameConfigStore')) {
                New-Item -Path 'HKCU:\\System\\GameConfigStore' -Force | Out-Null
            }
            Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name GameDVR_FSEBehaviorMode -Value 2 -Type DWord -Force
            Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name GameDVR_HonorUserFSEBehaviorMode -Value 1 -Type DWord -Force
            Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name GameDVR_DXGIHonorFSEWindowsCompatible -Value 1 -Type DWord -Force

            # 4. Reload parameters via user32
            Add-Type @"
                using System;
                using System.Runtime.InteropServices;
                public class MasterInputReload {
                    [DllImport("user32.dll", SetLastError = true)]
                    public static extern bool SystemParametersInfo(int uAction, int uParam, IntPtr lpvParam, int fuWinIni);
                    [DllImport("user32.dll", SetLastError = true)]
                    public static extern bool SystemParametersInfo(int uAction, int uParam, int lpvParam, int fuWinIni);
                }
"@
            [MasterInputReload]::SystemParametersInfo(0x0071, 0, [IntPtr]::Zero, 0x0001 -bor 0x0002)
            [MasterInputReload]::SystemParametersInfo(0x0017, 0, 0, 0x0001 -bor 0x0002)
            [MasterInputReload]::SystemParametersInfo(0x000B, 31, 0, 0x0001 -bor 0x0002)
        `;
        await spawnPromise('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps]);
        return { success: true, message: 'All input latency mitigations applied (Mouse Accel Kill, Keyboard Repeat Max, FSE Override).' };
    } catch (e: any) {
        console.error('[InputLag] applyMasterInputLagFix error:', e.message);
        return { success: false, message: e.message };
    }
});
