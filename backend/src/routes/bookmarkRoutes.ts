import express from 'express';
import { addBookmark, getBookmarks, removeBookmark, updateBookmark } from '../controllers/bookmarkController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').post(protect, addBookmark).get(protect, getBookmarks);
router.route('/:id').delete(protect, removeBookmark).put(protect, updateBookmark);

export default router;
