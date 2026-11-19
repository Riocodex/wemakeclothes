/* eslint-disable react/prop-types */
import { useSnapshot } from 'valtio'

import state from '../store'
import AuthPanel from './AuthPanel'
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
  const view = getView(snap)

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
      show: true,
    },
    {
      key: 'create',
      full: 'Create Design',
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
        <button type="button" className="site-brand" onClick={goHome} aria-label="We Make Clothes home">
          <img src="./me.jpg" alt="" />
          <span className="site-brand-name">We Make Clothes</span>
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
