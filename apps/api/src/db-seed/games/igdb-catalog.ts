// Pure helpers for import-igdb.ts: they turn one IGDB game record into a
// games.json entry and check the catalog mix rule from rich-game-details-spec.md.

export interface CuratedGame {
  id: number
  igdbSlug: string
  genre: string
  price: number
  discount: number
}

interface Named {
  name: string
}

interface IgdbImage {
  image_id: string
  width?: number
  height?: number
}

export interface IgdbGame {
  slug: string
  name: string
  summary?: string
  storyline?: string
  first_release_date?: number
  total_rating?: number
  platforms?: Named[]
  game_modes?: Named[]
  themes?: Named[]
  player_perspectives?: Named[]
  involved_companies?: Array<{ company: Named; publisher: boolean; developer: boolean }>
  artworks?: IgdbImage[]
  screenshots?: IgdbImage[]
  videos?: Array<{ video_id: string; name?: string }>
  cover?: IgdbImage
  age_ratings?: Array<{ organization?: Named; rating_category?: { rating: string } }>
  language_supports?: Array<{ language: Named; language_support_type: Named }>
  aggregated_rating?: number
  aggregated_rating_count?: number
  rating?: number
  rating_count?: number
}

export interface SeedGame {
  id: number
  title: string
  thumbnail: string
  short_description: string
  genre: string
  platform: string
  publisher: string
  developer: string
  release_date: string
  price: number
  rating: string
  discount: number
  trailerYoutubeId: string
  images: Array<{ url: string; alt: string; position: number }>
  sections: Array<{ kind: 'about' | 'story' | 'features'; title: string; body: string; position: number }>
  coverUrl?: string
  ageRatings: string[]
  criticRating?: number
  criticRatingCount?: number
  userRating?: number
  userRatingCount?: number
  languages: GameLanguageRow[]
}

interface GameLanguageRow {
  language: string
  audio: boolean
  subtitles: boolean
  interface: boolean
}

// Artworks first, then screenshots, keeping only shapes close to a 16:9
// screenshot. A wide banner or a tall poster crops to almost nothing on a card.
export function galleryImages(game: IgdbGame) {
  return [...(game.artworks ?? []), ...(game.screenshots ?? [])]
    .filter((image) => {
      const ratio = (image.width ?? 16) / (image.height ?? 9)
      return ratio >= 1.3 && ratio <= 2
    })
    .slice(0, MAX_IMAGES)
}

export const MAX_IMAGES = 7
export const MIN_IMAGES = 4

// IGDB platform name to the store name. Other platforms are ignored.
const STORE_PLATFORMS: Array<[RegExp, string]> = [
  [/^PC \(Microsoft Windows\)$/, 'PC (Windows)'],
  [/^PlayStation 5$/, 'PS5'],
  [/^Xbox Series X\|S$/, 'Xbox Series X'],
  [/^Nintendo Switch( 2)?$/, 'Nintendo Switch'],
]

export function storePlatforms(platforms: Named[] = []) {
  const names = STORE_PLATFORMS.filter(([pattern]) => platforms.some((platform) => pattern.test(platform.name)))
  return names.map(([, name]) => name).join(', ')
}

// The key holds the IGDB image id, so a changed image never reuses a cached file.
const imageKey = (curated: CuratedGame, imageId: string) => `games/${curated.id}/${imageId}.jpg`

export const igdbImageUrl = (imageId: string, size = 't_1080p') =>
  `https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`
const COVER_SIZE = 't_cover_big_2x'

// PEGI first, then ESRB, such as ["PEGI 12", "ESRB T"]. Other boards are ignored.
export function ageRatingLabels(ratings: IgdbGame['age_ratings'] = []) {
  return ['PEGI', 'ESRB'].flatMap((board) => {
    const rating = ratings.find((item) => item.organization?.name === board)?.rating_category?.rating
    return rating ? [`${board} ${rating}`] : []
  })
}

// One row per language, with a flag for each kind of support, sorted by name.
export function languageRows(supports: IgdbGame['language_supports'] = []) {
  const rows = new Map<string, GameLanguageRow>()
  for (const { language, language_support_type: type } of supports) {
    const row = rows.get(language.name) ?? { language: language.name, audio: false, subtitles: false, interface: false }
    if (type.name === 'Audio') row.audio = true
    if (type.name === 'Subtitles') row.subtitles = true
    if (type.name === 'Interface') row.interface = true
    rows.set(language.name, row)
  }
  return [...rows.values()].sort((a, b) => a.language.localeCompare(b.language))
}

const score = (value?: number) => (value === undefined ? undefined : Math.round(value))

// The first sentence, cut to 200 characters, for the card and the page header.
export function firstSentence(text: string) {
  const sentence = text.match(/^.+?[.!?](\s|$)/s)?.[0].trim() ?? text
  return sentence.length > 200 ? `${sentence.slice(0, 197).trimEnd()}...` : sentence
}

// A section body holds at most 5000 characters (game-section.dto.ts). A longer
// text ends at its last full sentence before that limit.
export const SECTION_MAX = 5000
export function fitSection(text: string) {
  if (text.length <= SECTION_MAX) return text
  const cut = text.slice(0, SECTION_MAX)
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '))
  return end > 0 ? cut.slice(0, end + 1) : cut
}

function pickTrailer(videos: IgdbGame['videos'] = []) {
  return (videos.find((video) => /trailer/i.test(video.name ?? '')) ?? videos[0])?.video_id
}

