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

const PRINTABLE_ASCII_START = 0x20
const PRINTABLE_ASCII_END = 0x7e
const LINE_FEED = 0x0a
const CARRIAGE_RETURN = 0x0d
const TAB = 0x09
const MIN_RUN_LENGTH = 4
const MIN_EXTRACTED_TEXT_LENGTH = 50
const MAX_EXTRACTED_TEXT_LENGTH = 8000

async function readFileAsText(file: File): Promise<string | null> {
  try {
    // For CSV, TXT, and other plaintext formats: use native text decoding (handles UTF-8)
    if (
      file.type.startsWith('text/') ||
      file.name.match(/\.(csv|txt|tsv|json)$/i)
    ) {
      return await file.text()
    }

    // For PDF and other binary formats: attempt UTF-8 decoding first, then fall back to ASCII extraction
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // Try to extract UTF-8 text segments (handles Romanian and other diacritics)
    let text = ''
    let run = ''
    let i = 0
    while (i < bytes.length) {
      const c = bytes[i]
      // Detect start of UTF-8 multi-byte sequence (2-4 bytes)
      if (c >= 0xC2 && c <= 0xF4 && i + 1 < bytes.length) {
        const bytes2 = bytes[i + 1]
        if ((bytes2 & 0xC0) === 0x80) {
          // Valid continuation byte: decode the character
          let codePoint = 0
          let seqLen = 0
          if ((c & 0xE0) === 0xC0) {
            codePoint = c & 0x1F
            seqLen = 2
          } else if ((c & 0xF0) === 0xE0) {
            codePoint = c & 0x0F
            seqLen = 3
          } else if ((c & 0xF8) === 0xF0) {
            codePoint = c & 0x07
            seqLen = 4
          }
          let valid = seqLen > 0
          for (let k = 1; k < seqLen && valid; k++) {
            if (i + k >= bytes.length || (bytes[i + k] & 0xC0) !== 0x80) {
              valid = false
              break
            }
            codePoint = (codePoint << 6) | (bytes[i + k] & 0x3F)
          }
          if (valid && codePoint > 0x1F) {
            run += String.fromCodePoint(codePoint)
            i += seqLen
            continue
          }
        }
      }
      // Standard printable ASCII / control characters
      if (
        (c >= PRINTABLE_ASCII_START && c <= PRINTABLE_ASCII_END) ||
        c === LINE_FEED || c === CARRIAGE_RETURN || c === TAB
      ) {
        run += String.fromCharCode(c)
      } else {
        if (run.length >= MIN_RUN_LENGTH) text += run + ' '
        run = ''
      }
      i++
    }
    if (run.length >= MIN_RUN_LENGTH) text += run

    // Clean up and limit size
    const cleaned = text.replace(/\s{3,}/g, '  ').trim()
    if (cleaned.length < MIN_EXTRACTED_TEXT_LENGTH) return null
    const candidate = cleaned.substring(0, MAX_EXTRACTED_TEXT_LENGTH)
    // Only return text that contains recognisable financial content;
    // raw PDF binary rendered as ASCII would not pass this check.
    return hasFinancialContent(candidate) ? candidate : null
  } catch (error) {
    console.error('readFileAsText error:', error)
    return null
  }
}

/**
 * Returns true when the extracted text contains at least one financial
 * keyword or a number that looks like a monetary amount.  This filters
 * out garbage runs from compressed/binary PDF sections.
 */
function hasFinancialContent(text: string): boolean {
  const lower = text.toLowerCase()
  const financialKeywords = [
    'balance', 'transaction', 'account', 'statement',
    'debit', 'credit', 'payment', 'deposit', 'withdrawal',
    'amount', 'date', 'total', 'income', 'expense',
    // Romanian equivalents already covered by detectCurrencyFromContent
    'sold', 'cont', 'tranzac', 'extras',
  ]
  if (financialKeywords.some(k => lower.includes(k))) return true
  // Fallback: a string with a decimal number (e.g. "1,234.56" or "1234.56")
  return /\d{1,3}[,.]?\d{3}[.,]\d{2}/.test(text) || /\d+\.\d{2}/.test(text)
}

