const db = require('../db/pool');
const logger = require('../utils/logger');

exports.addPoints = async (req, res) => {
  try {
    const { clientId, points, reason } = req.body;
    
    // Проверяем существование клиента
    const client = await db.query(
      'SELECT * FROM clients WHERE id = $1',
      [clientId]
    );
    
    if (!client.rows.length) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Добавляем баллы
    await db.query(
      `INSERT INTO loyalty_points 
       (client_id, points, reason)
       VALUES ($1, $2, $3)`,
      [clientId, points, reason]
    );
    
    // Обновляем общую сумму баллов
    await db.query(
      `UPDATE clients 
       SET loyalty_points = loyalty_points + $1
       WHERE id = $2`,
      [points, clientId]
    );
    
    // Проверяем достижение нового уровня
    await this.checkLevelUp(clientId);
    
    res.json({ message: 'Points added successfully' });
  } catch (err) {
    logger.error(`Add loyalty points error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

exports.checkLevelUp = async (clientId) => {
  const client = await db.query(
    'SELECT loyalty_points, loyalty_level FROM clients WHERE id = $1',
    [clientId]
  );
  
  const points = client.rows[0].loyalty_points;
  const currentLevel = client.rows[0].loyalty_level;
  
  // Получаем правила лояльности
  const rules = await db.query(
    'SELECT * FROM loyalty_rules ORDER BY min_points DESC'
  );
  
  // Определяем подходящий уровень
  const newLevel = rules.rows.find(rule => points >= rule.min_points)?.level || 0;
  
  if (newLevel > currentLevel) {
    // Обновляем уровень
    await db.query(
      'UPDATE clients SET loyalty_level = $1 WHERE id = $2',
      [newLevel, clientId]
    );
    
    // Отправляем уведомление
    const wsServer = require('../index').app.locals.wsServer;
    wsServer.notifyUser(clientId, 'loyalty_level_up', {
      newLevel,
      points
    });
  }
};