<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,33,39,45&height=340&section=header&text=MA%20Optimizer&fontSize=80&animation=fadeIn&fontAlignY=38&desc=" alt="MA Optimizer Header" />
</div>

# 🚀 MA Optimizer v7.0  
**The Ultimate Windows System Optimization Suite**

<div align="center">
  <p><strong>Optimize, repair, and supercharge your Windows experience with an ultra-modern, beautiful interface.</strong></p>
</div>

<div align="center" style="margin: 20px 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 15px;">
  <a href="https://github.com/Mathiya-Tech/MA-Optimizer/releases" style="text-decoration: none;">
    <img src="https://img.shields.io/github/downloads/Mathiya-Tech/MA-Optimizer/total?style=for-the-badge&color=00ffff&labelColor=0f0e1d&label=TOTAL+DOWNLOADS&logo=github" alt="Total Downloads">
  </a>
  <a href="https://github.com/Mathiya-Tech/MA-Optimizer/releases" style="text-decoration: none;">
    <img src="https://img.shields.io/github/v/release/Mathiya-Tech/MA-Optimizer?style=for-the-badge&color=ff00ff&labelColor=0f0e1d&label=LATEST+VERSION" alt="Latest Version">
  </a>
  <a href="https://github.com/Mathiya-Tech/MA-Optimizer/issues" style="text-decoration: none;">
    <img src="https://img.shields.io/github/issues-raw/Mathiya-Tech/MA-Optimizer?style=for-the-badge&color=ff5500&labelColor=0f0e1d&label=OPEN+ISSUES" alt="Open Issues">
  </a>
  <a href="https://github.com/Mathiya-Tech/MA-Optimizer/issues?q=is%3Aissue+is%3Aclosed" style="text-decoration: none;">
    <img src="https://img.shields.io/github/issues-closed-raw/Mathiya-Tech/MA-Optimizer?style=for-the-badge&color=00ff00&labelColor=0f0e1d&label=RESOLVED+ISSUES" alt="Closed Issues">
  </a>
</div>

<div align="center" style="margin: 20px 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 15px;">
  <img src="https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/Vite-B73CE4?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
</div>

## 🌌 Overview

MA Optimizer is an open-source, powerful, and beautifully designed system optimization tool built for Windows 10 & 11. Built from the ground up to provide maximum performance without compromising on safety, it wraps hundreds of registry tweaks, command-line utilities, and power plan adjustments into a single, intuitive dashboard.

Whether you are a power user looking to squeeze every drop of FPS for gaming, or an everyday user looking to breathe life into an older PC, MA Optimizer has the tools you need. 

## ✨ Key Features

- **📊 Modern Dashboard**: Real-time system metrics (CPU, RAM, Disk, Network) with interactive charts.
- **⚡ Performance Tweaks**: One-click optimizations for CPU parking, RAM management, and visual effects tuning.
- **🎮 Gaming Mode**: Dedicated presets to prioritize games, reduce input latency, and optimize your GPU.
- **🛠️ System Repair**: Quickly run SFC, DISM, reset network adapters, or rebuild icon cache directly from the UI.
- **📥 App Installer**: High-speed, batch app installation utilizing Winget. Install essential software in seconds.
- **🧹 System Cleaner**: Reclaim gigabytes of space by clearing temp folders, Windows caches, and useless log files.
- **🛡️ Privacy Controls**: Easily toggle telemetry and tracking services on or off.

## 🛠️ Installation

### Quick Automated Installation (Windows)

Launch PowerShell as an Administrator and run the following command to download and install automatically:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
irm "https://raw.githubusercontent.com/Mathiya-Tech/MA-Optimizer/main/install.ps1" | iex
```

### Manual Installation

1. Navigate to the [Releases Page](https://github.com/Mathiyass/MA-Optimizer/releases).
2. Download the latest `MA.Optimizer.Setup.exe` or the portable `.zip` file.
3. Run the installer (Administrator privileges are recommended for all features to work properly).

## 👨‍💻 Development & Building from Source

MA Optimizer is built using Electron, React, and Vite. To contribute or build your own version, follow these steps.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Git](https://git-scm.com/)
- A Windows machine (Many functions rely on Windows-specific APIs like Registry, PowerShell, and Winget)

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Mathiyass/MA-Optimizer.git
   cd MA-Optimizer/ma-optimizer-electron
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   This runs Vite and Electron concurrently. Hot-reloading is supported for the React UI.
   ```bash
   npm run dev
   ```

4. **Build the Application:**
   To compile and package the app for distribution (outputs an installer to `dist/`):
   ```bash
   npm run dist:installer
   ```
   Or to build a portable version:
   ```bash
   npm run dist:portable
   ```

## 🔒 Security & Safety First

System optimization tools can be dangerous if mishandled. MA Optimizer handles safety by:
1. **Making Backups**: Crucial tweaks have auto-revert functionality via our backup engine in `settingsStore.ts`.
2. **Open Source**: The code is 100% visible. No hidden scripts, no bundled malware.
3. **No Snake Oil**: We only use validated Windows tuning mechanisms (PowerShell wrappers, documented Registry Keys, and Winget).

## 💬 Community

Join the community to get updates, request features, or report issues:
- [Join the Discord Server](https://discord.gg/QERP5JJM8k)
- [Follow on Facebook](https://www.facebook.com/mathisha.angirasa/)
- [Follow on Instagram](https://www.instagram.com/mathi_ya_/)

## 📜 License

This project is licensed under the **MIT License**.
Copyright © 2024 Mathiya.

> "The future belongs to those who optimize the present."

