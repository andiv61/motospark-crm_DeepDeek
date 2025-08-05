const db = require('../db/pool');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

exports.createCampaign = async (req, res) => {
  try {
    const { name, template_id, segment_filters, price_settings } = req.body;
    
    const result = await db.query(
      `INSERT INTO email_campaigns 
       (name, template_id, segment_filters, price_settings, status, created_by)
       VALUES ($1, $2, $3, $4, 'draft', $5) RETURNING *`,
      [name, template_id, segment_filters, price_settings, req.user.id]
    );
    
    logger.info(`Campaign created: ${name}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error(`Error creating campaign: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

exports.sendCampaign = async (req, res) => {
  try {
    const campaignId = req.params.id;
    
    // 1. Получаем кампанию
    const campaign = await db.query(
      'SELECT * FROM email_campaigns WHERE id = $1',
      [campaignId]
    );
    
    if (!campaign.rows.length) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // 2. Получаем клиентов по сегменту
    const clients = await getClientsBySegment(campaign.rows[0].segment_filters);
    
    // 3. Отправляем письма
    const results = await emailService.sendBulkEmails(
      clients,
      campaign.rows[0].template_id,
      campaign.rows[0].price_settings
    );
    
    // 4. Обновляем статус кампании
    await db.query(
      `UPDATE email_campaigns 
       SET status = 'sent', sent_at = NOW(), recipients_count = $1
       WHERE id = $2`,
      [results.sentCount, campaignId]
    );
    
    logger.info(`Campaign sent: ${campaignId}. Sent: ${results.sentCount}`);
    res.json({ message: 'Campaign sent', ...results });
  } catch (err) {
    logger.error(`Error sending campaign: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

async function getClientsBySegment(filters) {
  let query = 'SELECT * FROM clients WHERE 1=1';
  const params = [];
  
  if (filters.client_type) {
    query += ` AND type = $${params.length + 1}`;
    params.push(filters.client_type);
  }
  
  if (filters.region) {
    query += ` AND region = $${params.length + 1}`;
    params.push(filters.region);
  }
  
  if (filters.min_orders) {
    query += ` AND orders_count >= $${params.length + 1}`;
    params.push(filters.min_orders);
  }
  
  const result = await db.query(query, params);
  return result.rows;
}