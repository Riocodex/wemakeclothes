import { motion, AnimatePresence } from 'framer-motion'
import { useSnapshot } from 'valtio'

import state from '../store'
import { shirtButton } from '../components/GarmentLook'
import { BagIcon, GridIcon, ShirtIcon } from '../components/Icons'
import { useAuthSession } from '../components/MarketplaceUI'
import { goMarketplace, goMyDesigns } from '../config/navigation'
import {
    headContainerAnimation,
    headContentAnimation,
    headTextAnimation,
    slideAnimation
} from '../config/motion'

const Home = () => {
    const snap = useSnapshot(state);
    const { signedIn } = useAuthSession()
    const designButton = shirtButton(snap.design?.colors?.body || snap.color)

  return (
   <AnimatePresence>
    {snap.intro && !snap.myDesignsOpen && !snap.marketplaceOpen && !snap.viewerOpen && (
        <motion.section className='home-hero' {...slideAnimation('left')}>
            <div className='home-hero-inner'>
                <motion.div className='home-hero-copy' {...headContainerAnimation}>
                    <motion.div {...headTextAnimation}>
                        <p className='home-kicker'>Wimik</p>
                        <h1 className='home-hero-title mt-4'>
                            Design it.<br />
                            <span>Wear it.</span>
                        </h1>
                    </motion.div>
                    <p className='home-hero-lede mt-5 max-w-md text-base leading-relaxed text-white/65 sm:text-lg'>
                        Shape a t-shirt in 3D. Save it to your studio, then buy or sell the design.
                    </p>
                </motion.div>

                <motion.div className='home-hero-actions' {...headContentAnimation}>
                        <div className='flex flex-col gap-2.5 sm:flex-row sm:flex-wrap'>
                            <button
                                type='button'
                                className='btn btn-brand btn-lg'
                                style={{ background: designButton.background, color: designButton.color }}
                                onClick={()=> { state.myDesignsOpen = false; state.marketplaceOpen = false; state.viewerOpen = false; state.intro = false }}
                            >
                                <ShirtIcon />
                                Start designing
                            </button>
                            <div className={signedIn ? 'grid grid-cols-2 gap-2.5 sm:flex' : 'sm:flex'}>
                                <button
                                    type='button'
                                    className='btn btn-outline-inverse btn-lg w-full sm:w-auto'
                                    onClick={goMarketplace}
                                >
                                    <BagIcon />
                                    {signedIn ? (
                                        <>
                                            <span className='sm:hidden'>Shop</span>
                                            <span className='hidden sm:inline'>Browse shop</span>
                                        </>
                                    ) : 'Browse shop'}
                                </button>
                                {signedIn && (
                                    <button
                                        type='button'
                                        className='btn btn-outline-inverse btn-lg'
                                        onClick={goMyDesigns}
                                    >
                                        <GridIcon />
                                        My Designs
                                    </button>
                                )}
                            </div>
                        </div>
                </motion.div>
            </div>
        </motion.section>
    )}
   </AnimatePresence>
  )
}

export default Home
