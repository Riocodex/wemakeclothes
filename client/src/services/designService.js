import { apiClient, getAuthToken } from './apiClient'
import { hasAuthSession } from './authService'

const requireLogin = (action = 'do that') => {
  if (!hasAuthSession()) {
    throw new Error(`Please log in to ${action}.`)
  }
}

export const saveDesign = async ({ title, design, previewImage, sceneTheme }) => {
  requireLogin('save designs')

  const response = await apiClient.post('/designs', {
    title,
    design,
    previewImage,
    sceneTheme,
  })

  return response.design
}

export const listDesigns = async () => {
  if (!hasAuthSession()) return []

  const response = await apiClient.get('/designs')
  return response.designs || []
}

export const getDesignById = async (id) => {
  if (!hasAuthSession()) return null

  const response = await apiClient.get(`/designs/${id}`)
  return response.design || null
}

export const deleteDesignById = async (id) => {
  requireLogin('delete designs')
  await apiClient.delete(`/designs/${id}`)
  return true
}

export const listMarketplaceListings = async () => {
  const response = await apiClient.get('/listings')
  return response.listings || []
}

export const getMarketplaceListingById = async (id) => {
  const response = await apiClient.get(`/listings/${id}`)
  return response.listing || null
}

export const listMyListings = async () => {
  if (!hasAuthSession()) return []

  const response = await apiClient.get('/listings/mine')
  return response.listings || []
}

export const listPurchases = async () => {
  if (!hasAuthSession()) return []

  const response = await apiClient.get('/listings/purchases')
  return response.purchases || []
}

export const getListingBySourceDesignId = async (sourceDesignId) => {
  const listings = await listMyListings()
  return listings.find((item) => item.sourceDesignId === sourceDesignId) || null
}

export const listDesignForSale = async ({ savedDesign, price, description }) => {
  requireLogin('list designs for sale')

  const response = await apiClient.post('/listings', {
    designId: savedDesign.id,
    price,
    description,
  })

  return response.listing
}

export const deleteListingById = async (id) => {
  requireLogin('manage listings')
  await apiClient.delete(`/listings/${id}`)
  return true
}

export const buyMarketplaceListing = async (listingId) => {
  requireLogin('purchase designs')
  return apiClient.post(`/listings/${listingId}/purchase`)
}
