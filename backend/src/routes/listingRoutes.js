import express from 'express'

import {
  createListing,
  deleteListing,
  getListing,
  listListings,
  listMyListings,
  listPurchases,
  purchaseListing,
} from '../controllers/listingController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Browse, create, and purchase all stay behind Bearer auth. Purchase is not a public fallback.
router.use(requireAuth)

router.get('/purchases', listPurchases)
router.get('/mine', listMyListings)
router.route('/').get(listListings).post(createListing)
router.route('/:id').get(getListing).delete(deleteListing)
router.post('/:id/purchase', purchaseListing)

export default router
