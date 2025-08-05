import express from 'express';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

export class LeastSquarePredictor {
  constructor(data) {
    this.data = data || [];
  }

  // Menghitung prediksi menggunakan Linear Regression (Least Square)
  predict(periods = 30) {
    if (this.data.length < 2) {
      return {
        predictions: [],
        trend: 'insufficient_data',
        slope: 0,
        intercept: 0,
        correlation: 0
      };
    }

    const n = this.data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

    // Menghitung nilai-nilai yang diperlukan untuk least square
    this.data.forEach((point, index) => {
      const x = index + 1; // Time period
      const y = point.value;
      
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
      sumY2 += y * y;
    });

    // Menghitung slope (m) dan intercept (b) dari persamaan y = mx + b
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Menghitung korelasi (r)
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const correlation = denominator !== 0 ? numerator / denominator : 0;

    // Menentukan trend
    let trend = 'stable';
    if (slope > 0.1) trend = 'increasing';
    else if (slope < -0.1) trend = 'decreasing';

    // Membuat prediksi untuk periode ke depan
    const predictions = [];
    for (let i = 1; i <= periods; i++) {
      const nextPeriod = n + i;
      const predictedValue = Math.max(0, Math.round(slope * nextPeriod + intercept));
      
      predictions.push({
        period: nextPeriod,
        date: this.getDateForPeriod(nextPeriod),
        value: predictedValue,
        type: 'prediction'
      });
    }

    return {
      predictions,
      trend,
      slope: parseFloat(slope.toFixed(4)),
      intercept: parseFloat(intercept.toFixed(4)),
      correlation: parseFloat(correlation.toFixed(4)),
      accuracy: this.calculateAccuracy(correlation)
    };
  }

  // Menghitung akurasi berdasarkan korelasi
  calculateAccuracy(correlation) {
    const absCorrelation = Math.abs(correlation);
    if (absCorrelation >= 0.9) return 'very_high';
    if (absCorrelation >= 0.7) return 'high';
    if (absCorrelation >= 0.5) return 'medium';
    if (absCorrelation >= 0.3) return 'low';
    return 'very_low';
  }

  // Generate tanggal untuk periode prediksi
  getDateForPeriod(period) {
    const today = new Date();
    const futureDate = new Date(today.getTime() + (period - this.data.length) * 24 * 60 * 60 * 1000);
    return futureDate.toISOString().split('T')[0];
  }

  // Menghitung rekomendasi pengadaan
  getRecommendation(currentStock, minStock, maxStock) {
    const prediction = this.predict(30);
    
    if (prediction.predictions.length === 0) {
      return {
        action: 'monitor',
        quantity: 0,
        reason: 'Insufficient historical data'
      };
    }

    const avgPredictedDemand = prediction.predictions.slice(0, 7).reduce((sum, p) => sum + p.value, 0) / 7;
    const weeklyDemand = Math.max(1, avgPredictedDemand);
    
    // Safety stock calculation
    const safetyStock = Math.ceil(weeklyDemand * 0.5);
    const reorderPoint = weeklyDemand + safetyStock;
    
    if (currentStock <= reorderPoint) {
      const recommendedQty = Math.min(maxStock - currentStock, weeklyDemand * 4);
      return {
        action: 'order',
        quantity: Math.ceil(recommendedQty),
        reason: `Stock below reorder point. Predicted weekly demand: ${Math.ceil(weeklyDemand)} units`,
        urgency: currentStock <= minStock ? 'high' : 'medium'
      };
    }

    return {
      action: 'monitor',
      quantity: 0,
      reason: 'Stock level is adequate',
      urgency: 'low'
    };
  }
}

