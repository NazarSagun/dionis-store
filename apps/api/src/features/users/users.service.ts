import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CustomError } from '../../common/errors/custom-error'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany()
  }

  async remove(id: number) {
    const userExists = await this.prisma.user.findUnique({ where: { id } })
    if (!userExists) {
      throw new CustomError('There is no such user', 400)
    }

    await this.prisma.user.delete({ where: { id } })
  }
}
