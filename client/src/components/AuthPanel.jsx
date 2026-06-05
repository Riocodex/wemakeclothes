import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'

import state from '../store'
import {
  fetchCurrentUser,
  getCurrentStoredUser,
  hasAuthSession,
  loginUser,
  logoutUser,
  registerUser,
} from '../services/authService'

const emptyForm = {
  name: '',
  email: '',
  password: '',
}

const AuthPanel = () => {
  const snap = useSnapshot(state)
  const [user, setUser] = useState(() => getCurrentStoredUser())
  const [mode, setMode] = useState('login')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hasAuthSession()) return

    fetchCurrentUser()
      .then((response) => {
        if (response?.user) setUser(response.user)
      })
      .catch(() => {
        logoutUser()
        setUser(null)
      })
  }, [])

  const updateForm = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = mode === 'register'
        ? await registerUser(form)
        : await loginUser(form)

      setUser(response.user)
      setForm(emptyForm)
      setOpen(false)
    } catch (err) {
      setError(err.message || 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logoutUser()
    setUser(null)
    setOpen(false)
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
  }

  if (!snap.intro) return null

  const hasPageNav = snap.marketplaceOpen || snap.myDesignsOpen
  const hideOnMobilePageNav = hasPageNav && user

  return (
    <div
      className={`auth-panel ${hideOnMobilePageNav ? 'auth-panel--mobile-hidden' : ''}`}
    >
      <div className="auth-panel-actions">
        {user ? (
          <div className="auth-panel-user glassmorphism">
            <div className="auth-panel-user-info min-w-0">
              <p className="auth-panel-name truncate">{user.name}</p>
              <p className="auth-panel-email truncate">{user.email}</p>
            </div>
            <button
              type="button"
              className="auth-panel-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="auth-panel-account"
            onClick={() => setOpen((current) => !current)}
          >
            Account
          </button>
        )}
      </div>

      {open && !user && (
        <form
          className="glassmorphism mt-3 rounded-lg p-4"
          onSubmit={handleSubmit}
        >
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 rounded-md px-3 py-2 text-xs font-black ${mode === 'login' ? 'bg-black text-white' : 'bg-white/60 text-gray-700'}`}
              onClick={() => switchMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md px-3 py-2 text-xs font-black ${mode === 'register' ? 'bg-black text-white' : 'bg-white/60 text-gray-700'}`}
              onClick={() => switchMode('register')}
            >
              Register
            </button>
          </div>

          {mode === 'register' && (
            <label className="mt-4 block text-xs font-bold text-gray-700" htmlFor="auth-name">
              Name
              <input
                id="auth-name"
                type="text"
                value={form.name}
                onChange={updateForm('name')}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white/80 px-3 py-2 text-sm font-normal outline-none"
                autoComplete="name"
              />
            </label>
          )}

          <label className="mt-4 block text-xs font-bold text-gray-700" htmlFor="auth-email">
            Email
            <input
              id="auth-email"
              type="email"
              value={form.email}
              onChange={updateForm('email')}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white/80 px-3 py-2 text-sm font-normal outline-none"
              autoComplete="email"
            />
          </label>

          <label className="mt-4 block text-xs font-bold text-gray-700" htmlFor="auth-password">
            Password
            <input
              id="auth-password"
              type="password"
              value={form.password}
              onChange={updateForm('password')}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white/80 px-3 py-2 text-sm font-normal outline-none"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
          </label>

          {error && (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-4 w-full rounded-md bg-black px-4 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Working...' : mode === 'register' ? 'Create account' : 'Login'}
          </button>
        </form>
      )}
    </div>
  )
}

export default AuthPanel
