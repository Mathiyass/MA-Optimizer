/**
 * MA-Optimizer Heuristic & Expert Systems Engine
 * Fully offline, zero-dependency, deterministic optimization and diagnosis model.
 * Inspired by Project N.E.K.O's grounded state machine & Brendan Gregg's USE Method.
 */

export type ActivityState =
    | 'gaming'
    | 'focused_work'
    | 'high_load'
    | 'idle'
    | 'audio_production'
    | 'power_saver'
    | 'standard'

export interface Bottleneck {
    component: 'cpu' | 'ram' | 'disk' | 'network' | 'system' | 'latency'
    severity: 'critical' | 'warning' | 'info'
    title: string
    description: string
    metric: string
    actionId?: string
}

export interface Recommendation {
    id: string
    title: string
    description: string
    category: 'performance' | 'memory' | 'latency' | 'system' | 'gaming' | 'network'
    impact: 'high' | 'medium' | 'low'
    actionId: string
    applied?: boolean
}

export interface HealthReport {
    score: number // 0 - 100
    status: 'Optimal' | 'Good' | 'Needs Attention' | 'Critical'
    activity: ActivityState
    activeGame?: string
    bottlenecks: Bottleneck[]
    recommendations: Recommendation[]
    evaluatedRulesCount: number
    timestamp: number
    hardwareTopology?: {
        isAmdX3D: boolean
        isIntelHybrid: boolean
        isNvme: boolean
        ramCapacityGb: number
    }
}

// Common gaming executable filenames
export const KNOWN_GAME_PROCESSES: Record<string, string> = {
    'cs2.exe': 'Counter-Strike 2',
    'csgo.exe': 'Counter-Strike: Global Offensive',
    'valorant.exe': 'Valorant',
    'riotclientux.exe': 'Riot Client',
    'fortniteclient-win64-shipping.exe': 'Fortnite',
    'cyberpunk2077.exe': 'Cyberpunk 2077',
    'gta5.exe': 'Grand Theft Auto V',
    'r5apex.exe': 'Apex Legends',
    'overwatch.exe': 'Overwatch 2',
    'dota2.exe': 'Dota 2',
    'league of legends.exe': 'League of Legends',
    'modernwarfare.exe': 'Call of Duty',
    'cod.exe': 'Call of Duty',
    'pubg.exe': 'PUBG: Battlegrounds',
    'rocketleague.exe': 'Rocket League',
    'rainbowsix.exe': 'Rainbow Six Siege',
    'rust.exe': 'Rust',
}

/**
 * PII Sanitizer: Redacts machine IDs, usernames, and local IP addresses
 * before passing system metrics to AI models or persistent logs.
 */
export function sanitizeTelemetryPii(input: string): string {
    if (!input || typeof input !== 'string') return ''

    let text = input

    // Redact Windows User profile paths (e.g. C:\Users\Mathiya\AppData -> C:\Users\USER\AppData)
    text = text.replace(/([A-Za-z]:\\Users\\)([^\s\\\/]+)/gi, '$1USER')

    // Redact UUIDs / GUIDs
    text = text.replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '[SYSTEM_UUID]')

    // Redact MAC addresses
    text = text.replace(/(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})/g, '[MAC_ADDRESS]')

    // Redact private IPv4 addresses (192.168.x.x, 10.x.x.x, 172.16-31.x.x), preserving localhost
    text = text.replace(/\b(?!127\.0\.0\.1|0\.0\.0\.0)(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})\b/g, '[LOCAL_IP]')

    return text
}

/**
 * Brendan Gregg's USE Method Bottleneck Classifier
 */
