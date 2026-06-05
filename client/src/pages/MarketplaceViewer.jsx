import { AnimatePresence, motion } from 'framer-motion'
import { useSnapshot } from 'valtio'

import state from '../store'
import { CustomButton } from '../components'
import { buyMarketplaceListing } from '../services/designService'
import { fadeAnimation } from '../config/motion'

const formatPrice = (value) => `$${Number(value || 0).toFixed(0)}`

const themeButtons = [
  { name: 'light', label: 'Light' },
  { name: 'dark', label: 'Dark' },
]

const MarketplaceViewer = () => {
  const snap = useSnapshot(state)
  const listing = snap.viewerListing
  const isLightScene = snap.sceneTheme === 'light'
  const panelTheme = isLightScene ? 'light' : 'dark'

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
    const ok = window.confirm(`Buy "${listing.title}" for ${formatPrice(listing.price)}?`)
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

  return (
    <AnimatePresence>
      {snap.viewerOpen && listing && (
        <div className="product-viewer" aria-live="polite">
          <motion.div
            className="product-viewer-toolbar"
            {...fadeAnimation}
          >
            <div className={`product-viewer-chip product-viewer-chip--${panelTheme}`}>
              {themeButtons.map((theme) => (
                <button
                  key={theme.name}
                  type="button"
                  className={`product-viewer-theme-btn ${
                    snap.sceneTheme === theme.name
                      ? 'product-viewer-theme-btn--active'
                      : ''
                  }`}
                  onClick={() => handleThemeChange(theme.name)}
                >
                  {theme.label}
                </button>
              ))}
            </div>
            {!listing.isMine && (
              <CustomButton
                type="filled"
                title="Buy design"
                handleClick={handleBuy}
                customStyles="w-fit min-h-[2.5rem] px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold shrink-0"
              />
            )}
          </motion.div>

          <motion.div
            className={`product-viewer-details product-viewer-details--${panelTheme}`}
            {...fadeAnimation}
          >
            <p className="product-viewer-eyebrow">Marketplace preview</p>
            <h2 className="product-viewer-title">{listing.title}</h2>
            <p className="product-viewer-meta">by {listing.sellerName}</p>
            {listing.description ? (
              <p className="product-viewer-description">{listing.description}</p>
            ) : null}
            <p className="product-viewer-price">{formatPrice(listing.price)}</p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default MarketplaceViewer
