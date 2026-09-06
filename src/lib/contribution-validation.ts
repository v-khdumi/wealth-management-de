import { z } from 'zod'

// This is a numeric safety boundary, not an affordability or authorization rule.
// The backend must independently validate contributions before persisting them.
const contributionSchema = z.number().finite().min(0).max(Number.MAX_SAFE_INTEGER)

const recommendationSchema = z.object({
  recommendedContribution: contributionSchema,
  reasoning: z.string().optional(),
})

export interface ContributionRecommendation {
  recommendedContribution: number
  reasoning?: string
}

export function isValidContribution(value: unknown): value is number {
  return contributionSchema.safeParse(value).success
}

/**
 * Accept the existing plain JSON and fenced JSON response formats.
 * Only validated fields leave this boundary. Never include model output or
 * parser diagnostics in the error: they may contain private financial data.
 */
export function parseContributionRecommendation(response: string): ContributionRecommendation {
  let json = response.trim()
  const fenced = json.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) json = fenced[1].trim()

  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    throw new Error('Invalid contribution recommendation')
  }

  const result = recommendationSchema.safeParse(value)
  if (!result.success) {
    throw new Error('Invalid contribution recommendation')
  }

  return result.data
}
