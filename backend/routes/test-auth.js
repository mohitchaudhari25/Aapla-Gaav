const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, (req, res) => {
  // Return ONLY the authenticated user's verified ID
  res.json({
    message: 'Authentication successful',
    userId: req.user.id
  });
});

module.exports = router;
