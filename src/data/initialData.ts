import { Client, CompanySettings, Invoice } from '../types';

export const initialCompanySettings: CompanySettings = {
  id: 'main',
  name: 'ALGERIE BATI PRO',
  legalName: 'SARL ALGERIE BATI PRO & POSE',
  taxId: '001916012345678', // NIF
  rc: '16/00-0123456B19',   // Registre du Commerce
  ai: '16012345678',       // Article d'Imposition
  nis: '199516010012345',  // NIS
  art: '16012345678',
  address: 'Zone Industrielle Oued Smar, Lot 14',
  city: 'Alger',
  postalCode: '16000',
  country: 'Algérie',
  email: 'contact@batipro-dz.com',
  phone: '023 92 10 50 / 0550 12 34 56',
  website: 'www.batipro-dz.com',
  bankName: 'BNA - Banque Nationale d\'Algérie',
  bankAccount: '001 00810 0300 000123 45',
  bankRib: '00100810030000012345 88',
  logoUrl: '',
  logoBase64: '', // Users can upload a logo image
  defaultVatRate: 9, // 9% TVA Algérie
  footerText: 'Merci pour votre confiance. Société au capital de 10 000 000 DA.',
  legalTerms: 'Paiement à 30 jours par virement ou chèque bancaire. Pénalités de retard au taux légal.',
  isActive: true,
  
  // Legacy aliases
  siret: '001916012345678',
  vatNumber: 'NIF: 001916012345678',
  iban: '00100810030000012345 88',
  bic: 'BNAEDZALXXX',
  paymentTerms: 'Paiement à 30 jours par virement ou chèque bancaire.'
};

export const initialClients: Client[] = [];

export const initialInvoices: Invoice[] = [];

