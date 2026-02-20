import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  CurrencyCircleDollar,
} from '@phosphor-icons/react'
import { useDataStore } from '@/lib/data-store'
import { useUserCurrency } from '@/hooks/use-user-currency'
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
import { BankStatementCopilot } from './BankStatementCopilot'
import { SpendingAlertsPanel } from './SpendingAlertsPanel'
import { MultiStatementComparison } from './MultiStatementComparison'
import { BankStatementGoalIntegration } from './BankStatementGoalIntegration'
import { MultiCurrencyPortfolio } from './MultiCurrencyPortfolio'
import { RegionalBudgets } from './RegionalBudgets'
import { MultiCurrencySpendingComparison } from './MultiCurrencySpendingComparison'
import { CurrencySpendingTrends } from './CurrencySpendingTrends'
import { GoalTrackingFromStatements } from './GoalTrackingFromStatements'
import { MultiCurrencyReportExport } from './MultiCurrencyReportExport'
import { processBankStatement, extractBankStatementData } from '@/lib/bank-statement-processor'
import { formatCurrency } from '@/lib/utils'
import type { Goal, GoalMilestone, GoalType, FamilyMember, CategoryBudget, SpendingAlert, RegionalBudget } from '@/lib/types'
import type { GoalTemplate } from '@/lib/goal-templates'
import { toast } from 'sonner'

interface ClientProfileProps {
  clientId: string
}

