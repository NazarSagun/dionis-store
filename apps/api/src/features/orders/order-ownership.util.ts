import { PrismaService } from '../../common/prisma/prisma.service'

interface OwnershipCheckItem {
  gameId: number
  editionId?: number | null
}

export function findOwnedItem(prisma: PrismaService, userId: number, items: OwnershipCheckItem[]) {
  return prisma.orderItem.findFirst({
    where: {
      order: { userId },
      OR: items.map((item) => ({ gameId: item.gameId, editionId: item.editionId ?? null })),
    },
  })
}

// True when the user bought the game in any form: the digital copy or any
// physical edition. Reviews use this, because findOwnedItem needs the edition.
export function findOwnedGame(prisma: PrismaService, userId: number, gameId: number) {
  return prisma.orderItem.findFirst({ where: { gameId, order: { userId } }, select: { id: true } })
}