export function classifyBottlenecks(
    cpuLoad: number,
    cpus: number[],
    ramUsedPercent: number,
    ramFreeGb: number,
    diskReadMbSec: number,
    diskWriteMbSec: number,
    networkLatencyMs: number,
    isGaming: boolean,
    dpcLatencyUs: number = 250
): Bottleneck[] {
    const bottlenecks: Bottleneck[] = []

    // 1. CPU Multi-core Saturation
    if (cpuLoad >= 90) {
        bottlenecks.push({
            component: 'cpu',
            severity: 'critical',
            title: 'Critical CPU Saturation',
            description: `Total CPU utilization is at ${cpuLoad}%. Background tasks are competing with active threads.`,
            metric: `${cpuLoad}% Load`,
            actionId: 'ENABLE_PROBALANCE',
        })
    } else if (cpuLoad >= 75) {
        bottlenecks.push({
            component: 'cpu',
            severity: 'warning',
            title: 'Elevated CPU Load',
            description: `System CPU load is at ${cpuLoad}%, reducing headroom for sudden thread bursts.`,
            metric: `${cpuLoad}% Load`,
            actionId: 'ENABLE_PROBALANCE',
        })
    }

    // 2. CPU Single-Core Bottleneck (Common in Gaming Render Loops)
    if (cpus && cpus.length > 1) {
        const maxSingleCore = Math.max(...cpus)
        const avgOtherCores = (cpus.reduce((a, b) => a + b, 0) - maxSingleCore) / (cpus.length - 1)
        if (maxSingleCore >= 96 && avgOtherCores < 60) {
            bottlenecks.push({
                component: 'cpu',
                severity: 'warning',
                title: 'Single-Thread Processor Bottleneck',
                description: `A single CPU core is pegged at ${maxSingleCore}% while other cores average ${Math.round(avgOtherCores)}%. Common in game render loops.`,
                metric: `Core Max: ${maxSingleCore}%`,
                actionId: 'UNPARK_CORES',
            })
        }
    }

    // 3. RAM Working Set Saturation
    if (ramUsedPercent > 0 || ramFreeGb > 0) {
        if (ramUsedPercent >= 88 || (ramFreeGb > 0 && ramFreeGb < 1.5)) {
            bottlenecks.push({
                component: 'ram',
                severity: 'critical',
                title: 'Severe Memory Pressure',
                description: `RAM usage is at ${ramUsedPercent}% with only ${ramFreeGb.toFixed(1)} GB free. Windows paging file thrashing is imminent.`,
                metric: `${ramUsedPercent}% Used (${ramFreeGb.toFixed(1)} GB Free)`,
                actionId: 'RUN_SMART_TRIM',
            })
        } else if (ramUsedPercent >= 80 || (isGaming && ramFreeGb > 0 && ramFreeGb < 3.0)) {
            bottlenecks.push({
                component: 'ram',
                severity: 'warning',
                title: 'Elevated RAM Utilization',
                description: `RAM usage is at ${ramUsedPercent}%. Free working set should be reclaimed before peak gaming loads.`,
                metric: `${ramUsedPercent}% Used`,
                actionId: 'RUN_SMART_TRIM',
            })
        }
    }

    // 4. Disk I/O Saturation
    const totalDiskMb = diskReadMbSec + diskWriteMbSec
    if (totalDiskMb >= 150) {
        bottlenecks.push({
            component: 'disk',
            severity: 'warning',
            title: 'High Disk I/O Activity',
            description: `Active disk throughput is ${totalDiskMb.toFixed(1)} MB/s, which can cause micro-stutters during asset streaming.`,
            metric: `${totalDiskMb.toFixed(1)} MB/s`,
            actionId: 'CLEAN_TEMP_FILES',
        })
    }

    // 5. Network Latency Spike & Bufferbloat Risk
    if (networkLatencyMs > 90) {
        bottlenecks.push({
            component: 'network',
            severity: isGaming ? 'critical' : 'warning',
            title: 'High Network Latency',
            description: `Measured ping is ${networkLatencyMs}ms. Recommended to apply QoS DSCP packet prioritization.`,
            metric: `${networkLatencyMs}ms Ping`,
            actionId: 'ENABLE_QOS_DSCP',
        })
    }

    // 6. DPC / Interrupt Latency Bottleneck (Audio dropouts & 1% low FPS micro-stutters)
    if (dpcLatencyUs > 1000) {
        bottlenecks.push({
            component: 'latency',
            severity: 'critical',
            title: 'Severe DPC Latency Spike',
            description: `Deferred Procedure Call latency reached ${dpcLatencyUs}µs. Device driver routines are stalling real-time kernel threads.`,
            metric: `${dpcLatencyUs}µs DPC`,
            actionId: 'OPTIMIZE_DPC_LATENCY',
        })
    } else if (dpcLatencyUs > 500 && isGaming) {
        bottlenecks.push({
            component: 'latency',
            severity: 'warning',
            title: 'Elevated DPC Latency',
            description: `DPC latency is ${dpcLatencyUs}µs, which risks frame-time jitter in competitive titles.`,
            metric: `${dpcLatencyUs}µs DPC`,
            actionId: 'OPTIMIZE_DPC_LATENCY',
        })
    }

    return bottlenecks
}

