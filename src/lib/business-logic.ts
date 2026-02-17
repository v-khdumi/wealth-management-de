import type {
  Portfolio,
  Holding,
  Instrument,
  ModelPortfolio,
  RiskProfile,
  Goal,
  NextBestAction,
  AssetClass,
  GoalProgressSnapshot,
} from './types'

export interface AllocationBreakdown {
  assetClass: AssetClass
  value: number
  percentage: number
}

export function calculatePortfolioAllocations(
  holdings: Holding[],
  instruments: Instrument[],
  portfolio: Portfolio
): AllocationBreakdown[] {
  const allocationMap = new Map<AssetClass, number>()

  holdings.forEach(holding => {
    const instrument = instruments.find(i => i.id === holding.instrumentId)
    if (instrument) {
      const value = holding.quantity * instrument.currentPrice
      const current = allocationMap.get(instrument.assetClass) || 0
      allocationMap.set(instrument.assetClass, current + value)
    }
  })

  if (portfolio.cash > 0) {
    const current = allocationMap.get('CASH') || 0
    allocationMap.set('CASH', current + portfolio.cash)
  }

  const totalValue = portfolio.totalValue || 1

  return Array.from(allocationMap.entries()).map(([assetClass, value]) => ({
    assetClass,
    value,
    percentage: (value / totalValue) * 100,
  }))
}

export function getRecommendedModel(
  riskScore: number,
  modelPortfolios: ModelPortfolio[]
): ModelPortfolio | undefined {
  return modelPortfolios.find(
    mp => riskScore >= mp.minRiskScore && riskScore <= mp.maxRiskScore
  )
}

export function calculateDrift(
  currentAllocations: AllocationBreakdown[],
  targetModel: ModelPortfolio
): number {
  let totalDrift = 0

  targetModel.allocations.forEach(target => {
    const current = currentAllocations.find(a => a.assetClass === target.assetClass)
    const currentPct = current?.percentage || 0
    totalDrift += Math.abs(currentPct - target.targetPercentage)
  })

  return totalDrift / 2
}

export function isRiskProfileStale(riskProfile: RiskProfile): boolean {
  const lastUpdated = new Date(riskProfile.lastUpdated)
  const daysSince = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
  return daysSince > 180
}

export function calculateGoalGap(goal: Goal): number {
  return Math.max(0, goal.targetAmount - goal.currentAmount)
}

