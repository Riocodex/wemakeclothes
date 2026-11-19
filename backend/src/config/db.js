import { getSupabaseUrl, hasSupabaseConfig } from './supabase.js'

export const connectDB = async () => {
  if (!hasSupabaseConfig()) {
    console.warn(
      'SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY is not set. API will start without a database connection.'
    )
    return null
  }

  const url = getSupabaseUrl()
  console.log(`Supabase configured: ${new URL(url).host}`)
  return { url }
}
