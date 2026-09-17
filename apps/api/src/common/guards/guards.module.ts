import { Global, Module } from '@nestjs/common'
import { JwtAuthGuard } from './jwt-auth.guard'
import { RolesGuard } from './roles.guard'

/** Shared home for JwtAuthGuard + RolesGuard so feature modules just import this once. */
@Global()
@Module({
  providers: [JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard],
})
export class GuardsModule {}
