import type { GoalType } from './types'

export interface GoalTemplate {
  id: string
  name: string
  type: GoalType
  description: string
  icon: string
  suggestedAmount: number
  minAmount: number
  maxAmount: number
  suggestedYears: number
  minYears: number
  maxYears: number
  tips: string[]
  popularityRank: number
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: 'retirement-comfortable',
    name: 'Comfortable Retirement',
    type: 'RETIREMENT',
    description: 'Build a nest egg for a comfortable retirement lifestyle',
    icon: '🏖️',
    suggestedAmount: 1000000,
    minAmount: 500000,
    maxAmount: 3000000,
    suggestedYears: 25,
    minYears: 10,
    maxYears: 40,
    tips: [
      'Start early to benefit from compound growth',
      'Consider maxing out tax-advantaged accounts first',
      'Adjust contributions as your income grows',
    ],
    popularityRank: 1,
  },
  {
    id: 'retirement-early',
    name: 'Early Retirement',
    type: 'RETIREMENT',
    description: 'Retire before traditional retirement age with financial independence',
    icon: '🌴',
    suggestedAmount: 1500000,
    minAmount: 800000,
    maxAmount: 5000000,
    suggestedYears: 15,
    minYears: 5,
    maxYears: 25,
    tips: [
      'Higher savings rate needed for early retirement',
      'Plan for healthcare costs before Medicare eligibility',
      'Consider the 4% withdrawal rule for sustainability',
    ],
    popularityRank: 3,
  },
  {
    id: 'house-downpayment',
    name: 'Home Down Payment',
    type: 'HOUSE',
    description: 'Save for a 20% down payment on your dream home',
    icon: '🏡',
    suggestedAmount: 100000,
    minAmount: 20000,
    maxAmount: 500000,
    suggestedYears: 5,
    minYears: 2,
    maxYears: 10,
    tips: [
      '20% down payment avoids PMI insurance',
      'Factor in closing costs (2-5% of home price)',
      'Keep funds accessible in lower-risk investments',
    ],
    popularityRank: 2,
  },
  {
    id: 'house-upgrade',
    name: 'Home Upgrade',
    type: 'HOUSE',
    description: 'Move up to a larger home or better neighborhood',
    icon: '🏘️',
    suggestedAmount: 200000,
    minAmount: 50000,
    maxAmount: 750000,
    suggestedYears: 7,
    minYears: 3,
    maxYears: 12,
    tips: [
      'Account for selling costs of current home',
      'Consider appreciation of current property',
      'Factor in higher property taxes and maintenance',
    ],
    popularityRank: 6,
  },
  {
    id: 'education-college',
    name: 'College Education',
    type: 'EDUCATION',
    description: 'Fund four years of college education for your child',
    icon: '🎓',
    suggestedAmount: 150000,
    minAmount: 50000,
    maxAmount: 400000,
    suggestedYears: 15,
    minYears: 5,
    maxYears: 18,
    tips: [
      'Consider 529 plans for tax-advantaged growth',
      'Costs vary significantly by institution type',
      'Factor in scholarships and financial aid',
    ],
    popularityRank: 4,
  },
  {
    id: 'education-private',
    name: 'Private School',
    type: 'EDUCATION',
    description: 'Cover private school tuition for K-12 education',
    icon: '📚',
    suggestedAmount: 200000,
    minAmount: 75000,
    maxAmount: 500000,
    suggestedYears: 10,
    minYears: 5,
    maxYears: 15,
    tips: [
      'Annual costs can range from $10k-$50k+',
      'Some schools offer multi-year discounts',
      'Consider mix of public and private years',
    ],
    popularityRank: 8,
  },
  {
    id: 'wedding',
    name: 'Wedding',
    type: 'OTHER',
    description: 'Plan and pay for a memorable wedding celebration',
    icon: '💒',
    suggestedAmount: 30000,
    minAmount: 10000,
    maxAmount: 100000,
    suggestedYears: 2,
    minYears: 1,
    maxYears: 5,
    tips: [
      'Average wedding costs vary by location',
      'Guest count is the biggest cost driver',
      'Consider which elements matter most to you',
    ],
    popularityRank: 7,
  },
  {
    id: 'emergency-fund',
    name: 'Emergency Fund',
    type: 'OTHER',
    description: 'Build 6 months of living expenses for unexpected situations',
    icon: '🛡️',
    suggestedAmount: 25000,
    minAmount: 10000,
    maxAmount: 75000,
    suggestedYears: 2,
    minYears: 1,
    maxYears: 3,
    tips: [
      'Keep in highly liquid, low-risk accounts',
      'Aim for 3-6 months of expenses',
      'Adjust based on job security and dependents',
    ],
    popularityRank: 5,
  },
  {
    id: 'business-startup',
    name: 'Start a Business',
    type: 'OTHER',
    description: 'Save capital to launch your own business venture',
    icon: '🚀',
    suggestedAmount: 75000,
    minAmount: 25000,
    maxAmount: 500000,
    suggestedYears: 3,
    minYears: 2,
    maxYears: 7,
    tips: [
      'Research typical startup costs in your industry',
      'Plan for 6-12 months of personal expenses',
      'Consider keeping day job while building',
    ],
    popularityRank: 9,
  },
  {
    id: 'vacation-home',
    name: 'Vacation Property',
    type: 'HOUSE',
    description: 'Purchase a second home or vacation retreat',
    icon: '⛰️',
    suggestedAmount: 150000,
    minAmount: 50000,
    maxAmount: 1000000,
    suggestedYears: 10,
    minYears: 5,
    maxYears: 20,
    tips: [
      'Factor in maintenance and property management',
      'Consider rental income potential',
      'Property taxes may be higher for second homes',
    ],
    popularityRank: 11,
  },
  {
    id: 'car-purchase',
    name: 'New Vehicle',
    type: 'OTHER',
    description: 'Buy a new car without taking on debt',
    icon: '🚗',
    suggestedAmount: 35000,
    minAmount: 15000,
    maxAmount: 100000,
    suggestedYears: 3,
    minYears: 1,
    maxYears: 5,
    tips: [
      'Avoid depreciation by buying slightly used',
      'Factor in insurance, registration, and taxes',
      'Consider total cost of ownership',
    ],
    popularityRank: 10,
  },
  {
    id: 'world-travel',
    name: 'Dream Vacation',
    type: 'OTHER',
    description: 'Fund an extended trip or bucket-list travel experience',
    icon: '✈️',
    suggestedAmount: 15000,
    minAmount: 5000,
    maxAmount: 50000,
    suggestedYears: 2,
    minYears: 1,
    maxYears: 5,
    tips: [
      'Book in advance for better prices',
      'Consider travel rewards credit cards',
      'Off-season travel can reduce costs significantly',
    ],
    popularityRank: 12,
  },
]

export function getTemplatesByType(type?: GoalType): GoalTemplate[] {
  const templates = type 
    ? GOAL_TEMPLATES.filter(t => t.type === type)
    : GOAL_TEMPLATES

  return templates.sort((a, b) => a.popularityRank - b.popularityRank)
}

export function getTemplateById(id: string): GoalTemplate | undefined {
  return GOAL_TEMPLATES.find(t => t.id === id)
}

export function getMostPopularTemplates(limit: number = 6): GoalTemplate[] {
  return [...GOAL_TEMPLATES]
    .sort((a, b) => a.popularityRank - b.popularityRank)
    .slice(0, limit)
}
