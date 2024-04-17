import { Response } from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { Role, DecodedProperty } from '../types'

dotenv.config()

export const setHtttpOnlyCookie = (res: Response, refreshToken: string) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000,
  })
}

export const createAccessToken = (payload: DecodedProperty, expiresIn: string) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN, { expiresIn })
}

export const createRefreshToken = (payload: string, expiresIn: string) => {
  return jwt.sign({ payload }, process.env.REFRESH_TOKEN, { expiresIn })
}

export const getDecodedDto = (email: string, role: Role = 101) => {
  return {
    email,
    role,
  }
}
