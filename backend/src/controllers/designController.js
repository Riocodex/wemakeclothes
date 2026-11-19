import { mapDesign } from '../db/map.js'
import { isUuid } from '../utils/ids.js'
import { HttpError, asyncHandler } from '../utils/httpError.js'
import { serializeDesign } from '../utils/serializers.js'
import { throwIfSupabaseError } from '../utils/supabaseErrors.js'

const DESIGN_COLUMNS = `
  id, owner_id, title, description, catalog_id, type, sleeve, colors, textures, layers,
  is_logo_texture, is_full_texture, scene_theme, preview_image_url, source_design_id,
  created_at, updated_at
`

const normalizeDesignBody = (body) => {
  const design = body.design || body
  const catalogId = design.catalogId || body.catalogId

  return {
    title: body.title?.trim(),
    description: body.description?.trim() || '',
    catalogId,
    type: design.type,
    sleeve: design.sleeve,
    colors: design.colors,
    textures: design.textures,
    layers: design.layers,
    isLogoTexture: design.isLogoTexture,
    isFullTexture: design.isFullTexture,
    sceneTheme: body.sceneTheme || design.sceneTheme,
    previewImageUrl: body.previewImageUrl || body.previewImage || design.previewImageUrl || '',
    sourceDesignId: body.sourceDesignId || null,
  }
}

const toDesignInsert = (payload, ownerId) => ({
  owner_id: ownerId,
  title: payload.title,
  description: payload.description || '',
  catalog_id: payload.catalogId,
  type: payload.type || 'tshirt',
  sleeve: payload.sleeve || 'short',
  colors: payload.colors || { body: '#EFBD48' },
  textures: payload.textures || { logo: './me.jpg', full: './me.jpg' },
  layers: payload.layers || [],
  is_logo_texture: payload.isLogoTexture ?? true,
  is_full_texture: payload.isFullTexture ?? false,
  scene_theme: payload.sceneTheme || 'dark',
  preview_image_url: payload.previewImageUrl || '',
  source_design_id: isUuid(payload.sourceDesignId) ? payload.sourceDesignId : null,
})

const findOwnedDesign = async (supabase, userId, designId) => {
  if (!isUuid(designId)) {
    throw new HttpError(404, 'Design not found')
  }

  const { data, error } = await supabase
    .from('designs')
    .select(DESIGN_COLUMNS)
    .eq('id', designId)
    .eq('owner_id', userId)
    .maybeSingle()

  throwIfSupabaseError(error, 'Design not found')

  if (!data) {
    throw new HttpError(404, 'Design not found')
  }

  return mapDesign(data)
}

export const createDesign = asyncHandler(async (req, res) => {
  const payload = normalizeDesignBody(req.body)

  if (!payload.title) {
    throw new HttpError(400, 'Title is required')
  }

  if (!payload.catalogId) {
    throw new HttpError(400, 'Design catalogId is required')
  }

  const { data, error } = await req.supabase
    .from('designs')
    .insert(toDesignInsert(payload, req.user.id))
    .select(DESIGN_COLUMNS)
    .single()

  throwIfSupabaseError(error, 'Unable to save design')

  res.status(201).json({
    design: serializeDesign(mapDesign(data)),
  })
})

export const listDesigns = asyncHandler(async (req, res) => {
  const { data, error } = await req.supabase
    .from('designs')
    .select(DESIGN_COLUMNS)
    .eq('owner_id', req.user.id)
    .order('created_at', { ascending: false })

  throwIfSupabaseError(error, 'Unable to list designs')

  res.status(200).json({
    designs: (data || []).map((row) => serializeDesign(mapDesign(row))),
  })
})

export const getDesign = asyncHandler(async (req, res) => {
  const design = await findOwnedDesign(req.supabase, req.user.id, req.params.id)

  res.status(200).json({
    design: serializeDesign(design),
  })
})

export const deleteDesign = asyncHandler(async (req, res) => {
  const design = await findOwnedDesign(req.supabase, req.user.id, req.params.id)

  const { error: listingError } = await req.supabase
    .from('listings')
    .update({ status: 'removed' })
    .eq('design_id', design.id)
    .eq('seller_id', req.user.id)
    .eq('status', 'active')

  throwIfSupabaseError(listingError, 'Unable to update listings')

  const { error } = await req.supabase
    .from('designs')
    .delete()
    .eq('id', design.id)
    .eq('owner_id', req.user.id)

  throwIfSupabaseError(error, 'Unable to delete design')

  res.status(200).json({
    deleted: true,
    id: req.params.id,
  })
})
