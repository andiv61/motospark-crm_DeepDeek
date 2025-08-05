const db = require('../db/pool');
const logger = require('./logger');

class DbOptimizationService {
  async refreshMaterializedViews() {
    try {
      logger.info('Refreshing materialized views...');
      
      // Обновляем представления
      await db.query('REFRESH MATERIALIZED VIEW CONCURRENTLY client_summary');
      await db.query('REFRESH MATERIALIZED VIEW CONCURRENTLY sales_summary');
      
      logger.info('Materialized views refreshed successfully');
    } catch (err) {
      logger.error(`Error refreshing materialized views: ${err.message}`);
    }
  }
  
  async performNightlyMaintenance() {
    try {
      logger.info('Starting nightly database maintenance...');
      
      // 1. Обновляем материализованные представления
      await this.refreshMaterializedViews();
      
      // 2. Перестраиваем индексы
      await this.rebuildIndexes();
      
      // 3. Очищаем старые данные
      await this.cleanupOldData();
      
      logger.info('Nightly database maintenance completed');
    } catch (err) {
      logger.error('Nightly maintenance failed', err);
    }
  }
  
  async rebuildIndexes() {
    try {
      logger.info('Rebuilding indexes...');
      
      // Получаем список всех таблиц
      const tables = await db.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
      );
      
      // Перестраиваем индексы для каждой таблицы
      for (const table of tables.rows) {
        await db.query(`REINDEX TABLE ${table.tablename}`);
      }
      
      logger.info('Indexes rebuilt successfully');
    } catch (err) {
      logger.error(`Error rebuilding indexes: ${err.message}`);
    }
  }
  
  async cleanupOldData() {
    try {
      logger.info('Cleaning up old data...');
      
      // Удаляем старые логи (старше 3 месяцев)
      await db.query(
        `DELETE FROM import_logs WHERE created_at < NOW() - INTERVAL '3 months'`
      );
      
      // Удаляем старые сообщения чата (старше 6 месяцев)
      await db.query(
        `DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '6 months'`
      );
      
      logger.info('Old data cleanup completed');
    } catch (err) {
      logger.error(`Error cleaning up old data: ${err.message}`);
    }
  }
}

module.exports = new DbOptimizationService();