import type { 
  User, 
  ClientProfile, 
  RiskProfile, 
  Goal, 
  Portfolio, 
  Holding, 
  Instrument, 
  ModelPortfolio,
  Transaction,
  AuditEvent
} from './types'

export const SEED_USERS: User[] = [
  { id: 'adv-1', email: 'sarah.chen@wealthdemo.com', name: 'Sarah Chen', role: 'ADVISOR' },
  { id: 'adv-2', email: 'marcus.williams@wealthdemo.com', name: 'Marcus Williams', role: 'ADVISOR' },
  { id: 'adv-3', email: 'elena.rodriguez@wealthdemo.com', name: 'Elena Rodriguez', role: 'ADVISOR' },
  
  { id: 'cli-1', email: 'robert.chen@example.com', name: 'Robert Chen', role: 'CLIENT', advisorId: 'adv-1' },
  { id: 'cli-2', email: 'jennifer.martinez@example.com', name: 'Jennifer Martinez', role: 'CLIENT', advisorId: 'adv-1' },
  { id: 'cli-3', email: 'david.wilson@example.com', name: 'David Wilson', role: 'CLIENT', advisorId: 'adv-1' },
  { id: 'cli-4', email: 'lisa.anderson@example.com', name: 'Lisa Anderson', role: 'CLIENT', advisorId: 'adv-1' },
  
  { id: 'cli-5', email: 'michael.brown@example.com', name: 'Michael Brown', role: 'CLIENT', advisorId: 'adv-2' },
  { id: 'cli-6', email: 'patricia.davis@example.com', name: 'Patricia Davis', role: 'CLIENT', advisorId: 'adv-2' },
  { id: 'cli-7', email: 'james.miller@example.com', name: 'James Miller', role: 'CLIENT', advisorId: 'adv-2' },
  { id: 'cli-8', email: 'mary.johnson@example.com', name: 'Mary Johnson', role: 'CLIENT', advisorId: 'adv-2' },
  
  { id: 'cli-9', email: 'william.garcia@example.com', name: 'William Garcia', role: 'CLIENT', advisorId: 'adv-3' },
  { id: 'cli-10', email: 'barbara.rodriguez@example.com', name: 'Barbara Rodriguez', role: 'CLIENT', advisorId: 'adv-3' },
  { id: 'cli-11', email: 'richard.lee@example.com', name: 'Richard Lee', role: 'CLIENT', advisorId: 'adv-3' },
  { id: 'cli-12', email: 'susan.taylor@example.com', name: 'Susan Taylor', role: 'CLIENT', advisorId: 'adv-3' },
]

