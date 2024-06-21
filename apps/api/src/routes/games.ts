import { Router } from 'express'
import { GamesController } from '../controllers'

export const gamesRouter = Router()
const gamesController = new GamesController()

gamesRouter.get('/games', gamesController.getGames)
