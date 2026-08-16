var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/apiHandler.ts
import dotenv2 from "dotenv";

// src/utils/calculations.ts
function calculateDashboardStats(invoicesInput, clientsInput) {
  const invoices2 = Array.isArray(invoicesInput) ? invoicesInput : [];
  const clients2 = Array.isArray(clientsInput) ? clientsInput : [];
  const now = /* @__PURE__ */ new Date();
  const currentYear = now.getFullYear();
  const factures = invoices2.filter((i) => i && i.type === "FACTURE");
  const devis = invoices2.filter((i) => i && i.type === "DEVIS");
  let monthlyRevenue = 0;
  let annualRevenue = 0;
  let paidAmount = 0;
  let pendingAmount = 0;
  let overdueAmount = 0;
  let draftCount = 0;
  let sentCount = 0;
  let paidCount = 0;
  let overdueCount = 0;
  const currentMonthStr = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  factures.forEach((inv) => {
    if (!inv) return;
    const issueDate = inv.issueDate || "";
    const isThisYear = issueDate.startsWith(String(currentYear));
    const isThisMonth = issueDate.startsWith(currentMonthStr);
    const totalTTC = inv.totalTTC || 0;
    if (inv.status === "PAYEE") {
      paidAmount += totalTTC;
      paidCount++;
      if (isThisYear) annualRevenue += totalTTC;
      if (isThisMonth) monthlyRevenue += totalTTC;
    } else if (inv.status === "ENVOYEE") {
      pendingAmount += totalTTC;
      sentCount++;
    } else if (inv.status === "EN_RETARD") {
      overdueAmount += totalTTC;
      overdueCount++;
    } else if (inv.status === "BROUILLON") {
      draftCount++;
    }
  });
  const monthNames = ["Janv", "F\xE9vr", "Mars", "Avr", "Mai", "Juin", "Juil", "Ao\xFBt", "Sept", "Oct", "Nov", "D\xE9c"];
  const revenueByMonth = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
    let ca = 0;
    let encaisse = 0;
    let devisTotal = 0;
    factures.forEach((inv) => {
      if (!inv) return;
      const issueDate = inv.issueDate || "";
      const totalTTC = inv.totalTTC || 0;
      if (issueDate.startsWith(mStr)) {
        ca += totalTTC;
        if (inv.status === "PAYEE") encaisse += totalTTC;
      }
    });
    devis.forEach((dev) => {
      if (!dev) return;
      const issueDate = dev.issueDate || "";
      const totalTTC = dev.totalTTC || 0;
      if (issueDate.startsWith(mStr)) {
        devisTotal += totalTTC;
      }
    });
    revenueByMonth.push({
      month: label,
      ca,
      encaisse,
      devis: devisTotal
    });
  }
  const statusBreakdown = [
    { name: "Pay\xE9es", value: paidCount, color: "#10b981" },
    { name: "En attente", value: sentCount, color: "#3b82f6" },
    { name: "En retard", value: overdueCount, color: "#ef4444" },
    { name: "Brouillons", value: draftCount, color: "#9ca3af" }
  ].filter((s) => s.value > 0);
  const serviceMap = {};
  factures.forEach((inv) => {
    if (!inv) return;
    const items = Array.isArray(inv.items) ? inv.items : [];
    items.forEach((item) => {
      if (!item) return;
      const category = item.category || "Fourniture & Pose";
      serviceMap[category] = (serviceMap[category] || 0) + (item.totalHT || 0);
    });
  });
  const topServices = Object.entries(serviceMap).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue);
  const acceptedQuotes = devis.filter((d) => d && (d.status === "PAYEE" || d.convertedFromId || d.status === "ENVOYEE")).length;
  const quotesConversionRate = devis.length > 0 ? Math.round(acceptedQuotes / devis.length * 100) : 0;
  return {
    monthlyRevenue,
    annualRevenue,
    paidAmount,
    pendingAmount,
    overdueAmount,
    draftCount,
    sentCount,
    paidCount,
    overdueCount,
    totalClients: clients2.length,
    quotesCount: devis.length,
    quotesConversionRate,
    revenueByMonth,
    statusBreakdown,
    topServices
  };
}

