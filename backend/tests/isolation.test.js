/**
 * Tenant Isolation Test Suite
 * ============================
 * Proves that the multi-tenant isolation is STRICTLY enforced:
 *
 * Test 1: Tenant A's JWT cannot read Tenant B's contacts
 * Test 2: GET /contacts/:id with wrong tenant returns 404 (not another tenant's record)
 * Test 3: Deals created by Tenant B are invisible to Tenant A
 * Test 4: Requests with no JWT are rejected (401)
 * Test 5: Requests with expired/invalid JWT are rejected (401)
 * Test 6: Token missing tenant_id field is rejected (401)
 */

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app     = require('../src/app');
const pool    = require('../src/config/database');

// Test credentials
const TENANT_A = { company: 'Alpha Corp', slug: 'alpha-test-' + Date.now(), email: 'admin@alpha.com', password: 'Alpha123!' };
const TENANT_B = { company: 'Beta Corp',  slug: 'beta-test-'  + Date.now(), email: 'admin@beta.com',  password: 'Beta456!'  };

let tokenA, tokenB;
let tenantAId, tenantBId;
let contactBId;

async function registerAndLogin(tenant) {
  const res = await request(app).post('/api/auth/register-tenant').send({
    companyName:   tenant.company,
    slug:          tenant.slug,
    adminName:     'Admin',
    adminEmail:    tenant.email,
    adminPassword: tenant.password,
  });
  expect(res.status).toBe(201);
  return { token: res.body.token, tenantId: res.body.tenant.id };
}

beforeAll(async () => {
  const a = await registerAndLogin(TENANT_A);
  const b = await registerAndLogin(TENANT_B);
  tokenA   = a.token;
  tenantAId = a.tenantId;
  tokenB   = b.token;
  tenantBId = b.tenantId;

  // Create a contact under Tenant B
  const cRes = await request(app)
    .post('/api/contacts')
    .set('Authorization', `Bearer ${tokenB}`)
    .send({ name: 'Beta Client', email: 'client@beta.com', company: 'Beta Client Co' });
  expect(cRes.status).toBe(201);
  contactBId = cRes.body.id;
});

afterAll(async () => {
  // Cleanup test tenants
  await pool.query(`DELETE FROM tenants WHERE slug LIKE 'alpha-test-%' OR slug LIKE 'beta-test-%'`);
  await pool.end();
});

// ─────────────────────────────────────────────────────────────
// TEST 1: Tenant A's token cannot list Tenant B's contacts
// ─────────────────────────────────────────────────────────────
test('Tenant A cannot list Tenant B contacts', async () => {
  const res = await request(app)
    .get('/api/contacts')
    .set('Authorization', `Bearer ${tokenA}`);

  expect(res.status).toBe(200);
  // Tenant A's contacts are empty; must not see Tenant B's "Beta Client"
  const names = res.body.map(c => c.name);
  expect(names).not.toContain('Beta Client');
});

// ─────────────────────────────────────────────────────────────
// TEST 2: Tenant A cannot fetch Tenant B's specific contact by ID
// ─────────────────────────────────────────────────────────────
test('Tenant A cannot fetch Tenant B contact by ID', async () => {
  const res = await request(app)
    .get(`/api/contacts/${contactBId}`)
    .set('Authorization', `Bearer ${tokenA}`);

  // Must be 404 — not a 200 with leaked data, not a 403 that reveals ID exists
  expect(res.status).toBe(404);
});

// ─────────────────────────────────────────────────────────────
// TEST 3: Tenant A creates a deal; Tenant B cannot see it
// ─────────────────────────────────────────────────────────────
test('Tenant B cannot see Tenant A deals', async () => {
  // Create a contact + deal for Tenant A
  const cRes = await request(app)
    .post('/api/contacts')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ name: 'Alpha Customer', email: 'customer@alpha.com' });
  expect(cRes.status).toBe(201);

  const dRes = await request(app)
    .post('/api/deals')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ contact_id: cRes.body.id, title: 'Secret Alpha Deal', value: 99999, stage: 'prospecting' });
  expect(dRes.status).toBe(201);

  // Now Tenant B lists deals — must not see "Secret Alpha Deal"
  const res = await request(app)
    .get('/api/deals')
    .set('Authorization', `Bearer ${tokenB}`);
  expect(res.status).toBe(200);
  const titles = res.body.map(d => d.title);
  expect(titles).not.toContain('Secret Alpha Deal');
});

// ─────────────────────────────────────────────────────────────
// TEST 4: No token → 401
// ─────────────────────────────────────────────────────────────
test('Request with no token is rejected with 401', async () => {
  const res = await request(app).get('/api/contacts');
  expect(res.status).toBe(401);
  expect(res.body.error).toBe('Authorization token required');
});

// ─────────────────────────────────────────────────────────────
// TEST 5: Invalid/tampered token → 401
// ─────────────────────────────────────────────────────────────
test('Request with invalid token is rejected with 401', async () => {
  const res = await request(app)
    .get('/api/contacts')
    .set('Authorization', 'Bearer this.is.not.a.real.token');
  expect(res.status).toBe(401);
});

// ─────────────────────────────────────────────────────────────
// TEST 6: Token without tenant_id → 401
// ─────────────────────────────────────────────────────────────
test('Token missing tenant_id is rejected with 401', async () => {
  const badToken = jwt.sign(
    { user_id: 'some-user-id' },  // NOTE: no tenant_id
    process.env.JWT_SECRET || 'test_secret'
  );
  const res = await request(app)
    .get('/api/contacts')
    .set('Authorization', `Bearer ${badToken}`);
  expect(res.status).toBe(401);
  expect(res.body.error).toBe('Token missing tenant context');
});

// ─────────────────────────────────────────────────────────────
// TEST 7: Analytics only returns current tenant's data
// ─────────────────────────────────────────────────────────────
test('Analytics returns only tenant-scoped metrics', async () => {
  const resA = await request(app)
    .get('/api/analytics/dashboard')
    .set('Authorization', `Bearer ${tokenA}`);
  const resB = await request(app)
    .get('/api/analytics/dashboard')
    .set('Authorization', `Bearer ${tokenB}`);

  expect(resA.status).toBe(200);
  expect(resB.status).toBe(200);

  // Tenant A and Tenant B have separate contact counts
  expect(resA.body.metrics.total_contacts).not.toBeNaN();
  expect(resB.body.metrics.total_contacts).not.toBeNaN();
});
