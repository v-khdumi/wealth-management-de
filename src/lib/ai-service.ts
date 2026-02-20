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
  BankStatement,
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

export interface BankStatementNextAction {
  id: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  type: 'RISK_REFRESH' | 'REBALANCE' | 'LIQUIDITY' | 'SAVINGS' | 'SPENDING'
  title: string
  description: string
  impact: string
  actionLabel: string
}

export function generateBankStatementNextActions(
  statements: BankStatement[]
): BankStatementNextAction[] {
  const completed = statements.filter(s => s.status === 'COMPLETED' && s.extractedData)
  if (completed.length === 0) return []

  const totalIncome = completed.reduce((sum, s) => sum + (s.extractedData?.totalIncome || 0), 0)
  const totalExpenses = completed.reduce((sum, s) => sum + (s.extractedData?.totalExpenses || 0), 0)
  const netSavings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0

  const allTransactions = completed.flatMap(s => s.extractedData?.transactions || [])
  const categorySummary = completed.flatMap(s => s.extractedData?.categorySummary || [])

  const categoryTotals: Record<string, number> = {}
  for (const cat of categorySummary) {
    categoryTotals[cat.category] = (categoryTotals[cat.category] || 0) + cat.amount
  }

  const topExpenseCategory = Object.entries(categoryTotals)
    .filter(([cat]) => cat !== 'Salary' && cat !== 'Transfers')
    .sort((a, b) => b[1] - a[1])[0]

  const monthlyExpenses = totalExpenses / Math.max(completed.length, 1)
  const emergencyFundMonths = netSavings > 0 ? netSavings / monthlyExpenses : 0

  const actions: BankStatementNextAction[] = []

  // Risk Refresh: if income is volatile (check variance across statements)
  const incomePerStatement = completed.map(s => s.extractedData?.totalIncome || 0)
  const avgIncome = incomePerStatement.reduce((a, b) => a + b, 0) / incomePerStatement.length
  const incomeVariance = incomePerStatement.length > 1
    ? incomePerStatement.reduce((sum, v) => sum + Math.pow(v - avgIncome, 2), 0) / incomePerStatement.length
    : 0
  const incomeVolatility = avgIncome > 0 ? Math.sqrt(incomeVariance) / avgIncome : 0

  if (incomeVolatility > 0.15 || statements.length < 2) {
    actions.push({
      id: 'nba-risk-refresh',
      priority: 'HIGH',
      type: 'RISK_REFRESH',
      title: 'Complete Risk Profile Assessment',
      description: incomeVolatility > 0.15
        ? `Your income shows ${(incomeVolatility * 100).toFixed(0)}% volatility across statements. Your risk tolerance should be reassessed.`
        : 'Upload more statements to establish your financial baseline and determine your risk profile.',
      impact: 'Ensure your investment strategy matches your actual financial situation',
      actionLabel: 'Start Risk Assessment',
    })
  }

  // Rebalancing: if spending on non-essentials is high
  if (topExpenseCategory && totalExpenses > 0) {
    const topPct = (topExpenseCategory[1] / totalExpenses) * 100
    if (topPct > 30) {
      actions.push({
        id: 'nba-rebalance',
        priority: 'MEDIUM',
        type: 'REBALANCE',
        title: 'Rebalance Your Spending',
        description: `${topExpenseCategory[0]} accounts for ${topPct.toFixed(0)}% of your total expenses. Optimizing this category could significantly increase your savings.`,
        impact: `Potential monthly savings of up to ${(topExpenseCategory[1] * 0.2 / Math.max(completed.length, 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${completed[0].extractedData?.currency || 'USD'}`,
        actionLabel: 'Review Spending',
      })
    }
  }

  // Liquidity: emergency fund check
  if (emergencyFundMonths < 3) {
    actions.push({
      id: 'nba-liquidity',
      priority: emergencyFundMonths < 1 ? 'HIGH' : 'MEDIUM',
      type: 'LIQUIDITY',
      title: 'Build Emergency Liquidity Fund',
      description: emergencyFundMonths < 1
        ? 'Your current savings are insufficient for emergencies. Financial experts recommend 3–6 months of expenses as a safety net.'
        : `You have approximately ${emergencyFundMonths.toFixed(1)} months of expenses saved. Aim for 3–6 months for financial security.`,
      impact: `Target: ${(monthlyExpenses * 3).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${completed[0].extractedData?.currency || 'USD'} (3 months of expenses)`,
      actionLabel: 'Set Savings Goal',
    })
  }

  // Low savings rate
  if (savingsRate < 20 && totalIncome > 0) {
    actions.push({
      id: 'nba-savings',
      priority: savingsRate < 5 ? 'HIGH' : 'LOW',
      type: 'SAVINGS',
      title: 'Increase Your Savings Rate',
      description: `Your current savings rate is ${savingsRate.toFixed(1)}%. Financial best practice recommends saving at least 20% of your income.`,
      impact: `Increasing to 20% would add ${((totalIncome * 0.2 - netSavings) / Math.max(completed.length, 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${completed[0].extractedData?.currency || 'USD'}/month to savings`,
      actionLabel: 'Create Savings Plan',
    })
  }

  // High number of debit transactions
  const debitCount = allTransactions.filter(t => t.type === 'DEBIT').length
  const creditCount = allTransactions.filter(t => t.type === 'CREDIT').length
  if (debitCount > creditCount * 5) {
    actions.push({
      id: 'nba-spending',
      priority: 'LOW',
      type: 'SPENDING',
      title: 'Review Frequent Small Purchases',
      description: `You have ${debitCount} debit transactions vs ${creditCount} income transactions. Frequent small purchases can add up significantly.`,
      impact: 'Consolidating or reducing discretionary spending could improve your financial health',
      actionLabel: 'Analyze Transactions',
    })
  }

  return actions.sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    return order[a.priority] - order[b.priority]
  })
}

