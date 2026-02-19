# Multi-Currency Features Demo Guide

## 🌍 Romanian Leu (RON) Detection & Multi-Currency Support

This guide demonstrates how to test the multi-currency features, specifically Romanian Leu (RON) detection from bank statements.

## ✅ How RON Currency Detection Works

The system automatically detects currency from bank statement filenames:

### Supported Detection Patterns
- **RON**: Files containing "ron", "romania", "lei", or "leu" in the filename
- **EUR**: Files containing "eur" or "euro"
- **GBP**: Files containing "gbp", "pound", or "sterling"
- **USD**: Default for other files

### File Naming Examples
✅ **These will detect RON:**
- `bank_statement_RON_january.pdf`
- `statement-romania-2024.pdf`
- `my_bank_lei_account.pdf`
- `BCR_leu_statement.pdf`

✅ **These will detect EUR:**
- `statement_EUR_2024.pdf`
- `euro_account_january.pdf`

## 🎯 Testing Multi-Currency Features

### Step 1: Upload RON Bank Statement

1. **Login** to the application
2. Navigate to **Bank Statements** tab
3. Click the **Upload Bank Statement** area
4. Select ANY file (even a text file) with "RON" in the filename
   - Example: `test_statement_RON.pdf`
5. ✅ **Expected Result**: 
   - File uploads successfully
   - System processes with RON currency
   - Badge shows "RON" currency code
   - Amounts display with "lei" symbol

### Step 2: View Currency-Specific Analytics

After processing completes:

1. **Statement Card** shows:
   - Currency badge with "RON" code
   - Opening/Closing balances in lei
   - Income/Expenses in lei format

2. **Financial Insights Dashboard** displays:
   - All amounts in Romanian Leu
   - "lei" currency symbol used throughout
   - Realistic RON amounts (salaries 8,000-15,000 RON, etc.)

### Step 3: Upload Multiple Currencies

1. Upload another statement with different currency:
   - `statement_EUR_february.pdf`
   - `my_bank_USD.pdf`

2. ✅ **Multi-Currency Options Panel** appears:
   - Shows "2 currencies detected" badge
   - Toggle: "Enable Conversion"
   - Dropdown: "Base Currency" selector
   - Dropdown: "Filter by Currency"

### Step 4: Enable Currency Conversion

1. **Toggle ON**: "Enable Conversion"
2. **Select Base Currency**: USD (or any supported currency)
3. ✅ **System automatically**:
   - Fetches live exchange rates via AI
   - Converts all amounts to USD
   - Shows info message: "All amounts are being converted to USD"
   - Updates all charts and totals

### Step 5: Filter by Specific Currency

1. **Currency Filter dropdown**: Select "RON"
2. ✅ **Analytics updates to show**:
   - Only RON statements
   - Spending only from Romanian accounts
   - Category breakdowns for RON transactions only

## 🎨 Visual Indicators

### Currency Badges
Every processed statement shows:
```
[✓ COMPLETED] | [💱 RON]
```

### Multi-Currency Panel (when detected)
```
💱 Multi-Currency Options
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2 currencies detected]

☑ Enable Conversion
  Base Currency: [USD ▼]
  Filter by Currency: [All Currencies ▼]

ℹ All amounts are being converted to USD using current exchange rates.
```

### Currency Display Formats
- **RON**: `lei 12,500.00 RON`
- **EUR**: `€ 2,500.00 EUR`
- **USD**: `$ 3,200.00 USD`
- **GBP**: `£ 2,100.00 GBP`

## 🔧 Supported Currencies (22 Total)

