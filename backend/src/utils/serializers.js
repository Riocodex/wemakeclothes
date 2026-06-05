const getId = (value) => value?._id?.toString?.() || value?.toString?.() || value

export const serializeDesign = (design) => ({
  ...design.toJSON(),
  design: {
    version: 1,
    catalogId: design.catalogId,
    type: design.type,
    sleeve: design.sleeve,
    colors: design.colors,
    textures: design.textures,
    layers: design.layers,
    isLogoTexture: design.isLogoTexture,
    isFullTexture: design.isFullTexture,
  },
  previewImage: design.previewImageUrl,
})

export const serializeListing = (listing, viewerId) => {
  const design = listing.designId
  const seller = listing.sellerId
  const serializedDesign = design?.toJSON ? serializeDesign(design) : null
  const sellerId = getId(seller)

  return {
    ...listing.toJSON(),
    sellerId,
    designId: getId(design),
    sourceDesignId: getId(design),
    sellerName: seller?.name || 'Seller',
    previewImage: listing.previewImageUrl || serializedDesign?.previewImage || '',
    design: serializedDesign?.design || null,
    sceneTheme: design?.sceneTheme || 'dark',
    isMine: Boolean(viewerId && sellerId === viewerId.toString()),
  }
}

export const serializePurchase = (purchase) => {
  const listing = purchase.listingId
  const seller = purchase.sellerId
  const copiedDesign = purchase.copiedDesignId

  return {
    ...purchase.toJSON(),
    listingId: getId(listing),
    sellerId: getId(seller),
    copiedDesignId: getId(copiedDesign),
    originalDesignId: getId(purchase.originalDesignId),
    title: listing?.title || copiedDesign?.title || 'Purchased design',
    sellerName: seller?.name || 'Seller',
    purchasedAt: purchase.createdAt,
  }
}
