import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'

import state from '../store'
import { CustomButton } from './index'
import {
  AUTH_CHANGE_EVENT,
  getCurrentStoredUser,
  logoutUser,
} from '../services/authService'

const getView = (snap) => {
  if (snap.viewerOpen) return 'viewer'
  if (!snap.intro) return 'customizer'
  if (snap.marketplaceOpen) return 'marketplace'
  if (snap.myDesignsOpen) return 'myDesigns'
  return 'home'
}

const goHome = () => {
  state.intro = true
  state.myDesignsOpen = false
  state.marketplaceOpen = false
  state.viewerOpen = false
  state.viewerListing = null
  state.sceneTheme = 'dark'
}

const goCreate = () => {
  state.intro = false
  state.myDesignsOpen = false
  state.marketplaceOpen = false
  state.viewerOpen = false
  state.viewerListing = null
  state.sceneTheme = 'dark'
}

const goMarketplace = () => {
  state.intro = true
  state.myDesignsOpen = false
  state.marketplaceOpen = true
  state.viewerOpen = false
  state.viewerListing = null
  state.sceneTheme = 'dark'
}

const goMyDesigns = () => {
  state.intro = true
  state.myDesignsOpen = true
  state.marketplaceOpen = false
  state.viewerOpen = false
  state.viewerListing = null
  state.sceneTheme = 'dark'
}

const goBack = (view) => {
  if (view === 'viewer') {
    goMarketplace()
    return
  }

  if (view === 'customizer') {
    goHome()
    return
  }

  goHome()
}

const NavLabel = ({ full, short }) => (
  <>
    <span className="app-nav-label app-nav-label--full">{full}</span>
    <span className="app-nav-label app-nav-label--short">{short}</span>
  </>
)

const AppNav = () => {
  const snap = useSnapshot(state)
  const view = getView(snap)
  const showNav = view !== 'home'
  const [user, setUser] = useState(() => getCurrentStoredUser())
  const showMobileLogout =
    user && (view === 'marketplace' || view === 'myDesigns')

  useEffect(() => {
    const syncUser = () => setUser(getCurrentStoredUser())
    window.addEventListener(AUTH_CHANGE_EVENT, syncUser)
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, syncUser)
  }, [])

  const handleLogout = () => {
    logoutUser()
    setUser(null)
  }

  if (!showNav) return null

  const items = [
    {
      key: 'back',
      type: 'outline',
      full: 'Back',
      short: 'Back',
      onClick: () => goBack(view),
      show: true,
    },
    {
      key: 'marketplace',
      type: 'outline',
      full: 'Marketplace',
      short: 'Shop',
      onClick: goMarketplace,
      show: view !== 'marketplace',
    },
    {
      key: 'myDesigns',
      type: 'outline',
      full: 'My Designs',
      short: 'Designs',
      onClick: goMyDesigns,
      show: view !== 'myDesigns',
    },
    {
      key: 'create',
      type: 'filled',
      full: 'Create Design',
      short: 'Create',
      onClick: goCreate,
      show: view !== 'customizer',
    },
  ].filter((item) => item.show)

  return (
    <nav className="app-nav" aria-label="Main navigation">
      {items.map((item) => (
        <CustomButton
          key={item.key}
          type={item.type}
          title={<NavLabel full={item.full} short={item.short} />}
          handleClick={item.onClick}
          customStyles="app-nav-btn"
        />
      ))}
      {showMobileLogout && (
        <button
          type="button"
          className="app-nav-logout"
          onClick={handleLogout}
        >
          Logout
        </button>
      )}
    </nav>
  )
}

export default AppNav
