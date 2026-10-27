import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { CreatePromoCodeDto } from './create-promo-code.dto'

const errorsFor = async (body: Record<string, unknown>) => validate(plainToInstance(CreatePromoCodeDto, body))

describe('CreatePromoCodeDto', () => {
  it('accepts a code with letters, digits, and hyphens, and the optional fields', async () => {
    expect(await errorsFor({ code: 'Save-10', percentOff: 10 })).toHaveLength(0)
    expect(
      await errorsFor({ code: 'SAVE10', percentOff: 100, expiresAt: '2030-01-01T00:00:00.000Z', maxUses: 1 }),
    ).toHaveLength(0)
  })

  it.each([
    ['a short code', { code: 'AB', percentOff: 10 }],
    ['a long code', { code: 'A'.repeat(33), percentOff: 10 }],
    ['a code with a space', { code: 'HAS SPACE', percentOff: 10 }],
    ['percent 0', { code: 'SAVE10', percentOff: 0 }],
    ['percent 101', { code: 'SAVE10', percentOff: 101 }],
    ['a fractional percent', { code: 'SAVE10', percentOff: 10.5 }],
    ['max uses 0', { code: 'SAVE10', percentOff: 10, maxUses: 0 }],
    ['an expiry that is not a date', { code: 'SAVE10', percentOff: 10, expiresAt: 'tomorrow' }],
    ['no code', { percentOff: 10 }],
  ])('rejects %s', async (_name, body) => {
    expect((await errorsFor(body)).length).toBeGreaterThan(0)
  })
})
