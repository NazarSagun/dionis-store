import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// One-off script for rich-game-details-spec.md, Feature 3: it empties the
// catalog of a database that already has games, so seed:api can create the
// curated games. Every order goes too, because an order item cannot point to a
// deleted game. Users and promo codes stay. Restart the API afterwards, because
// it caches game data in memory.
dotenv.config()

const prisma = new PrismaClient()

async function main() {
  const databaseName = new URL(process.env.DATABASE_URL ?? 'postgresql://unknown').pathname.slice(1)
  if (!databaseName || process.env.RESET_CATALOG_CONFIRM !== databaseName) {
    throw new Error(`Set RESET_CATALOG_CONFIRM=${databaseName || '<database name>'} to delete every game and order.`)
  }

  // Order matters: the order item and promo redemption rows point to orders and
  // games without a cascade. Reviews, replies, wishlist rows, images, sections,
  // and their notifications go through the cascades on the game and the order.
  const [redemptions, items, orders, alerts, editions, games] = await prisma.$transaction([
    prisma.promoRedemption.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.stockAlert.deleteMany(),
    prisma.gameEdition.deleteMany(),
    prisma.game_pc.deleteMany(),
    prisma.promoCode.updateMany({ data: { uses: 0 } }),
  ])

  console.log(
    `Deleted ${games.count} games, ${editions.count} editions, ${orders.count} orders, ` +
      `${items.count} order items, ${redemptions.count} promo redemptions, and ${alerts.count} stock alerts.`,
  )
  console.log('Restart the api container, then run seed:api.')
}

void main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .then(() => prisma.$disconnect())
