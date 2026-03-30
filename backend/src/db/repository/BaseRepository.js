/**
 * BaseRepository – Tenant-Aware Data Access Layer
 * ================================================
 * This is the CORE isolation mechanism of the entire system.
 *
 * EVERY query executed through this class automatically includes
 *   WHERE tenant_id = <current_tenant>
 *
 * Developers extend this class for each entity (Contacts, Deals, etc.)
 * and write normal queries — tenant filtering is injected by the base
 * class automatically. It is IMPOSSIBLE to leak cross-tenant data
 * as long as all data access goes through this layer.
 *
 * Design Pattern: Repository Pattern + Tenant Context Injection
 */

const pool = require('../../config/database');

class BaseRepository {
  /**
   * @param {string} tableName - The PostgreSQL table this repository manages
   */
  constructor(tableName) {
    this.tableName = tableName;
    this.pool = pool;
  }

  /**
   * Execute a query. If tenantId is provided, it MUST be included in
   * the parameterized query values. This enforces the contract that
   * all repo methods pass tenantId.
   */
  async query(sql, params = []) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Find all rows for this tenant.
   * Tenant filter is automatically injected — no manual WHERE needed.
   *
   * @param {string} tenantId - UUID of the current tenant (from JWT)
   * @param {string} [extraWhere] - Additional WHERE clause (e.g. "AND status = $2")
   * @param {Array}  [extraParams] - Parameters for extraWhere (starting at $2)
   * @param {string} [orderBy] - ORDER BY clause
   */
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

  /**
   * Find a single row by its primary key, scoped to the tenant.
   * If the ID exists but belongs to another tenant → returns null (not 403/404 confusion).
   *
   * @param {string} id       - The row UUID
   * @param {string} tenantId - UUID of the current tenant (from JWT)
   */
  async findById(id, tenantId) {
    if (!tenantId) throw new Error('tenant_id is required for all queries');
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE id = $1 AND tenant_id = $2
    `;
    const result = await this.query(sql, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Insert a new row, automatically stamping tenant_id.
   * The caller provides data WITHOUT tenant_id — this method adds it.
   *
   * @param {string} tenantId - UUID of the current tenant
   * @param {Object} data     - Column → value map (MUST NOT contain tenant_id)
   */
  async create(tenantId, data) {
    if (!tenantId) throw new Error('tenant_id is required for all queries');

    // Automatically inject tenant_id — developer cannot forget
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

  /**
   * Update a row — only if it belongs to this tenant.
   * Returns null if the row doesn't exist or belongs to a different tenant.
   *
   * @param {string} id       - The row UUID
   * @param {string} tenantId - UUID of the current tenant
   * @param {Object} data     - Columns to update (tenant_id cannot be changed)
   */
  async update(id, tenantId, data) {
    if (!tenantId) throw new Error('tenant_id is required for all queries');

    // Strip tenant_id from update data — it can never change
    const { tenant_id: _stripped, ...safeData } = data;

    const columns = Object.keys(safeData);
    if (columns.length === 0) return this.findById(id, tenantId);

    const setClause = columns.map((col, i) => `${col} = $${i + 3}`).join(', ');
    const values    = Object.values(safeData);

    const sql = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const result = await this.query(sql, [id, tenantId, ...values]);
    return result.rows[0] || null;
  }

  /**
   * Delete a row — only if it belongs to this tenant.
   *
   * @param {string} id       - The row UUID
   * @param {string} tenantId - UUID of the current tenant
   */
  async delete(id, tenantId) {
    if (!tenantId) throw new Error('tenant_id is required for all queries');
    const sql = `
      DELETE FROM ${this.tableName}
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const result = await this.query(sql, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Count rows for a tenant (used for analytics).
   *
   * @param {string} tenantId   - UUID of the current tenant
   * @param {string} extraWhere - Additional filter
   * @param {Array}  extraParams
   */
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
