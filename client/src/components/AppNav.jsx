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

const AppNav = () => {
  const snap = useSnapshot(state)
  const view = getView(snap)
  const showNav = view !== 'home'

  if (!showNav) return null

  return (
    <nav className="app-nav">
      <CustomButton
        type="outline"
        title="Back"
        handleClick={() => goBack(view)}
        customStyles="w-fit px-4 py-2 text-sm font-bold"
      />
      {view !== 'marketplace' && (
        <CustomButton
          type="outline"
          title="Marketplace"
          handleClick={goMarketplace}
          customStyles="w-fit px-4 py-2 text-sm font-bold"
        />
      )}
      {view !== 'myDesigns' && (
        <CustomButton
          type="outline"
          title="My Designs"
          handleClick={goMyDesigns}
          customStyles="w-fit px-4 py-2 text-sm font-bold"
        />
      )}
      {view !== 'customizer' && (
        <CustomButton
          type="filled"
          title="Create Design"
          handleClick={goCreate}
          customStyles="w-fit px-4 py-2 text-sm font-bold"
        />
      )}
    </nav>
  )
}

export default AppNav
