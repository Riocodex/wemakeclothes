/* eslint-disable react/prop-types */
import { useSnapshot } from 'valtio'

import state from '../store'
import AuthPanel from './AuthPanel'
import { useAuthSession } from './MarketplaceUI'
import { shirtButton, shirtInk } from './GarmentLook'
import { ArrowLeftIcon, BagIcon, GridIcon, PlusIcon } from './Icons'
import {
  getView,
  goBack,
  goCreate,
  goHome,
  goMarketplace,
  goMyDesigns,
} from '../config/navigation'

const NavLabel = ({ full, short }) => (
  <>
    <span className="site-nav-label--full">{full}</span>
    <span className="site-nav-label--short">{short}</span>
  </>
)

const HEADER_TONE = {
  home: 'dark',
  marketplace: 'solid',
  myDesigns: 'solid',
  customizer: 'glass',
  viewer: 'glass',
}

const AppNav = () => {
  const snap = useSnapshot(state)
  const { signedIn } = useAuthSession()
  const view = getView(snap)
  const shirtColor = view === 'viewer'
    ? snap.viewerListing?.design?.colors?.body
    : view === 'marketplace'
      ? snap.logoColor
      : snap.design?.colors?.body || snap.color
  const activeShirt = shirtColor || snap.design?.colors?.body || snap.color
  const logoColor = shirtInk(activeShirt)
  const designButton = shirtButton(activeShirt)

  const items = [
    {
      key: 'back',
      full: 'Back',
      short: 'Back',
      icon: ArrowLeftIcon,
      onClick: () => goBack(view),
      show: view !== 'home',
      className: 'site-nav-back',
    },
    {
      key: 'marketplace',
      full: 'Marketplace',
      short: 'Shop',
      icon: BagIcon,
      onClick: goMarketplace,
      active: view === 'marketplace',
      show: true,
    },
    {
      key: 'myDesigns',
      full: 'My Designs',
      short: 'Designs',
      icon: GridIcon,
      onClick: goMyDesigns,
      active: view === 'myDesigns',
      show: signedIn,
    },
    {
      key: 'create',
      full: 'Design yours',
      short: 'Create',
      icon: PlusIcon,
      onClick: goCreate,
      active: view === 'customizer',
      show: true,
      className: 'site-nav-cta',
    },
  ].filter((item) => item.show)

  return (
    <header className={`site-header site-header--${HEADER_TONE[view]}`}>
      <div className="site-header-inner">
        <button type="button" className="site-brand" onClick={goHome} aria-label="Wimik home">
          <span className="site-brand-name wordmark" style={{ color: logoColor }}>Wimik</span>
        </button>

        <nav className="site-nav" aria-label="Main navigation">
          {items.map((item) => {
            const IconComponent = item.icon
            return (
              <button
                key={item.key}
                type="button"
                className={`site-nav-link ${item.className || ''}`}
                aria-current={item.active ? 'page' : undefined}
                onClick={item.active ? undefined : item.onClick}
                style={item.key === 'create' ? {
                  '--cta': designButton.background,
                  '--cta-ink': designButton.color,
                } : undefined}
              >
                <IconComponent />
                <NavLabel full={item.full} short={item.short} />
              </button>
            )
          })}
        </nav>

        <div className="site-header-account">
          <AuthPanel />
        </div>
      </div>
    </header>
  )
}

export default AppNav
