import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { AiSearchDto } from './ai-search.dto'

const errorsFor = async (query: unknown) => validate(plainToInstance(AiSearchDto, { query }))

describe('AiSearchDto', () => {
  it('accepts a query of 1 to 200 characters after trimming', async () => {
    expect(await errorsFor('  rpg on switch  ')).toHaveLength(0)
    expect(await errorsFor('a'.repeat(200))).toHaveLength(0)
  })

  it('rejects an empty query, a query of only spaces, and a query of 201 characters', async () => {
    expect(await errorsFor('')).not.toHaveLength(0)
    expect(await errorsFor('   ')).not.toHaveLength(0)
    expect(await errorsFor('a'.repeat(201))).not.toHaveLength(0)
    expect(await errorsFor(undefined)).not.toHaveLength(0)
  })
})
