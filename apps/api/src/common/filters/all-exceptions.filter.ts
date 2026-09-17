import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { Response } from 'express'

/**
 * Last-resort safety net for anything that isn't already a handled HttpException
 * (thrown by `toHttpException`, a guard, or Nest's ValidationPipe). Keeps the
 * app-wide error contract (`{ message: string }`) even for unexpected failures.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse())
      return
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Something went wrong' })
  }
}
