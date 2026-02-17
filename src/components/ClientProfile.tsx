import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User as UserIcon,
  ShieldCheck,
  Target,
  ChartLine,
  ClockCounterClockwise,
  Warning,
  TrendUp,
  Wallet,
  Lightbulb,
  ArrowRight,
  PencilSimple,
} from '@phosphor-icons/react'
import { useDataStore } from '@/lib/data-store'
import { isRiskProfileStale, calculateGoalGap, calculateRequiredMonthlyContribution } from '@/lib/business-logic'
import { PortfolioView } from './PortfolioView'
import { OrdersView } from './OrdersView'
import { AIAssistant } from './AIAssistant'
import { InsightsDashboard } from './InsightsDashboard'
import { GoalAdjustmentDialog } from './GoalAdjustmentDialog'
import type { Goal } from '@/lib/types'

interface ClientProfileProps {
  clientId: string
}

export function ClientProfile({ clientId }: ClientProfileProps) {
  const {
    users,
    clientProfiles,
    riskProfiles,
    goals,
    portfolios,
    setGoals,
  } = useDataStore()

  const [activeTab, setActiveTab] = useState('overview')
  const [selectedGoalForAdjustment, setSelectedGoalForAdjustment] = useState<Goal | null>(null)

  const client = useMemo(() => (users || []).find(u => u.id === clientId), [users, clientId])
  const profile = useMemo(() => (clientProfiles || []).find(cp => cp.userId === clientId), [clientProfiles, clientId])
  const riskProfile = useMemo(() => (riskProfiles || []).find(rp => rp.clientId === clientId), [riskProfiles, clientId])
  const clientGoals = useMemo(() => (goals || []).filter(g => g.clientId === clientId), [goals, clientId])
  const portfolio = useMemo(() => (portfolios || []).find(p => p.clientId === clientId), [portfolios, clientId])

  if (!client || !profile || !riskProfile || !portfolio) {
    return <div>Account not found</div>
  }

  const age = Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  const riskStale = isRiskProfileStale(riskProfile)
  const totalGoalsProgress = clientGoals.length > 0
    ? clientGoals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount) * 100, 0) / clientGoals.length
    : 0

  const handleUpdateGoalContribution = (goalId: string, newContribution: number) => {
    setGoals((currentGoals) =>
      (currentGoals || []).map((g) =>
        g.id === goalId
          ? { ...g, monthlyContribution: newContribution, updatedAt: new Date().toISOString() }
          : g
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Wallet size={16} />
              Total Wealth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-display font-bold text-primary wealth-number">
              ${portfolio.totalValue.toLocaleString()}
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <TrendUp size={16} className="text-success" weight="bold" />
              <span className="text-success font-semibold">+12.5%</span>
              <span className="text-muted-foreground">this year</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-success/20 bg-gradient-to-br from-success/5 to-transparent">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Target size={16} />
              Goals Progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-display font-bold text-success wealth-number">
              {totalGoalsProgress.toFixed(0)}%
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {clientGoals.length} active {clientGoals.length === 1 ? 'goal' : 'goals'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <ShieldCheck size={16} />
              Risk Profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-display font-bold text-accent wealth-number">
              {riskProfile.score}/10
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">{riskProfile.category}</Badge>
              {riskStale && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <Warning size={12} weight="fill" />
                  Update Needed
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="overview" className="gap-2">
                <UserIcon size={16} />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-2">
                <Target size={16} />
                <span className="hidden sm:inline">Insights</span>
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="gap-2">
                <ChartLine size={16} />
                <span className="hidden sm:inline">Portfolio</span>
              </TabsTrigger>
              <TabsTrigger value="goals" className="gap-2">
                <Target size={16} />
                <span className="hidden sm:inline">Goals</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <ClockCounterClockwise size={16} />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon size={24} />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">{age} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{profile.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium">{new Date(profile.onboardingDate).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck size={24} />
                    Your Risk Profile
                    {riskStale && (
                      <Badge variant="destructive" className="gap-1">
                        <Warning size={14} weight="fill" />
                        Needs Update
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    This determines your recommended investment strategy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Risk Tolerance</span>
                      <span className="font-bold wealth-number text-xl">{riskProfile.score}/10</span>
                    </div>
                    <Progress value={riskProfile.score * 10} className="h-3" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <Badge variant="outline" className="mt-1 text-sm">{riskProfile.category}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {new Date(riskProfile.lastUpdated).toLocaleDateString()}
                      {riskStale && (
                        <span className="text-destructive text-xs ml-2">
                          (Updated over 6 months ago - we recommend refreshing)
                        </span>
                      )}
                    </p>
                  </div>
                  {riskStale && (
                    <Button variant="default" className="w-full">
                      Update My Risk Profile
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/10 via-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb size={24} weight="duotone" className="text-accent" />
                    Financial Insights
                  </CardTitle>
                  <CardDescription>
                    Get AI-powered personalized recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    View comprehensive analysis of your complete financial picture with smart, actionable recommendations tailored to your goals.
                  </p>
                  <Button 
                    variant="default" 
                    className="w-full gap-2"
                    onClick={() => setActiveTab('insights')}
                  >
                    View Insights Dashboard
                    <ArrowRight size={16} weight="bold" />
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="mt-6">
              <InsightsDashboard clientId={clientId} />
            </TabsContent>

            <TabsContent value="portfolio" className="mt-6">
              <PortfolioView clientId={clientId} />
            </TabsContent>

            <TabsContent value="goals" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target size={24} />
                    My Financial Goals
                  </CardTitle>
                  <CardDescription>
                    Track your progress toward life's important milestones
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {clientGoals.length === 0 ? (
                    <div className="text-center py-12">
                      <Target size={48} className="mx-auto mb-4 text-muted-foreground/30" weight="duotone" />
                      <p className="text-muted-foreground font-medium mb-2">No goals set yet</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start planning for retirement, a home, education, or other dreams
                      </p>
                      <Button>Add Your First Goal</Button>
                    </div>
                  ) : (
                    clientGoals.map(goal => {
                      const gap = calculateGoalGap(goal)
                      const required = calculateRequiredMonthlyContribution(goal)
                      const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)

                      return (
                        <div key={goal.id} className="p-6 border-2 rounded-xl space-y-4 hover:border-primary/30 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-bold text-xl mb-1">{goal.name}</p>
                              <Badge variant="secondary">{goal.type}</Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Target</p>
                                <p className="font-bold wealth-number text-2xl text-primary">
                                  ${goal.targetAmount.toLocaleString()}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedGoalForAdjustment(goal)}
                                className="gap-2"
                              >
                                <PencilSimple size={16} />
                                <span className="hidden sm:inline">Adjust</span>
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="font-medium">Progress</span>
                              <span className="font-bold text-primary">{progress.toFixed(1)}%</span>
                            </div>
                            <Progress value={progress} className="h-3" />
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                            <div>
                              <p className="text-muted-foreground mb-1">Current Savings</p>
                              <p className="font-semibold text-lg">${goal.currentAmount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Still Needed</p>
                              <p className="font-semibold text-lg text-warning">${gap.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Target Date</p>
                              <p className="font-semibold">{new Date(goal.targetDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Monthly Saving</p>
                              <p className="font-semibold">${goal.monthlyContribution.toLocaleString()}</p>
                            </div>
                          </div>

                          {required > goal.monthlyContribution + 100 && (
                            <div className="bg-warning/10 border-2 border-warning/30 rounded-lg p-4 space-y-3">
                              <div>
                                <p className="font-semibold text-warning mb-1">💡 Recommendation</p>
                                <p className="text-sm">
                                  Consider increasing your monthly contribution by <strong>${Math.floor(required - goal.monthlyContribution).toLocaleString()}</strong> to stay on track for your target date.
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedGoalForAdjustment(goal)}
                                className="w-full gap-2"
                              >
                                <PencilSimple size={16} />
                                Adjust Contribution
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <OrdersView clientId={clientId} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          <AIAssistant clientId={clientId} />
        </div>
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
