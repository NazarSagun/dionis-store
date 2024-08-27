import { Request, Response } from 'express'
import { GamesService } from '../services'
import { CustomError } from '../middleware'

export class GamesController {
  private gamesService: GamesService

  constructor() {
    this.gamesService = new GamesService()
  }

  getGames = async (req: Request, res: Response) => {
    const page = parseInt(req.params.page, 10)

    // Validate the page parameter
    if (isNaN(page) || page <= 0) {
      return res.status(400).json({ message: 'Invalid page number supplied' })
    }
    try {
      const games = await this.gamesService.fetchGames({ page })

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

  getGame = async (req: Request, res: Response) => {
    // Validate the page parameter
    if (!req.params.gameId || !Number(req.params.gameId)) {
      return res.status(400).json({ message: 'Invalid game id or type supplied' })
    }
    const gameId = Number(req.params.gameId)
    try {
      const game = await this.gamesService.fetchGameById({ gameId })

      res.status(200).send(game)
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