export function ClientProfile({ clientId }: ClientProfileProps) {
  const isBlankUser = clientId === 'cli-blank'

  const {
    users,
    clientProfiles,
    setClientProfiles,
    riskProfiles,
    goals,
    portfolios,
    holdings,
    instruments,
    setGoals,
    bankStatements,
    setBankStatements,
    categoryBudgets,
    setCategoryBudgets,
    spendingAlerts,
    setSpendingAlerts,
    regionalBudgets,
    setRegionalBudgets,
    currencyAccounts,
  } = useDataStore()

  const [activeTab, setActiveTab] = useState(isBlankUser ? 'upload' : 'overview')
  const [selectedGoalForAdjustment, setSelectedGoalForAdjustment] = useState<Goal | null>(null)
  const [selectedGoalForDetail, setSelectedGoalForDetail] = useState<Goal | null>(null)
  const [selectedGoalForFamily, setSelectedGoalForFamily] = useState<Goal | null>(null)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showCustomGoalDialog, setShowCustomGoalDialog] = useState(false)
  const [showComparisonView, setShowComparisonView] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileDraft, setProfileDraft] = useState<{ dateOfBirth: string; phone: string; address: string } | null>(null)
  const [celebrationData, setCelebrationData] = useState<{
    goalName: string
    percentage: number
    currentAmount: number
    targetAmount: number
  } | null>(null)

  const client = useMemo(() => (users || []).find(u => u.id === clientId), [users, clientId])
  const profile = useMemo(() => (clientProfiles || []).find(cp => cp.userId === clientId), [clientProfiles, clientId])
  const riskProfile = useMemo(() => (riskProfiles || []).find(rp => rp.clientId === clientId), [riskProfiles, clientId])
  const clientGoals = useMemo(() => (goals || []).filter(g => g.clientId === clientId), [goals, clientId])
  const portfolio = useMemo(() => (portfolios || []).find(p => p.clientId === clientId), [portfolios, clientId])
  const portfolioHoldings = useMemo(() => (holdings || []).filter(h => h.portfolioId === portfolio?.id), [holdings, portfolio])
  const clientStatements = useMemo(() => (bankStatements || []).filter(s => s.userId === clientId), [bankStatements, clientId])
  const clientBudgets = useMemo(() => (regionalBudgets || []).filter(b => b.userId === clientId), [regionalBudgets, clientId])
  const clientCurrencyAccounts = useMemo(() => (currencyAccounts || []).filter(ca => portfolios?.find(p => p.id === ca.portfolioId && p.clientId === clientId)), [currencyAccounts, portfolios, clientId])

  const userCurrency = useUserCurrency(clientId, bankStatements || [])

  const age = profile?.dateOfBirth
    ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null
  const riskStale = riskProfile ? isRiskProfileStale(riskProfile) : false
  const totalGoalsProgress = clientGoals.length > 0
    ? clientGoals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount) * 100, 0) / clientGoals.length
    : 0

  const handleStartEditProfile = () => {
    setProfileDraft({
      dateOfBirth: profile?.dateOfBirth || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
    })
    setIsEditingProfile(true)
  }

  const handleSaveProfile = () => {
    if (!profile || !profileDraft) return
    setClientProfiles((current) =>
      (current || []).map((cp) =>
        cp.userId === clientId
          ? { ...cp, ...profileDraft }
          : cp
      )
    )
    setIsEditingProfile(false)
    setProfileDraft(null)
    toast.success('Profile updated!', { description: 'Your personal information has been saved.' })
  }

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
    setBankStatements((currentStatements) => {
      const statement = (currentStatements || []).find(s => s.id === statementId)
      if (!statement || !statement.extractedData) return currentStatements || []

      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      const budgets = categoryBudgets || []
      budgets.forEach((budget: CategoryBudget) => {
        const currentMonthSpending = (currentStatements || [])
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
          setSpendingAlerts((currentAlerts) => {
            const existingAlert = (currentAlerts || []).find(
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

              return [...(currentAlerts || []), alert]
            }
            
            return currentAlerts || []
          })
        }
      })
      
      return currentStatements || []
    })
  }

  const handleBankStatementUpload = async (file: File) => {
    try {
      const statement = await processBankStatement(file, clientId)
      setBankStatements((currentStatements) => [...(currentStatements || []), statement])
      
      toast.success('Statement uploaded successfully!', {
        description: `AI is processing ${file.name}...`,
      })

      try {
        const extractedData = await extractBankStatementData(file, statement.id)
        
        setBankStatements((currentStatements) =>
          (currentStatements || []).map((s) =>
            s.id === statement.id
              ? { 
                  ...s, 
                  status: 'COMPLETED' as const, 
                  processedAt: new Date().toISOString(),
                  extractedData 
                }
              : s
          )
        )
        
        checkForSpendingAlerts(statement.id)
        
        toast.success('Statement processed successfully!', {
          description: `Found ${extractedData?.transactions?.length || 0} transactions`,
        })
      } catch (extractError) {
        setBankStatements((currentStatements) =>
          (currentStatements || []).map((s) =>
            s.id === statement.id
              ? { 
                  ...s, 
                  status: 'FAILED' as const,
                  errorMessage: 'Failed to extract data from statement'
                }
              : s
          )
        )
        
        toast.error('Processing failed', {
          description: 'Could not extract data from the statement',
        })
      }
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

  const handleDeleteStatement = (statementId: string) => {
    setBankStatements((currentStatements) =>
      (currentStatements || []).filter(s => s.id !== statementId)
    )
  }

  const handleCreateRegionalBudget = (budget: Omit<RegionalBudget, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBudget: RegionalBudget = {
      ...budget,
      id: `budget-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setRegionalBudgets((current) => [...(current || []), newBudget])
  }

  const handleUpdateRegionalBudget = (budgetId: string, updates: Partial<RegionalBudget>) => {
    setRegionalBudgets((current) =>
      (current || []).map(b => 
        b.id === budgetId ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
      )
    )
  }

  const handleDeleteRegionalBudget = (budgetId: string) => {
    setRegionalBudgets((current) => (current || []).filter(b => b.id !== budgetId))
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


  return (
    <div className="space-y-6">
      {isBlankUser && (
        <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/10 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-accent to-primary">
                <UploadSimple size={22} className="text-white" weight="duotone" />
              </div>
              Welcome, {client?.name || 'Test User'}! Start with your bank statements
            </CardTitle>
            <CardDescription>
              Upload bank statements from the banks you work with. Our AI will automatically extract and populate your financial details — transactions, income, expenses, and spending patterns — directly into your dashboard.
            </CardDescription>
          </CardHeader>
          {clientStatements.length > 0 && clientStatements.some(s => s.status === 'COMPLETED') && (
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                  <ChartLine size={14} />
                  {clientStatements.filter(s => s.status === 'COMPLETED').length} statement(s) processed
                </Badge>
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                  <Target size={14} />
                  {clientGoals.length} goal(s) active
                </Badge>
                <Button size="sm" variant="outline" className="gap-2 ml-auto" onClick={() => setActiveTab('insights')}>
                  <Lightbulb size={14} />
                  View AI Insights
                  <ArrowRight size={13} />
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}

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
              {formatCurrency(portfolio?.totalValue || 0, userCurrency.symbol)}
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
            <div className="overflow-x-auto pb-1">
              <TabsList className="flex w-max min-w-full gap-1 h-auto p-1">
                <TabsTrigger value="overview" className="flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap">
                  <UserIcon size={15} />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap">
                  <Lightbulb size={15} />
                  Insights
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap">
                  <ChartLine size={15} />
                  Portfolio
                </TabsTrigger>
                <TabsTrigger value="multi-currency" className="flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap">
                  <CurrencyCircleDollar size={15} />
                  Multi-Currency
                </TabsTrigger>
                <TabsTrigger value="goals" className="flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap">
                  <Target size={15} />
                  Goals
                </TabsTrigger>
                <TabsTrigger value="budgets" className="flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap">
                  <Wallet size={15} />
                  Budgets
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap">
                  <UploadSimple size={15} />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap">
                  <ClockCounterClockwise size={15} />
                  Activity
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon size={24} />
                    Personal Information
                  </CardTitle>
                  {!isEditingProfile && (
                    <Button variant="outline" size="sm" className="w-fit gap-2 mt-2" onClick={handleStartEditProfile}>
                      <PencilSimple size={15} />
                      Edit Profile
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {isEditingProfile && profileDraft ? (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="dob">Date of Birth</Label>
                          <Input
                            id="dob"
                            type="date"
                            value={profileDraft.dateOfBirth}
                            onChange={(e) => setProfileDraft(d => d ? { ...d, dateOfBirth: e.target.value } : d)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="e.g. +40 7xx xxx xxx"
                            value={profileDraft.phone}
                            onChange={(e) => setProfileDraft(d => d ? { ...d, phone: e.target.value } : d)}
                          />
                        </div>
                        <div className="sm:col-span-2 space-y-1.5">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            placeholder="Your home address"
                            value={profileDraft.address}
                            onChange={(e) => setProfileDraft(d => d ? { ...d, address: e.target.value } : d)}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleSaveProfile} className="gap-2">
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => { setIsEditingProfile(false); setProfileDraft(null) }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{client.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Age</p>
                        <p className="font-medium">
                          {age !== null ? `${age} years` : <span className="text-muted-foreground italic text-sm">Not set — click Edit Profile</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">
                          {profile?.phone || <span className="text-muted-foreground italic text-sm">Not set</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Member Since</p>
                        <p className="font-medium">{profile?.onboardingDate ? new Date(profile.onboardingDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      {profile?.address && (
                        <div className="sm:col-span-2">
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p className="font-medium">{profile.address}</p>
                        </div>
                      )}
                    </div>
                  )}
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

            <TabsContent value="multi-currency" className="mt-6 space-y-6">
              {portfolio && (
                <MultiCurrencyPortfolio
                  portfolio={portfolio}
                  holdings={portfolioHoldings}
                  instruments={instruments || []}
                  currencyAccounts={clientCurrencyAccounts}
                />
              )}
              
              {clientStatements.filter(s => s.status === 'COMPLETED').length > 0 && (
                <MultiCurrencySpendingComparison statements={clientStatements} />
              )}
            </TabsContent>

            <TabsContent value="budgets" className="mt-6">
              <RegionalBudgets
                userId={clientId}
                regionalBudgets={clientBudgets}
                bankStatements={clientStatements}
                onCreateBudget={handleCreateRegionalBudget}
                onUpdateBudget={handleUpdateRegionalBudget}
                onDeleteBudget={handleDeleteRegionalBudget}
              />
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
                              <p className="font-semibold text-lg">{formatCurrency(goal.currentAmount, userCurrency.symbol)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Still Needed</p>
                              <p className="font-semibold text-lg text-warning">{formatCurrency(gap, userCurrency.symbol)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Target Date</p>
                              <p className="font-semibold">{new Date(goal.targetDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Monthly Saving</p>
                              <p className="font-semibold">{formatCurrency(goal.monthlyContribution, userCurrency.symbol)}</p>
                            </div>
                          </div>

                          {required > goal.monthlyContribution + 100 && (
                            <div className="bg-warning/10 border-2 border-warning/30 rounded-lg p-4 space-y-3">
                              <div>
                                <p className="font-semibold text-warning mb-1">💡 Recommendation</p>
                                <p className="text-sm">
                                  Consider increasing your monthly contribution by <strong>{formatCurrency(Math.floor(required - goal.monthlyContribution), userCurrency.symbol)}</strong> to stay on track for your target date.
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
                onDelete={handleDeleteStatement}
              />

              {clientStatements.filter(s => s.status === 'COMPLETED').length > 0 && (
                <BankStatementCopilot
                  clientId={clientId}
                  statements={clientStatements}
                  onSetGoal={() => setShowTemplateDialog(true)}
                />
              )}
              
              {clientStatements.filter(s => s.status === 'COMPLETED').length > 0 && (
                <CurrencySpendingTrends statements={clientStatements} />
              )}
              
              {clientStatements.filter(s => s.status === 'COMPLETED').length > 0 && (
                <GoalTrackingFromStatements
                  statements={clientStatements}
                  goals={clientGoals}
                  onUpdateGoal={handleUpdateGoalFromSpending}
                  onCreateGoal={() => setShowTemplateDialog(true)}
                />
              )}
              
              {clientStatements.filter(s => s.status === 'COMPLETED').length > 0 && (
                <MultiCurrencyReportExport
                  statements={clientStatements}
                  goals={clientGoals}
                />
              )}
              
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
        userAge={age ?? 0}
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
