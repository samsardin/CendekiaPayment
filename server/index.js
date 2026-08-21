require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const seedData = require('./database/seed');

const authRoutes = require('./routes/auth');
const masterRoutes = require('./routes/master');
const { router: posRoutes } = require('./routes/pos');
const accountsRoutes = require('./routes/accounts');
const invoicesRoutes = require('./routes/invoices');
const paymentsRoutes = require('./routes/payments');
const expensesRoutes = require('./routes/expenses');
const gatewayRoutes = require('./routes/gateway');
const reportsRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const auditRoutes = require('./routes/audit');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let isSeeded = false;
app.use((req, res, next) => {
  if (process.env.VERCEL && !isSeeded) {
    isSeeded = true;
    seedData().catch((err) => console.error('Background DB auto-seed notice:', err.message));
  }
  next();
});

const apiRouter = express.Router();

// Diagnostic DB Connection Status Endpoint
apiRouter.get('/db-status', async (req, res) => {
  const { isPg, query } = require('./database/db');
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL;
  try {
    const result = await query(`SELECT COUNT(*) as count FROM students`);
    const studentCount = result && result[0] ? (result[0].count || result[0].COUNT || 0) : 0;
    res.json({
      success: true,
      engine: isPg ? 'PostgreSQL (Supabase Cloud)' : 'SQLite3 (Local /tmp)',
      dbUrlConfigured: Boolean(dbUrl),
      connected: true,
      totalStudents: parseInt(studentCount),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      engine: isPg ? 'PostgreSQL (Supabase Cloud)' : 'SQLite3 (Local /tmp)',
      dbUrlConfigured: Boolean(dbUrl),
      connected: false,
      error: err.message
    });
  }
});

// Register API Endpoints
apiRouter.use('/auth', authRoutes);
apiRouter.use('/master', masterRoutes);
apiRouter.use('/pos', posRoutes);
apiRouter.use('/accounts', accountsRoutes);
apiRouter.use('/invoices', invoicesRoutes);
apiRouter.use('/payments', paymentsRoutes);
apiRouter.use('/expenses', expensesRoutes);
apiRouter.use('/gateway', gatewayRoutes);
apiRouter.use('/reports', reportsRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/audit', auditRoutes);

apiRouter.get('/health', (req, res) => {
  res.json({ success: true, message: 'CendekiaPayment Backend API Running', timestamp: new Date() });
});

// Mount on both /api and root /
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Initialize database & start server
const startServer = async () => {
  try {
    await seedData();
    app.listen(PORT, () => {
      console.log(`🚀 CendekiaPayment SFMS Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
