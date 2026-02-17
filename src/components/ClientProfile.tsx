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
  ArrowsLeftRight,
  Sparkle,
  ClockCounterClockwise,
  Warning,
} from '@phosphor-icons/react'
import { useDataStore } from '@/lib/data-store'
import { isRiskProfileStale, calculateGoalGap, calculateRequiredMonthlyContribution } from '@/lib/business-logic'
import { PortfolioView } from './PortfolioView'
import { OrdersView } from './OrdersView'
import { toast } from 'sonner'
import { generateAdvisorBrief, createAiInteractionRecord } from '@/lib/ai-service'
import { useAuth } from '@/lib/auth-context'
import type { User, ClientProfile as ClientProfileType, RiskProfile, Goal, Portfolio } from '@/lib/types'

interface ClientProfileProps {
  clientId: string
  onBack?: () => void
}

export function ClientProfile({ clientId, onBack }: ClientProfileProps) {
  const { currentUser } = useAuth()
  const {
    users,
    clientProfiles,
    riskProfiles,
    goals,
    portfolios,
    setAiInteractions,
    setAuditEvents,
    auditEvents,
    aiInteractions,
  } = useDataStore()

  const [activeTab, setActiveTab] = useState('profile')
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false)

  const client = useMemo(() => (users || []).find(u => u.id === clientId), [users, clientId])
  const profile = useMemo(() => (clientProfiles || []).find(cp => cp.userId === clientId), [clientProfiles, clientId])
  const riskProfile = useMemo(() => (riskProfiles || []).find(rp => rp.clientId === clientId), [riskProfiles, clientId])
  const clientGoals = useMemo(() => (goals || []).filter(g => g.clientId === clientId), [goals, clientId])
  const portfolio = useMemo(() => (portfolios || []).find(p => p.clientId === clientId), [portfolios, clientId])
  const clientAuditEvents = useMemo(() => (auditEvents || []).filter(e => e.clientId === clientId).slice(0, 10), [auditEvents, clientId])
  const clientAiInteractions = useMemo(() => (aiInteractions || []).filter(i => i.clientId === clientId).slice(0, 5), [aiInteractions, clientId])

  if (!client || !profile || !riskProfile || !portfolio) {
    return <div>Client not found</div>
  }

  const age = Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  const riskStale = isRiskProfileStale(riskProfile)

  const handleExplainClient = async () => {
    if (!currentUser) return
    
    setIsGeneratingBrief(true)
    try {
      const response = await generateAdvisorBrief(
        'Provide a concise briefing about this client for an advisor',
        client,
        profile,
        riskProfile,
        portfolio,
        clientGoals
      )

      const interaction = createAiInteractionRecord(
        currentUser.id,
        clientId,
        'advisor-brief',
        'Explain this client',
        response
      )

      setAiInteractions((current) => [...(current || []), interaction])
      
      toast.success('AI Briefing Generated', {
        description: 'Check the AI panel for insights',
      })
    } catch (error) {
      toast.error('Failed to generate briefing')
    } finally {
      setIsGeneratingBrief(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="mb-2">
              ← Back
            </Button>
          )}
          <h1 className="text-4xl font-display font-bold text-primary">
            {client.name}
          </h1>
          <p className="text-muted-foreground">{profile.segment}</p>
        </div>
        {currentUser?.role === 'ADVISOR' && (
          <Button onClick={handleExplainClient} disabled={isGeneratingBrief} className="gap-2">
            <Sparkle size={20} weight={isGeneratingBrief ? 'fill' : 'duotone'} />
            {isGeneratingBrief ? 'Generating...' : 'Explain This Client'}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <UserIcon size={16} />
            Profile
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="gap-2">
            <ChartLine size={16} />
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ArrowsLeftRight size={16} />
            Orders
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <ClockCounterClockwise size={16} />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon size={24} />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{profile.address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Onboarding Date</p>
                  <p className="font-medium">{new Date(profile.onboardingDate).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck size={24} />
                  Risk Profile
                  {riskStale && (
                    <Badge variant="destructive" className="gap-1">
                      <Warning size={14} weight="fill" />
                      Stale
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Risk Score</span>
                    <span className="font-bold kpi-number text-xl">{riskProfile.score}/10</span>
                  </div>
                  <Progress value={riskProfile.score * 10} className="h-2" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <Badge variant="outline" className="mt-1">{riskProfile.category}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {new Date(riskProfile.lastUpdated).toLocaleDateString()}
                    {riskStale && (
                      <span className="text-destructive text-xs ml-2">
                        (Over 180 days old)
                      </span>
                    )}
                  </p>
                </div>
                {riskStale && (
                  <Button variant="outline" size="sm" className="w-full">
                    Refresh Risk Profile
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target size={24} />
                Financial Goals
              </CardTitle>
              <CardDescription>
                Track progress toward major life objectives
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {clientGoals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No goals defined yet</p>
              ) : (
                clientGoals.map(goal => {
                  const gap = calculateGoalGap(goal)
                  const required = calculateRequiredMonthlyContribution(goal)
                  const progress = (goal.currentAmount / goal.targetAmount) * 100

                  return (
                    <div key={goal.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-lg">{goal.name}</p>
                          <Badge variant="secondary">{goal.type}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Target</p>
                          <p className="font-bold kpi-number">${goal.targetAmount.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span className="font-medium">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Current Amount</p>
                          <p className="font-semibold">${goal.currentAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Gap</p>
                          <p className="font-semibold text-destructive">${gap.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Target Date</p>
                          <p className="font-semibold">{new Date(goal.targetDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Monthly Contribution</p>
                          <p className="font-semibold">${goal.monthlyContribution.toLocaleString()}</p>
                        </div>
                      </div>

                      {required > goal.monthlyContribution + 100 && (
                        <div className="bg-destructive/10 border border-destructive/30 rounded p-3 text-sm">
                          <p className="text-destructive font-medium">
                            Recommended increase: ${Math.floor(required - goal.monthlyContribution).toLocaleString()}/month to stay on track
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="mt-6">
          <PortfolioView clientId={clientId} />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <OrdersView clientId={clientId} />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>Complete history of activities and AI interactions</CardDescription>
            </CardHeader>
            <CardContent>
              {clientAiInteractions.length === 0 && clientAuditEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No audit events yet</p>
              ) : (
                <div className="space-y-3">
                  {clientAiInteractions.map(interaction => (
                    <div key={interaction.id} className="p-4 border-l-4 border-accent bg-accent/5 rounded">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Sparkle size={16} className="text-accent" weight="fill" />
                          <span className="font-semibold">AI Interaction</span>
                          {interaction.offlineMode && (
                            <Badge variant="secondary" className="text-xs">Offline</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(interaction.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Endpoint: {interaction.endpoint}</p>
                      <details className="text-sm">
                        <summary className="cursor-pointer text-accent font-medium">View Details</summary>
                        <div className="mt-2 space-y-2 pl-4">
                          <div>
                            <p className="font-medium">Prompt:</p>
                            <p className="text-muted-foreground">{interaction.prompt}</p>
                          </div>
                          <div>
                            <p className="font-medium">Response:</p>
                            <p className="text-muted-foreground whitespace-pre-wrap">{interaction.response}</p>
                          </div>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
