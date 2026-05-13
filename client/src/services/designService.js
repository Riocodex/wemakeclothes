const STORAGE_KEY = 'wmc_designs_v1'
const LISTINGS_KEY = 'wmc_marketplace_listings_v1'
const PURCHASES_KEY = 'wmc_marketplace_purchases_v1'

const samplePreview = (label, color, accent) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420">
      <rect width="640" height="420" fill="${accent}"/>
      <path d="M225 94h54c14 26 68 26 82 0h54l74 55-50 78-34-18v132H235V209l-34 18-50-78 74-55z" fill="${color}"/>
      <path d="M270 142c28 18 72 18 100 0" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="14" stroke-linecap="round"/>
      <text x="320" y="382" text-anchor="middle" font-family="Inter, Arial" font-size="34" font-weight="800" fill="rgba(0,0,0,.62)">${label}</text>
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const sampleDesign = (catalogId, color, logo = './me.jpg') => ({
  version: 1,
  catalogId,
  type: catalogId.includes('dress') ? 'dress' : 'tshirt',
  sleeve: catalogId === 'tshirt_long' ? 'long' : 'short',
  parts: ['body'],
  colors: { body: color },
  textures: { logo, full: logo },
  isLogoTexture: true,
  isFullTexture: false,
  layers: []
})

const SAMPLE_LISTINGS = [
  {
    id: 'sample-sunrise-studio',
    title: 'Sunrise Studio Tee',
    description: 'Warm everyday colorway with a clean front graphic.',
    sellerName: 'Maya Atelier',
    price: 29,
    previewImage: samplePreview('SUNRISE TEE', '#EFBD48', '#E7EEF4'),
    design: sampleDesign('tshirt_short', '#EFBD48'),
    sceneTheme: 'light',
    isSample: true,
    createdAt: '2026-01-12T10:00:00.000Z',
    updatedAt: '2026-01-12T10:00:00.000Z',
  },
  {
    id: 'sample-night-runner',
    title: 'Night Runner Long Sleeve',
    description: 'Dark long-sleeve base made for bold logo artwork.',
    sellerName: 'Northline Goods',
    price: 42,
    previewImage: samplePreview('NIGHT RUNNER', '#232B36', '#C4D7D1'),
    design: sampleDesign('tshirt_long', '#232B36'),
    sceneTheme: 'dark',
    isSample: true,
    createdAt: '2026-02-03T14:30:00.000Z',
    updatedAt: '2026-02-03T14:30:00.000Z',
  },
  {
    id: 'sample-gallery-dress',
    title: 'Gallery Dress',
    description: 'Minimal dress concept with a soft gallery-ready palette.',
    sellerName: 'Studio Vale',
    price: 64,
    previewImage: samplePreview('GALLERY DRESS', '#7C9A92', '#F1DED5'),
    design: sampleDesign('dress', '#7C9A92'),
    sceneTheme: 'light',
    isSample: true,
    createdAt: '2026-03-18T09:45:00.000Z',
    updatedAt: '2026-03-18T09:45:00.000Z',
  },
]

const readAll = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeAll = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

const readListings = () => {
  try {
    const raw = localStorage.getItem(LISTINGS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeListings = (items) => {
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(items))
}

const readPurchases = () => {
  try {
    const raw = localStorage.getItem(PURCHASES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writePurchases = (items) => {
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(items))
}

export const saveDesign = ({ title, design, previewImage, sceneTheme }) => {
  const now = new Date().toISOString()
  const record = {
    id: crypto.randomUUID(),
    title,
    design,
    previewImage,
    sceneTheme,
    createdAt: now,
    updatedAt: now,
  }

  const existing = readAll()
  existing.unshift(record)
  writeAll(existing)
  return record
}

export const listDesigns = () => readAll()

export const getDesignById = (id) => readAll().find((item) => item.id === id) || null

export const deleteDesignById = (id) => {
  const existing = readAll()
  const next = existing.filter((item) => item.id !== id)
  writeAll(next)
  writeListings(readListings().filter((item) => item.sourceDesignId !== id))
  return next.length !== existing.length
}

const getPurchasedListingIds = () => new Set(readPurchases().map((item) => item.listingId))

export const listMarketplaceListings = () => {
  const purchasedListingIds = getPurchasedListingIds()
  return [
    ...readListings().map((item) => ({ ...item, isMine: true })),
    ...SAMPLE_LISTINGS
      .filter((item) => !purchasedListingIds.has(item.id))
      .map((item) => ({ ...item, isMine: false }))
  ]
}

export const getMarketplaceListingById = (id) =>
  listMarketplaceListings().find((item) => item.id === id) || null

export const listMyListings = () => readListings()

export const listPurchases = () => readPurchases()

export const getListingBySourceDesignId = (sourceDesignId) =>
  readListings().find((item) => item.sourceDesignId === sourceDesignId) || null

export const listDesignForSale = ({ savedDesign, price, description }) => {
  const now = new Date().toISOString()
  const existing = readListings()
  const previous = existing.find((item) => item.sourceDesignId === savedDesign.id)
  const listing = {
    id: previous?.id || crypto.randomUUID(),
    sourceDesignId: savedDesign.id,
    title: savedDesign.title,
    description: description || 'Listed from my saved designs.',
    sellerName: 'You',
    price,
    previewImage: savedDesign.previewImage,
    design: savedDesign.design,
    sceneTheme: savedDesign.sceneTheme,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  }

  writeListings([
    listing,
    ...existing.filter((item) => item.sourceDesignId !== savedDesign.id)
  ])
  return listing
}

export const deleteListingById = (id) => {
  const existing = readListings()
  const next = existing.filter((item) => item.id !== id)
  writeListings(next)
  return next.length !== existing.length
}

export const buyMarketplaceListing = (listingId) => {
  if (getPurchasedListingIds().has(listingId)) return null
  const listing = listMarketplaceListings().find((item) => item.id === listingId)
  if (!listing || listing.isMine) return null
  const purchasedAt = new Date().toISOString()
  const purchaseRecord = {
    id: crypto.randomUUID(),
    listingId: listing.id,
    title: listing.title,
    sellerName: listing.sellerName,
    price: listing.price,
    purchasedAt,
  }
  const saved = saveDesign({
    title: `${listing.title} purchase`,
    design: JSON.parse(JSON.stringify(listing.design)),
    previewImage: listing.previewImage,
    sceneTheme: listing.sceneTheme,
  })

  writePurchases([purchaseRecord, ...readPurchases()])
  return { purchase: purchaseRecord, savedDesign: saved }
}
