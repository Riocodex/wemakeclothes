import { getId, mapDesign, mapListing, mapProfile, mapPurchase } from '../db/map.js'

const asDesignJson = (design) => (design?.toJSON ? design.toJSON() : mapDesign(design) || design)

export const serializeUser = (user) => {
  if (!user) return null
  if (user.toJSON) {
    const json = user.toJSON()
    delete json.passwordHash
    return json
  }

  const mapped = mapProfile(user)
  return mapped
}

export const serializeDesign = (design) => {
  const json = asDesignJson(design)
  if (!json) return null

  return {
    ...json,
    design: {
      version: 1,
      catalogId: json.catalogId,
      type: json.type,
      sleeve: json.sleeve,
      colors: json.colors,
      textures: json.textures,
      layers: json.layers,
      isLogoTexture: json.isLogoTexture,
      isFullTexture: json.isFullTexture,
    },
    previewImage: json.previewImageUrl,
  }
}

export const serializeListing = (listing, viewerId) => {
  const mapped = listing?.toJSON ? { ...listing.toJSON(), ...listing } : mapListing(listing)
  const design = mapped.designId && typeof mapped.designId === 'object'
    ? mapped.designId
    : listing.design || listing.designId
  const seller = mapped.sellerId && typeof mapped.sellerId === 'object'
    ? mapped.sellerId
    : listing.seller || listing.sellerId
  const serializedDesign = design && (design.catalogId || design.catalog_id || design.design)
    ? serializeDesign(design)
    : null
  const sellerId = getId(seller) || getId(mapped.sellerId)

  return {
    id: mapped.id,
    sellerId,
    designId: getId(design) || getId(mapped.designId),
    sourceDesignId: getId(design) || getId(mapped.designId),
    title: mapped.title,
    description: mapped.description,
    price: mapped.price,
    currency: mapped.currency,
    status: mapped.status,
    previewImageUrl: mapped.previewImageUrl,
    soldAt: mapped.soldAt,
    createdAt: mapped.createdAt,
    updatedAt: mapped.updatedAt,
    sellerName: seller?.name || 'Seller',
    previewImage: mapped.previewImageUrl || serializedDesign?.previewImage || '',
    design: serializedDesign?.design || null,
    sceneTheme: design?.sceneTheme || design?.scene_theme || 'dark',
    isMine: Boolean(viewerId && sellerId === viewerId.toString()),
  }
}

export const serializePurchase = (purchase) => {
  const mapped = mapPurchase(purchase)
  const listing = mapped.listingId && typeof mapped.listingId === 'object'
    ? mapped.listingId
    : purchase.listing || purchase.listingId
  const seller = mapped.sellerId && typeof mapped.sellerId === 'object'
    ? mapped.sellerId
    : purchase.seller || purchase.sellerId
  const copiedDesign = mapped.copiedDesignId && typeof mapped.copiedDesignId === 'object'
    ? mapped.copiedDesignId
    : purchase.copied_design || purchase.copiedDesign || purchase.copiedDesignId

  return {
    id: mapped.id,
    buyerId: mapped.buyerId,
    sellerId: getId(seller) || getId(mapped.sellerId),
    listingId: getId(listing) || getId(mapped.listingId),
    copiedDesignId: getId(copiedDesign) || getId(mapped.copiedDesignId),
    originalDesignId: getId(mapped.originalDesignId),
    price: mapped.price,
    currency: mapped.currency,
    paymentStatus: mapped.paymentStatus,
    createdAt: mapped.createdAt,
    updatedAt: mapped.updatedAt,
    title: listing?.title || copiedDesign?.title || 'Purchased design',
    sellerName: seller?.name || 'Seller',
    purchasedAt: mapped.createdAt,
  }
}
