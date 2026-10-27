import { APIRequestContext, expect } from '@playwright/test'

import { apiToken, apiUrl, uniqueSuffix } from './admin'

// Shared setup for recommendations.spec.ts (.claude/specs/recommendations-spec.md).

export const recommendationsUrl = `${apiUrl}/api/games/recommendations`

// A genre no seeded game has, so a test controls the whole candidate pool.
export const uniqueGenre = () => `E2E Genre ${uniqueSuffix()}`

// Creates a game in the given genre through the admin API. The title starts
// with `prefix`, so a test can order its games by title.
export async function createGameInGenre(request: APIRequestContext, genre: string, prefix: string) {
  const title = `${prefix} ${uniqueSuffix()}`
  const response = await request.post(`${apiUrl}/api/games`, {
    headers: { Authorization: `Bearer ${await apiToken(request)}` },
    data: {
      title,
      thumbnail: 'https://www.freetogame.com/g/1/thumbnail.jpg',
      short_description: 'A game created by the recommendations E2E suite.',
      genre,
      platform: 'PC (Windows)',
      publisher: 'E2E Publisher',
      developer: 'E2E Developer',
      release_date: '2026-09-26',
      price: 30,
      rating: '4.10',
      discount: 0,
    },
  })
  expect(response.status()).toBe(201)
  return { id: (await response.json()).id as number, title }
}

export function recommendationsQuery(seedGameIds: number[] | string, excludeGameIds?: number[], limit?: number) {
  const params = new URLSearchParams({
    seedGameIds: Array.isArray(seedGameIds) ? seedGameIds.join(',') : seedGameIds,
  })
  if (excludeGameIds) params.set('excludeGameIds', excludeGameIds.join(','))
  if (limit !== undefined) params.set('limit', String(limit))
  return `${recommendationsUrl}?${params.toString()}`
}

export async function fetchRecommendations(
  request: APIRequestContext,
  seedGameIds: number[],
  excludeGameIds?: number[],
  limit?: number,
) {
  const response = await request.get(recommendationsQuery(seedGameIds, excludeGameIds, limit))
  expect(response.status()).toBe(200)
  return (await response.json()) as Array<{ id: number; title: string }>
}
