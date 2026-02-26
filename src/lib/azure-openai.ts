/**
 * Azure OpenAI integration module.
 *
 * Provides a unified `callLLM` function that routes requests to Azure OpenAI
 * when configured (via VITE_AZURE_OPENAI_ENDPOINT / VITE_AZURE_OPENAI_API_KEY),
 * and falls back to `window.spark.llm()` otherwise.
 */

const AZURE_OPENAI_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT as string | undefined
const AZURE_OPENAI_API_KEY = import.meta.env.VITE_AZURE_OPENAI_API_KEY as string | undefined
const AZURE_OPENAI_API_VERSION = (import.meta.env.VITE_AZURE_OPENAI_API_VERSION as string) || '2024-08-01-preview'

const DEPLOYMENT_MAP: Record<string, string> = {
  'gpt-4o-mini': (import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_GPT4O_MINI as string) || 'gpt-4o-mini',
  'gpt-4o': (import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_GPT4O as string) || 'gpt-4o',
}

function isAzureConfigured(): boolean {
  return !!(AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_API_KEY)
}

/**
 * Returns `true` when the application is connected to Azure OpenAI.
 * Components can use this to show "Powered by Azure OpenAI" branding.
 */
export function isAzureOpenAIConnected(): boolean {
  return isAzureConfigured()
}

async function callAzureOpenAI(
  prompt: string,
  model: string,
  jsonMode?: boolean,
): Promise<string> {
  const deployment = DEPLOYMENT_MAP[model] || model
  const endpoint = AZURE_OPENAI_ENDPOINT!.replace(/\/+$/, '')
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`

  const body: Record<string, unknown> = {
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 4096,
  }

  if (jsonMode) {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': AZURE_OPENAI_API_KEY!,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error')
    throw new Error(`Azure OpenAI request failed (${res.status}): ${errorText}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

/**
 * Call the configured LLM provider.
 *
 * When Azure OpenAI environment variables are set the request is routed to
 * Azure OpenAI. Otherwise it falls back to `window.spark.llm()`.
 *
 * @param prompt  - The full prompt text to send.
 * @param model   - Model name (e.g. 'gpt-4o-mini', 'gpt-4o').
 * @param jsonMode - When `true`, instructs the model to return valid JSON.
 * @returns The model's response text.
 */
export async function callLLM(
  prompt: string,
  model: string = 'gpt-4o-mini',
  jsonMode?: boolean,
): Promise<string> {
  if (isAzureConfigured()) {
    return callAzureOpenAI(prompt, model, jsonMode)
  }

  // Fallback: GitHub Spark LLM
  if (typeof window !== 'undefined' && window.spark?.llm) {
    return window.spark.llm(prompt, model, jsonMode)
  }

  throw new Error('No AI provider configured. Set VITE_AZURE_OPENAI_ENDPOINT and VITE_AZURE_OPENAI_API_KEY environment variables.')
}
