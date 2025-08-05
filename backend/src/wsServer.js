const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const db = require('./db/pool');
const logger = require('./utils/logger');

class WsServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map();
    this.setupConnectionHandlers();
  }

  setupConnectionHandlers() {
    this.wss.on('connection', (ws, req) => {
      // Аутентификация по токену из query параметра
      const token = req.url.split('token=')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        this.authenticateClient(ws, decoded.id);
      } catch (err) {
        logger.error(`WS auth failed: ${err.message}`);
        ws.close(1008, 'Authentication failed');
      }
    });
  }

  async authenticateClient(ws, userId) {
    try {
      const user = await db.query(
        'SELECT id, email, role FROM users WHERE id = $1',
        [userId]
      );

      if (user.rows.length) {
        this.clients.set(userId, ws);
        logger.info(`WS client connected: ${userId}`);
        
        ws.on('close', () => {
          this.clients.delete(userId);
          logger.info(`WS client disconnected: ${userId}`);
        });
      } else {
        ws.close(1008, 'User not found');
      }
    } catch (err) {
      logger.error(`WS auth error: ${err.message}`);
      ws.close(1011, 'Internal error');
    }
  }

  notifyUser(userId, event, data) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, data }));
    }
  }

  broadcastToRole(role, event, data) {
    this.clients.forEach((ws, userId) => {
      // Здесь должна быть проверка роли пользователя
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event, data }));
      }
    });
  }
}

module.exports = WsServer;