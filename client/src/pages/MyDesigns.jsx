import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSnapshot } from 'valtio'

import state from '../store'
import { CustomButton } from '../components'
import { listDesigns } from '../services/designService'
import { migrateOrCreateDesign, syncRootFromDesign } from '../config/designSchema'
import { slideAnimation } from '../config/motion'

const MyDesigns = () => {
  const snap = useSnapshot(state)
  const designs = useMemo(() => listDesigns(), [snap.myDesignsOpen])

  const handleOpenDesign = (saved) => {
    state.design = migrateOrCreateDesign(saved.design)
    if (saved.sceneTheme) state.sceneTheme = saved.sceneTheme
    syncRootFromDesign(state)
    state.myDesignsOpen = false
    state.intro = false
  }

  return (
    <AnimatePresence>
      {snap.intro && snap.myDesignsOpen && (
        <motion.section className='home' {...slideAnimation('right')}>
          <div className='w-full flex items-center justify-between'>
            <h2 className='text-2xl font-black text-black'>My Designs</h2>
            <CustomButton
              type='outline'
              title='Back'
              handleClick={() => { state.myDesignsOpen = false }}
              customStyles='w-fit px-4 py-2 text-sm font-bold'
            />
          </div>

          <div className='mt-6 w-[min(92vw,980px)] max-h-[72vh] overflow-auto pr-1'>
            {designs.length === 0 && (
              <div className='glassmorphism rounded-xl p-6 text-sm text-gray-700'>
                No saved designs yet. Open the customizer and click `Save Design` first.
              </div>
            )}

            {designs.length > 0 && (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {designs.map((item) => (
                  <div key={item.id} className='glassmorphism rounded-xl p-3 flex flex-col gap-3'>
                    <div className='rounded-lg overflow-hidden bg-gray-100 h-40'>
                      {item.previewImage ? (
                        <img src={item.previewImage} alt={item.title} className='w-full h-full object-cover' />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center text-xs text-gray-500'>
                          No preview
                        </div>
                      )}
                    </div>
                    <div>
                      <p className='text-sm font-semibold text-gray-900 truncate'>{item.title}</p>
                      <p className='text-[11px] text-gray-600'>
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <CustomButton
                      type='filled'
                      title='Open in editor'
                      handleClick={() => handleOpenDesign(item)}
                      customStyles='w-full py-2 text-xs font-semibold'
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}

export default MyDesigns
