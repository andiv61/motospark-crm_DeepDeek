const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const excelParser = require('./excelParser');
const db = require('../db/pool');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.imap = new Imap({
      user: process.env.IMAP_USER,
      password: process.env.IMAP_PASSWORD,
      host: process.env.IMAP_HOST,
      port: process.env.IMAP_PORT,
      tls: true
    });
  }

  async checkEmailsForStockFiles() {
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        this.imap.openBox('INBOX', false, (err, box) => {
          if (err) return reject(err);
          
          const searchCriteria = ['UNSEEN', ['SUBJECT', 'Stock Update']];
          const fetchOptions = { bodies: ['HEADER', 'TEXT', ''], markSeen: true };
          
          this.imap.search(searchCriteria, (err, results) => {
            if (err) return reject(err);
            
            const files = [];
            const f = this.imap.fetch(results, fetchOptions);
            
            f.on('message', (msg) => {
              msg.on('body', async (stream, info) => {
                const mail = await simpleParser(stream);
                
                if (mail.attachments.length > 0) {
                  for (const attachment of mail.attachments) {
                    const filePath = `./temp/${attachment.filename}`;
                    fs.writeFileSync(filePath, attachment.content);
                    files.push(filePath);
                  }
                }
              });
            });
            
            f.once('end', () => {
              this.imap.end();
              resolve(files);
            });
          });
        });
      });
      
      this.imap.once('error', reject);
      this.imap.connect();
    });
  }

  async processAutoImport() {
    try {
      const files = await this.checkEmailsForStockFiles();
      const importResults = [];
      
      for (const file of files) {
        try {
          // Получаем маппинг из настроек
          const mapping = await db.query(
            'SELECT mapping FROM import_settings WHERE is_active = true'
          );
          
          if (!mapping.rows.length) {
            throw new Error('No active import mapping found');
          }
          
          const products = await excelParser.parseStockFile(
            file,
            mapping.rows[0].mapping
          );
          
          await updateStock(products);
          
          importResults.push({
            file: file,
            items: products.length,
            status: 'success'
          });
          
          logger.info(`Auto import from ${file}: ${products.length} items`);
        } catch (err) {
          importResults.push({
            file: file,
            error: err.message,
            status: 'failed'
          });
          logger.error(`Auto import error (${file}): ${err.message}`);
        }
      }
      
      return importResults;
    } catch (err) {
      logger.error(`Email check error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = new EmailService();