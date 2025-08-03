-- Inventory Management System Database
-- Database untuk sistem inventori dengan prediksi least square

CREATE DATABASE IF NOT EXISTS inventory_least_square;
USE inventory_least_square;

-- Table Users
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
);

-- Table Categories
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table Items (Data Barang)
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
);

-- Table Stock In (Barang Masuk)
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
);

-- Table Stock Out (Barang Keluar)
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
);

-- Table Orders (Pesanan dari Supplier)
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INT NOT NULL,
    status ENUM('pending', 'confirmed', 'rejected', 'shipped', 'completed') DEFAULT 'pending',
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    confirmed_at DATETIME NULL,
    confirmed_by INT NULL,
    shipped_at DATETIME NULL,
    notes TEXT,
    auto_reject_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Table Order Items
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    qty INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Table Notifications
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id INT NULL,
    related_type VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Triggers untuk auto-update stock
DELIMITER //

-- Trigger untuk update stock saat stock_in ditambah
CREATE TRIGGER after_stock_in_insert
AFTER INSERT ON stock_in
FOR EACH ROW
BEGIN
    UPDATE items 
    SET stock_qty = stock_qty + NEW.qty,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.item_id;
END//

-- Trigger untuk update stock saat stock_in diupdate
CREATE TRIGGER after_stock_in_update
AFTER UPDATE ON stock_in
FOR EACH ROW
BEGIN
    UPDATE items 
    SET stock_qty = stock_qty - OLD.qty + NEW.qty,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.item_id;
END//

-- Trigger untuk update stock saat stock_in dihapus
CREATE TRIGGER after_stock_in_delete
AFTER DELETE ON stock_in
FOR EACH ROW
BEGIN
    UPDATE items 
    SET stock_qty = stock_qty - OLD.qty,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.item_id;
END//

-- Trigger untuk update stock saat stock_out ditambah
CREATE TRIGGER after_stock_out_insert
AFTER INSERT ON stock_out
FOR EACH ROW
BEGIN
    UPDATE items 
    SET stock_qty = stock_qty - NEW.qty,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.item_id;
END//

-- Trigger untuk update stock saat stock_out diupdate
CREATE TRIGGER after_stock_out_update
AFTER UPDATE ON stock_out
FOR EACH ROW
BEGIN
    UPDATE items 
    SET stock_qty = stock_qty + OLD.qty - NEW.qty,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.item_id;
END//

-- Trigger untuk update stock saat stock_out dihapus
CREATE TRIGGER after_stock_out_delete
AFTER DELETE ON stock_out
FOR EACH ROW
BEGIN
    UPDATE items 
    SET stock_qty = stock_qty + OLD.qty,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.item_id;
END//

DELIMITER ;

-- Insert default data
INSERT INTO categories (name, description) VALUES
('Pakaian', 'Kategori untuk pakaian dan fashion'),
('Aksesoris', 'Kategori untuk aksesoris fashion'),
('Olahraga', 'Kategori untuk perlengkapan olahraga');

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password, email, role, name, phone) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@inventory.com', 'admin', 'Administrator', '081234567890'),
('owner', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'owner@inventory.com', 'owner', 'Owner', '081234567891'),
('supplier1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supplier1@inventory.com', 'supplier', 'Supplier 1', '081234567892');

-- Insert sample items based on provided data
INSERT INTO items (code, name, model, color, size, category_id, stock_qty, min_stock, unit, price) VALUES
('BLN-GRD-DNM-M', 'BALON GRADASI', 'BALON GRADASI', 'DENIM', 'M', 1, 169, 20, 'pcs', 15000.00),
('BLN-PLS-PTH-M', 'BALON POLOS', 'BALON POLOS', 'PUTIH', 'M', 1, 143, 20, 'pcs', 12000.00),
('CWG-PLS-MLO-L', 'CAWANG POLOS', 'CAWANG POLOS', 'MILO', 'L', 1, 31, 10, 'pcs', 18000.00),
('OBL-UO-MLK-M', 'OBLONG U/O', 'OBLONG U/O', 'MILK', 'M', 1, 32, 15, 'pcs', 14000.00),
('RNA-CKP-L', 'RIANA', 'RIANA', 'COKPOL', 'L', 1, 116, 25, 'pcs', 20000.00),
('RNA-MGT-M', 'RIANA', 'RIANA', 'MAGENTA', 'M', 1, 1, 25, 'pcs', 20000.00),
('RNA-PTH-XL', 'RIANA', 'RIANA', 'PUTIH', 'XL', 1, 92, 25, 'pcs', 20000.00),
('SMR-PTH', 'SAMIRA', 'SAMIRA', 'PUTIH', '', 1, 0, 15, 'pcs', 22000.00);

-- View untuk dashboard statistics
CREATE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM items WHERE is_active = TRUE) as total_items,
    (SELECT SUM(stock_qty) FROM items WHERE is_active = TRUE) as total_stock,
    (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
    (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()) as today_orders,
    (SELECT COUNT(*) FROM items WHERE stock_qty <= min_stock AND is_active = TRUE) as low_stock_items;

-- View untuk stock alert
CREATE VIEW stock_alerts AS
SELECT 
    i.id,
    i.code,
    i.name,
    i.model,
    i.color,
    i.size,
    i.stock_qty,
    i.min_stock,
    c.name as category_name
FROM items i
LEFT JOIN categories c ON i.category_id = c.id
WHERE i.stock_qty <= i.min_stock AND i.is_active = TRUE
ORDER BY (i.stock_qty - i.min_stock) ASC;