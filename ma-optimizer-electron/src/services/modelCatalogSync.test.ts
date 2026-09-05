import { describe, it } from 'node:test'
import assert from 'node:assert'

function extractZeroCostModels(data: any[]): string[] {
    if (!Array.isArray(data)) return []
    const freeSlugs: string[] = []

    for (const item of data) {
        if (!item || typeof item.id !== 'string') continue

        const pricing = item.pricing || {}
        const isPromptFree = pricing.prompt === 0 || pricing.prompt === '0' || pricing.prompt === '0.000000'
        const isCompletionFree = pricing.completion === 0 || pricing.completion === '0' || pricing.completion === '0.000000'

        if (isPromptFree && isCompletionFree) {
            freeSlugs.push(item.id)
        }
    }

    if (!freeSlugs.includes('openrouter/free')) {
        freeSlugs.push('openrouter/free')
    }

    return freeSlugs
}

function clampContextMessages(messages: any[], maxCharBudget: number = 8000): any[] {
    if (!Array.isArray(messages) || messages.length === 0) return []

    const systemMsg = messages.find((m) => m.role === 'system')
    const userMsgs = messages.filter((m) => m.role !== 'system')

    let currentLength = systemMsg ? (systemMsg.content || '').length : 0
    const clampedUserMsgs: any[] = []

    for (let i = userMsgs.length - 1; i >= 0; i--) {
        const msg = userMsgs[i]
        const content = typeof msg.content === 'string' ? msg.content : ''
        if (currentLength + content.length <= maxCharBudget || clampedUserMsgs.length === 0) {
            clampedUserMsgs.unshift({
                role: msg.role,
                content: content.length > 3000 ? content.slice(0, 3000) + '... [truncated for context safety]' : content,
            })
            currentLength += Math.min(content.length, 3000)
        } else {
            break
        }
    }

    return systemMsg ? [systemMsg, ...clampedUserMsgs] : clampedUserMsgs
}

describe('Zero-Cost Catalog Synchronization & Hazard Protection', () => {
    describe('extractZeroCostModels', () => {
        it('should extract zero-cost models and exclude metered paid models', () => {
            const rawCatalog = [
                {
                    id: 'meta-llama/llama-3.3-70b-instruct:free',
                    pricing: { prompt: '0', completion: '0' },
                },
                {
                    id: 'deepseek/deepseek-r1:free',
                    pricing: { prompt: 0, completion: 0 },
                },
                {
                    id: 'anthropic/claude-3.5-sonnet',
                    pricing: { prompt: '0.000003', completion: '0.000015' },
                },
                {
                    id: 'openai/gpt-4o',
                    pricing: { prompt: 0.000005, completion: 0.000015 },
                },
            ]

            const freeModels = extractZeroCostModels(rawCatalog)
            assert.ok(freeModels.includes('meta-llama/llama-3.3-70b-instruct:free'))
            assert.ok(freeModels.includes('deepseek/deepseek-r1:free'))
            assert.ok(!freeModels.includes('anthropic/claude-3.5-sonnet'))
            assert.ok(!freeModels.includes('openai/gpt-4o'))
            assert.ok(freeModels.includes('openrouter/free'), 'Must include meta-router')
        })

        it('should handle empty or malformed catalog gracefully', () => {
            const empty = extractZeroCostModels([])
            assert.deepStrictEqual(empty, ['openrouter/free'])

            const malformed = extractZeroCostModels(null as any)
            assert.deepStrictEqual(malformed, [])
        })
    })

    describe('clampContextMessages', () => {
        it('should preserve system prompt and fit user messages within budget', () => {
            const messages = [
                { role: 'system', content: 'You are MATHIYA AI.' },
                { role: 'user', content: 'Old question 1' },
                { role: 'assistant', content: 'Old answer 1' },
                { role: 'user', content: 'Recent question' },
            ]

            const clamped = clampContextMessages(messages, 500)
            assert.strictEqual(clamped[0].role, 'system')
            assert.strictEqual(clamped[0].content, 'You are MATHIYA AI.')
            assert.ok(clamped.some((m) => m.content === 'Recent question'))
        })

        it('should truncate individual massive messages exceeding chunk limit', () => {
            const hugeText = 'A'.repeat(5000)
            const messages = [
                { role: 'system', content: 'System' },
                { role: 'user', content: hugeText },
            ]

            const clamped = clampContextMessages(messages, 10000)
            assert.ok(clamped[1].content.length <= 3100)
            assert.ok(clamped[1].content.includes('[truncated for context safety]'))
        })
    })
})
