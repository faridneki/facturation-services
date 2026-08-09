import { db } from './index';
import { clients, companyInfo, invoices, users } from './schema';
import { eq, desc, sql as drizzleSql } from 'drizzle-orm';
import { Client, CompanySettings, Invoice, InvoiceItem } from '../types';
import { initialCompanySettings } from '../data/initialData';

let isDbInitialized = false;

// Helper to seed Cloud SQL with admin user and create tables if empty
export async function seedCloudSQLIfEmpty() {
  if (isDbInitialized) return;
  try {
    const statements = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uid TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS company_info (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(uid),
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
        user_id TEXT REFERENCES users(uid),
        nom TEXT NOT NULL,
        email TEXT,
        telephone TEXT NOT NULL,
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

      `ALTER TABLE clients ADD COLUMN IF NOT EXISTS nc_bancaire TEXT`,
      `ALTER TABLE clients ADD COLUMN IF NOT EXISTS nif TEXT`,
      `ALTER TABLE clients ADD COLUMN IF NOT EXISTS rc TEXT`,
      `ALTER TABLE clients ADD COLUMN IF NOT EXISTS ai TEXT`,
      `ALTER TABLE clients ADD COLUMN IF NOT EXISTS nis TEXT`,
      `ALTER TABLE clients ADD COLUMN IF NOT EXISTS credit_max DOUBLE PRECISION DEFAULT 0`,
      `ALTER TABLE clients ADD COLUMN IF NOT EXISTS credit_actuel DOUBLE PRECISION DEFAULT 0`,

      `CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(uid),
        number TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        client_id TEXT NOT NULL,
        issue_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        payment_date TEXT,
        payment_method TEXT,
        items_json TEXT NOT NULL,
        subtotal_ht DOUBLE PRECISION NOT NULL,
        discount_amount DOUBLE PRECISION NOT NULL,
        tax_amount DOUBLE PRECISION NOT NULL,
        total_ttc DOUBLE PRECISION NOT NULL,
        deposit_amount DOUBLE PRECISION DEFAULT 0,
        notes TEXT,
        payment_terms TEXT,
        converted_from_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deposit_amount DOUBLE PRECISION DEFAULT 0`,
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT`,
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_terms TEXT`,
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS converted_from_id TEXT`,

      `CREATE TABLE IF NOT EXISTS system_flags (
        key TEXT PRIMARY KEY,
        value TEXT
      )`
    ];

    for (const stmt of statements) {
      try {
        await db.execute(drizzleSql.raw(stmt));
      } catch (err) {
        console.warn('Individual table init warning:', err);
      }
    }

    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length === 0) {
      console.log('Seeding initial admin user to Cloud SQL...');
      await db.insert(users).values({
        uid: 'admin-1',
        email: 'admin@facturation.com',
      }).onConflictDoNothing();
    }

    const existingCompany = await db.select().from(companyInfo).limit(1);
    if (existingCompany.length === 0) {
      await saveCompanySettings(initialCompanySettings);
    }

    isDbInitialized = true;
  } catch (err) {
    console.error('Error initializing Cloud SQL tables:', err);
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await db.delete(invoices);
    await db.delete(clients);
  } catch (err) {
    console.error('Failed to clear data:', err);
    throw err;
  }
}

export async function resetDemoData(): Promise<void> {
  try {
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
        {
          id: 'item-101-1',
          description: 'Fourniture et pose de fenêtres Aluminium double vitrage profilé thermique',
          category: 'Fourniture & Pose',
          unit: 'U',
          quantity: 12,
          unitPriceHT: 45000,
          vatRate: 9,
          discountPercent: 5,
          totalHT: 513000
        }
      ],
      subtotalHT: 513000,
      discountAmount: 27000,
      taxAmount: 43740,
      totalTTC: 529740,
      paymentTerms: 'Règlement sous 30 jours par virement bancaire.'
    });
  } catch (err) {
    console.error('Failed to reset demo data:', err);
    throw err;
  }
}

// Users
export async function getAllUsers() {
  try {
    return await db.select().from(users);
  } catch {
    return [];
  }
}

// Company Info
export async function getCompanySettings(uid?: string): Promise<CompanySettings> {
  try {
    const rows = uid 
      ? await db.select().from(companyInfo).where(eq(companyInfo.userId, uid)).limit(1)
      : await db.select().from(companyInfo).limit(1);
    
    if (rows.length === 0) {
      return initialCompanySettings;
    }
    return mapCompanyRow(rows[0]);
  } catch (err) {
    console.error('Error fetching company settings, using fallback:', err);
    return initialCompanySettings;
  }
}

export async function saveCompanySettings(data: Partial<CompanySettings>, uid?: string): Promise<CompanySettings> {
  try {
    const existing = await getCompanySettings(uid);
    const idToUse = existing.id || `comp-${Date.now()}`;

    await db.insert(companyInfo).values({
      id: idToUse,
      userId: uid || null,
      name: data.name || existing.name || 'Mon Entreprise',
      legalName: data.legalName ?? existing.legalName ?? '',
      taxId: data.taxId ?? existing.taxId ?? '',
      rc: data.rc ?? existing.rc ?? '',
      ai: data.ai ?? existing.ai ?? '',
      nis: data.nis ?? existing.nis ?? '',
      art: data.art ?? existing.art ?? '',
      address: data.address ?? existing.address ?? '',
      city: data.city ?? existing.city ?? '',
      postalCode: data.postalCode ?? existing.postalCode ?? '',
      country: data.country ?? existing.country ?? 'Algérie',
      phone: data.phone ?? existing.phone ?? '',
      email: data.email ?? existing.email ?? '',
      website: data.website ?? existing.website ?? '',
      logoUrl: data.logoUrl ?? existing.logoUrl ?? '',
      logoBase64: data.logoBase64 ?? existing.logoBase64 ?? '',
      footerText: data.footerText ?? existing.footerText ?? '',
      legalTerms: data.legalTerms ?? existing.legalTerms ?? '',
      bankName: data.bankName ?? existing.bankName ?? '',
      bankAccount: data.bankAccount ?? existing.bankAccount ?? '',
      bankRib: data.bankRib ?? existing.bankRib ?? '',
    }).onConflictDoUpdate({
      target: companyInfo.id,
      set: {
        name: data.name ?? existing.name,
        legalName: data.legalName ?? existing.legalName,
        taxId: data.taxId ?? existing.taxId,
        rc: data.rc ?? existing.rc,
        ai: data.ai ?? existing.ai,
        nis: data.nis ?? existing.nis,
        art: data.art ?? existing.art,
        address: data.address ?? existing.address,
        city: data.city ?? existing.city,
        postalCode: data.postalCode ?? existing.postalCode,
        country: data.country ?? existing.country,
        phone: data.phone ?? existing.phone,
        email: data.email ?? existing.email,
        website: data.website ?? existing.website,
        logoUrl: data.logoUrl ?? existing.logoUrl,
        logoBase64: data.logoBase64 ?? existing.logoBase64,
        footerText: data.footerText ?? existing.footerText,
        legalTerms: data.legalTerms ?? existing.legalTerms,
        bankName: data.bankName ?? existing.bankName,
        bankAccount: data.bankAccount ?? existing.bankAccount,
        bankRib: data.bankRib ?? existing.bankRib,
        updatedAt: new Date(),
      }
    });

    return getCompanySettings(uid);
  } catch (error) {
    console.error('Failed to save company settings:', error);
    throw new Error('Database operation failed', { cause: error });
  }
}

// Clients
async function autoRepairClientsTable() {
  const statements = [
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
    `ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id TEXT`,
    `ALTER TABLE clients ADD COLUMN IF NOT EXISTS nom TEXT`,
    `ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT`,
    `ALTER TABLE clients ADD COLUMN IF NOT EXISTS telephone TEXT`,
    `ALTER TABLE clients ADD COLUMN IF NOT EXISTS adresse TEXT`,
    `ALTER TABLE clients ADD COLUMN IF NOT EXISTS nc_bancaire TEXT`,
    `ALTER TABLE clients ADD COLUMN IF NOT EXISTS nif TEXT`,
    `ALTER TABLE clients ADD COLUMN IF NOT EXISTS rc TEXT`,
    `ALTER TABLE clients ADD COLUMN IF NOT EXISTS ai TEXT`,
    `ALTER TABLE clients ADD COLUMN IF NOT EXISTS nis TEXT`,
    `ALTER TABLE clients ADD COLUMN IF NOT EXISTS credit_max DOUBLE PRECISION DEFAULT 0`,
    `ALTER TABLE clients ADD COLUMN IF NOT EXISTS credit_actuel DOUBLE PRECISION DEFAULT 0`
  ];
  for (const stmt of statements) {
    try {
      await db.execute(drizzleSql.raw(stmt));
    } catch {
      // Ignore individual warnings
    }
  }
}

export async function getAllClients(): Promise<Client[]> {
  try {
    const rows = await db.select().from(clients).orderBy(desc(clients.createdAt));
    return rows.map(mapClientRow);
  } catch (err) {
    console.error('Error fetching clients from DB, attempting repair...', err);
    await autoRepairClientsTable();
    try {
      const rows = await db.select().from(clients).orderBy(desc(clients.createdAt));
      return rows.map(mapClientRow);
    } catch {
      return [];
    }
  }
}

export async function createClient(data: Partial<Client> = {}, uid?: string): Promise<Client> {
  const clientData = data || {};
  const id = clientData.id || `cli-${Date.now().toString().substring(6)}`;
  const nom = String(clientData.nom || clientData.name || 'Client').trim();
  const email = String(clientData.email || '').trim();
  const telephone = String(clientData.telephone || clientData.phone || '').trim();
  const adresse = String(clientData.adresse || clientData.address || '').trim();
  const ncBancaire = String(clientData.ncBancaire || '').trim();
  const nif = String(clientData.nif || clientData.siret || '').trim();
  const rc = String(clientData.rc || '').trim();
  const ai = String(clientData.ai || (clientData as any).art || '').trim();
  const nis = String(clientData.nis || '').trim();
  const creditMax = typeof clientData.creditMax === 'number' ? clientData.creditMax : (parseFloat(String(clientData.creditMax || 0)) || 0);
  const creditActuel = typeof clientData.creditActuel === 'number' ? clientData.creditActuel : (parseFloat(String(clientData.creditActuel || 0)) || 0);

  const payload = {
    id,
    userId: uid || null,
    nom: nom || 'Client',
    email,
    telephone,
    adresse,
    ncBancaire,
    nif,
    rc,
    ai,
    nis,
    creditMax,
    creditActuel,
  };

  try {
    const newRow = await db.insert(clients).values(payload).returning();
    if (newRow && newRow[0]) {
      return mapClientRow(newRow[0]);
    }
  } catch (err) {
    console.warn('createClient initial insert failed, running table repair and retry...', err);
    await autoRepairClientsTable();
    try {
      const retryRow = await db.insert(clients).values(payload).returning();
      if (retryRow && retryRow[0]) {
        return mapClientRow(retryRow[0]);
      }
    } catch (retryErr: any) {
      console.error('createClient retry failed:', retryErr);
      throw new Error(retryErr?.message || 'Failed to create client in database');
    }
  }

  return mapClientRow(payload);
}

export async function updateClient(id: string, data: Partial<Client>): Promise<Client> {
  const updatePayload: any = {
    updatedAt: new Date(),
  };

  if (data.nom || data.name) updatePayload.nom = String(data.nom || data.name || '').trim();
  if (data.email !== undefined) updatePayload.email = String(data.email || '').trim();
  if (data.telephone !== undefined || data.phone !== undefined) updatePayload.telephone = String(data.telephone || data.phone || '').trim();
  if (data.adresse !== undefined || data.address !== undefined) updatePayload.adresse = String(data.adresse ?? data.address ?? '').trim();
  if (data.ncBancaire !== undefined) updatePayload.ncBancaire = String(data.ncBancaire || '').trim();
  if (data.nif !== undefined || data.siret !== undefined) updatePayload.nif = String(data.nif ?? data.siret ?? '').trim();
  if (data.rc !== undefined) updatePayload.rc = String(data.rc || '').trim();
  if (data.ai !== undefined || (data as any).art !== undefined) updatePayload.ai = String(data.ai ?? (data as any).art ?? '').trim();
  if (data.nis !== undefined) updatePayload.nis = String(data.nis || '').trim();
  if (data.creditMax !== undefined) updatePayload.creditMax = typeof data.creditMax === 'number' ? data.creditMax : (parseFloat(String(data.creditMax || 0)) || 0);
  if (data.creditActuel !== undefined) updatePayload.creditActuel = typeof data.creditActuel === 'number' ? data.creditActuel : (parseFloat(String(data.creditActuel || 0)) || 0);

  try {
    const updated = await db.update(clients).set(updatePayload).where(eq(clients.id, id)).returning();
    if (updated && updated[0]) {
      return mapClientRow(updated[0]);
    }
  } catch (err) {
    console.warn('updateClient initial update failed, running table repair and retry...', err);
    await autoRepairClientsTable();
    try {
      const retryUpdated = await db.update(clients).set(updatePayload).where(eq(clients.id, id)).returning();
      if (retryUpdated && retryUpdated[0]) {
        return mapClientRow(retryUpdated[0]);
      }
    } catch (retryErr: any) {
      console.error('updateClient retry failed:', retryErr);
      throw new Error(retryErr?.message || 'Failed to update client in database');
    }
  }

  try {
    const existing = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    if (existing && existing[0]) {
      return mapClientRow(existing[0]);
    }
  } catch {
    // Ignore fallback query error
  }

  throw new Error('Client introuvable après mise à jour');
}

export async function deleteClient(id: string): Promise<void> {
  try {
    // Delete any associated invoices first so foreign key constraint does not block client deletion
    await db.delete(invoices).where(eq(invoices.clientId, id));
    await db.delete(clients).where(eq(clients.id, id));
  } catch (error: any) {
    console.error('Failed to delete client in Cloud SQL:', error);
    throw new Error(error?.message || 'Failed to delete client');
  }
}

// Invoices
export async function getAllInvoices(): Promise<Invoice[]> {
  try {
    const allClients = await getAllClients();
    const rows = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
    
    return rows.map(row => {
      const parsedItems: InvoiceItem[] = JSON.parse(row.itemsJson || '[]');
      const clientObj = allClients.find(c => c.id === row.clientId);
      return {
        id: row.id,
        number: row.number,
        type: row.type as any,
        status: row.status as any,
        clientId: row.clientId,
        client: clientObj,
        issueDate: row.issueDate,
        dueDate: row.dueDate,
        paymentDate: row.paymentDate || undefined,
        paymentMethod: row.paymentMethod as any,
        items: parsedItems,
        subtotalHT: row.subtotalHT,
        discountAmount: row.discountAmount,
        taxAmount: row.taxAmount,
        totalTTC: row.totalTTC,
        depositAmount: row.depositAmount || 0,
        notes: row.notes || undefined,
        paymentTerms: row.paymentTerms || undefined,
        convertedFromId: row.convertedFromId || undefined,
        createdAt: safeIsoString(row.createdAt),
        updatedAt: row.updatedAt ? safeIsoString(row.updatedAt) : undefined,
      };
    });
  } catch (err) {
    console.error('Error fetching invoices from DB:', err);
    throw err;
  }
}

export async function createInvoice(data: Partial<Invoice>, uid?: string): Promise<Invoice> {
  try {
    const id = data.id || `inv-${Date.now().toString().substring(6)}`;
    const itemsJson = JSON.stringify(data.items || []);

    const newRows = await db.insert(invoices).values({
      id,
      userId: uid || null,
      number: data.number || 'FAC-001',
      type: data.type || 'FACTURE',
      status: data.status || 'BROUILLON',
      clientId: data.clientId || '',
      issueDate: data.issueDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      paymentDate: data.paymentDate || null,
      paymentMethod: data.paymentMethod || null,
      itemsJson,
      subtotalHT: data.subtotalHT || 0,
      discountAmount: data.discountAmount || 0,
      taxAmount: data.taxAmount || 0,
      totalTTC: data.totalTTC || 0,
      depositAmount: data.depositAmount || 0,
      notes: data.notes || null,
      paymentTerms: data.paymentTerms || null,
      convertedFromId: data.convertedFromId || null,
    }).returning();

    const allInvoices = await getAllInvoices();
    return allInvoices.find(i => i.id === id) || ({} as Invoice);
  } catch (error: any) {
    console.error('Failed to create invoice in Cloud SQL:', error);
    throw new Error(error?.message || 'Failed to create invoice');
  }
}

export async function updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
  try {
    const updatePayload: any = {
      updatedAt: new Date(),
    };
    if (data.number) updatePayload.number = data.number;
    if (data.type) updatePayload.type = data.type;
    if (data.status) updatePayload.status = data.status;
    if (data.clientId) updatePayload.clientId = data.clientId;
    if (data.issueDate) updatePayload.issueDate = data.issueDate;
    if (data.dueDate) updatePayload.dueDate = data.dueDate;
    if (data.paymentDate !== undefined) updatePayload.paymentDate = data.paymentDate;
    if (data.paymentMethod !== undefined) updatePayload.paymentMethod = data.paymentMethod;
    if (data.items) updatePayload.itemsJson = JSON.stringify(data.items);
    if (data.subtotalHT !== undefined) updatePayload.subtotalHT = data.subtotalHT;
    if (data.discountAmount !== undefined) updatePayload.discountAmount = data.discountAmount;
    if (data.taxAmount !== undefined) updatePayload.taxAmount = data.taxAmount;
    if (data.totalTTC !== undefined) updatePayload.totalTTC = data.totalTTC;
    if (data.depositAmount !== undefined) updatePayload.depositAmount = data.depositAmount;
    if (data.notes !== undefined) updatePayload.notes = data.notes;
    if (data.paymentTerms !== undefined) updatePayload.paymentTerms = data.paymentTerms;

    await db.update(invoices).set(updatePayload).where(eq(invoices.id, id));

    const allInvoices = await getAllInvoices();
    return allInvoices.find(i => i.id === id) || ({} as Invoice);
  } catch (error: any) {
    console.error('Failed to update invoice in Cloud SQL:', error);
    throw new Error(error?.message || 'Failed to update invoice');
  }
}

export async function updateInvoiceStatus(id: string, status: string, paymentDate?: string, paymentMethod?: string): Promise<Invoice> {
  try {
    const updatePayload: any = { status, updatedAt: new Date() };
    if (paymentDate) updatePayload.paymentDate = paymentDate;
    if (paymentMethod) updatePayload.paymentMethod = paymentMethod;

    await db.update(invoices).set(updatePayload).where(eq(invoices.id, id));

    const allInvoices = await getAllInvoices();
    return allInvoices.find(i => i.id === id) || ({} as Invoice);
  } catch (error: any) {
    console.error('Failed to update invoice status in Cloud SQL:', error);
    throw new Error(error?.message || 'Failed to update invoice status');
  }
}

export async function convertQuoteToInvoice(id: string): Promise<{ quote: Invoice; invoice: Invoice }> {
  try {
    const allInvoices = await getAllInvoices();
    const quote = allInvoices.find(i => i.id === id && i.type === 'DEVIS');
    if (!quote) throw new Error('Devis introuvable ou déjà converti');

    let maxSeq = 0;
    const yearStr = String(new Date().getFullYear());
    const facPattern = new RegExp(`^FAC-${yearStr}-(\\d+)$`, 'i');
    allInvoices.forEach((i) => {
      const match = i.number?.match(facPattern);
      if (match && match[1]) {
        const seq = parseInt(match[1], 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    });
    const nextNumber = `FAC-${yearStr}-${String(maxSeq + 1).padStart(3, '0')}`;

    const newInvoice = await createInvoice({
      ...quote,
      id: `inv-${Date.now().toString().substring(6)}`,
      number: nextNumber,
      type: 'FACTURE',
      status: 'ENVOYEE',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      convertedFromId: quote.id,
    });

    const updatedNotes = (quote.notes || '') + ` [Converti en Facture ${nextNumber}]`;
    await updateInvoice(quote.id, { notes: updatedNotes });

    const freshQuote = (await getAllInvoices()).find(i => i.id === id)!;
    return { quote: freshQuote, invoice: newInvoice };
  } catch (error: any) {
    console.error('Failed to convert quote in Cloud SQL:', error);
    throw new Error(error?.message || 'Failed to convert quote');
  }
}

export async function deleteInvoice(id: string): Promise<void> {
  try {
    await db.delete(invoices).where(eq(invoices.id, id));
  } catch (error: any) {
    console.error('Failed to delete invoice in Cloud SQL:', error);
    throw new Error(error?.message || 'Failed to delete invoice');
  }
}

// Helpers
function safeIsoString(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (val instanceof Date) return val.toISOString();
  try {
    return new Date(val).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function safeShortDate(val: any): string {
  const str = safeIsoString(val);
  return str.split('T')[0] || str;
}

function mapCompanyRow(row: any): CompanySettings {
  if (!row) return initialCompanySettings;
  return {
    id: row.id,
    name: row.name,
    legalName: row.legalName || undefined,
    taxId: row.taxId || undefined,
    rc: row.rc || undefined,
    ai: row.ai || undefined,
    nis: row.nis || undefined,
    art: row.art || undefined,
    address: row.address || undefined,
    city: row.city || undefined,
    postalCode: row.postalCode || undefined,
    country: row.country || undefined,
    phone: row.phone || undefined,
    email: row.email || undefined,
    website: row.website || undefined,
    logoUrl: row.logoUrl || undefined,
    logoBase64: row.logoBase64 || undefined,
    footerText: row.footerText || undefined,
    legalTerms: row.legalTerms || undefined,
    bankName: row.bankName || undefined,
    bankAccount: row.bankAccount || undefined,
    bankRib: row.bankRib || undefined,
  };
}

function mapClientRow(row: any): Client {
  if (!row) return {} as Client;
  return {
    id: row.id,
    nom: row.nom,
    name: row.nom,
    email: row.email || undefined,
    telephone: row.telephone || '',
    phone: row.telephone || '',
    adresse: row.adresse || undefined,
    address: row.adresse || undefined,
    ncBancaire: row.ncBancaire || undefined,
    nif: row.nif || undefined,
    rc: row.rc || undefined,
    ai: row.ai || undefined,
    nis: row.nis || undefined,
    creditMax: Number(row.creditMax) || 0,
    creditActuel: Number(row.creditActuel) || 0,
    createdAt: safeShortDate(row.createdAt),
    updatedAt: row.updatedAt ? safeShortDate(row.updatedAt) : undefined,
  };
}
