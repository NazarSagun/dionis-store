import 'reflect-metadata'
import cookieParser from 'cookie-parser'
import { BadRequestException, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'

// Comma-separated list, so a deployment can allow more than one web origin.
function getAllowedOrigins(): string[] {
  const origins = (process.env.CLIENT_URL ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  if (origins.length === 0) {
    throw new Error('CLIENT_URL is not set. Set it to the web app origin, e.g. http://localhost:3000')
  }
  return origins
}

async function bootstrap() {
  // rawBody keeps the unparsed request body on req.rawBody, which the Stripe
  // webhook's signature check needs.
  const app = await NestFactory.create(AppModule, { rawBody: true })

  // Kept as a plain liveness route outside the /api prefix, same as before.
  app
    .getHttpAdapter()
    .getInstance()
    .get('/', (_req: unknown, res: { send: (body: string) => void }) => {
      res.send('API is alive!')
    })

  const httpServer = app.getHttpAdapter().getInstance()
  httpServer.disable('x-powered-by')
  // TRUST_PROXY is the number of reverse proxies in front of the API (1 behind
  // Caddy). Without it, every request looks like it comes from the proxy, and
  // the rate limit would count all users together.
  httpServer.set('trust proxy', Number(process.env.TRUST_PROXY) || 0)

  app.setGlobalPrefix('api')
  app.enableCors({ origin: getAllowedOrigins(), credentials: true })
  app.use(cookieParser())

  app.useGlobalPipes(
    new ValidationPipe({
      // Drops every property that has no validation rule, so an extra field in a
      // body never reaches the database layer.
      whitelist: true,
      exceptionFactory: (errors) => {
        const message = errors
          .map((error) => Object.values(error.constraints ?? {}).join(', '))
          .filter(Boolean)
          .join('; ')
        return new BadRequestException({ message: message || 'Invalid request body' })
      },
    }),
  )
  app.useGlobalFilters(new AllExceptionsFilter())

  const port = process.env.PORT || 3500
  await app.listen(port)
  // eslint-disable-next-line no-console
  console.log(`Server is running on port ${port}`)
}

void bootstrap()
