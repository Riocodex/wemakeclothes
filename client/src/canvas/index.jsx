
import { Canvas } from '@react-three/fiber'
import { Environment, Center } from '@react-three/drei'
import { useSnapshot } from 'valtio'

import Shirt from './Shirt'
import CameraRig from './CameraRig'
import state from '../store'

const CanvasModel = () => {
  const snap = useSnapshot(state)

  const themeMap = {
    light: { background: '#dbe4ee', environment: 'apartment' },
    dark: { background: '#111827', environment: 'night' },
    // Backward compatible with older saved state values.
    neutral: { background: '#dbe4ee', environment: 'apartment' },
  }

  const activeTheme = themeMap[snap.sceneTheme] || themeMap.light

  return (
    <Canvas
      shadows
      camera={{ position:[0,0,0], fov:30}}//making the shirt bigger

      //working on te buffers
      gl={{preserveDrawingBuffer: true}}
      className='w-full-max-full h-full transition-all ease-in'
    >
      <color attach='background' args={[activeTheme.background]} />
      <ambientLight intensity={0.5}/>
      <Environment preset={activeTheme.environment}/>

      <CameraRig>
        <Center>
            <Shirt/>
          </Center>
      </CameraRig>
    </Canvas>
  )
}

export default CanvasModel