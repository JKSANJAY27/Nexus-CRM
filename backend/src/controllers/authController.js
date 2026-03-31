const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const pool     = require('../config/database');
const userRepo = require('../db/repository/UserRepository');
const { v4: uuidv4 } = require('uuid');

const signToken = (userId, tenantId, role) =>
  jwt.sign(
    { user_id: userId, tenant_id: tenantId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// POST /auth/register-tenant
const registerTenant = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { companyName, slug, adminName, adminEmail, adminPassword } = req.body;

    await client.query('BEGIN');

    // 1. Create the tenant
    const t_id = uuidv4();
    const tenantRes = await client.query(
      `INSERT INTO tenants (id, name, slug) VALUES (?, ?, ?) RETURNING *`,
      [t_id, companyName.trim(), slug.toLowerCase().trim()]
    );
    const tenant = tenantRes.rows[0];

    // 2. Hash password
    const rounds       = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const passwordHash = await bcrypt.hash(adminPassword, rounds);

    // 3. Create admin user for this tenant
    const u_id = uuidv4();
    const userRes = await client.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, name, role)
       VALUES (?, ?, ?, ?, ?, 'admin') RETURNING id, email, name, role`,
      [u_id, tenant.id, adminEmail.toLowerCase().trim(), passwordHash, adminName.trim()]
    );
    const user = userRes.rows[0];

    await client.query('COMMIT');

    const token = signToken(user.id, tenant.id, user.role);
    res.status(201).json({
      message: 'Tenant registered successfully',
      token,
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      user:   { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// POST /auth/login
const login = async (req, res, next) => {
  try {
    const { email, password, slug } = req.body;

    // Find tenant by slug
    const tenantRes = await pool.query(`SELECT * FROM tenants WHERE slug = ?`, [slug.toLowerCase().trim()]);
    if (!tenantRes.rows[0]) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const tenant = tenantRes.rows[0];

    // Find user within this tenant
    const user = await userRepo.findByEmail(email.toLowerCase().trim(), tenant.id);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user.id, tenant.id, user.role);
    res.json({
      token,
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      user:   { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// GET /auth/me
const getMe = async (req, res, next) => {
  try {
    const { userId, tenantId } = req.tenant;
    const user = await userRepo.findById(userId, tenantId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password_hash, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    next(err);
  }
};

module.exports = { registerTenant, login, getMe };
