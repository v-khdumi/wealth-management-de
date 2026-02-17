import type {
  User,
  ClientProfile,
  RiskProfile,
  Goal,
  Portfolio,
  Holding,
  Instrument,
  ModelPortfolio,
  AiInteraction,
  Order,
} from './types'
import { calculatePortfolioAllocations, getRecommendedModel, calculateDrift } from './business-logic'

export interface AiResponse {
  content: string
  sources: string[]
  model: string
  offlineMode: boolean
}

interface FactsPacket {
  client?: {
    name: string
    age: number
    segment: string
    onboardingDate: string
  }
  riskProfile?: {
    score: number
    category: string
    lastUpdated: string
    daysOld: number
  }
  portfolio?: {
    totalValue: number
    cash: number
    cashPercentage: number
    holdingsCount: number
  }
  allocations?: Array<{
    assetClass: string
    value: number
    percentage: number
  }>
  model?: {
    name: string
    description: string
  }
  drift?: number
  goals?: Array<{
    type: string
    name: string
    targetAmount: number
    currentAmount: number
    gap: number
    targetDate: string
    monthlyContribution: number
  }>
  holdings?: Array<{
    symbol: string
    name: string
    quantity: number
    value: number
    percentage: number
  }>
}

function buildClientFactsPacket(
  client: User,
  profile: ClientProfile,
  riskProfile: RiskProfile,
  portfolio: Portfolio,
  goals: Goal[]
): FactsPacket {
  const age = Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  const daysOld = Math.floor((Date.now() - new Date(riskProfile.lastUpdated).getTime()) / (1000 * 60 * 60 * 24))

  return {
    client: {
      name: client.name,
      age,
      segment: profile.segment,
      onboardingDate: profile.onboardingDate,
    },
    riskProfile: {
      score: riskProfile.score,
      category: riskProfile.category,
      lastUpdated: riskProfile.lastUpdated,
      daysOld,
    },
    portfolio: {
      totalValue: portfolio.totalValue,
      cash: portfolio.cash,
      cashPercentage: (portfolio.cash / portfolio.totalValue) * 100,
      holdingsCount: 0,
    },
    goals: goals.map(g => ({
      type: g.type,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      gap: g.targetAmount - g.currentAmount,
      targetDate: g.targetDate,
      monthlyContribution: g.monthlyContribution,
    })),
  }
}

function buildPortfolioFactsPacket(
  client: User,
  riskProfile: RiskProfile,
  portfolio: Portfolio,
  holdings: Holding[],
  instruments: Instrument[],
  modelPortfolios: ModelPortfolio[]
): FactsPacket {
  const allocations = calculatePortfolioAllocations(holdings, instruments, portfolio)
  const model = getRecommendedModel(riskProfile.score, modelPortfolios)
  const drift = model ? calculateDrift(allocations, model) : 0

  const holdingDetails = holdings.map(h => {
    const instrument = instruments.find(i => i.id === h.instrumentId)!
    const value = h.quantity * instrument.currentPrice
    return {
      symbol: instrument.symbol,
      name: instrument.name,
      quantity: h.quantity,
      value,
      percentage: (value / portfolio.totalValue) * 100,
    }
  })

  return {
    client: {
      name: client.name,
      age: 0,
      segment: '',
      onboardingDate: '',
    },
    riskProfile: {
      score: riskProfile.score,
      category: riskProfile.category,
      lastUpdated: riskProfile.lastUpdated,
      daysOld: 0,
    },
    portfolio: {
      totalValue: portfolio.totalValue,
      cash: portfolio.cash,
      cashPercentage: (portfolio.cash / portfolio.totalValue) * 100,
      holdingsCount: holdings.length,
    },
    allocations: allocations.map(a => ({
      assetClass: a.assetClass,
      value: a.value,
      percentage: a.percentage,
    })),
    model: model ? {
      name: model.name,
      description: model.description,
    } : undefined,
    drift,
    holdings: holdingDetails,
  }
}

async function callAI(systemPrompt: string, userPrompt: string, facts: FactsPacket): Promise<AiResponse> {
  try {
    const factsJson = JSON.stringify(facts, null, 2)
    const promptText = `${systemPrompt}

FACTS PROVIDED (You must ONLY use these facts in your response):
${factsJson}

USER QUESTION:
${userPrompt}

INSTRUCTIONS:
- Only reference data from the FACTS PROVIDED section above
- If information is not in the facts, say "Not available in demo data"
- Be concise and professional
- Always include a disclaimer that this is demo data and not financial advice
- Cite specific numbers from the facts to ground your response`

    const response = await window.spark.llm(promptText, 'gpt-4o-mini')

    const sources = extractSources(facts)

    return {
      content: response,
      sources,
      model: 'gpt-4o-mini',
      offlineMode: false,
    }
  } catch (error) {
    return generateOfflineResponse(userPrompt, facts)
  }
}

