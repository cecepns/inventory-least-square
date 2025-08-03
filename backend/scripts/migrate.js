import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

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

const runMigration = async () => {
  try {
    console.log('🔄 Starting database migration...');
    
    // Check if database exists, if not create it
    const connection = await pool.getConnection();
    
    // Create database if not exists
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.query(`USE ${dbConfig.database}`);
    
    console.log('✅ Database connection established');
    
    // Check if users table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'users'"
    );
    
    if (tables.length === 0) {
      console.log('📋 Creating users table...');
      
      // Create users table
      await connection.execute(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          role ENUM('admin', 'owner', 'supplier') NOT NULL,
          name VARCHAR(100) NOT NULL,
          phone VARCHAR(20),
          address TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Users table created');
    } else {
      console.log('📋 Users table exists, checking structure...');
      
      // Check if is_active column exists
      const [columns] = await connection.execute(
        "SHOW COLUMNS FROM users LIKE 'is_active'"
      );
      
      if (columns.length === 0) {
        console.log('🔧 Adding is_active column to users table...');
        await connection.execute(
          "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE"
        );
        console.log('✅ is_active column added');
      } else {
        console.log('✅ is_active column already exists');
      }
    }
    
    // Check if categories table exists
    const [categoryTables] = await connection.execute(
      "SHOW TABLES LIKE 'categories'"
    );
    
    if (categoryTables.length === 0) {
      console.log('📋 Creating categories table...');
      await connection.execute(`
        CREATE TABLE categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Categories table created');
    }
    
    // Check if items table exists
    const [itemTables] = await connection.execute(
      "SHOW TABLES LIKE 'items'"
    );
    
    if (itemTables.length === 0) {
      console.log('📋 Creating items table...');
      await connection.execute(`
        CREATE TABLE items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          code VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          model VARCHAR(100),
          color VARCHAR(50),
          size VARCHAR(20),
          category_id INT,
          stock_qty INT DEFAULT 0,
          min_stock INT DEFAULT 10,
          max_stock INT DEFAULT 1000,
          unit VARCHAR(20) DEFAULT 'pcs',
          price DECIMAL(10,2) DEFAULT 0.00,
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        )
      `);
      console.log('✅ Items table created');
    }
    
    // Check if stock_in table exists
    const [stockInTables] = await connection.execute(
      "SHOW TABLES LIKE 'stock_in'"
    );
    
    if (stockInTables.length === 0) {
      console.log('📋 Creating stock_in table...');
      await connection.execute(`
        CREATE TABLE stock_in (
          id INT AUTO_INCREMENT PRIMARY KEY,
          transaction_code VARCHAR(50) UNIQUE NOT NULL,
          item_id INT NOT NULL,
          supplier_id INT,
          qty INT NOT NULL,
          price DECIMAL(10,2) DEFAULT 0.00,
          total_price DECIMAL(10,2) DEFAULT 0.00,
          date DATE NOT NULL,
          notes TEXT,
          created_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
          FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        )
      `);
      console.log('✅ Stock_in table created');
    }
    
    // Check if stock_out table exists
    const [stockOutTables] = await connection.execute(
      "SHOW TABLES LIKE 'stock_out'"
    );
    
    if (stockOutTables.length === 0) {
      console.log('📋 Creating stock_out table...');
      await connection.execute(`
        CREATE TABLE stock_out (
          id INT AUTO_INCREMENT PRIMARY KEY,
          transaction_code VARCHAR(50) UNIQUE NOT NULL,
          item_id INT NOT NULL,
          qty INT NOT NULL,
          purpose VARCHAR(100) NOT NULL,
          recipient VARCHAR(100),
          date DATE NOT NULL,
          notes TEXT,
          created_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        )
      `);
      console.log('✅ Stock_out table created');
    }
    
    // Insert default data if tables are empty
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    if (users[0].count === 0) {
      console.log('📝 Inserting default users...');
      await connection.execute(`
        INSERT INTO users (username, password, email, role, name, phone) VALUES
        ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@inventory.com', 'admin', 'Administrator', '081234567890'),
        ('owner', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'owner@inventory.com', 'owner', 'Owner', '081234567891'),
        ('supplier1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supplier1@inventory.com', 'supplier', 'Supplier 1', '081234567892')
      `);
      console.log('✅ Default users inserted');
    }
    
    const [categories] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    if (categories[0].count === 0) {
      console.log('📝 Inserting default categories...');
      await connection.execute(`
        INSERT INTO categories (name, description) VALUES
        ('Pakaian', 'Kategori untuk pakaian dan fashion'),
        ('Aksesoris', 'Kategori untuk aksesoris fashion'),
        ('Olahraga', 'Kategori untuk perlengkapan olahraga')
      `);
      console.log('✅ Default categories inserted');
    }
    
    connection.release();
    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runMigration(); 