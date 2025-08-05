const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../utils/multerConfig');

// CRUD для продуктов
router.post('/', 
  authMiddleware, 
  roleMiddleware(['admin', 'manager']), 
  upload.single('image'), 
  productsController.createProduct
);

router.get('/', authMiddleware, productsController.getProducts);
router.get('/:id', authMiddleware, productsController.getProductById);
router.put('/:id', 
  authMiddleware, 
  roleMiddleware(['admin', 'manager']), 
  upload.single('image'), 
  productsController.updateProduct
);

// Получение остатков по складам
router.get('/:id/stock', 
  authMiddleware, 
  productsController.getProductStock
);

module.exports = router;