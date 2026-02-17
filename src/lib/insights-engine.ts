import type {
  User,
  ClientProfile,
  RiskProfile,
  Goal,
  Portfolio,
  Holding,
  Instrument,
  ModelPortfolio,
  NextBestAction,
} from './types'
import {
  calculatePortfolioAllocations,
  getRecommendedModel,
  calculateDrift,
  isRiskProfileStale,
  calculateGoalGap,
  calculateRequiredMonthlyContribution,
} from './business-logic'

export interface InsightsResponse {
  content: string
  sources: string[]
  model: string
  offlineMode: boolean
}

interface ComprehensiveFactsPacket {
  client: {
    name: string
    age: number
    segment: string
    memberSince: string
  }
  riskProfile: {
    score: number
    category: string
    lastUpdated: string
    daysOld: number
    isStale: boolean
  }
  portfolio: {
    totalValue: number
    cash: number
    cashPercentage: number
    holdingsCount: number
  }
  allocations: Array<{
    assetClass: string
    value: number
    percentage: number
  }>
  modelPortfolio?: {
    name: string
    description: string
    targetAllocations: Array<{
      assetClass: string
      targetPercentage: number
    }>
  }
  drift?: number
  goals: Array<{
    type: string
    name: string
    targetAmount: number
    currentAmount: number
    progress: number
    gap: number
    targetDate: string
    monthlyContribution: number
    requiredMonthly: number
    shortfall: number
  }>
  holdings: Array<{
    symbol: string
    name: string
    assetClass: string
    quantity: number
    value: number
    percentage: number
    gain: number
    gainPercentage: number
  }>
  nextBestActions: Array<{
    type: string
    priority: string
    title: string
    description: string
  }>
  healthMetrics: {
    portfolioHealthScore: number
    goalsOnTrack: number
    goalsNeedingAttention: number
    goalsCritical: number
    highPriorityActions: number
    mediumPriorityActions: number
  }
}

