import express from 'express'

import {
  createDesign,
  deleteDesign,
  getDesign,
  listDesigns,
} from '../controllers/designController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.use(requireAuth)

router.route('/').get(listDesigns).post(createDesign)
router.route('/:id').get(getDesign).delete(deleteDesign)

export default router
