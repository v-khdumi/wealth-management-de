import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Alert, AlertDescription } from './ui/alert'
import {
  Warning,
  X,
  Plus,
  TrendUp,
  Bell,
  BellRinging,
  CheckCircle,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { BankStatement, CategoryBudget, SpendingAlert } from '@/lib/types'

interface SpendingAlertsPanelProps {
  userId: string
  statements: BankStatement[]
  budgets: CategoryBudget[]
  alerts: SpendingAlert[]
  onSetBudget: (category: string, limit: number, threshold: number) => void
  onDismissAlert: (alertId: string) => void
}

export function SpendingAlertsPanel({
  userId,
  statements,
  budgets,
  alerts,
  onSetBudget,
  onDismissAlert,
}: SpendingAlertsPanelProps) {
  const [showBudgetDialog, setShowBudgetDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [budgetLimit, setBudgetLimit] = useState('')
  const [alertThreshold, setAlertThreshold] = useState('80')

  const completedStatements = useMemo(() => 
    statements.filter(s => s.status === 'COMPLETED' && s.extractedData),
    [statements]
  )

  const allCategories = useMemo(() => {
    const categorySet = new Set<string>()
    completedStatements.forEach(s => {
      s.extractedData?.categorySummary?.forEach(cat => {
        categorySet.add(cat.category)
      })
    })
    return Array.from(categorySet).sort()
  }, [completedStatements])

  const currentMonthSpending = useMemo(() => {
    const categorySpending = new Map<string, number>()
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    completedStatements.forEach(s => {
      if (!s.extractedData?.statementDate) return
      
      const stmtDate = new Date(s.extractedData.statementDate)
      if (stmtDate.getMonth() === currentMonth && stmtDate.getFullYear() === currentYear) {
        s.extractedData.categorySummary?.forEach(cat => {
          categorySpending.set(cat.category, (categorySpending.get(cat.category) || 0) + cat.amount)
        })
      }
    })

    return categorySpending
  }, [completedStatements])

  const activeAlerts = useMemo(() => 
    alerts.filter(a => !a.dismissed && a.userId === userId),
    [alerts, userId]
  )

  const handleSetBudget = () => {
    const limit = parseFloat(budgetLimit)
    const threshold = parseFloat(alertThreshold)

    if (!selectedCategory || isNaN(limit) || limit <= 0) {
      toast.error('Invalid budget', {
        description: 'Please select a category and enter a valid budget amount'
      })
      return
    }

    if (isNaN(threshold) || threshold < 0 || threshold > 100) {
      toast.error('Invalid threshold', {
        description: 'Alert threshold must be between 0 and 100'
      })
      return
    }

    onSetBudget(selectedCategory, limit, threshold)
    setShowBudgetDialog(false)
    setSelectedCategory('')
    setBudgetLimit('')
    setAlertThreshold('80')
    
    toast.success('Budget set successfully', {
      description: `Alert will trigger at ${threshold}% of $${limit.toLocaleString()}`
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BellRinging size={24} className="text-warning" />
              Spending Alerts
            </CardTitle>
            <CardDescription>Monitor category spending against your budgets</CardDescription>
          </div>
          <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus size={16} />
                Set Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Category Budget</DialogTitle>
                <DialogDescription>
                  Set a monthly spending limit and alert threshold for a category
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">Select a category...</option>
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="limit">Monthly Budget Limit ($)</Label>
                  <Input
                    id="limit"
                    type="number"
                    placeholder="1000"
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="threshold">Alert Threshold (%)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    placeholder="80"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value)}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground">
                    You'll be alerted when spending reaches this percentage of your budget
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowBudgetDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSetBudget}>Set Budget</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeAlerts.length === 0 && budgets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bell size={48} className="mx-auto mb-3 opacity-50" />
              <p className="font-medium">No budgets set</p>
              <p className="text-sm mt-1">Set category budgets to track spending and receive alerts</p>
            </div>
          )}

          {activeAlerts.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Warning size={18} className="text-destructive" />
                Active Alerts ({activeAlerts.length})
              </h4>
              {activeAlerts.map(alert => (
                <Alert key={alert.id} variant={alert.severity === 'CRITICAL' ? 'destructive' : 'default'}
                  className="relative pr-12">
                  <AlertDescription>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold mb-1">{alert.category}</p>
                        <p className="text-sm">
                          Spent <span className="font-semibold">${alert.currentSpending.toLocaleString()}</span>
                          {' '}of ${alert.budgetLimit.toLocaleString()} budget
                          <Badge variant={alert.severity === 'CRITICAL' ? 'destructive' : 'secondary'} className="ml-2">
                            {alert.percentage.toFixed(0)}%
                          </Badge>
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => onDismissAlert(alert.id)}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {budgets.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Active Budgets</h4>
              <div className="grid gap-3">
                {budgets.map(budget => {
                  const currentSpending = currentMonthSpending.get(budget.category) || 0
                  const percentage = (currentSpending / budget.monthlyLimit) * 100
                  const isWarning = percentage >= budget.alertThreshold
                  const isCritical = percentage >= 100

                  return (
                    <Card key={budget.category} className={isWarning ? 'border-warning' : ''}>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{budget.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">
                                ${currentSpending.toLocaleString()} / ${budget.monthlyLimit.toLocaleString()}
                              </span>
                              {isWarning && (
                                <Badge variant={isCritical ? 'destructive' : 'secondary'}>
                                  {percentage.toFixed(0)}%
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                isCritical ? 'bg-destructive' :
                                isWarning ? 'bg-warning' :
                                'bg-primary'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Alert threshold: {budget.alertThreshold}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
