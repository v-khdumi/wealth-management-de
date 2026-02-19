import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { DownloadSimple, FileText, FileCsv, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { BankStatement, Goal } from '@/lib/types'
import { getCurrencySymbol, getCurrencyName, detectUniqueCurrencies } from '@/lib/currency-utils'

interface MultiCurrencyReportExportProps {
  statements: BankStatement[]
  goals?: Goal[]
}

type ExportFormat = 'csv' | 'json'
type ReportSection = 'summary' | 'transactions' | 'categories' | 'goals' | 'currency-breakdown'

export function MultiCurrencyReportExport({ statements, goals = [] }: MultiCurrencyReportExportProps) {
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [selectedSections, setSelectedSections] = useState<Set<ReportSection>>(
    new Set(['summary', 'transactions', 'categories', 'currency-breakdown'])
  )

  const availableCurrencies = detectUniqueCurrencies(statements)
  const completedStatements = statements.filter(s => s.status === 'COMPLETED' && s.extractedData)

  const toggleSection = (section: ReportSection) => {
    const newSections = new Set(selectedSections)
    if (newSections.has(section)) {
      newSections.delete(section)
    } else {
      newSections.add(section)
    }
    setSelectedSections(newSections)
  }

  const generateCSVReport = () => {
    const lines: string[] = []
    
    lines.push('MULTI-CURRENCY FINANCIAL REPORT')
    lines.push(`Generated: ${new Date().toLocaleString()}`)
    lines.push(`Report Period: ${completedStatements.length} statements`)
    lines.push(`Currencies: ${availableCurrencies.join(', ')}`)
    lines.push('')

    if (selectedSections.has('summary')) {
      lines.push('=== EXECUTIVE SUMMARY ===')
      lines.push('')
      
      const currencyTotals = new Map<string, { income: number; expenses: number; statements: number }>()
      completedStatements.forEach(stmt => {
        const currency = stmt.extractedData?.currency || 'USD'
        const existing = currencyTotals.get(currency) || { income: 0, expenses: 0, statements: 0 }
        existing.income += stmt.extractedData?.totalIncome || 0
        existing.expenses += stmt.extractedData?.totalExpenses || 0
        existing.statements += 1
        currencyTotals.set(currency, existing)
      })

      currencyTotals.forEach((totals, currency) => {
        const net = totals.income - totals.expenses
        const savingsRate = totals.income > 0 ? ((net / totals.income) * 100) : 0
        lines.push(`${currency} Summary:`)
        lines.push(`  Statements,${totals.statements}`)
        lines.push(`  Total Income,${totals.income.toFixed(2)}`)
        lines.push(`  Total Expenses,${totals.expenses.toFixed(2)}`)
        lines.push(`  Net Savings,${net.toFixed(2)}`)
        lines.push(`  Savings Rate,${savingsRate.toFixed(2)}%`)
        lines.push('')
      })
    }

    if (selectedSections.has('currency-breakdown')) {
      lines.push('=== CURRENCY BREAKDOWN ===')
      lines.push('Currency,Currency Name,Symbol,Statements,Total Income,Total Expenses,Net Savings,Savings Rate')
      
      availableCurrencies.forEach(currency => {
        const currencyStmts = completedStatements.filter(s => s.extractedData?.currency === currency)
        const totalIncome = currencyStmts.reduce((sum, s) => sum + (s.extractedData?.totalIncome || 0), 0)
        const totalExpenses = currencyStmts.reduce((sum, s) => sum + (s.extractedData?.totalExpenses || 0), 0)
        const net = totalIncome - totalExpenses
        const savingsRate = totalIncome > 0 ? ((net / totalIncome) * 100) : 0
        
        lines.push(`${currency},${getCurrencyName(currency)},${getCurrencySymbol(currency)},${currencyStmts.length},${totalIncome.toFixed(2)},${totalExpenses.toFixed(2)},${net.toFixed(2)},${savingsRate.toFixed(2)}%`)
      })
      lines.push('')
    }

    if (selectedSections.has('categories')) {
      lines.push('=== CATEGORY SPENDING BY CURRENCY ===')
      
      availableCurrencies.forEach(currency => {
        lines.push(`\n${currency} - Category Breakdown:`)
        lines.push('Category,Amount,Percentage of Total')
        
        const currencyStmts = completedStatements.filter(s => s.extractedData?.currency === currency)
        const categoryMap = new Map<string, number>()
        let totalExpenses = 0
        
        currencyStmts.forEach(stmt => {
          stmt.extractedData?.categorySummary?.forEach(cat => {
            categoryMap.set(cat.category, (categoryMap.get(cat.category) || 0) + cat.amount)
            totalExpenses += cat.amount
          })
        })
        
        const sortedCategories = Array.from(categoryMap.entries())
          .map(([category, amount]) => ({ category, amount, percentage: (amount / totalExpenses) * 100 }))
          .sort((a, b) => b.amount - a.amount)
        
        sortedCategories.forEach(({ category, amount, percentage }) => {
          lines.push(`${category},${amount.toFixed(2)},${percentage.toFixed(2)}%`)
        })
      })
      lines.push('')
    }

    if (selectedSections.has('transactions')) {
      lines.push('=== DETAILED TRANSACTIONS ===')
      lines.push('Statement,Currency,Date,Description,Type,Category,Amount,Balance')
      
      completedStatements.forEach(stmt => {
        const currency = stmt.extractedData?.currency || 'USD'
        const currencySymbol = stmt.extractedData?.currencySymbol || getCurrencySymbol(currency)
        
        stmt.extractedData?.transactions?.forEach(tx => {
          lines.push(
            `"${stmt.fileName}",${currency},${tx.date},"${tx.description}",${tx.type},${tx.category || 'Uncategorized'},${tx.amount},${tx.balance || ''}`
          )
        })
      })
      lines.push('')
    }

    if (selectedSections.has('goals') && goals.length > 0) {
      lines.push('=== FINANCIAL GOALS ===')
      lines.push('Goal Name,Type,Current Amount,Target Amount,Progress %,Monthly Contribution,Target Date,Status')
      
      goals.forEach(goal => {
        const progress = (goal.currentAmount / goal.targetAmount) * 100
        const monthsLeft = Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))
        const status = progress >= 100 ? 'Completed' : monthsLeft === 0 ? 'Overdue' : 'In Progress'
        
        lines.push(
          `"${goal.name}",${goal.type},${goal.currentAmount.toFixed(2)},${goal.targetAmount.toFixed(2)},${progress.toFixed(2)}%,${goal.monthlyContribution.toFixed(2)},${new Date(goal.targetDate).toLocaleDateString()},${status}`
        )
      })
      lines.push('')
    }

    lines.push('=== END OF REPORT ===')
    lines.push(`Generated by My Wealth Dashboard on ${new Date().toISOString()}`)
    
    return lines.join('\n')
  }

  const generateJSONReport = () => {
    const report: any = {
      metadata: {
        generatedAt: new Date().toISOString(),
        statementCount: completedStatements.length,
        currencies: availableCurrencies,
        reportSections: Array.from(selectedSections)
      },
      data: {}
    }

    if (selectedSections.has('summary')) {
      const currencyTotals: Record<string, any> = {}
      completedStatements.forEach(stmt => {
        const currency = stmt.extractedData?.currency || 'USD'
        if (!currencyTotals[currency]) {
          currencyTotals[currency] = {
            currency,
            currencyName: getCurrencyName(currency),
            currencySymbol: getCurrencySymbol(currency),
            statements: 0,
            totalIncome: 0,
            totalExpenses: 0,
            netSavings: 0,
            savingsRate: 0
          }
        }
        currencyTotals[currency].statements += 1
        currencyTotals[currency].totalIncome += stmt.extractedData?.totalIncome || 0
        currencyTotals[currency].totalExpenses += stmt.extractedData?.totalExpenses || 0
      })

      Object.values(currencyTotals).forEach((totals: any) => {
        totals.netSavings = totals.totalIncome - totals.totalExpenses
        totals.savingsRate = totals.totalIncome > 0 ? ((totals.netSavings / totals.totalIncome) * 100) : 0
      })

      report.data.summary = Object.values(currencyTotals)
    }

    if (selectedSections.has('currency-breakdown')) {
      report.data.currencyBreakdown = availableCurrencies.map(currency => {
        const currencyStmts = completedStatements.filter(s => s.extractedData?.currency === currency)
        const totalIncome = currencyStmts.reduce((sum, s) => sum + (s.extractedData?.totalIncome || 0), 0)
        const totalExpenses = currencyStmts.reduce((sum, s) => sum + (s.extractedData?.totalExpenses || 0), 0)
        const net = totalIncome - totalExpenses
        
        return {
          currency,
          currencyName: getCurrencyName(currency),
          currencySymbol: getCurrencySymbol(currency),
          statementCount: currencyStmts.length,
          totalIncome,
          totalExpenses,
          netSavings: net,
          savingsRate: totalIncome > 0 ? ((net / totalIncome) * 100) : 0
        }
      })
    }

    if (selectedSections.has('categories')) {
      report.data.categoriesByCurrency = {}
      
      availableCurrencies.forEach(currency => {
        const currencyStmts = completedStatements.filter(s => s.extractedData?.currency === currency)
        const categoryMap = new Map<string, number>()
        let totalExpenses = 0
        
        currencyStmts.forEach(stmt => {
          stmt.extractedData?.categorySummary?.forEach(cat => {
            categoryMap.set(cat.category, (categoryMap.get(cat.category) || 0) + cat.amount)
            totalExpenses += cat.amount
          })
        })
        
        report.data.categoriesByCurrency[currency] = Array.from(categoryMap.entries())
          .map(([category, amount]) => ({
            category,
            amount,
            percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
          }))
          .sort((a, b) => b.amount - a.amount)
      })
    }

    if (selectedSections.has('transactions')) {
      report.data.transactions = completedStatements.flatMap(stmt => 
        (stmt.extractedData?.transactions || []).map(tx => ({
          statementId: stmt.id,
          statementFileName: stmt.fileName,
          currency: stmt.extractedData?.currency || 'USD',
          date: tx.date,
          description: tx.description,
          type: tx.type,
          category: tx.category,
          amount: tx.amount,
          balance: tx.balance
        }))
      )
    }

    if (selectedSections.has('goals') && goals.length > 0) {
      report.data.goals = goals.map(goal => ({
        id: goal.id,
        name: goal.name,
        type: goal.type,
        currentAmount: goal.currentAmount,
        targetAmount: goal.targetAmount,
        progress: (goal.currentAmount / goal.targetAmount) * 100,
        monthlyContribution: goal.monthlyContribution,
        targetDate: goal.targetDate,
        createdAt: goal.createdAt,
        isCustom: goal.isCustom
      }))
    }

    return JSON.stringify(report, null, 2)
  }

  const handleExport = () => {
    if (selectedSections.size === 0) {
      toast.error('Please select at least one section to export')
      return
    }

    const content = format === 'csv' ? generateCSVReport() : generateJSONReport()
    const blob = new Blob([content], { 
      type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json;charset=utf-8;'
    })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `multi-currency-report-${timestamp}.${format}`
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Report exported successfully', {
      description: `Saved as ${filename}`
    })
  }

  if (completedStatements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DownloadSimple size={24} weight="duotone" />
            Multi-Currency Report Export
          </CardTitle>
          <CardDescription>Export comprehensive financial reports</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <FileText size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" weight="duotone" />
          <p className="text-sm text-muted-foreground">
            Upload and process bank statements to generate reports
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DownloadSimple size={24} weight="duotone" className="text-accent" />
          Multi-Currency Report Export
        </CardTitle>
        <CardDescription>
          Export comprehensive reports across {availableCurrencies.length} {availableCurrencies.length === 1 ? 'currency' : 'currencies'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Statements</p>
            <p className="text-xl font-display font-bold">{completedStatements.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Currencies</p>
            <p className="text-xl font-display font-bold">{availableCurrencies.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Transactions</p>
            <p className="text-xl font-display font-bold">
              {completedStatements.reduce((sum, s) => sum + (s.extractedData?.transactions?.length || 0), 0)}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold mb-3 block">Export Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileCsv size={16} />
                    CSV (Spreadsheet)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText size={16} />
                    JSON (Data Export)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-3 block">Report Sections</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="summary" 
                  checked={selectedSections.has('summary')}
                  onCheckedChange={() => toggleSection('summary')}
                />
                <Label htmlFor="summary" className="text-sm font-normal cursor-pointer flex-1">
                  Executive Summary
                  <p className="text-xs text-muted-foreground">Overall financial metrics by currency</p>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="currency-breakdown" 
                  checked={selectedSections.has('currency-breakdown')}
                  onCheckedChange={() => toggleSection('currency-breakdown')}
                />
                <Label htmlFor="currency-breakdown" className="text-sm font-normal cursor-pointer flex-1">
                  Currency Breakdown
                  <p className="text-xs text-muted-foreground">Detailed analysis per currency</p>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="categories" 
                  checked={selectedSections.has('categories')}
                  onCheckedChange={() => toggleSection('categories')}
                />
                <Label htmlFor="categories" className="text-sm font-normal cursor-pointer flex-1">
                  Category Spending
                  <p className="text-xs text-muted-foreground">Spending breakdown by category and currency</p>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="transactions" 
                  checked={selectedSections.has('transactions')}
                  onCheckedChange={() => toggleSection('transactions')}
                />
                <Label htmlFor="transactions" className="text-sm font-normal cursor-pointer flex-1">
                  All Transactions
                  <p className="text-xs text-muted-foreground">Complete transaction history</p>
                </Label>
              </div>

              {goals.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="goals" 
                    checked={selectedSections.has('goals')}
                    onCheckedChange={() => toggleSection('goals')}
                  />
                  <Label htmlFor="goals" className="text-sm font-normal cursor-pointer flex-1">
                    Financial Goals
                    <p className="text-xs text-muted-foreground">Goal progress and tracking data</p>
                  </Label>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button 
              onClick={handleExport} 
              className="w-full gap-2"
              size="lg"
              disabled={selectedSections.size === 0}
            >
              <DownloadSimple size={20} weight="bold" />
              Export {format.toUpperCase()} Report
              {selectedSections.size > 0 && ` (${selectedSections.size} section${selectedSections.size !== 1 ? 's' : ''})`}
            </Button>
          </div>

          {availableCurrencies.length > 1 && (
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-accent mt-0.5 flex-shrink-0" weight="fill" />
                <div>
                  <p className="font-semibold text-sm mb-1">Multi-Currency Support</p>
                  <p className="text-xs text-muted-foreground">
                    Your report includes data from {availableCurrencies.join(', ')}. Each currency is tracked and reported separately.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
