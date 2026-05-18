import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'ev-charging-jwt-secret-2024'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  name: string
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try { return jwt.verify(token, JWT_SECRET) as JWTPayload }
  catch { return null }
}

export function getTokenFromRequest(req: NextRequest): JWTPayload | null {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return verifyToken(auth.slice(7))
  const cookie = req.cookies.get('token')?.value
  if (cookie) return verifyToken(cookie)
  return null
}
