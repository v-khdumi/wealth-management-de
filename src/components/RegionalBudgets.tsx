import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Progress } from './ui/progress'
import { ScrollArea } from './ui/scroll-area'
import {
  MapPin,
  Plus,
  Trash,
  Warning,
  CheckCircle,
  CurrencyCircleDollar,
  TrendUp,
  PencilSimple,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { RegionalBudget, BankStatement, CategoryBudget } from '@/lib/types'
import {
  formatCurrencyWithCode,
  getCurrencySymbol,
  getCurrencyName,
  CURRENCY_DATABASE,
} from '@/lib/currency-utils'

interface RegionalBudgetsProps {
  userId: string
  regionalBudgets: RegionalBudget[]
  bankStatements: BankStatement[]
  onCreateBudget: (budget: Omit<RegionalBudget, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdateBudget: (budgetId: string, budget: Partial<RegionalBudget>) => void
  onDeleteBudget: (budgetId: string) => void
}

const REGIONS = [
  'North America',
  'South America',
  'Europe',
  'Asia',
  'Middle East',
  'Africa',
  'Oceania',
  'Global',
]

const CATEGORIES = [
  'Housing',
  'Transportation',
  'Food & Dining',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Utilities',
  'Travel',
  'Education',
  'Savings',
  'Other',
]

export function RegionalBudgets({
  userId,
  regionalBudgets,
  bankStatements,
  onCreateBudget,
  onUpdateBudget,
  onDeleteBudget,
}: RegionalBudgetsProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingBudget, setEditingBudget] = useState<RegionalBudget | null>(null)
  const [newBudget, setNewBudget] = useState({
    region: '',
    currency: 'USD',
    monthlyTotal: 0,
    categories: [] as CategoryBudget[],
  })

  const budgetUtilization = useMemo(() => {
    const utilization: Record<string, { spent: number; budget: number; categories: Record<string, { spent: number; budget: number }> }> = {}

    regionalBudgets.forEach(budget => {
      const relevantStatements = bankStatements.filter(
        s => s.status === 'COMPLETED' && s.extractedData?.currency === budget.currency
      )

      let totalSpent = 0
      const categorySpent: Record<string, number> = {}

      relevantStatements.forEach(statement => {
        const monthlyExpenses = statement.extractedData?.totalExpenses || 0
        totalSpent += monthlyExpenses

        statement.extractedData?.categorySummary?.forEach(cat => {
          if (!categorySpent[cat.category]) {
            categorySpent[cat.category] = 0
          }
          categorySpent[cat.category] += cat.amount
        })
      })

      const categoryDetails: Record<string, { spent: number; budget: number }> = {}
      budget.categories.forEach(cat => {
        categoryDetails[cat.category] = {
          spent: categorySpent[cat.category] || 0,
          budget: cat.monthlyLimit,
        }
      })

      utilization[budget.id] = {
        spent: totalSpent,
        budget: budget.monthlyTotal,
        categories: categoryDetails,
      }
    })

    return utilization
  }, [regionalBudgets, bankStatements])

  const handleAddCategory = () => {
    setNewBudget(prev => ({
      ...prev,
      categories: [
        ...prev.categories,
        { category: CATEGORIES[0], monthlyLimit: 0, alertThreshold: 80 },
      ],
    }))
  }

  const handleUpdateCategory = (index: number, field: keyof CategoryBudget, value: string | number) => {
    setNewBudget(prev => ({
      ...prev,
      categories: prev.categories.map((cat, i) =>
        i === index ? { ...cat, [field]: value } : cat
      ),
    }))
  }

  const handleRemoveCategory = (index: number) => {
    setNewBudget(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index),
    }))
  }

  const handleCreateBudget = () => {
    if (!newBudget.region || newBudget.monthlyTotal <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    onCreateBudget({
      userId,
      region: newBudget.region,
      currency: newBudget.currency,
      monthlyTotal: newBudget.monthlyTotal,
      categories: newBudget.categories,
    })

    setNewBudget({
      region: '',
      currency: 'USD',
      monthlyTotal: 0,
      categories: [],
    })
    setIsCreating(false)
    toast.success('Regional budget created successfully')
  }

  const handleDeleteBudget = (budgetId: string, region: string) => {
    if (confirm(`Are you sure you want to delete the budget for ${region}?`)) {
      onDeleteBudget(budgetId)
      toast.success('Budget deleted')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin size={24} weight="duotone" className="text-primary" />
                Regional Budgets
              </CardTitle>
              <CardDescription>
                Manage budgets across different regions and currencies
              </CardDescription>
            </div>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={18} />
                  Create Budget
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Regional Budget</DialogTitle>
                  <DialogDescription>
                    Set spending limits for a specific region and currency
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <Select
                        value={newBudget.region}
                        onValueChange={(value) => setNewBudget(prev => ({ ...prev, region: value }))}
                      >
                        <SelectTrigger id="region">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          {REGIONS.map(region => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={newBudget.currency}
                        onValueChange={(value) => setNewBudget(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger id="currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CURRENCY_DATABASE).map(([code, info]) => (
                            <SelectItem key={code} value={code}>
                              {info.symbol} {code} - {info.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthly-total">Monthly Budget Total</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">
                        {getCurrencySymbol(newBudget.currency)}
                      </span>
                      <Input
                        id="monthly-total"
                        type="number"
                        min="0"
                        step="100"
                        value={newBudget.monthlyTotal || ''}
                        onChange={(e) => setNewBudget(prev => ({ ...prev, monthlyTotal: parseFloat(e.target.value) || 0 }))}
                        placeholder="5000"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Category Budgets</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddCategory}
                        className="gap-2"
                      >
                        <Plus size={16} />
                        Add Category
                      </Button>
                    </div>

                    <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-3">
                        {newBudget.categories.map((cat, index) => (
                          <Card key={index} className="p-3">
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Category</Label>
                                  <Select
                                    value={cat.category}
                                    onValueChange={(value) => handleUpdateCategory(index, 'category', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {CATEGORIES.map(category => (
                                        <SelectItem key={category} value={category}>
                                          {category}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs">Monthly Limit</Label>
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm">{getCurrencySymbol(newBudget.currency)}</span>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={cat.monthlyLimit || ''}
                                      onChange={(e) =>
                                        handleUpdateCategory(index, 'monthlyLimit', parseFloat(e.target.value) || 0)
                                      }
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="space-y-1 flex-1">
                                  <Label className="text-xs">Alert Threshold (%)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={cat.alertThreshold || ''}
                                    onChange={(e) =>
                                      handleUpdateCategory(index, 'alertThreshold', parseFloat(e.target.value) || 80)
                                    }
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveCategory(index)}
                                  className="mt-5 text-destructive hover:text-destructive"
                                >
                                  <Trash size={16} />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBudget}>Create Budget</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {regionalBudgets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold mb-2">No Regional Budgets Yet</p>
              <p className="text-sm mb-4">Create budgets for different regions and currencies to track spending</p>
              <Button onClick={() => setIsCreating(true)} className="gap-2">
                <Plus size={18} />
                Create Your First Budget
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {regionalBudgets.map(budget => {
                const util = budgetUtilization[budget.id]
                const spentPercentage = util ? (util.spent / util.budget) * 100 : 0
                const isOverBudget = spentPercentage > 100
                const isNearLimit = spentPercentage > 80 && spentPercentage <= 100

                return (
                  <Card
                    key={budget.id}
                    className={`${isOverBudget ? 'border-destructive' : isNearLimit ? 'border-warning' : ''}`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin size={20} weight="fill" />
                            {budget.region}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{budget.currency}</Badge>
                            <span>{getCurrencyName(budget.currency)}</span>
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBudget(budget.id, budget.region)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Overall Budget</span>
                          <span className="text-sm font-semibold">
                            {formatCurrencyWithCode(util?.spent || 0, budget.currency, false)} /{' '}
                            {formatCurrencyWithCode(budget.monthlyTotal, budget.currency, false)}
                          </span>
                        </div>
                        <Progress value={Math.min(spentPercentage, 100)} className="h-3" />
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">
                            {spentPercentage.toFixed(1)}% used
                          </span>
                          {isOverBudget && (
                            <Badge variant="destructive" className="gap-1">
                              <Warning size={12} />
                              Over Budget
                            </Badge>
                          )}
                          {isNearLimit && !isOverBudget && (
                            <Badge className="bg-warning text-warning-foreground gap-1">
                              <Warning size={12} />
                              Near Limit
                            </Badge>
                          )}
                        </div>
                      </div>

                      {budget.categories.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-muted-foreground">Category Breakdown</p>
                          {budget.categories.map((cat, index) => {
                            const catUtil = util?.categories[cat.category]
                            const catSpent = catUtil?.spent || 0
                            const catPercentage = (catSpent / cat.monthlyLimit) * 100
                            const isCatOver = catPercentage > 100
                            const isCatNear = catPercentage > cat.alertThreshold && catPercentage <= 100

                            return (
                              <div key={index} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium">{cat.category}</span>
                                  <span className="text-xs font-semibold">
                                    {formatCurrencyWithCode(catSpent, budget.currency, false)} /{' '}
                                    {formatCurrencyWithCode(cat.monthlyLimit, budget.currency, false)}
                                  </span>
                                </div>
                                <Progress
                                  value={Math.min(catPercentage, 100)}
                                  className={`h-2 ${isCatOver ? '[&>div]:bg-destructive' : isCatNear ? '[&>div]:bg-warning' : ''}`}
                                />
                                <p className="text-xs text-muted-foreground">
                                  {catPercentage.toFixed(0)}% of limit
                                  {isCatOver && ' (Over budget!)'}
                                  {isCatNear && !isCatOver && ` (${cat.alertThreshold}% threshold)`}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
