import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, desc, sql as drizzleSql } from 'drizzle-orm';
import { pgTable, text, timestamp, doublePrecision, serial } from 'drizzle-orm/pg-core';

// 1. NEON DATABASE CONNECTIVITY WITH FALLBACK
const DEFAULT_NEON_URL = 'postgresql://neondb_owner:npg_USAVX1b4ueyr@ep-young-wildflower-agt8whdg-pooler.c-2.eu-central-1.aws.neon.tech/facturation_db?sslmode=require';

function getConnectionString(): string {
  const envUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
  const isValidEnvUrl = envUrl && envUrl.includes('@') && !envUrl.includes('user:password');
  return isValidEnvUrl ? envUrl! : DEFAULT_NEON_URL;
}

const connectionString = getConnectionString();
const sqlConnection = neon(connectionString);
const db = drizzle(sqlConnection);

// 2. DRIZZLE DATABASE SCHEMAS
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

const companyInfo = pgTable('company_info', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  legalName: text('legal_name'),
  taxId: text('tax_id'),
  rc: text('rc'),
  ai: text('ai'),
  nis: text('nis'),
  art: text('art'),
  address: text('address'),
  city: text('city'),
  postalCode: text('postal_code'),
  country: text('country'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  logoUrl: text('logo_url'),
  logoBase64: text('logo_base64'),
  footerText: text('footer_text'),
  legalTerms: text('legal_terms'),
  bankName: text('bank_name'),
  bankAccount: text('bank_account'),
  bankRib: text('bank_rib'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

const clients = pgTable('clients', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  nom: text('nom').notNull(),
  email: text('email'),
  telephone: text('telephone'),
  adresse: text('adresse'),
  ncBancaire: text('nc_bancaire'),
  nif: text('nif'),
  rc: text('rc'),
  ai: text('ai'),
  nis: text('nis'),
  creditMax: doublePrecision('credit_max').default(0),
  creditActuel: doublePrecision('credit_actuel').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  number: text('number').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull(),
  clientId: text('client_id').notNull(),
  issueDate: text('issue_date').notNull(),
  dueDate: text('due_date').notNull(),
  paymentDate: text('payment_date'),
  paymentMethod: text('payment_method'),
  itemsJson: text('items_json').notNull(),
  subtotalHT: doublePrecision('subtotal_ht').notNull(),
  discountAmount: doublePrecision('discount_amount').notNull(),
  taxAmount: doublePrecision('tax_amount').notNull(),
  totalTTC: doublePrecision('total_ttc').notNull(),
  depositAmount: doublePrecision('deposit_amount').default(0),
  notes: text('notes'),
  paymentTerms: text('payment_terms'),
  convertedFromId: text('converted_from_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

const initialCompanySettings = {
  id: 'comp-1',
  name: 'ALGERIE BATI PRO',
  legalName: 'SARL MON ENTREPRISE NEON',
  taxId: '001916012345678',
  rc: '16/00-0123456B19',
  ai: '16012345678',
  nis: '199516010012345',
  art: '16012345678',
  address: 'Zone Industrielle Oued Smar, Lot 14',
  city: 'Alger',
  postalCode: '16000',
  country: 'Algérie',
  phone: '0550112233',
  email: 'contact@batipro-dz.com',
  website: 'www.batipro-dz.com',
  footerText: 'Merci pour votre confiance. Société au capital de 10 000 000 DA.',
  legalTerms: 'Paiement à 30 jours par virement ou chèque bancaire. Pénalités de retard au taux légal.',
  bankName: "BNA - Banque Nationale d'Algérie",
  bankAccount: '001 00810 0300 000123 45',
  bankRib: '00100810030000012345 88'
};

// 3. LAZY TABLE INITIALIZATION
let isDbInitialized = false;
async function seedCloudSQLIfEmpty() {
  if (isDbInitialized) return;
  try {
    try {
      await db.select().from(clients).limit(1);
      isDbInitialized = true;
      return;
    } catch {}

    const statements = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uid TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS company_info (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT NOT NULL,
        legal_name TEXT,
        tax_id TEXT,
        rc TEXT,
        ai TEXT,
        nis TEXT,
        art TEXT,
        address TEXT,
        city TEXT,
        postal_code TEXT,
        country TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        logo_url TEXT,
        logo_base64 TEXT,
        footer_text TEXT,
        legal_terms TEXT,
        bank_name TEXT,
        bank_account TEXT,
        bank_rib TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        nom TEXT NOT NULL,
        email TEXT,
        telephone TEXT,
        adresse TEXT,
        nc_bancaire TEXT,
        nif TEXT,
        rc TEXT,
        ai TEXT,
        nis TEXT,
        credit_max DOUBLE PRECISION DEFAULT 0,
        credit_actuel DOUBLE PRECISION DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        number TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        client_id TEXT NOT NULL,
        issue_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        payment_date TEXT,
        payment_method TEXT,
        items_json TEXT,
        subtotal_ht DOUBLE PRECISION DEFAULT 0,
        discount_amount DOUBLE PRECISION DEFAULT 0,
        tax_amount DOUBLE PRECISION DEFAULT 0,
        total_ttc DOUBLE PRECISION DEFAULT 0,
        deposit_amount DOUBLE PRECISION DEFAULT 0,
        notes TEXT,
        payment_terms TEXT,
        converted_from_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS system_flags (
        key TEXT PRIMARY KEY,
        value TEXT
      )`
    ];

    await Promise.all(
      statements.map(stmt => db.execute(drizzleSql.raw(stmt)).catch(() => {}))
    );

    const existingCompany = await db.select().from(companyInfo).limit(1);
    if (existingCompany.length === 0) {
      await saveCompanySettings(initialCompanySettings);
    }

    const existingClients = await db.select().from(clients).limit(1);
    if (existingClients.length === 0) {
      await resetDemoData();
    }

    isDbInitialized = true;
  } catch (err) {
    console.error('Table init error:', err);
  }
}

// 4. DATABASE SERVICE FUNCTIONS
async function getCompanySettings() {
  const rows = await db.select().from(companyInfo).limit(1);
  if (rows.length === 0) {
    await saveCompanySettings(initialCompanySettings);
    return initialCompanySettings;
  }
  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    legalName: r.legalName || undefined,
    taxId: r.taxId || undefined,
    rc: r.rc || undefined,
    ai: r.ai || undefined,
    nis: r.nis || undefined,
    art: r.art || undefined,
    address: r.address || undefined,
    city: r.city || undefined,
    postalCode: r.postalCode || undefined,
    country: r.country || undefined,
    phone: r.phone || undefined,
    email: r.email || undefined,
    website: r.website || undefined,
    logoUrl: r.logoUrl || undefined,
    logoBase64: r.logoBase64 || undefined,
    footerText: r.footerText || undefined,
    legalTerms: r.legalTerms || undefined,
    bankName: r.bankName || undefined,
    bankAccount: r.bankAccount || undefined,
    bankRib: r.bankRib || undefined,
  };
}

async function saveCompanySettings(data: any) {
  const id = data.id || 'comp-1';
  const payload = {
    id,
    name: data.name || 'Mon Entreprise',
    legalName: data.legalName || null,
    taxId: data.taxId || null,
    rc: data.rc || null,
    ai: data.ai || null,
    nis: data.nis || null,
    art: data.art || null,
    address: data.address || null,
    city: data.city || null,
    postalCode: data.postalCode || null,
    country: data.country || null,
    phone: data.phone || null,
    email: data.email || null,
    website: data.website || null,
    logoUrl: data.logoUrl || null,
    logoBase64: data.logoBase64 || null,
    footerText: data.footerText || null,
    legalTerms: data.legalTerms || null,
    bankName: data.bankName || null,
    bankAccount: data.bankAccount || null,
    bankRib: data.bankRib || null,
    updatedAt: new Date()
  };

  const existing = await db.select().from(companyInfo).where(eq(companyInfo.id, id));
  if (existing.length > 0) {
    await db.update(companyInfo).set(payload).where(eq(companyInfo.id, id));
  } else {
    await db.insert(companyInfo).values(payload);
  }
  return data;
}

async function getAllClients() {
  const rows = await db.select().from(clients).orderBy(desc(clients.createdAt));
  return rows.map(r => ({
    id: r.id,
    nom: r.nom,
    name: r.nom,
    email: r.email || undefined,
    telephone: r.telephone || undefined,
    phone: r.telephone || undefined,
    adresse: r.adresse || undefined,
    address: r.adresse || undefined,
    ncBancaire: r.ncBancaire || undefined,
    nif: r.nif || undefined,
    rc: r.rc || undefined,
    ai: r.ai || undefined,
    nis: r.nis || undefined,
    creditMax: r.creditMax ?? 0,
    creditActuel: r.creditActuel ?? 0,
    createdAt: r.createdAt ? r.createdAt.toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
    updatedAt: r.updatedAt ? r.updatedAt.toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
  }));
}

async function createClient(data: any) {
  const newId = `cli-${Date.now().toString().slice(-7)}`;
  const payload = {
    id: newId,
    nom: data.nom || data.name || 'Nouveau Client',
    email: data.email || null,
    telephone: data.telephone || data.phone || null,
    adresse: data.adresse || data.address || null,
    ncBancaire: data.ncBancaire || null,
    nif: data.nif || null,
    rc: data.rc || null,
    ai: data.ai || null,
    nis: data.nis || null,
    creditMax: Number(data.creditMax) || 0,
    creditActuel: Number(data.creditActuel) || 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  await db.insert(clients).values(payload);
  return { ...payload, name: payload.nom, phone: payload.telephone, address: payload.adresse };
}

async function updateClient(id: string, data: any) {
  const payload = {
    nom: data.nom || data.name,
    email: data.email || null,
    telephone: data.telephone || data.phone || null,
    adresse: data.adresse || data.address || null,
    ncBancaire: data.ncBancaire || null,
    nif: data.nif || null,
    rc: data.rc || null,
    ai: data.ai || null,
    nis: data.nis || null,
    creditMax: Number(data.creditMax) || 0,
    creditActuel: Number(data.creditActuel) || 0,
    updatedAt: new Date()
  };
  await db.update(clients).set(payload).where(eq(clients.id, id));
  return { id, ...payload, name: payload.nom, phone: payload.telephone, address: payload.adresse };
}

async function deleteClient(id: string) {
  await db.delete(clients).where(eq(clients.id, id));
}

async function getAllInvoices() {
  const [invRows, cliRows] = await Promise.all([
    db.select().from(invoices).orderBy(desc(invoices.createdAt)),
    getAllClients()
  ]);

  const clientMap = new Map(cliRows.map(c => [c.id, c]));

  return invRows.map(r => {
    let items = [];
    try {
      items = JSON.parse(r.itemsJson || '[]');
    } catch {
      items = [];
    }
    const client = clientMap.get(r.clientId) || {
      id: r.clientId,
      nom: 'Client inconnu',
      name: 'Client inconnu',
      creditMax: 0,
      creditActuel: 0,
      createdAt: '',
      updatedAt: ''
    };

    return {
      id: r.id,
      number: r.number,
      type: r.type,
      status: r.status,
      clientId: r.clientId,
      client,
      issueDate: r.issueDate,
      dueDate: r.dueDate,
      paymentDate: r.paymentDate || undefined,
      paymentMethod: r.paymentMethod || undefined,
      items,
      subtotalHT: r.subtotalHT,
      discountAmount: r.discountAmount,
      taxAmount: r.taxAmount,
      totalTTC: r.totalTTC,
      depositAmount: r.depositAmount ?? 0,
      notes: r.notes || undefined,
      paymentTerms: r.paymentTerms || undefined,
      convertedFromId: r.convertedFromId || undefined,
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString()
    };
  });
}

async function createInvoice(data: any) {
  const newId = `inv-${Date.now().toString().slice(-7)}`;
  const payload = {
    id: newId,
    number: data.number || `FAC-${new Date().getFullYear()}-001`,
    type: data.type || 'FACTURE',
    status: data.status || 'BROUILLON',
    clientId: data.clientId,
    issueDate: data.issueDate || new Date().toISOString().substring(0, 10),
    dueDate: data.dueDate || new Date().toISOString().substring(0, 10),
    paymentDate: data.paymentDate || null,
    paymentMethod: data.paymentMethod || null,
    itemsJson: JSON.stringify(data.items || []),
    subtotalHT: Number(data.subtotalHT) || 0,
    discountAmount: Number(data.discountAmount) || 0,
    taxAmount: Number(data.taxAmount) || 0,
    totalTTC: Number(data.totalTTC) || 0,
    depositAmount: Number(data.depositAmount) || 0,
    notes: data.notes || null,
    paymentTerms: data.paymentTerms || null,
    convertedFromId: data.convertedFromId || null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.insert(invoices).values(payload);
  const allInvoices = await getAllInvoices();
  return allInvoices.find(i => i.id === newId) || { ...data, id: newId };
}

async function updateInvoice(id: string, data: any) {
  const payload = {
    number: data.number,
    type: data.type,
    status: data.status,
    clientId: data.clientId,
    issueDate: data.issueDate,
    dueDate: data.dueDate,
    paymentDate: data.paymentDate || null,
    paymentMethod: data.paymentMethod || null,
    itemsJson: JSON.stringify(data.items || []),
    subtotalHT: Number(data.subtotalHT) || 0,
    discountAmount: Number(data.discountAmount) || 0,
    taxAmount: Number(data.taxAmount) || 0,
    totalTTC: Number(data.totalTTC) || 0,
    depositAmount: Number(data.depositAmount) || 0,
    notes: data.notes || null,
    paymentTerms: data.paymentTerms || null,
    convertedFromId: data.convertedFromId || null,
    updatedAt: new Date()
  };

  await db.update(invoices).set(payload).where(eq(invoices.id, id));
  const allInvoices = await getAllInvoices();
  return allInvoices.find(i => i.id === id);
}

async function updateInvoiceStatus(id: string, status: string, paymentDate?: string, paymentMethod?: string) {
  const payload: any = {
    status,
    updatedAt: new Date()
  };
  if (paymentDate) payload.paymentDate = paymentDate;
  if (paymentMethod) payload.paymentMethod = paymentMethod;

  await db.update(invoices).set(payload).where(eq(invoices.id, id));
  const allInvoices = await getAllInvoices();
  return allInvoices.find(i => i.id === id);
}

async function convertQuoteToInvoice(id: string) {
  const allInvoices = await getAllInvoices();
  const quote = allInvoices.find(i => i.id === id);
  if (!quote) throw new Error('Devis non trouvé');

  const newInvoiceNumber = `FAC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  const newInvoice = await createInvoice({
    ...quote,
    number: newInvoiceNumber,
    type: 'FACTURE',
    status: 'EN_ATTENTE',
    issueDate: new Date().toISOString().substring(0, 10),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10),
    convertedFromId: quote.id
  });

  await updateInvoiceStatus(quote.id, 'ACCEPTE');
  return newInvoice;
}

async function deleteInvoice(id: string) {
  await db.delete(invoices).where(eq(invoices.id, id));
}

async function clearAllData() {
  await db.delete(invoices);
  await db.delete(clients);
}

async function resetDemoData() {
  await clearAllData();
  const c1 = await createClient({
    nom: 'SARL PROMO IMMO ALGER',
    email: 'contact@promoimmo-alger.dz',
    telephone: '0550 11 22 33',
    adresse: '12 Boulevard Mohamed V, Alger Centre',
    nif: '002016098765432',
    rc: '16/00-9876543B20',
    ai: '16098765432',
    nis: '199816010098765',
    creditMax: 5000000,
    creditActuel: 1250000
  });

  const c2 = await createClient({
    nom: 'EURL BATIMENT MODERN ORAN',
    email: 'direction@batiment-oran.dz',
    telephone: '041 33 44 55',
    adresse: "Avenue Larbi Ben M'hidi, Oran",
    nif: '003031011223344',
    rc: '31/00-1122334B18',
    ai: '31011223344',
    nis: '200131010011223',
    creditMax: 3000000,
    creditActuel: 0
  });

  await createInvoice({
    number: 'FAC-2026-001',
    type: 'FACTURE',
    status: 'PAYEE',
    clientId: c1.id,
    issueDate: '2026-05-15',
    dueDate: '2026-06-15',
    paymentDate: '2026-06-10',
    paymentMethod: 'Virement',
    items: [
      { id: '1', description: 'Étude de structure BA & Plans de coffrage', quantity: 1, unitPrice: 250000, taxRate: 19, totalHT: 250000 },
      { id: '2', description: 'Assistance technique & Suivi de chantier (Mois 1)', quantity: 2, unitPrice: 150000, taxRate: 19, totalHT: 300000 }
    ],
    subtotalHT: 513000,
    discountAmount: 27000,
    taxAmount: 43740,
    totalTTC: 529740,
    paymentTerms: 'Règlement sous 30 jours par virement bancaire.'
  });
}

function calculateDashboardStats(invList: any[], cliList: any[]) {
  const currentYear = new Date().getFullYear();
  let totalRevenueHT = 0;
  let totalRevenueTTC = 0;
  let totalOutstandingTTC = 0;
  let totalOverdueTTC = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;
  const nowStr = new Date().toISOString().substring(0, 10);

  for (const inv of invList) {
    if (inv.type !== 'FACTURE') continue;
    if (inv.status === 'PAYEE') {
      totalRevenueHT += inv.subtotalHT || 0;
      totalRevenueTTC += inv.totalTTC || 0;
      paidCount++;
    } else if (inv.status === 'EN_ATTENTE' || inv.status === 'PARTIEL') {
      const remaining = (inv.totalTTC || 0) - (inv.depositAmount || 0);
      totalOutstandingTTC += remaining;
      pendingCount++;
      if (inv.dueDate && inv.dueDate < nowStr) {
        totalOverdueTTC += remaining;
        overdueCount++;
      }
    } else if (inv.status === 'EN_RETARD') {
      const remaining = (inv.totalTTC || 0) - (inv.depositAmount || 0);
      totalOutstandingTTC += remaining;
      totalOverdueTTC += remaining;
      overdueCount++;
    }
  }

  const activeClientsCount = cliList.length;
  const totalClientCreditActuel = cliList.reduce((acc, c) => acc + (c.creditActuel || 0), 0);

  return {
    totalRevenueHT,
    totalRevenueTTC,
    totalOutstandingTTC,
    totalOverdueTTC,
    paidCount,
    pendingCount,
    overdueCount,
    activeClientsCount,
    totalClientCreditActuel,
    year: currentYear
  };
}

// 5. HELPER UTILS
function getBody(req: any): any {
  if (!req.body) return {};
  if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  if (Buffer.isBuffer(req.body)) {
    try { return JSON.parse(req.body.toString('utf-8')); } catch { return {}; }
  }
  return {};
}

function sendJson(res: any, status: number, data: any) {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function getPath(req: any): string {
  let rawUrl = (req.headers && (req.headers['x-forwarded-uri'] as string)) ||
               (req.headers && (req.headers['x-rewrite-url'] as string)) ||
               (req.headers && (req.headers['x-matched-path'] as string)) ||
               req.originalUrl ||
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

// 6. EXPORTED SERVERLESS HANDLER FOR VERCEL
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  try {
    await seedCloudSQLIfEmpty();
  } catch (err) {
    console.warn('DB initialization warning:', err);
  }

  const method = (req.method || 'GET').toUpperCase();
  const path = getPath(req);
  const body = getBody(req);

  try {
    if (method === 'GET' && path === '/api/health') {
      let dbStatus = 'unknown';
      let dbError = null;
      try {
        await db.select().from(companyInfo).limit(1);
        dbStatus = 'connected';
      } catch (err: any) {
        dbStatus = 'error';
        dbError = err.message || String(err);
      }

      return sendJson(res, 200, {
        status: 'ok',
        provider: 'Neon PostgreSQL (Cloud DB)',
        databaseUrlConfigured: true,
        dbStatus,
        dbError,
        time: new Date().toISOString()
      });
    }

    if (method === 'GET' && path === '/api/company') {
      const company = await getCompanySettings();
      return sendJson(res, 200, company);
    }

    if (method === 'POST' && path === '/api/company') {
      const updated = await saveCompanySettings(body);
      return sendJson(res, 200, updated);
    }

    if (method === 'GET' && path === '/api/clients') {
      const clientsList = await getAllClients();
      return sendJson(res, 200, clientsList);
    }

    if (method === 'POST' && path === '/api/clients') {
      const newClient = await createClient(body);
      return sendJson(res, 201, newClient);
    }

    const clientPutMatch = path.match(/^\/api\/clients\/([^/]+)$/);
    if (method === 'PUT' && clientPutMatch) {
      const updated = await updateClient(clientPutMatch[1], body);
      return sendJson(res, 200, updated);
    }

    const clientDeleteMatch = path.match(/^\/api\/clients\/([^/]+)$/);
    if (method === 'DELETE' && clientDeleteMatch) {
      await deleteClient(clientDeleteMatch[1]);
      return sendJson(res, 200, { success: true, id: clientDeleteMatch[1] });
    }

    if (method === 'GET' && path === '/api/invoices') {
      const invoicesList = await getAllInvoices();
      return sendJson(res, 200, invoicesList);
    }

    if (method === 'POST' && path === '/api/invoices') {
      const newInvoice = await createInvoice(body);
      return sendJson(res, 201, newInvoice);
    }

    const statusMatch = path.match(/^\/api\/invoices\/([^/]+)\/status$/);
    if (method === 'PATCH' && statusMatch) {
      const { status, paymentDate, paymentMethod } = body;
      const updated = await updateInvoiceStatus(statusMatch[1], status, paymentDate, paymentMethod);
      return sendJson(res, 200, updated);
    }

    const convertMatch = path.match(/^\/api\/invoices\/([^/]+)\/convert-quote$/);
    if (method === 'POST' && convertMatch) {
      const result = await convertQuoteToInvoice(convertMatch[1]);
      return sendJson(res, 201, result);
    }

    const invoicePutMatch = path.match(/^\/api\/invoices\/([^/]+)$/);
    if (method === 'PUT' && invoicePutMatch) {
      const updated = await updateInvoice(invoicePutMatch[1], body);
      return sendJson(res, 200, updated);
    }

    const invoiceDeleteMatch = path.match(/^\/api\/invoices\/([^/]+)$/);
    if (method === 'DELETE' && invoiceDeleteMatch) {
      await deleteInvoice(invoiceDeleteMatch[1]);
      return sendJson(res, 200, { success: true, id: invoiceDeleteMatch[1] });
    }

    if (method === 'POST' && path === '/api/demo/clear') {
      await clearAllData();
      return sendJson(res, 200, { success: true, message: 'Toutes les données ont été effacées.' });
    }

    if (method === 'POST' && path === '/api/demo/reset') {
      await resetDemoData();
      return sendJson(res, 200, { success: true, message: 'Les données de test ont été réinjectées.' });
    }

    if (method === 'GET' && path === '/api/stats') {
      const [invList, cliList] = await Promise.all([getAllInvoices(), getAllClients()]);
      const stats = calculateDashboardStats(invList, cliList);
      return sendJson(res, 200, stats);
    }

    if (method === 'GET' && (path === '/api' || path === '/api/')) {
      return sendJson(res, 200, { status: 'ok', message: 'API Facturation Active' });
    }

    return sendJson(res, 404, { error: `Route non trouvée: ${method} ${path}` });
  } catch (err: any) {
    console.error(`Error handling ${method} ${path}:`, err);
    return sendJson(res, 500, {
      error: err?.message || 'Erreur serveur',
      details: String(err)
    });
  }
}
