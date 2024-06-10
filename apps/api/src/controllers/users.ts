import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

export class UsersController {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  getAllUsers = async (req: Request, res: Response) => {
    try {
      const users = await this.prisma.user.findMany()
      res.status(200).json(users)
    } catch (error) {
      res.status(500).json(error)
    }
  }

  removeUser = async (req: Request, res: Response) => {
    const id = req.body.id
    if (!req.body.id) {
      return res.status(400).json({ message: 'Provide user id' })
    }
    const userExists = await this.prisma.user.findUnique({
      where: {
        id,
      },
    })
    if (!userExists) {
      return res.status(400).json({ message: 'There is no such user' })
    }
    try {
      await this.prisma.user.delete({
        where: {
          id,
        },
      })
      res.status(200).json({ message: 'User deleted!' })
    } catch (error) {
      res.status(500).json(error)
    }
  }
}
