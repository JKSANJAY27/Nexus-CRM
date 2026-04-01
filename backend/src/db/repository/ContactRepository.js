const BaseRepository = require('./BaseRepository');

class ContactRepository extends BaseRepository {
  constructor() {
    super('contacts');
  }

  async findByStatus(tenantId, status) {
    return this.findAll(tenantId, 'AND status = $2', [status]);
  }

  async searchContacts(tenantId, searchTerm) {
    const sql = `
      SELECT * FROM contacts
      WHERE tenant_id = $1
      AND (name ILIKE $2 OR email ILIKE $2 OR company ILIKE $2)
      ORDER BY name ASC
    `;
    const result = await this.query(sql, [tenantId, `%${searchTerm}%`]);
    return result.rows;
  }

  async findWithDealsCount(tenantId) {
    const sql = `
      SELECT c.*,
             COUNT(d.id)::int AS deals_count,
             COALESCE(SUM(d.value), 0)::numeric AS total_deal_value
      FROM contacts c
      LEFT JOIN deals d ON d.contact_id = c.id AND d.tenant_id = c.tenant_id
      WHERE c.tenant_id = $1
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    const result = await this.query(sql, [tenantId]);
    return result.rows;
  }
}

module.exports = new ContactRepository();
