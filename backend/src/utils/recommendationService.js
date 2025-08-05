const db = require('../db/pool');
const logger = require('./logger');
const analyticsService = require('./analyticsService');

class RecommendationService {
  async generateForClient(clientId) {
    try {
      // 1. Получаем данные клиента
      const client = await db.query(
        'SELECT * FROM clients WHERE id = $1',
        [clientId]
      );
      
      if (!client.rows.length) {
        throw new Error('Client not found');
      }
      
      // 2. Получаем историю заказов
      const orderHistory = await db.query(
        `SELECT p.id, p.name, p.category, oi.quantity, oi.price
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         JOIN products p ON oi.product_id = p.id
         WHERE o.client_id = $1`,
        [clientId]
      );
      
      // 3. Анализируем предпочтения
      const preferences = this.analyzePreferences(orderHistory.rows);
      
      // 4. Получаем рекомендуемые товары
      const recommendations = await this.getRecommendedProducts(preferences);
      
      // 5. Применяем персонализацию цен
      const personalized = this.applyPersonalization(recommendations, client.rows[0]);
      
      return personalized;
    } catch (err) {
      logger.error(`Recommendation error: ${err.message}`);
      throw err;
    }
  }
  
  analyzePreferences(orders) {
    // Анализ категорий и брендов
    const categoryCount = {};
    const brandCount = {};
    
    orders.forEach(item => {
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      // Анализ бренда (если есть в названии)
      const brandMatch = item.name.match(/(\w+)/);
      if (brandMatch) {
        const brand = brandMatch[1];
        brandCount[brand] = (brandCount[brand] || 0) + 1;
      }
    });
    
    // Определение топ-3 категорий
    const topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(item => item[0]);
    
    // Определение топ-брендов
    const topBrands = Object.entries(brandCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(item => item[0]);
    
    return { topCategories, topBrands };
  }
  
  async getRecommendedProducts(preferences) {
    const { topCategories, topBrands } = preferences;
    
    // Получаем товары из любимых категорий
    const categoryProducts = await db.query(
      `SELECT p.*, s.quantity 
       FROM products p
       JOIN stock s ON p.id = s.product_id
       WHERE p.category = ANY($1)
       ORDER BY RANDOM()
       LIMIT 5`,
      [topCategories]
    );
    
    // Получаем товары любимых брендов
    const brandProducts = await db.query(
      `SELECT p.*, s.quantity 
       FROM products p
       JOIN stock s ON p.id = s.product_id
       WHERE p.name ~* $1
       ORDER BY RANDOM()
       LIMIT 3`,
      [`(${topBrands.join('|')})`]
    );
    
    // Объединяем результаты
    return [...categoryProducts.rows, ...brandProducts.rows];
  }
  
  applyPersonalization(products, client) {
    // Применяем скидки в зависимости от типа клиента
    return products.map(product => {
      const personalized = { ...product };
      
      // Оптовые клиенты получают скидку 5-15%
      if (client.type === 'wholesale') {
        const discount = 5 + Math.floor(Math.random() * 10);
        personalized.discount = discount;
        personalized.personalized_price = product.price * (1 - discount / 100);
      }
      // VIP клиенты получают дополнительную скидку
      else if (client.segment === 'vip') {
        const discount = 10 + Math.floor(Math.random() * 10);
        personalized.discount = discount;
        personalized.personalized_price = product.price * (1 - discount / 100);
      } else {
        personalized.personalized_price = product.price;
      }
      
      return personalized;
    });
  }
}

module.exports = new RecommendationService();