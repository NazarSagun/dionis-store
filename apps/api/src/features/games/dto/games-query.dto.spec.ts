import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { GamesQueryDto } from './games-query.dto'

async function validateQuery(plain: Record<string, unknown>) {
  const dto = plainToInstance(GamesQueryDto, plain)
  return validate(dto)
}

describe('GamesQueryDto (security: input whitelisting)', () => {
  it('accepts no query params', async () => {
    expect(await validateQuery({})).toHaveLength(0)
  })

  it('accepts each whitelisted platform', async () => {
    for (const platform of ['PC', 'PS5', 'Xbox', 'Switch']) {
      expect(await validateQuery({ platform })).toHaveLength(0)
    }
  })

  it('accepts each whitelisted sort', async () => {
    for (const sort of ['price_asc', 'price_desc', 'rating_desc']) {
      expect(await validateQuery({ sort })).toHaveLength(0)
    }
  })

  it('accepts each whitelisted edition', async () => {
    for (const edition of ['digital', 'standard', 'collector']) {
      expect(await validateQuery({ edition })).toHaveLength(0)
    }
  })

  it('rejects an edition value outside the whitelist', async () => {
    const errors = await validateQuery({ edition: "standard'); DROP TABLE Game_pc;--" })
    expect(errors).not.toHaveLength(0)
    expect(errors[0].property).toBe('edition')
  })

  it('rejects a platform value outside the whitelist', async () => {
    const errors = await validateQuery({ platform: 'PC (Windows); DROP TABLE Game_pc;--' })
    expect(errors).not.toHaveLength(0)
    expect(errors[0].property).toBe('platform')
  })

  it('rejects an injection-shaped sort value before it can reach the database layer', async () => {
    const errors = await validateQuery({ sort: "price_asc'); DROP TABLE Game_pc;--" })
    expect(errors).not.toHaveLength(0)
    expect(errors[0].property).toBe('sort')
  })

  it('rejects a search string longer than the 100-char cap', async () => {
    const errors = await validateQuery({ search: 'a'.repeat(101) })
    expect(errors).not.toHaveLength(0)
    expect(errors[0].property).toBe('search')
  })

  it('accepts a search string at the 100-char cap', async () => {
    expect(await validateQuery({ search: 'a'.repeat(100) })).toHaveLength(0)
  })

  it('accepts SQL-metacharacter search text as plain text (no format restriction to bypass)', async () => {
    expect(await validateQuery({ search: "' OR '1'='1' --" })).toHaveLength(0)
  })
})
