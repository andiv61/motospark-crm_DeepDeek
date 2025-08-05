CREATE TABLE warehouses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('own', 'partner')),
  location VARCHAR(255) NOT NULL,
  delivery_time INTEGER NOT NULL,
  contacts TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  article VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock (
  product_id INTEGER REFERENCES products(id),
  warehouse_id INTEGER REFERENCES warehouses(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(10, 2),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, warehouse_id)
);

CREATE TABLE import_logs (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  items_count INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER
);

-- Другие таблицы: clients, orders, email_campaigns и т.д.
-- Таблица для хранения этапов заказов
CREATE TABLE order_statuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false
);

-- История статусов заказа
CREATE TABLE order_status_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  status VARCHAR(100) NOT NULL,
  comment TEXT,
  changed_by INTEGER REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Шаблоны писем
CREATE TABLE email_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Рассылки
CREATE TABLE email_campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  template_id INTEGER REFERENCES email_templates(id),
  segment_filters JSONB NOT NULL,
  price_settings JSONB,
  status VARCHAR(50) NOT NULL,
  recipients_count INTEGER,
  sent_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Настройки импорта
CREATE TABLE import_settings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mapping JSONB NOT NULL,
  email_filters JSONB,
  warehouse_id INTEGER REFERENCES warehouses(id),
  is_active BOOLEAN DEFAULT false,
  last_import TIMESTAMP
);
-- Таблица для хранения метрик
CREATE TABLE analytics_metrics (
  id SERIAL PRIMARY KEY,
  metric_date DATE NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  value DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Подписки на Telegram уведомления
CREATE TABLE telegram_subscriptions (
  user_id INTEGER PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем поле для Telegram ID в users
ALTER TABLE users ADD COLUMN telegram_id INTEGER;

-- Индекс для ускорения аналитических запросов
CREATE INDEX idx_analytics_metric_date ON analytics_metrics(metric_date);
CREATE INDEX idx_analytics_metric_type ON analytics_metrics(metric_type);
-- Расширение таблицы клиентов
ALTER TABLE clients ADD COLUMN phone VARCHAR(20);
ALTER TABLE clients ADD COLUMN address TEXT;
ALTER TABLE clients ADD COLUMN notes TEXT;

-- Таблица для хранения активностей клиентов
CREATE TABLE client_activity_stats (
  client_id INTEGER REFERENCES clients(id),
  period DATE NOT NULL,
  order_count INTEGER NOT NULL DEFAULT 0,
  total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  PRIMARY KEY (client_id, period)
);

-- Материализованное представление для быстрого анализа клиентов
CREATE MATERIALIZED VIEW client_segments AS
SELECT 
  c.id,
  c.name,
  c.type,
  COUNT(o.id) as order_count,
  SUM(o.total_amount) as total_spent,
  MAX(o.created_at) as last_order_date,
  CASE 
    WHEN SUM(o.total_amount) > 10000 THEN 'vip'
    WHEN COUNT(o.id) > 5 THEN 'active'
    WHEN MAX(o.created_at) < NOW() - INTERVAL '90 days' THEN 'inactive'
    ELSE 'regular'
  END as segment
FROM clients c
LEFT JOIN orders o ON c.id = o.client_id
GROUP BY c.id, c.name, c.type;

-- Индекс для ускорения обновления
CREATE UNIQUE INDEX idx_client_segments ON client_segments(id);
-- Материализованное представление для быстрого доступа к данным о клиентах
CREATE MATERIALIZED VIEW client_summary AS
SELECT
  c.id,
  c.name,
  c.email,
  c.phone,
  c.type,
  COUNT(o.id) AS total_orders,
  SUM(o.total_amount) AS total_spent,
  MAX(o.created_at) AS last_order_date,
  (SELECT COUNT(*) FROM chat_messages WHERE client_id = c.id) AS message_count
FROM clients c
LEFT JOIN orders o ON c.id = o.client_id
GROUP BY c.id;

-- Индекс для ускорения обновления
CREATE UNIQUE INDEX idx_client_summary ON client_summary(id);

-- Материализованное представление для аналитики продаж
CREATE MATERIALIZED VIEW sales_summary AS
SELECT
  DATE_TRUNC('day', o.created_at) AS sale_date,
  p.category,
  SUM(oi.quantity) AS total_quantity,
  SUM(oi.quantity * oi.price) AS total_revenue
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
GROUP BY sale_date, p.category;

-- Индекс для ускорения обновления
CREATE INDEX idx_sales_summary_date ON sales_summary(sale_date);