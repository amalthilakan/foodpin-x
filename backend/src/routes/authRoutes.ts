import express from 'express';
import { changePassword, login, signup } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.put('/change-password', protect, changePassword);

export default router;
