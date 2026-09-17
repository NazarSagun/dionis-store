import { HttpException } from '@nestjs/common'
import { CustomError } from './custom-error'

/**
 * Maps a thrown error to the HttpException the app's clients already expect:
 * `{ message: string, ...extraBody }` with the right status code. Keeps every
 * controller's catch block to one line instead of repeating the
 * CustomError/500 branching everywhere.
 */
export function toHttpException(error: unknown, extraBody: Record<string, unknown> = {}): HttpException {
  if (error instanceof CustomError) {
    return new HttpException({ message: error.message, ...extraBody }, error.statusCode)
  }

  return new HttpException({ message: 'Something went wrong', ...extraBody }, 500)
}
