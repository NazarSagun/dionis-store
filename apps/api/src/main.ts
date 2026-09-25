import 'reflect-metadata'
import cookieParser from 'cookie-parser'
import { BadRequestException, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'

const ALLOWED_ORIGINS = ['http://localhost:3000']

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Kept as a plain liveness route outside the /api prefix, same as before.
  app
    .getHttpAdapter()
    .getInstance()
    .get('/', (_req: unknown, res: { send: (body: string) => void }) => {
      res.send('API is alive!')
    })

  app.setGlobalPrefix('api')
  app.enableCors({ origin: ALLOWED_ORIGINS, credentials: true })
  app.use(cookieParser())

  app.useGlobalPipes(
    new ValidationPipe({
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

bootstrap()
