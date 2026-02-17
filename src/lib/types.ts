export type UserRole = 'ADVISOR' | 'CLIENT'

export type RiskCategory = 'CONSERVATIVE' | 'MODERATE' | 'BALANCED' | 'GROWTH' | 'AGGRESSIVE'

export type AssetClass = 'EQUITY' | 'FIXED_INCOME' | 'CASH' | 'ALTERNATIVE' | 'REAL_ESTATE'

export type GoalType = 'RETIREMENT' | 'HOUSE' | 'EDUCATION' | 'OTHER'

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