// src/db/index.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql as drizzleSql } from "drizzle-orm";
import dotenv from "dotenv";
import path from "path";

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  clients: () => clients,
  companyInfo: () => companyInfo,
  invoices: () => invoices,
  systemFlags: () => systemFlags,
  users: () => users
});
import { pgTable, text, timestamp, doublePrecision, serial } from "drizzle-orm/pg-core";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(),
  // Firebase Auth UID
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var companyInfo = pgTable("company_info", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull(),
  legalName: text("legal_name"),
  taxId: text("tax_id"),
  rc: text("rc"),
  ai: text("ai"),
  nis: text("nis"),
  art: text("art"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  logoUrl: text("logo_url"),
  logoBase64: text("logo_base64"),
  footerText: text("footer_text"),
  legalTerms: text("legal_terms"),
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  bankRib: text("bank_rib"),
  updatedAt: timestamp("updated_at").defaultNow()
});
var clients = pgTable("clients", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  nom: text("nom").notNull(),
  email: text("email"),
  telephone: text("telephone"),
  adresse: text("adresse"),
  ncBancaire: text("nc_bancaire"),
  nif: text("nif"),
  rc: text("rc"),
  ai: text("ai"),
  nis: text("nis"),
  creditMax: doublePrecision("credit_max").default(0),
  creditActuel: doublePrecision("credit_actuel").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  number: text("number").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  clientId: text("client_id").notNull(),
  issueDate: text("issue_date").notNull(),
  dueDate: text("due_date").notNull(),
  paymentDate: text("payment_date"),
  paymentMethod: text("payment_method"),
  itemsJson: text("items_json").notNull(),
  subtotalHT: doublePrecision("subtotal_ht").notNull(),
  discountAmount: doublePrecision("discount_amount").notNull(),
  taxAmount: doublePrecision("tax_amount").notNull(),
  totalTTC: doublePrecision("total_ttc").notNull(),
  depositAmount: doublePrecision("deposit_amount").default(0),
  notes: text("notes"),
  paymentTerms: text("payment_terms"),
  convertedFromId: text("converted_from_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var systemFlags = pgTable("system_flags", {
  key: text("key").primaryKey(),
  value: text("value")
});

// src/db/index.ts
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
var DEFAULT_NEON_URL = "postgresql://neondb_owner:npg_USAVX1b4ueyr@ep-young-wildflower-agt8whdg-pooler.c-2.eu-central-1.aws.neon.tech/facturation_db?sslmode=require";
var getConnectionString = () => {
  const envUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
  const isValidEnvUrl = envUrl && envUrl.includes("@") && !envUrl.includes("user:password");
  return isValidEnvUrl ? envUrl : DEFAULT_NEON_URL;
};
var connectionString = getConnectionString();
console.log("Initializing Neon PostgreSQL HTTP driver for serverless database connectivity...");
var sql = neon(connectionString);
var db = drizzle(sql, { schema: schema_exports });

// src/db/dbService.ts
import { eq, desc, sql as drizzleSql2 } from "drizzle-orm";

// src/data/initialData.ts
var initialCompanySettings = {
  id: "main",
  name: "ALGERIE BATI PRO",
  legalName: "SARL ALGERIE BATI PRO & POSE",
  taxId: "001916012345678",
  // NIF
  rc: "16/00-0123456B19",
  // Registre du Commerce
  ai: "16012345678",
  // Article d'Imposition
  nis: "199516010012345",
  // NIS
  art: "16012345678",
  address: "Zone Industrielle Oued Smar, Lot 14",
  city: "Alger",
  postalCode: "16000",
  country: "Alg\xE9rie",
  email: "contact@batipro-dz.com",
  phone: "023 92 10 50 / 0550 12 34 56",
  website: "www.batipro-dz.com",
  bankName: "BNA - Banque Nationale d'Alg\xE9rie",
  bankAccount: "001 00810 0300 000123 45",
  bankRib: "00100810030000012345 88",
  logoUrl: "",
  logoBase64: "",
  // Users can upload a logo image
  defaultVatRate: 9,
  // 9% TVA Algérie
  footerText: "Merci pour votre confiance. Soci\xE9t\xE9 au capital de 10 000 000 DA.",
  legalTerms: "Paiement \xE0 30 jours par virement ou ch\xE8que bancaire. P\xE9nalit\xE9s de retard au taux l\xE9gal.",
  isActive: true,
  // Legacy aliases
  siret: "001916012345678",
  vatNumber: "NIF: 001916012345678",
  iban: "00100810030000012345 88",
  bic: "BNAEDZALXXX",
  paymentTerms: "Paiement \xE0 30 jours par virement ou ch\xE8que bancaire."
};

