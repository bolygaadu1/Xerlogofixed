const express = require('express');
const router = express.Router();
const { pool } = require('../database');

// Get all orders
router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Get orders with their files
    const [orders] = await connection.execute(`
      SELECT o.*, 
             GROUP_CONCAT(
               JSON_OBJECT(
                 'name', f.file_name,
                 'size', f.file_size,
                 'type', f.file_type,
                 'path', f.file_path
               )
             ) as files
      FROM orders o
      LEFT JOIN order_files f ON o.order_id = f.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    // Parse files JSON for each order
    const processedOrders = orders.map(order => ({
      ...order,
      files: order.files ? JSON.parse(`[${order.files}]`) : []
    }));

    connection.release();
    res.json(processedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order by ID
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const connection = await pool.getConnection();
    
    // Get order
    const [orders] = await connection.execute(
      'SELECT * FROM orders WHERE order_id = ?',
      [orderId]
    );

    if (orders.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order files
    const [files] = await connection.execute(
      'SELECT file_name as name, file_size as size, file_type as type, file_path as path FROM order_files WHERE order_id = ?',
      [orderId]
    );

    const order = {
      ...orders[0],
      files: files
    };

    connection.release();
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const {
      orderId,
      fullName,
      phoneNumber,
      printType,
      bindingColorType,
      copies,
      paperSize,
      printSide,
      selectedPages,
      colorPages,
      bwPages,
      specialInstructions,
      orderDate,
      status,
      totalCost,
      files
    } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert order
      await connection.execute(`
        INSERT INTO orders (
          order_id, full_name, phone_number, print_type, binding_color_type,
          copies, paper_size, print_side, selected_pages, color_pages,
          bw_pages, special_instructions, order_date, status, total_cost
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderId, fullName, phoneNumber, printType, bindingColorType,
        copies, paperSize, printSide, selectedPages, colorPages,
        bwPages, specialInstructions, orderDate, status || 'pending', totalCost
      ]);

      // Insert files
      if (files && files.length > 0) {
        for (const file of files) {
          await connection.execute(`
            INSERT INTO order_files (order_id, file_name, file_size, file_type, file_path)
            VALUES (?, ?, ?, ?, ?)
          `, [orderId, file.name, file.size, file.type, file.path]);
        }
      }

      await connection.commit();
      connection.release();

      res.status(201).json({ message: 'Order created successfully', orderId });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order status
router.patch('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      [status, orderId]
    );

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Delete all orders (admin only)
router.delete('/all', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    await connection.execute('DELETE FROM order_files');
    await connection.execute('DELETE FROM orders');
    
    connection.release();
    res.json({ message: 'All orders deleted successfully' });
  } catch (error) {
    console.error('Error deleting orders:', error);
    res.status(500).json({ error: 'Failed to delete orders' });
  }
});

module.exports = router;