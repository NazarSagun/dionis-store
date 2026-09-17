import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const API_URL = process.env.SEED_API_URL || 'http://localhost:8080/api'
const SEED_ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Seed Admin'
const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'seed-admin@dionis-store.local'
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'seed-admin-password'
const CONCURRENCY = 10

const prisma = new PrismaClient()

interface GameFixture {
  id: number
  title: string
  thumbnail: string
  short_description: string
  game_url: string
  genre: string
  platform: string
  publisher: string
  developer: string
  release_date: string
  freetogame_profile_url: string
  price: number
  rating: string
}

function getRandomDiscount(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function ensureSeedAdminExists() {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: SEED_ADMIN_NAME, email: SEED_ADMIN_EMAIL, password: SEED_ADMIN_PASSWORD }),
  })

  if (response.ok || response.status === 400) {
    // 400 here means the seed admin was already registered by a previous run - that is fine.
    return
  }

  throw new Error(`Could not register the seed admin user: ${response.status} ${await response.text()}`)
}

async function promoteSeedAdminToAdminRole() {
  // The API has no self-serve way to become an Admin (register always assigns the User role),
  // and POST /games is Admin-gated like the other write endpoints. This is the one step in the
  // whole pipeline that talks to the DB directly instead of the API, purely to bootstrap that role.
  await prisma.user.update({
    where: { email: SEED_ADMIN_EMAIL },
    data: { role: 500 },
  })
}

async function login(): Promise<string> {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SEED_ADMIN_EMAIL, password: SEED_ADMIN_PASSWORD }),
  })

  if (!response.ok) {
    throw new Error(`Could not log in as the seed admin: ${response.status} ${await response.text()}`)
  }

  const { user } = (await response.json()) as { user: { accessToken: string } }
  return user.accessToken
}

async function createGame(game: GameFixture, accessToken: string): Promise<'created' | 'skipped'> {
  const payload = { ...game, discount: getRandomDiscount(5, 85) }

  const response = await fetch(`${API_URL}/games`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })

  if (response.status === 201) {
    return 'created'
  }
  if (response.status === 409) {
    return 'skipped'
  }
  throw new Error(`Failed to create "${game.title}": ${response.status} ${await response.text()}`)
}

async function createGameWithReauth(game: GameFixture, accessToken: { current: string }) {
  try {
    return await createGame(game, accessToken.current)
  } catch (error) {
    // The access token expires after 30s. If a batch of games takes longer than that, re-login once and retry.
    accessToken.current = await login()
    return createGame(game, accessToken.current)
  }
}

async function runInBatches<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size)
    results.push(...(await Promise.all(batch.map(fn))))
  }
  return results
}

async function main() {
  const games: GameFixture[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../mock/games/games.json'), 'utf8'))

  console.log(`Seeding ${games.length} games into ${API_URL} via real API calls...`)

  await ensureSeedAdminExists()
  await promoteSeedAdminToAdminRole()
  const accessToken = { current: await login() }

  const results = await runInBatches(games, CONCURRENCY, (game) => createGameWithReauth(game, accessToken))

  const created = results.filter((result) => result === 'created').length
  const skipped = results.filter((result) => result === 'skipped').length

  console.log(`Done. Created ${created}, skipped ${skipped} (already existed).`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
