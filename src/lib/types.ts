export type UserRole = 'ADVISOR' | 'CLIENT'

export type RiskCategory = 'CONSERVATIVE' | 'MODERATE' | 'BALANCED' | 'GROWTH' | 'AGGRESSIVE'

export type AssetClass = 'EQUITY' | 'FIXED_INCOME' | 'CASH' | 'ALTERNATIVE' | 'REAL_ESTATE'

export type GoalType = 'RETIREMENT' | 'HOUSE' | 'EDUCATION' | 'LIFE_EVENT' | 'OTHER'

export type OrderType = 'MARKET' | 'LIMIT'

export type OrderSide = 'BUY' | 'SELL'

export type OrderStatus = 'PENDING' | 'VALIDATED' | 'EXECUTING' | 'EXECUTED' | 'FAILED' | 'CANCELLED'

export type ActionType = 
  | 'REFRESH_RISK_PROFILE'
  | 'INCREASE_CONTRIBUTION'
  | 'REBALANCE_PORTFOLIO'
  | 'INVEST_CASH'

export type AuditEventType =
  | 'RISK_PROFILE_UPDATED'
  | 'GOAL_CREATED'
  | 'GOAL_UPDATED'
  | 'ORDER_CREATED'
  | 'ORDER_EXECUTED'
  | 'ORDER_FAILED'
  | 'MODEL_RECOMMENDATION_CHANGED'
  | 'AI_INTERACTION'
  | 'LOGIN'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  advisorId?: string
}

export interface ClientProfile {
  id: string
  userId: string
  advisorId: string
  dateOfBirth: string
  phone: string
  address: string
  segment: string
  onboardingDate: string
}

export interface RiskProfile {
  id: string
  clientId: string
  score: number
  category: RiskCategory
  lastUpdated: string
  questionnaireVersion: string
}

export interface GoalMilestone {
  id: string
  goalId: string
  percentage: number
  achievedAt?: string
  celebrated: boolean
}

export interface GoalProgressSnapshot {
  id: string
  goalId: string
  timestamp: string
  currentAmount: number
  targetAmount: number
  monthlyContribution: number
  projectedCompletion: string
}

export interface GoalFeedback {
  id: string
  goalId: string
  sharedWithEmail: string
  sharedWithName: string
  message?: string
  sentiment: 'SUPPORTIVE' | 'CONCERNED' | 'NEUTRAL'
  createdAt: string
  readAt?: string
}

export interface GoalDependency {
  id: string
  goalId: string
  dependsOnGoalId: string
  relationshipType: 'BLOCKS' | 'ENABLES' | 'RELATED'
  description: string
}

export interface FamilyMember {
  id: string
  name: string
  email: string
  avatarUrl?: string
  monthlyContribution: number
  totalContributed: number
  lastContributionDate?: string
}

export interface FamilyGoal {
  goalId: string
  isFamily: boolean
  members: FamilyMember[]
  createdBy: string
}

export interface GoalOptimization {
  id: string
  goalId: string
  type: 'REALLOCATION' | 'CONTRIBUTION_INCREASE' | 'TIMELINE_ADJUSTMENT' | 'RISK_ALIGNMENT' | 'TAX_OPTIMIZATION'
  title: string
  description: string
  currentMonthly: number
  suggestedMonthly: number
  potentialGain: number
  reasoning: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  acceptedAt?: string
  rejectedAt?: string
  createdAt: string
}

export interface GoalNotification {
  id: string
  goalId: string
  userId: string
  type: 'MILESTONE' | 'CONTRIBUTION' | 'SHARED_FEEDBACK' | 'OPTIMIZATION' | 'PRIORITY_CHANGE'
  title: string
  message: string
  read: boolean
  actionUrl?: string
  createdAt: string
  readAt?: string
}

export interface GoalPriority {
  goalId: string
  rank: number
  autoRanked: boolean
  reasoning?: string
  lastUpdated: string
}

export interface BankStatement {
  id: string
  userId: string
  fileName: string
  uploadedAt: string
  processedAt?: string
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
  extractedData?: {
    accountNumber?: string
    statementDate?: string
    openingBalance?: number
    closingBalance?: number
    totalIncome?: number
    totalExpenses?: number
    transactions?: BankTransaction[]
    categorySummary?: CategorySummary[]
    currency?: string
    currencySymbol?: string
  }
  errorMessage?: string
}

export interface BankTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'CREDIT' | 'DEBIT'
  category?: string
  balance?: number
}

export interface CategorySummary {
  category: string
  amount: number
  transactionCount: number
  percentage: number
}

export interface CategoryBudget {
  category: string
  monthlyLimit: number
  alertThreshold: number
}

export interface SpendingAlert {
  id: string
  userId: string
  category: string
  currentSpending: number
  budgetLimit: number
  threshold: number
  percentage: number
  severity: 'WARNING' | 'CRITICAL'
  statementIds: string[]
  createdAt: string
  dismissed: boolean
}

export interface Goal {
  id: string
  clientId: string
  type: GoalType
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  monthlyContribution: number
  createdAt: string
  updatedAt: string
  milestones?: GoalMilestone[]
  isCustom?: boolean
  progressHistory?: GoalProgressSnapshot[]
  sharedWith?: GoalFeedback[]
  dependencies?: GoalDependency[]
  familyGoal?: FamilyGoal
  lifeEventType?: string
  optimizations?: GoalOptimization[]
  priority?: GoalPriority
}

export interface Portfolio {
  id: string
  clientId: string
  cash: number
  totalValue: number
  lastUpdated: string
}

export interface Holding {
  id: string
  portfolioId: string
  instrumentId: string
  quantity: number
  averageCost: number
  currentPrice: number
  lastUpdated: string
}

export interface Instrument {
  id: string
  symbol: string
  name: string
  assetClass: AssetClass
  currentPrice: number
  suitabilityMinRisk: number
  suitabilityMaxRisk: number
  description: string
}

export interface ModelPortfolio {
  id: string
  name: string
  description: string
  minRiskScore: number
  maxRiskScore: number
  allocations: ModelAllocation[]
}

export interface ModelAllocation {
  assetClass: AssetClass
  targetPercentage: number
}

export interface Order {
  id: string
  portfolioId: string
  instrumentId: string
  side: OrderSide
  orderType: OrderType
  quantity: number
  limitPrice?: number
  status: OrderStatus
  createdBy: string
  createdAt: string
  executedAt?: string
  executedPrice?: number
  failureReason?: string
  idempotencyKey: string
}

export interface NextBestAction {
  id: string
  clientId: string
  type: ActionType
  title: string
  description: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  createdAt: string
  metadata?: Record<string, unknown>
}

export interface AuditEvent {
  id: string
  type: AuditEventType
  actorUserId: string
  clientId?: string
  timestamp: string
  details: Record<string, unknown>
  ipAddress?: string
}

export interface AiInteraction {
  id: string
  actorUserId: string
  clientId?: string
  endpoint: string
  prompt: string
  response: string
  model: string
  createdAt: string
  offlineMode: boolean
  tokenCount?: number
  metadata?: Record<string, unknown>
}

export interface Transaction {
  id: string
  portfolioId: string
  instrumentId: string
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'FEE'
  quantity: number
  price: number
  amount: number
  timestamp: string
  orderId?: string
}
