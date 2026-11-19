/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSnapshot } from 'valtio'

import state from '../store'
import {
  deleteDesignById,
  deleteListingById,
  listDesignForSale,
  listDesigns,
  listMyListings,
  listPurchases
} from '../services/designService'
import { migrateOrCreateDesign, syncRootFromDesign } from '../config/designSchema'
import { formatDate, formatPrice, getGarmentLabel } from '../config/format'
import { goCreate, goMarketplace, requestSignIn } from '../config/navigation'
import {
  EmptyState,
  ErrorState,
  ListingPreview,
  PurchaseList,
  SkeletonGrid,
  StatusBadge,
  useAuthSession,
} from '../components/MarketplaceUI'
import {
  BagIcon,
  CloseIcon,
  EditIcon,
  EyeIcon,
  GridIcon,
  LockIcon,
  PlusIcon,
  ReceiptIcon,
  TagIcon,
  TrashIcon,
} from '../components/Icons'

const ROLE_LABELS = { buyer: 'Buyer', seller: 'Seller', admin: 'Admin' }

const DesignCard = ({ item, listing, onOpen, onList, onViewListing, onDelete }) => (
  <article className="listing-card">
    <button
      type="button"
      className="listing-media"
      onClick={() => onOpen(item)}
      aria-label={`Open ${item.title} in editor`}
    >
      {item.previewImage ? (
        <ListingPreview item={item} />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-medium text-ink-400">
          No preview
        </div>
      )}
      <div className="absolute left-3 top-3">
        {listing ? (
          <span className="badge badge-overlay">
            <TagIcon className="h-3 w-3" />
            Listed · {formatPrice(listing.price, listing.currency)}
          </span>
        ) : (
          <span className="badge badge-overlay text-ink-500">Draft</span>
        )}
      </div>
      <span className="listing-media-hover">
        <span className="btn btn-inverse btn-sm shadow-lift">
          <EditIcon />
          Open in editor
        </span>
      </span>
    </button>

    <div className="flex flex-1 flex-col p-3.5 sm:p-4">
      <p className="eyebrow text-ink-500">{getGarmentLabel(item.design)}</p>
      <h3 className="mt-1 truncate text-sm font-semibold text-ink-900 sm:text-[0.9375rem]">{item.title}</h3>
      <p className="mt-0.5 text-xs text-ink-500">
        {listing ? 'Listed on marketplace' : `Saved ${formatDate(item.createdAt)}`}
      </p>

      <div className="mt-auto flex gap-2 pt-4">
        <button type="button" className="btn btn-primary btn-sm flex-1" onClick={() => onOpen(item)}>
          <span className="sm:hidden">Open</span>
          <span className="hidden sm:inline">Open in editor</span>
        </button>
        {listing ? (
          <button
            type="button"
            className="btn btn-secondary btn-sm !px-2.5"
            onClick={() => onViewListing(listing)}
            aria-label="View listing"
            title="View listing"
          >
            <EyeIcon />
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-secondary btn-sm !px-2.5"
            onClick={() => onList(item)}
            aria-label="List for sale"
            title="List for sale"
          >
            <TagIcon />
          </button>
        )}
        <button
          type="button"
          className="btn btn-danger btn-sm !px-2.5"
          onClick={() => onDelete(item.id)}
          aria-label="Delete design"
          title="Delete"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  </article>
)

const ListingRow = ({ listing, onView, onUnlist }) => (
  <li className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
    <button
      type="button"
      className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-100"
      onClick={() => onView(listing)}
      aria-label={`View ${listing.title}`}
    >
      <ListingPreview item={listing} />
    </button>
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <p className="truncate text-sm font-semibold text-ink-900">{listing.title}</p>
        <StatusBadge item={listing} />
      </div>
      <p className="mt-0.5 truncate text-xs text-ink-500">
        {getGarmentLabel(listing.design)} · {formatPrice(listing.price, listing.currency)}
      </p>
      {listing.description ? (
        <p className="mt-1 hidden truncate text-xs text-ink-400 sm:block">{listing.description}</p>
      ) : null}
    </div>
    <div className="flex shrink-0 gap-2">
      <button type="button" className="btn btn-secondary btn-sm !px-2.5 sm:!px-3.5" onClick={() => onView(listing)} aria-label="View listing">
        <EyeIcon />
        <span className="hidden sm:inline">View</span>
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onUnlist(listing)}>
        Unlist
      </button>
    </div>
  </li>
)

