// Limits for the routes that check or change a password. They count per client
// IP, so brute-forcing one account from one address stops quickly. The global
// limit in AppModule covers the rest of the API.
export const AUTH_THROTTLE = { default: { limit: 10, ttl: 60_000 } }
