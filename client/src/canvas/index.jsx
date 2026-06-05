
import { Canvas } from '@react-three/fiber'
import { Environment, Center } from '@react-three/drei'
import { useSnapshot } from 'valtio'

import Shirt from './Shirt'
import CameraRig from './CameraRig'
import Backdrop from './Backdrop'
import state from '../store'

const SCENE_BACKGROUNDS = {
  light: '#ffffff',
  dark: '#111827',
}

const CanvasModel = () => {
  const snap = useSnapshot(state)
  const isCustomizer = !snap.intro && !snap.viewerOpen
  const isMarketplaceView = snap.viewerOpen
  const allowLightBackground =
    snap.sceneTheme === 'light' && (isCustomizer || isMarketplaceView)
  const background = allowLightBackground
    ? SCENE_BACKGROUNDS.light
    : SCENE_BACKGROUNDS.dark

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 0], fov: 30 }}
      gl={{ preserveDrawingBuffer: true }}
      className="w-full-max-full h-full transition-all ease-in"
    >
      <color attach="background" args={[background]} />
      <ambientLight intensity={0.5} />
      <Environment preset="city" />

      <CameraRig>
        <Backdrop />
        <Center>
          <Shirt />
        </Center>
      </CameraRig>
    </Canvas>
  )
}

export default CanvasModel
