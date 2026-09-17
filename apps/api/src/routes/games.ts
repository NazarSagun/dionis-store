import { Router } from 'express'
import { GamesController } from '../controllers'
import { verifyJWT } from '../middleware'
import { verifyRole } from '../middleware/verifyRole'
import { Roles } from '../types'

export const gamesRouter = Router()
const gamesController = new GamesController()

gamesRouter.get('/games/:page', gamesController.getGames)
gamesRouter.get('/game/:gameId', gamesController.getGame)
gamesRouter.post('/games', verifyJWT, verifyRole(Roles.Admin), gamesController.createGame)
