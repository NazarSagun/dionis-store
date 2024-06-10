import { Router } from 'express'
import { UsersController } from '../controllers'
import { verifyJWT } from '../middleware'
import { verifyRole } from '../middleware/verifyRole'

export const usersRouter = Router()
const usersController = new UsersController()

usersRouter.get('/users', verifyJWT, verifyRole(500), usersController.getAllUsers)
usersRouter.post('/user/delete', verifyJWT, verifyRole(500), usersController.removeUser)
