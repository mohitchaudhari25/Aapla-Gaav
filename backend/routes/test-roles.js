const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.get('/admin-only', requireAuth, requireRole(['admin', 'super_admin']), (req, res) => {
  res.json({
    message: 'Welcome Admin!',
    role: req.user.role,
    village_id: req.user.village_id
  });
});

router.get('/citizen-only', requireAuth, requireRole(['citizen']), (req, res) => {
  res.json({
    message: 'Welcome Citizen!',
    role: req.user.role
  });
});

module.exports = router;
