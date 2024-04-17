import { Router } from 'express'
import { AuthController } from '../controllers'

export const authRouter = Router()
const authController = new AuthController()

authRouter.post('/register', authController.register)
authRouter.post('/login', authController.login)
authRouter.get('/logout', authController.logout)
authRouter.get('/refresh', authController.refreshToken)
