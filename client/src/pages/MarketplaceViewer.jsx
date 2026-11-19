import { AnimatePresence, motion } from 'framer-motion'
import { useSnapshot } from 'valtio'

import state from '../store'
import { buyMarketplaceListing } from '../services/designService'
import { fadeAnimation } from '../config/motion'
import {
  formatPrice,
  getGarmentLabel,
  getListingStatus,
  getSellerName,
} from '../config/format'
import { requestSignIn } from '../config/navigation'
import { StatusBadge, useAuthSession } from '../components/MarketplaceUI'
import { ArrowLeftIcon, BagIcon, LockIcon } from '../components/Icons'

const themeButtons = [
  { name: 'light', label: 'Light' },
  { name: 'dark', label: 'Dark' },
]

const MarketplaceViewer = () => {
  const snap = useSnapshot(state)
  const { signedIn } = useAuthSession()
  const listing = snap.viewerListing
  const isLightScene = snap.sceneTheme === 'light'

  const handleThemeChange = (themeName) => {
    state.sceneTheme = themeName
  }

  const handleBack = () => {
    state.viewerOpen = false
    state.viewerListing = null
    state.marketplaceOpen = true
    state.myDesignsOpen = false
    state.intro = true
    state.sceneTheme = 'dark'
  }

  const handleBuy = async () => {
    if (!listing || listing.isMine) return
    if (!signedIn) {
      requestSignIn(`Sign in to buy "${listing.title}".`)
      return
    }
    const ok = window.confirm(`Buy "${listing.title}" for ${formatPrice(listing.price, listing.currency)}?`)
    if (!ok) return
    try {
      const result = await buyMarketplaceListing(listing.id)
      if (!result) {
        alert('This listing could not be purchased.')
        return
      }
      alert('Purchased. A copy has been added to My Designs.')
      handleBack()
    } catch (error) {
      alert(error.message || 'This listing could not be purchased.')
    }
  }

  const status = listing ? getListingStatus(listing) : 'active'
  const purchasable = status === 'active'

  return (
    <AnimatePresence>
      {snap.viewerOpen && listing && (
        <div className="product-viewer" aria-live="polite">
          <motion.div className="product-viewer-toolbar" {...fadeAnimation}>
            <div
              className={`theme-toggle ${isLightScene ? '' : 'theme-toggle--dark'}`}
              role="group"
              aria-label="Scene theme"
            >
              {themeButtons.map((theme) => (
                <button
                  key={theme.name}
                  type="button"
                  className="theme-toggle-btn"
                  aria-pressed={snap.sceneTheme === theme.name}
                  onClick={() => handleThemeChange(theme.name)}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.aside className="product-viewer-details" {...fadeAnimation}>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="badge badge-neutral">{getGarmentLabel(listing.design)}</span>
              <StatusBadge item={listing} />
              {listing.isMine && <span className="badge badge-brand">Your listing</span>}
            </div>

            <h2 className="mt-3 text-xl font-bold leading-tight tracking-tight text-ink-900 sm:text-2xl">
              {listing.title}
            </h2>
            <p className="mt-1 text-sm text-ink-500">by {getSellerName(listing)}</p>

            <p className="mt-4 text-2xl font-bold tracking-tight text-ink-900">
              {formatPrice(listing.price, listing.currency)}
            </p>

            {listing.description ? (
              <p className="mt-3 text-sm leading-relaxed text-ink-600">{listing.description}</p>
            ) : null}

            <div className="mt-5 flex flex-col gap-2">
              {!listing.isMine && (
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-block"
                  onClick={handleBuy}
                  disabled={!purchasable}
                >
                  {purchasable && !signedIn ? <LockIcon /> : <BagIcon />}
                  {!purchasable
                    ? status === 'sold' ? 'Sold' : 'Unavailable'
                    : signedIn ? 'Buy design' : 'Sign in to buy'}
                </button>
              )}
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={handleBack}
              >
                <ArrowLeftIcon />
                Back to marketplace
              </button>
            </div>

            <p className="mt-4 hidden border-t border-ink-200/70 pt-4 text-xs leading-relaxed text-ink-500 sm:block">
              A purchase copies this design into My Designs so you can keep customizing it.
            </p>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}

export default MarketplaceViewer
