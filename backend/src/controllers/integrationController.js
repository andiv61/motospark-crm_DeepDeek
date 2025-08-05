const axios = require('axios');
const db = require('../db/pool');
const logger = require('../utils/logger');

exports.exportTo1C = async (req, res) => {
  try {
    // 1. Получаем данные для экспорта
    const clients = await db.query('SELECT * FROM clients');
    const products = await db.query('SELECT * FROM products');
    const orders = await db.query(`
      SELECT o.*, c.name as client_name 
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      WHERE o.created_at > NOW() - INTERVAL '1 month'
    `);
    
    // 2. Форматируем данные для 1С
    const exportData = {
      clients: clients.rows,
      products: products.rows,
      orders: orders.rows
    };
    
    // 3. Отправляем в 1С
    const response = await axios.post(
      `${process.env.ONE_C_BASE_URL}/import`,
      exportData,
      {
        auth: {
          username: process.env.ONE_C_USERNAME,
          password: process.env.ONE_C_PASSWORD
        }
      }
    );
    
    res.json({ 
      message: 'Export successful',
      stats: {
        clients: clients.rowCount,
        products: products.rowCount,
        orders: orders.rowCount
      }
    });
  } catch (err) {
    logger.error(`1C export error: ${err.message}`);
    res.status(500).json({ error: 'Export failed' });
  }
};

exports.importFrom1C = async (req, res) => {
  try {
    // 1. Получаем данные из 1С
    const response = await axios.get(
      `${process.env.ONE_C_BASE_URL}/export`,
      {
        auth: {
          username: process.env.ONE_C_USERNAME,
          password: process.env.ONE_C_PASSWORD
        }
      }
    );
    
    const { products, prices, stock } = response.data;
    
    // 2. Обновляем товары и цены
    await this.updateProducts(products, prices);
    
    // 3. Обновляем остатки
    await this.updateStock(stock);
    
    res.json({ 
      message: 'Import successful',
      stats: {
        products: products.length,
        stockUpdates: stock.length
      }
    });
  } catch (err) {
    logger.error(`1C import error: ${err.message}`);
    res.status(500).json({ error: 'Import failed' });
  }
};

async function updateProducts(products, prices) {
  for (const product of products) {
    await db.query(
      `INSERT INTO products (id, article, name, category, description)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         article = EXCLUDED.article,
         name = EXCLUDED.name,
         category = EXCLUDED.category,
         description = EXCLUDED.description`,
      [
        product.id,
        product.article,
        product.name,
        product.category,
        product.description
      ]
    );
    
    // Обновляем цены
    for (const price of prices.filter(p => p.product_id === product.id)) {
      await db.query(
        `INSERT INTO product_prices (product_id, price_type, value)
         VALUES ($1, $2, $3)
         ON CONFLICT (product_id, price_type) DO UPDATE SET
           value = EXCLUDED.value`,
        [
          product.id,
          price.type,
          price.value
        ]
      );
    }
  }
}