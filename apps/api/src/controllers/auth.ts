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
    const { name, email, password, role } = req.body
    const isEmailValid = /\S+@\S+\.\S+/.test(email)

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'One or more credentials are missing!',
      })
    }

    if (!isEmailValid) {
      return res.status(400).json({
        message: 'Invalid email!',
      })
    }

    const userRole = !role ? 101 : role

    try {
      const user = await this.authService.register({
        name,
        email,
        password,
        role: userRole,
      })

      setHtttpOnlyCookie(res, user.refreshToken)

      res.status(201).json({
        message: 'User registered successfully!',
        user: {
          name: user.name,
          email: user.email,
          accessToken: user.accessToken,
          role: user.role,
        },
      })
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({
          message: error.message,
          user: null,
        })
      }
      res.status(500).json({
        message: 'Something went wrong!',
        user: null,
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

      res.status(201).json({
        message: 'User logged in successfully!',
        user: {
          name: user.name,
          email: user.email,
          accessToken: user.accessToken,
          role: user.role,
        },
      })
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({
          message: error.message,
          user: null,
        })
      }
      res.status(500).json({
        message: 'Something went wrong!' + error,
        user: null,
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

      res.status(200).json({
        message: 'User logged out successfully!',
      })
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({
          message: error.message,
        })
      }

      res.status(500).json({
        message: 'Something went wrong!',
      })
    }
  }

  refreshToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies

    if (!refreshToken) {
      return res.status(401).json({
        message: 'Refresh token expired, please login to the system',
        user: null,
      })
    }

    try {
      const user = await this.authService.refreshToken(refreshToken)

      res.status(200).json({
        message: 'Token varified and refreshed successfully!',
        user,
      })
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({
          message: error.message,
          user: null,
        })
      }

      res.status(500).json({
        message: 'Something went wrong!',
        user: null,
      })
    }
  }
}
