import { SetMetadata } from '@nestjs/common'
import { Role } from '../types/roles'

export const ROLE_KEY = 'role'

/** Marks a handler as requiring an exact role match, enforced by RolesGuard. */
export const RequireRole = (role: Role) => SetMetadata(ROLE_KEY, role)
