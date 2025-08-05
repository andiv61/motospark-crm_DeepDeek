const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Основные метрики
router.get('/metrics', 
  authMiddleware, 
  analyticsController.getDashboardMetrics
);

// Прогнозирование продаж
router.get('/forecast', 
  authMiddleware, 
  roleMiddleware(['admin', 'analyst']), 
  analyticsController.getSalesForecast
);

// Рекомендации по закупкам
router.get('/recommendations', 
  authMiddleware, 
  roleMiddleware(['admin', 'manager']), 
  analyticsController.getPurchaseRecommendations
);

module.exports = router;