const cron = require('node-cron');
const emailService = require('./emailService');
const analyticsService = require('./analyticsService');
const logger = require('./logger');

class Scheduler {
  init() {
    // Ежедневная проверка email для импорта в 8:00
    cron.schedule('0 8 * * *', async () => {
      try {
        logger.info('Running scheduled email import');
        await emailService.processAutoImport();
      } catch (err) {
        logger.error(`Scheduled import error: ${err.message}`);
      }
    });

    // Еженедельный AI анализ по понедельникам в 9:00
    cron.schedule('0 9 * * 1', async () => {
      try {
        logger.info('Running weekly AI analysis');
        const recommendations = await analyticsService.getPurchaseRecommendations();
        
        // Отправка уведомления админам
        await emailService.sendAdminNotification(
          'Weekly Purchase Recommendations',
          JSON.stringify(recommendations, null, 2)
        );
      } catch (err) {
        logger.error(`Scheduled analysis error: ${err.message}`);
      }
    });
  }
}

module.exports = new Scheduler();