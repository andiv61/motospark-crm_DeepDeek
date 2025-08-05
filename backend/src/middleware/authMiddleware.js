const jwt = require('jsonwebtoken');
const db = require('../db/pool');
const logger = require('../utils/logger');

module.exports = async (req, res, next) => {
  try {
    // 1. Проверяем наличие токена
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error('Authentication required');
    }

    // 2. Верифицируем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Проверяем существование пользователя
    const user = await db.query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!user.rows.length || !user.rows[0].is_active) {
      throw new Error('User not found or inactive');
    }

    // 4. Добавляем пользователя в запрос
    req.user = user.rows[0];
    next();
  } catch (err) {
    logger.error(`Authentication error: ${err.message}`);
    res.status(401).json({ error: 'Please authenticate' });
  }
};