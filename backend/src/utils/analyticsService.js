const db = require('../db/pool');
const logger = require('./logger');
const { PythonShell } = require('python-shell');

class AnalyticsService {
  async getPurchaseRecommendations() {
    try {
      // 1. Получаем данные для анализа
      const data = await this.getAnalysisData();
      
      // 2. Запускаем Python-скрипт для ML-анализа
      const options = {
        mode: 'json',
        pythonOptions: ['-u'],
        scriptPath: path.join(__dirname, '../python_scripts'),
        args: [JSON.stringify(data)]
      };

      const results = await PythonShell.run('purchase_recommendations.py', options);
      
      // 3. Форматируем результаты
      return results.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        current_stock: item.current_stock,
        predicted_sales: item.predicted_sales,
        recommended_quantity: item.recommended_quantity,
        urgency: item.urgency // 'high', 'medium', 'low'
      }));
    } catch (err) {
      logger.error(`AI analysis error: ${err.message}`);
      throw err;
    }
  }

  async getAnalysisData() {
    const query = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.category,
        SUM(s.quantity) as current_stock,
        SUM(oi.quantity) as sales_3months,
        AVG(oi.price) as avg_price,
        EXTRACT(MONTH FROM CURRENT_DATE) as current_month
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      LEFT JOIN order_items oi ON p.id = oi.product_id 
        AND oi.created_at >= NOW() - INTERVAL '3 months'
      GROUP BY p.id, p.name, p.category
    `;
    
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = new AnalyticsService();