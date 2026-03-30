const { Router } = require('express');
const { registerTenant, login, getMe } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = Router();

/**
 * @swagger
 * /auth/register-tenant:
 *   post:
 *     summary: Register a new tenant (company) with an admin user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyName, slug, adminName, adminEmail, adminPassword]
 *             properties:
 *               companyName: { type: string, example: "Acme Corp" }
 *               slug:        { type: string, example: "acme" }
 *               adminName:   { type: string, example: "John Doe" }
 *               adminEmail:  { type: string, example: "john@acme.com" }
 *               adminPassword: { type: string, example: "Secret123!" }
 *     responses:
 *       201: { description: Tenant created, returns JWT }
 *       409: { description: Slug already taken }
 */
router.post('/register-tenant', registerTenant);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email, password, and company slug
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, slug]
 *             properties:
 *               email:    { type: string }
 *               password: { type: string }
 *               slug:     { type: string, example: "acme" }
 *     responses:
 *       200: { description: Returns JWT token }
 *       401: { description: Invalid credentials }
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user info }
 */
router.get('/me', auth, getMe);

module.exports = router;
