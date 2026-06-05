export const SCENE_THEMES = {
  light: {
    background: '#ffffff',
    environment: 'city',
  },
  dark: {
    background: '#111827',
    environment: 'city',
  },
  neutral: {
    background: '#ffffff',
    environment: 'city',
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
