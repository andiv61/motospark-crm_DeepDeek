const db = require('../db/pool');
const logger = require('../utils/logger');

exports.addWarehouse = async (req, res) => {
  try {
    const { name, type, location, delivery_time, contacts } = req.body;
    
    const result = await db.query(
      `INSERT INTO warehouses 
       (name, type, location, delivery_time, contacts) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, type, location, delivery_time, contacts]
    );
    
    logger.info(`Warehouse added: ${name}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error(`Error adding warehouse: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

exports.getWarehouses = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM warehouses');
    res.json(result.rows);
  } catch (err) {
    logger.error(`Error fetching warehouses: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};