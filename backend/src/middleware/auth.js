import { createAnonClient, createUserClient } from '../config/supabase.js'
import { toAuthUser } from '../db/map.js'
import { HttpError, asyncHandler } from '../utils/httpError.js'

const PROFILE_COLUMNS = 'id, name, email, avatar_url, role, created_at, updated_at'

const loadProfile = async (userId, accessToken) => {
  const supabase = createUserClient(accessToken)
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.get('authorization') || ''
  const [scheme, token] = authHeader.split(' ')

  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Authentication required')
  }

  const { data, error } = await createAnonClient().auth.getUser(token)
  if (error || !data?.user) {
    throw new HttpError(401, 'Invalid or expired token')
  }

  const profile = await loadProfile(data.user.id, token)
  if (!profile) {
    throw new HttpError(401, 'User no longer exists')
  }

  req.accessToken = token
  req.supabase = createUserClient(token)
  req.user = toAuthUser(profile)
  next()
})
