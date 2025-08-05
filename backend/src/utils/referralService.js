const db = require('../db/pool');
const logger = require('./logger');

class ReferralService {
  async generateReferralCode(clientId) {
    try {
      // Проверяем, есть ли уже код
      const existing = await db.query(
        'SELECT code FROM referrals WHERE client_id = $1',
        [clientId]
      );
      
      if (existing.rows.length) {
        return existing.rows[0].code;
      }
      
      // Генерируем уникальный код
      const code = this.generateRandomCode(8);
      
      // Сохраняем в БД
      await db.query(
        `INSERT INTO referrals (client_id, code)
         VALUES ($1, $2)`,
        [clientId, code]
      );
      
      return code;
    } catch (err) {
      logger.error(`Generate referral code error: ${err.message}`);
      throw err;
    }
  }
  
  generateRandomCode(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  async processReferral(referralCode, newClientId) {
    try {
      // Находим реферера по коду
      const referrer = await db.query(
        'SELECT client_id FROM referrals WHERE code = $1',
        [referralCode]
      );
      
      if (!referrer.rows.length) {
        throw new Error('Invalid referral code');
      }
      
      const referrerId = referrer.rows[0].client_id;
      
      // Начисляем бонусы рефереру
      await db.query(
        `INSERT INTO loyalty_points 
         (client_id, points, reason)
         VALUES ($1, $2, 'Referral bonus')`,
        [referrerId, 1000] // 1000 бонусных баллов
      );
      
      // Начисляем бонусы новому клиенту
      await db.query(
        `INSERT INTO loyalty_points 
         (client_id, points, reason)
         VALUES ($1, $2, 'Welcome bonus')`,
        [newClientId, 500] // 500 бонусных баллов
      );
      
      // Обновляем общее количество баллов
      await db.query(
        'UPDATE clients SET loyalty_points = loyalty_points + $1 WHERE id = $2',
        [1000, referrerId]
      );
      
      await db.query(
        'UPDATE clients SET loyalty_points = loyalty_points + $1 WHERE id = $2',
        [500, newClientId]
      );
      
      logger.info(`Referral processed: ${referralCode} for client ${newClientId}`);
    } catch (err) {
      logger.error(`Process referral error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = new ReferralService();