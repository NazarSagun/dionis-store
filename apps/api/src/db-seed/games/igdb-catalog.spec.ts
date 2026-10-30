import { CuratedGame, fitSection, IgdbGame, mixRuleErrors, SeedGame, storePlatforms, toSeedGame } from './igdb-catalog'

const curated: CuratedGame = { id: 7, igdbSlug: 'hades', genre: 'Action', price: 25, discount: 0 }
const image = (id: string, width = 1920, height = 1080) => ({ image_id: id, width, height })
const igdbGame: IgdbGame = {
  slug: 'hades',
  name: 'Hades',
  summary: 'Defy the god of the dead. Hack and slash out of the Underworld.',
  storyline: 'Zagreus wants out.',
  first_release_date: 1600300800,
  total_rating: 93,
  platforms: [{ name: 'PC (Microsoft Windows)' }, { name: 'Nintendo Switch' }, { name: 'PlayStation 4' }],
  game_modes: [{ name: 'Single player' }],
  involved_companies: [{ company: { name: 'Supergiant Games' }, publisher: true, developer: true }],
  artworks: [image('a1', 600, 900), image('banner', 1920, 295), image('a2')],
  screenshots: [image('s1'), image('s2'), image('s3'), image('s4'), image('s5'), image('s6'), image('s7')],
  videos: [
    { video_id: 'teaser00001', name: 'Teaser' },
    { video_id: 'trailer0001', name: 'Launch Trailer' },
  ],
  cover: image('co1', 600, 800),
  age_ratings: [
    { organization: { name: 'USK' }, rating_category: { rating: '12' } },
    { organization: { name: 'ESRB' }, rating_category: { rating: 'T' } },
    { organization: { name: 'PEGI' }, rating_category: { rating: '12' } },
  ],
  language_supports: [
    { language: { name: 'French' }, language_support_type: { name: 'Subtitles' } },
    { language: { name: 'English' }, language_support_type: { name: 'Audio' } },
    { language: { name: 'English' }, language_support_type: { name: 'Interface' } },
  ],
  aggregated_rating: 93.53,
  aggregated_rating_count: 17,
  rating: 89.43,
  rating_count: 1779,
}

describe('toSeedGame', () => {
  it('builds a games.json entry with at most seven screenshot-shaped images, the first as thumbnail, and the trailer', () => {
    const result = toSeedGame(curated, igdbGame, 'https://media.test')
    if ('error' in result) throw new Error(result.error)
    const { game } = result

    expect(game.platform).toBe('PC (Windows), Nintendo Switch')
    expect(game.trailerYoutubeId).toBe('trailer0001')
    expect(game.images).toHaveLength(7)
    expect(game.images[0]).toEqual({ url: 'https://media.test/games/7/a2.jpg', alt: 'Hades image 1', position: 0 })
    expect(game.thumbnail).toBe('https://media.test/games/7/a2.jpg')
    expect(game.short_description).toBe('Defy the god of the dead.')
    expect(game.rating).toBe('4.65')
    expect(game.release_date).toBe('2020-09-17')
    expect(game.sections.map((section) => section.kind)).toEqual(['about', 'story', 'features'])
    expect(game.sections[2].body).toBe('- Modes: Single player')
    expect(game.coverUrl).toBe('https://media.test/games/7/co1.jpg')
    expect(game.ageRatings).toEqual(['PEGI 12', 'ESRB T'])
    expect(game).toMatchObject({ criticRating: 94, criticRatingCount: 17, userRating: 89, userRatingCount: 1779 })
    expect(game.languages).toEqual([
      { language: 'English', audio: true, subtitles: false, interface: true },
      { language: 'French', audio: false, subtitles: true, interface: false },
    ])
  })

  it('refuses a game with too few images, no trailer, or no store platform', () => {
    expect(toSeedGame(curated, { ...igdbGame, screenshots: [], artworks: [image('a')] }, '')).toEqual({
      error: 'hades has 1 images, needs 4',
    })
    expect(toSeedGame(curated, { ...igdbGame, videos: [] }, '')).toEqual({ error: 'hades has no trailer' })
    expect(toSeedGame(curated, { ...igdbGame, platforms: [{ name: 'PlayStation 4' }] }, '')).toEqual({
      error: 'hades has no store platform',
    })
  })

  it('maps Xbox Series and Switch 2 to the store names', () => {
    expect(storePlatforms([{ name: 'Xbox Series X|S' }, { name: 'Nintendo Switch 2' }])).toBe(
      'Xbox Series X, Nintendo Switch',
    )
  })
})

describe('mixRuleErrors', () => {
  const GENRES = [
    'Shooter',
    'RPG',
    'Action',
    'Adventure',
    'Platformer',
    'Strategy',
    'Racing',
    'Sports',
    'Fighting',
    'Puzzle',
  ]
  const catalog = (): SeedGame[] =>
    Array.from({ length: 50 }, (_, i) => ({
      genre: GENRES[i % GENRES.length],
      platform: 'PC (Windows), PS5, Xbox Series X, Nintendo Switch',
      price: [5, 15, 70][i % 3],
      discount: i % 3 === 0 ? 20 : 0,
      publisher: `Publisher ${i % 25}`,
      release_date: `${2010 + (i % 16)}-01-01`,
    })) as SeedGame[]

  it('passes a catalog that follows every rule', () => {
    expect(mixRuleErrors(catalog())).toEqual([])
  })

  it('names the platform rule when fewer than 8 games are on PS5', () => {
    const games = catalog().map((game, i) => (i < 45 ? { ...game, platform: 'PC (Windows)' } : game))

    expect(mixRuleErrors(games)).toEqual(
      expect.arrayContaining(['The PS5 filter matches 5 games, needs 8', 'The Switch filter matches 5 games, needs 8']),
    )
  })

  it('names a genre with more than 30 games', () => {
    const games = catalog().map((game, i) => (i < 31 ? { ...game, genre: 'Puzzle' } : game))

    expect(mixRuleErrors(games)).toContain('Puzzle has 33 games, at most 30')
  })
})

describe('fitSection', () => {
  it('ends a text over 5000 characters at its last full sentence', () => {
    const text = 'One sentence here. '.repeat(300)
    const fitted = fitSection(text)
    expect(fitted.length).toBeLessThanOrEqual(5000)
    expect(fitted.endsWith('here.')).toBe(true)
    expect(fitSection('Short.')).toBe('Short.')
  })
})
