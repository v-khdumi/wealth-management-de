import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import { ScrollArea } from './ui/scroll-area'
import {
  Lightbulb,
  TrendUp,
  Warning,
  CheckCircle,
  Sparkle,
  Target,
  ShieldCheck,
  ChartLine,
  ArrowRight,
  CaretRight,
  PencilSimple,
  CurrencyDollar,
} from '@phosphor-icons/react'
import { useDataStore } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import {
  generateNextBestActions,
  calculatePortfolioAllocations,
  getRecommendedModel,
  calculateDrift,
  isRiskProfileStale,
  calculateGoalGap,
  calculateRequiredMonthlyContribution,
} from '@/lib/business-logic'
import { generatePersonalizedInsights } from '@/lib/insights-engine'
import { GoalAdjustmentDialog } from './GoalAdjustmentDialog'
import type { NextBestAction, Goal } from '@/lib/types'
import { toast } from 'sonner'

interface InsightsDashboardProps {
  clientId: string
}

export function InsightsDashboard({ clientId }: InsightsDashboardProps) {
  const { currentUser } = useAuth()
  const {
    users,
    clientProfiles,
    riskProfiles,
    goals,
    portfolios,
    holdings,
    instruments,
    modelPortfolios,
    aiInteractions,
    setAiInteractions,
    setGoals,
  } = useDataStore()

  const [isGenerating, setIsGenerating] = useState(false)
  const [aiInsights, setAiInsights] = useState<string | null>(null)
  const [selectedGoalForAdjustment, setSelectedGoalForAdjustment] = useState<Goal | null>(null)

  const client = useMemo(() => users?.find(u => u.id === clientId), [users, clientId])
  const profile = useMemo(() => clientProfiles?.find(cp => cp.userId === clientId), [clientProfiles, clientId])
  const riskProfile = useMemo(() => riskProfiles?.find(rp => rp.clientId === clientId), [riskProfiles, clientId])
  const portfolio = useMemo(() => portfolios?.find(p => p.clientId === clientId), [portfolios, clientId])
  const clientGoals = useMemo(() => goals?.filter(g => g.clientId === clientId) || [], [goals, clientId])
  const clientHoldings = useMemo(
    () => holdings?.filter(h => h.portfolioId === portfolio?.id) || [],
    [holdings, portfolio?.id]
  )

  const nextBestActions = useMemo(() => {
    if (!portfolio || !riskProfile || !instruments || !modelPortfolios) return []
    return generateNextBestActions(
      clientId,
      portfolio,
      clientHoldings,
      instruments,
      riskProfile,
      clientGoals,
      modelPortfolios
    )
  }, [clientId, portfolio, clientHoldings, riskProfile, clientGoals, instruments, modelPortfolios])

  const portfolioHealth = useMemo(() => {
    if (!portfolio || !riskProfile || !instruments || !modelPortfolios) return null

    const allocations = calculatePortfolioAllocations(clientHoldings, instruments, portfolio)
    const model = getRecommendedModel(riskProfile.score, modelPortfolios)
    const drift = model ? calculateDrift(allocations, model) : 0

    const riskStale = isRiskProfileStale(riskProfile)
    const cashPct = (portfolio.cash / portfolio.totalValue) * 100
    const highCash = cashPct > 10

    let score = 100
    if (riskStale) score -= 20
    if (drift > 8) score -= Math.min(30, drift * 2)
    if (highCash) score -= 10
    if (nextBestActions.filter(a => a.priority === 'HIGH').length > 0) score -= 15

    return {
      score: Math.max(0, score),
      drift,
      riskStale,
      highCash,
      cashPct,
      model,
    }
  }, [portfolio, riskProfile, clientHoldings, instruments, modelPortfolios, nextBestActions])

  const goalsHealth = useMemo(() => {
    if (clientGoals.length === 0) return { onTrack: 0, needsAttention: 0, critical: 0 }

    const onTrack: string[] = []
    const needsAttention: string[] = []
    const critical: string[] = []

    clientGoals.forEach(goal => {
      const gap = calculateGoalGap(goal)
      const required = calculateRequiredMonthlyContribution(goal)
      const shortfall = required - goal.monthlyContribution

      if (shortfall < 100) {
        onTrack.push(goal.id)
      } else if (gap > 100000 || shortfall > 1000) {
        critical.push(goal.id)
      } else {
        needsAttention.push(goal.id)
      }
    })

    return {
      onTrack: onTrack.length,
      needsAttention: needsAttention.length,
      critical: critical.length,
    }
  }, [clientGoals])

  const handleGenerateAIInsights = async () => {
    if (!currentUser || !client || !profile || !riskProfile || !portfolio) return

    setIsGenerating(true)
    try {
      const response = await generatePersonalizedInsights(
        client,
        profile,
        riskProfile,
        portfolio,
        clientGoals,
        clientHoldings,
        instruments || [],
        modelPortfolios || [],
        nextBestActions
      )

      setAiInsights(response.content)

      const interaction = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actorUserId: currentUser.id,
        clientId,
        endpoint: 'personalized-insights',
        prompt: 'Generate comprehensive financial insights',
        response: response.content,
        model: response.model,
        createdAt: new Date().toISOString(),
        offlineMode: response.offlineMode,
        metadata: { sources: response.sources },
      }

      setAiInteractions(current => [...(current || []), interaction])

      toast.success('AI Insights Generated', {
        description: 'Your personalized financial insights are ready',
      })
    } catch (error) {
      toast.error('Failed to generate insights', {
        description: 'Please try again',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUpdateGoalContribution = (goalId: string, newContribution: number) => {
    setGoals((currentGoals) =>
      (currentGoals || []).map((g) =>
        g.id === goalId
          ? { ...g, monthlyContribution: newContribution, updatedAt: new Date().toISOString() }
          : g
      )
    )
  }

  if (!client || !profile || !riskProfile || !portfolio || !portfolioHealth) {
    return <div>Loading insights...</div>
  }

  const highPriorityActions = nextBestActions.filter(a => a.priority === 'HIGH')
  const mediumPriorityActions = nextBestActions.filter(a => a.priority === 'MEDIUM')

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2 flex items-center gap-3">
            <Lightbulb size={32} weight="duotone" className="text-accent" />
            Financial Insights
          </h2>
          <p className="text-muted-foreground">
            Personalized recommendations and analysis based on your complete financial picture
          </p>
        </div>
        <Button
          onClick={handleGenerateAIInsights}
          disabled={isGenerating}
          className="gap-2 ai-glow"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Sparkle size={20} weight="fill" className="animate-pulse" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkle size={20} weight="duotone" />
              Generate AI Insights
            </>
          )}
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <ShieldCheck size={16} />
              Portfolio Health Score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 mb-3">
              <p className="text-5xl font-display font-bold text-primary wealth-number">
                {portfolioHealth.score.toFixed(0)}
              </p>
              <p className="text-2xl text-muted-foreground mb-1">/100</p>
            </div>
            <Progress value={portfolioHealth.score} className="h-3" />
            <p className="text-sm text-muted-foreground mt-3">
              {portfolioHealth.score >= 80
                ? 'Excellent - Well optimized'
                : portfolioHealth.score >= 60
                ? 'Good - Minor adjustments needed'
                : 'Needs attention - Review recommendations'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Target size={16} />
              Goals Status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} weight="fill" className="text-success" />
                <span className="text-sm">On Track</span>
              </div>
              <span className="font-bold text-xl wealth-number">{goalsHealth.onTrack}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Warning size={20} weight="fill" className="text-warning" />
                <span className="text-sm">Needs Attention</span>
              </div>
              <span className="font-bold text-xl wealth-number">{goalsHealth.needsAttention}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Warning size={20} weight="fill" className="text-destructive" />
                <span className="text-sm">Critical</span>
              </div>
              <span className="font-bold text-xl wealth-number">{goalsHealth.critical}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-warning/30 bg-gradient-to-br from-warning/5 to-transparent">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Lightbulb size={16} />
              Action Items
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">High Priority</span>
              <Badge variant="destructive" className="text-lg font-bold px-3">
                {highPriorityActions.length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Medium Priority</span>
              <Badge variant="secondary" className="text-lg font-bold px-3">
                {mediumPriorityActions.length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Actions</span>
              <span className="font-bold text-xl wealth-number">{nextBestActions.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {aiInsights && (
        <Card className="ai-glow border-2 border-accent/30">
          <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10">
            <CardTitle className="flex items-center gap-2 text-accent">
              <Sparkle size={24} weight="fill" />
              AI-Generated Insights
            </CardTitle>
            <CardDescription>
              Personalized analysis of your financial situation and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap leading-relaxed text-foreground">{aiInsights}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target size={24} className="text-success" />
              Goal Contribution Manager
            </CardTitle>
            <CardDescription>
              Review and adjust your monthly savings to stay on track
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {clientGoals.length === 0 ? (
                  <div className="text-center py-12">
                    <Target size={48} weight="duotone" className="mx-auto mb-4 text-muted-foreground/30" />
                    <p className="font-semibold text-muted-foreground mb-2">No goals set yet</p>
                    <p className="text-sm text-muted-foreground">
                      Create financial goals to get personalized contribution recommendations
                    </p>
                  </div>
                ) : (
                  clientGoals.map((goal) => {
                    const gap = calculateGoalGap(goal)
                    const required = calculateRequiredMonthlyContribution(goal)
                    const shortfall = required - goal.monthlyContribution
                    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)

                    return (
                      <div
                        key={goal.id}
                        className="p-4 border-2 rounded-lg hover:border-primary/30 transition-all hover:shadow-md space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-bold text-lg mb-1">{goal.name}</p>
                            <Badge variant="secondary" className="text-xs">{goal.type}</Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedGoalForAdjustment(goal)}
                            className="gap-2"
                          >
                            <PencilSimple size={16} />
                            Adjust
                          </Button>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-semibold">{progress.toFixed(1)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-muted/30 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Current Monthly</p>
                            <p className="font-bold text-base wealth-number">
                              ${goal.monthlyContribution.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Recommended</p>
                            <p className="font-bold text-base wealth-number">
                              ${Math.ceil(required).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {shortfall > 100 && (
                          <div className={`p-3 rounded-lg border-2 ${
                            shortfall > 500 
                              ? 'bg-destructive/5 border-destructive/30' 
                              : 'bg-warning/5 border-warning/30'
                          }`}>
                            <div className="flex items-start gap-2">
                              <Warning 
                                size={16} 
                                weight="fill" 
                                className={shortfall > 500 ? 'text-destructive mt-0.5' : 'text-warning mt-0.5'} 
                              />
                              <div className="flex-1">
                                <p className={`text-xs font-semibold ${
                                  shortfall > 500 ? 'text-destructive' : 'text-warning'
                                }`}>
                                  {shortfall > 500 ? 'Critical Gap' : 'Recommendation'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Increase by ${Math.ceil(shortfall).toLocaleString()}/month to reach goal
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {shortfall <= 100 && shortfall > 0 && (
                          <div className="p-3 rounded-lg border-2 bg-success/5 border-success/30">
                            <div className="flex items-start gap-2">
                              <CheckCircle size={16} weight="fill" className="text-success mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-success">Almost There!</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Just ${Math.ceil(shortfall).toLocaleString()}/month more to be perfectly on track
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {shortfall <= 0 && (
                          <div className="p-3 rounded-lg border-2 bg-success/5 border-success/30">
                            <div className="flex items-center gap-2">
                              <CheckCircle size={16} weight="fill" className="text-success" />
                              <p className="text-xs font-semibold text-success">On Track!</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartLine size={24} className="text-primary" />
              Portfolio Insights
            </CardTitle>
            <CardDescription>Analysis of your current allocation and positioning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold mb-1">Allocation Drift</p>
                  <p className="text-sm text-muted-foreground">
                    Current drift from your {portfolioHealth.model?.name || 'recommended'} model
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold wealth-number text-primary">
                    {portfolioHealth.drift.toFixed(1)}%
                  </p>
                  {portfolioHealth.drift > 8 && (
                    <Badge variant="destructive" className="mt-1 text-xs">
                      Rebalance Needed
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold mb-1">Cash Position</p>
                  <p className="text-sm text-muted-foreground">
                    Percentage of portfolio in cash holdings
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold wealth-number text-primary">
                    {portfolioHealth.cashPct.toFixed(1)}%
                  </p>
                  {portfolioHealth.highCash && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      Consider Investing
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold mb-1">Risk Profile Status</p>
                  <p className="text-sm text-muted-foreground">
                    Last updated {Math.floor((Date.now() - new Date(riskProfile.lastUpdated).getTime()) / (1000 * 60 * 60 * 24))} days ago
                  </p>
                </div>
                <div className="text-right">
                  {portfolioHealth.riskStale ? (
                    <Badge variant="destructive" className="text-xs">
                      Update Needed
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="font-semibold text-sm">Recommended Model Portfolio</p>
              {portfolioHealth.model ? (
                <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                  <p className="font-bold text-lg text-primary mb-1">{portfolioHealth.model.name}</p>
                  <p className="text-sm text-muted-foreground">{portfolioHealth.model.description}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No model found for your risk profile</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb size={24} className="text-warning" />
              Next Best Actions
            </CardTitle>
            <CardDescription>
              Prioritized recommendations to optimize your financial health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {nextBestActions.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle size={48} weight="duotone" className="mx-auto mb-4 text-success/30" />
                    <p className="font-semibold text-success mb-2">All Caught Up!</p>
                    <p className="text-sm text-muted-foreground">
                      No urgent actions needed. Your finances are well-managed.
                    </p>
                  </div>
                ) : (
                  <>
                    {highPriorityActions.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Warning size={20} weight="fill" className="text-destructive" />
                          <p className="font-semibold text-sm">High Priority</p>
                        </div>
                        {highPriorityActions.map(action => (
                          <ActionCard key={action.id} action={action} />
                        ))}
                      </div>
                    )}

                    {mediumPriorityActions.length > 0 && (
                      <div className="space-y-3 mt-6">
                        <div className="flex items-center gap-2">
                          <Warning size={20} weight="fill" className="text-warning" />
                          <p className="font-semibold text-sm">Medium Priority</p>
                        </div>
                        {mediumPriorityActions.map(action => (
                          <ActionCard key={action.id} action={action} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {selectedGoalForAdjustment && (
        <GoalAdjustmentDialog
          goal={selectedGoalForAdjustment}
          open={!!selectedGoalForAdjustment}
          onOpenChange={(open) => !open && setSelectedGoalForAdjustment(null)}
          onSave={handleUpdateGoalContribution}
        />
      )}
    </div>
  )
}

function ActionCard({ action }: { action: NextBestAction }) {
  const getPriorityColor = (priority: NextBestAction['priority']) => {
    switch (priority) {
      case 'HIGH':
        return 'border-destructive/30 bg-destructive/5'
      case 'MEDIUM':
        return 'border-warning/30 bg-warning/5'
      case 'LOW':
        return 'border-muted bg-muted/30'
    }
  }

  const getIcon = (type: NextBestAction['type']) => {
    switch (type) {
      case 'REFRESH_RISK_PROFILE':
        return <ShieldCheck size={20} weight="duotone" className="text-accent" />
      case 'INCREASE_CONTRIBUTION':
        return <TrendUp size={20} weight="duotone" className="text-success" />
      case 'REBALANCE_PORTFOLIO':
        return <ChartLine size={20} weight="duotone" className="text-primary" />
      case 'INVEST_CASH':
        return <Target size={20} weight="duotone" className="text-warning" />
    }
  }

  return (
    <div className={`p-4 border-2 rounded-lg ${getPriorityColor(action.priority)}`}>
      <div className="flex items-start gap-3">
        <div className="mt-1">{getIcon(action.type)}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold mb-1">{action.title}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{action.description}</p>
        </div>
        <Button variant="ghost" size="sm" className="shrink-0">
          <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  )
}
