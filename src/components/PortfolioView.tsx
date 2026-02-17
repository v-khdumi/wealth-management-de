import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Sparkle, TrendUp, TrendDown } from '@phosphor-icons/react'
import { useDataStore } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import {
  calculatePortfolioAllocations,
  getRecommendedModel,
  calculateDrift,
} from '@/lib/business-logic'
import { generatePortfolioExplanation, createAiInteractionRecord } from '@/lib/ai-service'
import { toast } from 'sonner'
import type { AssetClass } from '@/lib/types'

interface PortfolioViewProps {
  clientId: string
}

const ASSET_CLASS_COLORS: Record<AssetClass, string> = {
  EQUITY: '#3b82f6',
  FIXED_INCOME: '#10b981',
  CASH: '#6b7280',
  ALTERNATIVE: '#f59e0b',
  REAL_ESTATE: '#8b5cf6',
}

export function PortfolioView({ clientId }: PortfolioViewProps) {
  const { currentUser } = useAuth()
  const {
    users,
    portfolios,
    holdings,
    instruments,
    riskProfiles,
    modelPortfolios,
    setAiInteractions,
  } = useDataStore()

  const [isExplaining, setIsExplaining] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)

  const client = useMemo(() => (users || []).find(u => u.id === clientId), [users, clientId])
  const portfolio = useMemo(() => (portfolios || []).find(p => p.clientId === clientId), [portfolios, clientId])
  const riskProfile = useMemo(() => (riskProfiles || []).find(rp => rp.clientId === clientId), [riskProfiles, clientId])
  const portfolioHoldings = useMemo(() => (holdings || []).filter(h => h.portfolioId === portfolio?.id), [holdings, portfolio])

  const allocations = useMemo(() => {
    if (!portfolio) return []
    return calculatePortfolioAllocations(portfolioHoldings, instruments || [], portfolio)
  }, [portfolio, portfolioHoldings, instruments])

  const recommendedModel = useMemo(() => {
    if (!riskProfile) return null
    return getRecommendedModel(riskProfile.score, modelPortfolios || [])
  }, [riskProfile, modelPortfolios])

  const drift = useMemo(() => {
    if (!recommendedModel) return 0
    return calculateDrift(allocations, recommendedModel)
  }, [allocations, recommendedModel])

  const chartData = allocations.map(a => ({
    name: a.assetClass.replace('_', ' '),
    value: a.value,
    percentage: a.percentage,
  }))

  const handleExplainPortfolio = async () => {
    if (!currentUser || !client || !riskProfile || !portfolio) return

    setIsExplaining(true)
    try {
      const response = await generatePortfolioExplanation(
        client,
        riskProfile,
        portfolio,
        portfolioHoldings,
        instruments || [],
        modelPortfolios || []
      )

      const interaction = createAiInteractionRecord(
        currentUser.id,
        clientId,
        'portfolio-explain',
        'Explain my portfolio',
        response
      )

      setAiInteractions((current) => [...(current || []), interaction])
      setExplanation(response.content)
      
      toast.success('Portfolio Explanation Generated')
    } catch (error) {
      toast.error('Failed to generate explanation')
    } finally {
      setIsExplaining(false)
    }
  }

  if (!portfolio || !client) {
    return <div>Portfolio not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Portfolio Overview</h2>
          <p className="text-muted-foreground">
            Total Value: <span className="font-bold kpi-number text-lg">${portfolio.totalValue.toLocaleString()}</span>
          </p>
        </div>
        <Button onClick={handleExplainPortfolio} disabled={isExplaining} className="gap-2">
          <Sparkle size={20} weight={isExplaining ? 'fill' : 'duotone'} />
          {isExplaining ? 'Generating...' : 'Explain My Portfolio'}
        </Button>
      </div>

      {explanation && (
        <Card className="border-accent bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Sparkle size={24} weight="fill" />
              AI Portfolio Explanation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{explanation}</p>
          </CardContent>
        </Card>
      )}

      {recommendedModel && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Model Portfolio</CardTitle>
            <CardDescription>
              Based on risk score {riskProfile?.score}/10 ({riskProfile?.category})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-lg">{recommendedModel.name}</p>
                <p className="text-sm text-muted-foreground">{recommendedModel.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Drift from Target</p>
                <p className={`font-bold kpi-number text-2xl ${drift > 8 ? 'text-destructive' : 'text-accent'}`}>
                  {drift.toFixed(1)}%
                </p>
              </div>
            </div>
            {drift > 8 && (
              <div className="bg-destructive/10 border border-destructive/30 rounded p-3">
                <p className="text-destructive font-medium text-sm">
                  Portfolio has drifted significantly from target allocation. Consider rebalancing.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ percentage }) => `${percentage.toFixed(1)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={ASSET_CLASS_COLORS[allocations[index].assetClass]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Allocation Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allocations.map(allocation => (
                <div key={allocation.assetClass}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">
                      {allocation.assetClass.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-semibold">
                      {allocation.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${allocation.percentage}%`,
                          backgroundColor: ASSET_CLASS_COLORS[allocation.assetClass],
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-24 text-right">
                      ${allocation.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
          <CardDescription>
            {portfolioHoldings.length} position{portfolioHoldings.length !== 1 ? 's' : ''} + cash
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Avg Cost</TableHead>
                <TableHead className="text-right">Current Price</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Gain/Loss</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolioHoldings.map(holding => {
                const instrument = (instruments || []).find(i => i.id === holding.instrumentId)
                if (!instrument) return null

                const currentValue = holding.quantity * instrument.currentPrice
                const costBasis = holding.quantity * holding.averageCost
                const gainLoss = currentValue - costBasis
                const gainLossPercent = (gainLoss / costBasis) * 100

                return (
                  <TableRow key={holding.id}>
                    <TableCell className="font-bold">{instrument.symbol}</TableCell>
                    <TableCell>{instrument.name}</TableCell>
                    <TableCell className="text-right">{holding.quantity}</TableCell>
                    <TableCell className="text-right">${holding.averageCost.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${instrument.currentPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ${currentValue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={`flex items-center justify-end gap-1 ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {gainLoss >= 0 ? <TrendUp size={16} /> : <TrendDown size={16} />}
                        <span className="font-semibold">
                          ${Math.abs(gainLoss).toLocaleString()} ({gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={5}>Cash</TableCell>
                <TableCell className="text-right">${portfolio.cash.toLocaleString()}</TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow className="bg-primary/10 font-bold">
                <TableCell colSpan={5}>Total Portfolio Value</TableCell>
                <TableCell className="text-right kpi-number">${portfolio.totalValue.toLocaleString()}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
