import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSnapshot } from 'valtio'

import state from '../store'
import { CustomButton } from '../components'
import {
  deleteDesignById,
  deleteListingById,
  listDesignForSale,
  listDesigns,
  listMyListings
} from '../services/designService'
import { migrateOrCreateDesign, syncRootFromDesign } from '../config/designSchema'
import { slideAnimation } from '../config/motion'

const MyDesigns = () => {
  const snap = useSnapshot(state)
  const [refreshKey, setRefreshKey] = useState(0)
  const [listingDraft, setListingDraft] = useState(null)
  const [designsView, setDesignsView] = useState([])
  const [myListings, setMyListings] = useState([])
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
    ])
      .then(([designItems, listingItems]) => {
        if (!active) return
        setDesignsView(designItems)
        setMyListings(listingItems)
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
  }, [snap.myDesignsOpen, refreshKey])

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

  return (
    <AnimatePresence>
      {snap.intro && snap.myDesignsOpen && !snap.marketplaceOpen && (
        <motion.section className='home app-list-page my-designs-panel' {...slideAnimation('right')}>
          <div className='app-list-page-header w-full flex items-center justify-between'>
            <h2 className='text-2xl font-black text-black'>My Designs</h2>
          </div>

          <div className='app-page-scroll w-[min(92vw,980px)] max-h-[72vh] overflow-auto pr-1'>
            {loadingDesigns && (
              <div className='glassmorphism rounded-xl p-6 text-sm text-gray-700'>
                Loading saved designs...
              </div>
            )}

            {!loadingDesigns && designsError && (
              <div className='glassmorphism rounded-xl p-6 text-sm text-red-700'>
                {designsError}
              </div>
            )}

            {!loadingDesigns && !designsError && designsView.length === 0 && (
              <div className='glassmorphism rounded-xl p-6 text-sm text-gray-700'>
                No saved designs yet. Open the customizer and click `Save Design` first.
              </div>
            )}

            {!loadingDesigns && !designsError && designsView.length > 0 && (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {designsView.map((item) => {
                  const listing = myListings.find((listingItem) => listingItem.sourceDesignId === item.id)
                  return (
                    <div key={item.id} className='glassmorphism rounded-xl p-3 flex flex-col gap-3'>
                      <div className='rounded-lg overflow-hidden bg-gray-100 h-40'>
                        {item.previewImage ? (
                          <img src={item.previewImage} alt={item.title} className='w-full h-full object-cover' />
                        ) : (
                          <div className='w-full h-full flex items-center justify-center text-xs text-gray-500'>
                            No preview
                          </div>
                        )}
                      </div>
                      <div>
                        <div className='flex items-center justify-between gap-2'>
                          <p className='text-sm font-semibold text-gray-900 truncate'>{item.title}</p>
                          {listing && <p className='text-[11px] font-bold text-gray-700'>${Number(listing.price).toFixed(0)}</p>}
                        </div>
                        <p className='text-[11px] text-gray-600'>
                          {listing ? 'Listed on marketplace' : new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <CustomButton
                        type='filled'
                        title='Open in editor'
                        handleClick={() => handleOpenDesign(item)}
                        customStyles='w-full py-2 text-xs font-semibold'
                      />
                      {listing ? (
                        <>
                          <CustomButton
                            type='outline'
                            title='View listing'
                            handleClick={() => handleViewListing(listing)}
                            customStyles='w-full py-2 text-xs font-semibold'
                          />
                          <CustomButton
                            type='outline'
                            title='Unlist from marketplace'
                            handleClick={() => handleUnlistDesign(listing)}
                            customStyles='w-full py-2 text-xs font-semibold'
                          />
                        </>
                      ) : (
                        <CustomButton
                          type='outline'
                          title='List for sale'
                          handleClick={() => handleListDesign(item)}
                          customStyles='w-full py-2 text-xs font-semibold'
                        />
                      )}
                      <CustomButton
                        type='outline'
                        title='Delete'
                        handleClick={() => handleDeleteDesign(item.id)}
                        customStyles='w-full py-2 text-xs font-semibold'
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <AnimatePresence>
            {listingDraft && (
              <motion.div
                className='absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-[2px]'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setListingDraft(null)}
              >
                <motion.div
                  className='glassmorphism rounded-xl p-4 w-[min(92vw,420px)]'
                  initial={{ opacity: 0, scale: 0.94, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 8 }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <h3 className='text-lg font-black text-gray-950'>List design</h3>
                  <p className='mt-1 text-sm text-gray-600 truncate'>{listingDraft.item.title}</p>

                  <label className='mt-4 block text-xs font-bold text-gray-700' htmlFor='listing-price'>
                    Price
                  </label>
                  <input
                    id='listing-price'
                    type='number'
                    min='1'
                    value={listingDraft.price}
                    onChange={(event) => setListingDraft((draft) => ({ ...draft, price: event.target.value }))}
                    className='mt-1 w-full rounded-md border border-gray-300 bg-white/70 px-3 py-2 text-sm outline-none'
                  />

                  <label className='mt-4 block text-xs font-bold text-gray-700' htmlFor='listing-description'>
                    Description
                  </label>
                  <textarea
                    id='listing-description'
                    rows={4}
                    value={listingDraft.description}
                    onChange={(event) => setListingDraft((draft) => ({ ...draft, description: event.target.value }))}
                    className='mt-1 w-full rounded-md border border-gray-300 bg-white/70 px-3 py-2 text-sm outline-none'
                  />

                  <div className='mt-4 flex items-center gap-2'>
                    <CustomButton
                      type='filled'
                      title='List on marketplace'
                      handleClick={handleConfirmListing}
                      customStyles='w-full py-2 text-xs font-semibold'
                    />
                    <CustomButton
                      type='outline'
                      title='Cancel'
                      handleClick={() => setListingDraft(null)}
                      customStyles='w-full py-2 text-xs font-semibold'
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      )}
    </AnimatePresence>
  )
}

export default MyDesigns
