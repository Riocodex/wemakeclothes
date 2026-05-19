import mongoose from 'mongoose'

import { Design } from '../models/index.js'
import { HttpError, asyncHandler } from '../utils/httpError.js'

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

const serializeDesign = (design) => ({
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

const findOwnedDesign = async (userId, designId) => {
  if (!mongoose.isValidObjectId(designId)) {
    throw new HttpError(404, 'Design not found')
  }

  const design = await Design.findOne({
    _id: designId,
    ownerId: userId,
  })

  if (!design) {
    throw new HttpError(404, 'Design not found')
  }

  return design
}

export const createDesign = asyncHandler(async (req, res) => {
  const payload = normalizeDesignBody(req.body)

  if (!payload.title) {
    throw new HttpError(400, 'Title is required')
  }

  if (!payload.catalogId) {
    throw new HttpError(400, 'Design catalogId is required')
  }

  const design = await Design.create({
    ...payload,
    ownerId: req.user.id,
  })

  res.status(201).json({
    design: serializeDesign(design),
  })
})

export const listDesigns = asyncHandler(async (req, res) => {
  const designs = await Design.find({ ownerId: req.user.id }).sort({ createdAt: -1 })

  res.status(200).json({
    designs: designs.map(serializeDesign),
  })
})

export const getDesign = asyncHandler(async (req, res) => {
  const design = await findOwnedDesign(req.user.id, req.params.id)

  res.status(200).json({
    design: serializeDesign(design),
  })
})

export const deleteDesign = asyncHandler(async (req, res) => {
  const design = await findOwnedDesign(req.user.id, req.params.id)
  await design.deleteOne()

  res.status(200).json({
    deleted: true,
    id: req.params.id,
  })
})
