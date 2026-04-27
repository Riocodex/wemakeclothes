/**
 * Each garment = its own GLB in `client/public` (Vite serves / at root).
 * - Use `modelPath: "/garments/....glb"` and drop real models into `client/public/garments/`
 * - `tshirt_short` still supports the classic demo path `shirt_baked.glb` if you have it
 * - Omit `meshName` for GLBs with multiple parts or unknown node names: we auto-flatten the scene
 *
 * `decal` optional — logo (and full) placement can differ per shape.
 */

const defaultLogo = { position: [0, 0.04, 0.15], rotation: [0, 0, 0], scale: 0.15 }
const defaultFull = { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 }
const fallbackModelPath = "/shirt_baked.glb"

export const GARMENT_CATALOG = {
  tshirt_short: {
    label: "Short sleeve",
    modelPath: fallbackModelPath,
    meshName: "T_Shirt_male",
    decal: { logo: defaultLogo, full: defaultFull },
  },
  tshirt_long: {
    label: "Long sleeve",
    modelPath: fallbackModelPath,
    meshName: "T_Shirt_male",
    decal: { logo: { position: [0, 0.04, 0.14], rotation: [0, 0, 0], scale: 0.15 }, full: defaultFull },
  },
  shirt: {
    label: "Shirt",
    modelPath: fallbackModelPath,
    meshName: "T_Shirt_male",
    decal: { logo: { position: [0, 0.04, 0.14], rotation: [0, 0, 0], scale: 0.16 }, full: defaultFull },
  },
  vest: {
    label: "Vest",
    modelPath: fallbackModelPath,
    meshName: "T_Shirt_male",
    decal: { logo: { position: [0, 0.05, 0.16], rotation: [0, 0, 0], scale: 0.16 }, full: defaultFull },
  },
  blouse: {
    label: "Blouse",
    modelPath: fallbackModelPath,
    meshName: "T_Shirt_male",
    decal: { logo: { position: [0, 0.06, 0.12], rotation: [0, 0, 0], scale: 0.15 }, full: defaultFull },
  },
  dress: {
    label: "Dress",
    modelPath: fallbackModelPath,
    meshName: "T_Shirt_male",
    decal: { logo: { position: [0, 0.1, 0.12], rotation: [0, 0, 0], scale: 0.18 }, full: defaultFull },
  },
  bikini: {
    label: "Bikini",
    modelPath: fallbackModelPath,
    meshName: "T_Shirt_male",
    decal: { logo: { position: [0, 0.04, 0.15], rotation: [0, 0, 0], scale: 0.12 }, full: defaultFull },
  },
}

const PREVIEW = {
  tshirt_short: "👕",
  tshirt_long: "🧥",
  shirt: "👔",
  vest: "🦺",
  blouse: "👚",
  dress: "👗",
  bikini: "🩱",
}

export const GARMENT_OPTIONS = Object.entries(GARMENT_CATALOG).map(
  ([name, definition]) => ({
    name,
    label: definition.label,
    preview: PREVIEW[name] || "👕",
  })
)
