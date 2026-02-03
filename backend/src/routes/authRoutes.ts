import express from 'express';
import { changePassword, firebaseAuthHandler, googleAuth, login, signup } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/firebase', firebaseAuthHandler);
router.put('/change-password', protect, changePassword);

export default router;
