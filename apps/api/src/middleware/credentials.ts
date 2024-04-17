import { Request, Response, NextFunction } from 'express'
import { allowedOrigins } from '../config'

export const verifyCredentials = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  next()
}
