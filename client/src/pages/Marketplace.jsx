/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useSnapshot } from 'valtio'

import state from '../store'
import {
  buyMarketplaceListing,
  deleteListingById,
  getMarketplaceListingById,
  listMarketplaceListings,
  listMyListings,
  listPurchases
} from '../services/designService'
import { migrateOrCreateDesign, syncRootFromDesign } from '../config/designSchema'
import {
  formatPrice,
  getGarmentLabel,
  getListingStatus,
  getSellerName,
} from '../config/format'
import { goMyDesigns, requestSignIn } from '../config/navigation'
import {
  EmptyState,
  ErrorState,
  ListingPreview,
  PurchaseList,
  SkeletonGrid,
  StatusBadge,
  useAuthSession,
} from '../components/MarketplaceUI'
import { isRasterPreview } from '../components/GarmentLook'
import { BagIcon, CloseIcon, CubeIcon, GridIcon, LockIcon, ReceiptIcon, SearchIcon, TagIcon } from '../components/Icons'

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
]

const ProductLook = ({ item, mode, onMode, onClose, onBuy, onView, onUnlist, signedIn }) => {
  const status = getListingStatus(item)
  const purchasable = status === 'active'
  const hasRender = isRasterPreview(item?.previewImage)
  const color = item?.design?.colors?.body

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="look-backdrop" role="presentation" onClick={onClose}>
      <div
        className="look-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="look-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="look-stage">
          <ListingPreview item={item} flat={mode === 'shirt'} />
          {hasRender && (
            <div className="look-switch" role="tablist" aria-label="Preview style">
              <button type="button" role="tab" aria-selected={mode === 'shirt'} onClick={() => onMode('shirt')}>Shirt</button>
              <button type="button" role="tab" aria-selected={mode === 'render'} onClick={() => onMode('render')}>Saved photo</button>
            </div>
          )}
        </div>
        <div className="look-details">
          <button type="button" className="icon-btn look-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
          <p className="eyebrow text-brand-600">{getGarmentLabel(item.design)}</p>
          <h2 id="look-title" className="look-title">{item.title}</h2>
          <p className="look-price">{formatPrice(item.price, item.currency)}</p>
          <p className="mt-1 text-sm text-ink-500">by {getSellerName(item)}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge item={item} />
            {item.isMine && <span className="badge badge-brand">Your listing</span>}
            {color && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500">
                <span className="h-3.5 w-3.5 rounded-full ring-1 ring-ink-900/15" style={{ background: color }} />
                Color
              </span>
            )}
          </div>
          {item.description ? (
            <p className="mt-4 text-sm leading-relaxed text-ink-600">{item.description}</p>
          ) : null}
          <div className="mt-6 flex flex-col gap-2">
            {item.isMine ? (
              <button type="button" className="btn btn-secondary btn-block" onClick={() => onUnlist(item)}>
                Unlist
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-brand btn-block"
                onClick={() => onBuy(item)}
                disabled={!purchasable}
              >
                {purchasable && !signedIn && <LockIcon className="h-3.5 w-3.5" />}
                {purchasable ? 'Buy design' : status === 'sold' ? 'Sold' : 'Unavailable'}
              </button>
            )}
            <button type="button" className="btn btn-secondary btn-block" onClick={() => onView(item)}>
              <CubeIcon />
              Spin in 3D
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

