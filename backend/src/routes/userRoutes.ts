import express from 'express';
import { deleteAccount, getProfile, updateProfile } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.put('/profile', protect, updateProfile);
router.get('/profile', protect, getProfile);
router.delete('/profile', protect, deleteAccount);

export default router;
