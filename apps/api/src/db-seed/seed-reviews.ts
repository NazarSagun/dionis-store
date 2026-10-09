import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import dotenv from 'dotenv'

dotenv.config()

const USER_COUNT = 30
// Same size and default order (id asc) as the first page of GET /games.
const FIRST_PAGE_SIZE = 20
const SEED_REVIEWER_PASSWORD = process.env.SEED_REVIEWER_PASSWORD ?? ''

const BODIES = [
  'Great game, hours well spent.',
  'Solid, but it gets repetitive near the end.',
  'Looks beautiful and runs smoothly.',
  'Not worth the full price. Wait for a sale.',
  'Best purchase I made this year.',
  'Fun with friends, average alone.',
  'Controls feel clunky at first, then it clicks.',
  '',
]

const prisma = new PrismaClient()

const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)]
// Skews high, like real store ratings.
const randomRating = () => pick([5, 5, 4, 4, 4, 3, 3, 2, 1])

async function main() {
  const url = process.env.DATABASE_URL ?? ''
  if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
    throw new Error('DATABASE_URL is not local. Refusing to seed fake reviewers.')
  }
  if (!SEED_REVIEWER_PASSWORD) {
    throw new Error('Set SEED_REVIEWER_PASSWORD before seeding.')
  }

  const games = await prisma.game_pc.findMany({ orderBy: { id: 'asc' }, take: FIRST_PAGE_SIZE })
  if (games.length === 0) {
    throw new Error('No games found. Run seed:api first.')
  }

  const password = await bcrypt.hash(SEED_REVIEWER_PASSWORD, 10)
  let reviews = 0

  for (let i = 1; i <= USER_COUNT; i++) {
    const n = String(i).padStart(2, '0')
    const user = await prisma.user.upsert({
      where: { email: `reviewer-${n}@dionis-store.local` },
      update: {},
      create: { email: `reviewer-${n}@dionis-store.local`, name: `Reviewer ${n}`, password },
    })

    // Each user reviews a random 40-80% of the games.
    const share = 0.4 + Math.random() * 0.4
    for (const game of games.filter(() => Math.random() < share)) {
      const owned = await prisma.orderItem.findFirst({ where: { gameId: game.id, order: { userId: user.id } } })
      if (!owned) {
        await prisma.order.create({
          data: {
            userId: user.id,
            totalPrice: game.price,
            stripePaymentIntentId: `seed_pi_${user.id}_${game.id}`,
            items: { create: { gameId: game.id, quantity: 1, price: game.price } },
          },
        })
      }
      await prisma.review.upsert({
        where: { userId_gameId: { userId: user.id, gameId: game.id } },
        update: {},
        create: { userId: user.id, gameId: game.id, rating: randomRating(), body: pick(BODIES) },
      })
      reviews++
    }
  }

  console.log(`Done. ${USER_COUNT} reviewers, ${reviews} reviews on ${games.length} games.`)
}

void main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .then(() => prisma.$disconnect())
