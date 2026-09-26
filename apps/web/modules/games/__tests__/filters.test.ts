import { describe, expect, it } from 'vitest'

import { parseGamesFilters, priceRangeLabel, toQueryString } from '../domain/filters'

const parse = (query: string) => parseGamesFilters(new URLSearchParams(query))

describe('games filters in the URL', () => {
  it('reads every filter from the query string', () => {
    expect(
      parse('search=war&platform=PS5&genre=Shooter&minPrice=15&maxPrice=30&sort=price_asc&edition=standard&page=3'),
    ).toEqual({
      page: 3,
      search: 'war',
      platform: 'PS5',
      genre: 'Shooter',
      minPrice: 15,
      maxPrice: 30,
      sort: 'price_asc',
      edition: 'standard',
    })
  })

  it('drops values the API would reject instead of passing them on', () => {
    expect(parse('platform=Commodore64&sort=random&edition=gold&minPrice=-5&maxPrice=cheap&page=0')).toEqual({
      page: 1,
      search: undefined,
      platform: undefined,
      genre: undefined,
      sort: undefined,
      edition: undefined,
      minPrice: undefined,
      maxPrice: undefined,
    })
  })

  it('drops a genre longer than the API allows', () => {
    expect(parse(`genre=${'a'.repeat(51)}`).genre).toBeUndefined()
  })

  it('writes the plain home page as an empty query string', () => {
    expect(toQueryString({ page: 1 })).toBe('')
  })

  it('round-trips a full set of filters', () => {
    const query = '?search=war+zone&platform=PS5&genre=Card+Game&minPrice=15&maxPrice=30&sort=price_asc&page=2'
    expect(toQueryString(parse(query.slice(1)))).toBe(query)
  })

  it('names preset and hand-written price ranges', () => {
    expect(priceRangeLabel(15, 30)).toBe('€15–€30')
    expect(priceRangeLabel(undefined, 20)).toBe('Up to €20')
    expect(priceRangeLabel(40, undefined)).toBe('€40 and up')
    expect(priceRangeLabel(10, 25)).toBe('€10–€25')
    expect(priceRangeLabel()).toBe('Any')
  })
})
