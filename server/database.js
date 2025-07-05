const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'aishwarya_xerox',
  port: process.env.DB_PORT || 3306,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Create connection pool
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database tables
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Create orders table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        print_type VARCHAR(50) NOT NULL,
        binding_color_type VARCHAR(50),
        copies INT DEFAULT 1,
        paper_size VARCHAR(20),
        print_side VARCHAR(20),
        selected_pages TEXT,
        color_pages TEXT,
        bw_pages TEXT,
        special_instructions TEXT,
        order_date DATETIME NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        total_cost DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create order_files table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size INT NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        file_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
      )
    `);

    // Create admin_users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default admin user if not exists
    const [adminExists] = await connection.execute(
      'SELECT id FROM admin_users WHERE username = ?',
      ['admin']
    );

    if (adminExists.length === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('xerox123', 10);
      await connection.execute(
        'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
        ['admin', hashedPassword]
      );
    }

    connection.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

module.exports = {
  pool,
  initializeDatabase
};