import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { ShowdownQueryDto, toStringList } from './showdown-query.dto'

const errorsFor = async (query: Record<string, unknown>) => validate(plainToInstance(ShowdownQueryDto, query))

describe('toStringList', () => {
  it('turns one query value or a repeated one into a list', () => {
    expect(toStringList('Shooter')).toEqual(['Shooter'])
    expect(toStringList(['Shooter', 'RPG'])).toEqual(['Shooter', 'RPG'])
    expect(toStringList(undefined)).toEqual([])
  })
})

describe('ShowdownQueryDto', () => {
  it('accepts 1 to 3 genres and a size of 8, 16, or 32', async () => {
    expect(await errorsFor({ genres: 'Shooter', size: '8' })).toHaveLength(0)
    expect(await errorsFor({ genres: ['Shooter', 'RPG', 'MOBA'], size: '32' })).toHaveLength(0)
  })

  it.each([
    ['no genres', { size: '16' }],
    ['4 genres', { genres: ['A', 'B', 'C', 'D'], size: '16' }],
    ['a genre over 50 characters', { genres: 'x'.repeat(51), size: '16' }],
    ['a size of 10', { genres: 'Shooter', size: '10' }],
    ['no size', { genres: 'Shooter' }],
  ])('rejects %s', async (_, query) => {
    expect((await errorsFor(query)).length).toBeGreaterThan(0)
  })
})