/**
 * Detect currency from document content by scanning for language/bank-specific keywords.
 * This supplements filename-based detection for documents where the filename doesn't hint the currency.
 */
function detectCurrencyFromContent(content: string): { currency: string; symbol: string } | null {
  const c = content.toLowerCase()

  // Romanian patterns: bank names, Romanian-specific financial terms, currency labels
  if (
    c.includes('banca transilvania') || c.includes('bancatransilvania') ||
    c.includes('brd - groupe') || c.includes('brd groupe') || c.includes('brd bank') ||
    c.includes('banca comerciala romana') || c.includes('bcr ') ||
    c.includes('raiffeisen bank') || c.includes('ing bank romania') ||
    c.includes('unicredit tiriac') || c.includes('alpha bank romania') ||
    c.includes('cec bank') || c.includes('garanti bank') ||
    c.includes('extras de cont') || c.includes('extras cont') ||
    c.includes('sold initial') || c.includes('sold final') || c.includes('sold curent') ||
    c.includes('rulaj creditor') || c.includes('rulaj debitor') ||
    c.includes('data tranzactie') || c.includes('data valutei') ||
    c.includes('descriere tranzactie') || c.includes('numar cont') ||
    c.includes('nr. cont') || c.includes('nr cont') ||
    c.includes('cod iban') || c.includes('nr. card') ||
    c.includes('plata') || c.includes('incasare') || c.includes('retragere') ||
    c.includes('comision') || c.includes('transfer interbancar') ||
    c.includes('pentru perioada') || c.includes('perioada:') ||
    /\bron\b/.test(c) || /\blei\b/.test(c) ||
    /\d+[.,]\d{2}\s*ron\b/i.test(content) || /\d+[.,]\d{2}\s*lei\b/i.test(content)
  ) {
    return { currency: 'RON', symbol: 'lei' }
  }

  // Euro patterns
  if (
    c.includes('banque de france') || c.includes('deutsche bank') ||
    c.includes('ing bank n.v') || c.includes('societe generale') ||
    c.includes('eur ') || c.includes(' euro ') ||
    /\d+[.,]\d{2}\s*eur\b/i.test(content) || /€\s*\d/.test(content)
  ) {
    return { currency: 'EUR', symbol: '€' }
  }

  // GBP patterns
  if (
    c.includes('barclays') || c.includes('lloyds') || c.includes('natwest') ||
    c.includes('hsbc uk') || c.includes('santander uk') ||
    c.includes('sort code') || c.includes('gbp ') ||
    /£\s*\d/.test(content) || /\d+[.,]\d{2}\s*gbp\b/i.test(content)
  ) {
    return { currency: 'GBP', symbol: '£' }
  }

  return null
}

