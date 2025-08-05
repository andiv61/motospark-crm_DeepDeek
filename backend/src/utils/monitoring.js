const promClient = require('prom-client');
const logger = require('./logger');

class MonitoringService {
  constructor() {
    this.collectDefaultMetrics();
    this.customMetrics = {
      httpRequests: new promClient.Counter({
        name: 'http_requests_total',
        help: 'Total HTTP requests',
        labelNames: ['method', 'route', 'status']
      }),
      dbQueryDuration: new promClient.Histogram({
        name: 'db_query_duration_seconds',
        help: 'Database query duration in seconds',
        labelNames: ['query']
      }),
      wsConnections: new promClient.Gauge({
        name: 'websocket_connections',
        help: 'Current WebSocket connections count'
      })
    };
  }

  collectDefaultMetrics() {
    promClient.collectDefaultMetrics({
      timeout: 5000,
      prefix: 'motospark_'
    });
  }

  trackRequest(req, res, time) {
    const route = req.route?.path || req.url;
    this.customMetrics.httpRequests.inc({
      method: req.method,
      route,
      status: res.statusCode
    });
  }

  trackDbQuery(query, duration) {
    this.customMetrics.dbQueryDuration.observe(
      { query: this.sanitizeQuery(query) },
      duration
    );
  }

  sanitizeQuery(query) {
    return query.replace(/'.*?'/g, '?').replace(/\s+/g, ' ');
  }

  getMetrics() {
    return promClient.register.metrics();
  }
}

module.exports = new MonitoringService();