import { THROW_PHRASES } from '../configuration/constraints'

// A throw phrase split around the kept game's title, so the title can take its own color.
export interface Phrase {
  before: string
  title: string
  after: string
}

export function phraseFor(title: string, index: number): Phrase {
  const [before, after = ''] = THROW_PHRASES[index].split('{title}')
  return { before, title, after }
}

// A random phrase index that differs from the last one, so Grumli never repeats himself twice in a row.
export function nextPhraseIndex(last: number | null, random: () => number = Math.random) {
  const count = THROW_PHRASES.length
  if (last === null) return Math.floor(random() * count)
  return (last + 1 + Math.floor(random() * (count - 1))) % count
}
