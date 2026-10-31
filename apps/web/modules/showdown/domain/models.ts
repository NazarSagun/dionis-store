import { Phrase } from './phrases'

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

// 1 throws at the card on the right, -1 at the card on the left.
export type Facing = 1 | -1

// One rock throw by Grumli: when it started (performance.now()), which way Grumli faces, where the rock
// lands, in page px, and what Grumli shouts before it.
export interface ThrowAction {
  startedAt: number
  facing: Facing
  target: { x: number; y: number }
  phrase: Phrase
}
