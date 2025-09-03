import { pool } from '../config/database.js';

export const getItems = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT i.*, c.name as category_name 
      FROM items i 
      LEFT JOIN categories c ON i.category_id = c.id 
      WHERE i.is_active = TRUE
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM items i WHERE i.is_active = TRUE';
    const params = [];

    if (search) {
      query += ' AND (i.name LIKE ? OR i.code LIKE ?)';
      countQuery += ' AND (i.name LIKE ? OR i.code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ' AND i.category_id = ?';
      countQuery += ' AND i.category_id = ?';
      params.push(category);
    }

    query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';

    const [items] = await pool.execute(query, [...params, parseInt(limit), offset]);
    const [countResult] = await pool.execute(countQuery, params);

    res.json({
      items,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(countResult[0].total / limit),
        totalItems: countResult[0].total
      }
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getItem = async (req, res) => {
  try {
    const { id } = req.params;

    const [items] = await pool.execute(`
      SELECT i.*, c.name as category_name 
      FROM items i 
      LEFT JOIN categories c ON i.category_id = c.id 
      WHERE i.id = ? AND i.is_active = TRUE
    `, [id]);

    if (items.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ item: items[0] });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createItem = async (req, res) => {
  try {
    const {
      code, name, color, size, category_id,
      stock_qty = 0, min_stock = 10, max_stock = 1000,
      unit = 'pcs', price = 0, description
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' });
    }

    // Check if code already exists
    const [existingItems] = await pool.execute(
      'SELECT id FROM items WHERE code = ?',
      [code]
    );

    if (existingItems.length > 0) {
      return res.status(409).json({ error: 'Item code already exists' });
    }

    const [result] = await pool.execute(`
      INSERT INTO items (code, name, color, size, category_id, stock_qty, min_stock, max_stock, unit, price, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [code, name, color, size, category_id, stock_qty, min_stock, max_stock, unit, price, description]);

    res.status(201).json({
      message: 'Item created successfully',
      itemId: result.insertId
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code, name, color, size, category_id,
      min_stock, max_stock, unit, price, description
    } = req.body;

    // Check if item exists
    const [existingItems] = await pool.execute(
      'SELECT id FROM items WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (existingItems.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if code already exists for other items
    if (code) {
      const [duplicateItems] = await pool.execute(
        'SELECT id FROM items WHERE code = ? AND id != ?',
        [code, id]
      );

      if (duplicateItems.length > 0) {
        return res.status(409).json({ error: 'Item code already exists' });
      }
    }

    await pool.execute(`
      UPDATE items SET 
        code = COALESCE(?, code),
        name = COALESCE(?, name),
        color = COALESCE(?, color),
        size = COALESCE(?, size),
        category_id = COALESCE(?, category_id),
        min_stock = COALESCE(?, min_stock),
        max_stock = COALESCE(?, max_stock),
        unit = COALESCE(?, unit),
        price = COALESCE(?, price),
        description = COALESCE(?, description),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [code, name, color, size, category_id, min_stock, max_stock, unit, price, description, id]);

    res.json({ message: 'Item updated successfully' });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if item exists
    const [existingItems] = await pool.execute(
      'SELECT id FROM items WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (existingItems.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Soft delete
    await pool.execute(
      'UPDATE items SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};