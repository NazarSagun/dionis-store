export const SHOWDOWN_SIZES = [8, 16, 32] as const
export type ShowdownSize = (typeof SHOWDOWN_SIZES)[number]

export const DEFAULT_SHOWDOWN_SIZE: ShowdownSize = 16
export const MAX_SHOWDOWN_GENRES = 3

// The home prompt waits this long after the page loads.
export const PROMPT_DELAY_MS = 3000

// The pick animation, in ms from the pick. See the spec's Feature 4.
export const PICK_TIMELINE = {
  crack: 120,
  shatter: 320,
  next: 700,
  done: 950,
} as const
export const REDUCED_MOTION_PICK_MS = 200

export const SHARD_COUNT = 14
