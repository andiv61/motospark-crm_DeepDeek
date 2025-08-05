const express = require('express');
const router = express.Router();
const emailsController = require('../controllers/emailsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Создание рассылки
router.post('/campaigns', 
  authMiddleware, 
  roleMiddleware(['admin', 'marketer']), 
  emailsController.createCampaign
);

// Запуск рассылки
router.post('/campaigns/:id/send', 
  authMiddleware, 
  roleMiddleware(['admin', 'marketer']), 
  emailsController.sendCampaign
);

// Получение истории рассылок
router.get('/campaigns', 
  authMiddleware, 
  emailsController.getCampaigns
);

module.exports = router;