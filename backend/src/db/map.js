const asIso = (value) => {
  if (!value) return value
  if (value instanceof Date) return value.toISOString()
  return value
}

const asNumber = (value) => {
  if (value === null || value === undefined || value === '') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : value
}

const asId = (value) => {
  if (!value) return value
  if (typeof value === 'object') {
    return value.id || value._id?.toString?.() || null
  }
  return String(value)
}

export const getId = asId

export const mapProfile = (row) => {
  if (!row) return null

  return {
    id: asId(row.id),
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url ?? row.avatarUrl ?? '',
    role: row.role || 'buyer',
    createdAt: asIso(row.created_at ?? row.createdAt),
    updatedAt: asIso(row.updated_at ?? row.updatedAt),
  }
}

export const toAuthUser = (profile) => {
  const json = mapProfile(profile)
  return {
    ...json,
    toJSON: () => json,
  }
}

export const mapDesign = (row) => {
  if (!row) return null

  return {
    id: asId(row.id),
    ownerId: asId(row.owner_id ?? row.ownerId),
    title: row.title,
    description: row.description || '',
    catalogId: row.catalog_id ?? row.catalogId,
    type: row.type || 'tshirt',
    sleeve: row.sleeve || 'short',
    colors: row.colors || { body: '#EFBD48' },
    textures: row.textures || { logo: './me.jpg', full: './me.jpg' },
    layers: Array.isArray(row.layers) ? row.layers : [],
    isLogoTexture: Boolean(row.is_logo_texture ?? row.isLogoTexture ?? true),
    isFullTexture: Boolean(row.is_full_texture ?? row.isFullTexture),
    sceneTheme: row.scene_theme ?? row.sceneTheme ?? 'dark',
    previewImageUrl: row.preview_image_url ?? row.previewImageUrl ?? '',
    sourceDesignId: asId(row.source_design_id ?? row.sourceDesignId) || null,
    createdAt: asIso(row.created_at ?? row.createdAt),
    updatedAt: asIso(row.updated_at ?? row.updatedAt),
  }
}

export const mapListing = (row) => {
  if (!row) return null

  const seller = row.seller || (row.sellerId && typeof row.sellerId === 'object' ? row.sellerId : null)
  const design = row.design || (row.designId && typeof row.designId === 'object' ? row.designId : null)

  return {
    id: asId(row.id),
    sellerId: seller ? mapProfile(seller) : asId(row.seller_id ?? row.sellerId),
    designId: design ? mapDesign(design) : asId(row.design_id ?? row.designId),
    title: row.title,
    description: row.description || '',
    price: asNumber(row.price),
    currency: row.currency || 'USD',
    status: row.status || 'active',
    previewImageUrl: row.preview_image_url ?? row.previewImageUrl ?? '',
    soldAt: asIso(row.sold_at ?? row.soldAt) || null,
    createdAt: asIso(row.created_at ?? row.createdAt),
    updatedAt: asIso(row.updated_at ?? row.updatedAt),
  }
}

export const mapPurchase = (row) => {
  if (!row) return null

  const seller = row.seller || (row.sellerId && typeof row.sellerId === 'object' ? row.sellerId : null)
  const listing = row.listing || (row.listingId && typeof row.listingId === 'object' ? row.listingId : null)
  const copiedDesign = row.copied_design
    || row.copiedDesign
    || (row.copiedDesignId && typeof row.copiedDesignId === 'object' ? row.copiedDesignId : null)

  return {
    id: asId(row.id),
    buyerId: asId(row.buyer_id ?? row.buyerId),
    sellerId: seller ? mapProfile(seller) : asId(row.seller_id ?? row.sellerId),
    listingId: listing ? mapListing(listing) : asId(row.listing_id ?? row.listingId),
    originalDesignId: asId(row.original_design_id ?? row.originalDesignId),
    copiedDesignId: copiedDesign
      ? mapDesign(copiedDesign)
      : asId(row.copied_design_id ?? row.copiedDesignId),
    price: asNumber(row.price),
    currency: row.currency || 'USD',
    paymentStatus: row.payment_status ?? row.paymentStatus ?? 'paid',
    createdAt: asIso(row.created_at ?? row.createdAt),
    updatedAt: asIso(row.updated_at ?? row.updatedAt),
  }
}
