import { useState, useMemo, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sparkle,
  PaperPlaneTilt,
  TrendUp,
  TrendDown,
  ShieldCheck,
  ChartPie,
  CurrencyCircleDollar,
  Warning,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  FileText,
  Robot,
} from '@phosphor-icons/react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { toast } from 'sonner'
import type { BankStatement } from '@/lib/types'
import {
  generateBankStatementInsight,
  generateBankStatementNextActions,
  createAiInteractionRecord,
  type BankStatementNextAction,
} from '@/lib/ai-service'
import { useDataStore } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'

interface BankStatementCopilotProps {
  clientId: string
  statements: BankStatement[]
  onSetGoal?: () => void
  defaultView?: 'copilot' | 'actions' | 'analytics'
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  timestamp: string
  offlineMode?: boolean
}

const CHART_COLORS = [
  'oklch(0.55 0.22 155)',
  'oklch(0.60 0.18 195)',
  'oklch(0.50 0.15 240)',
  'oklch(0.65 0.18 75)',
  'oklch(0.55 0.20 25)',
  'oklch(0.60 0.12 300)',
  'oklch(0.50 0.10 180)',
  'oklch(0.70 0.15 120)',
]

const ACTION_ICONS: Record<BankStatementNextAction['type'], React.ReactNode> = {
  RISK_REFRESH: <ShieldCheck size={20} weight="duotone" />,
  REBALANCE: <ChartPie size={20} weight="duotone" />,
  LIQUIDITY: <CurrencyCircleDollar size={20} weight="duotone" />,
  SAVINGS: <TrendUp size={20} weight="duotone" />,
  SPENDING: <TrendDown size={20} weight="duotone" />,
}

const ACTION_COLORS: Record<BankStatementNextAction['priority'], string> = {
  HIGH: 'text-destructive',
  MEDIUM: 'text-warning',
  LOW: 'text-primary',
}

const PRIORITY_BG: Record<BankStatementNextAction['priority'], string> = {
  HIGH: 'border-destructive/30 bg-destructive/5',
  MEDIUM: 'border-warning/30 bg-warning/5',
  LOW: 'border-primary/30 bg-primary/5',
}

const QUICK_PROMPTS = [
  'What are my biggest expenses?',
  'How is my savings rate?',
  'Where can I cut spending?',
  'Am I meeting my financial goals?',
  'What does my income look like?',
  'How do my expenses break down?',
]

