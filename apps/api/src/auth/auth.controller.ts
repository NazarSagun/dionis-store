import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { setRefreshTokenCookie } from './auth-token.util'
import { CustomError } from '../common/errors/custom-error'
import { toHttpException } from '../common/errors/to-http-exception'

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    try {
      const user = await this.authService.register(dto)
      setRefreshTokenCookie(res, user.refreshToken)

      return {
        message: 'User registered successfully',
        user: { name: user.name, email: user.email, accessToken: user.accessToken, role: user.role },
      }
    } catch (error) {
      throw toHttpException(error, { user: null })
    }
  }

  @Post('login')
  @HttpCode(201)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    try {
      const user = await this.authService.login(dto)
      setRefreshTokenCookie(res, user.refreshToken)

      return {
        message: 'User logged in successfully',
        user: { name: user.name, email: user.email, accessToken: user.accessToken, role: user.role },
      }
    } catch (error) {
      throw toHttpException(error, { user: null })
    }
  }

  @Get('logout')
  async logout(@Req() req: Request) {
    const refreshToken = req.cookies?.refreshToken

    if (!refreshToken) {
      throw toHttpException(new CustomError('No token provided', 401))
    }

    try {
      await this.authService.logout(refreshToken)
      return { message: 'User logged out successfully' }
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Get('refresh')
  async refreshToken(@Req() req: Request) {
    const refreshToken = req.cookies?.refreshToken

    if (!refreshToken) {
      throw toHttpException(new CustomError('Refresh token expired, please login to the system', 401), {
        user: null,
      })
    }

    try {
      const user = await this.authService.refreshToken(refreshToken)
      return { message: 'Token varified and refreshed successfully', user }
    } catch (error) {
      throw toHttpException(error, { user: null })
    }
  }
}