| Code | Symbol | Name | Detection Keywords |
|------|--------|------|-------------------|
| RON | lei | Romanian Leu | ron, romania, lei, leu |
| EUR | € | Euro | eur, euro |
| USD | $ | US Dollar | usd, dollar (default) |
| GBP | £ | British Pound | gbp, pound, sterling |
| JPY | ¥ | Japanese Yen | jpy, yen |
| CHF | CHF | Swiss Franc | chf, swiss |
| CAD | CA$ | Canadian Dollar | cad, canadian |
| AUD | A$ | Australian Dollar | aud, australian |
| PLN | zł | Polish Złoty | pln, poland, zloty |
| CZK | Kč | Czech Koruna | czk, czech, koruna |
| HUF | Ft | Hungarian Forint | huf, hungary, forint |
| ...and 11 more |  |  |  |

## 🎪 Complete Demo Scenario

### "Romanian Expat with Multi-Currency Finances"

**Story**: Client has accounts in Romania (RON) and US (USD)

1. **Upload first statement**: `BCR_Romania_RON.pdf`
   - ✅ Processes as RON
   - Shows salary: lei 10,000
   - Groceries: lei 450
   - Rent: lei 2,500

2. **Upload second statement**: `Chase_USA_USD.pdf`
   - ✅ Processes as USD
   - Multi-currency panel appears
   - Shows "2 currencies detected"

3. **View Consolidated Analytics**:
   - Enable conversion → Base: USD
   - See total spending across both accounts
   - Compare: "Dining in Romania vs USA"

4. **Navigate to Multi-Currency Tab**:
   - View currency-specific spending trends
   - See exchange rate impacts
   - Filter regional budgets

5. **Export Multi-Currency Report**:
   - Download consolidated CSV/PDF
   - All amounts normalized to USD
   - Source currency preserved in metadata

## 🐛 Troubleshooting

### "Currency shows as USD instead of RON"

**Check:**
- ✅ Filename contains "RON", "romania", "lei", or "leu"
- ✅ Check is case-insensitive
- ✅ Works with underscores, dashes, spaces

**Examples that work:**
- `Statement-RON.pdf` ✅
- `bank_romania_jan.pdf` ✅
- `account_lei.pdf` ✅
- `BCR-leu-2024.pdf` ✅

**Examples that won't work:**
- `statement.pdf` ❌ (defaults to USD)
- `romanian_bank.pdf` ❌ (no keyword match)

### "Multi-currency features not showing"

**Requirements:**
- ✅ Upload statements with DIFFERENT currencies
- ✅ At least one statement must be COMPLETED status
- ✅ Multi-currency panel only appears when 2+ currencies detected

### "Exchange rates not loading"

**Fallback behavior:**
- System uses default exchange rates if AI fails
- Default RON rate: 1 USD = 4.56 RON
- Rates auto-refresh when base currency changes

## 📊 Multi-Currency Features Throughout App

### Portfolio View
- **Multi-Currency Portfolio** card
- View holdings in original currency
- Toggle conversion to see everything in one base currency
- Currency distribution chart

### Goals Tab
- Create goals in any supported currency
- Track multi-currency savings
- AI insights account for currency differences

### Bank Statements Tab
- **Currency-specific spending insights**
- **Multi-currency comparison charts**
- **Regional budget tracking**
- **Spending trends by currency**
- **Export functionality** with conversion options

### Reports & Export
- Multi-currency report export (PDF/CSV)
- Preserve source currency data
- Include exchange rates used
- Conversion methodology notes

## 🎯 Key Success Metrics

After following this guide, you should see:

✅ RON currency badge on uploaded statements
✅ "lei" symbol in all RON transactions
✅ Realistic RON amounts (not USD amounts)
✅ Multi-currency panel when 2+ currencies uploaded
✅ Successful currency conversion toggle
✅ Exchange rates displaying correctly
✅ Filter by currency working
✅ All charts updating with converted amounts

## 💡 Pro Tips

1. **Test with realistic filenames**: Use actual bank names like `BCR_RON.pdf`, `BRD_lei.pdf`
2. **Check the badge**: Currency badge immediately confirms detection
3. **Verify amounts**: RON salaries should be 8,000-15,000, not 3,000-6,000 (USD range)
4. **Use conversion**: Enable it to see all spending in one currency
5. **Try filtering**: Filter to see RON-only or EUR-only spending patterns