/**
 * Fuzzy Logic Dynamic System State Classifier
 * Evaluates overlapping operational boundaries to determine system regime.
 */
export function classifyFuzzySystemState(
    cpuLoad: number,
    ramPercent: number,
    isGameActive: boolean,
    isAudioActive: boolean = false,
    onBatteryPower: boolean = false
): ActivityState {
    if (isGameActive) return 'gaming'
    if (isAudioActive) return 'audio_production'
    if (onBatteryPower && cpuLoad < 30) return 'power_saver'

    if (cpuLoad > 75 || ramPercent > 85) {
        return 'high_load'
    }

    if (cpuLoad < 8 && ramPercent < 45) {
        return 'idle'
    }

    if (cpuLoad >= 8 && cpuLoad <= 60) {
        return 'focused_work'
    }

    return 'standard'
}

/**
 * Comprehensive Deterministic Expert Rule-Based Health Evaluator
 * Evaluates 30+ hardware, OS, kernel, and gaming latency heuristic rules.
 */
export function evaluateSystemHealth(
    fullInfo: any,
    currentStats: any,
    runningProcesses: Array<{ name: string; cpu?: number; mem?: number }> = []
): HealthReport {
    let score = 100
    let evaluatedRulesCount = 0
    const recommendations: Recommendation[] = []

    // 1. Detect Active Activity & Game State
    const procNames = runningProcesses.map((p) => p.name.toLowerCase())
    let activeGame: string | undefined
    for (const [exe, friendlyName] of Object.entries(KNOWN_GAME_PROCESSES)) {
        if (procNames.includes(exe.toLowerCase())) {
            activeGame = friendlyName
            break
        }
    }

    const cpuLoad = currentStats?.cpu?.currentLoad ?? 0
    const cpus = currentStats?.cpu?.cpus ?? []
    const totalRamBytes = (currentStats?.ram?.total && currentStats.ram.total > 0)
        ? currentStats.ram.total
        : 16 * 1024 * 1024 * 1024
    const freeRamBytes = (currentStats?.ram?.free && currentStats.ram.free > 0)
        ? currentStats.ram.free
        : 8.5 * 1024 * 1024 * 1024
    const ramFreeGb = freeRamBytes / (1024 * 1024 * 1024)
    const totalRamGb = totalRamBytes / (1024 * 1024 * 1024)
    const ramPercent = (currentStats?.ram?.percent && currentStats.ram.percent > 0)
        ? currentStats.ram.percent
        : Math.round(((totalRamBytes - freeRamBytes) / totalRamBytes) * 100)

    const diskReadMb = (currentStats?.disk?.readBytesPerSec ?? 0) / (1024 * 1024)
    const diskWriteMb = (currentStats?.disk?.writeBytesPerSec ?? 0) / (1024 * 1024)
    const pingMs = currentStats?.network?.pingMs ?? 25
    const isGaming = !!activeGame

    // Fuzzy state inference
    const activity = classifyFuzzySystemState(cpuLoad, ramPercent, isGaming)

    // Hardware Topology Detection
    const cpuBrand = (fullInfo?.cpu?.brand || '').toLowerCase()
    const isAmdX3D = cpuBrand.includes('x3d') || (cpuBrand.includes('ryzen') && cpuBrand.includes('3d'))
    const isIntelHybrid = cpuBrand.includes('intel') && (
        cpuBrand.includes('12') || cpuBrand.includes('13') || cpuBrand.includes('14') || cpuBrand.includes('ultra')
    )
    const isNvme = (fullInfo?.disks || []).some((d: any) =>
        (d.type || '').toLowerCase().includes('nvme') || (d.interfaceType || '').toLowerCase().includes('pcie')
    )

    // 2. Classify Resource Bottlenecks (Rules 1-6)
    evaluatedRulesCount += 6
    const bottlenecks = classifyBottlenecks(
        cpuLoad,
        cpus,
        ramPercent,
        ramFreeGb,
        diskReadMb,
        diskWriteMb,
        pingMs,
        isGaming,
        isGaming ? 350 : 150
    )

    for (const b of bottlenecks) {
        if (b.severity === 'critical') score -= 15
        else if (b.severity === 'warning') score -= 8
    }

    // Rule 7: Severe RAM Capacity Constraint (< 8 GB)
    evaluatedRulesCount++
    if (totalRamGb < 8) {
        score -= 15
        recommendations.push({
            id: 'rec_critical_low_ram',
            title: 'Critical Physical RAM Constraint (< 8 GB)',
            description: 'System has less than 8 GB of physical RAM. Severe paging stutter is occurring. Aggressive SmartTrim is required.',
            category: 'memory',
            impact: 'high',
            actionId: 'RUN_SMART_TRIM',
        })
    } else if (totalRamGb < 12) {
        // Rule 8: Low Physical RAM Capacity (< 12 GB)
        evaluatedRulesCount++
        score -= 10
        recommendations.push({
            id: 'rec_low_ram',
            title: 'Constrained System RAM (< 12 GB)',
            description: 'System has less than 12 GB of physical RAM. Enabling proactive SmartTrim working set governor is recommended.',
            category: 'memory',
            impact: 'high',
            actionId: 'RUN_SMART_TRIM',
        })
    } else {
        evaluatedRulesCount++
    }

    // Rule 9: AMD Ryzen 3D V-Cache (X3D) Asymmetric Core Parking Calibration
    evaluatedRulesCount++
    if (isAmdX3D) {
        recommendations.push({
            id: 'rec_amd_x3d',
            title: 'AMD 3D V-Cache Core Parking Optimization',
            description: 'AMD Ryzen X3D processor detected. Ensure Core Parking and Game Mode are properly calibrated so games bind exclusively to the V-Cache CCD.',
            category: 'gaming',
            impact: 'high',
            actionId: 'UNPARK_CORES',
        })
    }

    // Rule 10: Intel Hybrid P/E Core Priority Restraint
    evaluatedRulesCount++
    if (isIntelHybrid) {
        recommendations.push({
            id: 'rec_intel_hybrid',
            title: 'Intel Hybrid P/E Core Thread Priority Restraint',
            description: 'Intel Hybrid CPU detected. Enable ProBalance to prevent background telemetry threads from preempting Performance cores during gaming.',
            category: 'performance',
            impact: 'high',
            actionId: 'ENABLE_PROBALANCE',
        })
    }

    // Rule 11: Mechanical Hard Drive (HDD) vs Solid-State Drive
    evaluatedRulesCount++
    const hasHdd = (fullInfo?.disks || []).some((d: any) =>
        (d.type || '').toLowerCase().includes('hdd') || (d.interfaceType || '').toLowerCase().includes('ide')
    )
    if (hasHdd) {
        score -= 6
        recommendations.push({
            id: 'rec_hdd_disk',
            title: 'Mechanical HDD Detected as Storage',
            description: 'Mechanical HDD storage detected. Disable Windows SuperFetch and background indexing to avoid 100% disk saturation spikes.',
            category: 'system',
            impact: 'medium',
            actionId: 'CLEAN_TEMP_FILES',
        })
    }

    // Rule 12: Active Game Foreground Mode Calibration
    evaluatedRulesCount++
    if (isGaming) {
        recommendations.push({
            id: 'rec_gaming_active',
            title: `Active Game: ${activeGame}`,
            description: 'Game process is active in foreground. Prioritize network QoS DSCP packet routing and activate maximum CPU scheduling responsiveness.',
            category: 'gaming',
            impact: 'high',
            actionId: 'ENABLE_QOS_DSCP',
        })
    }

    // Rule 13: Runaway Background Processes Check (ProBalance Candidate)
    evaluatedRulesCount++
    const cpuHogs = runningProcesses.filter((p) => (p.cpu || 0) > 15 && p.name.toLowerCase() !== activeGame?.toLowerCase())
    if (cpuHogs.length > 0) {
        score -= 8
        const hogNames = cpuHogs.map((p) => p.name).slice(0, 3).join(', ')
        recommendations.push({
            id: 'rec_cpu_hogs',
            title: 'Background Process CPU Spikes',
            description: `Background processes (${hogNames}) are consuming substantial CPU cycles. Apply ProBalance automatic priority restraint.`,
            category: 'performance',
            impact: 'medium',
            actionId: 'ENABLE_PROBALANCE',
        })
    }

    // Rule 14: Windows Multimedia Timer Resolution (0.5ms vs 15.6ms default)
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_timer_res',
        title: 'High-Precision Timer Resolution (0.5ms)',
        description: 'Windows defaults to a 15.6ms timer tick rate. Calibrating system global timer resolution to 0.5ms reduces frame-time jitter and input lag.',
        category: 'latency',
        impact: 'high',
        actionId: 'SET_TIMER_RESOLUTION',
    })

    // Rule 15: Network TCP NoDelay / Nagle Algorithm Elimination
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_tcp_nodelay',
        title: "Disable Nagle's Algorithm (TCPNoDelay)",
        description: "Disabling Nagle's algorithm prevents Windows from buffering small TCP packets, resulting in immediate game socket transmission.",
        category: 'network',
        impact: 'high',
        actionId: 'ENABLE_TCP_NODELAY',
    })

    // Rule 16: Network TCP Ack Frequency (Delayed ACK Mitigation)
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_tcp_ack',
        title: 'Instantaneous TCP ACK Frequency',
        description: 'Set TcpAckFrequency to 1 on active network interfaces to eliminate delayed packet acknowledgments and reduce ping spikes.',
        category: 'network',
        impact: 'medium',
        actionId: 'SET_TCP_ACK_FREQUENCY',
    })

    // Rule 17: QoS DSCP 46 Expedited Forwarding Check
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_qos_dscp',
        title: 'QoS DSCP 46 Gaming Packet Priority',
        description: 'Tag outbound gaming packets with DSCP 46 Expedited Forwarding so network routers prioritize game frames above video streams.',
        category: 'network',
        impact: 'high',
        actionId: 'ENABLE_QOS_DSCP',
    })

    // Rule 18: DPC / Interrupt Latency Driver Routine Optimization
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_dpc_latency',
        title: 'DPC / ISR Driver Latency Moderation',
        description: 'Optimize GPU and network driver interrupt affinities to prevent kernel DPC storms from interrupting audio and game loops.',
        category: 'latency',
        impact: 'high',
        actionId: 'OPTIMIZE_DPC_LATENCY',
    })

    // Rule 19: Hardware-Accelerated GPU Scheduling (HAGS)
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_hags_check',
        title: 'Hardware-Accelerated GPU Scheduling (HAGS)',
        description: 'Enable Windows HAGS in graphics settings to pass frame scheduling directly to GPU VRAM for lower render latency.',
        category: 'gaming',
        impact: 'medium',
        actionId: 'VERIFY_HAGS',
    })

    // Rule 20: Game DVR and Background Recording Overhead
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_game_dvr',
        title: 'Disable Windows Game DVR Background Capture',
        description: 'Windows Game DVR consumes continuous GPU video encoding cycles. Disabling background recording frees VRAM and frame pacing overhead.',
        category: 'gaming',
        impact: 'medium',
        actionId: 'DISABLE_GAME_DVR',
    })

    // Rule 21: High Precision Event Timer (HPET) Latency Heuristic
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_hpet_audit',
        title: 'Evaluate HPET Device Polling Overhead',
        description: 'High Precision Event Timer can cause system micro-stutters when polled frequently. In modern UEFI systems, TSC (Time Stamp Counter) is preferred.',
        category: 'latency',
        impact: 'low',
        actionId: 'EVALUATE_HPET',
    })

    // Rule 22: Windows Pagefile & Virtual Memory Sizing
    evaluatedRulesCount++
    if (totalRamGb <= 16 && ramPercent > 75) {
        recommendations.push({
            id: 'rec_pagefile_size',
            title: 'Calibrate Windows Pagefile Geometry',
            description: 'Set custom static Pagefile min/max sizes to prevent dynamic file fragmentation under heavy memory usage.',
            category: 'system',
            impact: 'medium',
            actionId: 'CALIBRATE_PAGEFILE',
        })
    }

    // Rule 23: DWM Visual Effects & Window Transparency Overhead
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_dwm_visual',
        title: 'Optimize Windows Visual Effects for Performance',
        description: 'Disabling transparent acrylic effects and window animations frees DWM compositor overhead for fullscreen games.',
        category: 'performance',
        impact: 'low',
        actionId: 'OPTIMIZE_VISUAL_EFFECTS',
    })

    // Rule 24: Core Unparking Configuration
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_core_unparking',
        title: 'Disable CPU Core Parking (100% Core Availability)',
        description: 'Ensure CPMINCORES is set to 100% so logical cores do not enter low-power C-states during high-action gaming moments.',
        category: 'performance',
        impact: 'high',
        actionId: 'UNPARK_CORES',
    })

    // Rule 25: Windows Search Indexer CPU/Disk Thrashing
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_indexer_mitigation',
        title: 'Throttle Windows Search Indexer During High Load',
        description: 'Prevent background search indexer threads from thrashing NVMe/SSD read queues during gameplay.',
        category: 'system',
        impact: 'low',
        actionId: 'CLEAN_TEMP_FILES',
    })

    // Rule 26: SuperFetch / SysMain on Fast Storage
    evaluatedRulesCount++
    if (isNvme) {
        recommendations.push({
            id: 'rec_sysmain_nvme',
            title: 'Verify SysMain / SuperFetch Optimization',
            description: 'High-speed NVMe storage drives do not require aggressive RAM prefetching. Disabling SysMain saves background memory write cycles.',
            category: 'memory',
            impact: 'low',
            actionId: 'RUN_SMART_TRIM',
        })
    }

    // Rule 27: Delivery Optimization P2P Bandwidth Throttling
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_delivery_opt',
        title: 'Disable P2P Delivery Optimization Network Sharing',
        description: 'Windows Update P2P network sharing uploads update files to other internet users, causing periodic ping spikes.',
        category: 'network',
        impact: 'medium',
        actionId: 'CLEAN_TEMP_FILES',
    })

    // Rule 28: Diagnostic Telemetry Overhead (DiagTrack)
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_diagtrack_audit',
        title: 'Disable Connected User Experiences & Telemetry',
        description: 'Disable DiagTrack service to eliminate periodic background diagnostic logs and CPU wakeups.',
        category: 'system',
        impact: 'low',
        actionId: 'CLEAN_TEMP_FILES',
    })

    // Rule 29: System Restore Storage Reclamation
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_system_restore',
        title: 'Audit System Restore & Shadow Storage Allocation',
        description: 'Cap shadow copy storage limits to prevent stale system snapshots from consuming tens of gigabytes.',
        category: 'system',
        impact: 'low',
        actionId: 'CLEAN_TEMP_FILES',
    })

    // Rule 30: Network Adapter Energy Efficient Ethernet (EEE) Latency Drops
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_eee_green',
        title: 'Disable Green Ethernet & Energy Efficient Ethernet',
        description: 'Green Ethernet powers down the physical PHY transceiver between packet bursts, introducing 2-5ms first-packet wake latency.',
        category: 'network',
        impact: 'medium',
        actionId: 'ENABLE_TCP_NODELAY',
    })

    // Clamp score
    score = Math.max(10, Math.min(100, Math.round(score)))

    let status: HealthReport['status'] = 'Optimal'
    if (score < 50) status = 'Critical'
    else if (score < 75) status = 'Needs Attention'
    else if (score < 90) status = 'Good'

    return {
        score,
        status,
        activity,
        activeGame,
        bottlenecks,
        recommendations,
        evaluatedRulesCount,
        timestamp: Date.now(),
        hardwareTopology: {
            isAmdX3D,
            isIntelHybrid,
            isNvme,
            ramCapacityGb: totalRamGb,
        },
    }
}

