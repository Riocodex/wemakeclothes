import { motion, AnimatePresence } from 'framer-motion'
import { useSnapshot } from 'valtio'

import state from '../store'
import { BagIcon, GridIcon, ShirtIcon, SparkIcon, TagIcon } from '../components/Icons'
import {
    headContainerAnimation,
    headContentAnimation,
    headTextAnimation,
    slideAnimation
} from '../config/motion'

const STEPS = [
    { icon: ShirtIcon, title: 'Design in 3D', copy: 'Pick a garment, set colors, and drop on your artwork.' },
    { icon: GridIcon, title: 'Save to your studio', copy: 'Every design lives in My Designs, ready to reopen.' },
    { icon: TagIcon, title: 'List and sell', copy: 'Set a price and publish to the marketplace.' },
]

const Home = () => {
    const snap = useSnapshot(state);

  return (
   <AnimatePresence>
    {snap.intro && !snap.myDesignsOpen && !snap.marketplaceOpen && !snap.viewerOpen && (
        <motion.section className='home-hero' {...slideAnimation('left')}>
            <div className='home-hero-inner'>
                <motion.div className='home-hero-copy' {...headContainerAnimation}>
                    <motion.div {...headTextAnimation}>
                        <p className='eyebrow inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-white/80'>
                            <SparkIcon className='h-3.5 w-3.5 text-brand-400' />
                            Design · Wear · Sell
                        </p>
                        <h1 className='home-hero-title mt-5'>
                            Let&apos;s <br />do it<span className='text-brand-400'>.</span>
                        </h1>
                    </motion.div>
                    <p className='home-hero-lede mt-6 max-w-md text-base leading-relaxed text-white/70 sm:text-lg'>
                        Create your unique and exclusive shirt with our brand-new 3D customization tool.{' '}
                        <strong className='font-semibold text-white'>Unleash your imagination</strong>{' '}
                        and define your own style.
                    </p>
                </motion.div>

                <motion.div className='home-hero-actions' {...headContentAnimation}>
                        <div className='flex flex-col gap-2.5 sm:flex-row sm:flex-wrap'>
                            <button
                                type='button'
                                className='btn btn-brand btn-lg'
                                onClick={()=> { state.myDesignsOpen = false; state.marketplaceOpen = false; state.viewerOpen = false; state.intro = false }}
                            >
                                <ShirtIcon />
                                Customize It
                            </button>
                            <div className='grid grid-cols-2 gap-2.5 sm:flex'>
                                <button
                                    type='button'
                                    className='btn btn-outline-inverse btn-lg'
                                    onClick={() => { state.marketplaceOpen = true; state.myDesignsOpen = false }}
                                >
                                    <BagIcon />
                                    Marketplace
                                </button>
                                <button
                                    type='button'
                                    className='btn btn-outline-inverse btn-lg'
                                    onClick={() => { state.myDesignsOpen = true; state.marketplaceOpen = false }}
                                >
                                    <GridIcon />
                                    My Designs
                                </button>
                            </div>
                        </div>
                </motion.div>

                <motion.ul
                    className='home-hero-steps absolute bottom-8 left-0 right-0 mx-auto grid max-w-7xl grid-cols-3 gap-4 px-8'
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.35, duration: 0.5 } }}
                    exit={{ opacity: 0 }}
                >
                    {STEPS.map(({ icon: Icon, title, copy }, index) => (
                        <li key={title} className='flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur'>
                            <span className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-brand-400'>
                                <Icon />
                            </span>
                            <div>
                                <p className='text-sm font-semibold text-white'>
                                    <span className='mr-1.5 text-white/40'>0{index + 1}</span>{title}
                                </p>
                                <p className='mt-1 text-xs leading-relaxed text-white/60'>{copy}</p>
                            </div>
                        </li>
                    ))}
                </motion.ul>
            </div>
        </motion.section>
    )}
   </AnimatePresence>
  )
}

export default Home
