import mongoose from 'mongoose'

import { Design, Listing, Purchase } from '../models/index.js'
import { HttpError, asyncHandler } from '../utils/httpError.js'
import { serializeDesign, serializeListing, serializePurchase } from '../utils/serializers.js'

const assertObjectId = (id, message) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(404, message)
  }
}

const populateListing = (query) => query
  .populate('sellerId', 'name email')
  .populate('designId')

const findActiveListing = async (id) => {
  assertObjectId(id, 'Listing not found')

  const listing = await populateListing(Listing.findOne({
    _id: id,
    status: 'active',
  }))

  if (!listing) {
    throw new HttpError(404, 'Listing not found')
  }

  return listing
}

const copyDesignForBuyer = (sourceDesign, buyerId, listingTitle) => ({
  ownerId: buyerId,
  title: `${listingTitle} purchase`,
  description: sourceDesign.description,
  catalogId: sourceDesign.catalogId,
  type: sourceDesign.type,
  sleeve: sourceDesign.sleeve,
  colors: sourceDesign.colors,
  textures: sourceDesign.textures,
  layers: sourceDesign.layers,
  isLogoTexture: sourceDesign.isLogoTexture,
  isFullTexture: sourceDesign.isFullTexture,
  sceneTheme: sourceDesign.sceneTheme,
  previewImageUrl: sourceDesign.previewImageUrl,
  sourceDesignId: sourceDesign._id,
})

export const createListing = asyncHandler(async (req, res) => {
  const { designId, price, description, currency } = req.body

  assertObjectId(designId, 'Design not found')

  const parsedPrice = Number(price)
  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    throw new HttpError(400, 'A valid price is required')
  }

  const design = await Design.findOne({
    _id: designId,
    ownerId: req.user.id,
  })

  if (!design) {
    throw new HttpError(404, 'Design not found')
  }

  let listing = await Listing.findOne({
    sellerId: req.user.id,
    designId: design.id,
    status: 'active',
  })

  if (listing) {
    listing.price = parsedPrice
    listing.currency = currency || listing.currency
    listing.description = description?.trim() || listing.description
    listing.title = design.title
    listing.previewImageUrl = design.previewImageUrl
    await listing.save()
  } else {
    listing = await Listing.create({
      sellerId: req.user.id,
      designId: design.id,
      title: design.title,
      description: description?.trim() || 'Listed from my saved designs.',
      price: parsedPrice,
      currency: currency || 'USD',
      previewImageUrl: design.previewImageUrl,
    })
  }

  const populated = await populateListing(Listing.findById(listing.id))

  res.status(201).json({
    listing: serializeListing(populated, req.user.id),
  })
})

export const listListings = asyncHandler(async (req, res) => {
  const listings = await populateListing(
    Listing.find({ status: 'active' }).sort({ createdAt: -1 })
  )

  res.status(200).json({
    listings: listings.map((listing) => serializeListing(listing, req.user.id)),
  })
})

export const listMyListings = asyncHandler(async (req, res) => {
  const listings = await populateListing(
    Listing.find({ sellerId: req.user.id, status: 'active' }).sort({ createdAt: -1 })
  )

  res.status(200).json({
    listings: listings.map((listing) => serializeListing(listing, req.user.id)),
  })
})

export const getListing = asyncHandler(async (req, res) => {
  const listing = await findActiveListing(req.params.id)

  res.status(200).json({
    listing: serializeListing(listing, req.user.id),
  })
})

export const deleteListing = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Listing not found')

  const listing = await Listing.findOne({
    _id: req.params.id,
    sellerId: req.user.id,
    status: 'active',
  })

  if (!listing) {
    throw new HttpError(404, 'Listing not found')
  }

  listing.status = 'removed'
  await listing.save()

  res.status(200).json({
    deleted: true,
    id: req.params.id,
  })
})

export const purchaseListing = asyncHandler(async (req, res) => {
  const listing = await findActiveListing(req.params.id)
  const sellerId = listing.sellerId._id.toString()

  if (sellerId === req.user.id) {
    throw new HttpError(400, 'You cannot buy your own listing')
  }

  const sourceDesign = listing.designId
  if (!sourceDesign) {
    throw new HttpError(404, 'Listing design not found')
  }

  const copiedDesign = await Design.create(copyDesignForBuyer(sourceDesign, req.user.id, listing.title))
  const purchase = await Purchase.create({
    buyerId: req.user.id,
    sellerId,
    listingId: listing.id,
    originalDesignId: sourceDesign.id,
    copiedDesignId: copiedDesign.id,
    price: listing.price,
    currency: listing.currency,
    paymentStatus: 'paid',
  })

  listing.status = 'sold'
  listing.soldAt = new Date()
  await listing.save()

  const populatedPurchase = await Purchase.findById(purchase.id)
    .populate('sellerId', 'name email')
    .populate('listingId')
    .populate('copiedDesignId')

  res.status(201).json({
    purchase: serializePurchase(populatedPurchase),
    savedDesign: serializeDesign(copiedDesign),
    listing: serializeListing(listing, req.user.id),
  })
})

export const listPurchases = asyncHandler(async (req, res) => {
  const purchases = await Purchase.find({ buyerId: req.user.id })
    .sort({ createdAt: -1 })
    .populate('sellerId', 'name email')
    .populate('listingId')
    .populate('copiedDesignId')

  res.status(200).json({
    purchases: purchases.map(serializePurchase),
  })
})
