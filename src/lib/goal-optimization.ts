import type { Goal, GoalOptimization, GoalPriority } from './types'

export async function generateGoalOptimizations(
  goal: Goal,
  clientAge: number,
  riskScore: number
): Promise<GoalOptimization[]> {
  const gap = goal.targetAmount - goal.currentAmount
  const monthsRemaining = Math.max(
    1,
    Math.floor(
      (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
    )
  )
  const requiredMonthly = gap / monthsRemaining
  const currentProgress = (goal.currentAmount / goal.targetAmount) * 100

  const optimizations: GoalOptimization[] = []

  if (goal.monthlyContribution < requiredMonthly) {
    const shortfall = requiredMonthly - goal.monthlyContribution
    optimizations.push({
      id: `opt-${Date.now()}-1`,
      goalId: goal.id,
      type: 'CONTRIBUTION_INCREASE',
      title: 'Increase Monthly Contribution',
      description: `You're currently contributing $${goal.monthlyContribution.toLocaleString()}/month, but need $${Math.ceil(requiredMonthly).toLocaleString()}/month to reach your target.`,
      currentMonthly: goal.monthlyContribution,
      suggestedMonthly: Math.ceil(requiredMonthly),
      potentialGain: shortfall * monthsRemaining,
      reasoning: `Based on ${monthsRemaining} months remaining to ${new Date(goal.targetDate).toLocaleDateString()}, increasing your contribution by $${Math.ceil(shortfall).toLocaleString()}/month will keep you on track to meet your $${goal.targetAmount.toLocaleString()} goal.`,
      priority: shortfall > 500 ? 'HIGH' : shortfall > 200 ? 'MEDIUM' : 'LOW',
      createdAt: new Date().toISOString(),
    })
  }

  if (currentProgress < 25 && monthsRemaining < 12 && goal.monthlyContribution < requiredMonthly * 0.8) {
    optimizations.push({
      id: `opt-${Date.now()}-2`,
      goalId: goal.id,
      type: 'TIMELINE_ADJUSTMENT',
      title: 'Extend Goal Timeline',
      description: `Consider extending your target date by 12-18 months to make monthly contributions more manageable.`,
      currentMonthly: goal.monthlyContribution,
      suggestedMonthly: Math.ceil(gap / (monthsRemaining + 12)),
      potentialGain: 0,
      reasoning: `With less than a year remaining and only ${currentProgress.toFixed(0)}% progress, extending the timeline could reduce required monthly contributions from $${Math.ceil(requiredMonthly).toLocaleString()} to $${Math.ceil(gap / (monthsRemaining + 12)).toLocaleString()}/month.`,
      priority: 'MEDIUM',
      createdAt: new Date().toISOString(),
    })
  }

  if (riskScore >= 6 && goal.type === 'RETIREMENT' && currentProgress < 50) {
    const aggressiveGrowth = gap * 0.07
    optimizations.push({
      id: `opt-${Date.now()}-3`,
      goalId: goal.id,
      type: 'RISK_ALIGNMENT',
      title: 'Leverage Growth-Oriented Allocation',
      description: `Your risk profile (${riskScore}/10) suggests you can tolerate higher growth investments for this long-term goal.`,
      currentMonthly: goal.monthlyContribution,
      suggestedMonthly: goal.monthlyContribution,
      potentialGain: aggressiveGrowth,
      reasoning: `With a moderate-to-high risk tolerance and ${clientAge} years old, allocating this retirement goal to more growth-focused investments could potentially accelerate progress through market returns.`,
      priority: 'MEDIUM',
      createdAt: new Date().toISOString(),
    })
  }

  if (currentProgress >= 75 && monthsRemaining > 24) {
    optimizations.push({
      id: `opt-${Date.now()}-4`,
      goalId: goal.id,
      type: 'CONTRIBUTION_INCREASE',
      title: 'Early Goal Completion',
      description: `You're ahead of schedule! Consider increasing contributions to finish early and redirect funds to other goals.`,
      currentMonthly: goal.monthlyContribution,
      suggestedMonthly: Math.ceil(goal.monthlyContribution * 1.25),
      potentialGain: goal.monthlyContribution * 0.25 * 12,
      reasoning: `At ${currentProgress.toFixed(0)}% complete with ${monthsRemaining} months remaining, a 25% increase could help you reach this goal 8-12 months early, freeing up funds for other priorities.`,
      priority: 'LOW',
      createdAt: new Date().toISOString(),
    })
  }

  return optimizations
}

export async function autoRankGoals(goals: Goal[]): Promise<Map<string, GoalPriority>> {
  const ranked = new Map<string, GoalPriority>()

  const goalsWithScores = goals.map(goal => {
    const gap = goal.targetAmount - goal.currentAmount
    const monthsRemaining = Math.max(
      1,
      Math.floor(
        (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
      )
    )
    const requiredMonthly = gap / monthsRemaining
    const currentProgress = (goal.currentAmount / goal.targetAmount) * 100
    const urgencyScore = (1 / monthsRemaining) * 1000
    const gapScore = gap / 1000
    const progressScore = 100 - currentProgress
    const typeScore = goal.type === 'RETIREMENT' ? 30 : goal.type === 'EDUCATION' ? 25 : goal.type === 'HOUSE' ? 20 : 10

    const totalScore = urgencyScore * 0.4 + progressScore * 0.2 + typeScore * 0.3 + (gapScore * 0.1)

    return { goal, totalScore, urgencyScore, currentProgress, monthsRemaining }
  })

  goalsWithScores.sort((a, b) => b.totalScore - a.totalScore)

  goalsWithScores.forEach((item, index) => {
    let reasoning = ''
    
    if (item.monthsRemaining < 12) {
      reasoning = `High priority due to imminent ${new Date(item.goal.targetDate).toLocaleDateString()} deadline (${item.monthsRemaining} months).`
    } else if (item.currentProgress < 25) {
      reasoning = `Needs attention - only ${item.currentProgress.toFixed(0)}% complete with limited progress.`
    } else if (item.goal.type === 'RETIREMENT') {
      reasoning = `Long-term retirement planning prioritized for financial security.`
    } else if (item.currentProgress >= 75) {
      reasoning = `Strong progress (${item.currentProgress.toFixed(0)}%) - maintain momentum to completion.`
    } else {
      reasoning = `Balanced priority based on timeline, progress, and goal type.`
    }

    ranked.set(item.goal.id, {
      goalId: item.goal.id,
      rank: index + 1,
      autoRanked: true,
      reasoning,
      lastUpdated: new Date().toISOString(),
    })
  })

  return ranked
}

export function createGoalNotification(
  goalId: string,
  userId: string,
  type: 'MILESTONE' | 'CONTRIBUTION' | 'SHARED_FEEDBACK' | 'OPTIMIZATION' | 'PRIORITY_CHANGE',
  title: string,
  message: string,
  actionUrl?: string
) {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    goalId,
    userId,
    type,
    title,
    message,
    read: false,
    actionUrl,
    createdAt: new Date().toISOString(),
  }
}
