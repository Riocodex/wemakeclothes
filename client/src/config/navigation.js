import state from '../store'
import { hasAuthSession } from '../services/authService'

export const AUTH_REQUEST_EVENT = 'wmc-auth-request'

export const requestSignIn = (message, options = {}) => {
  window.dispatchEvent(new CustomEvent(AUTH_REQUEST_EVENT, {
    detail: {
      message,
      mode: options.mode === 'register' ? 'register' : 'login',
    },
  }))
}

export const getView = (snap) => {
  if (snap.viewerOpen) return 'viewer'
  if (!snap.intro) return 'customizer'
  if (snap.marketplaceOpen) return 'marketplace'
  if (snap.myDesignsOpen) return 'myDesigns'
  return 'home'
}

export const goHome = () => {
  state.intro = true
  state.myDesignsOpen = false
  state.marketplaceOpen = false
  state.viewerOpen = false
  state.viewerListing = null
  state.sceneTheme = 'dark'
}

export const goCreate = () => {
  state.intro = false
  state.myDesignsOpen = false
  state.marketplaceOpen = false
  state.viewerOpen = false
  state.viewerListing = null
  state.sceneTheme = 'dark'
}

export const goMarketplace = () => {
  state.intro = true
  state.myDesignsOpen = false
  state.marketplaceOpen = true
  state.viewerOpen = false
  state.viewerListing = null
  state.sceneTheme = 'dark'
}

export const goMyDesigns = () => {
  if (!hasAuthSession()) {
    requestSignIn('Create an account to see My Designs.', { mode: 'register' })
    return
  }

  state.intro = true
  state.myDesignsOpen = true
  state.marketplaceOpen = false
  state.viewerOpen = false
  state.viewerListing = null
  state.sceneTheme = 'dark'
}

export const goBack = (view) => {
  if (view === 'viewer') {
    goMarketplace()
    return
  }

  goHome()
}
