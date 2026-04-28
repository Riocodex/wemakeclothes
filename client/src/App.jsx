import Customizer from './pages/Customizer'
import Canvas from './canvas'
import Home from './pages/Home'
import MyDesigns from './pages/MyDesigns'

function App() {
  return (
    <main className='app transition-all ease-in'>

      <Home/>
      <MyDesigns/>
      <Canvas/>
      <Customizer/> 
    </main>
  )
}

export default App
