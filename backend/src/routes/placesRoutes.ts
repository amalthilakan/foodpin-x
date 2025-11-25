import express from 'express';
import { searchPlaces } from '../controllers/placesController';

const router = express.Router();

router.route('/search').get(searchPlaces);

export default router;