function companies(game: IgdbGame, role: 'publisher' | 'developer') {
  const names = (game.involved_companies ?? [])
    .filter((company) => company[role])
    .map((company) => company.company.name)
  return names.length > 0 ? names.slice(0, 2).join(', ') : 'Unknown'
}

function featureItems(game: IgdbGame) {
  const list = (label: string, items: Named[] = []) =>
    items.length > 0 ? [`- ${label}: ${items.map((item) => item.name).join(', ')}`] : []
  return [
    ...list('Modes', game.game_modes),
    ...list('Perspective', game.player_perspectives),
    ...list('Themes', game.themes),
  ].join('\n')
}

// Returns the games.json entry, or the reason the game cannot be imported.
export function toSeedGame(
  curated: CuratedGame,
  game: IgdbGame,
  mediaBaseUrl: string,
): { game: SeedGame } | { error: string } {
  const platform = storePlatforms(game.platforms)
  const trailerYoutubeId = pickTrailer(game.videos)
  const sources = galleryImages(game)

  if (!platform) return { error: `${curated.igdbSlug} has no store platform` }
  if (!trailerYoutubeId) return { error: `${curated.igdbSlug} has no trailer` }
  if (sources.length < MIN_IMAGES) {
    return { error: `${curated.igdbSlug} has ${sources.length} images, needs ${MIN_IMAGES}` }
  }
  if (!game.summary) return { error: `${curated.igdbSlug} has no summary` }

  const images = sources.map((image, position) => ({
    url: `${mediaBaseUrl}/${imageKey(curated, image.image_id)}`,
    alt: `${game.name} image ${position + 1}`,
    position,
  }))

  const sections: SeedGame['sections'] = [
    { kind: 'about', title: 'About', body: fitSection(game.summary), position: 0 },
  ]
  if (game.storyline) {
    sections.push({ kind: 'story', title: 'Story', body: fitSection(game.storyline), position: sections.length })
  }
  const features = featureItems(game)
  if (features) sections.push({ kind: 'features', title: 'Features', body: features, position: sections.length })

  return {
    game: {
      id: curated.id,
      title: game.name,
      thumbnail: images[0].url,
      short_description: firstSentence(game.summary),
      genre: curated.genre,
      platform,
      publisher: companies(game, 'publisher'),
      developer: companies(game, 'developer'),
      release_date: game.first_release_date
        ? new Date(game.first_release_date * 1000).toISOString().slice(0, 10)
        : 'Unknown',
      price: curated.price,
      rating: ((game.total_rating ?? 80) / 20).toFixed(2),
      discount: curated.discount,
      trailerYoutubeId,
      images,
      sections,
      ...(game.cover && { coverUrl: `${mediaBaseUrl}/${imageKey(curated, game.cover.image_id)}` }),
      ageRatings: ageRatingLabels(game.age_ratings),
      criticRating: score(game.aggregated_rating),
      criticRatingCount: game.aggregated_rating_count,
      userRating: score(game.rating),
      userRatingCount: game.rating_count,
      languages: languageRows(game.language_supports),
    },
  }
}

// The download plan: the IGDB URL of each image and the S3 key it goes to.
export function imageSources(curated: CuratedGame, game: IgdbGame) {
  const gallery = galleryImages(game).map((image) => ({
    url: igdbImageUrl(image.image_id),
    key: imageKey(curated, image.image_id),
  }))
  const cover = game.cover
    ? [{ url: igdbImageUrl(game.cover.image_id, COVER_SIZE), key: imageKey(curated, game.cover.image_id) }]
    : []
  return [...gallery, ...cover]
}

// The catalog mix rule. Returns every broken rule, or an empty list.
export function mixRuleErrors(games: SeedGame[]) {
  const errors: string[] = []
  for (const filter of ['PC', 'PS5', 'Xbox', 'Switch']) {
    const count = games.filter((game) => game.platform.includes(filter)).length
    if (count < 8) errors.push(`The ${filter} filter matches ${count} games, needs 8`)
  }

  const genres = new Map<string, number>()
  for (const game of games) genres.set(game.genre, (genres.get(game.genre) ?? 0) + 1)
  const fullGenres = [...genres.values()].filter((count) => count >= 3).length
  if (fullGenres < 8) errors.push(`${fullGenres} genres have 3 or more games, needs 8`)
  for (const [genre, count] of genres) if (count > 30) errors.push(`${genre} has ${count} games, at most 30`)

  const cheapShooters = games.filter((game) => game.genre === 'Shooter' && game.price <= 20).length
  if (cheapShooters < 2) errors.push(`${cheapShooters} Shooter games cost 20 or less, needs 2`)

  const prices = games.map((game) => game.price)
  // Stripe cannot take a payment of 0, so the cheapest game still costs something.
  if (Math.min(...prices) < 1 || Math.min(...prices) > 10 || Math.max(...prices) < 70) {
    errors.push('Prices must spread from 10 or less to 70, and no game can cost 0')
  }
  const discounted = games.filter((game) => game.discount > 0).length
  if (discounted < 10) errors.push(`${discounted} games have a discount, needs 10`)

  const publishers = new Set(games.map((game) => game.publisher)).size
  if (publishers < 20) errors.push(`${publishers} publishers, needs 20`)
  const years = new Set(games.map((game) => game.release_date.slice(0, 4))).size
  if (years < 15) errors.push(`${years} release years, needs 15`)

  return errors
}
