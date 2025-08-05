const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const db = require('../db/pool');
const logger = require('./logger');

class TwoFactorService {
  async setup2FA(userId) {
    try {
      // Генерируем секрет
      const secret = speakeasy.generateSecret({
        name: `MotosparkCRM (${userId})`
      });
      
      // Генерируем QR-код
      const qrCode = await QRCode.toDataURL(secret.otpauth_url);
      
      // Сохраняем временный секрет
      await db.query(
        `UPDATE users 
         SET temp_2fa_secret = $1
         WHERE id = $2`,
        [secret.base32, userId]
      );
      
      return {
        secret: secret.base32,
        qrCode
      };
    } catch (err) {
      logger.error(`2FA setup error: ${err.message}`);
      throw err;
    }
  }

  async verify2FA(userId, token) {
    try {
      // Получаем секрет из БД
      const result = await db.query(
        `SELECT temp_2fa_secret, is_2fa_enabled, two_factor_secret 
         FROM users WHERE id = $1`,
        [userId]
      );
      
      if (!result.rows.length) {
        throw new Error('User not found');
      }
      
      const user = result.rows[0];
      const secret = user.temp_2fa_secret || user.two_factor_secret;
      
      // Проверяем токен
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token
      });
      
      // Если верификация успешна и это настройка - сохраняем секрет
      if (verified && user.temp_2fa_secret) {
        await db.query(
          `UPDATE users 
           SET two_factor_secret = $1, 
               temp_2fa_secret = NULL,
               is_2fa_enabled = true
           WHERE id = $2`,
          [user.temp_2fa_secret, userId]
        );
      }
      
      return verified;
    } catch (err) {
      logger.error(`2FA verification error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = new TwoFactorService();