import { Request, Response } from 'express'
import { GamesService } from '../services'
import { CustomError } from '../middleware'

export class GamesController {
  private gamesService: GamesService

  constructor() {
    this.gamesService = new GamesService()
  }

  getGames = async (req: Request, res: Response) => {
    if (req.body.page <= 0) {
      return res.status(400).send({ message: 'Invalid page value!' })
    }
    try {
      const games = await this.gamesService.fetchGames({ page: req.body.page })

      res.status(200).send(games)
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({
          message: error.message,
        })
      }
      res.status(500).json(error)
    }
  }
}
