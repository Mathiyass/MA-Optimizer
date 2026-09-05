# ==============================================================================
# MA-Optimizer One-Line PowerShell Web Installer (v11.1.0)
# Repository: https://github.com/Mathiyass/MA-Optimizer
# Author: Mathisha Angirasa
# ==============================================================================

Write-Host ""
Write-Host "  __  __          ____        _   _           _                  " -ForegroundColor Cyan
Write-Host " |  \/  |   /\   / __ \      | | (_)         (_)                 " -ForegroundColor Cyan
Write-Host " | \  / |  /  \ | |  | |_ __ | |_ _ _ __ ___  _ _______ _ __     " -ForegroundColor Cyan
Write-Host " | |\/| | / /\ \| |  | | '_ \| __| | '_ ` _ \| |_  / _ \ '__|    " -ForegroundColor Cyan
Write-Host " | |  | |/ ____ \ |__| | |_) | |_| | | | | | | |/ /  __/ |       " -ForegroundColor Cyan
Write-Host " |_|  |_/_/    \_\____/| .__/ \__|_|_| |_| |_|_/___\___|_|       " -ForegroundColor Cyan
Write-Host "                       | |                                       " -ForegroundColor Cyan
Write-Host "                       |_|             v11.1.0 Pro Edition       " -ForegroundColor DarkCyan
Write-Host ""

$releaseUrl = 'https://github.com/Mathiyass/MA-Optimizer/releases/download/v11.1.0/v11.1.MA-Optimizer.Installer.Setup.exe'
$tempInstaller = Join-Path $env:TEMP 'v11.1.MA-Optimizer.Installer.Setup.exe'

Write-Host "[-] Initializing installation pipeline..." -ForegroundColor Yellow
Write-Host "[-] Fetching binary package from GitHub Releases..." -ForegroundColor White

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $releaseUrl -OutFile $tempInstaller -UseBasicParsing
    Write-Host "[OK] Binary package downloaded successfully." -ForegroundColor Green
    
    Write-Host "[-] Launching MA-Optimizer Setup Wizard..." -ForegroundColor Cyan
    Start-Process -FilePath $tempInstaller
    Write-Host "[OK] Setup Wizard running. Follow on-screen prompts to complete installation." -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to download installer." -ForegroundColor Red
    Write-Host "[-] Please download directly from: https://github.com/Mathiyass/MA-Optimizer/releases" -ForegroundColor Yellow
}
