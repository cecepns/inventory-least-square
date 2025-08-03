import express from 'express';
import { getDashboardStats, getItemPrediction } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticateToken, getDashboardStats);
router.get('/prediction/:itemId', authenticateToken, getItemPrediction);

export default router;