const db = require('../db/pool');
const logger = require('../utils/logger');
const wsServer = require('../index').app.locals.wsServer;

exports.sendMessage = async (req, res) => {
  try {
    const { client_id, message, channel } = req.body;
    const user_id = req.user.id;
    const attachments = req.files?.map(file => file.path) || [];

    // Сохраняем сообщение в БД
    const result = await db.query(
      `INSERT INTO chat_messages 
       (client_id, user_id, message, channel, attachments, direction)
       VALUES ($1, $2, $3, $4, $5, 'out')
       RETURNING *`,
      [client_id, user_id, message, channel, attachments]
    );

    // Отправляем через выбранный канал
    await this.sendViaChannel(client_id, result.rows[0], channel);

    // Уведомляем клиента через WebSocket
    wsServer.notifyUser(client_id, 'new_message', result.rows[0]);

    logger.info(`Message sent to client ${client_id} via ${channel}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error(`Error sending message: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

exports.sendViaChannel = async (clientId, message, channel) => {
  try {
    const client = await db.query(
      'SELECT * FROM clients WHERE id = $1',
      [clientId]
    );

    if (!client.rows.length) {
      throw new Error('Client not found');
    }

    switch (channel) {
      case 'whatsapp':
        await whatsappService.sendMessage(client.rows[0].phone, message.message);
        break;
      case 'telegram':
        await telegramService.sendMessage(client.rows[0].telegram_id, message.message);
        break;
      case 'email':
        await emailService.sendEmail(
          client.rows[0].email,
          'New Message from Support',
          message.message
        );
        break;
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  } catch (err) {
    logger.error(`Channel send error: ${err.message}`);
    throw err;
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const { clientId } = req.params;
    const result = await db.query(
      `SELECT * FROM chat_messages 
       WHERE client_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [clientId]
    );

    res.json(result.rows);
  } catch (err) {
    logger.error(`Error getting chat history: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};