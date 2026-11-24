import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useSnapshot } from 'valtio'

import state from '../store'
import {
  AUTH_CHANGE_EVENT,
  AUTH_DISMISS_EVENT,
  fetchCurrentUser,
  getCurrentStoredUser,
  hasAuthSession,
  loginUser,
  logoutUser,
  registerUser,
} from '../services/authService'
import { AUTH_REQUEST_EVENT } from '../config/navigation'
import { CloseIcon, LockIcon } from './Icons'

const emptyForm = {
  name: '',
  email: '',
  password: '',
}

const ROLE_LABELS = {
  buyer: 'Buyer',
  seller: 'Seller',
  admin: 'Admin',
}

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'

const AuthPanel = () => {
  const snap = useSnapshot(state)
  const [user, setUser] = useState(() => getCurrentStoredUser())
  const [mode, setMode] = useState('login')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const rootRef = useRef(null)

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

  useEffect(() => {
    const syncUser = () => setUser(getCurrentStoredUser())
    const handleRequest = (event) => {
      if (hasAuthSession()) return
      setMode(event.detail?.mode === 'register' ? 'register' : 'login')
      setError('')
      setNotice(event.detail?.message || '')
      setOpen(true)
    }
    window.addEventListener(AUTH_CHANGE_EVENT, syncUser)
    window.addEventListener(AUTH_REQUEST_EVENT, handleRequest)
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, syncUser)
      window.removeEventListener(AUTH_REQUEST_EVENT, handleRequest)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event) => {
      if (event.key === 'Escape') dismiss()
    }
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) dismiss()
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

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
      setNotice('')
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

  const dismiss = () => {
    setOpen(false)
    setNotice('')
    if (!hasAuthSession()) {
      window.dispatchEvent(new Event(AUTH_DISMISS_EVENT))
    }
  }

  const inCustomizer = !snap.intro && !snap.viewerOpen

  if (user) {
    if (inCustomizer) return null
    const role = ROLE_LABELS[user.role] || null
    return (
      <div className="auth-user">
        <span className="auth-avatar" aria-hidden="true">{getInitials(user.name)}</span>
        <div className="hidden min-w-0 max-w-[11rem] sm:block">
          <p className="auth-user-name">{user.name}</p>
          <p className="auth-user-meta">{role ? `${role} · ${user.email}` : user.email}</p>
        </div>
        <button type="button" className="auth-logout" onClick={handleLogout}>
          Log out
        </button>
      </div>
    )
  }

  if (inCustomizer && !open) return null

  const accountForm = (
    <motion.form
      className={inCustomizer
        ? 'modal-panel w-full text-ink-900 sm:max-w-md'
        : 'auth-popover surface-card p-5 text-ink-900 shadow-lift'}
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: inCustomizer ? 16 : -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: inCustomizer ? 8 : -6, scale: 0.98 }}
      transition={{ duration: 0.16 }}
      onClick={(event) => event.stopPropagation()}
    >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow text-brand-600">Wimik account</p>
                  <h2 className="display mt-1 text-xl leading-tight">
                    {mode === 'register' ? 'Join Wimik' : 'Welcome back'}
                  </h2>
                  <p className="mt-1.5 text-sm text-ink-500">
                    {mode === 'register'
                      ? 'Save your designs, sell them, and shop the community.'
                      : 'Sign in to buy designs and sync your studio.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="icon-btn -mr-2 -mt-1 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                  aria-label="Close"
                  onClick={dismiss}
                >
                  <CloseIcon />
                </button>
              </div>

              {notice && (
                <p className="mt-4 flex items-start gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-xs font-medium text-brand-700">
                  <LockIcon className="mt-px h-3.5 w-3.5 shrink-0" />
                  {notice}
                </p>
              )}

              <div className="segmented mt-4 flex w-full" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  className="segmented-btn flex-1 justify-center"
                  onClick={() => switchMode('login')}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'register'}
                  className="segmented-btn flex-1 justify-center"
                  onClick={() => switchMode('register')}
                >
                  Join
                </button>
              </div>

              {mode === 'register' && (
                <label className="field-label mt-4" htmlFor="auth-name">
                  Name
                  <input
                    id="auth-name"
                    type="text"
                    value={form.name}
                    onChange={updateForm('name')}
                    className="field-input"
                    autoComplete="name"
                  />
                </label>
              )}

              <label className="field-label mt-4" htmlFor="auth-email">
                Email
                <input
                  id="auth-email"
                  type="email"
                  value={form.email}
                  onChange={updateForm('email')}
                  className="field-input"
                  autoComplete="email"
                />
              </label>

              <label className="field-label mt-4" htmlFor="auth-password">
                Password
                <input
                  id="auth-password"
                  type="password"
                  value={form.password}
                  onChange={updateForm('password')}
                  className="field-input"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                />
              </label>

              {error && (
                <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" className="btn btn-primary btn-block mt-5" disabled={loading}>
                {loading ? 'Working...' : mode === 'register' ? 'Create account' : 'Sign in'}
              </button>
    </motion.form>
  )

  if (inCustomizer) {
    return createPortal(
      <div className="modal-backdrop" style={{ zIndex: 80 }} onClick={dismiss}>
        <AnimatePresence>{open && accountForm}</AnimatePresence>
      </div>,
      document.body
    )
  }

  return (
    <div ref={rootRef}>
      <button
        type="button"
        className="auth-trigger"
        aria-expanded={open}
        onClick={() => {
          setNotice('')
          setMode('login')
          setError('')
          setOpen((current) => !current)
        }}
      >
        Sign in
      </button>

      <AnimatePresence>
        {open && accountForm}
      </AnimatePresence>
    </div>
  )
}

export default AuthPanel
