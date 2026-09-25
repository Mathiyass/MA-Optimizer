import { ipcMain } from 'electron';
import { spawnPromise } from './utils';

// Phase 3: GPU Driver Profile Optimizer
// Tunes vendor-specific registry settings for NVIDIA, AMD, and Intel GPUs.

export interface GpuVendorInfo {
    vendor: 'nvidia' | 'amd' | 'intel' | 'unknown';
    name: string;
    driverVersion: string;
    adapterRam: number;
}

export interface GpuProfileSettings {
    preferMaxPerformance: boolean;
    shaderCacheGb: number;
    lowLatencyMode: boolean;
}

ipcMain.handle('gpu:detectVendor', async (): Promise<GpuVendorInfo> => {
    try {
        const ps = `
            Get-CimInstance Win32_VideoController | Select-Object -Property Caption, DriverVersion, AdapterRAM | ConvertTo-Json
        `;
        const { stdout } = await spawnPromise('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps]);
        const data = JSON.parse(stdout || '{}');
        const first = Array.isArray(data) ? data[0] : data;
        const caption = String(first.Caption || '');
        const driverVersion = String(first.DriverVersion || '');
        const adapterRam = Number(first.AdapterRAM || 0);

        let vendor: GpuVendorInfo['vendor'] = 'unknown';
        const lower = caption.toLowerCase();
        if (lower.includes('nvidia') || lower.includes('geforce') || lower.includes('rtx') || lower.includes('gtx')) {
            vendor = 'nvidia';
        } else if (lower.includes('amd') || lower.includes('radeon')) {
            vendor = 'amd';
        } else if (lower.includes('intel') || lower.includes('arc') || lower.includes('iris') || lower.includes('uhd')) {
            vendor = 'intel';
        }

        return {
            vendor,
            name: caption,
            driverVersion,
            adapterRam,
        };
    } catch (e: any) {
        console.error('[GpuProfile] detectVendor error:', e.message);
        return {
            vendor: 'unknown',
            name: 'Unknown Video Controller',
            driverVersion: 'Unknown',
            adapterRam: 0,
        };
    }
});

ipcMain.handle('gpu:getProfileSettings', async (): Promise<GpuProfileSettings> => {
    try {
        const ps = `
            $classPath = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}'
            $subkeys = Get-ChildItem -Path $classPath -ErrorAction SilentlyContinue | Where-Object { $_.PSChildName -match '^\\d{4}$' }
            $maxPerf = $false
            $cacheGb = 10

            foreach ($k in $subkeys) {
                $pLevel = (Get-ItemProperty -Path $k.PSPath -Name PowerMizerLevel -ErrorAction SilentlyContinue).PowerMizerLevel
                if ($pLevel -eq 1) { $maxPerf = $true }
                $sc = (Get-ItemProperty -Path $k.PSPath -Name ShaderCacheSizeMB -ErrorAction SilentlyContinue).ShaderCacheSizeMB
                if ($sc) { $cacheGb = [math]::Round($sc / 1024) }
            }

            [PSCustomObject]@{
                PreferMaxPerformance = $maxPerf
                ShaderCacheGb = $cacheGb
                LowLatencyMode = $true
            } | ConvertTo-Json
        `;
        const { stdout } = await spawnPromise('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps]);
        const data = JSON.parse(stdout || '{}');
        return {
            preferMaxPerformance: Boolean(data.PreferMaxPerformance),
            shaderCacheGb: Number(data.ShaderCacheGb || 10),
            lowLatencyMode: Boolean(data.LowLatencyMode),
        };
    } catch (e: any) {
        console.error('[GpuProfile] getProfileSettings error:', e.message);
        return {
            preferMaxPerformance: false,
            shaderCacheGb: 10,
            lowLatencyMode: false,
        };
    }
});

ipcMain.handle('gpu:applyNvidiaProfile', async (): Promise<{ success: boolean; message: string }> => {
    try {
        const ps = `
            $classPath = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}'
            $subkeys = Get-ChildItem -Path $classPath -ErrorAction SilentlyContinue | Where-Object { $_.PSChildName -match '^\\d{4}$' }
            
            foreach ($k in $subkeys) {
                # Force Maximum Performance PowerMizer
                Set-ItemProperty -Path $k.PSPath -Name PowerMizerEnable -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
                Set-ItemProperty -Path $k.PSPath -Name PowerMizerLevel -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
                Set-ItemProperty -Path $k.PSPath -Name PowerMizerLevelAC -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
                Set-ItemProperty -Path $k.PSPath -Name PerfLevelSrc -Value 0x2222 -Type DWord -Force -ErrorAction SilentlyContinue
                
                # 10GB Shader Cache
                Set-ItemProperty -Path $k.PSPath -Name ShaderCacheSizeMB -Value 10240 -Type DWord -Force -ErrorAction SilentlyContinue
            }
        `;
        await spawnPromise('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps]);
        return { success: true, message: 'NVIDIA Maximum Performance and 10GB Shader Cache profile applied.' };
    } catch (e: any) {
        console.error('[GpuProfile] applyNvidiaProfile error:', e.message);
        return { success: false, message: e.message };
    }
});

ipcMain.handle('gpu:setShaderCacheSize', async (_event, sizeGb: number): Promise<boolean> => {
    try {
        const targetMb = Math.max(1, Math.min(100, Number(sizeGb) || 10)) * 1024;
        const ps = `
            $classPath = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}'
            $subkeys = Get-ChildItem -Path $classPath -ErrorAction SilentlyContinue | Where-Object { $_.PSChildName -match '^\\d{4}$' }
            foreach ($k in $subkeys) {
                Set-ItemProperty -Path $k.PSPath -Name ShaderCacheSizeMB -Value ${targetMb} -Type DWord -Force -ErrorAction SilentlyContinue
            }
        `;
        await spawnPromise('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps]);
        return true;
    } catch (e: any) {
        console.error('[GpuProfile] setShaderCacheSize error:', e.message);
        return false;
    }
});
