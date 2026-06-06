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
import { optionalAuth, requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/purchases', requireAuth, listPurchases)
router.get('/mine', requireAuth, listMyListings)
router.get('/', optionalAuth, listListings)
router.post('/', requireAuth, createListing)
router.get('/:id', optionalAuth, getListing)
router.delete('/:id', requireAuth, deleteListing)
router.post('/:id/purchase', requireAuth, purchaseListing)

export default router
