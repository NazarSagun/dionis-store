import { Request, Response } from 'express'
import { AuthService } from '../services'
import { CustomError } from '../middleware'
import { setHtttpOnlyCookie } from '../helpers/auth'

export class AuthController {
  private authService: AuthService

  constructor() {
    this.authService = new AuthService()
  }

  register = async (req: Request, res: Response) => {
    const { name, email, password } = req.body
    const isEmailValid = /\S+@\S+\.\S+/.test(email)

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Content cannot be empty!',
      })
    }

    if (!isEmailValid) {
      return res.status(400).json({
        message: 'Invalid email or password!',
      })
    }

    try {
      const user = await this.authService.register({
        name,
        email,
        password,
      })

      setHtttpOnlyCookie(res, user.refreshToken)

      return res.status(201).json({
        message: 'User registered successfully!',
        user,
      })
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({
          message: error.message,
        })
      }
      return res.status(500).json({
        message: 'Something went wrong!',
      })
    }
  }

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: 'Content cannot be empty!',
      })
    }

    try {
      const user = await this.authService.login({
        email,
        password,
      })

      setHtttpOnlyCookie(res, user.refreshToken)

      return res.status(201).json({
        message: 'User logged in successfully!',
        user,
      })
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({
          message: error.message,
        })
      }
      return res.status(500).json({
        message: 'Something went wrong!',
      })
    }
  }

  logout = async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies

    if (!refreshToken) {
      return res.status(401).json({
        message: 'No token provided',
      })
    }

    try {
      await this.authService.logout(refreshToken)

      return res.status(200).json({
        message: 'User logged out successfully!',
      })
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({
          message: error.message,
        })
      }

      return res.status(500).json({
        message: 'Something went wrong!',
      })
    }
  }

  refreshToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies

    if (!refreshToken) {
      return res.status(401).json({
        message: 'No token provided',
      })
    }

    try {
      const user = await this.authService.refreshToken(refreshToken)

      return res.status(200).json({
        message: 'Token refreshed successfully!',
        accessToken: user.accessToken,
      })
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({
          message: error.message,
        })
      }

      return res.status(500).json({
        message: 'Something went wrong!',
      })
    }
  }
}
