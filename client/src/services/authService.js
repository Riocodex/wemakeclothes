import {
  apiClient,
  clearAuthSession,
  getAuthToken,
  getStoredUser,
  setAuthSession,
} from './apiClient'

export const AUTH_CHANGE_EVENT = 'wmc-auth-change'

const notifyAuthChange = () => {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
}

const storeAuthResponse = (response) => {
  if (response?.token && response?.user) {
    setAuthSession(response)
    notifyAuthChange()
  }

  return response
}

export const registerUser = async ({ name, email, password }) => {
  const response = await apiClient.post('/auth/register', { name, email, password })
  return storeAuthResponse(response)
}

export const loginUser = async ({ email, password }) => {
  const response = await apiClient.post('/auth/login', { email, password })
  return storeAuthResponse(response)
}

export const fetchCurrentUser = async () => {
  const response = await apiClient.get('/auth/me')

  if (response?.user) {
    setAuthSession({ user: response.user })
    notifyAuthChange()
  }

  return response
}

export const logoutUser = () => {
  clearAuthSession()
  notifyAuthChange()
}

export const getCurrentStoredUser = () => getStoredUser()

export const hasAuthSession = () => Boolean(getAuthToken())
