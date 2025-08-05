require('dotenv').config();
const express = require('express');
const cors = require('cors');
const promClient = require('prom-client');
const app = express();
const db = require('./db/pool');

// Инициализация сервисов
require('./utils/monitoring');
const wsServer = require('./wsServer');
const telegramService = require('./utils/telegramService');
const backupService = require('./utils/backupService');
const scheduler = require('./utils/scheduler');
const setupSwagger = require('./utils/swagger');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Безопасность
const { securityMiddleware, apiLimiter, authLimiter } = require('./security');
app.use(securityMiddleware);
app.use('/api/', apiLimiter);

// Подключение к базе данных
db.connect()
  .then(() => {
    logger.info('Database connected');
    
    // Инициализация планировщика
    scheduler.init();
    
    // Настройка WebSocket
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
    
    // Инициализация WebSocket сервера
    new wsServer(server);
    
    // Настройка резервного копирования (ежедневно в 2:00)
    cron.schedule('0 2 * * *', () => {
      backupService.performBackup().catch(() => {});
    });
  })
  .catch(err => {
    logger.error(`Database connection failed: ${err.message}`);
    process.exit(1);
  });

// Маршруты
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/products', require('./routes/products'));
app.use('/api/warehouses', require('./routes/warehouses'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/emails', require('./routes/emails'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/import', require('./routes/import'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/loyalty', require('./routes/loyalty'));
app.use('/api/integration', require('./routes/integration'));

// Документация API
setupSwagger(app);

// Мониторинг
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// Обработка ошибок
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.stack}`);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;