const db = require('../db/pool');
const logger = require('../utils/logger');

exports.createOrder = async (req, res) => {
  try {
    const { client_id, items, delivery_info } = req.body;
    
    // 1. Создаем заказ
    const orderResult = await db.query(
      `INSERT INTO orders 
       (client_id, status, delivery_info, created_by)
       VALUES ($1, 'new', $2, $3) RETURNING *`,
      [client_id, delivery_info, req.user.id]
    );
    
    const orderId = orderResult.rows[0].id;
    
    // 2. Добавляем товары
    for (const item of items) {
      await db.query(
        `INSERT INTO order_items 
         (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, item.price]
      );
    }
    
    // 3. Создаем первый статус
    await db.query(
      `INSERT INTO order_status_history
       (order_id, status, changed_by)
       VALUES ($1, 'new', $2)`,
      [orderId, req.user.id]
    );
    
    logger.info(`Order created: ${orderId}`);
    res.status(201).json(orderResult.rows[0]);
  } catch (err) {
    logger.error(`Error creating order: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, comment } = req.body;
    
    // 1. Обновляем статус заказа
    await db.query(
      `UPDATE orders SET status = $1 WHERE id = $2`,
      [status, orderId]
    );
    
    // 2. Добавляем запись в историю
    await db.query(
      `INSERT INTO order_status_history
       (order_id, status, comment, changed_by)
       VALUES ($1, $2, $3, $4)`,
      [orderId, status, comment, req.user.id]
    );
    
    logger.info(`Order ${orderId} status updated to ${status}`);
    res.json({ message: 'Status updated' });
  } catch (err) {
    logger.error(`Error updating order status: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};