import jwt from 'jsonwebtoken'

import { User } from '../models/index.js'
import { HttpError, asyncHandler } from '../utils/httpError.js'

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.get('authorization') || ''
  const [scheme, token] = authHeader.split(' ')

  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Authentication required')
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set')
  }

  let payload
  try {
    payload = jwt.verify(token, secret)
  } catch {
    throw new HttpError(401, 'Invalid or expired token')
  }

  const user = await User.findById(payload.sub)
  if (!user) {
    throw new HttpError(401, 'User no longer exists')
  }

  req.user = user
  next()
})