function buildComprehensiveFactsPacket(
  client: User,
  profile: ClientProfile,
  riskProfile: RiskProfile,
  portfolio: Portfolio,
  goals: Goal[],
  holdings: Holding[],
  instruments: Instrument[],
  modelPortfolios: ModelPortfolio[],
  nextBestActions: NextBestAction[]
): ComprehensiveFactsPacket {
  const age = Math.floor(
    (Date.now() - new Date(profile.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  )
  const daysOld = Math.floor(
    (Date.now() - new Date(riskProfile.lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
  )
  const riskStale = isRiskProfileStale(riskProfile)

  const allocations = calculatePortfolioAllocations(holdings, instruments, portfolio)
  const model = getRecommendedModel(riskProfile.score, modelPortfolios)
  const drift = model ? calculateDrift(allocations, model) : 0

  const holdingDetails = holdings.map(h => {
    const instrument = instruments.find(i => i.id === h.instrumentId)!
    const value = h.quantity * instrument.currentPrice
    const gain = value - h.quantity * h.averageCost
    const gainPercentage = ((instrument.currentPrice - h.averageCost) / h.averageCost) * 100

    return {
      symbol: instrument.symbol,
      name: instrument.name,
      assetClass: instrument.assetClass,
      quantity: h.quantity,
      value,
      percentage: (value / portfolio.totalValue) * 100,
      gain,
      gainPercentage,
    }
  })

  const goalsData = goals.map(g => {
    const gap = calculateGoalGap(g)
    const required = calculateRequiredMonthlyContribution(g)
    const progress = Math.min((g.currentAmount / g.targetAmount) * 100, 100)

    return {
      type: g.type,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      progress,
      gap,
      targetDate: g.targetDate,
      monthlyContribution: g.monthlyContribution,
      requiredMonthly: required,
      shortfall: Math.max(0, required - g.monthlyContribution),
    }
  })

  let portfolioHealthScore = 100
  if (riskStale) portfolioHealthScore -= 20
  if (drift > 8) portfolioHealthScore -= Math.min(30, drift * 2)
  if ((portfolio.cash / portfolio.totalValue) * 100 > 10) portfolioHealthScore -= 10
  if (nextBestActions.filter(a => a.priority === 'HIGH').length > 0) portfolioHealthScore -= 15

  const goalsOnTrack = goalsData.filter(g => g.shortfall < 100).length
  const goalsCritical = goalsData.filter(g => g.gap > 100000 || g.shortfall > 1000).length
  const goalsNeedingAttention = goalsData.length - goalsOnTrack - goalsCritical

  return {
    client: {
      name: client.name,
      age,
      segment: profile.segment,
      memberSince: profile.onboardingDate,
    },
    riskProfile: {
      score: riskProfile.score,
      category: riskProfile.category,
      lastUpdated: riskProfile.lastUpdated,
      daysOld,
      isStale: riskStale,
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
    modelPortfolio: model
      ? {
          name: model.name,
          description: model.description,
          targetAllocations: model.allocations.map(a => ({
            assetClass: a.assetClass,
            targetPercentage: a.targetPercentage,
          })),
        }
      : undefined,
    drift,
    goals: goalsData,
    holdings: holdingDetails,
    nextBestActions: nextBestActions.map(a => ({
      type: a.type,
      priority: a.priority,
      title: a.title,
      description: a.description,
    })),
    healthMetrics: {
      portfolioHealthScore: Math.max(0, portfolioHealthScore),
      goalsOnTrack,
      goalsNeedingAttention,
      goalsCritical,
      highPriorityActions: nextBestActions.filter(a => a.priority === 'HIGH').length,
      mediumPriorityActions: nextBestActions.filter(a => a.priority === 'MEDIUM').length,
    },
  }
}

function generateOfflineInsights(facts: ComprehensiveFactsPacket): InsightsResponse {
  let content = `# Personalized Financial Insights for ${facts.client.name}\n\n`

  content += `## Portfolio Health: ${facts.healthMetrics.portfolioHealthScore}/100\n\n`

  if (facts.healthMetrics.portfolioHealthScore >= 80) {
    content += `Your portfolio is in excellent shape! You're well-positioned with strong alignment to your financial goals and risk profile.\n\n`
  } else if (facts.healthMetrics.portfolioHealthScore >= 60) {
    content += `Your portfolio is generally healthy, but there are some areas where adjustments could improve your financial position.\n\n`
  } else {
    content += `Your portfolio needs attention. There are several important actions you should consider to get back on track.\n\n`
  }

  content += `## Key Insights\n\n`

  content += `### Risk Profile\n`
  content += `- Current risk score: ${facts.riskProfile.score}/10 (${facts.riskProfile.category})\n`
  if (facts.riskProfile.isStale) {
    content += `- ⚠️ Your risk profile was last updated ${facts.riskProfile.daysOld} days ago. Consider refreshing it to ensure your investments match your current situation.\n\n`
  } else {
    content += `- ✓ Your risk profile is current and up-to-date.\n\n`
  }

  content += `### Portfolio Allocation\n`
  content += `- Total value: $${facts.portfolio.totalValue.toLocaleString()}\n`
  content += `- Cash position: $${facts.portfolio.cash.toLocaleString()} (${facts.portfolio.cashPercentage.toFixed(1)}%)\n`
  
  if (facts.modelPortfolio) {
    content += `- Recommended model: ${facts.modelPortfolio.name}\n`
    content += `- Current drift: ${facts.drift?.toFixed(1)}%\n\n`
    
    if ((facts.drift || 0) > 8) {
      content += `⚠️ Your portfolio has drifted significantly from your target allocation. Consider rebalancing to maintain your desired risk level.\n\n`
    }
  }

  content += `Your current allocation:\n`
  facts.allocations.forEach(a => {
    content += `- ${a.assetClass}: $${a.value.toLocaleString()} (${a.percentage.toFixed(1)}%)\n`
  })
  content += `\n`

  if (facts.portfolio.cashPercentage > 10) {
    content += `💡 You have ${facts.portfolio.cashPercentage.toFixed(1)}% in cash. Consider investing this according to your target allocation to maximize potential returns.\n\n`
  }

  content += `### Goals Progress\n`
  if (facts.goals.length === 0) {
    content += `You haven't set any financial goals yet. Consider adding goals to help guide your investment strategy.\n\n`
  } else {
    content += `You have ${facts.goals.length} active goal(s):\n\n`
    facts.goals.forEach(goal => {
      content += `**${goal.name} (${goal.type})**\n`
      content += `- Target: $${goal.targetAmount.toLocaleString()} by ${new Date(goal.targetDate).toLocaleDateString()}\n`
      content += `- Current: $${goal.currentAmount.toLocaleString()} (${goal.progress.toFixed(1)}% complete)\n`
      content += `- Gap: $${goal.gap.toLocaleString()}\n`
      content += `- Monthly contribution: $${goal.monthlyContribution.toLocaleString()}\n`
      
      if (goal.shortfall > 100) {
        content += `- ⚠️ Consider increasing by $${Math.floor(goal.shortfall).toLocaleString()}/month to stay on track\n\n`
      } else {
        content += `- ✓ On track to meet your goal\n\n`
      }
    })
  }

  content += `### Priority Actions (${facts.nextBestActions.length} total)\n\n`
  
  const highPriority = facts.nextBestActions.filter(a => a.priority === 'HIGH')
  const mediumPriority = facts.nextBestActions.filter(a => a.priority === 'MEDIUM')
  
  if (highPriority.length > 0) {
    content += `**High Priority (${highPriority.length}):**\n`
    highPriority.forEach((action, idx) => {
      content += `${idx + 1}. ${action.title}: ${action.description}\n`
    })
    content += `\n`
  }
  
  if (mediumPriority.length > 0) {
    content += `**Medium Priority (${mediumPriority.length}):**\n`
    mediumPriority.forEach((action, idx) => {
      content += `${idx + 1}. ${action.title}: ${action.description}\n`
    })
    content += `\n`
  }

  if (facts.nextBestActions.length === 0) {
    content += `✓ No urgent actions needed. You're managing your finances well!\n\n`
  }

  content += `### Top Holdings\n`
  const topHoldings = facts.holdings.sort((a, b) => b.value - a.value).slice(0, 5)
  topHoldings.forEach((h, idx) => {
    content += `${idx + 1}. ${h.symbol} (${h.name}): $${h.value.toLocaleString()} (${h.percentage.toFixed(1)}%) - ${h.gainPercentage >= 0 ? '+' : ''}${h.gainPercentage.toFixed(1)}%\n`
  })
  content += `\n`

  content += `---\n\n`
  content += `**Disclaimer:** This analysis is for educational purposes only and does not constitute financial advice. All data is from a demonstration system. Please consult with a qualified financial advisor for personalized recommendations.`

  const sources = [
    `Portfolio: $${facts.portfolio.totalValue.toLocaleString()}`,
    `Risk Profile: ${facts.riskProfile.score}/10 (${facts.riskProfile.category})`,
    `Goals: ${facts.goals.length} active`,
    `Holdings: ${facts.holdings.length} positions`,
    `Actions: ${facts.nextBestActions.length} recommendations`,
  ]

  return {
    content,
    sources,
    model: 'offline-demo',
    offlineMode: true,
  }
}

async function callAIForInsights(facts: ComprehensiveFactsPacket): Promise<InsightsResponse> {
  try {
    const factsJson = JSON.stringify(facts, null, 2)
    
    const promptText = `You are an AI financial analyst helping a client understand their complete financial picture.

Analyze the provided data comprehensively and generate personalized insights that:
1. Assess their overall financial health
2. Explain their portfolio allocation and how it aligns with their risk profile
3. Review their progress toward financial goals
4. Highlight priority actions they should take
5. Provide specific, actionable recommendations

Use a friendly, encouraging tone. Be specific with numbers from the data. Structure your response clearly with headings.

CRITICAL: Only use data from the FACTS PROVIDED below. If something is not in the facts, do not mention it.

FACTS PROVIDED (You must ONLY use these facts):
${factsJson}

Generate a comprehensive financial insights report for this client. Focus on what matters most based on their health score, goals status, and priority actions. Be specific and cite actual numbers from the facts.

Always end with a disclaimer that this is for educational purposes and not financial advice.`

    const response = await window.spark.llm(promptText, 'gpt-4o')

    const sources = [
      `Portfolio: $${facts.portfolio.totalValue.toLocaleString()}`,
      `Risk Profile: ${facts.riskProfile.score}/10 (${facts.riskProfile.category})`,
      `Goals: ${facts.goals.length} active`,
      `Holdings: ${facts.holdings.length} positions`,
      `Actions: ${facts.nextBestActions.length} recommendations`,
      `Health Score: ${facts.healthMetrics.portfolioHealthScore}/100`,
    ]

    return {
      content: response,
      sources,
      model: 'gpt-4o',
      offlineMode: false,
    }
  } catch (error) {
    console.error('AI call failed, falling back to offline mode:', error)
    return generateOfflineInsights(facts)
  }
}

export async function generatePersonalizedInsights(
  client: User,
  profile: ClientProfile,
  riskProfile: RiskProfile,
  portfolio: Portfolio,
  goals: Goal[],
  holdings: Holding[],
  instruments: Instrument[],
  modelPortfolios: ModelPortfolio[],
  nextBestActions: NextBestAction[]
): Promise<InsightsResponse> {
  const facts = buildComprehensiveFactsPacket(
    client,
    profile,
    riskProfile,
    portfolio,
    goals,
    holdings,
    instruments,
    modelPortfolios,
    nextBestActions
  )

  return callAIForInsights(facts)
}
