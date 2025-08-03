import { pool } from '../config/database.js';
import { LeastSquarePredictor } from '../utils/leastSquare.js';

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
    const trendData = monthlyTrends.map((trend, index) => ({
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