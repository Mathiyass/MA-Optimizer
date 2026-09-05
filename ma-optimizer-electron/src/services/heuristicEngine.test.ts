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
            assert.ok(report.evaluatedRulesCount >= 25, `Should evaluate >= 25 rules, got ${report.evaluatedRulesCount}`)
            assert.ok(report.hardwareTopology?.isAmdX3D, 'Should detect AMD 3D V-Cache')
        })

        it('should detect active game and set gaming activity state', () => {
            const mockInfo = { cpu: { brand: 'Intel Core i7-14700K' }, disks: [] }
            const mockStats = {
                cpu: { currentLoad: 50, cpus: [50, 50] },
                ram: { percent: 65, total: 16 * 1024 * 1024 * 1024, free: 6 * 1024 * 1024 * 1024 },
                disk: { readBytesPerSec: 0, writeBytesPerSec: 0 },
                network: { pingMs: 25 },
            }
            const procs = [{ name: 'cs2.exe', cpu: 45, mem: 20 }]
            const report = evaluateSystemHealth(mockInfo, mockStats, procs)
            assert.strictEqual(report.activity, 'gaming')
            assert.strictEqual(report.activeGame, 'Counter-Strike 2')
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