export const SEED_CLIENT_PROFILES: ClientProfile[] = [
  { id: 'cp-1', userId: 'cli-1', advisorId: 'adv-1', dateOfBirth: '1975-03-15', phone: '555-0101', address: '123 Market St, San Francisco, CA', segment: 'High Net Worth', onboardingDate: '2020-01-15' },
  { id: 'cp-2', userId: 'cli-2', advisorId: 'adv-1', dateOfBirth: '1982-07-22', phone: '555-0102', address: '456 Oak Ave, Seattle, WA', segment: 'Mass Affluent', onboardingDate: '2021-03-20' },
  { id: 'cp-3', userId: 'cli-3', advisorId: 'adv-1', dateOfBirth: '1968-11-30', phone: '555-0103', address: '789 Pine Rd, Portland, OR', segment: 'High Net Worth', onboardingDate: '2019-06-10' },
  { id: 'cp-4', userId: 'cli-4', advisorId: 'adv-1', dateOfBirth: '1990-05-18', phone: '555-0104', address: '321 Elm St, Austin, TX', segment: 'Emerging Wealth', onboardingDate: '2022-09-05' },
  
  { id: 'cp-5', userId: 'cli-5', advisorId: 'adv-2', dateOfBirth: '1978-09-12', phone: '555-0105', address: '654 Maple Dr, Boston, MA', segment: 'High Net Worth', onboardingDate: '2020-11-22' },
  { id: 'cp-6', userId: 'cli-6', advisorId: 'adv-2', dateOfBirth: '1985-02-28', phone: '555-0106', address: '987 Birch Ln, Denver, CO', segment: 'Mass Affluent', onboardingDate: '2021-07-14' },
  { id: 'cp-7', userId: 'cli-7', advisorId: 'adv-2', dateOfBirth: '1972-12-05', phone: '555-0107', address: '147 Cedar Ct, Chicago, IL', segment: 'Ultra High Net Worth', onboardingDate: '2018-04-30' },
  { id: 'cp-8', userId: 'cli-8', advisorId: 'adv-2', dateOfBirth: '1988-08-19', phone: '555-0108', address: '258 Willow Way, Miami, FL', segment: 'Mass Affluent', onboardingDate: '2022-02-18' },
  
  { id: 'cp-9', userId: 'cli-9', advisorId: 'adv-3', dateOfBirth: '1980-04-07', phone: '555-0109', address: '369 Spruce Ave, Phoenix, AZ', segment: 'High Net Worth', onboardingDate: '2020-08-25' },
  { id: 'cp-10', userId: 'cli-10', advisorId: 'adv-3', dateOfBirth: '1976-10-14', phone: '555-0110', address: '741 Ash Blvd, Atlanta, GA', segment: 'High Net Worth', onboardingDate: '2019-12-03' },
  { id: 'cp-11', userId: 'cli-11', advisorId: 'adv-3', dateOfBirth: '1983-06-21', phone: '555-0111', address: '852 Poplar St, Dallas, TX', segment: 'Mass Affluent', onboardingDate: '2021-05-17' },
  { id: 'cp-12', userId: 'cli-12', advisorId: 'adv-3', dateOfBirth: '1992-01-09', phone: '555-0112', address: '963 Fir Pl, Nashville, TN', segment: 'Emerging Wealth', onboardingDate: '2023-01-10' },
]

export const SEED_RISK_PROFILES: RiskProfile[] = [
  { id: 'rp-1', clientId: 'cli-1', score: 7, category: 'GROWTH', lastUpdated: '2024-11-15', questionnaireVersion: '2.1' },
  { id: 'rp-2', clientId: 'cli-2', score: 5, category: 'BALANCED', lastUpdated: '2024-10-20', questionnaireVersion: '2.1' },
  { id: 'rp-3', clientId: 'cli-3', score: 3, category: 'CONSERVATIVE', lastUpdated: '2024-05-10', questionnaireVersion: '2.0' },
  { id: 'rp-4', clientId: 'cli-4', score: 8, category: 'AGGRESSIVE', lastUpdated: '2024-12-01', questionnaireVersion: '2.1' },
  
  { id: 'rp-5', clientId: 'cli-5', score: 6, category: 'GROWTH', lastUpdated: '2024-09-18', questionnaireVersion: '2.1' },
  { id: 'rp-6', clientId: 'cli-6', score: 4, category: 'MODERATE', lastUpdated: '2024-11-22', questionnaireVersion: '2.1' },
  { id: 'rp-7', clientId: 'cli-7', score: 2, category: 'CONSERVATIVE', lastUpdated: '2024-10-05', questionnaireVersion: '2.1' },
  { id: 'rp-8', clientId: 'cli-8', score: 9, category: 'AGGRESSIVE', lastUpdated: '2024-12-10', questionnaireVersion: '2.1' },
  
  { id: 'rp-9', clientId: 'cli-9', score: 5, category: 'BALANCED', lastUpdated: '2024-08-30', questionnaireVersion: '2.1' },
  { id: 'rp-10', clientId: 'cli-10', score: 4, category: 'MODERATE', lastUpdated: '2024-11-28', questionnaireVersion: '2.1' },
  { id: 'rp-11', clientId: 'cli-11', score: 6, category: 'GROWTH', lastUpdated: '2024-10-12', questionnaireVersion: '2.1' },
  { id: 'rp-12', clientId: 'cli-12', score: 10, category: 'AGGRESSIVE', lastUpdated: '2024-12-05', questionnaireVersion: '2.1' },
]

