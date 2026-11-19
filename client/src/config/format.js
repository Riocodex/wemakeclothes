import { GARMENT_CATALOG } from './garments'

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP']

export const formatPrice = (value, currency) => {
  const code = SUPPORTED_CURRENCIES.includes(String(currency || '').toUpperCase())
    ? String(currency).toUpperCase()
    : 'USD'
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const getGarmentLabel = (design) => {
  const id = design?.catalogId || design?.garmentType
  return GARMENT_CATALOG[id]?.label || 'Garment'
}

export const getSellerName = (item) =>
  item?.sellerName || item?.seller?.name || 'Independent seller'

export const getListingStatus = (item) => {
  const status = String(item?.status || 'active').toLowerCase()
  return ['active', 'sold', 'removed'].includes(status) ? status : 'active'
}

export const STATUS_LABELS = {
  active: 'Available',
  sold: 'Sold',
  removed: 'Removed',
}

export const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
