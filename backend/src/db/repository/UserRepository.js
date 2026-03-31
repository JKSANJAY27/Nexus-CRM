const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email, tenantId) {
    const sql = `SELECT * FROM users WHERE email = ? AND tenant_id = ?`;
    const result = await this.query(sql, [email, tenantId]);
    return result.rows[0] || null;
  }

  async findAllInTenant(tenantId) {
    return this.findAll(tenantId, '', [], 'name ASC');
  }
}

module.exports = new UserRepository();