function extractSources(facts: FactsPacket): string[] {
  const sources: string[] = []
  
  if (facts.client) sources.push(`Client: ${facts.client.name}, Age ${facts.client.age}, ${facts.client.segment}`)
  if (facts.riskProfile) sources.push(`Risk Profile: Score ${facts.riskProfile.score} (${facts.riskProfile.category})`)
  if (facts.portfolio) sources.push(`Portfolio: $${facts.portfolio.totalValue.toLocaleString()} total value`)
  if (facts.goals && facts.goals.length > 0) sources.push(`Goals: ${facts.goals.length} active goal(s)`)
  if (facts.holdings && facts.holdings.length > 0) sources.push(`Holdings: ${facts.holdings.length} position(s)`)
  if (facts.model) sources.push(`Recommended Model: ${facts.model.name}`)
  
  return sources
}

function generateOfflineResponse(prompt: string, facts: FactsPacket): AiResponse {
  let content = '[DEMO OFFLINE RESPONSE]\n\n'
  
  if (facts.client) {
    content += `Client ${facts.client.name} is ${facts.client.age} years old in the ${facts.client.segment} segment. `
  }
  
  if (facts.riskProfile) {
    content += `They have a risk score of ${facts.riskProfile.score} (${facts.riskProfile.category}). `
  }
  
  if (facts.portfolio) {
    content += `Their portfolio has a total value of $${facts.portfolio.totalValue.toLocaleString()} with $${facts.portfolio.cash.toLocaleString()} in cash (${facts.portfolio.cashPercentage.toFixed(1)}%). `
  }
  
  if (facts.goals && facts.goals.length > 0) {
    content += `They have ${facts.goals.length} active goal(s). `
  }

  content += '\n\nDISCLAIMER: This is a demo response generated in offline mode using deterministic logic. Not financial advice.'

  return {
    content,
    sources: extractSources(facts),
    model: 'offline-demo',
    offlineMode: true,
  }
}

export async function generateAdvisorBrief(
  question: string,
  client: User,
  profile: ClientProfile,
  riskProfile: RiskProfile,
  portfolio: Portfolio,
  goals: Goal[]
): Promise<AiResponse> {
  const facts = buildClientFactsPacket(client, profile, riskProfile, portfolio, goals)
  
  const systemPrompt = `You are an AI assistant helping a wealth management advisor prepare for a client meeting. 
Provide concise, professional briefings based solely on the data provided. 
Your tone should be professional and advisor-focused.`

  return callAI(systemPrompt, question, facts)
}

export async function generatePortfolioExplanation(
  client: User,
  riskProfile: RiskProfile,
  portfolio: Portfolio,
  holdings: Holding[],
  instruments: Instrument[],
  modelPortfolios: ModelPortfolio[]
): Promise<AiResponse> {
  const facts = buildPortfolioFactsPacket(client, riskProfile, portfolio, holdings, instruments, modelPortfolios)
  
  const systemPrompt = `You are an AI assistant helping a client understand their investment portfolio.
Explain their allocation, how it compares to their recommended model, and key considerations.
Use plain language that a non-expert can understand. Be encouraging and educational.`

  const prompt = 'Please explain my portfolio allocation and how it aligns with my risk profile.'

  return callAI(systemPrompt, prompt, facts)
}

export async function generateOrderNote(
  order: Partial<Order>,
  instrument: Instrument,
  suitabilityCheck: { suitable: boolean; reason?: string },
  portfolio: Portfolio
): Promise<AiResponse> {
  const facts: FactsPacket = {
    portfolio: {
      totalValue: portfolio.totalValue,
      cash: portfolio.cash,
      cashPercentage: (portfolio.cash / portfolio.totalValue) * 100,
      holdingsCount: 0,
    },
    holdings: [{
      symbol: instrument.symbol,
      name: instrument.name,
      quantity: order.quantity || 0,
      value: (order.quantity || 0) * instrument.currentPrice,
      percentage: 0,
    }],
  }

  const systemPrompt = `You are an AI assistant helping explain a proposed trade to a client.
Describe what the order would do and how it fits their portfolio strategy.
Be clear and educational.`

  const prompt = `Generate a brief note explaining a ${order.side} order for ${order.quantity} shares of ${instrument.symbol} at ${order.orderType === 'MARKET' ? 'market price' : `limit price $${order.limitPrice}`}. Suitability: ${suitabilityCheck.suitable ? 'Approved' : suitabilityCheck.reason}`

  return callAI(systemPrompt, prompt, facts)
}

export function createAiInteractionRecord(
  actorUserId: string,
  clientId: string | undefined,
  endpoint: string,
  prompt: string,
  response: AiResponse
): AiInteraction {
  return {
    id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    actorUserId,
    clientId,
    endpoint,
    prompt,
    response: response.content,
    model: response.model,
    createdAt: new Date().toISOString(),
    offlineMode: response.offlineMode,
    metadata: { sources: response.sources },
  }
}
