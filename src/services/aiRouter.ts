/**
 * FRC God Platform 2027 — Zero-Cost Multi-AI Router
 * Supports: Groq (Llama-3.3-70B), OpenRouter (DeepSeek R1 :free, auto-free),
 *           Mistral Studio, Google AI Studio (gemini-3.8-flash)
 * Automatic priority-based failover across providers.
 */

export type AITaskRole = 'FAST_TUNING' | 'DEEP_MATH' | 'CODE_AUDIT' | 'STRATEGY'

export interface AIRequest {
  role: AITaskRole
  systemPrompt: string
  userPrompt: string
  jsonMode?: boolean
}

interface Provider {
  id: string
  url: string
  key: string | undefined
  model: string
}

const PROVIDERS: Record<string, Provider> = {
  groq: {
    id: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: import.meta.env.VITE_GROQ_API_KEY as string | undefined,
    model: 'llama-3.3-70b-versatile',
  },
  openrouterR1: {
    id: 'openrouterR1',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    key: import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined,
    model: 'deepseek/deepseek-r1:free',
  },
  openrouterFree: {
    id: 'openrouterFree',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    key: import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined,
    model: 'openrouter/auto:free',
  },
  mistral: {
    id: 'mistral',
    url: 'https://api.mistral.ai/v1/chat/completions',
    key: import.meta.env.VITE_MISTRAL_API_KEY as string | undefined,
    model: 'mistral-small-latest',
  },
  geminiFlash: {
    id: 'geminiFlash',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    key: import.meta.env.VITE_GEMINI_API_KEY as string | undefined,
    model: 'gemini-2.0-flash',
  },
}

function getPriorityQueue(role: AITaskRole): Provider[] {
  switch (role) {
    case 'DEEP_MATH':
      return [PROVIDERS.openrouterR1, PROVIDERS.geminiFlash, PROVIDERS.openrouterFree]
    case 'CODE_AUDIT':
      return [PROVIDERS.mistral, PROVIDERS.geminiFlash, PROVIDERS.openrouterFree]
    case 'FAST_TUNING':
      return [PROVIDERS.groq, PROVIDERS.geminiFlash, PROVIDERS.openrouterFree]
    case 'STRATEGY':
      return [PROVIDERS.geminiFlash, PROVIDERS.groq, PROVIDERS.openrouterFree]
    default:
      return [PROVIDERS.groq, PROVIDERS.geminiFlash, PROVIDERS.openrouterFree]
  }
}

async function callProvider(
  provider: Provider,
  req: AIRequest,
  signal?: AbortSignal,
): Promise<string> {
  const body: Record<string, unknown> = {
    model: provider.model,
    messages: [
      { role: 'system', content: req.systemPrompt },
      { role: 'user', content: req.userPrompt },
    ],
    temperature: req.role === 'DEEP_MATH' ? 0.1 : 0.35,
    max_tokens: req.role === 'DEEP_MATH' ? 2048 : 1024,
  }
  if (req.jsonMode) {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetch(provider.url, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.key}`,
      'HTTP-Referer': 'https://frc-god-platform.local',
      'X-Title': 'FRC God Platform 2027',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => `HTTP ${res.status}`)
    throw new Error(`${provider.id} → HTTP ${res.status}: ${errText.slice(0, 160)}`)
  }

  const data: { choices?: { message?: { content?: string } }[] } = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error(`${provider.id} → empty content in response`)
  return content
}

export interface AIResponse {
  content: string
  provider: string
  model: string
}

/**
 * Query the multi-AI router with automatic failover.
 * Returns the first successful response.
 */
export async function queryMultiAI(req: AIRequest, timeoutMs = 20_000): Promise<AIResponse> {
  const queue = getPriorityQueue(req.role).filter((p) => !!p.key)

  if (queue.length === 0) {
    throw new Error(
      'No AI API keys configured. Add VITE_GROQ_API_KEY, VITE_GEMINI_API_KEY, VITE_OPENROUTER_API_KEY, or VITE_MISTRAL_API_KEY to .env.local',
    )
  }

  const errors: string[] = []

  for (const provider of queue) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const content = await callProvider(provider, req, controller.signal)
      clearTimeout(timer)
      return { content, provider: provider.id, model: provider.model }
    } catch (err) {
      clearTimeout(timer)
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(msg)
      console.warn(`[aiRouter] ${provider.id} failed:`, msg)
    }
  }

  throw new Error(
    `All AI providers failed (role=${req.role}):\n` + errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n'),
  )
}

/** Convenience wrapper for FAST_TUNING (Groq → Gemini fallback) */
export const askTuner = (prompt: string, system = 'You are an expert FRC robot tuning assistant.') =>
  queryMultiAI({ role: 'FAST_TUNING', systemPrompt: system, userPrompt: prompt })

/** Convenience wrapper for DEEP_MATH (DeepSeek R1 → Gemini fallback) */
export const askMath = (prompt: string, system = 'You are an expert robotics physics and control systems engineer.') =>
  queryMultiAI({ role: 'DEEP_MATH', systemPrompt: system, userPrompt: prompt })
