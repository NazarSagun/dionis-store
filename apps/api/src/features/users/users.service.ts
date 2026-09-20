import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CustomError } from '../../common/errors/custom-error'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany()
  }

  async updateName(email: string, name: string) {
    const userExists = await this.prisma.user.findUnique({ where: { email } })
    if (!userExists) {
      throw new CustomError('User does not exist', 400)
    }

    const updated = await this.prisma.user.update({ where: { email }, data: { name } })
    return { name: updated.name }
  }

  async changePassword(email: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new CustomError('User does not exist', 400)
    }

    const isCurrentPasswordValid = bcrypt.compareSync(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      throw new CustomError('Current password is incorrect', 400)
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10)
    await this.prisma.user.update({ where: { email }, data: { password: hashedPassword } })
  }

  async remove(id: number) {
    const userExists = await this.prisma.user.findUnique({ where: { id } })
    if (!userExists) {
      throw new CustomError('There is no such user', 400)
    }

    await this.prisma.user.delete({ where: { id } })
  }
}
