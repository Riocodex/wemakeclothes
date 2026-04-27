import { proxy } from "valtio";
import { migrateOrCreateDesign, syncRootFromDesign } from '../config/designSchema'

const initialDesign = migrateOrCreateDesign({
  garmentType: "tshirt_short",
  baseColor: "#EFBD48",
  regions: { front: { color: "#EFBD48" }, back: { color: "#EFBD48" } },
  layers: []
});

const state = proxy({
  intro: true,
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

export default state;
