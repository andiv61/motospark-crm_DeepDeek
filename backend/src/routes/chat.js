const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../utils/multerConfig');

// Отправка сообщения
router.post('/send', 
  authMiddleware,
  upload.array('attachments', 3),
  chatController.sendMessage
);

// Получение истории чата
router.get('/history/:clientId', 
  authMiddleware,
  chatController.getChatHistory
);

// Получение непрочитанных сообщений
router.get('/unread', 
  authMiddleware,
  chatController.getUnreadMessages
);

// Маркировка сообщений как прочитанных
router.post('/mark-read', 
  authMiddleware,
  chatController.markMessagesAsRead
);

module.exports = router;