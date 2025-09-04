import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { generateTransactionCode, generateFallbackCode } from '../utils/transactionCodeGenerator.js';

const router = express.Router();

// Stock In Routes
router.get('/stock-in', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT si.*, i.name as item_name, i.code as item_code, u.name as supplier_name
      FROM stock_in si
      JOIN items i ON si.item_id = i.id
      LEFT JOIN users u ON si.supplier_id = u.id
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM stock_in si JOIN items i ON si.item_id = i.id WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (si.transaction_code LIKE ? OR i.name LIKE ?)';
      countQuery += ' AND (si.transaction_code LIKE ? OR i.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY si.created_at DESC LIMIT ? OFFSET ?';

    const [stockIn] = await pool.execute(query, [...params, parseInt(limit), offset]);
    const [countResult] = await pool.execute(countQuery, params);

    res.json({
      stockIn,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(countResult[0].total / limit),
        totalItems: countResult[0].total
      }
    });
  } catch (error) {
    console.error('Get stock in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/stock-in', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    let { transaction_code, item_id, supplier_id, qty, price, total_price, date, notes } = req.body;

    // Check for required fields (transaction_code is now optional)
    if (!item_id || !qty || !date) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Generate transaction code if not provided
    if (!transaction_code) {
      try {
        transaction_code = await generateTransactionCode('IN', date);
      } catch (error) {
        console.error('Error generating transaction code:', error);
        // Use fallback code if generation fails
        transaction_code = generateFallbackCode('IN');
      }
    }

    const [result] = await pool.execute(`
      INSERT INTO stock_in (transaction_code, item_id, supplier_id, qty, price, total_price, date, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [transaction_code, item_id, supplier_id || null, qty, price, total_price, date, notes, req.user.id]);

    res.status(201).json({
      message: 'Stock in record created successfully',
      id: result.insertId,
      transaction_code: transaction_code
    });
  } catch (error) {
    console.error('Create stock in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/stock-in/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { transaction_code, item_id, supplier_id, qty, price, total_price, date, notes } = req.body;

    await pool.execute(`
      UPDATE stock_in SET 
        transaction_code = ?, item_id = ?, supplier_id = ?, qty = ?, price = ?, 
        total_price = ?, date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [transaction_code, item_id, supplier_id || null, qty, price, total_price, date, notes, id]);

    res.json({ message: 'Stock in record updated successfully' });
  } catch (error) {
    console.error('Update stock in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/stock-in/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM stock_in WHERE id = ?', [id]);
    res.json({ message: 'Stock in record deleted successfully' });
  } catch (error) {
    console.error('Delete stock in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stock Out Routes
router.get('/stock-out', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT so.*, i.name as item_name, i.code as item_code
      FROM stock_out so
      JOIN items i ON so.item_id = i.id
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM stock_out so JOIN items i ON so.item_id = i.id WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (so.transaction_code LIKE ? OR i.name LIKE ?)';
      countQuery += ' AND (so.transaction_code LIKE ? OR i.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY so.created_at DESC LIMIT ? OFFSET ?';

    const [stockOut] = await pool.execute(query, [...params, parseInt(limit), offset]);
    const [countResult] = await pool.execute(countQuery, params);

    res.json({
      stockOut,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(countResult[0].total / limit),
        totalItems: countResult[0].total
      }
    });
  } catch (error) {
    console.error('Get stock out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/stock-out', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    let { transaction_code, item_id, qty, purpose, recipient, date, notes } = req.body;

    // Check for required fields (transaction_code is now optional)
    if (!item_id || !qty || !date) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Set default purpose if not provided
    if (!purpose) {
      purpose = 'General Use';
    }

    // Generate transaction code if not provided
    if (!transaction_code) {
      try {
        transaction_code = await generateTransactionCode('OUT', date);
      } catch (error) {
        console.error('Error generating transaction code:', error);
        // Use fallback code if generation fails
        transaction_code = generateFallbackCode('OUT');
      }
    }

    // Check if enough stock available
    const [items] = await pool.execute('SELECT stock_qty FROM items WHERE id = ?', [item_id]);
    if (items.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (items[0].stock_qty < qty) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const [result] = await pool.execute(`
      INSERT INTO stock_out (transaction_code, item_id, qty, purpose, recipient, date, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [transaction_code, item_id, qty, purpose, recipient, date, notes, req.user.id]);

    res.status(201).json({
      message: 'Stock out record created successfully',
      id: result.insertId,
      transaction_code: transaction_code
    });
  } catch (error) {
    console.error('Create stock out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/stock-out/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { transaction_code, item_id, qty, purpose, recipient, date, notes } = req.body;

    await pool.execute(`
      UPDATE stock_out SET 
        transaction_code = ?, item_id = ?, qty = ?, purpose = ?, recipient = ?, 
        date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [transaction_code, item_id, qty, purpose, recipient, date, notes, id]);

    res.json({ message: 'Stock out record updated successfully' });
  } catch (error) {
    console.error('Update stock out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/stock-out/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM stock_out WHERE id = ?', [id]);
    res.json({ message: 'Stock out record deleted successfully' });
  } catch (error) {
    console.error('Delete stock out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;