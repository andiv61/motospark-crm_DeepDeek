const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../utils/multerConfig');

// Ручной импорт из Excel
router.post('/manual', 
  authMiddleware, 
  roleMiddleware(['admin', 'manager']), 
  upload.single('file'), 
  importController.manualImport
);

// Настройка автоматического импорта
router.post('/auto', 
  authMiddleware, 
  roleMiddleware(['admin']), 
  importController.setupAutoImport
);

module.exports = router;