import { describe, it } from 'node:test'
import assert from 'node:assert'

function extractActionTags(text: string): { cleanText: string; actions: Array<{ raw: string; type: string; param?: string }> } {
    const regex = /\[ACTION:([A-Z0-9_]+)(?::([^\]]+))?\]/g
    const actions: Array<{ raw: string; type: string; param?: string }> = []
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
        actions.push({
            raw: match[0],
            type: match[1],
            param: match[2],
        })
    }
    const cleanText = text.replace(regex, '').trim()
    return { cleanText, actions }
}

describe('AI Copilot & Interactive In-Chat Action Engine', () => {
    it('should parse single action tag', () => {
        const text = 'Your system needs immediate calibration.\n[ACTION:TURBO_BOOST]'
        const { cleanText, actions } = extractActionTags(text)
        assert.strictEqual(cleanText, 'Your system needs immediate calibration.')
        assert.strictEqual(actions.length, 1)
        assert.strictEqual(actions[0].type, 'TURBO_BOOST')
        assert.strictEqual(actions[0].param, undefined)
    })

    it('should parse multiple action tags', () => {
        const text = '### Recommended Calibrations:\n[ACTION:TURBO_BOOST]\n[ACTION:TRIM_RAM]\n[ACTION:UNPARK_CORES]\n[ACTION:MSI_MODE]'
        const { cleanText, actions } = extractActionTags(text)
        assert.strictEqual(cleanText, '### Recommended Calibrations:')
        assert.strictEqual(actions.length, 4)
        assert.deepStrictEqual(
            actions.map((a) => a.type),
            ['TURBO_BOOST', 'TRIM_RAM', 'UNPARK_CORES', 'MSI_MODE']
        )
    })

    it('should parse parameterized action tag such as NAVIGATE', () => {
        const text = 'Check the network optimizer.\n[ACTION:NAVIGATE:network]'
        const { cleanText, actions } = extractActionTags(text)
        assert.strictEqual(cleanText, 'Check the network optimizer.')
        assert.strictEqual(actions.length, 1)
        assert.strictEqual(actions[0].type, 'NAVIGATE')
        assert.strictEqual(actions[0].param, 'network')
    })

    it('should handle text with zero action tags gracefully', () => {
        const text = 'Hello, all systems are operating normally.'
        const { cleanText, actions } = extractActionTags(text)
        assert.strictEqual(cleanText, text)
        assert.strictEqual(actions.length, 0)
    })
})
