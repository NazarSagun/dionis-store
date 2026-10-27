import { Test } from '@nestjs/testing'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CreatePromoCodeDto } from './dto/create-promo-code.dto'
import { PromoCodesService } from './promo-codes.service'

describe('PromoCodesService', () => {
  let service: PromoCodesService
  let prisma: {
    promoCode: { findMany: jest.Mock; create: jest.Mock; delete: jest.Mock; findUnique: jest.Mock }
    promoRedemption: { findUnique: jest.Mock }
  }

  const knownError = (code: string) => new Prisma.PrismaClientKnownRequestError('x', { code, clientVersion: 'test' })
  const hour = 60 * 60 * 1000

  beforeEach(async () => {
    prisma = {
      promoCode: { findMany: jest.fn(), create: jest.fn(), delete: jest.fn(), findUnique: jest.fn() },
      promoRedemption: { findUnique: jest.fn().mockResolvedValue(null) },
    }
    const module = await Test.createTestingModule({
      providers: [PromoCodesService, { provide: PrismaService, useValue: prisma }],
    }).compile()
    service = module.get(PromoCodesService)
  })

  describe('list', () => {
    it('returns the codes newest first, with their uses', async () => {
      prisma.promoCode.findMany.mockResolvedValue([])

      await service.list()

      expect(prisma.promoCode.findMany).toHaveBeenCalledWith({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] })
    })
  })

  describe('create', () => {
    const dto = (overrides: Partial<CreatePromoCodeDto> = {}) => ({ code: 'save10', percentOff: 10, ...overrides })

    it('stores the code in uppercase, with no expiry and no limit when none is sent', async () => {
      prisma.promoCode.create.mockResolvedValue({ id: 1 })

      await service.create(dto())

      expect(prisma.promoCode.create).toHaveBeenCalledWith({
        data: { code: 'SAVE10', percentOff: 10, expiresAt: null, maxUses: null },
      })
    })

    it('keeps the expiry and the limit', async () => {
      const expiresAt = new Date(Date.now() + hour)
      prisma.promoCode.create.mockResolvedValue({ id: 1 })

      await service.create(dto({ expiresAt: expiresAt.toISOString(), maxUses: 5 }))

      expect(prisma.promoCode.create).toHaveBeenCalledWith({
        data: { code: 'SAVE10', percentOff: 10, expiresAt, maxUses: 5 },
      })
    })

    it('refuses an expiry in the past', async () => {
      await expect(service.create(dto({ expiresAt: new Date(Date.now() - hour).toISOString() }))).rejects.toMatchObject(
        { statusCode: 400 },
      )
      expect(prisma.promoCode.create).not.toHaveBeenCalled()
    })

    it('answers 409 for a code that exists, and rethrows any other error', async () => {
      prisma.promoCode.create.mockRejectedValueOnce(knownError('P2002'))
      await expect(service.create(dto())).rejects.toMatchObject({ statusCode: 409 })

      prisma.promoCode.create.mockRejectedValueOnce(new Error('db down'))
      await expect(service.create(dto())).rejects.toThrow('db down')
    })
  })

  describe('remove', () => {
    it('deletes by id and answers 404 for an unknown id', async () => {
      prisma.promoCode.delete.mockResolvedValueOnce({})
      await service.remove(3)
      expect(prisma.promoCode.delete).toHaveBeenCalledWith({ where: { id: 3 } })

      prisma.promoCode.delete.mockRejectedValueOnce(knownError('P2025'))
      await expect(service.remove(99)).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  describe('findApplicable', () => {
    const promo = { id: 1, code: 'SAVE10', percentOff: 10, expiresAt: null, maxUses: null, uses: 0 }

    it('finds a code ignoring case and spaces', async () => {
      prisma.promoCode.findUnique.mockResolvedValue(promo)

      await expect(service.findApplicable(7, ' save10 ')).resolves.toBe(promo)

      expect(prisma.promoCode.findUnique).toHaveBeenCalledWith({ where: { code: 'SAVE10' } })
      expect(prisma.promoRedemption.findUnique).toHaveBeenCalledWith({
        where: { userId_code: { userId: 7, code: 'SAVE10' } },
        select: { id: true },
      })
    })

    it('refuses an unknown code, an expired code, a used-up code, and an already-used code with four messages', async () => {
      const messages: string[] = []
      const refusal = async () => {
        try {
          await service.findApplicable(7, 'SAVE10')
        } catch (error) {
          messages.push((error as Error).message)
          expect(error).toMatchObject({ statusCode: 400 })
        }
      }

      prisma.promoCode.findUnique.mockResolvedValue(null)
      await refusal()
      prisma.promoCode.findUnique.mockResolvedValue({ ...promo, expiresAt: new Date(Date.now() - hour) })
      await refusal()
      prisma.promoCode.findUnique.mockResolvedValue({ ...promo, maxUses: 5, uses: 5 })
      await refusal()
      prisma.promoCode.findUnique.mockResolvedValue(promo)
      prisma.promoRedemption.findUnique.mockResolvedValue({ id: 1 })
      await refusal()

      expect(messages).toHaveLength(4)
      expect(new Set(messages).size).toBe(4)
      expect(messages[3]).toMatch(/already used/i)
    })

    it('accepts a code that expires later and has uses left', async () => {
      const open = { ...promo, expiresAt: new Date(Date.now() + hour), maxUses: 5, uses: 4 }
      prisma.promoCode.findUnique.mockResolvedValue(open)

      await expect(service.findApplicable(7, 'SAVE10')).resolves.toBe(open)
    })
  })
})
