const pool = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.pool = pool;
  }

  async query(sql, params = []) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result;
    } finally {
      client.release();
    }
  }

  async findAll(tenantId, extraWhere = '', extraParams = [], orderBy = 'created_at DESC') {
    if (!tenantId) throw new Error('tenant_id is required for all queries');
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE tenant_id = ?
      ${extraWhere}
      ORDER BY ${orderBy}
    `;
    const result = await this.query(sql, [tenantId, ...extraParams]);
    return result.rows;
  }

  async findById(id, tenantId) {
    if (!tenantId) throw new Error('tenant_id is required for all queries');
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE id = ? AND tenant_id = ?
    `;
    const result = await this.query(sql, [id, tenantId]);
    return result.rows[0] || null;
  }

  async create(tenantId, data) {
    if (!tenantId) throw new Error('tenant_id is required for all queries');

    // SQLite auto-inject logic with UIID natively from node
    const fullData = { id: uuidv4(), tenant_id: tenantId, ...data };

    const columns = Object.keys(fullData);
    const values  = Object.values(fullData);
    const placeholders = values.map(() => `?`).join(', ');

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

    const setClause = columns.map(col => `${col} = ?`).join(', ');
    const values    = Object.values(safeData);

    const sql = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE id = ? AND tenant_id = ?
      RETURNING *
    `;
    const result = await this.query(sql, [...values, id, tenantId]);
    return result.rows[0] || null;
  }

  async delete(id, tenantId) {
    if (!tenantId) throw new Error('tenant_id is required for all queries');
    const sql = `
      DELETE FROM ${this.tableName}
      WHERE id = ? AND tenant_id = ?
      RETURNING id
    `;
    const result = await this.query(sql, [id, tenantId]);
    return result.rows[0] || null;
  }

  async count(tenantId, extraWhere = '', extraParams = []) {
    if (!tenantId) throw new Error('tenant_id is required for all queries');
    const sql = `
      SELECT COUNT(*) as total FROM ${this.tableName}
      WHERE tenant_id = ? ${extraWhere}
    `;
    const result = await this.query(sql, [tenantId, ...extraParams]);
    return parseInt(result.rows[0].total, 10);
  }
}

module.exports = BaseRepository;
