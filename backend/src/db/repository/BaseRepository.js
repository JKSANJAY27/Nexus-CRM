const pool = require('../../config/database');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.pool = pool;
  }

  async query(sql, params = []) {
    return this.pool.query(sql, params);
  }

  async findAll(tenantId, extraWhere = '', extraParams = [], orderBy = 'created_at DESC') {
    if (!tenantId) throw new Error('tenant_id is required for all queries');
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE tenant_id = $1
      ${extraWhere}
      ORDER BY ${orderBy}
    `;
    const result = await this.query(sql, [tenantId, ...extraParams]);
    return result.rows;
  }

  async findById(id, tenantId) {
    if (!tenantId) throw new Error('tenant_id is required for all queries');
    const sql = `SELECT * FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2`;
    const result = await this.query(sql, [id, tenantId]);
    return result.rows[0] || null;
  }

  async create(tenantId, data) {
    if (!tenantId) throw new Error('tenant_id is required for all queries');
    const fullData = { tenant_id: tenantId, ...data };
    const columns = Object.keys(fullData);
    const values  = Object.values(fullData);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    const sql = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    const result = await this.query(sql, values);
    return result.rows[0];
  }

  async update(id, tenantId, data) {
    if (!tenantId) throw new Error('tenant_id is required for all queries');
    const { tenant_id: _stripped, ...safeData } = data;
    const columns = Object.keys(safeData);
    if (columns.length === 0) return this.findById(id, tenantId);

    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
    const values = Object.values(safeData);

    const sql = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE id = $${values.length + 1} AND tenant_id = $${values.length + 2}
      RETURNING *
    `;
    const result = await this.query(sql, [...values, id, tenantId]);
    return result.rows[0] || null;
  }

  async delete(id, tenantId) {
    if (!tenantId) throw new Error('tenant_id is required for all queries');
    const sql = `DELETE FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result = await this.query(sql, [id, tenantId]);
    return result.rows[0] || null;
  }

  async count(tenantId, extraWhere = '', extraParams = []) {
    if (!tenantId) throw new Error('tenant_id is required for all queries');
    const sql = `
      SELECT COUNT(*) as total FROM ${this.tableName}
      WHERE tenant_id = $1 ${extraWhere}
    `;
    const result = await this.query(sql, [tenantId, ...extraParams]);
    return parseInt(result.rows[0].total, 10);
  }
}

module.exports = BaseRepository;
