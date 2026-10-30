export const TOP_DEALS_KEY = 'games:top-deals'
export const GENRES_KEY = 'games:genres'

export const gameDetailKey = (gameId: number) => `game:${gameId}`

// Every filter changes the result, so every filter is part of the key.
export const gamesListKey = (params: object) => `games:${JSON.stringify(params)}`

// One entry per normalized AI search request. A game write clears the whole
// cache, these entries too, so a new genre reaches the model.
export const aiSearchKey = (normalizedQuery: string) => `ai-search:${normalizedQuery}`
