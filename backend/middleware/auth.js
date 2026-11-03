const supabase = require('../lib/supabase');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Missing token' });
    }

    // Verify the token using Supabase client
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user to request for downstream handlers
    req.user = data.user;
    next();
  } catch (error) {
    console.error('Auth middleware error');
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

module.exports = {
  requireAuth
};
