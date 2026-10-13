const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

const requireRole = (allowedRoles) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    // Create a Supabase client using the authenticated user's token
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    const { id } = req.user;
    
    // Fetch profile using the user's own RLS context
    const { data: profile, error } = await userSupabase
      .from('profiles')
      .select('role, village_id')
      .eq('id', id)
      .single();

    if (error || !profile) {
      return res.status(403).json({ error: 'Access denied: Profile not found or restricted by RLS' });
    }

    // Default to 'citizen' if role is null/undefined
    const userRole = profile.role || 'citizen';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
    }

    // Attach profile data for downstream use
    req.user.role = userRole;
    req.user.village_id = profile.village_id;
    next();
  } catch (err) {
    console.error('Role middleware error:', err.message);
    res.status(500).json({ error: 'Internal server error during authorization' });
  }
};

module.exports = { requireRole };
