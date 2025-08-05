const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const db = require('../db/pool');

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async performBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${timestamp}.sql`;
      const filepath = path.join(this.backupDir, filename);
      
      // Получаем параметры подключения
      const dbConfig = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      };
      
      // Команда для pg_dump
      const cmd = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -F c -f ${filepath} ${dbConfig.database}`;
      
      // Выполняем резервное копирование
      await new Promise((resolve, reject) => {
        const env = { ...process.env, PGPASSWORD: dbConfig.password };
        exec(cmd, { env }, (error, stdout, stderr) => {
          if (error) {
            logger.error(`Backup failed: ${stderr}`);
            return reject(error);
          }
          resolve();
        });
      });
      
      logger.info(`Backup created: ${filename}`);
      
      // Удаляем старые бэкапы (сохраняем последние 7)
      this.cleanupOldBackups();
      
      return filepath;
    } catch (err) {
      logger.error(`Backup error: ${err.message}`);
      throw err;
    }
  }

  cleanupOldBackups() {
    fs.readdir(this.backupDir, (err, files) => {
      if (err) {
        logger.error(`Backup cleanup error: ${err.message}`);
        return;
      }
      
      // Сортируем файлы по дате
      const sortedFiles = files
        .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
        .sort()
        .reverse();
      
      // Удаляем все кроме последних 7
      if (sortedFiles.length > 7) {
        const toDelete = sortedFiles.slice(7);
        toDelete.forEach(file => {
          fs.unlink(path.join(this.backupDir, file), err => {
            if (err) logger.error(`Error deleting backup ${file}: ${err.message}`);
          });
        });
      }
    });
  }

  async restoreBackup(filepath) {
    try {
      const dbConfig = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      };
      
      // Команда для pg_restore
      const cmd = `pg_restore -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -c ${filepath}`;
      
      // Выполняем восстановление
      await new Promise((resolve, reject) => {
        const env = { ...process.env, PGPASSWORD: dbConfig.password };
        exec(cmd, { env }, (error, stdout, stderr) => {
          if (error) {
            logger.error(`Restore failed: ${stderr}`);
            return reject(error);
          }
          resolve();
        });
      });
      
      logger.info(`Backup restored from: ${filepath}`);
      return true;
    } catch (err) {
      logger.error(`Restore error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = new BackupService();