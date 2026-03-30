require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const morgan      = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi   = require('swagger-ui-express');

const authRoutes       = require('./routes/auth');
const userRoutes       = require('./routes/users');
const contactRoutes    = require('./routes/contacts');
const dealRoutes       = require('./routes/deals');
const activityRoutes   = require('./routes/activities');
const analyticsRoutes  = require('./routes/analytics');
const errorHandler     = require('./middleware/errorHandler');

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────
const origins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || origins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Swagger / OpenAPI ─────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nexus CRM API',
      version: '1.0.0',
      description: 'Multi-tenant CRM SaaS – API Documentation',
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
    servers: [{ url: '/api' }],
  },
  apis: ['./src/routes/*.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Health check ──────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'nexus-crm-api' }));

// ── Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/contacts',   contactRoutes);
app.use('/api/deals',      dealRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/analytics',  analyticsRoutes);

// ── 404 handler ───────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
