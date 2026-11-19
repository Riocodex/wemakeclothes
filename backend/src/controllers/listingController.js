import { mapDesign, mapListing, mapPurchase } from '../db/map.js'
import { isUuid } from '../utils/ids.js'
import { HttpError, asyncHandler } from '../utils/httpError.js'
import { serializeDesign, serializeListing, serializePurchase } from '../utils/serializers.js'
import { throwIfSupabaseError } from '../utils/supabaseErrors.js'

const LISTING_SELECT = `
  id, seller_id, design_id, title, description, price, currency, status,
  preview_image_url, sold_at, created_at, updated_at,
  seller:profiles!seller_id (id, name, email, avatar_url, role, created_at, updated_at),
  design:designs!design_id (
    id, owner_id, title, description, catalog_id, type, sleeve, colors, textures, layers,
    is_logo_texture, is_full_texture, scene_theme, preview_image_url, source_design_id,
    created_at, updated_at
  )
`

const PURCHASE_SELECT = `
  id, buyer_id, seller_id, listing_id, original_design_id, copied_design_id,
  price, currency, payment_status, created_at, updated_at,
  seller:profiles!seller_id (id, name, email, avatar_url, role, created_at, updated_at),
  listing:listings!listing_id (
    id, seller_id, design_id, title, description, price, currency, status,
    preview_image_url, sold_at, created_at, updated_at
  ),
  copied_design:designs!copied_design_id (
    id, owner_id, title, description, catalog_id, type, sleeve, colors, textures, layers,
    is_logo_texture, is_full_texture, scene_theme, preview_image_url, source_design_id,
    created_at, updated_at
  )
`

const DESIGN_COLUMNS = `
  id, owner_id, title, description, catalog_id, type, sleeve, colors, textures, layers,
  is_logo_texture, is_full_texture, scene_theme, preview_image_url, source_design_id,
  created_at, updated_at
`

const hydrateListing = (row) => mapListing(row)

const assertListingId = (id, message = 'Listing not found') => {
  if (!isUuid(id)) {
    throw new HttpError(404, message)
  }
}

const findActiveListing = async (supabase, id) => {
  assertListingId(id)

  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('id', id)
    .eq('status', 'active')
    .maybeSingle()

  throwIfSupabaseError(error, 'Listing not found')

  if (!data) {
    throw new HttpError(404, 'Listing not found')
  }

  return hydrateListing(data)
}

export const createListing = asyncHandler(async (req, res) => {
  const { designId, price, description, currency } = req.body

  if (!isUuid(designId)) {
    throw new HttpError(404, 'Design not found')
  }

  const parsedPrice = Number(price)
  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    throw new HttpError(400, 'A valid price is required')
  }

  const { data: designRow, error: designError } = await req.supabase
    .from('designs')
    .select(DESIGN_COLUMNS)
    .eq('id', designId)
    .eq('owner_id', req.user.id)
    .maybeSingle()

  throwIfSupabaseError(designError, 'Design not found')

  if (!designRow) {
    throw new HttpError(404, 'Design not found')
  }

  const design = mapDesign(designRow)

  const { data: existingRow, error: existingError } = await req.supabase
    .from('listings')
    .select('id, currency, description')
    .eq('seller_id', req.user.id)
    .eq('design_id', design.id)
    .eq('status', 'active')
    .maybeSingle()

  throwIfSupabaseError(existingError, 'Unable to load listing')

  let listingId

  if (existingRow) {
    const { data: updated, error: updateError } = await req.supabase
      .from('listings')
      .update({
        price: parsedPrice,
        currency: currency || existingRow.currency,
        description: description?.trim() || existingRow.description,
        title: design.title,
        preview_image_url: design.previewImageUrl,
      })
      .eq('id', existingRow.id)
      .eq('seller_id', req.user.id)
      .select('id')
      .single()

    throwIfSupabaseError(updateError, 'Unable to update listing')
    listingId = updated.id
  } else {
    const { data: created, error: createError } = await req.supabase
      .from('listings')
      .insert({
        seller_id: req.user.id,
        design_id: design.id,
        title: design.title,
        description: description?.trim() || 'Listed from my saved designs.',
        price: parsedPrice,
        currency: currency || 'USD',
        preview_image_url: design.previewImageUrl,
        status: 'active',
      })
      .select('id')
      .single()

    throwIfSupabaseError(createError, 'Unable to create listing')
    listingId = created.id
  }

  const { data: populated, error: populateError } = await req.supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('id', listingId)
    .single()

  throwIfSupabaseError(populateError, 'Unable to load listing')

  res.status(201).json({
    listing: serializeListing(hydrateListing(populated), req.user.id),
  })
})

