import express from 'express'
import { getFavoritesByTokenCtrl } from '../controllers/userController.js'

const router = express.Router()

// Public: no auth middleware here
router.get('/:token', getFavoritesByTokenCtrl)

export default router
