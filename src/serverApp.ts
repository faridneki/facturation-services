import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { calculateDashboardStats } from './utils/calculations';
import {
  seedCloudSQLIfEmpty,
  getAllUsers,
  getCompanySettings,
  saveCompanySettings,
  getAllClients,
  createClient,
  updateClient,
  deleteClient,
  getAllInvoices,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  convertQuoteToInvoice,
  deleteInvoice,
  clearAllData,
  resetDemoData
} from './db/dbService';
import { getOrCreateUser } from './db/users';

const app = express();

// CORS & Headers middleware (handled first, before any body reading)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Custom body parser middleware compatible with Vercel serverless & Express
app.use((req: any, res: any, next: any) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  if (req.body !== undefined && req.body !== null && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return next();
  }
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
        return next();
      } catch (e) {
        // keep string
      }
    } else if (Buffer.isBuffer && Buffer.isBuffer(req.body)) {
      try {
        req.body = JSON.parse(req.body.toString('utf-8'));
        return next();
      } catch (e) {
        // keep string
      }
    }
  }
  return express.json({ limit: '10mb' })(req, res, next);
});

// Lazy DB initialization helper
let initPromise: Promise<void> | null = null;
function ensureDbInitialized() {
  if (!initPromise) {
    initPromise = seedCloudSQLIfEmpty().catch((err) => {
      console.error('Database lazy init warning (non-fatal):', err);
      initPromise = null;
    });
  }
  return initPromise;
}

// Ensure database tables exist before processing API calls
app.use(async (req, res, next) => {
  const url = req.originalUrl || req.url || '';
  if (url.startsWith('/api') || ['/health', '/users', '/company', '/clients', '/invoices', '/demo', '/stats', '/auth'].some(p => url.startsWith(p))) {
    try {
      await ensureDbInitialized();
    } catch (err) {
      console.warn('API Init Middleware warning:', err);
    }
  }
  next();
});

// --- API ROUTER ---
const apiRouter = express.Router();

// Health Check
apiRouter.get('/health', async (req, res) => {
  const rawUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || '';
  let dbHost = 'ep-young-wildflower-agt8whdg-pooler.c-2.eu-central-1.aws.neon.tech';
  let dbName = 'facturation_db';

  if (rawUrl) {
    try {
      const match = rawUrl.match(/@([^/:]+)(?::\d+)?\/([^?]+)/);
      if (match) {
        dbHost = match[1];
        dbName = match[2];
      }
    } catch (e) {
      // Keep defaults
    }
  }

  let dbStatus = 'unknown';
  let dbError = null;
  try {
    await getAllUsers();
    dbStatus = 'connected';
  } catch (err: any) {
    dbStatus = 'error';
    dbError = err.message || String(err);
  }
  res.json({
    status: 'ok',
    provider: 'Neon PostgreSQL (Cloud DB)',
    databaseUrlConfigured: true,
    dbHost,
    dbName,
    fullHost: `postgresql://${dbHost}/${dbName}`,
    dbStatus,
    dbError,
    time: new Date().toISOString()
  });
});

// User Sync & Query API
apiRouter.get('/users', async (req, res) => {
  try {
    const list = await getAllUsers();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch users' });
  }
});

apiRouter.post('/auth/sync-user', async (req, res) => {
  try {
    const { uid, email } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: 'uid and email required' });
    }
    const user = await getOrCreateUser(uid, email);
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to sync user' });
  }
});

// Company Settings
apiRouter.get('/company', async (req, res) => {
  try {
    const company = await getCompanySettings();
    res.json(company);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error loading company settings' });
  }
});

apiRouter.post('/company', async (req, res) => {
  try {
    const updated = await saveCompanySettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error saving company settings' });
  }
});

// Clients API
apiRouter.get('/clients', async (req, res) => {
  try {
    const clientsList = await getAllClients();
    res.json(clientsList);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error loading clients' });
  }
});

apiRouter.post('/clients', async (req, res) => {
  try {
    const newClient = await createClient(req.body);
    res.status(201).json(newClient);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error creating client' });
  }
});

apiRouter.put('/clients/:id', async (req, res) => {
  try {
    const updated = await updateClient(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error updating client' });
  }
});

apiRouter.delete('/clients/:id', async (req, res) => {
  try {
    await deleteClient(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error deleting client' });
  }
});

// Invoices & Quotes API
apiRouter.get('/invoices', async (req, res) => {
  try {
    const invoicesList = await getAllInvoices();
    res.json(invoicesList);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error loading invoices' });
  }
});

apiRouter.post('/invoices', async (req, res) => {
  try {
    const newInvoice = await createInvoice(req.body);
    res.status(201).json(newInvoice);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error creating invoice' });
  }
});

apiRouter.put('/invoices/:id', async (req, res) => {
  try {
    const updated = await updateInvoice(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error updating invoice' });
  }
});

apiRouter.patch('/invoices/:id/status', async (req, res) => {
  try {
    const { status, paymentDate, paymentMethod } = req.body;
    const updated = await updateInvoiceStatus(req.params.id, status, paymentDate, paymentMethod);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error updating status' });
  }
});

apiRouter.post('/invoices/:id/convert-quote', async (req, res) => {
  try {
    const result = await convertQuoteToInvoice(req.params.id);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error converting quote' });
  }
});

apiRouter.delete('/invoices/:id', async (req, res) => {
  try {
    await deleteInvoice(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error deleting invoice' });
  }
});

// Data Management Routes (Clear & Reset)
apiRouter.post('/demo/clear', async (req, res) => {
  try {
    await clearAllData();
    res.json({ success: true, message: 'Toutes les données ont été effacées de la base.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error clearing data' });
  }
});

apiRouter.post('/demo/reset', async (req, res) => {
  try {
    await resetDemoData();
    res.json({ success: true, message: 'Les données de test ont été réinjectées dans la base Neon.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error resetting data' });
  }
});

// Analytics Dashboard Stats
apiRouter.get('/stats', async (req, res) => {
  try {
    const [invList, cliList] = await Promise.all([getAllInvoices(), getAllClients()]);
    const stats = calculateDashboardStats(invList, cliList);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error computing stats' });
  }
});

// Root API welcome
apiRouter.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API Facturation PostgreSQL Active' });
});

// Mount the API Router for both `/api` prefix and root route fallback
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Fallback catch-all 404 handler for any unhandled request
app.use((req, res) => {
  if (!res.headersSent) {
    res.status(404).json({ error: `Route non trouvée: ${req.method} ${req.originalUrl || req.url}` });
  }
});

// Global Express error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Express Server Error:', err);
  if (!res.headersSent) {
    res.status(500).json({
      error: err?.message || 'Erreur interne du serveur',
      details: String(err)
    });
  }
});

export default app;
