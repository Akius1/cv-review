/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/auth/utils.ts
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'


const JWT_SECRET = process.env.JWT_SECRET!
if (!JWT_SECRET) {
  throw new Error('Missing process.env.JWT_SECRET')
}
const encoder = new TextEncoder()
const rawSecret = encoder.encode(JWT_SECRET)

const secretKeyPromise = crypto.subtle.importKey(
  'raw',
  rawSecret,
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign', 'verify']
)

// --- 2) Password “hashing” & verification (your demo base64) ---
export function hashPassword(password: string): string {
  return Buffer.from(password).toString('base64')
}
export function verifyPassword(password: string, hashed: string): boolean {
  return Buffer.from(password).toString('base64') === hashed
}

// --- 3) JWT generation & verification using jose ---
export async function generateToken(payload: Record<string, any>): Promise<string> {
  const key = await secretKeyPromise
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const key = await secretKeyPromise
    const { payload } = await jwtVerify(token, key)
    return payload
  } catch {
    return null
  }
}

// --- 4) Simple form validators & type‑guards ---
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[0-9]{10,15}$/
  return phoneRegex.test(phone)
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  return { valid: true }
}

export function isExpert(user: any): boolean {
  return user?.user_type === 'expert'
}

export function isApplicant(user: any): boolean {
  return user?.user_type === 'applicant'
}
