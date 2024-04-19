import jwt from 'jsonwebtoken'
import { Response, NextFunction } from 'express'
import dotenv from 'dotenv'
import { AuthInfoRequest } from '../types'

dotenv.config()

export function verifyJWT(req: AuthInfoRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' })
  }

  const parts = authHeader.split(' ')

  if (parts.length !== 2) {
    return res.status(401).json({ message: 'Token error' })
  }

  const [scheme, token] = parts

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ message: 'Malformatted token' })
  }

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err || !decoded.email || !decoded.role) {
      return res.status(401).json({ message: 'Forbidden' })
    }

    req.email = decoded.email
    req.role = decoded.role
    next()
  })
}