import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { CustomError } from '../../common/errors/custom-error'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CreatePromoCodeDto } from './dto/create-promo-code.dto'

export const normalizeCode = (code: string) => code.trim().toUpperCase()

@Injectable()
export class PromoCodesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.promoCode.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] })
  }

  async create(dto: CreatePromoCodeDto) {
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null
    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      throw new CustomError('The expiry must be in the future', 400)
    }

    try {
      return await this.prisma.promoCode.create({
        data: { code: normalizeCode(dto.code), percentOff: dto.percentOff, expiresAt, maxUses: dto.maxUses ?? null },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new CustomError('That promo code already exists', 409)
      }
      throw error
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.promoCode.delete({ where: { id } })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new CustomError('Promo code not found', 404)
      }
      throw error
    }
  }

  // The code a user may apply now, or a CustomError that says why not. The four
  // messages differ on purpose, so the user knows what to do next.
  async findApplicable(userId: number, rawCode: string) {
    const code = normalizeCode(rawCode)
    const promo = await this.prisma.promoCode.findUnique({ where: { code } })
    if (!promo) {
      throw new CustomError('That code does not exist.', 400)
    }
    if (promo.expiresAt && promo.expiresAt.getTime() <= Date.now()) {
      throw new CustomError('That code has expired.', 400)
    }
    if (promo.maxUses !== null && promo.uses >= promo.maxUses) {
      throw new CustomError('That code has no uses left.', 400)
    }
    const redemption = await this.prisma.promoRedemption.findUnique({
      where: { userId_code: { userId, code } },
      select: { id: true },
    })
    if (redemption) {
      throw new CustomError('You already used this code.', 400)
    }
    return promo
  }
}