export function BankStatementCopilot({ clientId, statements, onSetGoal, defaultView = 'copilot' }: BankStatementCopilotProps) {
  const { currentUser } = useAuth()
  const { setAiInteractions } = useDataStore()

  const [activeView, setActiveView] = useState<'copilot' | 'actions' | 'analytics'>(defaultView)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const completedStatements = useMemo(
    () => statements.filter(s => s.status === 'COMPLETED' && s.extractedData),
    [statements]
  )

  const hasData = completedStatements.length > 0

  const financialSummary = useMemo(() => {
    if (!hasData) return null
    const totalIncome = completedStatements.reduce((s, st) => s + (st.extractedData?.totalIncome || 0), 0)
    const totalExpenses = completedStatements.reduce((s, st) => s + (st.extractedData?.totalExpenses || 0), 0)
    const netSavings = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0
    const currency = completedStatements[0].extractedData?.currency || 'USD'
    const currencySymbol = completedStatements[0].extractedData?.currencySymbol || '$'
    return { totalIncome, totalExpenses, netSavings, savingsRate, currency, currencySymbol }
  }, [completedStatements, hasData])

  const categoryData = useMemo(() => {
    if (!hasData) return []
    const totals: Record<string, number> = {}
    for (const s of completedStatements) {
      for (const cat of s.extractedData?.categorySummary || []) {
        totals[cat.category] = (totals[cat.category] || 0) + cat.amount
      }
    }
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value: Math.round(value) }))
  }, [completedStatements, hasData])

  const monthlyData = useMemo(() => {
    if (!hasData) return []
    return completedStatements
      .map(s => ({
        month: s.extractedData?.statementDate
          ? new Date(s.extractedData.statementDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          : new Date(s.uploadedAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        income: Math.round(s.extractedData?.totalIncome || 0),
        expenses: Math.round(s.extractedData?.totalExpenses || 0),
        savings: Math.round((s.extractedData?.totalIncome || 0) - (s.extractedData?.totalExpenses || 0)),
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [completedStatements, hasData])

  const nextActions = useMemo(
    () => generateBankStatementNextActions(statements),
    [statements]
  )

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (text?: string) => {
    const q = (text || input).trim()
    if (!q || isLoading) return

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: q,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const response = await generateBankStatementInsight(
        q,
        currentUser?.name || 'User',
        statements
      )

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response.content,
        sources: response.sources,
        timestamp: new Date().toISOString(),
        offlineMode: response.offlineMode,
      }
      setMessages(prev => [...prev, assistantMsg])

      if (currentUser) {
        const record = createAiInteractionRecord(
          currentUser.id,
          clientId,
          'bank-statement-copilot',
          q,
          response
        )
        setAiInteractions(current => [...(current || []), record])
      }
    } catch {
      toast.error('Could not get a response. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fmt = (n: number) =>
    financialSummary
      ? `${financialSummary.currencySymbol}${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      : n.toLocaleString()

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {financialSummary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-success/20 bg-gradient-to-br from-success/5 to-transparent">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendUp size={14} className="text-success" />
                Total Income
              </div>
              <p className="text-2xl font-bold text-success">{fmt(financialSummary.totalIncome)}</p>
              <p className="text-xs text-muted-foreground mt-1">{completedStatements.length} statement(s)</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendDown size={14} className="text-destructive" />
                Total Expenses
              </div>
              <p className="text-2xl font-bold text-destructive">{fmt(financialSummary.totalExpenses)}</p>
              <p className="text-xs text-muted-foreground mt-1">Across all categories</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <CurrencyCircleDollar size={14} className="text-primary" />
                Net Savings
              </div>
              <p className={`text-2xl font-bold ${financialSummary.netSavings >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {fmt(financialSummary.netSavings)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{financialSummary.currency}</p>
            </CardContent>
          </Card>
          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <ChartPie size={14} className="text-accent" />
                Savings Rate
              </div>
              <p className={`text-2xl font-bold ${financialSummary.savingsRate >= 20 ? 'text-success' : financialSummary.savingsRate >= 10 ? 'text-warning' : 'text-destructive'}`}>
                {financialSummary.savingsRate.toFixed(1)}%
              </p>
              <div className="mt-1">
                <Progress value={Math.min(financialSummary.savingsRate, 100)} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'copilot' as const, label: 'AI Copilot', icon: <Robot size={16} /> },
          { id: 'actions' as const, label: `Next Best Actions ${nextActions.length > 0 ? `(${nextActions.length})` : ''}`, icon: <Lightbulb size={16} /> },
          { id: 'analytics' as const, label: 'Analytics', icon: <ChartPie size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* AI Copilot View */}
      {activeView === 'copilot' && (
        <Card className="ai-glow">
          <CardHeader className="border-b bg-gradient-to-r from-accent/5 to-primary/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-accent">
              <Sparkle size={22} weight="duotone" />
              AI Financial Copilot
            </CardTitle>
            <CardDescription>
              {hasData
                ? `Ask me anything about your finances — I'm grounded in your ${completedStatements.length} uploaded statement(s)`
                : 'Upload bank statements first to enable AI-powered Q&A on your real financial data'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Quick prompts */}
            {hasData && (
              <div className="p-4 border-b bg-muted/20">
                <p className="text-xs font-medium text-muted-foreground mb-2">Quick Questions</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((p, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 rounded-full"
                      onClick={() => sendMessage(p)}
                      disabled={isLoading}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat History */}
            <div ref={scrollRef} className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <Sparkle size={40} weight="duotone" className="text-accent/30 mb-3" />
                  <p className="font-medium mb-1">
                    {hasData ? 'Ask me about your finances!' : 'No statement data yet'}
                  </p>
                  <p className="text-sm">
                    {hasData
                      ? 'I can answer questions about your income, expenses, savings, and spending patterns.'
                      : 'Upload your bank statements to unlock AI-powered financial insights.'}
                  </p>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id}>
                    {msg.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className="bg-primary/10 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                          <p className="text-sm font-medium">{msg.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-start">
                        <div className="bg-accent/10 border border-accent/20 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%]">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkle size={14} weight="fill" className="text-accent" />
                            <span className="text-xs font-semibold text-accent">AI Copilot</span>
                            {msg.offlineMode && <Badge variant="secondary" className="text-xs py-0">Offline</Badge>}
                          </div>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-accent/20">
                              <p className="text-xs text-muted-foreground font-medium mb-1">Sources:</p>
                              {msg.sources.map((src, i) => (
                                <p key={i} className="text-xs text-muted-foreground">• {src}</p>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            Not financial advice. Based on your uploaded data.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-accent/10 border border-accent/20 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Sparkle size={14} weight="fill" className="text-accent animate-pulse" />
                      <span className="text-sm text-muted-foreground">Analyzing your data...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t space-y-2">
              <Textarea
                placeholder={hasData ? 'Ask about your income, expenses, savings...' : 'Upload statements to enable AI Q&A...'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                className="min-h-16 resize-none"
                disabled={isLoading || !hasData}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim() || !hasData}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <Sparkle size={16} weight="fill" className="animate-pulse" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <PaperPlaneTilt size={16} weight="duotone" />
                    Ask Question
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Best Actions View */}
      {activeView === 'actions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Next Best Actions</h3>
              <p className="text-sm text-muted-foreground">
                {hasData
                  ? `${nextActions.length} personalized recommendations based on your bank statements`
                  : 'Upload bank statements to receive personalized action recommendations'}
              </p>
            </div>
            {nextActions.filter(a => a.priority === 'HIGH').length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <Warning size={12} weight="fill" />
                {nextActions.filter(a => a.priority === 'HIGH').length} Urgent
              </Badge>
            )}
          </div>

          {!hasData ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <FileText size={48} className="mx-auto mb-4 text-muted-foreground/30" weight="duotone" />
                <p className="font-medium text-muted-foreground mb-2">No data available yet</p>
                <p className="text-sm text-muted-foreground">
                  Upload your bank statements to get personalized next best actions.
                </p>
              </CardContent>
            </Card>
          ) : nextActions.length === 0 ? (
            <Card className="border-success/30 bg-success/5">
              <CardContent className="py-8 text-center">
                <CheckCircle size={48} className="mx-auto mb-4 text-success" weight="duotone" />
                <p className="font-semibold text-success mb-1">Great financial health!</p>
                <p className="text-sm text-muted-foreground">
                  Your finances look solid. Keep maintaining your savings rate and spending habits.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {nextActions.map(action => (
                <Card key={action.id} className={`border-2 transition-all hover:shadow-md ${PRIORITY_BG[action.priority]}`}>
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-xl bg-background border ${ACTION_COLORS[action.priority]}`}>
                        {ACTION_ICONS[action.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h4 className="font-semibold text-foreground">{action.title}</h4>
                            <Badge
                              variant="outline"
                              className={`text-xs mt-1 ${ACTION_COLORS[action.priority]}`}
                            >
                              {action.priority} Priority
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{action.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/70 rounded-lg px-3 py-2 mb-3">
                          <TrendUp size={14} className="text-success shrink-0" />
                          <span>{action.impact}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => {
                            if (action.type === 'SAVINGS' || action.type === 'LIQUIDITY') {
                              onSetGoal?.()
                            } else {
                              toast.info(action.actionLabel, {
                                description: 'This action is available in the full platform.',
                              })
                            }
                          }}
                        >
                          {action.actionLabel}
                          <ArrowRight size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics View */}
      {activeView === 'analytics' && (
        <div className="space-y-6">
          {!hasData ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <ChartPie size={48} className="mx-auto mb-4 text-muted-foreground/30" weight="duotone" />
                <p className="font-medium text-muted-foreground mb-2">No analytics available</p>
                <p className="text-sm text-muted-foreground">
                  Upload your bank statements to see spending analytics and charts.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Monthly Income vs Expenses */}
              {monthlyData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Monthly Income vs Expenses</CardTitle>
                    <CardDescription>
                      {financialSummary?.currency} — across {completedStatements.length} statement(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${financialSummary?.currencySymbol}${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                          formatter={(value: number) => [`${financialSummary?.currencySymbol}${value.toLocaleString()}`, '']}
                        />
                        <Legend />
                        <Bar dataKey="income" fill="oklch(0.55 0.22 155)" name="Income" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" fill="oklch(0.55 0.22 25)" name="Expenses" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="savings" fill="oklch(0.60 0.18 195)" name="Savings" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Spending Breakdown */}
              {categoryData.length > 0 && (
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Spending by Category</CardTitle>
                      <CardDescription>Donut chart of your expense breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={categoryData.slice(0, 8)}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            dataKey="value"
                            paddingAngle={2}
                          >
                            {categoryData.slice(0, 8).map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => [`${financialSummary?.currencySymbol}${value.toLocaleString()}`, 'Amount']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Category Breakdown</CardTitle>
                      <CardDescription>Top spending categories by amount</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {categoryData.slice(0, 8).map((cat, i) => {
                          const total = categoryData.reduce((s, c) => s + c.value, 0)
                          const pct = total > 0 ? (cat.value / total) * 100 : 0
                          return (
                            <div key={cat.name} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="inline-block w-3 h-3 rounded-full shrink-0"
                                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                                  />
                                  <span className="font-medium truncate max-w-28">{cat.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{financialSummary?.currencySymbol}{cat.value.toLocaleString()}</span>
                                  <span className="text-muted-foreground/60">{pct.toFixed(0)}%</span>
                                </div>
                              </div>
                              <Progress value={pct} className="h-1.5" />
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Savings Rate Gauge */}
              {financialSummary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Financial Health Summary</CardTitle>
                    <CardDescription>Key metrics from your bank statements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-3 gap-6">
                      <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">Savings Rate</p>
                        <p className={`text-3xl font-bold ${financialSummary.savingsRate >= 20 ? 'text-success' : financialSummary.savingsRate >= 10 ? 'text-warning' : 'text-destructive'}`}>
                          {financialSummary.savingsRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {financialSummary.savingsRate >= 20 ? '✅ Excellent (≥20%)' : financialSummary.savingsRate >= 10 ? '⚠️ Good (10–20%)' : '❌ Low (<10%)'}
                        </p>
                      </div>
                      <div className="text-center space-y-2">
                        <Separator orientation="vertical" className="mx-auto h-auto hidden sm:block" />
                        <p className="text-sm text-muted-foreground">Expense Ratio</p>
                        <p className="text-3xl font-bold text-foreground">
                          {financialSummary.totalIncome > 0
                            ? ((financialSummary.totalExpenses / financialSummary.totalIncome) * 100).toFixed(0)
                            : 0}%
                        </p>
                        <p className="text-xs text-muted-foreground">of income spent</p>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">Net Balance</p>
                        <p className={`text-3xl font-bold ${financialSummary.netSavings >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {fmt(Math.abs(financialSummary.netSavings))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {financialSummary.netSavings >= 0 ? 'positive balance' : 'deficit'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
