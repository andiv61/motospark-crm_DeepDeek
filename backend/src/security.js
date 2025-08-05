const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, query } = require('express-validator');

const securityMiddleware = [
  helmet(),
  helmet.hsts({
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true
  }),
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
      fontSrc: ["'self'"]
    }
  })
];

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: 'Too many requests from this IP, please try again later'
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many login attempts, please try again later'
});

const inputValidation = {
  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 })
  ],
  search: [
    query('query').trim().escape()
  ]
};

module.exports = {
  securityMiddleware,
  apiLimiter,
  authLimiter,
  inputValidation
};