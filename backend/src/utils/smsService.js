const axios = require('axios');
const logger = require('./logger');
const db = require('../db/pool');

class SmsService {
  constructor() {
    this.apiKey = process.env.SMS_API_KEY;
    this.sender = process.env.SMS_SENDER || 'Motospark';
  }

  async sendSms(phone, message) {
    try {
      if (!this.apiKey) {
        throw new Error('SMS API key not configured');
      }
      
      const response = await axios.post(
        'https://smsprovider.com/api/v1/send',
        {
          phone,
          message,
          sender: this.sender
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      logger.info(`SMS sent to ${phone}, status: ${response.data.status}`);
      return true;
    } catch (err) {
      logger.error(`SMS send error: ${err.message}`);
      throw err;
    }
  }

  async sendBulkSms(clientIds, message) {
    try {
      // Получаем телефоны клиентов
      const result = await db.query(
        `SELECT phone FROM clients 
         WHERE id = ANY($1) AND phone IS NOT NULL`,
        [clientIds]
      );
      
      if (!result.rows.length) {
        throw new Error('No valid phone numbers found');
      }
      
      // Отправляем SMS каждому клиенту
      const promises = result.rows.map(client => 
        this.sendSms(client.phone, message)
      );
      
      const results = await Promise.allSettled(promises);
      
      // Анализ результатов
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      logger.info(`Bulk SMS sent: ${successful} successful, ${failed} failed`);
      
      return {
        total: result.rows.length,
        successful,
        failed
      };
    } catch (err) {
      logger.error(`Bulk SMS error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = new SmsService();