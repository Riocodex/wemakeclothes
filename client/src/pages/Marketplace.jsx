/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react'
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
import { BagIcon, EyeIcon, GridIcon, LockIcon, ReceiptIcon, SearchIcon, TagIcon } from '../components/Icons'

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
]

const MarketplaceCard = ({ item, signedIn, onBuy, onView, onUnlist }) => {
  const status = getListingStatus(item)
  const purchasable = status === 'active'

  return (
    <article className="listing-card">
      <button
        type="button"
        className="listing-media"
        onClick={() => onView(item)}
        aria-label={`View ${item.title} in 3D`}
      >
        <ListingPreview item={item} />
        <div className="absolute inset-x-2.5 top-2.5 flex flex-wrap items-start justify-between gap-1.5 sm:inset-x-3 sm:top-3">
          <StatusBadge item={item} className="!bg-white/95 shadow-sm" />
          {item.isMine && <span className="badge badge-overlay">Your listing</span>}
        </div>
        <span className="listing-media-hover">
          <span className="btn btn-inverse btn-sm shadow-lift">
            <EyeIcon />
            View in 3D
          </span>
        </span>
      </button>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <p className="eyebrow text-ink-500">{getGarmentLabel(item.design)}</p>
        <div className="mt-1 flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-sm font-semibold text-ink-900 sm:text-[0.9375rem]">{item.title}</h3>
          <p className="shrink-0 text-sm font-bold text-ink-900 sm:text-[0.9375rem]">{formatPrice(item.price, item.currency)}</p>
        </div>
        <p className="mt-0.5 truncate text-xs text-ink-500">by {getSellerName(item)}</p>
        {item.description ? (
          <p className="mt-2 line-clamp-2 hidden text-xs leading-relaxed text-ink-600 sm:block">{item.description}</p>
        ) : null}

        <div className="mt-auto flex gap-2 pt-4">
          {item.isMine ? (
            <>
              <button type="button" className="btn btn-primary btn-sm flex-1" onClick={() => onView(item)}>
                <EyeIcon className="hidden h-4 w-4 sm:block" />
                View design
              </button>
              <button type="button" className="btn btn-secondary btn-sm flex-1 sm:flex-none" onClick={() => onUnlist(item)}>
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
                {purchasable ? 'Buy design' : status === 'sold' ? 'Sold' : 'Unavailable'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm !px-2.5 sm:!px-3"
                onClick={() => onView(item)}
                aria-label={`View ${item.title}`}
                title="View design"
              >
                <EyeIcon />
                <span className="hidden lg:inline">View</span>
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

  const handleViewListing = async (item) => {
    const listing = item.design ? item : await getMarketplaceListingById(item.id)
    if (!listing) return
    state.design = migrateOrCreateDesign(listing.design)
    state.sceneTheme = 'dark'
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
            <header className="page-hero flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="eyebrow text-brand-700">Marketplace</p>
                <h1 className="page-title mt-2">Shop independent designs</h1>
                <p className="page-subtitle">Browse, buy, and manage listed clothing designs. Every purchase lands in My Designs, ready to customize.</p>
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
                message="No listings yet. Open My Designs and list one of your saved designs."
                action={
                  <button type="button" className="btn btn-primary btn-sm" onClick={goMyDesigns}>
                    <GridIcon />
                    Go to My Designs
                  </button>
                }
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
                  <div className="listing-grid">
                    {filteredListings.map((item) => (
                      <MarketplaceCard
                        key={item.id}
                        item={item}
                        signedIn={signedIn}
                        onBuy={handleBuy}
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
        </motion.section>
      )}
    </AnimatePresence>
  )
}

export default Marketplace
