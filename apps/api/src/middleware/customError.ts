export class CustomError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode

    // This line is needed to make the instanceof check work when extending built-in classes in TypeScript
    Object.setPrototypeOf(this, CustomError.prototype)
  }
}