const MyDesigns = () => {
  const snap = useSnapshot(state)
  const { signedIn, user } = useAuthSession()
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState('designs')
  const [listingDraft, setListingDraft] = useState(null)
  const [designsView, setDesignsView] = useState([])
  const [myListings, setMyListings] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loadingDesigns, setLoadingDesigns] = useState(false)
  const [designsError, setDesignsError] = useState('')

  useEffect(() => {
    if (!snap.myDesignsOpen) return

    let active = true
    setLoadingDesigns(true)
    setDesignsError('')

    Promise.all([
      listDesigns(),
      listMyListings(),
      listPurchases().catch(() => []),
    ])
      .then(([designItems, listingItems, purchaseItems]) => {
        if (!active) return
        setDesignsView(designItems)
        setMyListings(listingItems)
        setPurchases(purchaseItems)
      })
      .catch((error) => {
        if (active) {
          setDesignsView([])
          setDesignsError(error.message || 'Could not load designs.')
        }
      })
      .finally(() => {
        if (active) setLoadingDesigns(false)
      })

    return () => {
      active = false
    }
  }, [snap.myDesignsOpen, refreshKey, signedIn])

  const handleOpenDesign = (saved) => {
    state.design = migrateOrCreateDesign(saved.design)
    if (saved.sceneTheme) state.sceneTheme = saved.sceneTheme
    syncRootFromDesign(state)
    state.myDesignsOpen = false
    state.marketplaceOpen = false
    state.viewerOpen = false
    state.viewerListing = null
    state.intro = false
  }

  const handleViewListing = (listing) => {
    state.design = migrateOrCreateDesign(listing.design)
    if (listing.sceneTheme) state.sceneTheme = listing.sceneTheme
    syncRootFromDesign(state)
    state.viewerListing = { ...listing, isMine: true }
    state.viewerOpen = true
    state.myDesignsOpen = false
    state.marketplaceOpen = false
    state.intro = false
  }

  const handleDeleteDesign = async (id) => {
    const ok = window.confirm('Delete this design permanently?')
    if (!ok) return
    try {
      const deleted = await deleteDesignById(id)
      if (deleted) {
        setRefreshKey((prev) => prev + 1)
      }
    } catch (error) {
      alert(error.message || 'Could not delete this design.')
    }
  }

  const handleListDesign = (item) => {
    setListingDraft({
      item,
      price: '29',
      description: 'Custom clothing design ready to edit or wear.'
    })
  }

  const handleConfirmListing = async () => {
    if (!listingDraft?.item) return
    const price = Number(listingDraft.price)
    if (!Number.isFinite(price) || price <= 0) {
      alert('Please enter a valid price.')
      return
    }
    try {
      await listDesignForSale({
        savedDesign: listingDraft.item,
        price,
        description: (listingDraft.description || '').trim()
      })
      setListingDraft(null)
      alert('Design listed on the marketplace.')
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      alert(error.message || 'Could not list this design.')
    }
  }

  const handleUnlistDesign = async (listing) => {
    const ok = window.confirm('Remove this design from the marketplace?')
    if (!ok) return
    try {
      await deleteListingById(listing.id)
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      alert(error.message || 'Could not remove this listing.')
    }
  }

  const tabs = [
    { key: 'designs', label: 'Saved designs', short: 'Saved', count: designsView.length, icon: GridIcon },
    { key: 'listings', label: 'Listings', count: myListings.length, icon: TagIcon },
    { key: 'purchases', label: 'Purchases', count: purchases.length, icon: ReceiptIcon },
  ]

  const roleLabel = ROLE_LABELS[user?.role]
  const ready = !loadingDesigns && !designsError

  return (
    <>
    <AnimatePresence>
      {snap.intro && snap.myDesignsOpen && !snap.marketplaceOpen && (
        <motion.section
          className='page my-designs-panel'
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <div className='page-inner'>
            <header className='page-hero flex flex-col gap-5 md:flex-row md:items-end md:justify-between'>
              <div>
                <p className='eyebrow text-brand-700'>Studio</p>
                <h1 className='page-title mt-2'>My Designs</h1>
                <p className='page-subtitle'>Your saved designs, marketplace listings, and purchases in one place.</p>
              </div>
              <button type='button' className='btn btn-primary self-start md:self-auto' onClick={goCreate}>
                <PlusIcon />
                New design
              </button>
            </header>

            <div className='surface-card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
              {signedIn && user ? (
                <div className='flex min-w-0 items-center gap-3'>
                  <span className='auth-avatar h-10 w-10 text-sm'>
                    {(user.name || 'U').trim().charAt(0).toUpperCase()}
                  </span>
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-semibold text-ink-900'>{user.name}</p>
                    <p className='truncate text-xs text-ink-500'>
                      {roleLabel ? `${roleLabel} account · ` : ''}{user.email}
                    </p>
                  </div>
                  <span className='badge badge-active badge-dot ml-1 hidden sm:inline-flex'>Synced</span>
                </div>
              ) : (
                <div className='flex min-w-0 items-center gap-3'>
                  <span className='inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-600'>
                    <LockIcon />
                  </span>
                  <div className='min-w-0'>
                    <p className='text-sm font-semibold text-ink-900'>Browsing as a guest</p>
                    <p className='text-xs text-ink-500'>Designs are saved on this device. Sign in to sync them and to buy.</p>
                  </div>
                </div>
              )}
              {!signedIn && (
                <button
                  type='button'
                  className='btn btn-secondary btn-sm self-start sm:self-auto'
                  onClick={() => requestSignIn('Sign in to sync designs and buy from the marketplace.')}
                >
                  Sign in
                </button>
              )}
            </div>

            <div className='segmented mb-5 flex w-full sm:inline-flex sm:w-auto [&>button]:flex-1 [&>button]:justify-center sm:[&>button]:flex-none' role='tablist' aria-label='Dashboard sections'>
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    type='button'
                    role='tab'
                    aria-selected={activeTab === tab.key}
                    className='segmented-btn'
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <Icon className='hidden h-4 w-4 sm:block' />
                    {tab.short ? (
                      <>
                        <span className='sm:hidden'>{tab.short}</span>
                        <span className='hidden sm:inline'>{tab.label}</span>
                      </>
                    ) : tab.label}
                    <span className='segmented-count'>{tab.count}</span>
                  </button>
                )
              })}
            </div>

            {loadingDesigns && <SkeletonGrid count={4} />}

            {!loadingDesigns && designsError && (
              <ErrorState message={designsError} onRetry={() => setRefreshKey((prev) => prev + 1)} />
            )}

            {ready && activeTab === 'designs' && designsView.length === 0 && (
              <EmptyState
                icon={GridIcon}
                title='No saved designs yet'
                message='No saved designs yet. Open the customizer and click Save Design first.'
                action={
                  <button type='button' className='btn btn-primary btn-sm' onClick={goCreate}>
                    <PlusIcon />
                    Create a design
                  </button>
                }
              />
            )}

            {ready && activeTab === 'designs' && designsView.length > 0 && (
              <div className='listing-grid'>
                {designsView.map((item) => (
                  <DesignCard
                    key={item.id}
                    item={item}
                    listing={myListings.find((listingItem) => listingItem.sourceDesignId === item.id)}
                    onOpen={handleOpenDesign}
                    onList={handleListDesign}
                    onViewListing={handleViewListing}
                    onDelete={handleDeleteDesign}
                  />
                ))}
              </div>
            )}

            {ready && activeTab === 'listings' && myListings.length === 0 && (
              <EmptyState
                icon={TagIcon}
                title='Nothing listed yet'
                message='List one of your saved designs to start selling on the marketplace.'
                action={
                  <button type='button' className='btn btn-secondary btn-sm' onClick={() => setActiveTab('designs')}>
                    <GridIcon />
                    Choose a saved design
                  </button>
                }
              />
            )}

            {ready && activeTab === 'listings' && myListings.length > 0 && (
              <ul className='surface-card divide-y divide-ink-200/70 overflow-hidden'>
                {myListings.map((listing) => (
                  <ListingRow
                    key={listing.id}
                    listing={listing}
                    onView={handleViewListing}
                    onUnlist={handleUnlistDesign}
                  />
                ))}
              </ul>
            )}

            {ready && activeTab === 'purchases' && purchases.length === 0 && (
              signedIn ? (
                <EmptyState
                  icon={ReceiptIcon}
                  title='No purchases yet'
                  message='Buy a marketplace design and a copy will appear in your saved designs.'
                  action={
                    <button type='button' className='btn btn-primary btn-sm' onClick={goMarketplace}>
                      <BagIcon />
                      Browse the marketplace
                    </button>
                  }
                />
              ) : (
                <EmptyState
                  icon={LockIcon}
                  title='Sign in to see purchases'
                  message='Buying requires an account. Sign in to buy designs and keep a record of your purchases.'
                  action={
                    <button
                      type='button'
                      className='btn btn-primary btn-sm'
                      onClick={() => requestSignIn('Sign in to view and make purchases.')}
                    >
                      Sign in
                    </button>
                  }
                />
              )
            )}

            {ready && activeTab === 'purchases' && purchases.length > 0 && (
              <PurchaseList items={purchases} />
            )}
          </div>
        </motion.section>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {snap.intro && snap.myDesignsOpen && listingDraft && (
        <motion.div
          className='modal-backdrop'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setListingDraft(null)}
        >
          <motion.div
            className='modal-panel'
            role='dialog'
            aria-modal='true'
            aria-labelledby='list-design-title'
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <p className='eyebrow text-ink-500'>Sell</p>
                <h3 id='list-design-title' className='mt-1 text-lg font-bold tracking-tight'>List design</h3>
              </div>
              <button
                type='button'
                className='icon-btn -mr-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900'
                onClick={() => setListingDraft(null)}
                aria-label='Close'
              >
                <CloseIcon />
              </button>
            </div>

            <div className='mt-4 flex items-center gap-3 rounded-2xl bg-ink-50 p-2.5'>
              <div className='h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-100'>
                <ListingPreview item={listingDraft.item} />
              </div>
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold text-ink-900'>{listingDraft.item.title}</p>
                <p className='text-xs text-ink-500'>{getGarmentLabel(listingDraft.item.design)}</p>
              </div>
            </div>

            <label className='field-label mt-5' htmlFor='listing-price'>
              Price
            </label>
            <input
              id='listing-price'
              type='number'
              min='1'
              inputMode='decimal'
              value={listingDraft.price}
              onChange={(event) => setListingDraft((draft) => ({ ...draft, price: event.target.value }))}
              className='field-input'
            />

            <label className='field-label mt-4' htmlFor='listing-description'>
              Description
            </label>
            <textarea
              id='listing-description'
              rows={4}
              value={listingDraft.description}
              onChange={(event) => setListingDraft((draft) => ({ ...draft, description: event.target.value }))}
              className='field-input resize-none'
            />

            <div className='mt-6 flex flex-col-reverse gap-2 sm:flex-row'>
              <button type='button' className='btn btn-secondary flex-1' onClick={() => setListingDraft(null)}>
                Cancel
              </button>
              <button type='button' className='btn btn-primary flex-1' onClick={handleConfirmListing}>
                <TagIcon />
                List on marketplace
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}

export default MyDesigns
