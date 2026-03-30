const BaseRepository = require('./BaseRepository');

class DealRepository extends BaseRepository {
  constructor() {
    super('deals');
  }

  async findByStage(tenantId, stage) {
    return this.findAll(tenantId, 'AND stage = $2', [stage]);
  }

  async findWithContactInfo(tenantId) {
    const sql = `
      SELECT d.*,
             c.name  AS contact_name,
             c.email AS contact_email,
             c.company AS contact_company,
             u.name  AS assigned_to_name
      FROM deals d
      LEFT JOIN contacts c ON c.id = d.contact_id AND c.tenant_id = d.tenant_id
      LEFT JOIN users   u ON u.id = d.assigned_to  AND u.tenant_id = d.tenant_id
      WHERE d.tenant_id = $1
      ORDER BY d.created_at DESC
    `;
    const result = await this.query(sql, [tenantId]);
    return result.rows;
  }

  async getPipelineSummary(tenantId) {
    const sql = `
      SELECT stage,
             COUNT(*)               AS count,
             COALESCE(SUM(value), 0) AS total_value
      FROM deals
      WHERE tenant_id = $1
      GROUP BY stage
      ORDER BY stage
    `;
    const result = await this.query(sql, [tenantId]);
    return result.rows;
  }

  async findByContact(tenantId, contactId) {
    return this.findAll(tenantId, 'AND contact_id = $2', [contactId]);
  }
}

module.exports = new DealRepository();
