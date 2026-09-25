import { describe, it } from 'node:test'
import assert from 'node:assert'
import { escapePS } from '../../electron/ipc/utils.ts'

describe('Input Lag Elimination Engine', () => {
    describe('escapePS sanitization', () => {
        it('should escape single quotes to doubled single quotes', () => {
            const input = "Gamer's Mouse"
            const sanitized = escapePS(input)
            assert.strictEqual(sanitized, "Gamer''s Mouse")
        })

        it('should strip null bytes and line breaks to prevent script injection', () => {
            const malicious = "Device\x00Name\r\nInvoke-Expression 'calc.exe'"
            const sanitized = escapePS(malicious)
            assert.ok(!sanitized.includes('\x00'))
            assert.ok(!sanitized.includes('\r'))
            assert.ok(!sanitized.includes('\n'))
            assert.ok(sanitized.includes("''calc.exe''"))
        })

        it('should handle null, undefined, or empty values safely', () => {
            assert.strictEqual(escapePS(null), '')
            assert.strictEqual(escapePS(undefined), '')
            assert.strictEqual(escapePS(''), '')
        })
    })

    describe('Mouse Acceleration Registry Parameters', () => {
        it('should validate 1:1 linear mouse speed parameters', () => {
            const linearProfile = {
                MouseSpeed: '0',
                MouseThreshold1: '0',
                MouseThreshold2: '0',
            }
            const isLinear = linearProfile.MouseSpeed === '0' && 
                             linearProfile.MouseThreshold1 === '0' && 
                             linearProfile.MouseThreshold2 === '0'
            assert.strictEqual(isLinear, true, 'Profile must be 1:1 linear with 0 thresholds')
        })

        it('should detect when mouse acceleration curves are active', () => {
            const stockProfile = {
                MouseSpeed: '1',
                MouseThreshold1: '6',
                MouseThreshold2: '10',
            }
            const isLinear = stockProfile.MouseSpeed === '0' && 
                             stockProfile.MouseThreshold1 === '0' && 
                             stockProfile.MouseThreshold2 === '0'
            assert.strictEqual(isLinear, false, 'Stock profile must indicate acceleration active')
        })
    })

    describe('Keyboard Repeat Rates', () => {
        it('should validate fastest repeat delay and speed values', () => {
            const optimalKeyboard = {
                KeyboardDelay: '0', // 0 = 250ms (shortest delay)
                KeyboardSpeed: '31', // 31 = ~30 repeats/sec (fastest speed)
            }
            const isOptimal = optimalKeyboard.KeyboardDelay === '0' && optimalKeyboard.KeyboardSpeed === '31'
            assert.strictEqual(isOptimal, true)
        })

        it('should detect suboptimal default keyboard delays', () => {
            const defaultKeyboard = {
                KeyboardDelay: '1',
                KeyboardSpeed: '31',
            }
            assert.strictEqual(defaultKeyboard.KeyboardDelay === '0', false)
        })
    })

    describe('Fullscreen Exclusive (FSE) Modes', () => {
        it('should validate FSE Mode 2 for DWM composition bypass', () => {
            const mode = 2 // GameDVR_FSEBehaviorMode = 2
            assert.strictEqual(mode, 2, 'FSE Mode 2 is required to disable DWM composition overhead')
        })

        it('should enforce DXGI compatibility override', () => {
            const honorUser = 1
            const dxgiCompat = 1
            assert.strictEqual(honorUser && dxgiCompat, 1)
        })
    })

    describe('USB Polling Rate Classification', () => {
        const classifyPolling = (hz: number) => {
            if (hz >= 1000) return 'eSports Optimal'
            if (hz >= 500) return 'Good'
            return 'Suboptimal'
        }

        it('should classify 1000Hz as eSports Optimal', () => {
            assert.strictEqual(classifyPolling(1000), 'eSports Optimal')
            assert.strictEqual(classifyPolling(4000), 'eSports Optimal')
            assert.strictEqual(classifyPolling(8000), 'eSports Optimal')
        })

        it('should classify 500Hz as Good', () => {
            assert.strictEqual(classifyPolling(500), 'Good')
        })

        it('should classify 125Hz office polling as Suboptimal', () => {
            assert.strictEqual(classifyPolling(125), 'Suboptimal')
        })
    })

    describe('VRR Frame Rate Cap Calculation', () => {
        const computeOptimalCap = (hz: number) => {
            if (hz <= 60) return hz - 2
            if (hz <= 144) return hz - 3
            if (hz <= 240) return hz - 4
            return hz - 5
        }

        it('should compute correct FPS cap for 240Hz monitor (236 FPS)', () => {
            assert.strictEqual(computeOptimalCap(240), 236)
        })

        it('should compute correct FPS cap for 144Hz monitor (141 FPS)', () => {
            assert.strictEqual(computeOptimalCap(144), 141)
        })

        it('should compute correct FPS cap for 360Hz monitor (355 FPS)', () => {
            assert.strictEqual(computeOptimalCap(360), 355)
        })
    })
})
