import { User } from '../models/index.js'
import { HttpError, asyncHandler } from '../utils/httpError.js'
import { signToken } from '../utils/tokens.js'

const serializeAuth = (user) => ({
  user: user.toJSON(),
  token: signToken(user),
})

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  if (!name?.trim() || !email?.trim() || !password) {
    throw new HttpError(400, 'Name, email, and password are required')
  }

  if (password.length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters')
  }

  const existing = await User.findOne({ email: email.trim().toLowerCase() })
  if (existing) {
    throw new HttpError(409, 'An account with this email already exists')
  }

  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: password,
  })

  res.status(201).json(serializeAuth(user))
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email?.trim() || !password) {
    throw new HttpError(400, 'Email and password are required')
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash')
  if (!user || !(await user.comparePassword(password))) {
    throw new HttpError(401, 'Invalid email or password')
  }

  res.status(200).json(serializeAuth(user))
})

export const me = asyncHandler(async (req, res) => {
  res.status(200).json({
    user: req.user.toJSON(),
  })
})
