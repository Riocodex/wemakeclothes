import jwt from 'jsonwebtoken'

import { User } from '../models/index.js'
import { HttpError, asyncHandler } from '../utils/httpError.js'

const getBearerUser = async (req) => {
  const authHeader = req.get('authorization') || ''
  const [scheme, token] = authHeader.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return null
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set')
  }

  let payload
  try {
    payload = jwt.verify(token, secret)
  } catch {
    return null
  }

  const user = await User.findById(payload.sub)
  return user || null
}

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  req.user = await getBearerUser(req)
  next()
})

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const user = await getBearerUser(req)

  if (!user) {
    throw new HttpError(401, 'Authentication required')
  }

  req.user = user
  next()
})
