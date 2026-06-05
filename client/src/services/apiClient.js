const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
const AUTH_TOKEN_KEY = 'wmc_auth_token'
const AUTH_USER_KEY = 'wmc_auth_user'

const canUseStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage)

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export const getAuthToken = () => {
  if (!canUseStorage()) return null
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

export const getStoredUser = () => {
  if (!canUseStorage()) return null

  try {
    const rawUser = window.localStorage.getItem(AUTH_USER_KEY)
    return rawUser ? JSON.parse(rawUser) : null
  } catch {
    return null
  }
}

export const setAuthSession = ({ token, user }) => {
  if (!canUseStorage()) return

  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token)
  }

  if (user) {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  }
}

export const clearAuthSession = () => {
  if (!canUseStorage()) return
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  window.localStorage.removeItem(AUTH_USER_KEY)
}

const parseResponse = async (response) => {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const buildHeaders = (body, headers = {}) => {
  const token = getAuthToken()
  const nextHeaders = { ...headers }

  if (body && !(body instanceof FormData) && !nextHeaders['Content-Type']) {
    nextHeaders['Content-Type'] = 'application/json'
  }

  if (token) {
    nextHeaders.Authorization = `Bearer ${token}`
  }

  return nextHeaders
}

export const apiRequest = async (path, options = {}) => {
  const { body, headers, ...rest } = options
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: buildHeaders(body, headers),
    body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
  })
  const data = await parseResponse(response)

  if (!response.ok) {
    throw new ApiError(data?.message || 'Request failed', response.status, data)
  }

  return data
}

export const apiClient = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => apiRequest(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
}

export { API_BASE_URL }
