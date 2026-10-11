export const TOP_DEALS_KEY = 'games:top-deals'
export const GENRES_KEY = 'games:genres'

export const gameDetailKey = (gameId: number) => `game:${gameId}`

// Every filter changes the result, so every filter is part of the key.
export const gamesListKey = (params: object) => `games:${JSON.stringify(params)}`