export async function generateBankStatementInsight(
  question: string,
  userName: string,
  statements: BankStatement[]
): Promise<AiResponse> {
  const completed = statements.filter(s => s.status === 'COMPLETED' && s.extractedData)

  if (completed.length === 0) {
    return {
      content: 'Please upload and process your bank statements first. Once your statements are processed, I can answer detailed questions about your finances.',
      sources: [],
      model: 'no-data',
      offlineMode: true,
    }
  }

  const totalIncome = completed.reduce((sum, s) => sum + (s.extractedData?.totalIncome || 0), 0)
  const totalExpenses = completed.reduce((sum, s) => sum + (s.extractedData?.totalExpenses || 0), 0)
  const netSavings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0
  const currency = completed[0].extractedData?.currency || 'USD'

  const categorySummary = completed.flatMap(s => s.extractedData?.categorySummary || [])
  const categoryTotals: Record<string, number> = {}
  for (const cat of categorySummary) {
    categoryTotals[cat.category] = (categoryTotals[cat.category] || 0) + cat.amount
  }

  const allTransactions = completed.flatMap(s => s.extractedData?.transactions || [])

  const statementFacts = {
    userName,
    currency,
    statementCount: completed.length,
    period: {
      from: completed.map(s => s.extractedData?.statementDate || s.uploadedAt).sort()[0],
      to: completed.map(s => s.extractedData?.statementDate || s.uploadedAt).sort().reverse()[0],
    },
    financials: {
      totalIncome: Math.round(totalIncome),
      totalExpenses: Math.round(totalExpenses),
      netSavings: Math.round(netSavings),
      savingsRate: Math.round(savingsRate * 10) / 10,
      monthlyAvgIncome: Math.round(totalIncome / completed.length),
      monthlyAvgExpenses: Math.round(totalExpenses / completed.length),
    },
    topSpendingCategories: Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amount]) => ({
        category: cat,
        amount: Math.round(amount),
        percentage: Math.round((amount / totalExpenses) * 1000) / 10,
      })),
    recentTransactions: allTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map(t => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
      })),
  }

  const systemPrompt = `You are a personal financial AI assistant for ${userName}.
You have access to their real bank statement data. Provide helpful, specific, and actionable financial insights.
Be warm, encouraging, and use plain language. Reference specific numbers from their data.
Always note that your analysis is based on the uploaded statements, not financial advice.`

  try {
    const factsJson = JSON.stringify(statementFacts, null, 2)
    const promptText = `${systemPrompt}

BANK STATEMENT DATA:
${factsJson}

USER QUESTION: ${question}

Provide a helpful, specific answer based on the data above. Be concise (3-5 sentences max unless detail is needed).
If the question cannot be answered from the data, say so clearly.`

    const response = await window.spark.llm(promptText, 'gpt-4o-mini')
    return {
      content: response,
      sources: [
        `${completed.length} bank statement(s) analyzed`,
        `${allTransactions.length} transactions reviewed`,
        `Period: ${statementFacts.period.from} to ${statementFacts.period.to}`,
      ],
      model: 'gpt-4o-mini',
      offlineMode: false,
    }
  } catch {
    // Offline fallback
    const lines: string[] = [
      `Based on your ${completed.length} uploaded statement(s):`,
      `• Total income: ${totalIncome.toLocaleString()} ${currency}`,
      `• Total expenses: ${totalExpenses.toLocaleString()} ${currency}`,
      `• Net savings: ${netSavings.toLocaleString()} ${currency} (${savingsRate.toFixed(1)}% savings rate)`,
    ]
    if (Object.keys(categoryTotals).length > 0) {
      const top = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]
      lines.push(`• Largest spending category: ${top[0]} (${top[1].toLocaleString()} ${currency})`)
    }
    lines.push('\nNote: This is a summary based on your uploaded data, not financial advice.')
    return {
      content: lines.join('\n'),
      sources: [`${completed.length} statement(s)`, `${allTransactions.length} transactions`],
      model: 'offline',
      offlineMode: true,
    }
  }
}
