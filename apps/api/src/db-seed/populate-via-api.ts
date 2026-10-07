import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import { insertGameEditionsData } from './games/insertGameEditions'

dotenv.config()

const API_URL = process.env.SEED_API_URL || 'http://localhost:3500/api'
const SEED_ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Seed Admin'
const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'seed-admin@dionis-store.local'
// No default: a known default password on a public deployment is an open admin account.
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? ''
const ADMIN_ROLE = 500
const CONCURRENCY = 10

const prisma = new PrismaClient()

interface GameFixture {
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
}

function getRandomDiscount(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// The API has no self-serve way to become an Admin (register always assigns
// the User role), and POST /games is Admin-gated. So this is the one step that
// writes to the database directly, to bootstrap that role. It creates the admin
// itself and never promotes an account that already exists: anyone can
// register an email first, and promoting it would hand them the admin role.
async function ensureSeedAdminExists() {
  const existing = await prisma.user.findUnique({ where: { email: SEED_ADMIN_EMAIL } })
  if (existing) {
    if (existing.role !== ADMIN_ROLE) {
      throw new Error(`${SEED_ADMIN_EMAIL} already exists without the admin role. Refusing to promote it.`)
    }
    return
  }

  await prisma.user.create({
    data: {
      name: SEED_ADMIN_NAME,
      email: SEED_ADMIN_EMAIL,
      password: await bcrypt.hash(SEED_ADMIN_PASSWORD, 10),
      role: ADMIN_ROLE,
    },
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
    // The access token expires after 15 minutes. If seeding takes longer than that, re-login once and retry.
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
  const games: GameFixture[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'games/games.json'), 'utf8'))

  console.log(`Seeding ${games.length} games into ${API_URL} via real API calls...`)

  if (!SEED_ADMIN_PASSWORD) {
    throw new Error('Set SEED_ADMIN_PASSWORD before seeding.')
  }

  await ensureSeedAdminExists()
  const accessToken = { current: await login() }

  const results = await runInBatches(games, CONCURRENCY, (game) => createGameWithReauth(game, accessToken))

  const created = results.filter((result) => result === 'created').length
  const skipped = results.filter((result) => result === 'skipped').length

  console.log(`Done. Created ${created}, skipped ${skipped} (already existed).`)

  // The API has no route for editions (physical-editions-spec.md seeds them
  // directly), and insertGameEditionsData does not check for existing rows.
  if ((await prisma.gameEdition.count()) === 0) {
    await insertGameEditionsData(prisma)
  }
}

void main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .then(() => prisma.$disconnect())
