import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as jwt from 'jsonwebtoken'
import { Request } from 'express'
import { AuthenticatedUser } from '../types/roles'

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const authHeader = request.headers['authorization']

    if (!authHeader) {
      throw new UnauthorizedException('No token provided')
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
      throw new UnauthorizedException('Malformatted token')
    }

    try {
      const decoded = jwt.verify(parts[1], this.configService.getOrThrow<string>('ACCESS_TOKEN')) as AuthenticatedUser

      if (!decoded.email || !decoded.role) {
        throw new UnauthorizedException('Authentication error')
      }

      request.user = { email: decoded.email, role: decoded.role }
      return true
    } catch {
      throw new UnauthorizedException('Authentication error')
    }
  }
}