export const SEED_INSTRUMENTS: Instrument[] = [
  { id: 'ins-1', symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', assetClass: 'EQUITY', currentPrice: 245.50, suitabilityMinRisk: 5, suitabilityMaxRisk: 10, description: 'Broad US equity market exposure' },
  { id: 'ins-2', symbol: 'BND', name: 'Vanguard Total Bond Market ETF', assetClass: 'FIXED_INCOME', currentPrice: 76.20, suitabilityMinRisk: 1, suitabilityMaxRisk: 7, description: 'Broad US bond market exposure' },
  { id: 'ins-3', symbol: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', assetClass: 'EQUITY', currentPrice: 52.80, suitabilityMinRisk: 5, suitabilityMaxRisk: 10, description: 'International developed markets equity' },
  { id: 'ins-4', symbol: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', assetClass: 'EQUITY', currentPrice: 44.30, suitabilityMinRisk: 7, suitabilityMaxRisk: 10, description: 'Emerging markets equity' },
  { id: 'ins-5', symbol: 'CASH', name: 'Cash & Money Market', assetClass: 'CASH', currentPrice: 1.00, suitabilityMinRisk: 1, suitabilityMaxRisk: 10, description: 'Liquid cash holdings' },
  
  { id: 'ins-6', symbol: 'AGG', name: 'iShares Core US Aggregate Bond ETF', assetClass: 'FIXED_INCOME', currentPrice: 101.50, suitabilityMinRisk: 1, suitabilityMaxRisk: 6, description: 'Investment-grade US bonds' },
  { id: 'ins-7', symbol: 'VNQ', name: 'Vanguard Real Estate ETF', assetClass: 'REAL_ESTATE', currentPrice: 88.90, suitabilityMinRisk: 4, suitabilityMaxRisk: 9, description: 'US real estate investment trusts' },
  { id: 'ins-8', symbol: 'QQQ', name: 'Invesco QQQ Trust', assetClass: 'EQUITY', currentPrice: 425.75, suitabilityMinRisk: 7, suitabilityMaxRisk: 10, description: 'Nasdaq-100 technology stocks' },
  { id: 'ins-9', symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', assetClass: 'FIXED_INCOME', currentPrice: 92.40, suitabilityMinRisk: 1, suitabilityMaxRisk: 5, description: 'Long-term US Treasury bonds' },
  { id: 'ins-10', symbol: 'GLD', name: 'SPDR Gold Shares', assetClass: 'ALTERNATIVE', currentPrice: 185.20, suitabilityMinRisk: 3, suitabilityMaxRisk: 10, description: 'Physical gold holdings' },
  
  { id: 'ins-11', symbol: 'VTV', name: 'Vanguard Value ETF', assetClass: 'EQUITY', currentPrice: 156.30, suitabilityMinRisk: 5, suitabilityMaxRisk: 9, description: 'US large-cap value stocks' },
  { id: 'ins-12', symbol: 'VUG', name: 'Vanguard Growth ETF', assetClass: 'EQUITY', currentPrice: 325.60, suitabilityMinRisk: 6, suitabilityMaxRisk: 10, description: 'US large-cap growth stocks' },
  { id: 'ins-13', symbol: 'VIG', name: 'Vanguard Dividend Appreciation ETF', assetClass: 'EQUITY', currentPrice: 178.90, suitabilityMinRisk: 4, suitabilityMaxRisk: 8, description: 'Dividend growth stocks' },
  { id: 'ins-14', symbol: 'VCIT', name: 'Vanguard Intermediate-Term Corp Bond ETF', assetClass: 'FIXED_INCOME', currentPrice: 85.70, suitabilityMinRisk: 2, suitabilityMaxRisk: 7, description: 'Investment-grade corporate bonds' },
  { id: 'ins-15', symbol: 'VXUS', name: 'Vanguard Total International Stock ETF', assetClass: 'EQUITY', currentPrice: 63.40, suitabilityMinRisk: 5, suitabilityMaxRisk: 10, description: 'Total international equity' },
]

export const SEED_MODEL_PORTFOLIOS: ModelPortfolio[] = [
  {
    id: 'mp-1',
    name: 'Conservative',
    description: 'Capital preservation with modest growth',
    minRiskScore: 1,
    maxRiskScore: 3,
    allocations: [
      { assetClass: 'EQUITY', targetPercentage: 20 },
      { assetClass: 'FIXED_INCOME', targetPercentage: 65 },
      { assetClass: 'CASH', targetPercentage: 10 },
      { assetClass: 'ALTERNATIVE', targetPercentage: 5 },
    ]
  },
  {
    id: 'mp-2',
    name: 'Moderate',
    description: 'Balanced approach with stability focus',
    minRiskScore: 4,
    maxRiskScore: 4,
    allocations: [
      { assetClass: 'EQUITY', targetPercentage: 40 },
      { assetClass: 'FIXED_INCOME', targetPercentage: 50 },
      { assetClass: 'CASH', targetPercentage: 5 },
      { assetClass: 'ALTERNATIVE', targetPercentage: 5 },
    ]
  },
  {
    id: 'mp-3',
    name: 'Balanced',
    description: 'Equal emphasis on growth and stability',
    minRiskScore: 5,
    maxRiskScore: 5,
    allocations: [
      { assetClass: 'EQUITY', targetPercentage: 60 },
      { assetClass: 'FIXED_INCOME', targetPercentage: 30 },
      { assetClass: 'CASH', targetPercentage: 5 },
      { assetClass: 'ALTERNATIVE', targetPercentage: 5 },
    ]
  },
  {
    id: 'mp-4',
    name: 'Growth',
    description: 'Growth-oriented with measured risk',
    minRiskScore: 6,
    maxRiskScore: 7,
    allocations: [
      { assetClass: 'EQUITY', targetPercentage: 75 },
      { assetClass: 'FIXED_INCOME', targetPercentage: 15 },
      { assetClass: 'CASH', targetPercentage: 5 },
      { assetClass: 'ALTERNATIVE', targetPercentage: 5 },
    ]
  },
  {
    id: 'mp-5',
    name: 'Aggressive',
    description: 'Maximum growth potential',
    minRiskScore: 8,
    maxRiskScore: 10,
    allocations: [
      { assetClass: 'EQUITY', targetPercentage: 90 },
      { assetClass: 'FIXED_INCOME', targetPercentage: 5 },
      { assetClass: 'CASH', targetPercentage: 2 },
      { assetClass: 'ALTERNATIVE', targetPercentage: 3 },
    ]
  },
  {
    id: 'mp-6',
    name: 'Income Focus',
    description: 'Dividend and interest income generation',
    minRiskScore: 3,
    maxRiskScore: 6,
    allocations: [
      { assetClass: 'EQUITY', targetPercentage: 35 },
      { assetClass: 'FIXED_INCOME', targetPercentage: 50 },
      { assetClass: 'REAL_ESTATE', targetPercentage: 10 },
      { assetClass: 'CASH', targetPercentage: 5 },
    ]
  },
]

function generatePortfolioHoldings(clientId: string, riskScore: number): { portfolio: Portfolio; holdings: Holding[]; transactions: Transaction[] } {
  const baseValue = clientId === 'cli-1' ? 1250000 :
                    clientId === 'cli-2' ? 850000 :
                    clientId === 'cli-3' ? 450000 :
                    clientId === 'cli-7' ? 3500000 :
                    clientId === 'cli-10' ? 725000 :
                    Math.floor(Math.random() * 800000) + 300000

  const cashPercentage = clientId === 'cli-1' ? 0.12 :
                         clientId === 'cli-5' ? 0.15 :
                         0.05

  const cash = baseValue * cashPercentage
  const investedValue = baseValue - cash

  const portfolioId = `port-${clientId}`
  
  const holdings: Holding[] = []
  const transactions: Transaction[] = []
  let accumulatedValue = 0

  const primaryInstruments = riskScore >= 8 ? ['ins-1', 'ins-8', 'ins-12', 'ins-4'] :
                             riskScore >= 6 ? ['ins-1', 'ins-3', 'ins-11', 'ins-13'] :
                             riskScore >= 4 ? ['ins-1', 'ins-2', 'ins-6', 'ins-13'] :
                             ['ins-2', 'ins-6', 'ins-9', 'ins-13']

  if (clientId === 'cli-3') {
    const concentrated = SEED_INSTRUMENTS.find(i => i.id === 'ins-8')!
    const qty = Math.floor((investedValue * 0.45) / concentrated.currentPrice)
    holdings.push({
      id: `hold-${portfolioId}-conc`,
      portfolioId,
      instrumentId: concentrated.id,
      quantity: qty,
      averageCost: concentrated.currentPrice * 0.92,
      currentPrice: concentrated.currentPrice,
      lastUpdated: new Date().toISOString(),
    })
    accumulatedValue += qty * concentrated.currentPrice

    transactions.push({
      id: `txn-${portfolioId}-conc`,
      portfolioId,
      instrumentId: concentrated.id,
      type: 'BUY',
      quantity: qty,
      price: concentrated.currentPrice * 0.92,
      amount: qty * concentrated.currentPrice * 0.92,
      timestamp: '2024-03-15T10:30:00Z',
    })
  }

  primaryInstruments.forEach((insId, idx) => {
    const instrument = SEED_INSTRUMENTS.find(i => i.id === insId)!
    const allocation = clientId === 'cli-3' ? (investedValue - accumulatedValue) / (primaryInstruments.length - 1) : investedValue / primaryInstruments.length
    const qty = Math.floor(allocation / instrument.currentPrice)
    
    if (qty > 0) {
      holdings.push({
        id: `hold-${portfolioId}-${idx}`,
        portfolioId,
        instrumentId: instrument.id,
        quantity: qty,
        averageCost: instrument.currentPrice * (0.88 + Math.random() * 0.15),
        currentPrice: instrument.currentPrice,
        lastUpdated: new Date().toISOString(),
      })

      transactions.push({
        id: `txn-${portfolioId}-${idx}-1`,
        portfolioId,
        instrumentId: instrument.id,
        type: 'BUY',
        quantity: Math.floor(qty * 0.6),
        price: instrument.currentPrice * 0.90,
        amount: Math.floor(qty * 0.6) * instrument.currentPrice * 0.90,
        timestamp: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      })

      transactions.push({
        id: `txn-${portfolioId}-${idx}-2`,
        portfolioId,
        instrumentId: instrument.id,
        type: 'BUY',
        quantity: qty - Math.floor(qty * 0.6),
        price: instrument.currentPrice * 0.95,
        amount: (qty - Math.floor(qty * 0.6)) * instrument.currentPrice * 0.95,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }
  })

  const totalValue = cash + holdings.reduce((sum, h) => {
    const instrument = SEED_INSTRUMENTS.find(i => i.id === h.instrumentId)!
    return sum + (h.quantity * instrument.currentPrice)
  }, 0)

  return {
    portfolio: {
      id: portfolioId,
      clientId,
      cash,
      totalValue,
      lastUpdated: new Date().toISOString(),
    },
    holdings,
    transactions,
  }
}

export function generateSeedData() {
  const allPortfolios: Portfolio[] = []
  const allHoldings: Holding[] = []
  const allTransactions: Transaction[] = []

  SEED_RISK_PROFILES.forEach(rp => {
    const { portfolio, holdings, transactions } = generatePortfolioHoldings(rp.clientId, rp.score)
    allPortfolios.push(portfolio)
    allHoldings.push(...holdings)
    allTransactions.push(...transactions)
  })

  return {
    portfolios: allPortfolios,
    holdings: allHoldings,
    transactions: allTransactions,
  }
}

export const SEED_GOALS: Goal[] = [
  {
    id: 'goal-1',
    clientId: 'cli-1',
    type: 'RETIREMENT',
    name: 'Retirement at 65',
    targetAmount: 3000000,
    currentAmount: 850000,
    targetDate: '2034-03-15',
    monthlyContribution: 5000,
    createdAt: '2020-01-15T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
    progressHistory: [
      { id: 'snap-1-1', goalId: 'goal-1', timestamp: '2024-06-01T00:00:00Z', currentAmount: 780000, targetAmount: 3000000, monthlyContribution: 5000, projectedCompletion: '2034-03-15' },
      { id: 'snap-1-2', goalId: 'goal-1', timestamp: '2024-08-01T00:00:00Z', currentAmount: 800000, targetAmount: 3000000, monthlyContribution: 5000, projectedCompletion: '2034-02-10' },
      { id: 'snap-1-3', goalId: 'goal-1', timestamp: '2024-10-01T00:00:00Z', currentAmount: 825000, targetAmount: 3000000, monthlyContribution: 5000, projectedCompletion: '2034-01-20' },
      { id: 'snap-1-4', goalId: 'goal-1', timestamp: '2024-12-01T00:00:00Z', currentAmount: 850000, targetAmount: 3000000, monthlyContribution: 5000, projectedCompletion: '2034-01-01' },
    ],
  },
  {
    id: 'goal-2',
    clientId: 'cli-1',
    type: 'EDUCATION',
    name: "Children's College Fund",
    targetAmount: 200000,
    currentAmount: 120000,
    targetDate: '2030-09-01',
    monthlyContribution: 1500,
    createdAt: '2020-06-10T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
    progressHistory: [
      { id: 'snap-2-1', goalId: 'goal-2', timestamp: '2024-06-01T00:00:00Z', currentAmount: 108000, targetAmount: 200000, monthlyContribution: 1500, projectedCompletion: '2030-09-01' },
      { id: 'snap-2-2', goalId: 'goal-2', timestamp: '2024-08-01T00:00:00Z', currentAmount: 112000, targetAmount: 200000, monthlyContribution: 1500, projectedCompletion: '2030-08-15' },
      { id: 'snap-2-3', goalId: 'goal-2', timestamp: '2024-10-01T00:00:00Z', currentAmount: 116000, targetAmount: 200000, monthlyContribution: 1500, projectedCompletion: '2030-08-01' },
      { id: 'snap-2-4', goalId: 'goal-2', timestamp: '2024-12-01T00:00:00Z', currentAmount: 120000, targetAmount: 200000, monthlyContribution: 1500, projectedCompletion: '2030-07-15' },
    ],
  },
  {
    id: 'goal-3',
    clientId: 'cli-2',
    type: 'HOUSE',
    name: 'Vacation Home Down Payment',
    targetAmount: 150000,
    currentAmount: 45000,
    targetDate: '2027-06-01',
    monthlyContribution: 3000,
    createdAt: '2021-03-20T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
    progressHistory: [
      { id: 'snap-3-1', goalId: 'goal-3', timestamp: '2024-06-01T00:00:00Z', currentAmount: 30000, targetAmount: 150000, monthlyContribution: 2500, projectedCompletion: '2027-08-01' },
      { id: 'snap-3-2', goalId: 'goal-3', timestamp: '2024-08-01T00:00:00Z', currentAmount: 35000, targetAmount: 150000, monthlyContribution: 2500, projectedCompletion: '2027-07-15' },
      { id: 'snap-3-3', goalId: 'goal-3', timestamp: '2024-10-01T00:00:00Z', currentAmount: 40000, targetAmount: 150000, monthlyContribution: 3000, projectedCompletion: '2027-06-20' },
      { id: 'snap-3-4', goalId: 'goal-3', timestamp: '2024-12-01T00:00:00Z', currentAmount: 45000, targetAmount: 150000, monthlyContribution: 3000, projectedCompletion: '2027-06-01' },
    ],
  },
  {
    id: 'goal-4',
    clientId: 'cli-3',
    type: 'RETIREMENT',
    name: 'Early Retirement',
    targetAmount: 2500000,
    currentAmount: 450000,
    targetDate: '2028-11-30',
    monthlyContribution: 8000,
    createdAt: '2019-06-10T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
    progressHistory: [
      { id: 'snap-4-1', goalId: 'goal-4', timestamp: '2024-06-01T00:00:00Z', currentAmount: 402000, targetAmount: 2500000, monthlyContribution: 8000, projectedCompletion: '2029-01-15' },
      { id: 'snap-4-2', goalId: 'goal-4', timestamp: '2024-08-01T00:00:00Z', currentAmount: 418000, targetAmount: 2500000, monthlyContribution: 8000, projectedCompletion: '2028-12-20' },
      { id: 'snap-4-3', goalId: 'goal-4', timestamp: '2024-10-01T00:00:00Z', currentAmount: 434000, targetAmount: 2500000, monthlyContribution: 8000, projectedCompletion: '2028-12-10' },
      { id: 'snap-4-4', goalId: 'goal-4', timestamp: '2024-12-01T00:00:00Z', currentAmount: 450000, targetAmount: 2500000, monthlyContribution: 8000, projectedCompletion: '2028-11-30' },
    ],
  },
]
