import { Controller, INestApplication, Post } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { Throttle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import request from 'supertest'
import { AUTH_THROTTLE } from './auth-throttle'

@Controller()
class StubController {
  @Post('login')
  @Throttle(AUTH_THROTTLE)
  login() {
    return { ok: true }
  }
}

describe('auth rate limit', () => {
  let app: INestApplication

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 300 }] })],
      controllers: [StubController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile()
    app = module.createNestApplication()
    app.getHttpAdapter().getInstance().set('trust proxy', 1)
    await app.init()
  })

  afterEach(() => app.close())

  it('answers 429 after 10 requests a minute from one address', async () => {
    const statuses: number[] = []
    for (let i = 0; i < 12; i++) {
      statuses.push((await request(app.getHttpServer()).post('/login').set('X-Forwarded-For', '203.0.113.7')).status)
    }

    expect(statuses.slice(0, 10)).toEqual(Array(10).fill(201))
    expect(statuses.slice(10)).toEqual([429, 429])
  })

  it('counts each client address on its own behind a proxy', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app.getHttpServer()).post('/login').set('X-Forwarded-For', '203.0.113.7')
    }

    const other = await request(app.getHttpServer()).post('/login').set('X-Forwarded-For', '198.51.100.9')

    expect(other.status).toBe(201)
  })
})
