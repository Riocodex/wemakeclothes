import { createAnonClient, createServiceClient, hasSupabaseConfig } from '../config/supabase.js'
import { mapProfile, toAuthUser } from '../db/map.js'
import { HttpError, asyncHandler } from '../utils/httpError.js'
import { serializeUser } from '../utils/serializers.js'

const PROFILE_COLUMNS = 'id, name, email, avatar_url, role, created_at, updated_at'

const isExistingUserError = (error) => {
  const message = (error?.message || '').toLowerCase()
  return error?.status === 422
    || error?.code === 'email_exists'
    || message.includes('already registered')
    || message.includes('already been registered')
    || message.includes('user already exists')
}

const loadProfile = async (userId) => {
  const { data, error } = await createServiceClient()
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

const serializeAuth = (profile, token) => ({
  user: serializeUser(toAuthUser(mapProfile(profile))),
  token,
})

const requireSupabase = () => {
  if (!hasSupabaseConfig()) {
    throw new HttpError(
      503,
      'Supabase is not configured. Add SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to backend/.env, then restart the API.'
    )
  }
}

export const register = asyncHandler(async (req, res) => {
  requireSupabase()
  const { name, email, password } = req.body

  if (!name?.trim() || !email?.trim() || !password) {
    throw new HttpError(400, 'Name, email, and password are required')
  }

  if (password.length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters')
  }

  const normalizedEmail = email.trim().toLowerCase()
  const trimmedName = name.trim()
  const service = createServiceClient()

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: { name: trimmedName },
  })

  if (createError) {
    if (isExistingUserError(createError)) {
      throw new HttpError(409, 'An account with this email already exists')
    }
    throw createError
  }

  const { error: profileError } = await service
    .from('profiles')
    .update({ name: trimmedName, email: normalizedEmail })
    .eq('id', created.user.id)

  if (profileError) {
    throw profileError
  }

  const { data: sessionData, error: sessionError } = await createAnonClient().auth.signInWithPassword({
    email: normalizedEmail,
    password,
  })

  if (sessionError || !sessionData?.session?.access_token) {
    throw new HttpError(401, 'Invalid email or password')
  }

  const profile = await loadProfile(created.user.id)
  if (!profile) {
    throw new HttpError(401, 'User no longer exists')
  }

  res.status(201).json(serializeAuth(profile, sessionData.session.access_token))
})

export const login = asyncHandler(async (req, res) => {
  requireSupabase()
  const { email, password } = req.body

  if (!email?.trim() || !password) {
    throw new HttpError(400, 'Email and password are required')
  }

  const { data, error } = await createAnonClient().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error || !data?.session?.access_token || !data?.user) {
    throw new HttpError(401, 'Invalid email or password')
  }

  const profile = await loadProfile(data.user.id)
  if (!profile) {
    throw new HttpError(401, 'User no longer exists')
  }

  res.status(200).json(serializeAuth(profile, data.session.access_token))
})

export const me = asyncHandler(async (req, res) => {
  res.status(200).json({
    user: serializeUser(req.user),
  })
})
