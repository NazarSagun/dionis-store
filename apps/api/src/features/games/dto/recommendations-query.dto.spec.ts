import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { parseIdList, RecommendationsQueryDto } from './recommendations-query.dto'

const errorsFor = async (query: Record<string, unknown>) => validate(plainToInstance(RecommendationsQueryDto, query))
const ids = (count: number) => Array.from({ length: count }, (_, i) => i + 1).join(',')

describe('parseIdList', () => {
  it('splits a comma-separated list, and turns a bad part into NaN', () => {
    expect(parseIdList('1,2,3')).toEqual([1, 2, 3])
    expect(parseIdList('1,x')).toEqual([1, NaN])
    expect(parseIdList('1,,2')).toEqual([1, NaN, 2])
    expect(parseIdList(undefined)).toEqual([])
    expect(parseIdList('')).toEqual([])
    // The shape the controller gets after the ValidationPipe has transformed the query.
    expect(parseIdList([1, 2, 3])).toEqual([1, 2, 3])
  })
})

describe('RecommendationsQueryDto', () => {
  it('accepts a valid query', async () => {
    expect(await errorsFor({ seedGameIds: '1,2', excludeGameIds: '3', limit: '12' })).toHaveLength(0)
    expect(await errorsFor({ seedGameIds: ids(30), excludeGameIds: ids(60), limit: '1' })).toHaveLength(0)
    expect(await errorsFor({ seedGameIds: '5' })).toHaveLength(0)
  })

  it.each([
    ['a missing seed list', {}],
    ['an empty seed list', { seedGameIds: '' }],
    ['a non-numeric seed', { seedGameIds: 'abc' }],
    ['one bad seed in a list', { seedGameIds: '1,x' }],
    ['seed 0', { seedGameIds: '0' }],
    ['a negative seed', { seedGameIds: '-4' }],
    ['a fractional seed', { seedGameIds: '1.5' }],
    ['31 seeds', { seedGameIds: ids(31) }],
    ['61 excluded ids', { seedGameIds: '1', excludeGameIds: ids(61) }],
    ['a bad excluded id', { seedGameIds: '1', excludeGameIds: 'x' }],
    ['limit 13', { seedGameIds: '1', limit: '13' }],
    ['limit 0', { seedGameIds: '1', limit: '0' }],
    ['a fractional limit', { seedGameIds: '1', limit: '2.5' }],
  ])('rejects %s', async (_name, query) => {
    expect((await errorsFor(query)).length).toBeGreaterThan(0)
  })
})