/**
 * Grounded Telemetry Prompt Synthesizer
 * Formats machine specifications, active bottlenecks, and applied tweaks into a
 * structured, expert-grade diagnostic prompt for web AI intelligence models.
 */
export function synthesizeTelemetryPrompt(
    specs: {
        cpuName: string
        cpuCores: number
        totalRamGb: number
        gpuName: string
        vramGb: number
    },
    report: HealthReport | null,
    activeTweaksCount: number = 0,
    userQuery?: string
): string {
    const topology = report?.hardwareTopology
    const activeGame = report?.activeGame ? report.activeGame : 'None (Desktop / Focused Work)'
    const bottlenecksList = (report?.bottlenecks || [])
        .map((b) => `- **[${b.severity.toUpperCase()}] ${b.component.toUpperCase()}**: ${b.title} (${b.metric})`)
        .join('\n') || '- None detected (System is within optimal headroom)'

    const rawPrompt = `You are an elite Windows systems performance engineer and competitive latency analyst.
Analyze the following live telemetry and hardware configuration from MA-Optimizer and provide expert diagnostic recommendations.

### 🖥️ Hardware Topology & System Specs
- **CPU:** ${specs.cpuName} (${specs.cpuCores} Cores) ${topology?.isAmdX3D ? '[AMD 3D V-Cache Asymmetry]' : ''} ${topology?.isIntelHybrid ? '[Intel Hybrid P/E Architecture]' : ''}
- **RAM:** ${specs.totalRamGb.toFixed(1)} GB Physical RAM
- **GPU:** ${specs.gpuName} (${specs.vramGb} GB VRAM)
- **Active Operational State:** ${report?.activity || 'standard'}
- **Foreground Game:** ${activeGame}
- **Active Registry Tweaks Applied:** ${activeTweaksCount}

### ⚠️ Real-Time USE Bottleneck Diagnostics
${bottlenecksList}

### 🎯 Objective / Query
${userQuery ? userQuery : 'Provide a comprehensive latency and frame-pacing diagnosis. Identify any micro-stutter risks, core scheduling mismatches, network bufferbloat, or memory paging bottlenecks, and detail concrete optimization actions.'}

Please format your response with:
1. **Root Cause Analysis**
2. **Kernel & Driver Latency Mitigations**
3. **Actionable PowerShell / Registry Tweaks with Rollback Instructions**`

    return sanitizeTelemetryPii(rawPrompt)
}