async function extractDataWithAI(file: File): Promise<BankStatement['extractedData']> {
  const fileName = file.name.toLowerCase()

  // Try to read the actual file content for OCR/extraction
  const fileContent = await readFileAsText(file)

  let detectedCurrency = ''
  let detectedSymbol = ''
  
  // Step 1: Detect currency from filename
  if (
    fileName.includes('ron') || fileName.includes('romania') ||
    fileName.includes('lei') || fileName.includes('leu') ||
    fileName.includes('brd') || fileName.includes('bcr') ||
    fileName.includes('banca-transilvania') || fileName.includes('bancatransilvania') ||
    fileName.includes('bt_') || fileName.includes('_bt') ||
    fileName.includes('raiffeisen') || fileName.includes('ing-ro') ||
    fileName.includes('unicredit-ro') || fileName.includes('alpha-bank') ||
    fileName.includes('extras') || fileName.includes('cont_curent') ||
    fileName.includes('extras_de_cont')
  ) {
    detectedCurrency = 'RON'
    detectedSymbol = 'lei'
  } else if (fileName.includes('eur') || fileName.includes('euro')) {
    detectedCurrency = 'EUR'
    detectedSymbol = '€'
  } else if (fileName.includes('gbp') || fileName.includes('pound') || fileName.includes('sterling')) {
    detectedCurrency = 'GBP'
    detectedSymbol = '£'
  } else if (fileName.includes('jpy') || fileName.includes('yen')) {
    detectedCurrency = 'JPY'
    detectedSymbol = '¥'
  } else if (fileName.includes('chf') || fileName.includes('swiss')) {
    detectedCurrency = 'CHF'
    detectedSymbol = 'CHF'
  } else if (fileName.includes('cad') || fileName.includes('canadian')) {
    detectedCurrency = 'CAD'
    detectedSymbol = 'CA$'
  } else if (fileName.includes('aud') || fileName.includes('australian')) {
    detectedCurrency = 'AUD'
    detectedSymbol = 'A$'
  } else if (fileName.includes('pln') || fileName.includes('poland') || fileName.includes('zloty')) {
    detectedCurrency = 'PLN'
    detectedSymbol = 'zł'
  } else if (fileName.includes('czk') || fileName.includes('czech') || fileName.includes('koruna')) {
    detectedCurrency = 'CZK'
    detectedSymbol = 'Kč'
  } else if (fileName.includes('huf') || fileName.includes('hungary') || fileName.includes('forint')) {
    detectedCurrency = 'HUF'
    detectedSymbol = 'Ft'
  } else if (fileName.includes('usd') || fileName.includes('dollar')) {
    detectedCurrency = 'USD'
    detectedSymbol = '$'
  }

  // Step 2: If filename gave no clue, try to detect currency from document content
  if (!detectedCurrency && fileContent) {
    const contentDetected = detectCurrencyFromContent(fileContent)
    if (contentDetected) {
      detectedCurrency = contentDetected.currency
      detectedSymbol = contentDetected.symbol
    }
  }

  const currencyInstructionBlock = detectedCurrency
    ? `⚠️ CRITICAL: CURRENCY DETECTION REQUIREMENTS ⚠️
The document analysis strongly indicates the currency is: ${detectedCurrency}

MANDATORY CURRENCY RULES:
1. The currency MUST be set to: ${detectedCurrency}
2. The currency symbol MUST be set to: ${detectedSymbol}
3. DO NOT change or override these currency values under any circumstances
4. All amounts in the JSON must reflect the original ${detectedCurrency} values from the document`
    : `⚠️ IMPORTANT: AUTO-DETECT CURRENCY FROM CONTENT ⚠️
Detect the currency from the document content. Carefully look for:
- Currency symbols in amounts (€, £, $, lei, RON, USD, EUR, GBP, etc.)
- Document language: Romanian text → RON (lei), English/US → USD, etc.
- Bank names: "Banca Transilvania", "BRD", "BCR", "Raiffeisen" → RON; "Barclays", "NatWest" → GBP
- Romanian financial terms: "extras de cont", "sold", "rulaj", "data tranzactiei" → RON
Set the currency and currencySymbol fields accordingly. DO NOT default to USD if clear evidence of another currency exists.`

  const exampleCurrency = detectedCurrency || 'USD'
  const exampleSymbol = detectedSymbol || '$'

  const documentSection = fileContent
    ? `\nDOCUMENT CONTENT (extracted from the uploaded file — use this data accurately):\n---\n${fileContent}\n---\n\nCRITICAL EXTRACTION RULES:
1. Extract ALL real data directly from the document above — account numbers, dates, descriptions, amounts.
2. Preserve the EXACT amounts as they appear in the document (do not convert or scale them).
3. Only estimate fields that are genuinely absent from the document.
4. If the document is in Romanian, all fields (descriptions, categories) should reflect that context.
5. Detect the document language from the content and use it to guide extraction.
6. If the document contains Romanian text (e.g., "extras de cont", "sold", "data", "plata"), treat all amounts as RON.
7. For scanned/image PDFs where text quality is poor, infer the structure from visible keywords and return best-effort data with empty transactions array if amounts cannot be reliably read.`
    : `\nNote: The document content could not be extracted automatically (possibly an image-based or scanned PDF). Based on the filename "${file.name}" and the currency/language rules above, do your best to detect the currency and return an empty transaction list with zeroed balances. Do NOT invent transaction amounts or details.`

  const promptText = `You are a financial data extraction AI analyzing a bank statement file named "${file.name}".

${currencyInstructionBlock}
${documentSection}

Extract the following information from the bank statement:
- Account number (mask all but last 4 digits as ****XXXX)
- Statement date
- Opening balance
- Closing balance
- All transactions with:
  * Unique transaction IDs (format: tx-1, tx-2, etc.)
  * Date of each transaction
  * Description / merchant name
  * Amount (always positive)
  * Type: CREDIT (income/deposit) or DEBIT (expense/withdrawal)
  * Category from: Salary, Groceries, Utilities, Dining, Transportation, Healthcare, Entertainment, Shopping, Bills, Transfers, Rent, Insurance, Housing
  * Running balance after each transaction
- Total income (sum of all CREDIT transactions)
- Total expenses (sum of all DEBIT transactions)

Return ONLY a valid JSON object with this EXACT structure (no additional text):
{
  "accountNumber": "****1234",
  "statementDate": "2024-01-15",
  "openingBalance": 5000,
  "closingBalance": 6500,
  "totalIncome": 8000,
  "totalExpenses": 6500,
  "currency": "${exampleCurrency}",
  "currencySymbol": "${exampleSymbol}",
  "transactions": [
    {
      "id": "tx-1",
      "date": "2024-01-15",
      "description": "Salary Payment - Employer Name",
      "amount": 8000,
      "type": "CREDIT",
      "category": "Salary",
      "balance": 13000
    },
    {
      "id": "tx-2",
      "date": "2024-01-16",
      "description": "Supermarket Name",
      "amount": 250,
      "type": "DEBIT",
      "category": "Groceries",
      "balance": 12750
    }
  ]
}${detectedCurrency ? `\n\nREMINDER: The currency field MUST be "${detectedCurrency}" and currencySymbol MUST be "${detectedSymbol}". Do not change these values.` : '\n\nREMINDER: Detect the currency from the document content and set the currency and currencySymbol fields correctly.'}`

  try {
    const response = await window.spark.llm(promptText, 'gpt-4o', true)
    // Extract JSON from the response, handling several common LLM output formats:
    //   1. Pure JSON
    //   2. JSON wrapped in markdown code fences (```json ... ```)
    //   3. JSON embedded in prose ("Here is the data: { ... }")
    //   4. JSON followed by a trailing note ("{ ... }\nNote: ...")
    let jsonStr = response.trim()
    const mdMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (mdMatch) {
      jsonStr = mdMatch[1].trim()
    } else {
      // Find the first '{' and the matching last '}' to isolate the JSON object
      const start = jsonStr.indexOf('{')
      const end = jsonStr.lastIndexOf('}')
      if (start !== -1 && end !== -1 && end > start) {
        jsonStr = jsonStr.substring(start, end + 1)
      }
    }
    const data = JSON.parse(jsonStr)

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

    // Use pre-detected currency (from filename/content) first, then AI-detected, then fallback
    // Pre-detected currency takes absolute priority to ensure correct currency display
    const finalCurrency = detectedCurrency || data.currency || 'USD'
    const finalSymbol = detectedSymbol || data.currencySymbol || '$'

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
    console.error('AI extraction failed:', error)
    throw new Error('Failed to extract data from bank statement. Please ensure it\'s a valid bank statement and try again.')
  }
}
