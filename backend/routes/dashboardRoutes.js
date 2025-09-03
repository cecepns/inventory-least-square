import express from 'express';
import { getDashboardStats, getItemPrediction, getWeeklyTrend } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticateToken, getDashboardStats);
router.get('/weekly-trend', authenticateToken, getWeeklyTrend);
router.get('/prediction/:itemId', authenticateToken, getItemPrediction);

export default router;