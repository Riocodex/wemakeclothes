import { proxy } from "valtio";
import { createDefaultDesign, syncRootFromDesign } from '../config/designSchema'

const initialDesign = createDefaultDesign('tshirt_short')

const state = proxy({
  intro: true,
  myDesignsOpen: false,
  marketplaceOpen: false,
  viewerOpen: false,
  viewerListing: null,
  sessionKey: 0,
  /* Legacy: synced from design (SSOT) via syncRootFromDesign */
  color: initialDesign.colors.body,
  sceneTheme: "dark",
  isLogoTexture: true,
  isFullTexture: false,
  logoDecal: initialDesign.textures.logo,
  fullDecal: initialDesign.textures.full,
  design: initialDesign
});

syncRootFromDesign(state);

/** Reset canvas + UI after login/logout so designs never leak between users */
export const resetSessionToDefault = () => {
  const defaultDesign = createDefaultDesign('tshirt_short')
  state.design = defaultDesign
  state.sceneTheme = 'dark'
  state.intro = true
  state.myDesignsOpen = false
  state.marketplaceOpen = false
  state.viewerOpen = false
  state.viewerListing = null
  state.sessionKey += 1
  syncRootFromDesign(state)
}

export default state;
