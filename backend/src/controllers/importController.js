const excelParser = require('../utils/excelParser');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');
const db = require('../db/pool');

exports.manualImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const mapping = req.body.mapping; // { article: 'A', quantity: 'B', ... }
    const warehouseId = req.body.warehouseId;
    
    const products = await excelParser.parseStockFile(req.file.path, mapping);
    
    // Обновляем остатки в БД
    await updateStock(products, warehouseId);
    
    logger.info(`Manual import completed. Items: ${products.length}`);
    res.json({ message: 'Import successful', count: products.length });
  } catch (err) {
    logger.error(`Import error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

async function updateStock(products, warehouseId) {
  // Здесь должна быть логика обновления остатков
  // Пример:
  for (const product of products) {
    await db.query(`
      INSERT INTO stock (product_id, warehouse_id, quantity, price)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (product_id, warehouse_id) 
      DO UPDATE SET quantity = EXCLUDED.quantity, price = EXCLUDED.price
    `, [product.article, warehouseId, product.quantity, product.price]);
  }
}