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
    'deltaforceclient-win64-shipping.exe': 'Delta Force',
    'marvel-win64-shipping.exe': 'Marvel Rivals',
    'project8.exe': 'Deadlock',
    'discovery.exe': 'THE FINALS',
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
            description: `Measured ping is ${networkLatencyMs}ms. Recommended to apply ONT-Safe Game Boost and Winsock datagram buffer expansion.`,
            metric: `${networkLatencyMs}ms Ping`,
            actionId: 'APPLY_HITREG_GUARDIAN',
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

    // 7. Hit Registration Desync / Packet Batching Risk
    if (isGaming && (networkLatencyMs > 60 || dpcLatencyUs > 400)) {
        bottlenecks.push({
            component: 'network',
            severity: networkLatencyMs > 100 ? 'critical' : 'warning',
            title: 'Hit Registration & Desync Risk',
            description: `Elevated network latency (${networkLatencyMs}ms) or driver DPC jitter (${dpcLatencyUs}µs) during gameplay triggers packet batching and bullet hitreg desync.`,
            metric: `${networkLatencyMs}ms / ${dpcLatencyUs}µs`,
            actionId: 'OPTIMIZE_NIC_ESPORTS',
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

    // 2. Classify Resource Bottlenecks (Rules 1-7)
    evaluatedRulesCount += 7
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

    // Rule 31: eSports NIC Interrupt Moderation & Flow Control Calibration
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_nic_esports',
        title: 'Calibrate eSports NIC Interrupt Moderation & Flow Control',
        description: 'Disabling Interrupt Moderation, Flow Control, and Large Send Offload (LSO) on network adapters forces immediate packet processing, eliminating packet batching jitter in competitive titles.',
        category: 'network',
        impact: 'high',
        actionId: 'OPTIMIZE_NIC_ESPORTS',
    })

    // Rule 32: True Per-Interface Nagle Elimination
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_true_nagle_killer',
        title: 'True Per-Interface Nagle Algorithm Killer',
        description: 'Ensure TcpNoDelay and TcpAckFrequency are explicitly injected into every active interface GUID under Tcpip\\Parameters\\Interfaces to prevent silent packet buffering.',
        category: 'network',
        impact: 'high',
        actionId: 'APPLY_TRUE_NAGLE_KILLER',
    })

    // Rule 33: DirectX 12 & Unreal Engine Shader Cache Stutter / Bloat
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_shader_cache_clean',
        title: 'DirectX 12 & Unreal Engine Shader Cache Maintenance',
        description: 'Pruning corrupted or bloated NVIDIA DXCache, NV_Cache, and Unreal Engine ElectraCache removes micro-stutters and hitching during in-game asset streaming.',
        category: 'gaming',
        impact: 'medium',
        actionId: 'CLEAN_SHADER_CACHE',
    })

    // Rule 34: Resilient MTU Calibration & Packet Fragmentation Prevention
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_mtu_calibration',
        title: 'Calibrate Optimal MTU without ICMP Black Hole Drops',
        description: 'Test and lock network interface MTU against resilient low-latency gateways to prevent silent packet fragmentation and rubberbanding.',
        category: 'network',
        impact: 'medium',
        actionId: 'CALIBRATE_MTU',
    })

    // Rule 35: eSports Hit Registration & Winsock AFD Datagram Queue Expansion
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_hitreg_afd',
        title: 'eSports Hit Registration & Winsock UDP Queue Expansion',
        description: 'Enforce NIC power down restriction (*IdleRestriction=1, PnPCapabilities=24), strip 802.1p VLAN tags, disable global TCP RSC, and expand Winsock AFD datagram queues to 256 KB to eliminate bullet registration desync.',
        category: 'gaming',
        impact: 'high',
        actionId: 'APPLY_HITREG_GUARDIAN',
    })

    // Rule 36: Game Firewall & Anti-Cheat Subprocess Guardian
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_game_firewall',
        title: 'Game Firewall & Anti-Cheat Whitelist Audit',
        description: 'Scan Windows Firewall for silent block rules targeting game executables, UnrealCEFSubProcess, and anti-cheats (ACE, EAC, BattlEye, Vanguard), ensuring clean token exchange and connection.',
        category: 'network',
        impact: 'high',
        actionId: 'HEAL_GAME_FIREWALL',
    })

    // Rule 37: ONT-Safe QoS Routing & Orphan Policy Elimination
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_ont_safe_qos',
        title: 'ONT-Safe Game Routing & QoS Policy Cleaner',
        description: 'Ensure game routing avoids DSCP 46 / 802.1p Priority 7 headers on consumer fiber GPON ONTs (which drop tagged packets), and purge orphaned NetQosPolicy rules.',
        category: 'network',
        impact: 'high',
        actionId: 'PURGE_STALE_QOS',
    })

    // Rule 38: Intel I225-V Silicon Flaw Isolation & 1.0G Duplex Lock
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_i225_stepping_fix',
        title: 'Intel I225-V Hardware Errata & 1.0G Duplex Lock',
        description: 'Detect Intel I225-V B1/B2 stepping errata (inter-packet gap packet loss at 2.5G) and lock PHY to 1.0 Gbps Full Duplex with clock slave arbitration.',
        category: 'network',
        impact: 'high',
        actionId: 'APPLY_DEEP_NIC_FIX',
    })

    // Rule 39: Windows 11 Global Timer Resolution & Invariant TSC
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_kernel_timer_resolution',
        title: 'Windows 11 Global Timer Resolution & Invariant TSC',
        description: 'Bypass Windows 11 per-process timer throttling with GlobalTimerResolutionRequests=1, disable dynamic tick, and enforce native hardware TSC clock.',
        category: 'latency',
        impact: 'high',
        actionId: 'APPLY_TIMER_FIXES',
    })

    // Rule 40: NIC 1024 Ring Descriptors Expansion (Cure Buffer Starvation)
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_nic_buffer_starvation',
        title: 'NIC Ring Buffer Descriptor Expansion (1024 Descriptors)',
        description: 'Prevent packet drops during combat microbursts by expanding NIC Receive & Transmit Descriptors from default 256 to 1024 when Interrupt Moderation is disabled.',
        category: 'network',
        impact: 'high',
        actionId: 'APPLY_DEEP_NIC_FIX',
    })

    // Rule 41: NVIDIA GPU Dynamic P-State Clocks & TDR Delay Lock
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_gpu_dpc_clock_lock',
        title: 'NVIDIA GPU P0 Clock Lock & TDR Delay Optimization',
        description: 'Prevent nvlddmkm.sys DPC latency spikes caused by mid-combat GPU clock state drops via DisableDynamicPstate=1 and configure TDR delay recovery.',
        category: 'performance',
        impact: 'medium',
        actionId: 'APPLY_GPU_DPC_FIX',
    })

    // Rule 42: Realtek / HD Audio DAC D3 Sleep Latency Purge
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_audio_dac_idle_kill',
        title: 'Realtek / HD Audio DAC D3 Sleep Latency Purge',
        description: 'Disable Realtek audio driver power state transitions to eliminate 2-5ms DPC latency stalls when gunshots or footsteps wake sleeping audio codecs.',
        category: 'latency',
        impact: 'medium',
        actionId: 'APPLY_AUDIO_DPC_FIX',
    })

    // Rule 43: NVMe APST Storage Autonomous Sleep Throttling Kill
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_nvme_apst_disable',
        title: 'NVMe APST Storage Autonomous Sleep Throttling Kill',
        description: 'Disable NVMe Autonomous Power State Transitions (APST) and AHCI link sleep to prevent 50-100ms asset loading micro-stutters during match gameplay.',
        category: 'performance',
        impact: 'medium',
        actionId: 'APPLY_STORAGE_POWER_FIX',
    })

    // Rule 44: Advanced TCP/UDP Offload Strip, CUBIC & Core Pinning
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_advanced_stack_hardening',
        title: 'Advanced TCP/UDP Offload Strip, CUBIC & Core Pinning',
        description: 'Disable USO/URO offloads, enforce CUBIC congestion, set NetworkThrottlingIndex=10 for lowest NDIS DPC spread, and isolate NIC RSS queues away from CPU Core 0.',
        category: 'network',
        impact: 'high',
        actionId: 'APPLY_ADVANCED_STACK_FIX',
    })

    // Rule 45: Virtualization-Based Security (VBS) Gaming Penalty
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_vbs_mitigation',
        title: 'Virtualization-Based Security (VBS) Gaming Penalty',
        description: 'Windows VBS runs the OS inside a Type-1 Hyper-V container, causing 5-15% lower 1% lows and increased DPC interrupt latency during gaming.',
        category: 'performance',
        impact: 'high',
        actionId: 'OPTIMIZE_SECURITY_MATRIX',
    })

    // Rule 46: Hypervisor-Protected Code Integrity (HVCI / Memory Integrity)
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_hvci_mitigation',
        title: 'Hypervisor-Protected Code Integrity (HVCI)',
        description: 'HVCI forces kernel-mode drivers through cryptographic validation on every memory page execution, adding measurable frame-time spikes in competitive shooters.',
        category: 'performance',
        impact: 'high',
        actionId: 'OPTIMIZE_SECURITY_MATRIX',
    })

    // Rule 47: Control Flow Guard (CFG) Direct Call Indirect Stutter
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_cfg_mitigation',
        title: 'Control Flow Guard (CFG) Exploit Mitigation Audit',
        description: 'CFG inserts runtime bitmap checks before every indirect call instruction, imposing microsecond overhead on heavy game loop dispatchers.',
        category: 'gaming',
        impact: 'medium',
        actionId: 'OPTIMIZE_SECURITY_MATRIX',
    })

    // Rule 48: Spectre / Meltdown Speculative Execution Mitigation Overhead
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_spectre_mitigation',
        title: 'Spectre Variant 2 / Meltdown Branch Target Injection Audit',
        description: 'Speculative execution branch mitigations incur kernel context switch penalties. Pure eSports profiles disable them for raw IPC and lowest draw call latency.',
        category: 'performance',
        impact: 'medium',
        actionId: 'OPTIMIZE_SECURITY_MATRIX',
    })

    // Rule 49: Windows Memory Compression CPU Overhead
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_memory_compression_audit',
        title: 'Windows Memory Compression CPU Cycle Overhead',
        description: 'Memory Compression compresses idle pages in RAM using CPU cycles, stealing CPU cache lines and execution resources during intensive gaming moments.',
        category: 'memory',
        impact: 'medium',
        actionId: 'OPTIMIZE_MEMORY_ENGINE',
    })

    // Rule 50: Memory Page Combining / Deduplication Latency
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_page_combining_audit',
        title: 'Memory Page Combining & Deduplication Purge',
        description: 'Windows periodically scans RAM to merge identical physical pages, triggering periodic micro-freezes and L3 cache pollution.',
        category: 'memory',
        impact: 'low',
        actionId: 'OPTIMIZE_MEMORY_ENGINE',
    })

    // Rule 51: Standby List Memory Leak & Cache Churn (ISLC Standby Purge)
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_islc_standby_purge',
        title: 'Intelligent Standby List Purge (ISLC Architecture)',
        description: 'Windows Standby Memory Cache frequently causes stuttering when free RAM drops below 1-2GB. Automated purge cleans cached pages before allocation stalls occur.',
        category: 'memory',
        impact: 'high',
        actionId: 'PURGE_STANDBY_CACHE',
    })

    // Rule 52: NVMe Fixed Virtual Memory / Pagefile Geometry
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_fixed_pagefile_nvme',
        title: 'Fixed NVMe Pagefile Geometry (Cure Dynamic Resizing Stutter)',
        description: 'Dynamic Windows Pagefile resizing forces the kernel to pause disk queues. A static initial/maximum pagefile sized to physical RAM eliminates dynamic page faults.',
        category: 'memory',
        impact: 'medium',
        actionId: 'OPTIMIZE_PAGEFILE_STATIC',
    })

    // Rule 53: Hardware-Accelerated GPU Scheduling (HAGS) Frame Queue
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_hags_frame_queue',
        title: 'Hardware-Accelerated GPU Scheduling (HAGS) Optimization',
        description: 'Passes video memory management directly to GPU dedicated scheduling hardware, reducing CPU render thread submission overhead in modern DirectX 12/UE5 titles.',
        category: 'gaming',
        impact: 'high',
        actionId: 'OPTIMIZE_GPU_PIPELINE',
    })

    // Rule 54: Modern Multi-Plane Overlay (MPO) Desktop Compositor Stutter Kill
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_modern_mpo_disable',
        title: 'Modern Multi-Plane Overlay (MPO) Compositor Stutter Kill',
        description: 'Windows MPO often glitches between borderless window and fullscreen modes. Setting DisableOverlays=1 and OverlayTestMode=5 stops black screens and frame drops.',
        category: 'gaming',
        impact: 'high',
        actionId: 'OPTIMIZE_GPU_PIPELINE',
    })

    // Rule 55: Windows Fullscreen Optimizations & GameDVR Recording Overhead
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_fso_dvr_optimization',
        title: 'Windows Fullscreen Optimizations & GameDVR Teardown',
        description: 'Enforce native Exclusive Fullscreen semantics and eradicate background GameDVR capture services for maximum refresh rate frame pacing.',
        category: 'gaming',
        impact: 'medium',
        actionId: 'OPTIMIZE_GPU_PIPELINE',
    })

    // Rule 56: Foreground Process Quantum Priority 3:1 (Win32PrioritySeparation 0x26)
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_win32_priority_separation',
        title: 'Foreground Thread Quantum Priority 3:1 (Win32PrioritySeparation=38)',
        description: 'Configures short, variable execution quantums with a 3:1 ratio favoring foreground game threads over background services and tasks.',
        category: 'performance',
        impact: 'high',
        actionId: 'APPLY_QUANTUM_PRIORITY',
    })

    // Rule 57: TCP Fast Open (TFO) Connection Handshake Acceleration
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_tcp_fast_open',
        title: 'TCP Fast Open (TFO) Connection Handshake Acceleration',
        description: 'Enables data transmission during the initial TCP SYN packet handshake, eliminating one entire round-trip time (RTT) on reconnects and game server queries.',
        category: 'network',
        impact: 'medium',
        actionId: 'OPTIMIZE_NETWORK_STACK',
    })

    // Rule 58: DNS-over-HTTPS (DoH) Latency & ISP Hijacking Shield
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_doh_encryption',
        title: 'DNS-over-HTTPS (DoH) Secure Low-Latency Resolution',
        description: 'Bypasses ISP DNS throttling and transparent packet inspection by enforcing encrypted DoH directly to Cloudflare (1.1.1.1) or Google (8.8.8.8) gaming endpoints.',
        category: 'network',
        impact: 'medium',
        actionId: 'OPTIMIZE_NETWORK_STACK',
    })

    // Rule 59: CPU Processor Performance Boost Mode & Frequency Lock
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_cpu_boost_mode_lock',
        title: 'Processor Performance Boost Mode & 100% Frequency Floor',
        description: 'Locks processor performance floor to 100% and sets Boost Mode to Aggressive, eliminating frequency ramp-up latency when sudden combat occurs.',
        category: 'performance',
        impact: 'high',
        actionId: 'APPLY_POWER_BOOST',
    })

    // Rule 60: Processor C-States & Deep Sleep Idle Latency Mitigation
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_cstate_idle_mitigation',
        title: 'Processor C-States & Deep Sleep Wake Latency Mitigation',
        description: 'Disables deep processor sleep states (C3/C6/C7) via powercfg, preventing CPU core wake latency penalties that cause 10-50µs frame hitches.',
        category: 'latency',
        impact: 'high',
        actionId: 'APPLY_POWER_BOOST',
    })

    // Rule 61: Network Adapter 802.1p Hardware Packet Priority & VLAN Tagging
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_nic_hardware_priority_vlan',
        title: 'Hardware 802.1p Packet Priority & VLAN Tagging',
        description: 'Enables *PriorityVLANTag on physical NICs so hardware queues respect Windows QoS DSCP 46 / 802.1p Priority 7 game packets rather than discarding them.',
        category: 'network',
        impact: 'high',
        actionId: 'OPTIMIZE_NETWORK_STACK',
    })

    // Rule 62: Windows Multimedia Network Throttling Elimination
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_network_throttling_index_kill',
        title: 'Windows Multimedia Network Throttling Elimination',
        description: 'Sets NetworkThrottlingIndex to 0xFFFFFFFF, eliminating the default 10-packet/ms cap that induces artificial packet loss during intense multiplayer firefights.',
        category: 'latency',
        impact: 'high',
        actionId: 'OPTIMIZE_NETWORK_STACK',
    })

    // Rule 63: Redundant Secondary DNS Failover
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_dns_single_point_of_failure',
        title: 'Redundant Low-Latency Secondary DNS Failover',
        description: 'Configures 1.1.1.1 or 8.8.8.8 as secondary DNS fallback alongside local AdGuard Home/Pi-hole, eliminating 300ms+ cold query stalls when local resolver queues.',
        category: 'network',
        impact: 'medium',
        actionId: 'OPTIMIZE_NETWORK_STACK',
    })

    // Rule 64: Router & Gateway Bufferbloat UDP Desync Mitigation
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_router_bufferbloat_mitigation',
        title: 'Router Stateful Firewall & Bufferbloat UDP Desync Cure',
        description: 'Audits GPON ONT / router stateful inspection levels to prevent router CPU flood defenses from dropping high tick rate (60-128Hz) UDP shooter packets.',
        category: 'network',
        impact: 'high',
        actionId: 'OPTIMIZE_NETWORK_STACK',
    })

    // Rule 65: Router SNTP Clock Sync & Session Drift Shield
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_gpon_sntp_clock_sync',
        title: 'Router SNTP Clock Synchronization & Session Drift Shield',
        description: 'Enforces pool.ntp.org/time.google.com synchronization on residential gateways, curing 1970 clock freezes that corrupt NAT state tables and SSL handshakes.',
        category: 'network',
        impact: 'medium',
        actionId: 'OPTIMIZE_NETWORK_STACK',
    })

    // Rule 66: Mouse Acceleration & Pointer Precision Kill
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_mouse_acceleration_kill',
        title: 'Mouse Acceleration & Pointer Precision Kill',
        description: 'Enforces linear 1:1 raw mouse input by eliminating Windows cursor acceleration curves (MouseSpeed=0), ensuring exact muscle memory reproduction.',
        category: 'latency',
        impact: 'high',
        actionId: 'OPTIMIZE_INPUT_LAG',
    })

    // Rule 67: USB HID Polling Rate & Driver Stack Audit
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_usb_polling_rate_audit',
        title: 'USB HID Polling Rate & Driver Stack Audit',
        description: 'Audits USB mouse and keyboard polling rates to ensure 1000Hz (1ms) click-to-photon packet reporting without CPU thread starvation.',
        category: 'latency',
        impact: 'medium',
        actionId: 'OPTIMIZE_INPUT_LAG',
    })

    // Rule 68: Fullscreen Exclusive (FSE) Behavior Override
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_fse_behavior_mode',
        title: 'Fullscreen Exclusive (FSE) Behavior Override',
        description: 'Forces GameDVR_FSEBehaviorMode=2 in GameConfigStore to bypass Desktop Window Manager (DWM) composition buffers in modern FPS titles.',
        category: 'gaming',
        impact: 'high',
        actionId: 'OPTIMIZE_GAMING_DISPLAY',
    })

    // Rule 69: Keyboard Repeat Latency & Strike Speed Optimization
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_keyboard_repeat_optimization',
        title: 'Keyboard Repeat Latency & Strike Speed Optimization',
        description: 'Reduces keyboard repeat delay to minimum (0) and maxes repeat speed (31) via user32 SystemParametersInfo for instant ADAD counter-strafing.',
        category: 'latency',
        impact: 'medium',
        actionId: 'OPTIMIZE_INPUT_LAG',
    })

    // Rule 70: MMCSS Gaming Task GPU Priority & Quantum Boost
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_mmcss_game_gpu_priority',
        title: 'MMCSS Gaming Task GPU Priority & Quantum Boost',
        description: 'Calibrates Windows Multimedia Class Scheduler Tasks\\Games with GPU Priority=8 and Priority=6 for dedicated GPU thread time.',
        category: 'gaming',
        impact: 'high',
        actionId: 'APPLY_MMCSS_PROFILE',
    })

    // Rule 71: GPU Power Management Fixed Clock Floor
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_gpu_power_management',
        title: 'GPU Power Management Fixed Clock Floor',
        description: 'Locks driver power state to Prefer Maximum Performance, preventing GPU core clock downclocking during smoke/particle explosions.',
        category: 'performance',
        impact: 'high',
        actionId: 'APPLY_GPU_PROFILE',
    })

    // Rule 72: DirectX & Vulkan 10GB Shader Cache Sizing
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_shader_cache_sizing',
        title: 'DirectX & Vulkan 10GB Shader Cache Sizing',
        description: 'Expands GPU shader cache quota to 10GB, permanently eliminating mid-match compilation stutters when entering newly rendered zones.',
        category: 'performance',
        impact: 'medium',
        actionId: 'APPLY_GPU_PROFILE',
    })

    // Rule 73: Device Interrupt IRQ Affinity & Core Isolation
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_interrupt_affinity_tuning',
        title: 'Device Interrupt IRQ Affinity & Core Isolation',
        description: 'Audits PCI interrupt line affinity to isolate GPU and 2.5GbE NIC interrupts away from core 0, preventing CPU cache eviction.',
        category: 'latency',
        impact: 'medium',
        actionId: 'TUNE_INTERRUPT_AFFINITY',
    })

    // Rule 74: HPET Platform Clock & Invariant TSC Audit
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_hpet_timer_audit',
        title: 'HPET Platform Clock & Invariant TSC Audit',
        description: 'Ensures the operating system uses the low-overhead CPU invariant Time Stamp Counter (TSC) rather than high-latency external HPET timer loops.',
        category: 'system',
        impact: 'medium',
        actionId: 'AUDIT_HPET_TIMER',
    })

    // Rule 75: Windows Game Mode Thread Scheduling Calibration
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_game_mode_validation',
        title: 'Windows Game Mode Thread Scheduling Calibration',
        description: 'Enforces Windows Game Mode kernel state, prioritizing foreground game threads and suppressing background maintenance tasks.',
        category: 'gaming',
        impact: 'medium',
        actionId: 'ENABLE_GAME_MODE',
    })

    // Rule 76: Anti-Cheat & Virtualization-Based Security (VBS) Matrix
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_valorant_vbs_warning',
        title: 'Anti-Cheat & Virtualization-Based Security (VBS) Matrix',
        description: 'Verifies VBS / HVCI configuration compatibility against kernel-level anti-cheats (Riot Vanguard, FaceIT, AntiCheatExpert).',
        category: 'gaming',
        impact: 'high',
        actionId: 'AUDIT_SECURITY_MATRIX',
    })

    // Rule 77: Reflex & Variable Refresh Rate (VRR) FPS Cap Alignment
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_fps_cap_below_refresh',
        title: 'Reflex & Variable Refresh Rate (VRR) FPS Cap Alignment',
        description: 'Recommends capping in-game frame rates 3-4 FPS below native monitor refresh rate (e.g., 236 FPS on 240Hz) to eliminate GPU render queue backlog.',
        category: 'gaming',
        impact: 'medium',
        actionId: 'CALIBRATE_REFRESH_RATE',
    })

    // Rule 78: USB Root Hub Selective Suspend Power Cut
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_usb_power_management_kill',
        title: 'USB Root Hub Selective Suspend Power Cut',
        description: 'Disables USB Hub selective suspend and sleep states, preventing mouse sensor sleep timeouts during slow angle holds.',
        category: 'latency',
        impact: 'medium',
        actionId: 'OPTIMIZE_INPUT_LAG',
    })

    // Rule 79: Desktop Window Manager (DWM) Composition Overhead Audit
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_dwm_composition_audit',
        title: 'Desktop Window Manager (DWM) Composition Overhead Audit',
        description: 'Calibrates DWM flip presentation model and disables windowed gaming multiplane overlays to guarantee tear-free minimum input lag.',
        category: 'performance',
        impact: 'high',
        actionId: 'OPTIMIZE_DWM_PIPELINE',
    })

    // Rule 80: Background Task Power Throttling & EcoQoS Management
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_background_app_throttle',
        title: 'Background Task Power Throttling & EcoQoS Management',
        description: 'Enforces EcoQoS power throttling on non-gaming background helper tasks, preserving full IPC throughput for active shooter threads.',
        category: 'performance',
        impact: 'medium',
        actionId: 'CONFIGURE_POWER_THROTTLE',
    })

    // Rule 81: Intel I225-V MSI-X DevicePriority High (Affinity Policy)
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_nic_msix_device_priority',
        title: 'Intel I225-V MSI-X DevicePriority High',
        description: 'Elevates network interface controller interrupt priority to High (3) in Windows Affinity Policy, eliminating micro-jitter in frame delivery.',
        category: 'network',
        impact: 'high',
        actionId: 'CONFIGURE_NIC_MSIX_PRIORITY',
    })

    // Rule 82: NIC Selective Suspend & Power Down Kill
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_nic_selective_suspend_kill',
        title: 'NIC Selective Suspend & Power Down Kill',
        description: 'Locks adapter power state to active (SelectiveSuspend=0), eliminating PCIe Link Wake latency spikes and intermittent hitreg drop.',
        category: 'network',
        impact: 'medium',
        actionId: 'DISABLE_NIC_SELECTIVE_SUSPEND',
    })

    // Rule 83: Direct Cache Access (DCA) Kernel Enablement
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_dca_enablement',
        title: 'Direct Cache Access (DCA) Kernel Enablement',
        description: 'Allows Intel I225-V NIC to pre-load received network packets directly into CPU L3 cache slices, skipping DRAM memory bus hops.',
        category: 'network',
        impact: 'high',
        actionId: 'ENABLE_DCA',
    })

    // Rule 84: Dead Gateway Detection Elimination
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_dead_gateway_detection_kill',
        title: 'Dead Gateway Detection Elimination',
        description: 'Prevents TCP stack from attempting failover renegotiation under momentary packet drops (DeadGWDetectDefault=0), preserving connection lock.',
        category: 'network',
        impact: 'low',
        actionId: 'DISABLE_DEAD_GW_DETECT',
    })

    // Rule 85: ICMP Redirect Route Hijack Prevention
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_icmp_redirect_disable',
        title: 'ICMP Redirect Route Hijack Prevention',
        description: 'Blocks unverified local network route injection (EnableICMPRedirect=0) to guarantee packets follow the deterministic optical gateway path.',
        category: 'network',
        impact: 'low',
        actionId: 'DISABLE_ICMP_REDIRECT',
    })

    // Rule 86: DefaultTTL Fingerprint Normalization (TTL=64)
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_ttl_64_lock',
        title: 'DefaultTTL Fingerprint Normalization (TTL=64)',
        description: 'Locks outbound IP packet time-to-live to 64 (DefaultTTL=64), matching native Linux/FreeBSD routing behavior and preventing ISP OS-fingerprint throttling.',
        category: 'network',
        impact: 'low',
        actionId: 'LOCK_DEFAULT_TTL',
    })

    // Rule 87: NetBIOS over TCP/IP Daemon Teardown
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_netbios_disable',
        title: 'NetBIOS over TCP/IP Daemon Teardown',
        description: 'Disables NetBIOS name resolution broadcasting on gaming adapters (NetbiosOptions=2), eliminating background port 137/138 broadcast chatter.',
        category: 'network',
        impact: 'medium',
        actionId: 'DISABLE_NETBIOS',
    })

    // Rule 88: Unused Wireless NIC Dormancy Audit
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_unused_wifi_disable',
        title: 'Unused Wireless NIC Dormancy Audit',
        description: 'Disables dormant secondary Wi-Fi and Bluetooth PAN adapters to stop continuous 2.4/5GHz beacon scanning loops that interrupt Ethernet DPC queues.',
        category: 'network',
        impact: 'low',
        actionId: 'DISABLE_UNUSED_WIFI',
    })

    // Rule 89: Post-Optimization DNS Resolver Cache Flush
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_dns_cache_flush',
        title: 'Post-Optimization DNS Resolver Cache Flush',
        description: 'Purges Windows dnscache client table after network mutations to ensure instant resolution through low-latency local recursors.',
        category: 'network',
        impact: 'low',
        actionId: 'FLUSH_DNS_CACHE',
    })

    // Rule 90: Linux Server BBR Bottleneck Bandwidth Congestion Control
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_server_bbr_congestion',
        title: 'Linux Server BBR Congestion Control & fq Qdisc',
        description: 'Ensures dedicated LAN upstream gateways and home servers operate with Google BBR congestion control and fq packet scheduler, eliminating queue buildup.',
        category: 'network',
        impact: 'high',
        actionId: 'VERIFY_SERVER_BBR',
    })

    // Rule 91: Unbound Zero-Latency Recursive DNS Serve-Expired
    evaluatedRulesCount++
    recommendations.push({
        id: 'rec_server_dns_serve_expired',
        title: 'Unbound Zero-Latency DNS Serve-Expired Mode',
        description: 'Configures upstream recursive Unbound DNS to serve expired cache records immediately while refreshing asynchronously in background (<1.5ms lookups).',
        category: 'network',
        impact: 'high',
        actionId: 'VERIFY_UNBOUND_SERVE_EXPIRED',
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
