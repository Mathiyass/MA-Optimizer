import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
    sanitizeTelemetryPii,
    classifyBottlenecks,
    classifyFuzzySystemState,
    evaluateSystemHealth,
    synthesizeTelemetryPrompt,
} from './heuristicEngine.ts'

describe('Autonomous Heuristic Engine & Neural Models', () => {
    describe('sanitizeTelemetryPii', () => {
        it('should redact Windows User profile directories', () => {
            const raw = 'Log file at C:\\Users\\Mathiya\\AppData\\Local\\Temp\\error.log'
            const sanitized = sanitizeTelemetryPii(raw)
            assert.strictEqual(sanitized, 'Log file at C:\\Users\\USER\\AppData\\Local\\Temp\\error.log')
        })

        it('should redact GUIDs and UUIDs', () => {
            const raw = 'Device GUID: {54533751-8270-4d6d-87c6-145531aee0ee}'
            const sanitized = sanitizeTelemetryPii(raw)
            assert.ok(!sanitized.includes('54533751-8270-4d6d-87c6-145531aee0ee'))
            assert.ok(sanitized.includes('[SYSTEM_UUID]'))
        })

        it('should redact MAC addresses', () => {
            const raw = 'Network adapter MAC 00:1A:2B:3C:4D:5E connected'
            const sanitized = sanitizeTelemetryPii(raw)
            assert.ok(!sanitized.includes('00:1A:2B:3C:4D:5E'))
            assert.ok(sanitized.includes('[MAC_ADDRESS]'))
        })

        it('should redact private IPs but preserve localhost', () => {
            const raw = 'Connecting from 192.168.1.105 to 127.0.0.1:11434'
            const sanitized = sanitizeTelemetryPii(raw)
            assert.ok(!sanitized.includes('192.168.1.105'))
            assert.ok(sanitized.includes('[LOCAL_IP]'))
            assert.ok(sanitized.includes('127.0.0.1:11434'))
        })
    })

    describe('classifyBottlenecks (USE Method)', () => {
        it('should detect critical CPU multi-core saturation', () => {
            const bottlenecks = classifyBottlenecks(95, [95, 95, 95, 95], 50, 8, 10, 10, 20, false)
            const cpuB = bottlenecks.find(b => b.component === 'cpu' && b.severity === 'critical')
            assert.ok(cpuB, 'Should have critical CPU bottleneck')
            assert.strictEqual(cpuB?.actionId, 'ENABLE_PROBALANCE')
        })

        it('should detect single-core processor bottleneck during gaming', () => {
            // Core 0 pegged at 99%, while other cores are idle at ~20%
            const bottlenecks = classifyBottlenecks(40, [99, 20, 25, 20], 50, 8, 10, 10, 20, true)
            const singleCoreB = bottlenecks.find(b => b.title.includes('Single-Thread'))
            assert.ok(singleCoreB, 'Should detect single-core bottleneck')
        })

        it('should detect critical memory pressure when RAM is full', () => {
            const bottlenecks = classifyBottlenecks(30, [30, 30], 92, 0.8, 5, 5, 20, false)
            const ramB = bottlenecks.find(b => b.component === 'ram' && b.severity === 'critical')
            assert.ok(ramB, 'Should have critical RAM bottleneck')
            assert.strictEqual(ramB?.actionId, 'RUN_SMART_TRIM')
        })

        it('should detect disk I/O saturation', () => {
            const bottlenecks = classifyBottlenecks(30, [30], 50, 8, 120, 60, 20, false) // 180 MB/s total
            const diskB = bottlenecks.find(b => b.component === 'disk')
            assert.ok(diskB, 'Should detect disk I/O bottleneck')
        })

        it('should detect network latency spike', () => {
            const bottlenecks = classifyBottlenecks(30, [30], 50, 8, 5, 5, 120, true) // 120ms ping in game
            const netB = bottlenecks.find(b => b.component === 'network' && b.severity === 'critical')
            assert.ok(netB, 'Should detect network latency spike in game')
        })

        it('should detect critical DPC latency spike', () => {
            const bottlenecks = classifyBottlenecks(25, [25, 25], 50, 8, 5, 5, 20, false, 1250)
            const dpcB = bottlenecks.find(b => b.component === 'latency' && b.severity === 'critical')
            assert.ok(dpcB, 'Should detect severe DPC latency spike')
            assert.strictEqual(dpcB?.actionId, 'OPTIMIZE_DPC_LATENCY')
        })

        it('should detect hit registration desync risk during gaming with high latency or DPC', () => {
            const bottlenecks = classifyBottlenecks(40, [40, 40], 50, 8, 5, 5, 75, true, 450)
            const hitregB = bottlenecks.find(b => b.actionId === 'OPTIMIZE_NIC_ESPORTS')
            assert.ok(hitregB, 'Should detect hit registration desync risk')
            assert.strictEqual(hitregB?.severity, 'warning')

            // Critical if ping > 100
            const criticalB = classifyBottlenecks(40, [40, 40], 50, 8, 5, 5, 110, true, 450)
            const critHitreg = criticalB.find(b => b.actionId === 'OPTIMIZE_NIC_ESPORTS')
            assert.strictEqual(critHitreg?.severity, 'critical')
        })
    })

    describe('classifyFuzzySystemState', () => {
        it('should prioritize gaming when game is active', () => {
            assert.strictEqual(classifyFuzzySystemState(40, 50, true), 'gaming')
        })

        it('should detect high load regime', () => {
            assert.strictEqual(classifyFuzzySystemState(85, 60, false), 'high_load')
        })

        it('should detect idle state when resources are quiescent', () => {
            assert.strictEqual(classifyFuzzySystemState(3, 40, false), 'idle')
        })

        it('should detect focused work state under standard desktop loads', () => {
            assert.strictEqual(classifyFuzzySystemState(35, 55, false), 'focused_work')
        })
    })

    describe('evaluateSystemHealth', () => {
        it('should calculate an optimal score for an unconstrained system and evaluate 30+ rules', () => {
            const mockInfo = {
                cpu: { brand: 'AMD Ryzen 7 7800X3D 8-Core' },
                disks: [{ type: 'NVMe SSD', interfaceType: 'PCIe' }],
            }
            const mockStats = {
                cpu: { currentLoad: 15, cpus: [15, 15, 15, 15] },
                ram: { percent: 45, total: 32 * 1024 * 1024 * 1024, free: 18 * 1024 * 1024 * 1024 },
                disk: { readBytesPerSec: 1024 * 1024, writeBytesPerSec: 1024 * 1024 },
                network: { pingMs: 18 },
            }
            const report = evaluateSystemHealth(mockInfo, mockStats, [])
            assert.ok(report.score >= 90, `Score should be >= 90, got ${report.score}`)
            assert.strictEqual(report.status, 'Optimal')
            assert.ok(report.evaluatedRulesCount >= 80, `Should evaluate >= 80 rules, got ${report.evaluatedRulesCount}`)
            assert.ok(report.hardwareTopology?.isAmdX3D, 'Should detect AMD 3D V-Cache')

            // Verify Rules 31-80 recommendations exist
            const recIds = report.recommendations.map(r => r.id)
            assert.ok(recIds.includes('rec_nic_esports'), 'Should include eSports NIC rule')
            assert.ok(recIds.includes('rec_true_nagle_killer'), 'Should include True Nagle Killer rule')
            assert.ok(recIds.includes('rec_shader_cache_clean'), 'Should include Shader Cache Clean rule')
            assert.ok(recIds.includes('rec_mtu_calibration'), 'Should include MTU calibration rule')
            assert.ok(recIds.includes('rec_hitreg_afd'), 'Should include Hitreg AFD buffer rule')
            assert.ok(recIds.includes('rec_game_firewall'), 'Should include Game Firewall Whitelist rule')
            assert.ok(recIds.includes('rec_ont_safe_qos'), 'Should include ONT-Safe QoS rule')
            assert.ok(recIds.includes('rec_i225_stepping_fix'), 'Should include Intel I225-V stepping fix rule')
            assert.ok(recIds.includes('rec_kernel_timer_resolution'), 'Should include Kernel Timer Resolution rule')
            assert.ok(recIds.includes('rec_nic_buffer_starvation'), 'Should include NIC buffer starvation rule')
            assert.ok(recIds.includes('rec_gpu_dpc_clock_lock'), 'Should include GPU DPC clock lock rule')
            assert.ok(recIds.includes('rec_audio_dac_idle_kill'), 'Should include Audio DAC idle kill rule')
            assert.ok(recIds.includes('rec_nvme_apst_disable'), 'Should include NVMe APST disable rule')
            assert.ok(recIds.includes('rec_advanced_stack_hardening'), 'Should include Advanced Stack Hardening rule')
            assert.ok(recIds.includes('rec_vbs_mitigation'), 'Should include VBS mitigation rule')
            assert.ok(recIds.includes('rec_hvci_mitigation'), 'Should include HVCI mitigation rule')
            assert.ok(recIds.includes('rec_cfg_mitigation'), 'Should include CFG mitigation rule')
            assert.ok(recIds.includes('rec_spectre_mitigation'), 'Should include Spectre mitigation rule')
            assert.ok(recIds.includes('rec_memory_compression_audit'), 'Should include Memory compression rule')
            assert.ok(recIds.includes('rec_page_combining_audit'), 'Should include Page combining rule')
            assert.ok(recIds.includes('rec_islc_standby_purge'), 'Should include ISLC standby purge rule')
            assert.ok(recIds.includes('rec_fixed_pagefile_nvme'), 'Should include NVMe fixed pagefile rule')
            assert.ok(recIds.includes('rec_hags_frame_queue'), 'Should include HAGS frame queue rule')
            assert.ok(recIds.includes('rec_modern_mpo_disable'), 'Should include MPO disable rule')
            assert.ok(recIds.includes('rec_fso_dvr_optimization'), 'Should include FSO/DVR teardown rule')
            assert.ok(recIds.includes('rec_win32_priority_separation'), 'Should include Win32PrioritySeparation rule')
            assert.ok(recIds.includes('rec_tcp_fast_open'), 'Should include TCP Fast Open rule')
            assert.ok(recIds.includes('rec_doh_encryption'), 'Should include DNS-over-HTTPS rule')
            assert.ok(recIds.includes('rec_cpu_boost_mode_lock'), 'Should include CPU boost mode rule')
            assert.ok(recIds.includes('rec_cstate_idle_mitigation'), 'Should include C-state idle latency rule')
            assert.ok(recIds.includes('rec_nic_hardware_priority_vlan'), 'Should include Hardware Priority & VLAN rule')
            assert.ok(recIds.includes('rec_network_throttling_index_kill'), 'Should include NetworkThrottlingIndex kill rule')
            assert.ok(recIds.includes('rec_dns_single_point_of_failure'), 'Should include DNS single point of failure rule')
            assert.ok(recIds.includes('rec_router_bufferbloat_mitigation'), 'Should include Router bufferbloat mitigation rule')
            assert.ok(recIds.includes('rec_gpon_sntp_clock_sync'), 'Should include GPON SNTP clock sync rule')
            assert.ok(recIds.includes('rec_mouse_acceleration_kill'), 'Should include Mouse acceleration kill rule')
            assert.ok(recIds.includes('rec_usb_polling_rate_audit'), 'Should include USB polling rate audit rule')
            assert.ok(recIds.includes('rec_fse_behavior_mode'), 'Should include FSE behavior mode rule')
            assert.ok(recIds.includes('rec_keyboard_repeat_optimization'), 'Should include Keyboard repeat optimization rule')
            assert.ok(recIds.includes('rec_mmcss_game_gpu_priority'), 'Should include MMCSS game GPU priority rule')
            assert.ok(recIds.includes('rec_gpu_power_management'), 'Should include GPU power management rule')
            assert.ok(recIds.includes('rec_shader_cache_sizing'), 'Should include Shader cache sizing rule')
            assert.ok(recIds.includes('rec_interrupt_affinity_tuning'), 'Should include Interrupt affinity tuning rule')
            assert.ok(recIds.includes('rec_hpet_timer_audit'), 'Should include HPET timer audit rule')
            assert.ok(recIds.includes('rec_game_mode_validation'), 'Should include Game mode validation rule')
            assert.ok(recIds.includes('rec_valorant_vbs_warning'), 'Should include Valorant VBS warning rule')
            assert.ok(recIds.includes('rec_fps_cap_below_refresh'), 'Should include FPS cap below refresh rule')
            assert.ok(recIds.includes('rec_usb_power_management_kill'), 'Should include USB power management kill rule')
            assert.ok(recIds.includes('rec_dwm_composition_audit'), 'Should include DWM composition audit rule')
            assert.ok(recIds.includes('rec_background_app_throttle'), 'Should include Background app throttle rule')
        })

        it('should detect active game (including modern 2026 FPS titles like Delta Force) and set gaming activity state', () => {
            const mockInfo = { cpu: { brand: 'Intel Core i7-14700K' }, disks: [] }
            const mockStats = {
                cpu: { currentLoad: 50, cpus: [50, 50] },
                ram: { percent: 65, total: 16 * 1024 * 1024 * 1024, free: 6 * 1024 * 1024 * 1024 },
                disk: { readBytesPerSec: 0, writeBytesPerSec: 0 },
                network: { pingMs: 25 },
            }
            const procs = [{ name: 'DeltaForceClient-Win64-Shipping.exe', cpu: 45, mem: 20 }]
            const report = evaluateSystemHealth(mockInfo, mockStats, procs)
            assert.strictEqual(report.activity, 'gaming')
            assert.strictEqual(report.activeGame, 'Delta Force')
        })

        it('should penalize health score and generate recommendations under heavy load', () => {
            const mockInfo = { cpu: { brand: 'Intel' }, disks: [{ type: 'HDD', interfaceType: 'SATA' }] }
            const mockStats = {
                cpu: { currentLoad: 95, cpus: [95, 95] },
                ram: { percent: 91, total: 8 * 1024 * 1024 * 1024, free: 0.5 * 1024 * 1024 * 1024 },
                disk: { readBytesPerSec: 100 * 1024 * 1024, writeBytesPerSec: 80 * 1024 * 1024 },
                network: { pingMs: 110 },
            }
            const procs = [{ name: 'hog.exe', cpu: 55 }]
            const report = evaluateSystemHealth(mockInfo, mockStats, procs)
            assert.ok(report.score <= 60, `Score should be <= 60 under extreme load, got ${report.score}`)
            assert.ok(report.recommendations.length >= 3, 'Should have multiple recommendations')
            assert.ok(report.bottlenecks.length >= 3, 'Should detect multiple bottlenecks')
        })
    })

    describe('synthesizeTelemetryPrompt', () => {
        it('should format clean, sanitized diagnostic prompt with hardware specs', () => {
            const specs = {
                cpuName: 'AMD Ryzen 7 7800X3D',
                cpuCores: 8,
                totalRamGb: 32,
                gpuName: 'NVIDIA GeForce RTX 4080',
                vramGb: 16,
            }
            const report = evaluateSystemHealth(
                { cpu: { brand: 'AMD Ryzen 7 7800X3D' }, disks: [{ type: 'NVMe' }] },
                { cpu: { currentLoad: 20 }, ram: { percent: 40 } },
                [{ name: 'cs2.exe' }]
            )

            const prompt = synthesizeTelemetryPrompt(specs, report, 12, 'Fix my CS2 input lag')
            assert.ok(prompt.includes('AMD Ryzen 7 7800X3D'))
            assert.ok(prompt.includes('Counter-Strike 2'))
            assert.ok(prompt.includes('Fix my CS2 input lag'))
            assert.ok(prompt.includes('32.0 GB Physical RAM'))
            assert.ok(!prompt.includes('Mathiya'))
        })
    })
})
