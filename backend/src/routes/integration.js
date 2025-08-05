const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Экспорт данных в 1С
router.get('/export/1c', 
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  integrationController.exportTo1C
);

// Импорт данных из 1С
router.post('/import/1c', 
  authMiddleware,
  roleMiddleware(['admin']),
  integrationController.importFrom1C
);

// Проверка соединения с 1С
router.get('/check/1c', 
  authMiddleware,
  roleMiddleware(['admin']),
  integrationController.check1CConnection
);

module.exports = router;