import { useSnapshot } from 'valtio'

import state from '../store'
import { CustomButton } from './index'

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
    </nav>
  )
}

export default AppNav
