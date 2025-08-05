const db = require('../db/pool');
const logger = require('../utils/logger');
const analyticsService = require('../utils/analyticsService');

exports.segmentClients = async (req, res) => {
  try {
    const { filters } = req.body;
    
    // 1. Фильтрация клиентов
    const clients = await this.getClientsByFilters(filters);
    
    // 2. Анализ активности
    const withActivity = await Promise.all(
      clients.map(async client => {
        const activity = await analyticsService.getClientActivity(client.id);
        return { ...client, ...activity };
      })
    );
    
    // 3. Сегментация
    const segments = {
      vip: withActivity.filter(c => c.total_spent > 10000),
      active: withActivity.filter(c => c.order_count > 5),
      inactive: withActivity.filter(c => c.last_order_date < new Date(Date.now() - 90*24*60*60*1000))
    };
    
    res.json({ segments, count: clients.length });
  } catch (err) {
    logger.error(`Client segmentation error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

exports.getClientActivity = async (req, res) => {
  try {
    const clientId = req.params.id;
    const activity = await analyticsService.getClientActivity(clientId);
    res.json(activity);
  } catch (err) {
    logger.error(`Client activity error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};