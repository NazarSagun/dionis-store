import { describe, expect, it } from 'vitest'

import { endOfDayIso, promoStatus } from '../domain/promo-status'

const now = new Date('2026-10-28T12:00:00Z').getTime()
const past = '2026-10-01T00:00:00Z'
const future = '2026-12-01T00:00:00Z'

describe('promoStatus', () => {
  it('is Active without limits, with a later expiry, and with uses left', () => {
    expect(promoStatus({ uses: 99 }, now)).toBe('Active')
    expect(promoStatus({ uses: 1, expiresAt: future, maxUses: 5 }, now)).toBe('Active')
  })

  it('is Expired after the expiry, even with uses left', () => {
    expect(promoStatus({ uses: 0, expiresAt: past, maxUses: 5 }, now)).toBe('Expired')
  })

  it('is Used up when the uses reach the limit', () => {
    expect(promoStatus({ uses: 5, maxUses: 5 }, now)).toBe('Used up')
    expect(promoStatus({ uses: 6, maxUses: 5 }, now)).toBe('Used up')
  })

  it('is Expired when a code is both expired and used up', () => {
    expect(promoStatus({ uses: 5, maxUses: 5, expiresAt: past }, now)).toBe('Expired')
  })
})

describe('endOfDayIso', () => {
  it('gives an ISO time on the chosen day', () => {
    expect(new Date(endOfDayIso('2030-05-06')).getFullYear()).toBe(2030)
  })
})
