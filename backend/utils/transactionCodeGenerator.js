import { pool } from '../config/database.js';

export const generateTransactionCode = async (type, date) => {
  try {
    // Extract date components
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    // Format: TXN-IN-YYYYMMDD-001 or TXN-OUT-YYYYMMDD-001
    const dateStr = `${year}${month}${day}`;
    const prefix = `TXN-${type}-${dateStr}`;
    
    // Find the highest sequence number for this date and type
    let sequenceQuery;
    if (type === 'IN') {
      sequenceQuery = `
        SELECT transaction_code 
        FROM stock_in 
        WHERE transaction_code LIKE ? 
        ORDER BY transaction_code DESC 
        LIMIT 1
      `;
    } else {
      sequenceQuery = `
        SELECT transaction_code 
        FROM stock_out 
        WHERE transaction_code LIKE ? 
        ORDER BY transaction_code DESC 
        LIMIT 1
      `;
    }
    
    const [results] = await pool.execute(sequenceQuery, [`${prefix}-%`]);
    
    let sequence = 1;
    if (results.length > 0) {
      // Extract the sequence number from the last transaction code
      const lastCode = results[0].transaction_code;
      const lastSequence = parseInt(lastCode.split('-').pop(), 10);
      sequence = lastSequence + 1;
    }
    
    // Generate the new transaction code with padded sequence
    const sequenceStr = String(sequence).padStart(3, '0');
    const transactionCode = `${prefix}-${sequenceStr}`;
    
    return transactionCode;
  } catch (error) {
    console.error('Error generating transaction code:', error);
    throw new Error('Failed to generate transaction code');
  }
};


export const isTransactionCodeExists = async (code, type) => {
  try {
    let query;
    if (type === 'IN') {
      query = 'SELECT COUNT(*) as count FROM stock_in WHERE transaction_code = ?';
    } else {
      query = 'SELECT COUNT(*) as count FROM stock_out WHERE transaction_code = ?';
    }
    
    const [results] = await pool.execute(query, [code]);
    return results[0].count > 0;
  } catch (error) {
    console.error('Error checking transaction code existence:', error);
    return true; // Assume exists on error to be safe
  }
};

export const generateFallbackCode = (type) => {
  const timestamp = Date.now();
  return `TXN-${type}-${timestamp}`;
};
