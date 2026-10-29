import { spawnSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import dotenv from 'dotenv'
import { CuratedGame, IgdbGame, imageSources, mixRuleErrors, SeedGame, toSeedGame } from './games/igdb-catalog'

// One-time import of the curated games from IGDB (rich-game-details-spec.md,
// Feature 1). It runs on a developer machine only: it downloads the images
// into a local cache, syncs the cache to the media bucket with the AWS CLI,
// and writes games/games.json, which the seed reads.
dotenv.config()

const REQUIRED = ['TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET', 'MEDIA_BUCKET', 'MEDIA_BASE_URL'] as const
const CACHE_DIR = path.join(__dirname, '../../.igdb-cache')
const GAME_FIELDS = [
  'name',
  'slug',
  'summary',
  'storyline',
  'first_release_date',
  'total_rating',
  'platforms.name',
  'game_modes.name',
  'themes.name',
  'player_perspectives.name',
  'involved_companies.company.name',
  'involved_companies.publisher',
  'involved_companies.developer',
  'artworks.image_id',
  'artworks.width',
  'artworks.height',
  'screenshots.image_id',
  'screenshots.width',
  'screenshots.height',
  'videos.video_id',
  'videos.name',
  'cover.image_id',
  'age_ratings.organization.name',
  'age_ratings.rating_category.rating',
  'language_supports.language.name',
  'language_supports.language_support_type.name',
  'aggregated_rating',
  'aggregated_rating_count',
  'rating',
  'rating_count',
].join(',')

function readEnv() {
  const missing = REQUIRED.filter((name) => !process.env[name])
  if (missing.length > 0) throw new Error(`Set ${missing.join(', ')} before you run the import.`)
  return Object.fromEntries(REQUIRED.map((name) => [name, process.env[name] as string])) as Record<
    (typeof REQUIRED)[number],
    string
  >
}

async function twitchToken(clientId: string, clientSecret: string) {
  const query = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  })
  const response = await fetch(`https://id.twitch.tv/oauth2/token?${query}`, { method: 'POST' })
  if (!response.ok) throw new Error(`Twitch login failed: ${response.status} ${await response.text()}`)
  return ((await response.json()) as { access_token: string }).access_token
}

async function fetchIgdbGames(slugs: string[], clientId: string, token: string) {
  const response = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: { 'Client-ID': clientId, Authorization: `Bearer ${token}` },
    body: `fields ${GAME_FIELDS}; where slug = (${slugs.map((slug) => `"${slug}"`).join(',')}); limit ${slugs.length};`,
  })
  if (!response.ok) throw new Error(`IGDB request failed: ${response.status} ${await response.text()}`)
  return (await response.json()) as IgdbGame[]
}

async function download(url: string, file: string) {
  if (fs.existsSync(file)) return
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed: ${url} ${response.status}`)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()))
}

async function main() {
  const env = readEnv()
  const mediaBaseUrl = env.MEDIA_BASE_URL.replace(/\/$/, '')
  const curated: CuratedGame[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'games/curated-games.json'), 'utf8'))

  const token = await twitchToken(env.TWITCH_CLIENT_ID, env.TWITCH_CLIENT_SECRET)
  const igdbGames = await fetchIgdbGames(
    curated.map((game) => game.igdbSlug),
    env.TWITCH_CLIENT_ID,
    token,
  )
  const bySlug = new Map(igdbGames.map((game) => [game.slug, game]))

  const errors: string[] = []
  const games: SeedGame[] = []
  for (const entry of curated) {
    const igdbGame = bySlug.get(entry.igdbSlug)
    if (!igdbGame) {
      errors.push(`${entry.igdbSlug} is not in IGDB`)
      continue
    }
    const result = toSeedGame(entry, igdbGame, mediaBaseUrl)
    if ('error' in result) errors.push(result.error)
    else games.push(result.game)
  }
  if (errors.length === 0) errors.push(...mixRuleErrors(games))
  if (errors.length > 0) throw new Error(`Nothing written:\n- ${errors.join('\n- ')}`)

  for (const entry of curated) {
    for (const { url, key } of imageSources(entry, bySlug.get(entry.igdbSlug) as IgdbGame)) {
      await download(url, path.join(CACHE_DIR, key))
    }
  }

  // --size-only skips every object that is already in the bucket.
  const sync = spawnSync(
    'aws',
    ['s3', 'sync', path.join(CACHE_DIR, 'games'), `s3://${env.MEDIA_BUCKET}/games`, '--size-only'],
    { stdio: 'inherit' },
  )
  if (sync.status !== 0) throw new Error('aws s3 sync failed. Run `aws login` and try again.')

  fs.writeFileSync(path.join(__dirname, 'games/games.json'), `${JSON.stringify(games, null, 2)}\n`)
  console.log(`Wrote ${games.length} games to games/games.json.`)
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
