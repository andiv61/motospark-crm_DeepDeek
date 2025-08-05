const analyticsService = require('../utils/analyticsService');
const logger = require('../utils/logger');

exports.getDashboardMetrics = async (req, res) => {
  try {
    const metrics = await analyticsService.getDashboardMetrics();
    res.json(metrics);
  } catch (err) {
    logger.error(`Dashboard metrics error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

exports.getSalesForecast = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const forecast = await analyticsService.getSalesForecast(period);
    res.json(forecast);
  } catch (err) {
    logger.error(`Sales forecast error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};