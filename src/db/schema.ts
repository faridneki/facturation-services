import { pgTable, text, timestamp, doublePrecision, serial } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const companyInfo = pgTable('company_info', {
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

export const clients = pgTable('clients', {
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

export const invoices = pgTable('invoices', {
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

export const systemFlags = pgTable('system_flags', {
  key: text('key').primaryKey(),
  value: text('value'),
});
