import { APIRequestContext, expect } from '@playwright/test'

import { apiToken, apiUrl, createGameViaApi, uniqueSuffix } from './admin'

// Shared setup for restock-alerts.spec.ts (.claude/specs/restock-alerts-spec.md).

export const editionAlertUrl = (editionId: number | string) => `${apiUrl}/api/editions/${editionId}/stock-alert`
export const gameAlertsUrl = (gameId: number | string) => `${apiUrl}/api/games/${gameId}/stock-alerts`

export interface RestockFixture {
  gameId: number
  gameTitle: string
  editionId: number
  editionName: string
}

// A fresh game with one physical edition, so a test can raise stock without
// touching the seeded games other specs read. The edition starts at `stock`.
export async function createGameWithEdition(request: APIRequestContext, stock = 0): Promise<RestockFixture> {
  const { id: gameId, title: gameTitle } = await createGameViaApi(request)
  const editionName = `Restock Edition ${uniqueSuffix()}`
  const response = await request.post(`${apiUrl}/api/games/${gameId}/editions`, {
    headers: { Authorization: `Bearer ${await apiToken(request)}` },
    data: { name: editionName, price: 40, discount: 0, stock, description: 'An edition for the restock alert tests.' },
  })
  expect(response.status()).toBe(201)
  const game = await (await request.get(`${apiUrl}/api/game/${gameId}`)).json()
  const edition = game.editions.find((e: { name: string }) => e.name === editionName)
  return { gameId, gameTitle, editionId: edition.id as number, editionName }
}

// What an admin does in the panel: set the stock of an edition.
export async function setStock(request: APIRequestContext, editionId: number, stock: number) {
  const response = await request.patch(`${apiUrl}/api/editions/${editionId}`, {
    headers: { Authorization: `Bearer ${await apiToken(request)}` },
    data: { stock },
  })
  expect(response.status()).toBe(200)
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })

export async function subscribe(request: APIRequestContext, token: string, editionId: number) {
  return request.put(editionAlertUrl(editionId), { headers: bearer(token) })
}

export async function alertedEditionIds(request: APIRequestContext, token: string, gameId: number) {
  const response = await request.get(gameAlertsUrl(gameId), { headers: bearer(token) })
  expect(response.status()).toBe(200)
  return ((await response.json()) as { editionIds: number[] }).editionIds
}
