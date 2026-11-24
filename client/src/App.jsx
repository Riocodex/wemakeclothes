import { AnimatePresence, motion } from 'framer-motion'
import { useSnapshot } from 'valtio'

import Customizer from './pages/Customizer'
import Canvas from './canvas'
import Home from './pages/Home'
import MyDesigns from './pages/MyDesigns'
import Marketplace from './pages/Marketplace'
import MarketplaceViewer from './pages/MarketplaceViewer'
import AppNav from './components/AppNav'
import state from './store'

const CanvasStage = () => {
  const snap = useSnapshot(state)
  const showCanvas = snap.viewerOpen || !snap.intro || (
    snap.intro && !snap.myDesignsOpen && !snap.marketplaceOpen
  )

  return (
    <AnimatePresence mode="wait">
      {showCanvas && (
        <motion.div
          key="canvas-stage"
          className="canvas-stage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: 'easeInOut' }}
        >
          <Canvas/>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function App() {
  const snap = useSnapshot(state)
  const useCustomizerShell = (!snap.intro && !snap.viewerOpen) || snap.viewerOpen
  const sceneMode = useCustomizerShell
    ? (snap.sceneTheme === 'light' ? 'app--scene-light' : 'app--scene-dark')
    : 'app--scene-dark'
  const appClass = `app transition-all ease-in ${useCustomizerShell ? 'app-customizer' : ''} ${sceneMode}`

  return (
    <main className={appClass}>

      <CanvasStage/>
      <AppNav/>
      <Home/>
      <MyDesigns/>
      <Marketplace/>
      <MarketplaceViewer/>
      <Customizer/> 
    </main>
  )
}

export default App
