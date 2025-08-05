const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { check } = require('express-validator');

router.post('/login', [
  check('email').isEmail(),
  check('password').notEmpty()
], authController.login);

router.post('/refresh', authController.refreshToken);

router.post('/logout', 
  authController.authenticate, 
  authController.logout
);

module.exports = router;