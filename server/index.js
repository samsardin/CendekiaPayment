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

// Register API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/gateway', gatewayRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit', auditRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'CendekiaPayment Backend API Running', timestamp: new Date() });
});

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

startServer();
