export type PromoStatus = 'Active' | 'Expired' | 'Used up'

interface PromoLimits {
  expiresAt?: string | null
  maxUses?: number | null
  uses: number
}

// Expired wins over used up, because an expired code cannot be used even with uses left.
export function promoStatus({ expiresAt, maxUses, uses }: PromoLimits, now = Date.now()): PromoStatus {
  if (expiresAt && new Date(expiresAt).getTime() <= now) return 'Expired'
  if (maxUses != null && uses >= maxUses) return 'Used up'
  return 'Active'
}

// A date input gives YYYY-MM-DD. The code works through that whole day, so it expires at the end of it.
export function endOfDayIso(date: string): string {
  return new Date(`${date}T23:59:59`).toISOString()
}
