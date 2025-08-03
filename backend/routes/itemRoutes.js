import express from 'express';
import { getItems, getItem, createItem, updateItem, deleteItem } from '../controllers/itemController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getItems);
router.get('/:id', authenticateToken, getItem);
router.post('/', authenticateToken, authorize('admin'), createItem);
router.put('/:id', authenticateToken, authorize('admin'), updateItem);
router.delete('/:id', authenticateToken, authorize('admin'), deleteItem);

export default router;