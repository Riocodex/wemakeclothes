/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSnapshot } from 'valtio'

import state from '../store'
import { CustomButton } from '../components'
import {
  buyMarketplaceListing,
  deleteListingById,
  getMarketplaceListingById,
  listMarketplaceListings,
  listMyListings,
  listPurchases
} from '../services/designService'
import { migrateOrCreateDesign, syncRootFromDesign } from '../config/designSchema'
import { slideAnimation } from '../config/motion'

const formatPrice = (value) => `$${Number(value || 0).toFixed(0)}`

const Preview = ({ item }) => {
  const color = item.design?.colors?.body || '#EFBD48'

  if (item.previewImage) {
    return <img src={item.previewImage} alt={item.title} className="w-full h-full object-cover" />
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor: color }}
    >
      <div className="w-20 h-24 rounded-md bg-white/30 border border-white/40 flex items-center justify-center text-xs font-black text-white">
        WMC
      </div>
    </div>
  )
}

const MarketplaceCard = ({ item, onBuy, onView, onUnlist }) => (
  <div className="glassmorphism rounded-xl p-3 flex flex-col gap-3">
    <div className="rounded-lg overflow-hidden bg-gray-100 h-40">
      <Preview item={item} />
    </div>

    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
        <p className="text-[11px] text-gray-600 truncate">by {item.sellerName}</p>
      </div>
      <p className="text-sm font-black text-gray-950">{formatPrice(item.price)}</p>
    </div>

    <p className="text-xs text-gray-700 min-h-8">{item.description}</p>

    {item.isMine ? (
      <>
        <CustomButton
          type="filled"
          title="View design"
          handleClick={() => onView(item)}
          customStyles="w-full py-2 text-xs font-semibold"
        />
        <CustomButton
          type="outline"
          title="Unlist"
          handleClick={() => onUnlist(item)}
          customStyles="w-full py-2 text-xs font-semibold"
        />
      </>
    ) : (
      <>
        <CustomButton
          type="filled"
          title="View design"
          handleClick={() => onView(item)}
          customStyles="w-full py-2 text-xs font-semibold"
        />
        <CustomButton
          type="outline"
          title="Buy design"
          handleClick={() => onBuy(item)}
          customStyles="w-full py-2 text-xs font-semibold"
        />
      </>
    )}
  </div>
)

const Marketplace = () => {
  const snap = useSnapshot(state)
  const [activeView, setActiveView] = useState('shop')
  const [refreshKey, setRefreshKey] = useState(0)
  const [listings, setListings] = useState([])
  const [myListings, setMyListings] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const visibleListings = activeView === 'mine' ? listings.filter((item) => item.isMine) : listings

  useEffect(() => {
    if (!snap.marketplaceOpen) return

    let active = true
    setLoading(true)
    setError('')

    Promise.all([
      listMarketplaceListings(),
      listMyListings(),
      listPurchases(),
    ])
      .then(([marketplaceItems, myItems, purchaseItems]) => {
        if (!active) return
        setListings(marketplaceItems)
        setMyListings(myItems)
        setPurchases(purchaseItems)
      })
      .catch((err) => {
        if (!active) return
        setError(err.message || 'Could not load marketplace.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [snap.marketplaceOpen, refreshKey])

  const handleViewListing = async (item) => {
    const listing = item.design ? item : await getMarketplaceListingById(item.id)
    if (!listing) return
    state.design = migrateOrCreateDesign(listing.design)
    if (listing.sceneTheme) state.sceneTheme = listing.sceneTheme
    syncRootFromDesign(state)
    state.viewerListing = listing
    state.viewerOpen = true
    state.marketplaceOpen = false
    state.myDesignsOpen = false
    state.intro = false
  }

  const handleBuy = async (item) => {
    const ok = window.confirm(`Buy "${item.title}" for ${formatPrice(item.price)}?`)
    if (!ok) return
    try {
      const result = await buyMarketplaceListing(item.id)
      if (!result) {
        alert('This listing could not be purchased.')
        return
      }
      alert('Purchased. A copy has been added to My Designs.')
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      alert(error.message || 'This listing could not be purchased.')
    }
  }

  const handleUnlist = async (item) => {
    const ok = window.confirm(`Remove "${item.title}" from the marketplace?`)
    if (!ok) return
    try {
      await deleteListingById(item.id)
      setRefreshKey((prev) => prev + 1)
    } catch (err) {
      alert(err.message || 'Could not remove this listing.')
    }
  }

  return (
    <AnimatePresence>
      {snap.intro && snap.marketplaceOpen && (
        <motion.section className="home marketplace-panel" {...slideAnimation('right')}>
          <div className="w-full flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-black">Marketplace</h2>
              <p className="text-sm text-gray-600">Browse, buy, and manage listed clothing designs.</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <CustomButton
              type={activeView === 'shop' ? 'filled' : 'outline'}
              title={`Shop (${listings.length})`}
              handleClick={() => setActiveView('shop')}
              customStyles="w-fit px-4 py-2 text-xs font-bold"
            />
            <CustomButton
              type={activeView === 'mine' ? 'filled' : 'outline'}
              title={`My Listings (${myListings.length})`}
              handleClick={() => setActiveView('mine')}
              customStyles="w-fit px-4 py-2 text-xs font-bold"
            />
            <CustomButton
              type={activeView === 'purchases' ? 'filled' : 'outline'}
              title={`Purchases (${purchases.length})`}
              handleClick={() => setActiveView('purchases')}
              customStyles="w-fit px-4 py-2 text-xs font-bold"
            />
          </div>

          <div className="mt-5 w-[min(92vw,1080px)] max-h-[68vh] overflow-auto pr-1">
            {loading && (
              <div className="glassmorphism rounded-xl p-6 text-sm text-gray-700">
                Loading marketplace...
              </div>
            )}

            {!loading && error && (
              <div className="glassmorphism rounded-xl p-6 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && activeView !== 'purchases' && visibleListings.length === 0 && (
              <div className="glassmorphism rounded-xl p-6 text-sm text-gray-700">
                No listings yet. Open My Designs and list one of your saved designs.
              </div>
            )}

            {!loading && !error && activeView !== 'purchases' && visibleListings.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleListings.map((item) => (
                  <MarketplaceCard
                    key={item.id}
                    item={item}
                    onBuy={handleBuy}
                    onView={handleViewListing}
                    onUnlist={handleUnlist}
                  />
                ))}
              </div>
            )}

            {!loading && !error && activeView === 'purchases' && purchases.length === 0 && (
              <div className="glassmorphism rounded-xl p-6 text-sm text-gray-700">
                No purchases yet. Buy a marketplace design to add it to your saved designs.
              </div>
            )}

            {!loading && !error && activeView === 'purchases' && purchases.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {purchases.map((item) => (
                  <div key={item.id} className="glassmorphism rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                    <p className="mt-1 text-xs text-gray-600">Seller: {item.sellerName}</p>
                    <p className="text-xs text-gray-600">Paid: {formatPrice(item.price)}</p>
                    <p className="mt-2 text-[11px] text-gray-500">
                      {new Date(item.purchasedAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}

export default Marketplace
