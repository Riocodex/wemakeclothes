import { GARMENT_CATALOG } from './garments'

const DEFAULT_TEXTURE_LOGO = './me.jpg'
const DEFAULT_TEXTURE_FULL = './me.jpg'
const DEFAULT_BODY = '#EFBD48'

/**
 * Per-catalog metadata for marketplace / UI (SSOT: catalogId in design).
 * type + sleeve = human meaning; catalogId = which 3D asset + GARMENT_CATALOG entry
 */
export const CATALOG_META = {
  tshirt_short: { type: 'tshirt', sleeve: 'short', parts: ['body', 'sleeves'] },
  tshirt_long: { type: 'tshirt', sleeve: 'long', parts: ['body', 'sleeves'] },
  shirt: { type: 'shirt', sleeve: 'varies', parts: ['body', 'sleeves', 'collar'] },
  vest: { type: 'vest', sleeve: 'none', parts: ['body'] },
  blouse: { type: 'blouse', sleeve: 'varies', parts: ['body', 'sleeves'] },
  dress: { type: 'dress', sleeve: 'none', parts: ['top', 'skirt'] },
  bikini: { type: 'bikini', sleeve: 'none', parts: ['top', 'bottom'] }
}

/**
 * Which editor tools to show (dynamic UI). Keyed by semantic `type` from CATALOG_META.
 */
export const EDITOR_OPTIONS_BY_TYPE = {
  /* sleeve: use dedicated Short/Long toggles in Customizer (not a tab) */
  tshirt: ['color', 'texture'],
  shirt: ['color', 'texture'],
  vest: ['color', 'texture'],
  blouse: ['color', 'texture'],
  dress: ['length', 'color', 'texture'],
  bikini: ['color', 'texture']
}

/**
 * @param {string} catalogId
 */
export function getEditorOptions (catalogId) {
  const meta = CATALOG_META[catalogId] || CATALOG_META.tshirt_short
  return EDITOR_OPTIONS_BY_TYPE[meta.type] || ['color', 'texture']
}

/**
 * @param {string} catalogId
 */
export function createDefaultDesign (catalogId) {
  const id = GARMENT_CATALOG[catalogId] ? catalogId : 'tshirt_short'
  const meta = CATALOG_META[id] || { type: 'tshirt', sleeve: 'short', parts: [] }
  return {
    version: 1,
    catalogId: id,
    type: meta.type,
    sleeve: meta.sleeve,
    parts: [...(meta.parts || [])],
    colors: {
      body: DEFAULT_BODY
    },
    textures: {
      logo: DEFAULT_TEXTURE_LOGO,
      full: DEFAULT_TEXTURE_FULL
    },
    isLogoTexture: true,
    isFullTexture: false,
    layers: []
  }
}

/**
 * @param {object} [legacy]
 * @returns {object} current design object
 */
export function migrateOrCreateDesign (legacy) {
  if (!legacy) return createDefaultDesign('tshirt_short')
  if (legacy.catalogId && GARMENT_CATALOG[legacy.catalogId]) {
    const base = createDefaultDesign(legacy.catalogId)
    return {
      ...base,
      ...legacy,
      catalogId: legacy.catalogId,
      colors: { ...base.colors, ...legacy.colors },
      textures: { ...base.textures, ...legacy.textures },
      layers: Array.isArray(legacy.layers) ? legacy.layers : base.layers
    }
  }
  const fromOldType = legacy.garmentType && GARMENT_CATALOG[legacy.garmentType]
  const id = fromOldType ? legacy.garmentType : 'tshirt_short'
  const d = createDefaultDesign(id)
  d.colors.body = legacy.baseColor || legacy.colors?.body || d.colors.body
  d.layers = Array.isArray(legacy.layers) ? legacy.layers : []
  if (legacy.textures) {
    d.textures = { ...d.textures, ...legacy.textures }
  }
  return d
}

/**
 * Replace design when switching garment — do not hand-mutate dozens of fields.
 * @param {import('valtio').object} state
 * @param {string} newCatalogId
 * @param {{ keepColors?: boolean, keepTextures?: boolean, keepLayers?: boolean }} [opts]
 */
export function applyGarmentChange (state, newCatalogId, opts = {}) {
  const {
    keepColors = true,
    keepTextures = true,
    keepLayers = true
  } = opts
  const prev = state.design
  const next = createDefaultDesign(newCatalogId)

  if (keepColors && prev?.colors?.body) {
    next.colors.body = prev.colors.body
  }
  if (keepTextures && prev?.textures) {
    next.textures.logo = prev.textures.logo
    next.textures.full = prev.textures.full
  }
  if (keepLayers && Array.isArray(prev?.layers)) {
    next.layers = [...prev.layers]
  }

  state.design = next
  syncRootFromDesign(state)
}


/**
 * Keep legacy one-liners in sync for components not yet refactored (tabs, useTexture).
 * @param {import('valtio').object} state
 */
export function syncRootFromDesign (state) {
  const d = state.design
  if (!d) return
  state.color = d.colors?.body
  if (d.textures?.logo != null) state.logoDecal = d.textures.logo
  if (d.textures?.full != null) state.fullDecal = d.textures.full
  if (d.isLogoTexture != null) state.isLogoTexture = d.isLogoTexture
  if (d.isFullTexture != null) state.isFullTexture = d.isFullTexture
}

/**
 * @param {import('valtio').object} state
 * @param {string} key body | mesh part name
 * @param {string} hex
 */
export function setDesignColor (state, key, hex) {
  if (!state.design) return
  state.design.colors = { ...state.design.colors, [key]: hex }
  state.color = state.design.colors.body
}
