import { useState, useRef, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { ScrollArea } from './ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import {
  FilePdf,
  UploadSimple,
  CheckCircle,
  XCircle,
  Clock,
  TrendUp,
  TrendDown,
  Info,
  Sparkle,
  ChartPie,
  DownloadSimple,
  ChartLine,
  CalendarBlank,
  CreditCard,
  Trash,
  CurrencyCircleDollar,
  Funnel,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { BankStatement, BankTransaction, CategorySummary } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { 
  getExchangeRates, 
  convertCurrency, 
  formatCurrencyWithCode, 
  getCurrencySymbol,
  getCurrencyName,
  detectUniqueCurrencies,
  CURRENCY_DATABASE 
} from '@/lib/currency-utils'

interface BankStatementUploadProps {
  statements: BankStatement[]
  onUpload: (file: File) => Promise<void>
  onProcess?: (statementId: string) => Promise<void>
  onDelete?: (statementId: string) => void
}

const COLORS = ['oklch(0.45 0.12 155)', 'oklch(0.65 0.15 195)', 'oklch(0.35 0.08 240)', 'oklch(0.70 0.15 75)', 'oklch(0.55 0.15 145)', 'oklch(0.55 0.22 25)', 'oklch(0.60 0.10 300)', 'oklch(0.50 0.08 180)']

export function BankStatementUpload({ statements, onUpload, onProcess, onDelete }: BankStatementUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedStatement, setSelectedStatement] = useState<BankStatement | null>(null)
  const [insightsView, setInsightsView] = useState<'overview' | 'trends' | 'transactions'>('overview')
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)
  const [aiInsights, setAiInsights] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [baseCurrency, setBaseCurrency] = useState<string>('USD')
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({})
  const [isLoadingRates, setIsLoadingRates] = useState(false)
  const [enableCurrencyConversion, setEnableCurrencyConversion] = useState(false)
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL')
  
  const availableCurrencies = useMemo(() => detectUniqueCurrencies(statements), [statements])
  
  useEffect(() => {
    const loadRates = async () => {
      setIsLoadingRates(true)
      try {
        const rates = await getExchangeRates(baseCurrency)
        setExchangeRates(rates)
      } catch (error) {
        console.error('Failed to load exchange rates:', error)
      } finally {
        setIsLoadingRates(false)
      }
    }
    
    if (enableCurrencyConversion && availableCurrencies.length > 1) {
      loadRates()
    }
  }, [baseCurrency, enableCurrencyConversion, availableCurrencies.length])

  const aggregatedData = useMemo(() => {
    if (statements.length === 0) return null

    let completedStatements = statements.filter(s => s.status === 'COMPLETED' && s.extractedData)
    if (completedStatements.length === 0) return null
    
    if (currencyFilter !== 'ALL') {
      completedStatements = completedStatements.filter(s => s.extractedData?.currency === currencyFilter)
      if (completedStatements.length === 0) return null
    }

    const convert = (amount: number, fromCurrency: string) => {
      if (!enableCurrencyConversion || Object.keys(exchangeRates).length === 0) {
        return amount
      }
      return convertCurrency(amount, fromCurrency, baseCurrency, exchangeRates)
    }

    const totalIncome = completedStatements.reduce((sum, s) => {
      const income = s.extractedData?.totalIncome || 0
      const currency = s.extractedData?.currency || 'USD'
      return sum + convert(income, currency)
    }, 0)
    
    const totalExpenses = completedStatements.reduce((sum, s) => {
      const expenses = s.extractedData?.totalExpenses || 0
      const currency = s.extractedData?.currency || 'USD'
      return sum + convert(expenses, currency)
    }, 0)

    const categoryMap = new Map<string, number>()
    completedStatements.forEach(s => {
      const currency = s.extractedData?.currency || 'USD'
      s.extractedData?.categorySummary?.forEach(cat => {
        const convertedAmount = convert(cat.amount, currency)
        categoryMap.set(cat.category, (categoryMap.get(cat.category) || 0) + convertedAmount)
      })
    })

    const categorySummary = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)

    const monthlyTrends = completedStatements
      .map(s => {
        const currency = s.extractedData?.currency || 'USD'
        const income = convert(s.extractedData?.totalIncome || 0, currency)
        const expenses = convert(s.extractedData?.totalExpenses || 0, currency)
        return {
          month: s.extractedData?.statementDate ? new Date(s.extractedData.statementDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : 'N/A',
          income,
          expenses,
          net: income - expenses
        }
      })
      .reverse()

    const displayCurrency = enableCurrencyConversion ? baseCurrency : (completedStatements[0]?.extractedData?.currency || 'USD')
    const displaySymbol = enableCurrencyConversion ? getCurrencySymbol(baseCurrency) : (completedStatements[0]?.extractedData?.currencySymbol || '$')

    return {
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
      categorySummary,
      monthlyTrends,
      currency: displayCurrency,
      currencySymbol: displaySymbol
    }
  }, [statements, enableCurrencyConversion, baseCurrency, exchangeRates, currencyFilter])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      toast.error('Invalid file type', {
        description: 'Please upload a PDF or image file'
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Maximum file size is 10MB'
      })
      return
    }

    setIsUploading(true)
    try {
      await onUpload(file)
      toast.success('Statement uploaded successfully', {
        description: 'AI is now processing your statement'
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      toast.error('Upload failed', {
        description: 'Please try again'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleProcess = async (statementId: string) => {
    if (!onProcess) return
    
    setIsProcessing(true)
    try {
      await onProcess(statementId)
      toast.success('Statement processed successfully')
    } catch (error) {
      toast.error('Processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerateInsights = async () => {
    if (!aggregatedData) return

    setIsGeneratingInsights(true)
    try {
      const currencyDisplay = aggregatedData.currencySymbol || aggregatedData.currency || '$'
      const promptText = `You are a financial advisor analyzing bank statement data. The amounts are in ${aggregatedData.currency || 'USD'}. Based on the following spending data, provide 3-5 actionable insights and recommendations:

Total Income: ${currencyDisplay}${aggregatedData.totalIncome}
Total Expenses: ${currencyDisplay}${aggregatedData.totalExpenses}
Net Savings: ${currencyDisplay}${aggregatedData.netSavings}
Savings Rate: ${aggregatedData.savingsRate.toFixed(1)}%

Top Spending Categories:
${aggregatedData.categorySummary.slice(0, 5).map(c => `- ${c.category}: ${currencyDisplay}${c.amount.toFixed(2)} (${c.percentage.toFixed(1)}%)`).join('\n')}

Provide specific, actionable advice in a friendly, encouraging tone. Focus on:
1. Spending patterns and areas of concern
2. Savings opportunities
3. Budget optimization suggestions
4. Positive behaviors to reinforce

Keep each insight concise (2-3 sentences max). Use the currency symbol ${currencyDisplay} when mentioning amounts.`

      const response = await window.spark.llm(promptText, 'gpt-4o-mini')
      setAiInsights(response)
      toast.success('Insights generated successfully')
    } catch (error) {
      setAiInsights('Unable to generate insights at this time. Please ensure you have uploaded and processed at least one bank statement.')
      toast.error('Failed to generate insights')
    } finally {
      setIsGeneratingInsights(false)
    }
  }

  const handleExportCSV = () => {
    if (!selectedStatement?.extractedData?.transactions) {
      toast.error('No transaction data available')
      return
    }

    const transactions = selectedStatement.extractedData.transactions
    const csvHeader = 'Date,Description,Amount,Type,Category,Balance\n'
    const csvRows = transactions.map(tx => 
      `${tx.date},"${tx.description}",${tx.amount},${tx.type},${tx.category || 'Uncategorized'},${tx.balance || ''}`
    ).join('\n')
    
    const csvContent = csvHeader + csvRows
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${selectedStatement.fileName.replace(/\.[^/.]+$/, '')}_transactions.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('CSV exported successfully')
  }

  const handleExportPDF = () => {
    toast.info('PDF export feature', {
      description: 'In production, this would generate a detailed PDF report'
    })
  }

  const handleDelete = (statementId: string, fileName: string) => {
    if (!onDelete) return
    
    if (window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      onDelete(statementId)
      
      if (selectedStatement?.id === statementId) {
        setSelectedStatement(null)
      }
      
      toast.success('Statement deleted', {
        description: `${fileName} has been removed`
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-success/10 text-success border-success/30'
      case 'PROCESSING':
        return 'bg-warning/10 text-warning-foreground border-warning/30'
      case 'FAILED':
        return 'bg-destructive/10 text-destructive border-destructive/30'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle size={16} weight="fill" className="text-success" />
      case 'PROCESSING':
        return <Clock size={16} weight="fill" className="text-warning-foreground" />
      case 'FAILED':
        return <XCircle size={16} weight="fill" className="text-destructive" />
      default:
        return <Clock size={16} className="text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      <Card className="ai-glow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-accent to-primary">
                <Sparkle size={20} weight="duotone" className="text-white" />
              </div>
              <div>
                <CardTitle>Bank Statement Upload</CardTitle>
                <CardDescription>
                  Upload statements for AI-powered financial insights
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
              <UploadSimple size={32} weight="duotone" className="text-primary" />
            </div>
            <h3 className="font-semibold mb-2">
              {isUploading ? 'Uploading...' : 'Upload Bank Statement'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              PDF or image files up to 10MB
            </p>
            {isUploading && (
              <Progress value={45} className="w-full max-w-xs mx-auto" />
            )}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-accent/10 border border-accent/30">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-accent mt-0.5 flex-shrink-0" />
              <div className="text-xs text-accent-foreground">
                <p className="font-semibold mb-1">AI-Powered Extraction</p>
                <p>We'll automatically extract account balances, transactions, income, expenses, and spending patterns to enhance your financial insights.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {statements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Statements ({statements.length})</CardTitle>
            <CardDescription>View and manage your bank statements</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {statements.map((statement) => (
                  <div
                    key={statement.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div 
                        className="flex items-start gap-3 flex-1 cursor-pointer"
                        onClick={() => setSelectedStatement(statement)}
                      >
                        <FilePdf size={24} weight="duotone" className="text-destructive flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-sm truncate">{statement.fileName}</h4>
                            <Badge variant="outline" className={getStatusColor(statement.status)}>
                              {getStatusIcon(statement.status)}
                              <span className="ml-1">{statement.status}</span>
                            </Badge>
                            {statement.extractedData?.currency && (
                              <Badge variant="secondary" className="gap-1 bg-accent/10 text-accent border-accent/30">
                                <CurrencyCircleDollar size={12} weight="fill" />
                                {statement.extractedData.currency}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Uploaded {new Date(statement.uploadedAt).toLocaleDateString()}
                          </p>
                          
                          {statement.status === 'COMPLETED' && statement.extractedData && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <div className="p-2 rounded bg-muted/50 text-xs">
                                <p className="text-muted-foreground mb-0.5">Opening Balance</p>
                                <p className="font-semibold">
                                  {formatCurrency(
                                    statement.extractedData.openingBalance ?? 0,
                                    statement.extractedData.currencySymbol,
                                    statement.extractedData.currency
                                  )}
                                </p>
                              </div>
                              <div className="p-2 rounded bg-muted/50 text-xs">
                                <p className="text-muted-foreground mb-0.5">Closing Balance</p>
                                <p className="font-semibold">
                                  {formatCurrency(
                                    statement.extractedData.closingBalance ?? 0,
                                    statement.extractedData.currencySymbol,
                                    statement.extractedData.currency
                                  )}
                                </p>
                              </div>
                              <div className="p-2 rounded bg-success/10 text-xs">
                                <p className="text-muted-foreground mb-0.5 flex items-center gap-1">
                                  <TrendUp size={12} className="text-success" />
                                  Income
                                </p>
                                <p className="font-semibold text-success">
                                  {formatCurrency(
                                    statement.extractedData.totalIncome ?? 0,
                                    statement.extractedData.currencySymbol,
                                    statement.extractedData.currency
                                  )}
                                </p>
                              </div>
                              <div className="p-2 rounded bg-destructive/10 text-xs">
                                <p className="text-muted-foreground mb-0.5 flex items-center gap-1">
                                  <TrendDown size={12} className="text-destructive" />
                                  Expenses
                                </p>
                                <p className="font-semibold text-destructive">
                                  {formatCurrency(
                                    statement.extractedData.totalExpenses ?? 0,
                                    statement.extractedData.currencySymbol,
                                    statement.extractedData.currency
                                  )}
                                </p>
                              </div>
                            </div>
                          )}

                          {statement.status === 'FAILED' && statement.errorMessage && (
                            <div className="mt-2 p-2 rounded bg-destructive/10 text-xs text-destructive">
                              {statement.errorMessage}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(statement.id, statement.fileName)
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                          title="Delete statement"
                        >
                          <Trash size={18} weight="duotone" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {aggregatedData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ChartLine size={20} weight="duotone" />
                  Financial Insights Dashboard
                </CardTitle>
                <CardDescription>Comprehensive analysis of your spending patterns</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
                  <DownloadSimple size={16} />
                  Export PDF
                </Button>
                {selectedStatement && (
                  <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
                    <DownloadSimple size={16} />
                    Export CSV
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {availableCurrencies.length > 1 && (
              <div className="mb-6 p-4 rounded-lg border bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CurrencyCircleDollar size={20} className="text-accent" weight="duotone" />
                    <h4 className="font-semibold text-sm">Multi-Currency Options</h4>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    {availableCurrencies.length} {availableCurrencies.length === 1 ? 'currency' : 'currencies'} detected
                  </Badge>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="currency-conversion" className="text-sm">
                      Enable Conversion
                    </Label>
                    <Switch
                      id="currency-conversion"
                      checked={enableCurrencyConversion}
                      onCheckedChange={setEnableCurrencyConversion}
                    />
                  </div>
                  
                  {enableCurrencyConversion && (
                    <div className="space-y-1">
                      <Label htmlFor="base-currency" className="text-xs text-muted-foreground">
                        Base Currency
                      </Label>
                      <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                        <SelectTrigger id="base-currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(CURRENCY_DATABASE).map(code => (
                            <SelectItem key={code} value={code}>
                              {getCurrencySymbol(code)} {code} - {getCurrencyName(code)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <Label htmlFor="currency-filter" className="text-xs text-muted-foreground flex items-center gap-1">
                      <Funnel size={12} />
                      Filter by Currency
                    </Label>
                    <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                      <SelectTrigger id="currency-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Currencies</SelectItem>
                        {availableCurrencies.map(currency => (
                          <SelectItem key={currency} value={currency}>
                            {getCurrencySymbol(currency)} {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {enableCurrencyConversion && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent/5 p-2 rounded">
                    <Info size={14} className="flex-shrink-0 mt-0.5" />
                    <p>
                      All amounts are being converted to {baseCurrency} using current exchange rates.
                      {isLoadingRates && ' Loading latest rates...'}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <Tabs value={insightsView} onValueChange={(v) => setInsightsView(v as typeof insightsView)}>
              <TabsList className="grid grid-cols-3 w-full mb-6">
                <TabsTrigger value="overview" className="gap-2">
                  <ChartPie size={16} />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="trends" className="gap-2">
                  <ChartLine size={16} />
                  Trends
                </TabsTrigger>
                <TabsTrigger value="transactions" className="gap-2">
                  <CreditCard size={16} />
                  Transactions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-success/10 to-transparent border-success/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <TrendUp size={14} className="text-success" />
                        Total Income
                      </div>
                      <p className="text-2xl font-display font-bold text-success">
                        {formatCurrency(aggregatedData.totalIncome, aggregatedData.currencySymbol, aggregatedData.currency)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-destructive/10 to-transparent border-destructive/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <TrendDown size={14} className="text-destructive" />
                        Total Expenses
                      </div>
                      <p className="text-2xl font-display font-bold text-destructive">
                        {formatCurrency(aggregatedData.totalExpenses, aggregatedData.currencySymbol, aggregatedData.currency)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground mb-1">Net Savings</div>
                      <p className="text-2xl font-display font-bold text-primary">
                        {formatCurrency(aggregatedData.netSavings, aggregatedData.currencySymbol, aggregatedData.currency)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground mb-1">Savings Rate</div>
                      <p className="text-2xl font-display font-bold text-accent">
                        {aggregatedData.savingsRate.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Spending by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={aggregatedData.categorySummary.slice(0, 8)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.category}: ${entry.percentage.toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="amount"
                          >
                            {aggregatedData.categorySummary.slice(0, 8).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Top Spending Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {aggregatedData.categorySummary.slice(0, 6).map((category, index) => (
                          <div key={category.category}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{category.category}</span>
                              <span className="text-sm font-semibold">${category.amount.toFixed(0)}</span>
                            </div>
                            <Progress value={category.percentage} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="ai-glow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkle size={20} weight="duotone" className="text-accent" />
                        <CardTitle className="text-base">AI-Powered Insights</CardTitle>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleGenerateInsights}
                        disabled={isGeneratingInsights}
                        className="gap-2"
                      >
                        <Sparkle size={14} />
                        {isGeneratingInsights ? 'Generating...' : 'Generate Insights'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {aiInsights ? (
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap text-sm">{aiInsights}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Click "Generate Insights" to get personalized financial recommendations based on your spending data
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trends" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Monthly Income vs Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={aggregatedData.monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                        <Legend />
                        <Bar dataKey="income" fill="oklch(0.55 0.15 145)" name="Income" />
                        <Bar dataKey="expenses" fill="oklch(0.55 0.22 25)" name="Expenses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Net Savings Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={aggregatedData.monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="net" 
                          stroke="oklch(0.45 0.12 155)" 
                          strokeWidth={3}
                          name="Net Savings"
                          dot={{ fill: 'oklch(0.45 0.12 155)', r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions" className="space-y-4">
                {selectedStatement?.extractedData?.transactions ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Transaction History</CardTitle>
                        <Badge variant="outline">
                          {selectedStatement.extractedData.transactions.length} transactions
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[500px]">
                        <div className="space-y-2">
                          {selectedStatement.extractedData.transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5">
                              <div className="flex items-start gap-3 flex-1">
                                <div className={`p-2 rounded-lg ${tx.type === 'CREDIT' ? 'bg-success/10' : 'bg-muted'}`}>
                                  {tx.type === 'CREDIT' ? (
                                    <TrendUp size={16} className="text-success" />
                                  ) : (
                                    <TrendDown size={16} className="text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{tx.description}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <CalendarBlank size={12} />
                                      {new Date(tx.date).toLocaleDateString()}
                                    </p>
                                    {tx.category && (
                                      <Badge variant="outline" className="text-xs">
                                        {tx.category}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-semibold ${tx.type === 'CREDIT' ? 'text-success' : 'text-foreground'}`}>
                                  {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount, selectedStatement.extractedData?.currencySymbol, selectedStatement.extractedData?.currency)}
                                </p>
                                {tx.balance !== undefined && (
                                  <p className="text-xs text-muted-foreground">
                                    Balance: {formatCurrency(tx.balance, selectedStatement.extractedData?.currencySymbol, selectedStatement.extractedData?.currency)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <CreditCard size={48} className="mx-auto mb-4 text-muted-foreground" weight="duotone" />
                      <p className="text-sm text-muted-foreground">
                        Select a processed statement to view transactions
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
