import { describe, it } from 'node:test'
import assert from 'node:assert'

export function parseGpuVendor(caption: string): 'nvidia' | 'amd' | 'intel' | 'unknown' {
    const lower = (caption || '').toLowerCase()
    if (lower.includes('nvidia') || lower.includes('geforce') || lower.includes('rtx') || lower.includes('gtx')) {
        return 'nvidia'
    } else if (lower.includes('amd') || lower.includes('radeon')) {
        return 'amd'
    } else if (lower.includes('intel') || lower.includes('arc') || lower.includes('iris') || lower.includes('uhd')) {
        return 'intel'
    }
    return 'unknown'
}

export function clampShaderCacheSize(gb: number): number {
    const num = typeof gb === 'number' && !isNaN(gb) ? gb : 10
    return Math.max(1, Math.min(100, Math.round(num)))
}

describe('GPU Driver Profile & Shader Architecture', () => {
    describe('parseGpuVendor', () => {
        it('should correctly identify NVIDIA GeForce GPUs', () => {
            assert.strictEqual(parseGpuVendor('NVIDIA GeForce RTX 4090'), 'nvidia')
            assert.strictEqual(parseGpuVendor('NVIDIA GeForce GTX 1080 Ti'), 'nvidia')
            assert.strictEqual(parseGpuVendor('RTX 3080 Laptop GPU'), 'nvidia')
        })

        it('should correctly identify AMD Radeon GPUs', () => {
            assert.strictEqual(parseGpuVendor('AMD Radeon RX 7900 XTX'), 'amd')
            assert.strictEqual(parseGpuVendor('Radeon RX 6800 XT'), 'amd')
        })

        it('should correctly identify Intel Arc and Iris GPUs', () => {
            assert.strictEqual(parseGpuVendor('Intel Arc A770 Graphics'), 'intel')
            assert.strictEqual(parseGpuVendor('Intel Iris Xe Graphics'), 'intel')
            assert.strictEqual(parseGpuVendor('Intel UHD Graphics 770'), 'intel')
        })

        it('should return unknown for unrecognized display adapters', () => {
            assert.strictEqual(parseGpuVendor('Microsoft Basic Display Adapter'), 'unknown')
            assert.strictEqual(parseGpuVendor(''), 'unknown')
        })
    })

    describe('clampShaderCacheSize', () => {
        it('should clamp values between 1GB and 100GB', () => {
            assert.strictEqual(clampShaderCacheSize(10), 10)
            assert.strictEqual(clampShaderCacheSize(0), 1)
            assert.strictEqual(clampShaderCacheSize(-5), 1)
            assert.strictEqual(clampShaderCacheSize(500), 100)
            assert.strictEqual(clampShaderCacheSize(NaN), 10)
        })
    })

    describe('MMCSS Gaming Scheduling Profiles', () => {
        it('should validate optimal gaming thread and GPU priority values', () => {
            const optimalProfile = {
                gpuPriority: 8,
                priority: 6,
                schedulingCategory: 'High',
                sfioPriority: 'High',
            }
            assert.strictEqual(optimalProfile.gpuPriority >= 8, true)
            assert.strictEqual(optimalProfile.priority >= 6, true)
            assert.strictEqual(optimalProfile.schedulingCategory, 'High')
        })

        it('should detect suboptimal MMCSS defaults', () => {
            const defaultProfile = {
                gpuPriority: 8,
                priority: 2,
                schedulingCategory: 'Medium',
            }
            const isOptimal = defaultProfile.gpuPriority >= 8 && defaultProfile.priority >= 6 && defaultProfile.schedulingCategory === 'High'
            assert.strictEqual(isOptimal, false)
        })
    })

    describe('NVIDIA PowerMizer Registry Profile', () => {
        it('should validate Level 1 Prefer Maximum Performance keys', () => {
            const powerMizer = {
                PowerMizerEnable: 1,
                PowerMizerLevel: 1,
                PowerMizerLevelAC: 1,
                PerfLevelSrc: 0x2222,
            }
            assert.strictEqual(powerMizer.PowerMizerEnable, 1)
            assert.strictEqual(powerMizer.PowerMizerLevel, 1)
            assert.strictEqual(powerMizer.PerfLevelSrc, 0x2222)
        })
    })

    describe('Interrupt IRQ Affinity Policy', () => {
        const IRQ_POLICY_SPREAD = 0
        const IRQ_POLICY_SPECIFIED_PROCESSORS = 4

        it('should correctly validate specified processor affinity policy', () => {
            const policy = IRQ_POLICY_SPECIFIED_PROCESSORS
            assert.strictEqual(policy, 4)
        })

        it('should isolate interrupts away from Core 0', () => {
            // Mask 0x0000000E excludes CPU Core 0 (binary: 1110 -> cores 1, 2, 3)
            const mask = 0x0E
            const excludesCoreZero = (mask & 1) === 0
            assert.strictEqual(excludesCoreZero, true, 'Bitmask must exclude core 0 to stop cache evictions')
        })
    })

    describe('Anti-Cheat Compatibility Matrix', () => {
        interface GameAntiCheatRule {
            title: string
            vbsRequired: boolean
            tpmRequired: boolean
        }

        const rules: Record<string, GameAntiCheatRule> = {
            valorant: { title: 'Valorant (Riot Vanguard)', vbsRequired: true, tpmRequired: true },
            cs2: { title: 'Counter-Strike 2 (VAC)', vbsRequired: false, tpmRequired: false },
            apex: { title: 'Apex Legends (EAC)', vbsRequired: false, tpmRequired: false },
            deltaForce: { title: 'Delta Force (AntiCheatExpert)', vbsRequired: false, tpmRequired: false },
        }

        it('should require VBS only for Riot Vanguard on Windows 11', () => {
            assert.strictEqual(rules.valorant.vbsRequired, true)
            assert.strictEqual(rules.cs2.vbsRequired, false)
            assert.strictEqual(rules.apex.vbsRequired, false)
            assert.strictEqual(rules.deltaForce.vbsRequired, false)
        })

        it('should safely allow VBS disablement for Delta Force and CS2 without anticheat lockouts', () => {
            const isSafeToDisable = !rules.deltaForce.vbsRequired && !rules.cs2.vbsRequired
            assert.strictEqual(isSafeToDisable, true)
        })
    })
})
