// Limit for POST /api/games/ai-search. Each call can use the free OpenRouter
// key, which allows about 50 requests a day for the whole store.
export const AI_SEARCH_THROTTLE = { default: { limit: 5, ttl: 60_000 } }
