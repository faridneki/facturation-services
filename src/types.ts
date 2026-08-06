export type DocumentType = 'FACTURE' | 'DEVIS' | 'ACOMPTE' | 'AVOIR';

export type InvoiceStatus = 'BROUILLON' | 'ENVOYEE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE';

export type ServiceUnit = 'm²' | 'ml' | 'm³' | 'U' | 'Forfait' | 'Heure' | 'Jour' | 'Ensemble' | 'Kg';

export type ClientType = 'PARTICULIER' | 'PROFESSIONNEL';

export interface CompanyInfo {
  id: string;
  name: string;          // Nom de l'entreprise
  legalName?: string;     // Raison sociale
  taxId?: string;         // NIF
  rc?: string;            // RC
  ai?: string;            // Article d'imposition
  nis?: string;           // NIS
  art?: string;           // Article d'imposition alternatif
  
  address?: string;       // Adresse
  city?: string;          // Ville
  postalCode?: string;    // Code postal
  country?: string;       // Pays (défaut "Algérie")
  
  phone?: string;         // Téléphone
  email?: string;         // Email
  website?: string;       // Site web
  
  logoUrl?: string;       // Chemin du logo
  logoBase64?: string;    // Logo encodé en Base64
  
  footerText?: string;    // Pied de page
  legalTerms?: string;    // Mentions légales / conditions
  
  bankName?: string;      // Banque
  bankAccount?: string;   // Compte bancaire
  bankRib?: string;       // RIB
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;

  // Legacy compatibility fields
  siret?: string;
  vatNumber?: string;
  zipCode?: string;
  iban?: string;
  bic?: string;
  defaultVatRate?: number;
  paymentTerms?: string;
  legalNotice?: string;
}

export type CompanySettings = CompanyInfo;

export interface Client {
  id: string;
  nom: string;
  email?: string;
  telephone: string;
  adresse?: string;
  ncBancaire?: string;
  nif?: string;
  rc?: string;
  ai?: string;
  nis?: string;
  creditMax?: number;
  creditActuel?: number;
  createdAt: string;
  updatedAt?: string;

  // Virtual alias fields for backwards compatibility
  name?: string;
  phone?: string;
  address?: string;
  contactName?: string;
  type?: ClientType;
  siret?: string;
  vatNumber?: string;
  notes?: string;
  zipCode?: string;
  city?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  category?: 'Fourniture & Pose' | 'Pose seule' | 'Fourniture seule' | 'Main d\'œuvre' | 'Étude & Conseil';
  unit: ServiceUnit;
  quantity: number;
  unitPriceHT: number;
  vatRate: number; // e.g. 9, 19, 0
  discountPercent?: number;
  totalHT: number;
}

export interface Invoice {
  id: string;
  number: string; // e.g., FAC-2026-001, DEV-2026-012
  type: DocumentType;
  status: InvoiceStatus;
  clientId: string;
  client?: Client;
  issueDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  paymentDate?: string;
  paymentMethod?: 'Virement' | 'Carte' | 'Chèque' | 'Espèces';
  
  items: InvoiceItem[];
  
  subtotalHT: number;
  discountAmount: number;
  taxAmount: number;
  totalTTC: number;
  depositAmount: number; // Acompte
  
  notes?: string;
  paymentTerms?: string;
  convertedFromId?: string; // If converted from quote
  createdAt: string;
  updatedAt?: string;
}

export interface DashboardStats {
  monthlyRevenue: number;
  annualRevenue: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  draftCount: number;
  sentCount: number;
  paidCount: number;
  overdueCount: number;
  totalClients: number;
  quotesCount: number;
  quotesConversionRate: number;
  revenueByMonth: {
    month: string;
    ca: number;
    encaisse: number;
    devis: number;
  }[];
  statusBreakdown: {
    name: string;
    value: number;
    color: string;
  }[];
  topServices: {
    name: string;
    revenue: number;
  }[];
}

export interface InvoiceFilter {
  search: string;
  type: DocumentType | 'ALL';
  status: InvoiceStatus | 'ALL';
  clientId: string | 'ALL';
  dateFrom?: string;
  dateTo?: string;
}
