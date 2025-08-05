const db = require('../db/pool');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

exports.createProduct = async (req, res) => {
  try {
    const { article, name, description, category } = req.body;
    let imagePath = null;

    if (req.file) {
      imagePath = `/uploads/products/${req.file.filename}`;
    }

    const result = await db.query(
      `INSERT INTO products 
       (article, name, description, category, image_path) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [article, name, description, category, imagePath]
    );

    logger.info(`Product created: ${article} - ${name}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error(`Error creating product: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

exports.getProductStock = async (req, res) => {
  try {
    const productId = req.params.id;
    
    const result = await db.query(
      `SELECT w.name, w.type, s.quantity, s.price, w.delivery_time
       FROM stock s
       JOIN warehouses w ON s.warehouse_id = w.id
       WHERE s.product_id = $1`,
      [productId]
    );

    res.json(result.rows);
  } catch (err) {
    logger.error(`Error getting product stock: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

// Другие методы (getProducts, getProductById, updateProduct) аналогично