export const listListings = asyncHandler(async (req, res) => {
  const { data, error } = await req.supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  throwIfSupabaseError(error, 'Unable to list listings')

  res.status(200).json({
    listings: (data || []).map((row) => serializeListing(hydrateListing(row), req.user.id)),
  })
})

export const listMyListings = asyncHandler(async (req, res) => {
  const { data, error } = await req.supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('seller_id', req.user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  throwIfSupabaseError(error, 'Unable to list listings')

  res.status(200).json({
    listings: (data || []).map((row) => serializeListing(hydrateListing(row), req.user.id)),
  })
})

export const getListing = asyncHandler(async (req, res) => {
  const listing = await findActiveListing(req.supabase, req.params.id)

  res.status(200).json({
    listing: serializeListing(listing, req.user.id),
  })
})

export const deleteListing = asyncHandler(async (req, res) => {
  assertListingId(req.params.id)

  const { data, error } = await req.supabase
    .from('listings')
    .update({ status: 'removed' })
    .eq('id', req.params.id)
    .eq('seller_id', req.user.id)
    .eq('status', 'active')
    .select('id')
    .maybeSingle()

  throwIfSupabaseError(error, 'Listing not found')

  if (!data) {
    throw new HttpError(404, 'Listing not found')
  }

  res.status(200).json({
    deleted: true,
    id: req.params.id,
  })
})

export const purchaseListing = asyncHandler(async (req, res) => {
  assertListingId(req.params.id)

  const { data, error } = await req.supabase.rpc('purchase_listing', {
    p_listing_id: req.params.id,
  })

  throwIfSupabaseError(error, 'Unable to purchase listing')

  const purchaseId = data?.purchase?.id
  const copiedDesignId = data?.copied_design?.id || data?.purchase?.copied_design_id

  const [{ data: purchaseRow, error: purchaseError }, { data: listingRow, error: listingError }] = await Promise.all([
    req.supabase.from('purchases').select(PURCHASE_SELECT).eq('id', purchaseId).single(),
    req.supabase.from('listings').select(LISTING_SELECT).eq('id', req.params.id).single(),
  ])

  throwIfSupabaseError(purchaseError, 'Unable to load purchase')
  throwIfSupabaseError(listingError, 'Unable to load listing')

  const copiedDesign = mapDesign(data?.copied_design)
    || mapDesign(purchaseRow?.copied_design)
    || (copiedDesignId ? mapDesign({ id: copiedDesignId }) : null)

  res.status(201).json({
    purchase: serializePurchase(mapPurchase(purchaseRow)),
    savedDesign: serializeDesign(copiedDesign),
    listing: serializeListing(hydrateListing(listingRow), req.user.id),
  })
})

export const listPurchases = asyncHandler(async (req, res) => {
  const { data, error } = await req.supabase
    .from('purchases')
    .select(PURCHASE_SELECT)
    .eq('buyer_id', req.user.id)
    .order('created_at', { ascending: false })

  throwIfSupabaseError(error, 'Unable to list purchases')

  res.status(200).json({
    purchases: (data || []).map((row) => serializePurchase(mapPurchase(row))),
  })
})
