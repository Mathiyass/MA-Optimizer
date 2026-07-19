# MA-Optimizer v10.0.0 Release Notes

We are excited to release **v10.0.0** of MA-Optimizer! This milestone release focuses heavily on **extreme performance optimizations**, **zero main-thread blocking**, **process batching**, and **new premium diagnostic utilities**.

These changes ensure the application runs smoothly on low-specification machines without stuttering or freezing the user interface.

---

## What's New in v10.0.0

### 1. Zero-Blocking Asynchronous Architecture ⚡
All system, registry, and cleanup commands have been migrated from synchronous calls (`spawnSyncChecked`) to fully asynchronous calls using `spawnPromise`. 
- **Fluid UI**: Node's event loop is no longer blocked. Processes like restore point checks (~2 mins) now run completely in the background, keeping the user interface 100% interactive and stutter-free.
- **Async Operations**: System repair checks (SFC/DISM), registry modifications, backups, and app queries now run concurrently without thread contention.

### 2. Batch Subprocess Executions (CPU Optimization) 📉
We optimized process-heavy loops to minimize CPU overhead on low-spec hardware:
- **Registry Cleaning**: Registry fixes no longer spawn `powershell.exe` sequentially for every key. Instead, all commands are compiled into a single base64-encoded PowerShell script and executed in a single batch invocation (reducing execution time for 50 keys from ~30s to <1s).
- **Bloatware Debloater**: Spawns exactly one PowerShell command to parse and remove multiple selected UWP packages concurrently.
- **Concurrently Applied Tweaks**: Power plan parameters are applied concurrently via `Promise.all` instead of sequentially.

### 3. Background Telemetry Polling Suspension 🔋
- **visibility-aware Polling**: The main process stats loop now automatically monitors all application window states. If the application is minimized or hidden in the background, telemetry polling suspends completely, reducing idle CPU usage to `0%`.
- **Lightweight System Stats**: Replaced CPU and memory WMI calls with native Node.js `os` metrics. Network speed tracking now parses the lightweight native `netstat -e` utility.
- **Resize Event Listeners**: Removed the 1-second interval checks for window maximization. The UI now responds immediately via window resize event listeners.

### 4. New Premium Utilities 🛠️
- **DNS Latency Benchmarker**: Run real-time latency speed tests against Cloudflare, Google, OpenDNS, and Quad9. Find the lowest-latency resolver for your current network and apply it with one click.
- **Active RAM Cache Purger**: Monitor real-time memory stats and purge standby memory lists and unused process working sets asynchronously using native API calls.

---

## Release Assets

We provide two separate packaging formats:
- **`MA-Optimizer Setup 10.0.0.exe`**: Standard NSIS installer featuring setup configurations.
- **`MA-Optimizer 10.0.0.exe`**: Standalone, portable version containing all dependencies with zero installation required.
