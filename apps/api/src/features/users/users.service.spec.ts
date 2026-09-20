import { Test } from '@nestjs/testing'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../../common/prisma/prisma.service'
import { UsersService } from './users.service'

describe('UsersService', () => {
  let service: UsersService
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock }
  }

  const user = { id: 1, email: 'player@dionis-store.test', password: bcrypt.hashSync('password123', 10) }

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(user), update: jest.fn() },
    }

    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile()

    service = module.get(UsersService)
  })

  describe('updateName', () => {
    it('updates the name and returns it', async () => {
      prisma.user.update.mockResolvedValue({ ...user, name: 'New Name' })

      const result = await service.updateName(user.email, 'New Name')

      expect(prisma.user.update).toHaveBeenCalledWith({ where: { email: user.email }, data: { name: 'New Name' } })
      expect(result).toEqual({ name: 'New Name' })
    })

    it('rejects a user that does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(service.updateName(user.email, 'New Name')).rejects.toThrow('User does not exist')
      expect(prisma.user.update).not.toHaveBeenCalled()
    })
  })

  describe('changePassword', () => {
    it('rejects a wrong current password without touching the database', async () => {
      await expect(service.changePassword(user.email, 'wrong-password', 'newpassword456')).rejects.toThrow(
        'Current password is incorrect',
      )
      expect(prisma.user.update).not.toHaveBeenCalled()
    })

    it('hashes and saves the new password when the current one is correct', async () => {
      await service.changePassword(user.email, 'password123', 'newpassword456')

      expect(prisma.user.update).toHaveBeenCalledTimes(1)
      const [[{ where, data }]] = prisma.user.update.mock.calls
      expect(where).toEqual({ email: user.email })
      expect(data.password).not.toBe('newpassword456')
      expect(bcrypt.compareSync('newpassword456', data.password)).toBe(true)
    })
  })
})
