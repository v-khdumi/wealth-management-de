import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { ScrollArea } from './ui/scroll-area'
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
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { BankStatement, BankTransaction, CategorySummary } from '@/lib/types'

interface BankStatementUploadProps {
  statements: BankStatement[]
  onUpload: (file: File) => Promise<void>
  onProcess?: (statementId: string) => Promise<void>
}

export function BankStatementUpload({ statements, onUpload, onProcess }: BankStatementUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedStatement, setSelectedStatement] = useState<BankStatement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
                    className="p-4 rounded-lg border bg-card cursor-pointer hover:bg-accent/5 transition-colors"
                    onClick={() => setSelectedStatement(statement)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <FilePdf size={24} weight="duotone" className="text-destructive flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm truncate">{statement.fileName}</h4>
                            <Badge variant="outline" className={getStatusColor(statement.status)}>
                              {getStatusIcon(statement.status)}
                              <span className="ml-1">{statement.status}</span>
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Uploaded {new Date(statement.uploadedAt).toLocaleDateString()}
                          </p>
                          
                          {statement.status === 'COMPLETED' && statement.extractedData && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <div className="p-2 rounded bg-muted/50 text-xs">
                                <p className="text-muted-foreground mb-0.5">Opening Balance</p>
                                <p className="font-semibold">
                                  ${statement.extractedData.openingBalance?.toLocaleString() ?? '0'}
                                </p>
                              </div>
                              <div className="p-2 rounded bg-muted/50 text-xs">
                                <p className="text-muted-foreground mb-0.5">Closing Balance</p>
                                <p className="font-semibold">
                                  ${statement.extractedData.closingBalance?.toLocaleString() ?? '0'}
                                </p>
                              </div>
                              <div className="p-2 rounded bg-success/10 text-xs">
                                <p className="text-muted-foreground mb-0.5 flex items-center gap-1">
                                  <TrendUp size={12} className="text-success" />
                                  Income
                                </p>
                                <p className="font-semibold text-success">
                                  ${statement.extractedData.totalIncome?.toLocaleString() ?? '0'}
                                </p>
                              </div>
                              <div className="p-2 rounded bg-destructive/10 text-xs">
                                <p className="text-muted-foreground mb-0.5 flex items-center gap-1">
                                  <TrendDown size={12} className="text-destructive" />
                                  Expenses
                                </p>
                                <p className="font-semibold text-destructive">
                                  ${statement.extractedData.totalExpenses?.toLocaleString() ?? '0'}
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
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {selectedStatement && selectedStatement.status === 'COMPLETED' && selectedStatement.extractedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartPie size={20} weight="duotone" />
              Spending Breakdown
            </CardTitle>
            <CardDescription>Category analysis for {selectedStatement.fileName}</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedStatement.extractedData.categorySummary && selectedStatement.extractedData.categorySummary.length > 0 ? (
              <div className="space-y-3">
                {selectedStatement.extractedData.categorySummary.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{category.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{category.transactionCount} transactions</span>
                        <span className="font-semibold">${category.amount.toLocaleString()}</span>
                        <Badge variant="outline" className="text-xs">
                          {category.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No category data available
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
