import jwt from 'jsonwebtoken'

export const signToken = (user) => {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is not set')
  }

  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}
