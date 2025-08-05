const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Создание заказа
router.post('/', 
  authMiddleware, 
  ordersController.createOrder
);

// Изменение статуса заказа
router.put('/:id/status', 
  authMiddleware, 
  roleMiddleware(['admin', 'manager']), 
  ordersController.updateOrderStatus
);

// Получение заказов
router.get('/', 
  authMiddleware, 
  ordersController.getOrders
);

module.exports = router;