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
  Eye,
  Users,
  UploadSimple,
} from '@phosphor-icons/react'
import { useDataStore } from '@/lib/data-store'
import { isRiskProfileStale, calculateGoalGap, calculateRequiredMonthlyContribution, addProgressSnapshotToGoal } from '@/lib/business-logic'
import { PortfolioView } from './PortfolioView'
import { OrdersView } from './OrdersView'
import { AIAssistant } from './AIAssistant'
import { InsightsDashboard } from './InsightsDashboard'
import { GoalAdjustmentDialog } from './GoalAdjustmentDialog'
import { GoalTemplateDialog } from './GoalTemplateDialog'
import { CustomGoalDialog } from './CustomGoalDialog'
import { MilestoneCelebration } from './MilestoneCelebration'
import { GoalDetailView } from './GoalDetailView'
import { GoalComparisonView } from './GoalComparisonView'
import { FamilyBudgetDialog } from './FamilyBudgetDialog'
import { BankStatementUpload } from './BankStatementUpload'
import { SpendingAlertsPanel } from './SpendingAlertsPanel'
import { MultiStatementComparison } from './MultiStatementComparison'
import { BankStatementGoalIntegration } from './BankStatementGoalIntegration'
import { processBankStatement } from '@/lib/bank-statement-processor'
import type { Goal, GoalMilestone, GoalType, FamilyMember, CategoryBudget, SpendingAlert } from '@/lib/types'
import type { GoalTemplate } from '@/lib/goal-templates'
import { toast } from 'sonner'

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
    bankStatements,
    setBankStatements,
    categoryBudgets,
    setCategoryBudgets,
    spendingAlerts,
    setSpendingAlerts,
  } = useDataStore()

  const [activeTab, setActiveTab] = useState('overview')
  const [selectedGoalForAdjustment, setSelectedGoalForAdjustment] = useState<Goal | null>(null)
  const [selectedGoalForDetail, setSelectedGoalForDetail] = useState<Goal | null>(null)
  const [selectedGoalForFamily, setSelectedGoalForFamily] = useState<Goal | null>(null)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showCustomGoalDialog, setShowCustomGoalDialog] = useState(false)
  const [showComparisonView, setShowComparisonView] = useState(false)
  const [celebrationData, setCelebrationData] = useState<{
    goalName: string
    percentage: number
    currentAmount: number
    targetAmount: number
  } | null>(null)

  const isBlankUser = clientId === 'cli-blank'

  const client = useMemo(() => (users || []).find(u => u.id === clientId), [users, clientId])
  const profile = useMemo(() => (clientProfiles || []).find(cp => cp.userId === clientId), [clientProfiles, clientId])
  const riskProfile = useMemo(() => (riskProfiles || []).find(rp => rp.clientId === clientId), [riskProfiles, clientId])
  const clientGoals = useMemo(() => (goals || []).filter(g => g.clientId === clientId), [goals, clientId])
  const portfolio = useMemo(() => (portfolios || []).find(p => p.clientId === clientId), [portfolios, clientId])
  const clientStatements = useMemo(() => (bankStatements || []).filter(s => s.userId === clientId), [bankStatements, clientId])

  const age = profile ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 0
  const riskStale = riskProfile ? isRiskProfileStale(riskProfile) : false
  const totalGoalsProgress = clientGoals.length > 0
    ? clientGoals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount) * 100, 0) / clientGoals.length
    : 0

  const checkMilestones = (goal: Goal) => {
    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    const milestones = [10, 25, 50, 75, 100]
    
    const existingMilestones = goal.milestones || []
    
    for (const milestone of milestones) {
      if (progress >= milestone) {
        const alreadyAchieved = existingMilestones.find(
          m => m.percentage === milestone && m.achievedAt
        )
        
        if (!alreadyAchieved) {
          setCelebrationData({
            goalName: goal.name,
            percentage: milestone,
            currentAmount: goal.currentAmount,
            targetAmount: goal.targetAmount,
          })
          
          setGoals((currentGoals) =>
            (currentGoals || []).map((g) => {
              if (g.id === goal.id) {
                const updatedMilestones: GoalMilestone[] = [
                  ...(g.milestones || []),
                  {
                    id: `milestone-${goal.id}-${milestone}`,
                    goalId: goal.id,
                    percentage: milestone,
                    achievedAt: new Date().toISOString(),
                    celebrated: true,
                  },
                ]
                return { ...g, milestones: updatedMilestones }
              }
              return g
            })
          )
          break
        }
      }
    }
  }

  const handleSimulateContribution = (goalId: string) => {
    setGoals((currentGoals) => {
      const updatedGoals = (currentGoals || []).map((g) => {
        if (g.id === goalId) {
          const newAmount = Math.min(
            g.currentAmount + g.monthlyContribution * 3,
            g.targetAmount
          )
          let updated = { 
            ...g, 
            currentAmount: newAmount,
            updatedAt: new Date().toISOString() 
          }
          updated = addProgressSnapshotToGoal(updated)
          checkMilestones(updated)
          return updated
        }
        return g
      })
      return updatedGoals
    })
    
    toast.success('Progress Updated', {
      description: 'Simulated 3 months of contributions',
    })
  }

  const handleUpdateGoalContribution = (goalId: string, newContribution: number) => {
    setGoals((currentGoals) => {
      const updatedGoals = (currentGoals || []).map((g) => {
        if (g.id === goalId) {
          let updated = { ...g, monthlyContribution: newContribution, updatedAt: new Date().toISOString() }
          updated = addProgressSnapshotToGoal(updated)
          checkMilestones(updated)
          return updated
        }
        return g
      })
      return updatedGoals
    })
  }

  const handleUpdateGoal = (goalId: string, updates: Partial<Goal>) => {
    setGoals((currentGoals) => {
      const updatedGoals = (currentGoals || []).map((g) => {
        if (g.id === goalId) {
          return { ...g, ...updates, updatedAt: new Date().toISOString() }
        }
        return g
      })
      return updatedGoals
    })
  }

  const handleCreateGoalFromTemplate = (template: GoalTemplate, customAmount: number, customYears: number) => {
    const targetDate = new Date()
    targetDate.setFullYear(targetDate.getFullYear() + customYears)
    
    const monthlyContribution = Math.ceil(customAmount / (customYears * 12))
    
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      clientId: clientId,
      type: template.type,
      name: template.name,
      targetAmount: customAmount,
      currentAmount: 0,
      targetDate: targetDate.toISOString(),
      monthlyContribution: monthlyContribution,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      milestones: [],
      isCustom: false,
    }
    
    setGoals((currentGoals) => [...(currentGoals || []), newGoal])
    setShowTemplateDialog(false)
    
    toast.success('Goal Created!', {
      description: `${template.name} goal created with $${monthlyContribution.toLocaleString()}/month contribution`,
    })
  }

  const handleCreateCustomGoal = (goalData: {
    name: string
    type: GoalType
    targetAmount: number
    targetYears: number
  }) => {
    const targetDate = new Date()
    targetDate.setFullYear(targetDate.getFullYear() + goalData.targetYears)
    
    const monthlyContribution = Math.ceil(goalData.targetAmount / (goalData.targetYears * 12))
    
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      clientId: clientId,
      type: goalData.type,
      name: goalData.name,
      targetAmount: goalData.targetAmount,
      currentAmount: 0,
      targetDate: targetDate.toISOString(),
      monthlyContribution: monthlyContribution,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      milestones: [],
      isCustom: true,
    }
    
    setGoals((currentGoals) => [...(currentGoals || []), newGoal])
    
    toast.success('Custom Goal Created!', {
      description: `${goalData.name} goal created with $${monthlyContribution.toLocaleString()}/month contribution`,
    })
  }

  const handleSaveFamilyGoal = (goalId: string, isFamilyGoal: boolean, members?: FamilyMember[]) => {
    setGoals((currentGoals) =>
      (currentGoals || []).map((g) => {
        if (g.id === goalId) {
          return {
            ...g,
            familyGoal: isFamilyGoal
              ? {
                  goalId: g.id,
                  isFamily: true,
                  members: members || [],
                  createdBy: clientId,
                }
              : undefined,
            updatedAt: new Date().toISOString(),
          }
        }
        return g
      })
    )
  }

  const checkForSpendingAlerts = (statementId: string) => {
    const statement = (bankStatements || []).find(s => s.id === statementId)
    if (!statement || !statement.extractedData) return

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const budgets = categoryBudgets || []
    budgets.forEach((budget: CategoryBudget) => {
      const currentMonthSpending = (bankStatements || [])
        .filter(s => {
          if (!s.extractedData?.statementDate) return false
          const stmtDate = new Date(s.extractedData.statementDate)
          return stmtDate.getMonth() === currentMonth && stmtDate.getFullYear() === currentYear
        })
        .reduce((sum, s) => {
          const categoryAmount = s.extractedData?.categorySummary?.find(c => c.category === budget.category)?.amount || 0
          return sum + categoryAmount
        }, 0)

      const percentage = (currentMonthSpending / budget.monthlyLimit) * 100

      if (percentage >= budget.alertThreshold) {
        const existingAlert = (spendingAlerts || []).find(
          a => a.userId === clientId && a.category === budget.category && !a.dismissed
        )

        if (!existingAlert) {
          const alert: SpendingAlert = {
            id: `alert-${Date.now()}-${budget.category}`,
            userId: clientId,
            category: budget.category,
            currentSpending: currentMonthSpending,
            budgetLimit: budget.monthlyLimit,
            threshold: budget.alertThreshold,
            percentage,
            severity: percentage >= 100 ? 'CRITICAL' : 'WARNING',
            statementIds: [statementId],
            createdAt: new Date().toISOString(),
            dismissed: false
          }

          setSpendingAlerts((currentAlerts) => [...(currentAlerts || []), alert])
        }
      }
    })
  }

  const handleBankStatementUpload = async (file: File) => {
    try {
      const statement = await processBankStatement(file, clientId)
      setBankStatements((currentStatements) => [...(currentStatements || []), statement])
      
      toast.success('Statement uploaded successfully!', {
        description: `Processing ${file.name}...`,
      })

      setTimeout(() => {
        setBankStatements((currentStatements) =>
          (currentStatements || []).map((s) =>
            s.id === statement.id
              ? { ...s, status: 'COMPLETED' as const, processedAt: new Date().toISOString() }
              : s
          )
        )
        checkForSpendingAlerts(statement.id)
      }, 2500)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    }
  }

  const handleSetBudget = (category: string, limit: number, threshold: number) => {
    const existingBudgetIndex = (categoryBudgets || []).findIndex(b => b.category === category)
    
    if (existingBudgetIndex >= 0) {
      setCategoryBudgets((currentBudgets) =>
        (currentBudgets || []).map((b, index) =>
          index === existingBudgetIndex
            ? { category, monthlyLimit: limit, alertThreshold: threshold }
            : b
        )
      )
    } else {
      setCategoryBudgets((currentBudgets) => [
        ...(currentBudgets || []),
        { category, monthlyLimit: limit, alertThreshold: threshold }
      ])
    }
  }

  const handleDismissAlert = (alertId: string) => {
    setSpendingAlerts((currentAlerts) =>
      (currentAlerts || []).map(a =>
        a.id === alertId ? { ...a, dismissed: true } : a
      )
    )
  }

  const handleUpdateGoalFromSpending = (goalId: string, newContribution: number) => {
    setGoals((currentGoals) =>
      (currentGoals || []).map(g =>
        g.id === goalId
          ? { ...g, monthlyContribution: newContribution, updatedAt: new Date().toISOString() }
          : g
      )
    )
  }

  if (!users || !clientProfiles || !riskProfiles || !portfolios) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="text-6xl">⏳</div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Loading...</h3>
            <p className="text-sm text-muted-foreground">Initializing your account data</p>
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="text-6xl">❌</div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Account not found</h3>
            <p className="text-sm text-muted-foreground">User not found in system</p>
            <p className="text-xs text-muted-foreground mt-2">Client ID: {clientId}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isBlankUser && (!profile || !riskProfile)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="text-6xl">❌</div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Account not found</h3>
            <p className="text-sm text-muted-foreground">Missing data for: {!profile ? 'Profile' : 'Risk Profile'}</p>
            <p className="text-xs text-muted-foreground mt-2">Client ID: {clientId}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!portfolio && !isBlankUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="text-6xl">📊</div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Portfolio Initializing</h3>
            <p className="text-sm text-muted-foreground">Your portfolio is being set up. Please refresh the page.</p>
          </div>
        </div>
      </div>
    )
  }

  if (isBlankUser) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/10 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <UploadSimple size={24} className="text-accent" weight="duotone" />
              </div>
              Welcome to Your Wealth Dashboard
            </CardTitle>
            <CardDescription>
              Start by uploading your bank statements to get personalized insights and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-6 space-y-3">
              <h4 className="font-semibold text-foreground">Getting Started</h4>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Upload your bank statements (PDF, CSV, or image formats)</li>
                <li>Our AI will automatically extract transactions and spending patterns</li>
                <li>Review your financial insights and set up personalized goals</li>
                <li>Track progress and get smart recommendations</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Tabs value="upload" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="upload" className="gap-2">
              <UploadSimple size={16} />
              Upload Statements
            </TabsTrigger>
            <TabsTrigger value="portfolio" disabled className="gap-2">
              <ChartLine size={16} />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="goals" disabled className="gap-2">
              <Target size={16} />
              Goals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <BankStatementUpload statements={clientStatements} onUpload={handleBankStatementUpload} />
            
            {clientStatements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Uploaded Statements</CardTitle>
                  <CardDescription>
                    {clientStatements.length} statement{clientStatements.length !== 1 ? 's' : ''} uploaded
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {clientStatements.map(statement => (
                    <div
                      key={statement.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{statement.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {statement.extractedData?.transactions?.length || 0} transactions • 
                          Uploaded {new Date(statement.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {statement.extractedData?.statementDate 
                          ? new Date(statement.extractedData.statementDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                          : 'Processed'
                        }
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {clientStatements.length > 0 && (
              <Card className="border-accent/30 bg-accent/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb size={20} className="text-accent" weight="duotone" />
                    Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Now that you've uploaded your statements, you can:
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setShowTemplateDialog(true)}>
                      <Target size={16} />
                      Create Your First Financial Goal
                      <ArrowRight size={14} className="ml-auto" />
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" disabled>
                      <ChartLine size={16} />
                      View Spending Analytics
                      <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <GoalTemplateDialog
          open={showTemplateDialog}
          onOpenChange={(open) => setShowTemplateDialog(open)}
          onSelectTemplate={handleCreateGoalFromTemplate}
          userAge={age}
          userRiskScore={riskProfile?.score || 5}
        />
      </div>
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
              ${portfolio?.totalValue.toLocaleString() || '0'}
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
              {riskProfile?.score || 0}/10
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">{riskProfile?.category || 'N/A'}</Badge>
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
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="overview" className="gap-2">
                <UserIcon size={16} />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-2">
                <Lightbulb size={16} />
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
              <TabsTrigger value="upload" className="gap-2">
                <UploadSimple size={16} />
                <span className="hidden sm:inline">Upload</span>
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
                    <p className="font-medium">{profile?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium">{profile?.onboardingDate ? new Date(profile.onboardingDate).toLocaleDateString() : 'N/A'}</p>
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
                      <span className="font-bold wealth-number text-xl">{riskProfile?.score || 0}/10</span>
                    </div>
                    <Progress value={(riskProfile?.score || 0) * 10} className="h-3" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <Badge variant="outline" className="mt-1 text-sm">{riskProfile?.category || 'N/A'}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {riskProfile?.lastUpdated ? new Date(riskProfile.lastUpdated).toLocaleDateString() : 'N/A'}
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Target size={24} />
                        My Financial Goals
                      </CardTitle>
                      <CardDescription>
                        Track your progress toward life's important milestones
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {clientGoals.length >= 2 && (
                        <Button
                          onClick={() => setShowComparisonView(true)}
                          variant="outline"
                          className="gap-2"
                        >
                          <ChartLine size={16} />
                          <span className="hidden sm:inline">Compare Goals</span>
                        </Button>
                      )}
                      <Button onClick={() => setShowTemplateDialog(true)} className="gap-2">
                        <Target size={16} weight="bold" />
                        Add Goal
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {clientGoals.length === 0 ? (
                    <div className="text-center py-12">
                      <Target size={48} className="mx-auto mb-4 text-muted-foreground/30" weight="duotone" />
                      <p className="text-muted-foreground font-medium mb-2">No goals set yet</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start planning for retirement, a home, education, or other dreams
                      </p>
                      <Button onClick={() => setShowTemplateDialog(true)} className="gap-2">
                        <Target size={16} weight="bold" />
                        Add Your First Goal
                      </Button>
                    </div>
                  ) : (
                    clientGoals.map(goal => {
                      const gap = calculateGoalGap(goal)
                      const required = calculateRequiredMonthlyContribution(goal)
                      const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                      const achievedMilestones = (goal.milestones || []).filter(m => m.achievedAt).length
                      const isFamilyGoal = goal.familyGoal?.isFamily || false

                      return (
                        <div key={goal.id} className="p-6 border-2 rounded-xl space-y-4 hover:border-primary/30 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-xl">{goal.name}</p>
                                {goal.isCustom && (
                                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                                    Custom
                                  </Badge>
                                )}
                                {isFamilyGoal && (
                                  <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/30 gap-1">
                                    <Users size={12} weight="fill" />
                                    Family Goal
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{goal.type === 'LIFE_EVENT' ? 'Life Event' : goal.type}</Badge>
                                {achievedMilestones > 0 && (
                                  <Badge variant="outline" className="gap-1 bg-accent/10 text-accent border-accent/30">
                                    <Target size={12} weight="fill" />
                                    {achievedMilestones} {achievedMilestones === 1 ? 'milestone' : 'milestones'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedGoalForFamily(goal)}
                                className="gap-2"
                                title="Family Budgeting"
                              >
                                <Users size={16} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedGoalForDetail(goal)}
                                className="gap-2"
                              >
                                <Eye size={16} />
                                <span className="hidden sm:inline">View Details</span>
                              </Button>
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

                          <div className="pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSimulateContribution(goal.id)}
                              className="w-full gap-2 text-xs text-muted-foreground hover:text-primary"
                            >
                              <TrendUp size={14} />
                              Simulate 3 Months Progress (Demo)
                            </Button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload" className="mt-6 space-y-6">
              <BankStatementUpload
                statements={clientStatements}
                onUpload={handleBankStatementUpload}
              />
              
              {clientStatements.filter(s => s.status === 'COMPLETED').length >= 2 && (
                <MultiStatementComparison statements={clientStatements} />
              )}
              
              <SpendingAlertsPanel
                userId={clientId}
                statements={clientStatements}
                budgets={categoryBudgets || []}
                alerts={spendingAlerts || []}
                onSetBudget={handleSetBudget}
                onDismissAlert={handleDismissAlert}
              />
              
              <BankStatementGoalIntegration
                userId={clientId}
                statements={clientStatements}
                goals={clientGoals}
                onUpdateGoal={handleUpdateGoalFromSpending}
              />
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

      <GoalTemplateDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        onSelectTemplate={handleCreateGoalFromTemplate}
        onCreateCustom={() => setShowCustomGoalDialog(true)}
        userAge={age}
        userRiskScore={riskProfile?.score || 5}
      />

      <CustomGoalDialog
        open={showCustomGoalDialog}
        onOpenChange={setShowCustomGoalDialog}
        onCreateGoal={handleCreateCustomGoal}
      />

      {celebrationData && (
        <MilestoneCelebration
          open={!!celebrationData}
          onOpenChange={(open) => !open && setCelebrationData(null)}
          goalName={celebrationData.goalName}
          milestonePercentage={celebrationData.percentage}
          currentAmount={celebrationData.currentAmount}
          targetAmount={celebrationData.targetAmount}
        />
      )}

      <GoalDetailView
        goal={selectedGoalForDetail}
        allGoals={clientGoals}
        isOpen={!!selectedGoalForDetail}
        onClose={() => setSelectedGoalForDetail(null)}
        onUpdateGoal={handleUpdateGoal}
      />

      <GoalComparisonView
        open={showComparisonView}
        onOpenChange={setShowComparisonView}
        goals={clientGoals}
      />

      {selectedGoalForFamily && (
        <FamilyBudgetDialog
          open={!!selectedGoalForFamily}
          onOpenChange={(open) => !open && setSelectedGoalForFamily(null)}
          goal={selectedGoalForFamily}
          onSave={(isFamilyGoal, members) => {
            handleSaveFamilyGoal(selectedGoalForFamily.id, isFamilyGoal, members)
            setSelectedGoalForFamily(null)
          }}
        />
      )}
    </div>
  )
}
