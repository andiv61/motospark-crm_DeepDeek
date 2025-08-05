const TelegramBot = require('node-telegram-bot-api');
const logger = require('./logger');
const db = require('../db/pool');

class TelegramService {
  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
    this.setupHandlers();
  }

  setupHandlers() {
    // Обработчик входящих сообщений
    this.bot.on('message', async (msg) => {
      try {
        const chatId = msg.chat.id;
        const text = msg.text || '';
        
        // Ищем клиента по telegram_id
        const client = await db.query(
          'SELECT * FROM clients WHERE telegram_id = $1',
          [msg.from.id]
        );

        if (client.rows.length) {
          // Сохраняем входящее сообщение
          await db.query(
            `INSERT INTO chat_messages 
             (client_id, message, channel, direction)
             VALUES ($1, $2, 'telegram', 'in')`,
            [client.rows[0].id, text]
          );

          // Уведомляем оператора
          const wsServer = require('../index').app.locals.wsServer;
          wsServer.notifyUser(
            client.rows[0].manager_id || 1, 
            'new_chat_message', 
            { client_id: client.rows[0].id, message: text }
          );
        } else {
          // Новый клиент - отправляем ссылку для привязки
          this.bot.sendMessage(
            chatId,
            'Please register in our system first: [Registration Link]'
          );
        }
      } catch (err) {
        logger.error(`Telegram message error: ${err.message}`);
      }
    });
  }

  async sendMessage(telegramId, message) {
    try {
      await this.bot.sendMessage(telegramId, message);
      return true;
    } catch (err) {
      logger.error(`Telegram send error: ${err.message}`);
      return false;
    }
  }
}

module.exports = new TelegramService();