const router = express.Router();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'inventory_least_square',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// ============================================================================
// MIDDLEWARE
// ============================================================================

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const [users] = await pool.execute(
      'SELECT id, username, email, role, name, is_active FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = users[0];
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// ============================================================================
// AUTH CONTROLLERS
// ============================================================================

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Get user from database
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Remove password from response
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const register = async (req, res) => {
  try {
    const { username, password, email, role, name, phone, address } = req.body;

    if (!username || !password || !email || !role || !name) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));

    // Insert new user
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, email, role, name, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, email, role, name, phone, address]
    );

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.execute(
      'SELECT id, username, email, role, name, phone, address, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// USER CONTROLLERS
// ============================================================================

export const getUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, username, email, role, name, phone, address, is_active, created_at 
      FROM users 
      WHERE is_active = TRUE
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE is_active = TRUE';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      countQuery += ' AND role = ?';
      params.push(role);
    }

    if (search) {
      query += ' AND (name LIKE ? OR username LIKE ? OR email LIKE ?)';
      countQuery += ' AND (name LIKE ? OR username LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const [users] = await pool.execute(query, [...params, parseInt(limit), offset]);
    const [countResult] = await pool.execute(countQuery, params);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(countResult[0].total / limit),
        totalItems: countResult[0].total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute(
      'SELECT id, username, email, role, name, phone, address, is_active, created_at FROM users WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, address } = req.body;

    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.execute(`
      UPDATE users SET 
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        role = COALESCE(?, role),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, email, role, phone, address, id]);

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Soft delete
    await pool.execute(
      'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// DASHBOARD CONTROLLERS
// ============================================================================

export const getDashboardStats = async (req, res) => {
  try {
    // Get basic statistics
    const [stats] = await pool.execute('SELECT * FROM dashboard_stats');
    
    // Get recent stock movements
    const [recentMovements] = await pool.execute(`
      SELECT 'in' as type, si.transaction_code, i.name as item_name, si.qty, si.date, si.created_at
      FROM stock_in si
      JOIN items i ON si.item_id = i.id
      WHERE si.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      UNION ALL
      SELECT 'out' as type, so.transaction_code, i.name as item_name, so.qty, so.date, so.created_at
      FROM stock_out so
      JOIN items i ON so.item_id = i.id
      WHERE so.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Get low stock alerts
    const [lowStockItems] = await pool.execute('SELECT * FROM stock_alerts LIMIT 10');

    // Get monthly stock trends for prediction
    const [monthlyTrends] = await pool.execute(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        SUM(qty) as total_in
      FROM stock_in 
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month
    `);

    const [monthlyOut] = await pool.execute(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        SUM(qty) as total_out
      FROM stock_out 
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month
    `);

    // Prepare data for prediction
    const trendData = monthlyTrends.map((trend) => ({
      period: trend.month,
      value: trend.total_in,
      outgoing: monthlyOut.find(out => out.month === trend.month)?.total_out || 0
    }));

    // Generate prediction using least square
    const predictor = new LeastSquarePredictor(trendData.map(d => ({ value: d.value })));
    const prediction = predictor.predict(6);

    res.json({
      stats: stats[0] || {},
      recentMovements,
      lowStockItems,
      trends: trendData,
      prediction
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getItemPrediction = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { periods = 30 } = req.query;

    // Get historical data for specific item
    const [stockHistory] = await pool.execute(`
      SELECT 
        DATE(date) as date,
        SUM(CASE WHEN type = 'in' THEN qty ELSE 0 END) as stock_in,
        SUM(CASE WHEN type = 'out' THEN qty ELSE 0 END) as stock_out,
        SUM(CASE WHEN type = 'in' THEN qty ELSE -qty END) as net_movement
      FROM (
        SELECT date, qty, 'in' as type FROM stock_in WHERE item_id = ?
        UNION ALL
        SELECT date, qty, 'out' as type FROM stock_out WHERE item_id = ?
      ) movements
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
      GROUP BY DATE(date)
      ORDER BY date
    `, [itemId, itemId]);

    // Get current item info
    const [items] = await pool.execute(
      'SELECT * FROM items WHERE id = ?',
      [itemId]
    );

    if (items.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = items[0];

    // Prepare data for prediction (focus on outgoing items as demand)
    const demandData = stockHistory.map((record, index) => ({
      period: index + 1,
      value: Math.abs(record.stock_out),
      date: record.date
    }));

    // Generate prediction
    const predictor = new LeastSquarePredictor(demandData);
    const prediction = predictor.predict(parseInt(periods));
    const recommendation = predictor.getRecommendation(
      item.stock_qty,
      item.min_stock,
      item.max_stock
    );

    res.json({
      item,
      historicalData: stockHistory,
      prediction,
      recommendation
    });
  } catch (error) {
    console.error('Item prediction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// ITEM CONTROLLERS
// ============================================================================

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
      query += ' AND (i.name LIKE ? OR i.code LIKE ? OR i.model LIKE ?)';
      countQuery += ' AND (i.name LIKE ? OR i.code LIKE ? OR i.model LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
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
      code, name, model, color, size, category_id,
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
      INSERT INTO items (code, name, model, color, size, category_id, stock_qty, min_stock, max_stock, unit, price, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [code, name, model, color, size, category_id, stock_qty, min_stock, max_stock, unit, price, description]);

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
      code, name, model, color, size, category_id,
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
        model = COALESCE(?, model),
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
    `, [code, name, model, color, size, category_id, min_stock, max_stock, unit, price, description, id]);

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

// ============================================================================
// ROUTES
// ============================================================================

// Auth Routes
router.post('/auth/login', login);
router.post('/auth/register', register);
router.get('/auth/profile', authenticateToken, getProfile);

// User Routes
router.get('/users', authenticateToken, authorize('admin'), getUsers);
router.get('/users/:id', authenticateToken, authorize('admin'), getUser);
router.put('/users/:id', authenticateToken, authorize('admin'), updateUser);
router.delete('/users/:id', authenticateToken, authorize('admin'), deleteUser);

// Dashboard Routes
router.get('/dashboard/stats', authenticateToken, getDashboardStats);
router.get('/dashboard/prediction/:itemId', authenticateToken, getItemPrediction);

// Item Routes
router.get('/items', authenticateToken, getItems);
router.get('/items/:id', authenticateToken, getItem);
router.post('/items', authenticateToken, authorize('admin'), createItem);
router.put('/items/:id', authenticateToken, authorize('admin'), updateItem);
router.delete('/items/:id', authenticateToken, authorize('admin'), deleteItem);

// Category Routes
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT * FROM categories ORDER BY name'
    );
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
    const { transaction_code, item_id, supplier_id, qty, price, total_price, date, notes } = req.body;

    if (!transaction_code || !item_id || !qty || !date) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const [result] = await pool.execute(`
      INSERT INTO stock_in (transaction_code, item_id, supplier_id, qty, price, total_price, date, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [transaction_code, item_id, supplier_id || null, qty, price, total_price, date, notes, req.user.id]);

    res.status(201).json({
      message: 'Stock in record created successfully',
      id: result.insertId
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
    const { transaction_code, item_id, qty, purpose, recipient, date, notes } = req.body;

    if (!transaction_code || !item_id || !qty || !purpose || !date) {
      return res.status(400).json({ error: 'Required fields are missing' });
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
      id: result.insertId
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

// ============================================================================
// ORDER CONTROLLERS
// ============================================================================

export const getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    const userRole = req.user.role;
    const userId = req.user.id;

    let query = `
      SELECT o.*, u.name as supplier_name, u.email as supplier_email
      FROM orders o
      JOIN users u ON o.supplier_id = u.id
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM orders o JOIN users u ON o.supplier_id = u.id WHERE 1=1';
    const params = [];

    // Filter orders based on user role
    if (userRole === 'supplier') {
      query += ' AND o.supplier_id = ?';
      countQuery += ' AND o.supplier_id = ?';
      params.push(userId);
    }

    if (status) {
      query += ' AND o.status = ?';
      countQuery += ' AND o.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (o.order_code LIKE ? OR u.name LIKE ?)';
      countQuery += ' AND (o.order_code LIKE ? OR u.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';

    const [orders] = await pool.execute(query, [...params, parseInt(limit), offset]);
    const [countResult] = await pool.execute(countQuery, params);

    res.json({
      orders,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(countResult[0].total / limit),
        totalItems: countResult[0].total
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.execute(`
      SELECT o.*, u.name as supplier_name, u.email as supplier_email
      FROM orders o
      JOIN users u ON o.supplier_id = u.id
      WHERE o.id = ?
    `, [id]);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const [orderItems] = await pool.execute(`
      SELECT oi.*, i.name as item_name, i.code as item_code, i.model
      FROM order_items oi
      JOIN items i ON oi.item_id = i.id
      WHERE oi.order_id = ?
    `, [id]);

    res.json({
      order: orders[0],
      items: orderItems
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { items, notes } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;

    // For suppliers, use their own ID as supplier_id
    // For admins, require supplier_id in request body
    let supplier_id;
    if (userRole === 'supplier') {
      supplier_id = userId;
    } else {
      supplier_id = req.body.supplier_id;
    }

    if (!supplier_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Supplier and items are required' });
    }

    // Generate order code
    const orderCode = `ORD-${Date.now()}`;
    let totalAmount = 0;

    // Calculate total amount
    items.forEach(item => {
      totalAmount += item.qty * item.price;
    });

    const [result] = await pool.execute(`
      INSERT INTO orders (order_code, supplier_id, total_amount, notes, auto_reject_at)
      VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
    `, [orderCode, supplier_id, totalAmount, notes]);

    const orderId = result.insertId;

    // Insert order items
    for (const item of items) {
      await pool.execute(`
        INSERT INTO order_items (order_id, item_id, qty, price, total_price, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [orderId, item.item_id, item.qty, item.price, item.qty * item.price, item.notes]);
    }

    res.status(201).json({
      message: 'Order created successfully',
      orderId,
      orderCode
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    let updateQuery = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP';
    const params = [status];

    if (status === 'confirmed') {
      updateQuery += ', confirmed_at = NOW(), confirmed_by = ?';
      params.push(req.user.id);
    } else if (status === 'shipped') {
      updateQuery += ', shipped_at = NOW()';
    }

    updateQuery += ' WHERE id = ?';
    params.push(id);

    await pool.execute(updateQuery, params);

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM order_items WHERE order_id = ?', [id]);
    await pool.execute('DELETE FROM orders WHERE id = ?', [id]);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// REPORT CONTROLLERS
// ============================================================================

export const getReports = async (req, res) => {
  try {
    const { type, start_date, end_date } = req.query;

    let reports = {};

    if (type === 'stock' || !type) {
      // Stock report
      const [stockReport] = await pool.execute(`
        SELECT 
          i.code,
          i.name,
          i.model,
          i.color,
          i.size,
          i.stock_qty,
          i.min_stock,
          i.max_stock,
          c.name as category_name,
          CASE 
            WHEN i.stock_qty <= i.min_stock THEN 'low'
            WHEN i.stock_qty >= i.max_stock THEN 'high'
            ELSE 'normal'
          END as stock_status
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        WHERE i.is_active = TRUE
        ORDER BY i.stock_qty ASC
      `);
      reports.stock = stockReport;
    }

    if (type === 'movement' || !type) {
      // Stock movement report
      const [movementReport] = await pool.execute(`
        SELECT 
          'IN' as type,
          si.transaction_code,
          i.name as item_name,
          si.qty,
          si.price,
          si.total_price,
          si.date,
          u.name as supplier_name
        FROM stock_in si
        JOIN items i ON si.item_id = i.id
        LEFT JOIN users u ON si.supplier_id = u.id
        WHERE si.date BETWEEN ? AND ?
        UNION ALL
        SELECT 
          'OUT' as type,
          so.transaction_code,
          i.name as item_name,
          so.qty,
          0 as price,
          0 as total_price,
          so.date,
          so.recipient as supplier_name
        FROM stock_out so
        JOIN items i ON so.item_id = i.id
        WHERE so.date BETWEEN ? AND ?
        ORDER BY date DESC
      `, [start_date || '2024-01-01', end_date || '2024-12-31', start_date || '2024-01-01', end_date || '2024-12-31']);
      reports.movement = movementReport;
    }

    if (type === 'orders' || !type) {
      // Orders report
      const [ordersReport] = await pool.execute(`
        SELECT 
          o.order_code,
          o.status,
          o.total_amount,
          o.order_date,
          o.confirmed_at,
          o.shipped_at,
          u.name as supplier_name,
          COUNT(oi.id) as total_items
        FROM orders o
        JOIN users u ON o.supplier_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.order_date BETWEEN ? AND ?
        GROUP BY o.id
        ORDER BY o.order_date DESC
      `, [start_date || '2024-01-01', end_date || '2024-12-31']);
      reports.orders = ordersReport;
    }

    res.json({ reports });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// ADDITIONAL ROUTES
// ============================================================================

// Order Routes
router.get('/orders', authenticateToken, authorize('admin', 'owner', 'supplier'), getOrders);
router.get('/orders/:id', authenticateToken, authorize('admin', 'owner', 'supplier'), getOrder);
router.post('/orders', authenticateToken, authorize('admin', 'supplier'), createOrder);
router.put('/orders/:id/status', authenticateToken, authorize('admin'), updateOrderStatus);
router.delete('/orders/:id', authenticateToken, authorize('admin'), deleteOrder);

// Report Routes
router.get('/reports', authenticateToken, getReports);

export default router; 