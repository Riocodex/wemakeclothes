import { Canvas } from '@react-three/fiber'
import { Environment, Center } from '@react-three/drei'
import { useSnapshot } from 'valtio'

import Shirt from './Shirt'
import CameraRig from './CameraRig'
import Backdrop from './Backdrop'
import state from '../store'
import { resolveSceneTheme } from '../config/sceneThemes'

const CanvasModel = () => {
  const snap = useSnapshot(state)
  const isCustomizer = !snap.intro && !snap.viewerOpen
  const isMarketplaceView = snap.viewerOpen
  const themeName =
    (isCustomizer || isMarketplaceView) && snap.sceneTheme === 'light'
      ? 'light'
      : 'dark'
  const theme = resolveSceneTheme(themeName)

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 0], fov: 30 }}
      gl={{ preserveDrawingBuffer: true }}
      className="w-full-max-full h-full transition-all ease-in"
    >
      <color attach="background" args={[theme.background]} />
      <ambientLight intensity={theme.ambient} />
      <Environment preset={theme.environment} />

      <CameraRig>
        <Backdrop />
        <Center cacheKey={snap.design?.catalogId || 'tshirt_short'}>
          <Shirt />
        </Center>
      </CameraRig>
    </Canvas>
  )
}

export default CanvasModel
