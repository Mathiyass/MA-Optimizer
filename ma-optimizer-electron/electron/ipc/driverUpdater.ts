import { ipcMain } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import { mkdir } from 'fs/promises'

const execAsync = promisify(exec)
// 1. Get installed drivers
ipcMain.handle('drivers:getInstalled', async () => {
    try {
        const script = `
            $drivers = Get-WmiObject Win32_PnPSignedDriver | Where-Object { 
                $_.DeviceName -ne $null -and 
                $_.DriverVersion -ne $null -and 
                $_.DeviceClass -notmatch 'System|Computer|Processor|BluetoothVirtual|Volume|Battery'
            };
            
            $results = @();
            foreach ($driver in $drivers) {
                $results += [PSCustomObject]@{
                    DeviceName = $driver.DeviceName;
                    Manufacturer = $driver.Manufacturer;
                    DriverVersion = $driver.DriverVersion;
                    DriverDate = $driver.DriverDate;
                    DeviceClass = $driver.DeviceClass;
                    HardwareID = $driver.HardwareID
                };
            };
            $results | ConvertTo-Json -Compress;
        `
        const { stdout } = await execAsync(`powershell -NoProfile -Command "${script.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, { maxBuffer: 1024 * 1024 * 10 })
        if (!stdout) return []

        const data = JSON.parse(stdout)
        return Array.isArray(data) ? data : [data]
    } catch (error) {
        console.error('Failed to get installed drivers:', error)
        return []
    }
})

// 2. Scan for updates via Windows Update
ipcMain.handle('drivers:scanUpdates', async () => {
    try {
        const script = `
            $UpdateSession = New-Object -ComObject Microsoft.Update.Session;
            $UpdateSearcher = $UpdateSession.CreateUpdateSearcher();
            $SearcherResult = $UpdateSearcher.Search("IsInstalled=0 and Type='Driver'");
            
            $updates = @();
            foreach ($update in $SearcherResult.Updates) {
                $updates += [PSCustomObject]@{
                    Title = $update.Title;
                    Description = $update.Description;
                    IsDownloaded = $update.IsDownloaded;
                    UpdateID = $update.Identity.UpdateID;
                    RevisionNumber = $update.Identity.RevisionNumber
                };
            };
            $updates | ConvertTo-Json -Compress;
        `
        const { stdout } = await execAsync(`powershell -NoProfile -Command "${script.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, { maxBuffer: 1024 * 1024 * 10 })
        if (!stdout) return []

        const data = JSON.parse(stdout)
        return Array.isArray(data) ? data : [data]
    } catch (error) {
        console.error('Failed to scan for driver updates:', error)
        return []
    }
})

// 3. Install a specific driver update
ipcMain.handle('drivers:installUpdate', async (_, title: string) => {
    try {
        const script = `
            $UpdateSession = New-Object -ComObject Microsoft.Update.Session;
            $UpdateSearcher = $UpdateSession.CreateUpdateSearcher();
            $SearcherResult = $UpdateSearcher.Search("IsInstalled=0 and Type='Driver'");
            
            $targetUpdate = $null;
            foreach ($update in $SearcherResult.Updates) {
                if ($update.Title -eq '${title.replace(/'/g, "''")}') {
                    $targetUpdate = $update;
                    break;
                };
            };
            
            if ($targetUpdate) {
                $updateColl = New-Object -ComObject Microsoft.Update.UpdateColl;
                $updateColl.Add($targetUpdate) | Out-Null;
                
                if (-not $targetUpdate.IsDownloaded) {
                    $downloader = $UpdateSession.CreateUpdateDownloader();
                    $downloader.Updates = $updateColl;
                    $downloader.Download() | Out-Null;
                };
                
                $installer = $UpdateSession.CreateUpdateInstaller();
                $installer.Updates = $updateColl;
                $result = $installer.Install();
                return $result.ResultCode -eq 2; # 2 means success
            };
            return $false;
        `
        const { stdout } = await execAsync(`powershell -NoProfile -Command "${script.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, { maxBuffer: 1024 * 1024 * 10 })
        return stdout.trim().toLowerCase() === 'true'
    } catch (error) {
        console.error('Failed to install driver:', error)
        return false
    }
})

// 4. Backup drivers
ipcMain.handle('drivers:backup', async (_, folderPath: string) => {
    try {
        await mkdir(folderPath, { recursive: true })
        const command = `dism /online /export-driver /destination:\\"${folderPath}\\"`
        await execAsync(`powershell -NoProfile -Command "Start-Process powershell -ArgumentList \\"-NoProfile -Command ${command}\\" -Verb RunAs -Wait"`)
        return true
    } catch (error) {
        console.error('Failed to backup drivers:', error)
        return false
    }
})
