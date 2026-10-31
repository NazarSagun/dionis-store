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

// The pick animation with Grumli, in ms from the pick. See .claude/specs/showdown-character-spec.md, Feature 3.
// PICK_TIMELINE stays for a pick without the character, such as when WebGL is not available.
export const THROW_TIMELINE = {
  release: 280,
  crack: 520,
  shatter: 720,
  next: 1100,
  done: 1350,
  // The speech bubble stays 2 s so the user can read it. It outlasts the throw and stays over the next match,
  // unless the next pick replaces it first.
  phraseOut: 1900,
  phraseEnd: 2000,
} as const

// How long Grumli's one-shot animations play before the idle loop.
export const DWARF_CLIP_MS = {
  greet: 1500,
  throw: THROW_TIMELINE.done,
  celebrate: 1500,
} as const

// What Grumli shouts before each throw. {title} is the kept game. The bubble shows it in uppercase.
export const THROW_PHRASES = [
  '{title} will be!',
  'By my beard, {title} it is!',
  '{title}! The stone has spoken!',
  'Out of my hall! {title} stays!',
  'For the anvil! {title}!',
  'Rock says no. {title} says yes!',
  'To the deep mines with you! {title} stays!',
  'Hah! {title}, obviously!',
  "{title}! I'd forge a shrine to it!",
  'Smash the other one! {title} wins!',
  '{title}, you may pass!',
  'Ale for {title}! Rocks for the rest!',
] as const
