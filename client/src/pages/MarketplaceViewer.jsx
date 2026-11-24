import { AnimatePresence, motion } from 'framer-motion'
import { useSnapshot } from 'valtio'

import state from '../store'
import { buyMarketplaceListing } from '../services/designService'
import { fadeAnimation } from '../config/motion'
import {
  STATUS_LABELS,
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
    state.sceneTheme = 'light'
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
              <span className="eyebrow mr-1 text-brand-500">Marketplace</span>
              <StatusBadge item={listing} />
              {listing.isMine && <span className="badge badge-brand">Your listing</span>}
            </div>

            <h2 className="display mt-3 text-[1.35rem] leading-tight sm:text-[1.55rem]">
              {listing.title}
            </h2>

            <div className="mt-3 flex items-baseline justify-between gap-3">
              <p className="text-xl font-bold tabular-nums tracking-tight">
                {formatPrice(listing.price, listing.currency)}
              </p>
              <p className="truncate text-xs opacity-70">by {getSellerName(listing)}</p>
            </div>

            <dl className="product-spec hidden sm:grid">
              <div><dt>Garment</dt><dd>{getGarmentLabel(listing.design)}</dd></div>
              <div><dt>Seller</dt><dd>{getSellerName(listing)}</dd></div>
              <div><dt>Status</dt><dd>{STATUS_LABELS[status]}</dd></div>
            </dl>
            <p className="mt-2 text-xs font-medium opacity-70 sm:hidden">{getGarmentLabel(listing.design)}</p>

            {listing.description ? (
              <p className="mt-4 text-sm leading-relaxed opacity-80">{listing.description}</p>
            ) : null}

            <div className="mt-5 flex flex-col gap-2">
              {!listing.isMine && (
                <button
                  type="button"
                  className="btn btn-brand btn-lg btn-block"
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

            <p className="mt-4 hidden border-t border-current/10 pt-4 text-xs leading-relaxed opacity-60 sm:block">
              Drag to spin. Buying adds a copy to My Designs so you can keep restyling it.
            </p>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}

export default MarketplaceViewer
