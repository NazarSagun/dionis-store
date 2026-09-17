import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

/**
 * Single shared PrismaClient for the whole app, handed out via DI. Each
 * service used to construct its own `new PrismaClient()`, which opens a
 * separate connection pool per instance - fine at this size, a real problem
 * once there are more than a couple of services under load.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
