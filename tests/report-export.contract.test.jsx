import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MultiCurrencyReportExport } from '../src/components/MultiCurrencyReportExport'
import { captureDownloads, chooseOption, goal, NOW, statement } from './support/harness.mjs'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/lib/currency-utils', () => ({
  getCurrencySymbol: code => ({ USD: '$', EUR: '€' })[code],
  getCurrencyName: code => ({ USD: 'US Dollar', EUR: 'Euro' })[code],
  // Currency discovery is a separate library contract. This suite supplies
  // a deterministic implementation for the report consumer boundary.
  detectUniqueCurrencies: statements => [...new Set(statements
    .filter(s => s.status === 'COMPLETED' && s.extractedData)
    .map(s => s.extractedData.currency || 'USD'))].sort(),
}))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(NOW))
})

function fixtures() {
  return [
    statement(),
    statement({
      id: 'statement-eur', fileName: 'synthetic-eur.csv',
      extractedData: {
        currency: 'EUR', currencySymbol: '€', totalIncome: 2000, totalExpenses: 1000,
        categorySummary: [{ category: 'Housing', amount: 1000, transactionCount: 1 }],
        transactions: [],
      },
    }),
    statement({
      id: 'failed', status: 'FAILED', fileName: 'excluded.csv',
      extractedData: {
        currency: 'USD', totalIncome: 900000, totalExpenses: 800000,
        transactions: [{ description: 'MUST NOT EXPORT', amount: 800000 }],
      },
    }),
    statement({ id: 'pending', status: 'PROCESSING', extractedData: undefined }),
    statement({ id: 'no-data', status: 'COMPLETED', extractedData: undefined }),
  ]
}

function exportButton() {
  return screen.getByRole('button', { name: /^Export (CSV|JSON) Report/ })
}

function jsonFormat() {
  chooseOption(screen.getByRole('combobox'), 'JSON (Data Export)')
}

