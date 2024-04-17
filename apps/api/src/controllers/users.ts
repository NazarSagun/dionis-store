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

  removeAllUsers = async (req: Request, res: Response) => {
    try {
      await this.prisma.user.deleteMany()
      res.status(200).json({ message: 'All users deleted!' })
    } catch (error) {
      res.status(500).json(error)
    }
  }
}
