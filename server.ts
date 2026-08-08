import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { calculateDashboardStats } from './src/utils/calculations';
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
} from './src/db/dbService';
import { getOrCreateUser } from './src/db/users';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// CORS & Headers middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Lazy DB initialization helper
let initPromise: Promise<void> | null = null;
function ensureDbInitialized() {
  if (!initPromise) {
    initPromise = seedCloudSQLIfEmpty().catch((err) => {
      console.error('Database lazy init error:', err);
      initPromise = null;
    });
  }
  return initPromise;
}

// Ensure database tables exist before processing API calls
app.use('/api', async (req, res, next) => {
  await ensureDbInitialized();
  next();
});

// --- API ROUTES ---

// Health Check
app.get('/api/health', async (req, res) => {
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
app.get('/api/users', async (req, res) => {
  try {
    const list = await getAllUsers();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch users' });
  }
});

app.post('/api/auth/sync-user', async (req, res) => {
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
app.get('/api/company', async (req, res) => {
  try {
    const company = await getCompanySettings();
    res.json(company);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error loading company settings' });
  }
});

app.post('/api/company', async (req, res) => {
  try {
    const updated = await saveCompanySettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error saving company settings' });
  }
});

// Clients API
app.get('/api/clients', async (req, res) => {
  try {
    const clientsList = await getAllClients();
    res.json(clientsList);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error loading clients' });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const newClient = await createClient(req.body);
    res.status(201).json(newClient);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error creating client' });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const updated = await updateClient(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error updating client' });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    await deleteClient(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error deleting client' });
  }
});

// Invoices & Quotes API
app.get('/api/invoices', async (req, res) => {
  try {
    const invoicesList = await getAllInvoices();
    res.json(invoicesList);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error loading invoices' });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const newInvoice = await createInvoice(req.body);
    res.status(201).json(newInvoice);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error creating invoice' });
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  try {
    const updated = await updateInvoice(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error updating invoice' });
  }
});

app.patch('/api/invoices/:id/status', async (req, res) => {
  try {
    const { status, paymentDate, paymentMethod } = req.body;
    const updated = await updateInvoiceStatus(req.params.id, status, paymentDate, paymentMethod);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error updating status' });
  }
});

app.post('/api/invoices/:id/convert-quote', async (req, res) => {
  try {
    const result = await convertQuoteToInvoice(req.params.id);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error converting quote' });
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
  try {
    await deleteInvoice(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error deleting invoice' });
  }
});

// Data Management Routes (Clear)
app.post('/api/demo/clear', async (req, res) => {
  try {
    await clearAllData();
    res.json({ success: true, message: 'Toutes les données ont été effacées de la base.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error clearing data' });
  }
});

app.post('/api/demo/reset', async (req, res) => {
  try {
    await resetDemoData();
    res.json({ success: true, message: 'Les données de test ont été réinjectées dans la base Neon.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error resetting data' });
  }
});

// Analytics Dashboard Stats
app.get('/api/stats', async (req, res) => {
  try {
    const [invList, cliList] = await Promise.all([getAllInvoices(), getAllClients()]);
    const stats = calculateDashboardStats(invList, cliList);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error computing stats' });
  }
});

export default app;

// Server boot with Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running at http://localhost:${PORT} with PostgreSQL backend`);
    });
  }
}

startServer();
