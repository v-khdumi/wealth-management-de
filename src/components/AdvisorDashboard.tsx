import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  ChartLine,
  Users,
  Warning,
  ClockCounterClockwise,
  TrendUp,
  ArrowRight,
} from '@phosphor-icons/react'
import { useDataStore } from '@/lib/data-store'
import { useAuth } from '@/lib/auth-context'
import { generateNextBestActions } from '@/lib/business-logic'
import type { NextBestAction } from '@/lib/types'

interface AdvisorDashboardProps {
  onClientSelect: (clientId: string) => void
}

export function AdvisorDashboard({ onClientSelect }: AdvisorDashboardProps) {
  const { currentUser } = useAuth()
  const {
    users,
    clientProfiles,
    portfolios,
    holdings,
    instruments,
    riskProfiles,
    goals,
    modelPortfolios,
  } = useDataStore()

  const advisorClients = useMemo(() => {
    if (!currentUser) return []
    return (users || []).filter(u => u.role === 'CLIENT' && u.advisorId === currentUser.id)
  }, [users, currentUser])

  const totalAUM = useMemo(() => {
    return advisorClients.reduce((sum, client) => {
      const portfolio = (portfolios || []).find(p => p.clientId === client.id)
      return sum + (portfolio?.totalValue || 0)
    }, 0)
  }, [advisorClients, portfolios])

  const allActions = useMemo(() => {
    const actions: NextBestAction[] = []
    advisorClients.forEach(client => {
      const portfolio = (portfolios || []).find(p => p.clientId === client.id)
      const clientHoldings = (holdings || []).filter(h => h.portfolioId === portfolio?.id)
      const riskProfile = (riskProfiles || []).find(rp => rp.clientId === client.id)
      const clientGoals = (goals || []).filter(g => g.clientId === client.id)

      if (portfolio && riskProfile) {
        const clientActions = generateNextBestActions(
          client.id,
          portfolio,
          clientHoldings,
          instruments || [],
          riskProfile,
          clientGoals,
          modelPortfolios || []
        )
        actions.push(...clientActions)
      }
    })
    return actions.sort((a, b) => {
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [advisorClients, portfolios, holdings, instruments, riskProfiles, goals, modelPortfolios])

  const highPriorityCount = allActions.filter(a => a.priority === 'HIGH').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-display font-bold text-primary mb-2">
          Advisor Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {currentUser?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total AUM</CardTitle>
            <ChartLine className="text-muted-foreground" size={20} />
          </CardHeader>
          <CardContent>
            <div className="kpi-number text-3xl text-primary">
              ${(totalAUM / 1000000).toFixed(2)}M
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {advisorClients.length} clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="text-muted-foreground" size={20} />
          </CardHeader>
          <CardContent>
            <div className="kpi-number text-3xl text-primary">
              {advisorClients.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All segments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <Warning className="text-destructive" size={20} weight="fill" />
          </CardHeader>
          <CardContent>
            <div className="kpi-number text-3xl text-destructive">
              {highPriorityCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              High priority actions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
            <TrendUp className="text-accent" size={20} />
          </CardHeader>
          <CardContent>
            <div className="kpi-number text-3xl text-accent">
              {allActions.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Next best actions
            </p>
          </CardContent>
        </Card>
      </div>

      {allActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockCounterClockwise size={24} />
              Next Best Actions
            </CardTitle>
            <CardDescription>
              Recommended actions to add value for your clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allActions.slice(0, 5).map(action => {
                const client = (users || []).find(u => u.id === action.clientId)
                return (
                  <div
                    key={action.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={
                            action.priority === 'HIGH'
                              ? 'destructive'
                              : action.priority === 'MEDIUM'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {action.priority}
                        </Badge>
                        <span className="font-medium">{client?.name}</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{action.title}</p>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onClientSelect(action.clientId)}
                    >
                      <ArrowRight size={20} />
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>
            Click on a client to view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input placeholder="Search clients..." />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Risk Profile</TableHead>
                <TableHead className="text-right">AUM</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advisorClients.map(client => {
                const profile = (clientProfiles || []).find(cp => cp.userId === client.id)
                const riskProfile = (riskProfiles || []).find(rp => rp.clientId === client.id)
                const portfolio = (portfolios || []).find(p => p.clientId === client.id)
                
                return (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onClientSelect(client.id)}
                  >
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{profile?.segment}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {riskProfile?.category} ({riskProfile?.score}/10)
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${portfolio?.totalValue.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <ArrowRight size={20} />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