const MarketplaceCard = ({ item, signedIn, onBuy, onLook, onView, onUnlist }) => {
  const status = getListingStatus(item)
  const purchasable = status === 'active'

  return (
    <article
      className="shop-card"
      onMouseEnter={() => { state.logoColor = item.design?.colors?.body || null }}
      onMouseLeave={() => { state.logoColor = null }}
    >
      <button
        type="button"
        className="shop-shot"
        onClick={() => onLook(item)}
        aria-label={`View ${item.title}`}
      >
        <ListingPreview item={item} flat />
        <span className="shop-shot-status">
          <StatusBadge item={item} className="!bg-white/95 shadow-sm" />
          {item.isMine && <span className="badge badge-overlay">Yours</span>}
        </span>
      </button>

      <div className="shop-meta">
        <p className="eyebrow text-ink-500">{getGarmentLabel(item.design)}</p>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <h3 className="shop-title">{item.title}</h3>
          <p className="shop-price">{formatPrice(item.price, item.currency)}</p>
        </div>
        <p className="mt-1 truncate text-xs text-ink-500">{getSellerName(item)}</p>

        <div className="mt-2.5 flex gap-2">
          {item.isMine ? (
            <>
              <button type="button" className="btn btn-primary btn-sm flex-1" onClick={() => onLook(item)}>
                View shirt
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onUnlist(item)}>
                Unlist
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-primary btn-sm flex-1"
                onClick={() => onBuy(item)}
                disabled={!purchasable}
                title={purchasable && !signedIn ? 'Sign in to buy' : undefined}
              >
                {purchasable && !signedIn && <LockIcon className="h-3.5 w-3.5" />}
                {purchasable ? 'Buy' : status === 'sold' ? 'Sold' : 'Unavailable'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onView(item)}
                aria-label={`Open ${item.title} in 3D`}
                title="Open in 3D"
              >
                <CubeIcon />
                3D
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}

const Marketplace = () => {
  const snap = useSnapshot(state)
  const { signedIn } = useAuthSession()
  const [activeView, setActiveView] = useState('shop')
  const [refreshKey, setRefreshKey] = useState(0)
  const [listings, setListings] = useState([])
  const [myListings, setMyListings] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [garmentFilter, setGarmentFilter] = useState('all')
  const [sortBy, setSortBy] = useState('featured')
  const [lookItem, setLookItem] = useState(null)
  const [lookMode, setLookMode] = useState('shirt')

  const visibleListings = activeView === 'mine' ? listings.filter((item) => item.isMine) : listings

  const garmentChoices = useMemo(() => {
    const labels = new Set(visibleListings.map((item) => getGarmentLabel(item.design)))
    return ['all', ...labels]
  }, [visibleListings])

  const filteredListings = useMemo(() => {
    const term = query.trim().toLowerCase()
    const result = visibleListings.filter((item) => {
      if (garmentFilter !== 'all' && getGarmentLabel(item.design) !== garmentFilter) return false
      if (!term) return true
      return [item.title, item.description, getSellerName(item)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    })
    if (sortBy === 'price-asc') return [...result].sort((a, b) => Number(a.price) - Number(b.price))
    if (sortBy === 'price-desc') return [...result].sort((a, b) => Number(b.price) - Number(a.price))
    if (sortBy === 'newest') {
      return [...result].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    }
    return result
  }, [visibleListings, query, garmentFilter, sortBy])

  useEffect(() => {
    if (!garmentChoices.includes(garmentFilter)) setGarmentFilter('all')
  }, [garmentChoices, garmentFilter])

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
  }, [snap.marketplaceOpen, refreshKey, signedIn])

  const openLook = (item) => {
    setLookMode('shirt')
    setLookItem(item)
  }

  const handleViewListing = async (item) => {
    setLookItem(null)
    const listing = item.design ? item : await getMarketplaceListingById(item.id)
    if (!listing) return
    state.design = migrateOrCreateDesign(listing.design)
    state.sceneTheme = 'light'
    syncRootFromDesign(state)
    state.viewerListing = listing
    state.viewerOpen = true
    state.marketplaceOpen = false
    state.myDesignsOpen = false
    state.intro = false
  }

  const handleBuy = async (item) => {
    if (!signedIn) {
      requestSignIn(`Sign in to buy "${item.title}".`)
      return
    }
    const ok = window.confirm(`Buy "${item.title}" for ${formatPrice(item.price, item.currency)}?`)
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

  const tabs = [
    { key: 'shop', label: 'Shop', count: listings.length, icon: BagIcon },
    { key: 'mine', label: 'My Listings', count: myListings.length, icon: TagIcon },
    { key: 'purchases', label: 'Purchases', count: purchases.length, icon: ReceiptIcon },
  ]

  const hasFilters = query.trim() !== '' || garmentFilter !== 'all'
  const clearFilters = () => {
    setQuery('')
    setGarmentFilter('all')
  }

  return (
    <AnimatePresence>
      {snap.intro && snap.marketplaceOpen && (
        <motion.section
          className="page marketplace-panel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <div className="page-inner">
            <header className="page-hero page-hero--shop flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="eyebrow text-brand-600">Marketplace</p>
                <h1 className="page-title mt-2">Shop the <span>collection</span></h1>
                <p className="page-subtitle !mt-2">Browse every piece as a shirt first. Open 3D only when you want to spin it.</p>
              </div>

              <div className="segmented self-start lg:self-auto" role="tablist" aria-label="Marketplace sections">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={activeView === tab.key}
                      className="segmented-btn"
                      onClick={() => setActiveView(tab.key)}
                    >
                      <Icon className="hidden h-4 w-4 sm:block" />
                      {tab.label}
                      <span className="segmented-count">{tab.count}</span>
                    </button>
                  )
                })}
              </div>
            </header>

            {activeView !== 'purchases' && !loading && !error && visibleListings.length > 0 && (
              <div className="marketplace-toolbar -mx-4 mb-5 flex flex-col gap-3 border-b border-ink-200/70 bg-paper/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:bg-white sm:px-3 md:flex-row md:items-center">
                <label className="relative flex-1 md:max-w-xs">
                  <span className="sr-only">Search listings</span>
                  <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search designs or sellers"
                    className="field-input !mt-0 rounded-full !py-2 pl-10"
                  />
                </label>
                <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto" role="group" aria-label="Filter by garment" style={{ scrollbarWidth: 'none' }}>
                  {garmentChoices.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className="chip"
                      aria-pressed={garmentFilter === choice}
                      onClick={() => setGarmentFilter(choice)}
                    >
                      {choice === 'all' ? 'All garments' : choice}
                    </button>
                  ))}
                </div>
                <label className="flex shrink-0 items-center gap-2 text-xs font-medium text-ink-500">
                  Sort
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="rounded-full border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-900 outline-none focus:border-ink-900"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {loading && <SkeletonGrid />}

            {!loading && error && (
              <ErrorState message={error} onRetry={() => setRefreshKey((prev) => prev + 1)} />
            )}

            {!loading && !error && activeView !== 'purchases' && visibleListings.length === 0 && (
              <EmptyState
                icon={TagIcon}
                title={activeView === 'mine' ? 'You have no live listings' : 'No listings yet'}
                message={signedIn
                  ? 'No listings yet. Open My Designs and list one of your saved designs.'
                  : 'No listings yet. Create an account, save a design, then list it here.'}
                action={signedIn ? (
                  <button type="button" className="btn btn-primary btn-sm" onClick={goMyDesigns}>
                    <GridIcon />
                    Go to My Designs
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => requestSignIn('Create an account to save and list designs.', { mode: 'register' })}
                  >
                    Create account
                  </button>
                )}
              />
            )}

            {!loading && !error && activeView !== 'purchases' && visibleListings.length > 0 && (
              <>
                <p className="mb-3 text-xs font-medium text-ink-500">
                  {filteredListings.length} {filteredListings.length === 1 ? 'design' : 'designs'}
                  {hasFilters ? ' match your filters' : ''}
                </p>
                {filteredListings.length === 0 ? (
                  <EmptyState
                    icon={SearchIcon}
                    title="No matches"
                    message="Try a different search or garment filter."
                    action={<button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear filters</button>}
                  />
                ) : (
                  <div className="shop-grid">
                    {filteredListings.map((item) => (
                      <MarketplaceCard
                        key={item.id}
                        item={item}
                        signedIn={signedIn}
                        onBuy={handleBuy}
                        onLook={openLook}
                        onView={handleViewListing}
                        onUnlist={handleUnlist}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {!loading && !error && activeView === 'purchases' && purchases.length === 0 && !signedIn && (
              <EmptyState
                icon={LockIcon}
                title="Sign in to see purchases"
                message="Buying requires an account. Sign in to buy designs and keep a record of your purchases."
                action={
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => requestSignIn('Sign in to view and make purchases.')}>
                    Sign in
                  </button>
                }
              />
            )}

            {!loading && !error && activeView === 'purchases' && purchases.length === 0 && signedIn && (
              <EmptyState
                icon={ReceiptIcon}
                title="No purchases yet"
                message="No purchases yet. Buy a marketplace design to add it to your saved designs."
                action={
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setActiveView('shop')}>
                    <BagIcon />
                    Browse the shop
                  </button>
                }
              />
            )}

            {!loading && !error && activeView === 'purchases' && purchases.length > 0 && (
              <PurchaseList items={purchases} />
            )}
          </div>
          {lookItem && (
            <ProductLook
              item={lookItem}
              mode={lookMode}
              onMode={setLookMode}
              onClose={() => setLookItem(null)}
              onBuy={handleBuy}
              onView={handleViewListing}
              onUnlist={handleUnlist}
              signedIn={signedIn}
            />
          )}
        </motion.section>
      )}
    </AnimatePresence>
  )
}

export default Marketplace
