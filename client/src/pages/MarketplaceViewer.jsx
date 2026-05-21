import { AnimatePresence, motion } from 'framer-motion'
import { useSnapshot } from 'valtio'

import state from '../store'
import { CustomButton } from '../components'
import { buyMarketplaceListing } from '../services/designService'
import { fadeAnimation } from '../config/motion'

const formatPrice = (value) => `$${Number(value || 0).toFixed(0)}`

const MarketplaceViewer = () => {
  const snap = useSnapshot(state)
  const listing = snap.viewerListing

  const handleBack = () => {
    state.viewerOpen = false
    state.viewerListing = null
    state.marketplaceOpen = true
    state.myDesignsOpen = false
    state.intro = true
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
        <>
          <motion.div
            className="absolute z-10 top-5 left-5 glassmorphism rounded-xl p-4 max-w-[min(86vw,360px)]"
            {...fadeAnimation}
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-600">
              Marketplace preview
            </p>
            <h2 className="mt-1 text-xl font-black text-gray-950">{listing.title}</h2>
            <p className="mt-1 text-sm text-gray-700">by {listing.sellerName}</p>
            <p className="mt-3 text-sm text-gray-700">{listing.description}</p>
            <p className="mt-3 text-lg font-black text-gray-950">{formatPrice(listing.price)}</p>
          </motion.div>

          <motion.div
            className="absolute z-10 top-5 right-5 flex items-center gap-2"
            {...fadeAnimation}
          >
            {!listing.isMine && (
              <CustomButton
                type="filled"
                title="Buy design"
                handleClick={handleBuy}
                customStyles="w-fit px-4 py-2.5 font-bold text-sm"
              />
            )}
            <CustomButton
              type="outline"
              title="Back"
              handleClick={handleBack}
              customStyles="w-fit px-4 py-2.5 font-bold text-sm"
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default MarketplaceViewer
