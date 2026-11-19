import { createClient } from '@supabase/supabase-js'

const requireEnv = (name) => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set`)
  }
  return value
}

export const hasSupabaseConfig = () =>
  Boolean(
    process.env.SUPABASE_URL
    && process.env.SUPABASE_ANON_KEY
    && process.env.SUPABASE_SERVICE_ROLE_KEY
  )

export const getSupabaseUrl = () => requireEnv('SUPABASE_URL')

const authClientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
}

export const createAnonClient = () =>
  createClient(getSupabaseUrl(), requireEnv('SUPABASE_ANON_KEY'), authClientOptions)

export const createServiceClient = () =>
  createClient(getSupabaseUrl(), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), authClientOptions)

export const createUserClient = (accessToken) => {
  if (!accessToken) {
    throw new Error('Access token is required')
  }

  return createClient(getSupabaseUrl(), requireEnv('SUPABASE_ANON_KEY'), {
    ...authClientOptions,
    accessToken: async () => accessToken,
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}
