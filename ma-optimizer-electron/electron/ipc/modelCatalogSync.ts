import { sendLog, sendError } from './logger'

export interface ModelCatalogCache {
    lastSynced: number
    openrouterFreeModels: string[]
    pollinationsModels: string[]
}

const CACHE_KEY = 'ai_model_catalog_cache'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 Hours

// Fallback pool of verified zero-cost architectures
export const DEFAULT_OPENROUTER_FREE_MODELS = [
    'deepseek/deepseek-chat-v3-0324:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'deepseek/deepseek-r1:free',
    'google/gemma-3-27b-it:free',
    'qwen/qwen3-coder-480b:free',
    'openrouter/free',
]

export const DEFAULT_POLLINATIONS_MODELS = [
    'gemini-2.0-flash',
    'mistral-nemo',
    'mistral-small-3.2',
    'gpt-4o',
    'openai',
]

// Ephemeral memory cooldown map for rate-limited endpoints (HTTP 429)
const cooldownMap = new Map<string, number>()

function getStore(): any {
    try {
        const Store = require('electron-store')
        return new Store()
    } catch {
        return null
    }
}

/**
 * Check whether a provider or model is currently in a temporary cooldown period
 */
export function isProviderInCooldown(key: string): boolean {
    const expiresAt = cooldownMap.get(key)
    if (!expiresAt) return false
    if (Date.now() > expiresAt) {
        cooldownMap.delete(key)
        return false
    }
    return true
}

/**
 * Mark a provider or model as cooling down (e.g. upon receiving HTTP 429)
 */
export function markProviderCooldown(key: string, durationMs: number = 60 * 1000): void {
    cooldownMap.set(key, Date.now() + durationMs)
    sendLog(`[AI Catalog] Endpoint ${key} placed on cooldown for ${Math.round(durationMs / 1000)}s`)
}

/**
 * Filter OpenRouter catalog items for zero-cost prompt and completion
 */
export function extractZeroCostModels(data: any[]): string[] {
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

    // Ensure meta-router is present
    if (!freeSlugs.includes('openrouter/free')) {
        freeSlugs.push('openrouter/free')
    }

    return freeSlugs
}

/**
 * Synchronize the dynamic free model catalog from OpenRouter and Pollinations
 */
export async function synchronizeModelCatalog(force: boolean = false): Promise<ModelCatalogCache> {
    const store = getStore()
    const cached = store ? (store.get(CACHE_KEY) as ModelCatalogCache | undefined) : undefined

    if (!force && cached && Date.now() - cached.lastSynced < CACHE_TTL_MS) {
        return cached
    }

    sendLog('[AI Catalog] Initiating background discovery for zero-cost LLM endpoints...')
    let openrouterFreeModels = cached?.openrouterFreeModels || [...DEFAULT_OPENROUTER_FREE_MODELS]
    let pollinationsModels = cached?.pollinationsModels || [...DEFAULT_POLLINATIONS_MODELS]

    // 1. Discover OpenRouter :free endpoints
    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)
        const res = await fetch('https://openrouter.ai/api/v1/models', {
            signal: controller.signal,
            headers: {
                'HTTP-Referer': 'https://github.com/Mathiyass/MA-Optimizer',
                'X-Title': 'MA-Optimizer Discovery Engine',
            },
        })
        clearTimeout(timeout)

        if (res.ok) {
            const json = (await res.json()) as any
            const models = extractZeroCostModels(json?.data || [])
            if (models.length > 0) {
                openrouterFreeModels = models
                sendLog(`[AI Catalog] OpenRouter dynamic free pool synchronized: ${models.length} zero-cost models found`)
            }
        }
    } catch (e: any) {
        sendLog(`[AI Catalog] OpenRouter catalog sync skipped: ${e.message || e}`)
    }

    // 2. Discover Pollinations endpoints
    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
        const res = await fetch('https://gen.pollinations.ai/v1/models', {
            signal: controller.signal,
        })
        clearTimeout(timeout)

        if (res.ok) {
            const json = (await res.json()) as any
            const list = Array.isArray(json) ? json : json?.data
            if (Array.isArray(list)) {
                const modelNames = list.map((m: any) => (typeof m === 'string' ? m : m?.id)).filter(Boolean)
                if (modelNames.length > 0) {
                    pollinationsModels = [...new Set([...modelNames, ...DEFAULT_POLLINATIONS_MODELS])]
                    sendLog(`[AI Catalog] Pollinations dynamic roster synchronized: ${pollinationsModels.length} models detected`)
                }
            }
        }
    } catch (e: any) {
        sendLog(`[AI Catalog] Pollinations models discovery skipped: ${e.message || e}`)
    }

    const payload: ModelCatalogCache = {
        lastSynced: Date.now(),
        openrouterFreeModels,
        pollinationsModels,
    }

    if (store) {
        try {
            store.set(CACHE_KEY, payload)
        } catch {}
    }

    return payload
}

/**
 * Retrieve cached or default catalog
 */
export function getModelCatalog(): ModelCatalogCache {
    const store = getStore()
    if (store) {
        const cached = store.get(CACHE_KEY) as ModelCatalogCache | undefined
        if (cached && Array.isArray(cached.openrouterFreeModels)) {
            return cached
        }
    }
    return {
        lastSynced: 0,
        openrouterFreeModels: DEFAULT_OPENROUTER_FREE_MODELS,
        pollinationsModels: DEFAULT_POLLINATIONS_MODELS,
    }
}

/**
 * Ingress Context Clamping Defense
 * Clamps messages to avoid silent server-side drops and truncation hazards.
 */
export function clampContextMessages(messages: any[], maxCharBudget: number = 8000): any[] {
    if (!Array.isArray(messages) || messages.length === 0) return []

    const systemMsg = messages.find((m) => m.role === 'system')
    const userMsgs = messages.filter((m) => m.role !== 'system')

    let currentLength = systemMsg ? (systemMsg.content || '').length : 0
    const clampedUserMsgs: any[] = []

    // Work backwards from most recent messages
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