export function calculateRequiredMonthlyContribution(goal: Goal): number {
  const gap = calculateGoalGap(goal)
  const targetDate = new Date(goal.targetDate)
  const monthsRemaining = Math.max(1, (targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
  return gap / monthsRemaining
}

export function generateNextBestActions(
  clientId: string,
  portfolio: Portfolio,
  holdings: Holding[],
  instruments: Instrument[],
  riskProfile: RiskProfile,
  goals: Goal[],
  modelPortfolios: ModelPortfolio[]
): NextBestAction[] {
  const actions: NextBestAction[] = []

  if (isRiskProfileStale(riskProfile)) {
    actions.push({
      id: `action-${clientId}-risk`,
      clientId,
      type: 'REFRESH_RISK_PROFILE',
      title: 'Refresh Risk Profile',
      description: `Risk profile is ${Math.floor((Date.now() - new Date(riskProfile.lastUpdated).getTime()) / (1000 * 60 * 60 * 24))} days old. Consider updating.`,
      priority: 'HIGH',
      createdAt: new Date().toISOString(),
    })
  }

  goals.forEach(goal => {
    const gap = calculateGoalGap(goal)
    if (gap > 50000) {
      const required = calculateRequiredMonthlyContribution(goal)
      const shortfall = required - goal.monthlyContribution
      if (shortfall > 100) {
        actions.push({
          id: `action-${clientId}-goal-${goal.id}`,
          clientId,
          type: 'INCREASE_CONTRIBUTION',
          title: `Increase ${goal.name} Contribution`,
          description: `Current monthly contribution of $${goal.monthlyContribution.toLocaleString()} falls short by $${Math.floor(shortfall).toLocaleString()}/month to meet target.`,
          priority: gap > 100000 ? 'HIGH' : 'MEDIUM',
          createdAt: new Date().toISOString(),
          metadata: { goalId: goal.id, requiredIncrease: shortfall },
        })
      }
    }
  })

  const model = getRecommendedModel(riskProfile.score, modelPortfolios)
  if (model) {
    const allocations = calculatePortfolioAllocations(holdings, instruments, portfolio)
    const drift = calculateDrift(allocations, model)
    
    if (drift > 8) {
      actions.push({
        id: `action-${clientId}-rebalance`,
        clientId,
        type: 'REBALANCE_PORTFOLIO',
        title: 'Rebalance Portfolio',
        description: `Portfolio has drifted ${drift.toFixed(1)}% from target ${model.name} model allocation.`,
        priority: drift > 15 ? 'HIGH' : 'MEDIUM',
        createdAt: new Date().toISOString(),
        metadata: { drift, modelId: model.id },
      })
    }
  }

  const cashPercentage = (portfolio.cash / portfolio.totalValue) * 100
  if (cashPercentage > 10) {
    actions.push({
      id: `action-${clientId}-invest-cash`,
      clientId,
      type: 'INVEST_CASH',
      title: 'Invest Excess Cash',
      description: `${cashPercentage.toFixed(1)}% of portfolio is in cash. Consider investing according to target allocation.`,
      priority: cashPercentage > 15 ? 'MEDIUM' : 'LOW',
      createdAt: new Date().toISOString(),
      metadata: { cashPercentage, cashAmount: portfolio.cash },
    })
  }

  const concentrationThreshold = 40
  holdings.forEach(holding => {
    const instrument = instruments.find(i => i.id === holding.instrumentId)
    if (instrument) {
      const value = holding.quantity * instrument.currentPrice
      const percentage = (value / portfolio.totalValue) * 100
      if (percentage > concentrationThreshold) {
        actions.push({
          id: `action-${clientId}-concentration-${instrument.id}`,
          clientId,
          type: 'REBALANCE_PORTFOLIO',
          title: 'Reduce Concentration Risk',
          description: `${instrument.symbol} represents ${percentage.toFixed(1)}% of portfolio, exceeding ${concentrationThreshold}% threshold.`,
          priority: 'HIGH',
          createdAt: new Date().toISOString(),
          metadata: { instrumentId: instrument.id, percentage },
        })
      }
    }
  })

  return actions
}

export function checkSuitability(
  instrument: Instrument,
  riskProfile: RiskProfile
): { suitable: boolean; reason?: string } {
  if (riskProfile.score < instrument.suitabilityMinRisk) {
    return {
      suitable: false,
      reason: `${instrument.name} requires minimum risk score of ${instrument.suitabilityMinRisk}. Client risk score is ${riskProfile.score}.`,
    }
  }
  if (riskProfile.score > instrument.suitabilityMaxRisk) {
    return {
      suitable: false,
      reason: `${instrument.name} is not suitable for risk score ${riskProfile.score} (max ${instrument.suitabilityMaxRisk}).`,
    }
  }
  return { suitable: true }
}

export function checkCashSufficiency(
  portfolio: Portfolio,
  amount: number
): { sufficient: boolean; available: number; required: number } {
  return {
    sufficient: portfolio.cash >= amount,
    available: portfolio.cash,
    required: amount,
  }
}

export function checkConcentration(
  holdings: Holding[],
  instruments: Instrument[],
  portfolio: Portfolio,
  newInstrumentId: string,
  newQuantity: number
): { acceptable: boolean; resultingPercentage: number; limit: number } {
  const instrument = instruments.find(i => i.id === newInstrumentId)
  if (!instrument) return { acceptable: true, resultingPercentage: 0, limit: 40 }

  const existingHolding = holdings.find(h => h.instrumentId === newInstrumentId)
  const existingQty = existingHolding?.quantity || 0
  const totalQty = existingQty + newQuantity
  const value = totalQty * instrument.currentPrice
  const percentage = (value / portfolio.totalValue) * 100

  return {
    acceptable: percentage <= 40,
    resultingPercentage: percentage,
    limit: 40,
  }
}

export function captureGoalProgressSnapshot(goal: Goal): GoalProgressSnapshot {
  const monthsRemaining = Math.max(0, Math.ceil(
    (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)
  ))
  
  const remainingAmount = goal.targetAmount - goal.currentAmount
  const projectedMonthlyNeeded = monthsRemaining > 0 ? remainingAmount / monthsRemaining : 0
  
  let projectedCompletion = goal.targetDate
  if (goal.monthlyContribution > 0 && remainingAmount > 0) {
    const monthsToCompletion = Math.ceil(remainingAmount / goal.monthlyContribution)
    const completionDate = new Date()
    completionDate.setMonth(completionDate.getMonth() + monthsToCompletion)
    projectedCompletion = completionDate.toISOString()
  }

  return {
    id: `snapshot_${Date.now()}`,
    goalId: goal.id,
    timestamp: new Date().toISOString(),
    currentAmount: goal.currentAmount,
    targetAmount: goal.targetAmount,
    monthlyContribution: goal.monthlyContribution,
    projectedCompletion,
  }
}

export function addProgressSnapshotToGoal(goal: Goal): Goal {
  const snapshot = captureGoalProgressSnapshot(goal)
  const existingSnapshots = goal.progressHistory || []
  
  const lastSnapshot = existingSnapshots[existingSnapshots.length - 1]
  const shouldAddSnapshot = !lastSnapshot || 
    Math.abs(lastSnapshot.currentAmount - snapshot.currentAmount) > 100 ||
    Math.abs(lastSnapshot.monthlyContribution - snapshot.monthlyContribution) > 10
  
  if (!shouldAddSnapshot) {
    return goal
  }
  
  return {
    ...goal,
    progressHistory: [...existingSnapshots, snapshot],
  }
}