// src/db/dbService.ts
var isDbInitialized = false;
async function seedCloudSQLIfEmpty() {
  if (isDbInitialized) return;
  try {
    try {
      await db.select().from(clients).limit(1);
      isDbInitialized = true;
      return;
    } catch {
    }
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
      statements.map(
        (stmt) => db.execute(drizzleSql2.raw(stmt)).catch((err) => {
          console.warn("Individual table init warning:", err);
        })
      )
    );
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length === 0) {
      console.log("Seeding initial admin user to Cloud SQL...");
      await db.insert(users).values({
        uid: "admin-1",
        email: "admin@facturation.com"
      }).onConflictDoNothing();
    }
    const existingCompany = await db.select().from(companyInfo).limit(1);
    if (existingCompany.length === 0) {
      await saveCompanySettings(initialCompanySettings);
    }
    const existingClients = await db.select().from(clients).limit(1);
    if (existingClients.length === 0) {
      console.log("Seeding initial demo clients and invoices to Neon PostgreSQL...");
      await resetDemoData();
    }
    isDbInitialized = true;
  } catch (err) {
    console.error("Error initializing Cloud SQL tables:", err);
  }
}
async function clearAllData() {
  try {
    await db.delete(invoices);
    await db.delete(clients);
  } catch (err) {
    console.error("Failed to clear data:", err);
    throw err;
  }
}
async function resetDemoData() {
  try {
    await clearAllData();
    const c1 = await createClient({
      nom: "SARL PROMO IMMO ALGER",
      email: "contact@promoimmo-alger.dz",
      telephone: "0550 11 22 33",
      adresse: "12 Boulevard Mohamed V, Alger Centre",
      nif: "002016098765432",
      rc: "16/00-9876543B20",
      ai: "16098765432",
      nis: "199816010098765",
      creditMax: 5e6,
      creditActuel: 125e4
    });
    const c2 = await createClient({
      nom: "EURL BATIMENT MODERN ORAN",
      email: "direction@batiment-oran.dz",
      telephone: "041 33 44 55",
      adresse: "Avenue Larbi Ben M'hidi, Oran",
      nif: "003031011223344",
      rc: "31/00-1122334B18",
      ai: "31011223344",
      nis: "200131010011223",
      creditMax: 3e6,
      creditActuel: 0
    });
    await createInvoice({
      number: "FAC-2026-001",
      type: "FACTURE",
      status: "PAYEE",
      clientId: c1.id,
      issueDate: "2026-05-15",
      dueDate: "2026-06-15",
      paymentDate: "2026-06-10",
      paymentMethod: "Virement",
      items: [
        {
          id: "item-101-1",
          description: "Fourniture et pose de fen\xEAtres Aluminium double vitrage profil\xE9 thermique",
          category: "Fourniture & Pose",
          unit: "U",
          quantity: 12,
          unitPriceHT: 45e3,
          vatRate: 9,
          discountPercent: 5,
          totalHT: 513e3
        }
      ],
      subtotalHT: 513e3,
      discountAmount: 27e3,
      taxAmount: 43740,
      totalTTC: 529740,
      paymentTerms: "R\xE8glement sous 30 jours par virement bancaire."
    });
  } catch (err) {
    console.error("Failed to reset demo data:", err);
    throw err;
  }
}
async function getAllUsers() {
  try {
    return await db.select().from(users);
  } catch {
    return [];
  }
}
async function getCompanySettings(uid) {
  try {
    const rows = uid ? await db.select().from(companyInfo).where(eq(companyInfo.userId, uid)).limit(1) : await db.select().from(companyInfo).limit(1);
    if (rows.length === 0) {
      return initialCompanySettings;
    }
    return mapCompanyRow(rows[0]);
  } catch (err) {
    console.error("Error fetching company settings, using fallback:", err);
    return initialCompanySettings;
  }
}
async function saveCompanySettings(data, uid) {
  try {
    const existing = await getCompanySettings(uid);
    const idToUse = existing.id || `comp-${Date.now()}`;
    await db.insert(companyInfo).values({
      id: idToUse,
      userId: uid || null,
      name: data.name || existing.name || "Mon Entreprise",
      legalName: data.legalName ?? existing.legalName ?? "",
      taxId: data.taxId ?? existing.taxId ?? "",
      rc: data.rc ?? existing.rc ?? "",
      ai: data.ai ?? existing.ai ?? "",
      nis: data.nis ?? existing.nis ?? "",
      art: data.art ?? existing.art ?? "",
      address: data.address ?? existing.address ?? "",
      city: data.city ?? existing.city ?? "",
      postalCode: data.postalCode ?? existing.postalCode ?? "",
      country: data.country ?? existing.country ?? "Alg\xE9rie",
      phone: data.phone ?? existing.phone ?? "",
      email: data.email ?? existing.email ?? "",
      website: data.website ?? existing.website ?? "",
      logoUrl: data.logoUrl ?? existing.logoUrl ?? "",
      logoBase64: data.logoBase64 ?? existing.logoBase64 ?? "",
      footerText: data.footerText ?? existing.footerText ?? "",
      legalTerms: data.legalTerms ?? existing.legalTerms ?? "",
      bankName: data.bankName ?? existing.bankName ?? "",
      bankAccount: data.bankAccount ?? existing.bankAccount ?? "",
      bankRib: data.bankRib ?? existing.bankRib ?? ""
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
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
    return getCompanySettings(uid);
  } catch (error) {
    console.error("Failed to save company settings:", error);
    throw new Error("Database operation failed", { cause: error });
  }
}
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
    `ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_user_id_fkey`,
    `ALTER TABLE clients ALTER COLUMN telephone DROP NOT NULL`,
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
      await db.execute(drizzleSql2.raw(stmt));
    } catch {
    }
  }
}
async function getAllClients() {
  try {
    let rows = await db.select().from(clients).orderBy(desc(clients.createdAt));
    if (rows.length === 0) {
      console.log("No clients found in Neon PostgreSQL, auto-seeding demo data...");
      try {
        await resetDemoData();
        rows = await db.select().from(clients).orderBy(desc(clients.createdAt));
      } catch (seedErr) {
        console.warn("Auto-seed in getAllClients error:", seedErr);
      }
    }
    return rows.map(mapClientRow);
  } catch (err) {
    console.error("Error fetching clients from DB, attempting repair...", err);
    await autoRepairClientsTable();
    try {
      let rows = await db.select().from(clients).orderBy(desc(clients.createdAt));
      if (rows.length === 0) {
        try {
          await resetDemoData();
          rows = await db.select().from(clients).orderBy(desc(clients.createdAt));
        } catch {
        }
      }
      return rows.map(mapClientRow);
    } catch {
      return [];
    }
  }
}
async function createClient(data = {}, uid) {
  const clientData = data || {};
  const id = clientData.id || `cli-${Date.now().toString().substring(6)}`;
  const nom = String(clientData.nom || clientData.name || "Client").trim();
  const email = String(clientData.email || "").trim();
  const telephone = String(clientData.telephone || clientData.phone || "").trim();
  const adresse = String(clientData.adresse || clientData.address || "").trim();
  const ncBancaire = String(clientData.ncBancaire || "").trim();
  const nif = String(clientData.nif || clientData.siret || "").trim();
  const rc = String(clientData.rc || "").trim();
  const ai = String(clientData.ai || clientData.art || "").trim();
  const nis = String(clientData.nis || "").trim();
  const creditMax = typeof clientData.creditMax === "number" ? clientData.creditMax : parseFloat(String(clientData.creditMax || 0)) || 0;
  const creditActuel = typeof clientData.creditActuel === "number" ? clientData.creditActuel : parseFloat(String(clientData.creditActuel || 0)) || 0;
  const payload = {
    id,
    userId: uid || null,
    nom: nom || "Client",
    email,
    telephone,
    adresse,
    ncBancaire,
    nif,
    rc,
    ai,
    nis,
    creditMax,
    creditActuel
  };
  try {
    const newRow = await db.insert(clients).values(payload).returning();
    if (newRow && newRow[0]) {
      return mapClientRow(newRow[0]);
    }
  } catch (err) {
    console.warn("createClient initial insert failed, running table repair and raw SQL fallback...", err);
    await autoRepairClientsTable();
    try {
      await sql`
        INSERT INTO clients (id, user_id, nom, email, telephone, adresse, nc_bancaire, nif, rc, ai, nis, credit_max, credit_actuel)
        VALUES (${id}, ${uid || null}, ${nom || "Client"}, ${email}, ${telephone}, ${adresse}, ${ncBancaire}, ${nif}, ${rc}, ${ai}, ${nis}, ${creditMax}, ${creditActuel})
        ON CONFLICT (id) DO UPDATE SET
          nom = EXCLUDED.nom,
          email = EXCLUDED.email,
          telephone = EXCLUDED.telephone,
          adresse = EXCLUDED.adresse,
          nc_bancaire = EXCLUDED.nc_bancaire,
          nif = EXCLUDED.nif,
          rc = EXCLUDED.rc,
          ai = EXCLUDED.ai,
          nis = EXCLUDED.nis,
          credit_max = EXCLUDED.credit_max,
          credit_actuel = EXCLUDED.credit_actuel,
          updated_at = NOW();
      `;
    } catch (retryErr) {
      console.error("createClient raw SQL insert failed:", retryErr);
      throw new Error(retryErr?.message || "Erreur lors de la cr\xE9ation du client dans la base de donn\xE9es");
    }
  }
  return mapClientRow(payload);
}
async function updateClient(id, data) {
  const updatePayload = {
    updatedAt: /* @__PURE__ */ new Date()
  };
  if (data.nom || data.name) updatePayload.nom = String(data.nom || data.name || "").trim();
  if (data.email !== void 0) updatePayload.email = String(data.email || "").trim();
  if (data.telephone !== void 0 || data.phone !== void 0) updatePayload.telephone = String(data.telephone || data.phone || "").trim();
  if (data.adresse !== void 0 || data.address !== void 0) updatePayload.adresse = String(data.adresse ?? data.address ?? "").trim();
  if (data.ncBancaire !== void 0) updatePayload.ncBancaire = String(data.ncBancaire || "").trim();
  if (data.nif !== void 0 || data.siret !== void 0) updatePayload.nif = String(data.nif ?? data.siret ?? "").trim();
  if (data.rc !== void 0) updatePayload.rc = String(data.rc || "").trim();
  if (data.ai !== void 0 || data.art !== void 0) updatePayload.ai = String(data.ai ?? data.art ?? "").trim();
  if (data.nis !== void 0) updatePayload.nis = String(data.nis || "").trim();
  if (data.creditMax !== void 0) updatePayload.creditMax = typeof data.creditMax === "number" ? data.creditMax : parseFloat(String(data.creditMax || 0)) || 0;
  if (data.creditActuel !== void 0) updatePayload.creditActuel = typeof data.creditActuel === "number" ? data.creditActuel : parseFloat(String(data.creditActuel || 0)) || 0;
  try {
    const updated = await db.update(clients).set(updatePayload).where(eq(clients.id, id)).returning();
    if (updated && updated[0]) {
      return mapClientRow(updated[0]);
    }
  } catch (err) {
    console.warn("updateClient initial update failed, running table repair and raw SQL fallback...", err);
    await autoRepairClientsTable();
    try {
      await sql`
        UPDATE clients SET
          nom = COALESCE(NULLIF(${updatePayload.nom || ""}, ''), nom),
          email = COALESCE(${updatePayload.email ?? null}, email),
          telephone = COALESCE(${updatePayload.telephone ?? null}, telephone),
          adresse = COALESCE(${updatePayload.adresse ?? null}, adresse),
          nc_bancaire = COALESCE(${updatePayload.ncBancaire ?? null}, nc_bancaire),
          nif = COALESCE(${updatePayload.nif ?? null}, nif),
          rc = COALESCE(${updatePayload.rc ?? null}, rc),
          ai = COALESCE(${updatePayload.ai ?? null}, ai),
          nis = COALESCE(${updatePayload.nis ?? null}, nis),
          credit_max = ${updatePayload.creditMax ?? 0},
          credit_actuel = ${updatePayload.creditActuel ?? 0},
          updated_at = NOW()
        WHERE id = ${id};
      `;
    } catch (retryErr) {
      console.error("updateClient retry failed:", retryErr);
      throw new Error(retryErr?.message || "Erreur lors de la mise \xE0 jour du client dans la base de donn\xE9es");
    }
  }
  try {
    const existing = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    if (existing && existing[0]) {
      return mapClientRow(existing[0]);
    }
  } catch {
  }
  throw new Error("Client introuvable apr\xE8s mise \xE0 jour");
}
async function deleteClient(id) {
  try {
    await db.delete(invoices).where(eq(invoices.clientId, id));
    await db.delete(clients).where(eq(clients.id, id));
  } catch (error) {
    console.error("Failed to delete client in Cloud SQL:", error);
    throw new Error(error?.message || "Failed to delete client");
  }
}
async function getAllInvoices() {
  try {
    const allClients = await getAllClients();
    const rows = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
    return rows.map((row) => {
      const parsedItems = JSON.parse(row.itemsJson || "[]");
      const clientObj = allClients.find((c) => c.id === row.clientId);
      return {
        id: row.id,
        number: row.number,
        type: row.type,
        status: row.status,
        clientId: row.clientId,
        client: clientObj,
        issueDate: row.issueDate,
        dueDate: row.dueDate,
        paymentDate: row.paymentDate || void 0,
        paymentMethod: row.paymentMethod,
        items: parsedItems,
        subtotalHT: row.subtotalHT,
        discountAmount: row.discountAmount,
        taxAmount: row.taxAmount,
        totalTTC: row.totalTTC,
        depositAmount: row.depositAmount || 0,
        notes: row.notes || void 0,
        paymentTerms: row.paymentTerms || void 0,
        convertedFromId: row.convertedFromId || void 0,
        createdAt: safeIsoString(row.createdAt),
        updatedAt: row.updatedAt ? safeIsoString(row.updatedAt) : void 0
      };
    });
  } catch (err) {
    console.error("Error fetching invoices from DB:", err);
    throw err;
  }
}
async function autoRepairInvoicesTable() {
  const statements = [
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
    `ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_user_id_fkey`,
    `ALTER TABLE invoices ALTER COLUMN items_json DROP NOT NULL`,
    `ALTER TABLE invoices ALTER COLUMN subtotal_ht DROP NOT NULL`,
    `ALTER TABLE invoices ALTER COLUMN discount_amount DROP NOT NULL`,
    `ALTER TABLE invoices ALTER COLUMN tax_amount DROP NOT NULL`,
    `ALTER TABLE invoices ALTER COLUMN total_ttc DROP NOT NULL`,
    `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deposit_amount DOUBLE PRECISION DEFAULT 0`,
    `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT`,
    `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_terms TEXT`,
    `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS converted_from_id TEXT`
  ];
  for (const stmt of statements) {
    try {
      await db.execute(drizzleSql2.raw(stmt));
    } catch {
    }
  }
}
async function createInvoice(data, uid) {
  const id = data.id || `inv-${Date.now().toString().substring(6)}`;
  const itemsJson = JSON.stringify(data.items || []);
  const payload = {
    id,
    userId: uid || null,
    number: data.number || "FAC-001",
    type: data.type || "FACTURE",
    status: data.status || "BROUILLON",
    clientId: data.clientId || "",
    issueDate: data.issueDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    dueDate: data.dueDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
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
    convertedFromId: data.convertedFromId || null
  };
  try {
    await db.insert(invoices).values(payload).returning();
  } catch (error) {
    console.warn("Failed to create invoice in Drizzle, attempting repair and raw SQL fallback...", error);
    await autoRepairInvoicesTable();
    try {
      await sql`
        INSERT INTO invoices (
          id, user_id, number, type, status, client_id, issue_date, due_date,
          payment_date, payment_method, items_json, subtotal_ht, discount_amount,
          tax_amount, total_ttc, deposit_amount, notes, payment_terms, converted_from_id
        ) VALUES (
          ${id}, ${uid || null}, ${payload.number}, ${payload.type}, ${payload.status},
          ${payload.clientId}, ${payload.issueDate}, ${payload.dueDate},
          ${payload.paymentDate}, ${payload.paymentMethod}, ${itemsJson},
          ${payload.subtotalHT}, ${payload.discountAmount}, ${payload.taxAmount},
          ${payload.totalTTC}, ${payload.depositAmount}, ${payload.notes},
          ${payload.paymentTerms}, ${payload.convertedFromId}
        ) ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          items_json = EXCLUDED.items_json,
          subtotal_ht = EXCLUDED.subtotal_ht,
          discount_amount = EXCLUDED.discount_amount,
          tax_amount = EXCLUDED.tax_amount,
          total_ttc = EXCLUDED.total_ttc,
          deposit_amount = EXCLUDED.deposit_amount,
          notes = EXCLUDED.notes,
          payment_terms = EXCLUDED.payment_terms,
          updated_at = NOW();
      `;
    } catch (rawErr) {
      console.error("createInvoice raw SQL error:", rawErr);
      throw new Error(rawErr?.message || "Erreur lors de la cr\xE9ation du document dans la base de donn\xE9es");
    }
  }
  const allInvoices = await getAllInvoices();
  return allInvoices.find((i) => i.id === id) || {};
}
async function updateInvoice(id, data) {
  try {
    const updatePayload = {
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (data.number) updatePayload.number = data.number;
    if (data.type) updatePayload.type = data.type;
    if (data.status) updatePayload.status = data.status;
    if (data.clientId) updatePayload.clientId = data.clientId;
    if (data.issueDate) updatePayload.issueDate = data.issueDate;
    if (data.dueDate) updatePayload.dueDate = data.dueDate;
    if (data.paymentDate !== void 0) updatePayload.paymentDate = data.paymentDate;
    if (data.paymentMethod !== void 0) updatePayload.paymentMethod = data.paymentMethod;
    if (data.items) updatePayload.itemsJson = JSON.stringify(data.items);
    if (data.subtotalHT !== void 0) updatePayload.subtotalHT = data.subtotalHT;
    if (data.discountAmount !== void 0) updatePayload.discountAmount = data.discountAmount;
    if (data.taxAmount !== void 0) updatePayload.taxAmount = data.taxAmount;
    if (data.totalTTC !== void 0) updatePayload.totalTTC = data.totalTTC;
    if (data.depositAmount !== void 0) updatePayload.depositAmount = data.depositAmount;
    if (data.notes !== void 0) updatePayload.notes = data.notes;
    if (data.paymentTerms !== void 0) updatePayload.paymentTerms = data.paymentTerms;
    await db.update(invoices).set(updatePayload).where(eq(invoices.id, id));
    const allInvoices = await getAllInvoices();
    return allInvoices.find((i) => i.id === id) || {};
  } catch (error) {
    console.error("Failed to update invoice in Cloud SQL:", error);
    throw new Error(error?.message || "Failed to update invoice");
  }
}
async function updateInvoiceStatus(id, status, paymentDate, paymentMethod) {
  try {
    const updatePayload = { status, updatedAt: /* @__PURE__ */ new Date() };
    if (paymentDate) updatePayload.paymentDate = paymentDate;
    if (paymentMethod) updatePayload.paymentMethod = paymentMethod;
    await db.update(invoices).set(updatePayload).where(eq(invoices.id, id));
    const allInvoices = await getAllInvoices();
    return allInvoices.find((i) => i.id === id) || {};
  } catch (error) {
    console.error("Failed to update invoice status in Cloud SQL:", error);
    throw new Error(error?.message || "Failed to update invoice status");
  }
}
async function convertQuoteToInvoice(id) {
  try {
    const allInvoices = await getAllInvoices();
    const quote = allInvoices.find((i) => i.id === id && i.type === "DEVIS");
    if (!quote) throw new Error("Devis introuvable ou d\xE9j\xE0 converti");
    let maxSeq = 0;
    const yearStr = String((/* @__PURE__ */ new Date()).getFullYear());
    const facPattern = new RegExp(`^FAC-${yearStr}-(\\d+)$`, "i");
    allInvoices.forEach((i) => {
      const match = i.number?.match(facPattern);
      if (match && match[1]) {
        const seq = parseInt(match[1], 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    });
    const nextNumber = `FAC-${yearStr}-${String(maxSeq + 1).padStart(3, "0")}`;
    const newInvoice = await createInvoice({
      ...quote,
      id: `inv-${Date.now().toString().substring(6)}`,
      number: nextNumber,
      type: "FACTURE",
      status: "ENVOYEE",
      issueDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
      convertedFromId: quote.id
    });
    const updatedNotes = (quote.notes || "") + ` [Converti en Facture ${nextNumber}]`;
    await updateInvoice(quote.id, { notes: updatedNotes });
    const freshQuote = (await getAllInvoices()).find((i) => i.id === id);
    return { quote: freshQuote, invoice: newInvoice };
  } catch (error) {
    console.error("Failed to convert quote in Cloud SQL:", error);
    throw new Error(error?.message || "Failed to convert quote");
  }
}
async function deleteInvoice(id) {
  try {
    await db.delete(invoices).where(eq(invoices.id, id));
  } catch (error) {
    console.error("Failed to delete invoice in Cloud SQL:", error);
    throw new Error(error?.message || "Failed to delete invoice");
  }
}
function safeIsoString(val) {
  if (!val) return (/* @__PURE__ */ new Date()).toISOString();
  if (typeof val === "string") return val;
  if (val instanceof Date) return val.toISOString();
  try {
    return new Date(val).toISOString();
  } catch {
    return (/* @__PURE__ */ new Date()).toISOString();
  }
}
function safeShortDate(val) {
  const str = safeIsoString(val);
  return str.split("T")[0] || str;
}
function mapCompanyRow(row) {
  if (!row) return initialCompanySettings;
  return {
    id: row.id,
    name: row.name,
    legalName: row.legalName || void 0,
    taxId: row.taxId || void 0,
    rc: row.rc || void 0,
    ai: row.ai || void 0,
    nis: row.nis || void 0,
    art: row.art || void 0,
    address: row.address || void 0,
    city: row.city || void 0,
    postalCode: row.postalCode || void 0,
    country: row.country || void 0,
    phone: row.phone || void 0,
    email: row.email || void 0,
    website: row.website || void 0,
    logoUrl: row.logoUrl || void 0,
    logoBase64: row.logoBase64 || void 0,
    footerText: row.footerText || void 0,
    legalTerms: row.legalTerms || void 0,
    bankName: row.bankName || void 0,
    bankAccount: row.bankAccount || void 0,
    bankRib: row.bankRib || void 0
  };
}
function mapClientRow(row) {
  if (!row) return {};
  return {
    id: row.id,
    nom: row.nom,
    name: row.nom,
    email: row.email || void 0,
    telephone: row.telephone || "",
    phone: row.telephone || "",
    adresse: row.adresse || void 0,
    address: row.adresse || void 0,
    ncBancaire: row.ncBancaire || void 0,
    nif: row.nif || void 0,
    rc: row.rc || void 0,
    ai: row.ai || void 0,
    nis: row.nis || void 0,
    creditMax: Number(row.creditMax) || 0,
    creditActuel: Number(row.creditActuel) || 0,
    createdAt: safeShortDate(row.createdAt),
    updatedAt: row.updatedAt ? safeShortDate(row.updatedAt) : void 0
  };
}

// src/db/users.ts
async function getOrCreateUser(uid, email) {
  try {
    const result = await db.insert(users).values({
      uid,
      email
    }).onConflictDoUpdate({
      target: users.uid,
      set: {
        email
      }
    }).returning();
    return result[0];
  } catch (error) {
    console.error("Failed to register/get user in Cloud SQL:", error);
    throw new Error("Database operation failed", { cause: error });
  }
}

// src/apiHandler.ts
dotenv2.config();
var initPromise = null;
function ensureDbInitialized() {
  if (!initPromise) {
    initPromise = seedCloudSQLIfEmpty().catch((err) => {
      console.error("Database lazy init warning (non-fatal):", err);
      initPromise = null;
    });
  }
  return initPromise;
}
function getBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  if (Buffer.isBuffer(req.body)) {
    try {
      return JSON.parse(req.body.toString("utf-8"));
    } catch {
      return {};
    }
  }
  return {};
}
function sendJson(res, status, data) {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  if (typeof res.status === "function" && typeof res.json === "function") {
    res.status(status).json(data);
  } else {
    res.end(JSON.stringify(data));
  }
}
function getPath(req) {
  let rawUrl = req.headers && req.headers["x-forwarded-uri"] || req.headers && req.headers["x-rewrite-url"] || req.headers && req.headers["x-matched-path"] || req.url || "";
  const qIndex = rawUrl.indexOf("?");
  if (qIndex !== -1) {
    rawUrl = rawUrl.substring(0, qIndex);
  }
  if (!rawUrl.startsWith("/")) {
    rawUrl = "/" + rawUrl;
  }
  if (!rawUrl.startsWith("/api")) {
    rawUrl = "/api" + (rawUrl === "/" ? "" : rawUrl);
  }
  if (rawUrl.length > 4 && rawUrl.endsWith("/")) {
    rawUrl = rawUrl.substring(0, rawUrl.length - 1);
  }
  return rawUrl;
}
async function handleApiRequest(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    return res.end();
  }
  try {
    await ensureDbInitialized();
  } catch (dbErr) {
    console.warn("DB initialization warning in handler:", dbErr);
  }
  const method = (req.method || "GET").toUpperCase();
  const path2 = getPath(req);
  const body = getBody(req);
  try {
    if (method === "GET" && path2 === "/api/health") {
      const rawUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || "";
      let dbHost = "ep-young-wildflower-agt8whdg-pooler.c-2.eu-central-1.aws.neon.tech";
      let dbName = "facturation_db";
      if (rawUrl) {
        try {
          const match = rawUrl.match(/@([^/:]+)(?::\d+)?\/([^?]+)/);
          if (match) {
            dbHost = match[1];
            dbName = match[2];
          }
        } catch (e) {
        }
      }
      let dbStatus = "unknown";
      let dbError = null;
      try {
        await getAllUsers();
        dbStatus = "connected";
      } catch (err) {
        dbStatus = "error";
        dbError = err.message || String(err);
      }
      return sendJson(res, 200, {
        status: "ok",
        provider: "Neon PostgreSQL (Cloud DB)",
        databaseUrlConfigured: true,
        dbHost,
        dbName,
        fullHost: `postgresql://${dbHost}/${dbName}`,
        dbStatus,
        dbError,
        time: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    if (method === "GET" && path2 === "/api/users") {
      const list = await getAllUsers();
      return sendJson(res, 200, list);
    }
    if (method === "POST" && path2 === "/api/auth/sync-user") {
      const { uid, email } = body;
      if (!uid || !email) {
        return sendJson(res, 400, { error: "uid and email required" });
      }
      const user = await getOrCreateUser(uid, email);
      return sendJson(res, 200, { success: true, user });
    }
    if (method === "GET" && path2 === "/api/company") {
      const company = await getCompanySettings();
      return sendJson(res, 200, company);
    }
    if (method === "POST" && path2 === "/api/company") {
      const updated = await saveCompanySettings(body);
      return sendJson(res, 200, updated);
    }
    if (method === "GET" && path2 === "/api/clients") {
      const clientsList = await getAllClients();
      return sendJson(res, 200, clientsList);
    }
    if (method === "POST" && path2 === "/api/clients") {
      const newClient = await createClient(body);
      return sendJson(res, 201, newClient);
    }
    const clientPutMatch = path2.match(/^\/api\/clients\/([^/]+)$/);
    if (method === "PUT" && clientPutMatch) {
      const updated = await updateClient(clientPutMatch[1], body);
      return sendJson(res, 200, updated);
    }
    const clientDeleteMatch = path2.match(/^\/api\/clients\/([^/]+)$/);
    if (method === "DELETE" && clientDeleteMatch) {
      await deleteClient(clientDeleteMatch[1]);
      return sendJson(res, 200, { success: true, id: clientDeleteMatch[1] });
    }
    if (method === "GET" && path2 === "/api/invoices") {
      const invoicesList = await getAllInvoices();
      return sendJson(res, 200, invoicesList);
    }
    if (method === "POST" && path2 === "/api/invoices") {
      const newInvoice = await createInvoice(body);
      return sendJson(res, 201, newInvoice);
    }
    const statusMatch = path2.match(/^\/api\/invoices\/([^/]+)\/status$/);
    if (method === "PATCH" && statusMatch) {
      const { status, paymentDate, paymentMethod } = body;
      const updated = await updateInvoiceStatus(statusMatch[1], status, paymentDate, paymentMethod);
      return sendJson(res, 200, updated);
    }
    const convertMatch = path2.match(/^\/api\/invoices\/([^/]+)\/convert-quote$/);
    if (method === "POST" && convertMatch) {
      const result = await convertQuoteToInvoice(convertMatch[1]);
      return sendJson(res, 201, result);
    }
    const invoicePutMatch = path2.match(/^\/api\/invoices\/([^/]+)$/);
    if (method === "PUT" && invoicePutMatch) {
      const updated = await updateInvoice(invoicePutMatch[1], body);
      return sendJson(res, 200, updated);
    }
    const invoiceDeleteMatch = path2.match(/^\/api\/invoices\/([^/]+)$/);
    if (method === "DELETE" && invoiceDeleteMatch) {
      await deleteInvoice(invoiceDeleteMatch[1]);
      return sendJson(res, 200, { success: true, id: invoiceDeleteMatch[1] });
    }
    if (method === "POST" && path2 === "/api/demo/clear") {
      await clearAllData();
      return sendJson(res, 200, { success: true, message: "Toutes les donn\xE9es ont \xE9t\xE9 effac\xE9es de la base." });
    }
    if (method === "POST" && path2 === "/api/demo/reset") {
      await resetDemoData();
      return sendJson(res, 200, { success: true, message: "Les donn\xE9es de test ont \xE9t\xE9 r\xE9inject\xE9es dans la base Neon." });
    }
    if (method === "GET" && path2 === "/api/stats") {
      const [invList, cliList] = await Promise.all([getAllInvoices(), getAllClients()]);
      const stats = calculateDashboardStats(invList, cliList);
      return sendJson(res, 200, stats);
    }
    if (method === "GET" && (path2 === "/api" || path2 === "/api/")) {
      return sendJson(res, 200, { status: "ok", message: "API Facturation PostgreSQL Active" });
    }
    return sendJson(res, 404, { error: `Route non trouv\xE9e: ${method} ${path2}` });
  } catch (err) {
    console.error(`Error processing ${method} ${path2}:`, err);
    return sendJson(res, 500, {
      error: err?.message || "Erreur interne du serveur",
      details: String(err)
    });
  }
}

// api/index.ts
async function handler(req, res) {
  try {
    await handleApiRequest(req, res);
  } catch (err) {
    console.error("Fatal Serverless Error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        error: err?.message || "Serverless Exception",
        details: String(err)
      }));
    }
  }
}
export {
  handler as default
};
