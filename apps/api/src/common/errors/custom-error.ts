export class CustomError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode

    // Needed to make `instanceof CustomError` work when extending a built-in class in TypeScript
    Object.setPrototypeOf(this, CustomError.prototype)
  }
}
