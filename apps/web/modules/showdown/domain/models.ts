// The fields of a game that a Showdown shows or hands to the cart and the wishlist.
export interface ShowdownGame {
  id: number
  title: string
  thumbnail: string
  genre: string
  platform: string
  rating: string
  price: number
  discount: number
}

export interface ShowdownProgress {
  // 0-based round and match.
  roundIndex: number
  roundCount: number
  matchIndex: number
  matchCount: number
  match: [ShowdownGame, ShowdownGame] | null
  winner: ShowdownGame | null
  // The Final loser first, then the Semifinal losers.
  runnersUp: ShowdownGame[]
}

// A point inside a card, in percent of its width and height.
export interface Point {
  x: number
  y: number
}
