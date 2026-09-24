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
