const express = require('express');
const router = express.Router();
const warehousesController = require('../controllers/warehousesController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Добавление склада
router.post('/', 
  authMiddleware, 
  roleMiddleware(['admin', 'manager']), 
  warehousesController.addWarehouse
);

// Получение списка складов
router.get('/', 
  authMiddleware, 
  warehousesController.getWarehouses
);

// Обновление данных склада
router.put('/:id', 
  authMiddleware, 
  roleMiddleware(['admin', 'manager']), 
  warehousesController.updateWarehouse
);

module.exports = router;