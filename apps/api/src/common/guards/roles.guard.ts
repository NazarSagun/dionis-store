import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLE_KEY } from '../decorators/roles.decorator'
import { Role } from '../types/roles'
import { AuthenticatedRequest } from './jwt-auth.guard'

/**
 * Reads the role JwtAuthGuard already verified onto `request.user` - it does
 * not re-verify the token. Must run after JwtAuthGuard in the guard chain.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Must check both: @RequireRole can be set on the handler or on the whole controller class
    // (e.g. UsersController), and only the handler-level check would silently miss the latter.
    const requiredRole = this.reflector.getAllAndOverride<Role>(ROLE_KEY, [context.getHandler(), context.getClass()])
    if (!requiredRole) {
      return true
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    if (request.user?.role !== requiredRole) {
      throw new ForbiddenException('Forbidden')
    }

    return true
  }
}
