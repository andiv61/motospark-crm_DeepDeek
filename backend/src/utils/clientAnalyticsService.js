const db = require('../db/pool');
const logger = require('./logger');

class ClientAnalyticsService {
  async updateClientActivity(clientId) {
    try {
      // Обновляем статистику за текущий месяц
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      
      await db.query(
        `INSERT INTO client_activity_stats 
         (client_id, period, order_count, total_amount)
         SELECT 
           $1 as client_id,
           DATE_TRUNC('month', o.created_at) as period,
           COUNT(o.id) as order_count,
           COALESCE(SUM(o.total_amount), 0) as total_amount
         FROM orders o
         WHERE o.client_id = $1
           AND DATE_TRUNC('month', o.created_at) = $2
         GROUP BY DATE_TRUNC('month', o.created_at)
         ON CONFLICT (client_id, period) 
         DO UPDATE SET 
           order_count = EXCLUDED.order_count,
           total_amount = EXCLUDED.total_amount`,
        [clientId, currentMonth]
      );
      
      // Обновляем материализованное представление
      await db.query('REFRESH MATERIALIZED VIEW CONCURRENTLY client_segments');
    } catch (err) {
      logger.error(`Client activity update error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = new ClientAnalyticsService();