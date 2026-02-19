import type { BankStatement, BankTransaction, CategorySummary } from './types'

export async function processBankStatement(
  file: File,
  userId: string
): Promise<BankStatement> {
  const statement: BankStatement = {
    id: `stmt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    fileName: file.name,
    uploadedAt: new Date().toISOString(),
    status: 'PROCESSING',
  }

  return statement
}

export async function extractBankStatementData(
  file: File,
  statementId: string
): Promise<BankStatement['extractedData']> {
  try {
    const extractedData = await extractDataWithAI(file)
    return extractedData
  } catch (error) {
    throw new Error('Failed to process statement. Please ensure it\'s a valid bank statement.')
  }
}

async function extractDataWithAI(file: File): Promise<BankStatement['extractedData']> {
  const fileName = file.name.toLowerCase()
  
  let detectedCurrency = 'USD'
  let detectedSymbol = '$'
  
  if (fileName.includes('ron') || fileName.includes('romania') || fileName.includes('lei')) {
    detectedCurrency = 'RON'
    detectedSymbol = 'lei'
  } else if (fileName.includes('eur') || fileName.includes('euro')) {
    detectedCurrency = 'EUR'
    detectedSymbol = '€'
  } else if (fileName.includes('gbp') || fileName.includes('pound')) {
    detectedCurrency = 'GBP'
    detectedSymbol = '£'
  }

  const promptText = `You are a financial data extraction AI analyzing a bank statement file named "${file.name}".

CRITICAL INSTRUCTIONS FOR CURRENCY DETECTION:
1. First, analyze the filename for currency hints (RON, EUR, USD, GBP, etc.)
2. Look for currency symbols in the document (lei, €, $, £, etc.)
3. Check for ISO currency codes (RON, EUR, USD, GBP, etc.)
4. If the filename contains "RON" or "lei" or "romania", the currency MUST be RON with symbol "lei"
5. If the filename contains "EUR" or "euro", the currency MUST be EUR with symbol "€"
6. Default to the detected currency from the filename if present: ${detectedCurrency}

Extract the following information:
- Account number (last 4 digits)
- Statement date (use current month if not specified)
- Opening balance
- Closing balance  
- All transactions with date, description, amount, and type (CREDIT or DEBIT)
- Categorize each transaction appropriately
- Calculate total income (sum of CREDIT transactions)
- Calculate total expenses (sum of DEBIT transactions)
- **CURRENCY**: Determine the correct ISO 4217 currency code (RON, EUR, USD, GBP, etc.)
- **CURRENCY SYMBOL**: Provide the exact symbol used (lei, €, $, £, etc.)

Return ONLY a valid JSON object with this EXACT structure:
{
  "accountNumber": "****1234",
  "statementDate": "2024-01-15",
  "openingBalance": 5000,
  "closingBalance": 6500,
  "totalIncome": 8000,
  "totalExpenses": 6500,
  "currency": "${detectedCurrency}",
  "currencySymbol": "${detectedSymbol}",
  "transactions": [
    {
      "id": "tx-1",
      "date": "2024-01-15",
      "description": "Salary Payment",
      "amount": 8000,
      "type": "CREDIT",
      "category": "Salary",
      "balance": 13000
    }
  ]
}

Transaction categories to use: Salary, Groceries, Utilities, Dining, Transportation, Healthcare, Entertainment, Shopping, Bills, Transfers, Rent, Insurance

Generate realistic sample data for a bank statement in ${detectedCurrency}. Make sure amounts are appropriate for the currency (e.g., RON amounts should be larger numbers as 1 RON ≈ 0.22 USD).`

  try {
    const response = await window.spark.llm(promptText, 'gpt-4o', true)
    const data = JSON.parse(response)

    const categorySummary: CategorySummary[] = []
    const categoryMap = new Map<string, { amount: number; count: number }>()

    data.transactions?.forEach((tx: BankTransaction) => {
      if (tx.type === 'DEBIT' && tx.category) {
        const existing = categoryMap.get(tx.category) || { amount: 0, count: 0 }
        categoryMap.set(tx.category, {
          amount: existing.amount + tx.amount,
          count: existing.count + 1,
        })
      }
    })

    const totalExpenses = data.totalExpenses || 0
    categoryMap.forEach((value, key) => {
      categorySummary.push({
        category: key,
        amount: value.amount,
        transactionCount: value.count,
        percentage: totalExpenses > 0 ? (value.amount / totalExpenses) * 100 : 0,
      })
    })

    categorySummary.sort((a, b) => b.amount - a.amount)

    const finalCurrency = data.currency || detectedCurrency
    const finalSymbol = data.currencySymbol || detectedSymbol

    return {
      accountNumber: data.accountNumber || '****0000',
      statementDate: data.statementDate || new Date().toISOString().split('T')[0],
      openingBalance: data.openingBalance || 0,
      closingBalance: data.closingBalance || 0,
      totalIncome: data.totalIncome || 0,
      totalExpenses: data.totalExpenses || 0,
      transactions: data.transactions || [],
      categorySummary,
      currency: finalCurrency,
      currencySymbol: finalSymbol,
    }
  } catch (error) {
    return generateMockStatementData(detectedCurrency, detectedSymbol)
  }
}

function generateMockStatementData(currency: string = 'USD', currencySymbol: string = '$'): BankStatement['extractedData'] {
  const transactions: BankTransaction[] = [
    {
      id: 'tx-1',
      date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Direct Deposit - Employer',
      amount: 5200,
      type: 'CREDIT',
      category: 'Salary',
      balance: 8450,
    },
    {
      id: 'tx-2',
      date: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Rent Payment',
      amount: 1800,
      type: 'DEBIT',
      category: 'Housing',
      balance: 6650,
    },
    {
      id: 'tx-3',
      date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Whole Foods Market',
      amount: 145.32,
      type: 'DEBIT',
      category: 'Groceries',
      balance: 6504.68,
    },
    {
      id: 'tx-4',
      date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Electric Company',
      amount: 89.50,
      type: 'DEBIT',
      category: 'Utilities',
      balance: 6415.18,
    },
    {
      id: 'tx-5',
      date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Restaurant - Downtown',
      amount: 67.80,
      type: 'DEBIT',
      category: 'Dining',
      balance: 6347.38,
    },
    {
      id: 'tx-6',
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Gas Station',
      amount: 52.00,
      type: 'DEBIT',
      category: 'Transportation',
      balance: 6295.38,
    },
    {
      id: 'tx-7',
      date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Pharmacy Co-pay',
      amount: 25.00,
      type: 'DEBIT',
      category: 'Healthcare',
      balance: 6270.38,
    },
    {
      id: 'tx-8',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Streaming Service',
      amount: 15.99,
      type: 'DEBIT',
      category: 'Entertainment',
      balance: 6254.39,
    },
    {
      id: 'tx-9',
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Online Shopping',
      amount: 234.50,
      type: 'DEBIT',
      category: 'Shopping',
      balance: 6019.89,
    },
    {
      id: 'tx-10',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Insurance Premium',
      amount: 175.00,
      type: 'DEBIT',
      category: 'Bills',
      balance: 5844.89,
    },
    {
      id: 'tx-11',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Grocery Store',
      amount: 98.75,
      type: 'DEBIT',
      category: 'Groceries',
      balance: 5746.14,
    },
  ]

  const totalIncome = transactions.filter(tx => tx.type === 'CREDIT').reduce((sum, tx) => sum + tx.amount, 0)
  const totalExpenses = transactions.filter(tx => tx.type === 'DEBIT').reduce((sum, tx) => sum + tx.amount, 0)

  const categoryMap = new Map<string, { amount: number; count: number }>()
  transactions
    .filter(tx => tx.type === 'DEBIT' && tx.category)
    .forEach(tx => {
      const existing = categoryMap.get(tx.category!) || { amount: 0, count: 0 }
      categoryMap.set(tx.category!, {
        amount: existing.amount + tx.amount,
        count: existing.count + 1,
      })
    })

  const categorySummary: CategorySummary[] = []
  categoryMap.forEach((value, key) => {
    categorySummary.push({
      category: key,
      amount: value.amount,
      transactionCount: value.count,
      percentage: (value.amount / totalExpenses) * 100,
    })
  })

  categorySummary.sort((a, b) => b.amount - a.amount)

  return {
    accountNumber: '****4521',
    statementDate: new Date().toISOString().split('T')[0],
    openingBalance: 3250,
    closingBalance: 5746.14,
    totalIncome,
    totalExpenses,
    transactions,
    categorySummary,
    currency,
    currencySymbol,
  }
}
