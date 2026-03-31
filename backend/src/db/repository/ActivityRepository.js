const BaseRepository = require('./BaseRepository');

class ActivityRepository extends BaseRepository {
  constructor() {
    super('activities');
  }

  async findWithDetails(tenantId) {
    const sql = `
      SELECT a.*,
             u.name  AS created_by_name,
             d.title AS deal_title,
             c.name  AS contact_name
      FROM activities a
      LEFT JOIN users    u ON u.id = a.created_by  AND u.tenant_id = a.tenant_id
      LEFT JOIN deals    d ON d.id = a.deal_id      AND d.tenant_id = a.tenant_id
      LEFT JOIN contacts c ON c.id = a.contact_id   AND c.tenant_id = a.tenant_id
      WHERE a.tenant_id = ?
      ORDER BY a.created_at DESC
    `;
    const result = await this.query(sql, [tenantId]);
    return result.rows;
  }

  async findByDeal(tenantId, dealId) {
    const sql = `
      SELECT a.*,
             u.name AS created_by_name
      FROM activities a
      LEFT JOIN users u ON u.id = a.created_by AND u.tenant_id = a.tenant_id
      WHERE a.tenant_id = ? AND a.deal_id = ?
      ORDER BY a.created_at DESC
    `;
    const result = await this.query(sql, [tenantId, dealId]);
    return result.rows;
  }

  async getRecentForTenant(tenantId, limit = 10) {
    const sql = `
      SELECT a.*,
             u.name  AS created_by_name,
             d.title AS deal_title,
             c.name  AS contact_name
      FROM activities a
      LEFT JOIN users    u ON u.id = a.created_by  AND u.tenant_id = a.tenant_id
      LEFT JOIN deals    d ON d.id = a.deal_id      AND d.tenant_id = a.tenant_id
      LEFT JOIN contacts c ON c.id = a.contact_id   AND c.tenant_id = a.tenant_id
      WHERE a.tenant_id = ?
      ORDER BY a.created_at DESC
      LIMIT ?
    `;
    const result = await this.query(sql, [tenantId, limit]);
    return result.rows;
  }
}

module.exports = new ActivityRepository();
