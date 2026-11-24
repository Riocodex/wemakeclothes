export const SCENE_THEMES = {
  light: {
    background: '#e8eaef',
    environment: 'city',
    ambient: 0.72,
    envIntensity: 0.55,
    roughness: 0.82,
  },
  dark: {
    background: '#151922',
    environment: 'city',
    ambient: 0.45,
    envIntensity: 0.7,
    roughness: 0.78,
  },
  neutral: {
    background: '#e8eaef',
    environment: 'city',
    ambient: 0.72,
    envIntensity: 0.55,
    roughness: 0.82,
  },
}

export const resolveSceneTheme = (sceneTheme) => {
  return SCENE_THEMES[sceneTheme] || SCENE_THEMES.dark
}

export const isLightScene = (sceneTheme) =>
  sceneTheme === 'light' || sceneTheme === 'neutral'

export const getGarmentMaterialProps = (sceneTheme) => {
  const theme = resolveSceneTheme(sceneTheme)
  return {
    roughness: theme.roughness,
    metalness: 0,
    envMapIntensity: theme.envIntensity,
  }
}
