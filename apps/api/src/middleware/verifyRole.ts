/* eslint-disable @typescript-eslint/no-namespace */
import { Response, NextFunction } from 'express'
import { AuthInfoRequest, Role } from '../types'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

export const verifyRole = (role: Role) => {
  return (req: AuthInfoRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || req.headers.Authorization
    if (!authHeader) {
      return res.status(401).send({ auth: false, message: 'No token provided.' })
    }

    if (typeof authHeader !== 'string') {
      return res.status(401).json({ message: 'Provided token should have a string format' })
    }

    const parts = authHeader.split(' ')

    const [scheme, token] = parts

    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ message: 'Malformatted token' })
    }

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
      if (err || !decoded.email) {
        return res.status(401).json({ message: 'Authentication error. ' + err })
      }

      req.role = decoded.role

      if (req.role !== role) {
        return res.status(403).json({ message: 'Forbidden' })
      }

      next()
    })
  }
}
