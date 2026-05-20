import {
  apiClient,
  clearAuthSession,
  getAuthToken,
  getStoredUser,
  setAuthSession,
} from './apiClient'

const storeAuthResponse = (response) => {
  if (response?.token && response?.user) {
    setAuthSession(response)
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
  }

  return response
}

export const logoutUser = () => {
  clearAuthSession()
}

export const getCurrentStoredUser = () => getStoredUser()

export const hasAuthSession = () => Boolean(getAuthToken())
