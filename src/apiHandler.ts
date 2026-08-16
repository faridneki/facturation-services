import dotenv from 'dotenv';
dotenv.config();

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

function getBody(req: any): any {
  if (!req.body) return {};
  if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  if (Buffer.isBuffer(req.body)) {
    try {
      return JSON.parse(req.body.toString('utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

function sendJson(res: any, status: number, data: any) {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(status).json(data);
  } else {
    res.end(JSON.stringify(data));
  }
}

function getPath(req: any): string {
  let rawUrl = (req.headers && (req.headers['x-forwarded-uri'] as string)) ||
               (req.headers && (req.headers['x-rewrite-url'] as string)) ||
               (req.headers && (req.headers['x-matched-path'] as string)) ||
               req.url ||
               '';

  const qIndex = rawUrl.indexOf('?');
  if (qIndex !== -1) {
    rawUrl = rawUrl.substring(0, qIndex);
  }

  if (!rawUrl.startsWith('/')) {
    rawUrl = '/' + rawUrl;
  }

  if (!rawUrl.startsWith('/api')) {
    rawUrl = '/api' + (rawUrl === '/' ? '' : rawUrl);
  }

  if (rawUrl.length > 4 && rawUrl.endsWith('/')) {
    rawUrl = rawUrl.substring(0, rawUrl.length - 1);
  }

  return rawUrl;
}

export async function handleApiRequest(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  try {
    await ensureDbInitialized();
  } catch (dbErr) {
    console.warn('DB initialization warning in handler:', dbErr);
  }

  const method = (req.method || 'GET').toUpperCase();
  const path = getPath(req);
  const body = getBody(req);

  try {
    // 1. GET /api/health
    if (method === 'GET' && path === '/api/health') {
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
        } catch (e) {}
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

      return sendJson(res, 200, {
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
    }

    // 2. GET /api/users
    if (method === 'GET' && path === '/api/users') {
      const list = await getAllUsers();
      return sendJson(res, 200, list);
    }

    // 3. POST /api/auth/sync-user
    if (method === 'POST' && path === '/api/auth/sync-user') {
      const { uid, email } = body;
      if (!uid || !email) {
        return sendJson(res, 400, { error: 'uid and email required' });
      }
      const user = await getOrCreateUser(uid, email);
      return sendJson(res, 200, { success: true, user });
    }

    // 4. GET /api/company
    if (method === 'GET' && path === '/api/company') {
      const company = await getCompanySettings();
      return sendJson(res, 200, company);
    }

    // 5. POST /api/company
    if (method === 'POST' && path === '/api/company') {
      const updated = await saveCompanySettings(body);
      return sendJson(res, 200, updated);
    }

    // 6. GET /api/clients
    if (method === 'GET' && path === '/api/clients') {
      const clientsList = await getAllClients();
      return sendJson(res, 200, clientsList);
    }

    // 7. POST /api/clients
    if (method === 'POST' && path === '/api/clients') {
      const newClient = await createClient(body);
      return sendJson(res, 201, newClient);
    }

    // 8. PUT /api/clients/:id
    const clientPutMatch = path.match(/^\/api\/clients\/([^/]+)$/);
    if (method === 'PUT' && clientPutMatch) {
      const updated = await updateClient(clientPutMatch[1], body);
      return sendJson(res, 200, updated);
    }

    // 9. DELETE /api/clients/:id
    const clientDeleteMatch = path.match(/^\/api\/clients\/([^/]+)$/);
    if (method === 'DELETE' && clientDeleteMatch) {
      await deleteClient(clientDeleteMatch[1]);
      return sendJson(res, 200, { success: true, id: clientDeleteMatch[1] });
    }

    // 10. GET /api/invoices
    if (method === 'GET' && path === '/api/invoices') {
      const invoicesList = await getAllInvoices();
      return sendJson(res, 200, invoicesList);
    }

    // 11. POST /api/invoices
    if (method === 'POST' && path === '/api/invoices') {
      const newInvoice = await createInvoice(body);
      return sendJson(res, 201, newInvoice);
    }

    // 12. PATCH /api/invoices/:id/status
    const statusMatch = path.match(/^\/api\/invoices\/([^/]+)\/status$/);
    if (method === 'PATCH' && statusMatch) {
      const { status, paymentDate, paymentMethod } = body;
      const updated = await updateInvoiceStatus(statusMatch[1], status, paymentDate, paymentMethod);
      return sendJson(res, 200, updated);
    }

    // 13. POST /api/invoices/:id/convert-quote
    const convertMatch = path.match(/^\/api\/invoices\/([^/]+)\/convert-quote$/);
    if (method === 'POST' && convertMatch) {
      const result = await convertQuoteToInvoice(convertMatch[1]);
      return sendJson(res, 201, result);
    }

    // 14. PUT /api/invoices/:id
    const invoicePutMatch = path.match(/^\/api\/invoices\/([^/]+)$/);
    if (method === 'PUT' && invoicePutMatch) {
      const updated = await updateInvoice(invoicePutMatch[1], body);
      return sendJson(res, 200, updated);
    }

    // 15. DELETE /api/invoices/:id
    const invoiceDeleteMatch = path.match(/^\/api\/invoices\/([^/]+)$/);
    if (method === 'DELETE' && invoiceDeleteMatch) {
      await deleteInvoice(invoiceDeleteMatch[1]);
      return sendJson(res, 200, { success: true, id: invoiceDeleteMatch[1] });
    }

    // 16. POST /api/demo/clear
    if (method === 'POST' && path === '/api/demo/clear') {
      await clearAllData();
      return sendJson(res, 200, { success: true, message: 'Toutes les données ont été effacées de la base.' });
    }

    // 17. POST /api/demo/reset
    if (method === 'POST' && path === '/api/demo/reset') {
      await resetDemoData();
      return sendJson(res, 200, { success: true, message: 'Les données de test ont été réinjectées dans la base Neon.' });
    }

    // 18. GET /api/stats
    if (method === 'GET' && path === '/api/stats') {
      const [invList, cliList] = await Promise.all([getAllInvoices(), getAllClients()]);
      const stats = calculateDashboardStats(invList, cliList);
      return sendJson(res, 200, stats);
    }

    // Root API welcome
    if (method === 'GET' && (path === '/api' || path === '/api/')) {
      return sendJson(res, 200, { status: 'ok', message: 'API Facturation PostgreSQL Active' });
    }

    // Not found
    return sendJson(res, 404, { error: `Route non trouvée: ${method} ${path}` });
  } catch (err: any) {
    console.error(`Error processing ${method} ${path}:`, err);
    return sendJson(res, 500, {
      error: err?.message || 'Erreur interne du serveur',
      details: String(err)
    });
  }
}
