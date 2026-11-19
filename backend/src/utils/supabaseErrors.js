import { HttpError } from './httpError.js'

export const throwIfSupabaseError = (error, fallbackMessage = 'Request failed') => {
  if (!error) return

  const code = error.code
  const message = error.message || error.details || fallbackMessage

  if (code === '28000' || message === 'Authentication required') {
    throw new HttpError(401, 'Authentication required')
  }

  if (code === 'P0002' || message === 'Listing not found' || message === 'Listing design not found') {
    throw new HttpError(404, message === 'Listing design not found' ? message : 'Listing not found')
  }

  if (message === 'You cannot buy your own listing' || code === '22023') {
    throw new HttpError(400, 'You cannot buy your own listing')
  }

  if (code === '23505') {
    if (message?.includes('email') || message?.includes('profiles_email')) {
      throw new HttpError(409, 'An account with this email already exists')
    }
    throw new HttpError(409, 'This listing has already been purchased')
  }

  if (code === '23514' || code === '23502' || code === '22P02') {
    throw new HttpError(400, fallbackMessage)
  }

  const status = error.status || error.statusCode
  if (status === 401) {
    throw new HttpError(401, 'Invalid or expired token')
  }

  throw error
}
