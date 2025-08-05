const db = require('../db/pool');
const logger = require('./logger');

class ReportService {
  async performABCXYZAnalysis() {
    try {
      // Получаем данные о продажах
      const salesData = await db.query(`
        SELECT
          p.id,
          p.name,
          p.category,
          SUM(oi.quantity) AS total_quantity,
          SUM(oi.quantity * oi.price) AS total_revenue,
          COUNT(DISTINCT o.id) AS order_count
        FROM products p
        JOIN order_items oi ON p.id = oi.product_id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at > NOW() - INTERVAL '6 months'
        GROUP BY p.id, p.name, p.category
      `);
      
      // Рассчитываем ABC анализ (по выручке)
      const abcResults = this.calculateABC(salesData.rows, 'total_revenue');
      
      // Рассчитываем XYZ анализ (по стабильности спроса)
      const xyzResults = this.calculateXYZ(salesData.rows);
      
      // Объединяем результаты
      const combined = salesData.rows.map(product => ({
        ...product,
        abc_class: abcResults.find(p => p.id === product.id)?.class || '',
        xyz_class: xyzResults.find(p => p.id === product.id)?.class || ''
      }));
      
      return combined;
    } catch (err) {
      logger.error(`ABC-XYZ analysis error: ${err.message}`);
      throw err;
    }
  }
  
  calculateABC(products, field = 'total_revenue') {
    // Сортируем по убыванию выручки
    const sorted = [...products].sort((a, b) => b[field] - a[field]);
    
    // Рассчитываем накопленный процент
    const total = sorted.reduce((sum, p) => sum + p[field], 0);
    let cumulative = 0;
    
    return sorted.map(product => {
      cumulative += product[field];
      const percentage = (cumulative / total) * 100;
      
      let abcClass = 'C';
      if (percentage <= 80) abcClass = 'A';
      else if (percentage <= 95) abcClass = 'B';
      
      return {
        id: product.id,
        name: product.name,
        value: product[field],
        percentage: (product[field] / total) * 100,
        cumulative_percentage: percentage,
        class: abcClass
      };
    });
  }
  
  calculateXYZ(products) {
    // Рассчитываем коэффициент вариации спроса
    const demandVariability = await this.calculateDemandVariability();
    
    return products.map(product => {
      const variability = demandVariability[product.id] || 0;
      
      let xyzClass = 'Z'; // Высокая вариабельность
      if (variability <= 10) xyzClass = 'X'; // Стабильный спрос
      else if (variability <= 25) xyzClass = 'Y'; // Средняя вариабельность
      
      return {
        id: product.id,
        name: product.name,
        variability,
        class: xyzClass
      };
    });
  }
  
  async calculateDemandVariability() {
    // Рассчитываем вариабельность спроса по месяцам
    const result = await db.query(`
      SELECT
        p.id,
        STDDEV_POP(monthly_sales) AS stddev,
        AVG(monthly_sales) AS avg
      FROM (
        SELECT
          oi.product_id,
          DATE_TRUNC('month', o.created_at) AS month,
          SUM(oi.quantity) AS monthly_sales
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at > NOW() - INTERVAL '1 year'
        GROUP BY oi.product_id, month
      ) monthly
      JOIN products p ON monthly.product_id = p.id
      GROUP BY p.id
    `);
    
    // Рассчитываем коэффициент вариации (CV)
    const variability = {};
    result.rows.forEach(row => {
      variability[row.id] = row.avg > 0 ? (row.stddev / row.avg) * 100 : 0;
    });
    
    return variability;
  }
}

module.exports = new ReportService();