describe('financial report consumer contracts', () => {
  it('does not offer export without a completed statement containing data', () => {
    render(<MultiCurrencyReportExport statements={fixtures().slice(2)} />)
    expect(screen.getByText('Upload and process bank statements to generate reports')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^Export/ })).toBeNull()
  })

  it('exports separate currency summaries and lossless JSON transaction fields', async () => {
    const downloads = captureDownloads()
    render(<MultiCurrencyReportExport statements={fixtures()} goals={[goal()]} />)
    jsonFormat()
    fireEvent.click(exportButton())
    expect(downloads.blobs).toHaveLength(1)
    expect(downloads.blobs[0].type).toBe('application/json;charset=utf-8;')
    expect(downloads.links).toEqual([{
      filename: 'multi-currency-report-2026-01-15.json', href: 'blob:synthetic-1', attached: true,
    }])
    expect(document.querySelector('a[download]')).toBeNull()
    const report = JSON.parse(await downloads.read())
    expect(report.metadata).toEqual({
      generatedAt: NOW, statementCount: 2, currencies: ['EUR', 'USD'],
      reportSections: ['summary', 'transactions', 'categories', 'currency-breakdown'],
    })
    expect(Object.keys(report.data).sort()).toEqual(['categoriesByCurrency', 'currencyBreakdown', 'summary', 'transactions'])
    expect(report.data.summary).toEqual([
      {
        currency: 'USD', currencyName: 'US Dollar', currencySymbol: '$', statements: 1,
        totalIncome: 1000, totalExpenses: 600, netSavings: 400, savingsRate: 40,
      },
      {
        currency: 'EUR', currencyName: 'Euro', currencySymbol: '€', statements: 1,
        totalIncome: 2000, totalExpenses: 1000, netSavings: 1000, savingsRate: 50,
      },
    ])
    expect(report.data.currencyBreakdown).toEqual([
      {
        currency: 'EUR', currencyName: 'Euro', currencySymbol: '€', statementCount: 1,
        totalIncome: 2000, totalExpenses: 1000, netSavings: 1000, savingsRate: 50,
      },
      {
        currency: 'USD', currencyName: 'US Dollar', currencySymbol: '$', statementCount: 1,
        totalIncome: 1000, totalExpenses: 600, netSavings: 400, savingsRate: 40,
      },
    ])
    expect(report.data.categoriesByCurrency.USD.map(c => [c.category, c.amount])).toEqual([
      ['Housing', 400], ['Food', 200],
    ])
    expect(report.data.categoriesByCurrency.USD[0].percentage).toBeCloseTo(100 * 400 / 600)
    expect(report.data.categoriesByCurrency.EUR).toEqual([{ category: 'Housing', amount: 1000, percentage: 100 }])
    expect(report.data.transactions).toEqual([{
      statementId: 'statement-usd', statementFileName: 'synthetic-usd.csv', currency: 'USD',
      date: '2026-01-02', description: 'Synthetic rent', type: 'DEBIT', category: 'Housing', amount: 400, balance: 0,
    }])
    expect(report.data.goals).toBeUndefined()
  })

  it('exports only selected sections and disables exporting an empty selection', async () => {
    const downloads = captureDownloads()
    render(<MultiCurrencyReportExport statements={fixtures()} goals={[goal()]} />)
    jsonFormat()
    for (const name of [/Executive Summary/, /Currency Breakdown/, /Category Spending/, /All Transactions/]) {
      fireEvent.click(screen.getByRole('checkbox', { name }))
    }
    expect(exportButton().disabled).toBe(true)
    fireEvent.click(exportButton())
    expect(downloads.blobs).toHaveLength(0)
    fireEvent.click(screen.getByRole('checkbox', { name: /Financial Goals/ }))
    expect(exportButton().disabled).toBe(false)
    fireEvent.click(exportButton())
    const report = JSON.parse(await downloads.read())
    expect(report.metadata.reportSections).toEqual(['goals'])
    expect(Object.keys(report.data)).toEqual(['goals'])
    expect(report.data.goals).toEqual([{
      id: 'goal-a', name: 'Synthetic emergency fund', type: 'OTHER',
      currentAmount: 250, targetAmount: 1000, progress: 25, monthlyContribution: 50,
      targetDate: '2027-01-15T12:00:00.000Z', createdAt: NOW, isCustom: true,
    }])
  })

  it('keeps zero-income and zero-category JSON percentages finite', async () => {
    const downloads = captureDownloads()
    render(<MultiCurrencyReportExport statements={[statement({ extractedData: {
      currency: 'USD', totalIncome: 0, totalExpenses: 10,
      categorySummary: [{ category: 'Empty', amount: 0 }], transactions: [],
    } })]} />)
    jsonFormat()
    fireEvent.click(exportButton())
    const report = JSON.parse(await downloads.read())
    expect(report.data.summary[0]).toMatchObject({ netSavings: -10, savingsRate: 0 })
    expect(report.data.currencyBreakdown[0].savingsRate).toBe(0)
    expect(report.data.categoriesByCurrency.USD[0].percentage).toBe(0)
  })

  it('preserves the current CSV headings, numeric formatting and default section set', async () => {
    const downloads = captureDownloads()
    render(<MultiCurrencyReportExport statements={fixtures()} goals={[goal()]} />)
    expect(exportButton().textContent).toContain('(4 sections)')
    fireEvent.click(exportButton())
    expect(downloads.blobs[0].type).toBe('text/csv;charset=utf-8;')
    expect(downloads.links[0].filename).toBe('multi-currency-report-2026-01-15.csv')
    const csv = await downloads.read()
    expect(csv.startsWith('MULTI-CURRENCY FINANCIAL REPORT\n')).toBe(true)
    expect(csv).toContain('Report Period: 2 statements')
    expect(csv).toContain('USD Summary:\n  Statements,1\n  Total Income,1000.00\n  Total Expenses,600.00\n  Net Savings,400.00\n  Savings Rate,40.00%')
    expect(csv).toContain('EUR,Euro,€,1,2000.00,1000.00,1000.00,50.00%')
    expect(csv).toContain('Housing,400.00,66.67%')
    expect(csv).toContain('Statement,Currency,Date,Description,Type,Category,Amount,Balance')
    // Existing CSV uses balance || '', so zero is blank. JSON above preserves
    // zero. This is a legacy difference, not a desired new backend schema.
    expect(csv).toContain('"synthetic-usd.csv",USD,2026-01-02,"Synthetic rent",DEBIT,Housing,400,\n')
    expect(csv).not.toContain('MUST NOT EXPORT')
    expect(csv).not.toContain('=== FINANCIAL GOALS ===')
    expect(csv.endsWith(`=== END OF REPORT ===\nGenerated by My Wealth Dashboard on ${NOW}`)).toBe(true)
  })
})
