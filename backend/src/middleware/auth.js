/**
 * JWT Authentication & Tenant Extraction Middleware
 * ==================================================
 * This middleware is the GATEKEEPER for all protected routes.
 *
 * It rejects requests that:
 *   - Have no Authorization header / Bearer token
 *   - Have an expired or tampered JWT
 *   - Have a token missing tenant_id (cannot fulfill isolation guarantee)
 *
 * On success it attaches req.tenant = { userId, tenantId, role }
 * which is then used by every controller and repository.
 */

const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Hard requirement: tenant_id MUST be in the token
    if (!decoded.tenant_id) {
      return res.status(401).json({ error: 'Token missing tenant context' });
    }

    // Attach tenant context to the request — available to all downstream
    req.tenant = {
      userId:   decoded.user_id,
      tenantId: decoded.tenant_id,
      role:     decoded.role || 'member',
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Role-based access control middleware factory.
 * Usage: router.post('/users', auth, requireRole('admin'), handler)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.tenant) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (!roles.includes(req.tenant.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

module.exports = { auth, requireRole };
