const express = require('express');
const router = express.Router();
const loyaltyController = require('../controllers/loyaltyController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Начисление баллов
router.post('/points', 
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  loyaltyController.addPoints
);

// Списание баллов
router.post('/redeem', 
  authMiddleware,
  loyaltyController.redeemPoints
);

// Получение информации о лояльности
router.get('/:clientId', 
  authMiddleware,
  loyaltyController.getLoyaltyInfo
);

// Установка правил лояльности
router.post('/rules', 
  authMiddleware,
  roleMiddleware(['admin']),
  loyaltyController.setLoyaltyRules
);

module.exports = router;