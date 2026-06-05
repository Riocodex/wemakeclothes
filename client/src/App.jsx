import Customizer from './pages/Customizer'
import Canvas from './canvas'
import Home from './pages/Home'
import MyDesigns from './pages/MyDesigns'
import Marketplace from './pages/Marketplace'
import MarketplaceViewer from './pages/MarketplaceViewer'
import AuthPanel from './components/AuthPanel'
import AppNav from './components/AppNav'

function App() {
  return (
    <main className='app transition-all ease-in'>

      <AuthPanel/>
      <AppNav/>
      <Home/>
      <MyDesigns/>
      <Marketplace/>
      <MarketplaceViewer/>
      <Canvas/>
      <Customizer/> 
    </main>
  )
}

export default App
