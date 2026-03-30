const userRepo    = require('../db/repository/UserRepository');
const bcrypt      = require('bcryptjs');

// GET /users
const getUsers = async (req, res, next) => {
  try {
    const users = await userRepo.findAllInTenant(req.tenant.tenantId);
    const safe  = users.map(({ password_hash, ...u }) => u);
    res.json(safe);
  } catch (err) { next(err); }
};

// POST /users  (admin only)
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role = 'member' } = req.body;
    const rounds       = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const passwordHash = await bcrypt.hash(password, rounds);
    const user = await userRepo.create(req.tenant.tenantId, {
      name:          name.trim(),
      email:         email.toLowerCase().trim(),
      password_hash: passwordHash,
      role,
    });
    const { password_hash, ...safe } = user;
    res.status(201).json(safe);
  } catch (err) { next(err); }
};

module.exports = { getUsers, createUser };
