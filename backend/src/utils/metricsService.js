const db = require('../db/pool');
const logger = require('./logger');

class MetricsService {
  async collectDailyMetrics() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Собираем основные метрики
      const metrics = await Promise.all([
        this.getTotalClients(),
        this.getNewOrders(today),
        this.getRevenue(today),
        this.getAvgOrderValue(today)
      ]);
      
      // Сохраняем в базу для истории
      await this.saveMetrics({
        date: today,
        total_clients: metrics[0],
        new_orders: metrics[1],
        revenue: metrics[2],
        avg_order: metrics[3]
      });
      
      return {
        total_clients: metrics[0],
        new_orders: metrics[1],
        revenue: metrics[2],
        avg_order: metrics[3]
      };
    } catch (err) {
      logger.error(`Metrics collection error: ${err.message}`);
      throw err;
    }
  }

  async getTotalClients() {
    const res = await db.query(
      'SELECT COUNT(*) FROM clients WHERE is_active = true'
    );
    return parseInt(res.rows[0].count);
  }

  async getNewOrders(date) {
    const res = await db.query(
      `SELECT COUNT(*) FROM orders 
       WHERE DATE(created_at) = $1 AND status != 'cancelled'`,
      [date]
    );
    return parseInt(res.rows[0].count);
  }

  async getRevenue(date) {
    const res = await db.query(
      `SELECT COALESCE(SUM(oi.quantity * oi.price), 0) as revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE DATE(o.created_at) = $1 AND o.status = 'delivered'`,
      [date]
    );
    return parseFloat(res.rows[0].revenue);
  }

  async saveMetrics(metrics) {
    await db.query(
      `INSERT INTO analytics_metrics 
       (metric_date, metric_type, value)
       VALUES 
       ($1, 'total_clients', $2),
       ($1, 'new_orders', $3),
       ($1, 'revenue', $4),
       ($1, 'avg_order', $5)`,
      [
        metrics.date,
        metrics.total_clients,
        metrics.new_orders,
        metrics.revenue,
        metrics.avg_order
      ]
    );
  }
}

module.exports = new MetricsService();