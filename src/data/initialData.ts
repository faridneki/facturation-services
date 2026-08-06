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

export const initialClients: Client[] = [
  {
    id: 'cli-001',
    nom: 'SARL PROMO IMMO ALGER',
    email: 'contact@promoimmo-alger.dz',
    telephone: '0550 11 22 33',
    adresse: '12 Boulevard Mohamed V, Alger Centre',
    ncBancaire: '002 00120 0200 987654 12',
    nif: '002016098765432',
    rc: '16/00-9876543B20',
    ai: '16098765432',
    nis: '199816010098765',
    creditMax: 5000000,
    creditActuel: 1250000,
    createdAt: '2026-01-10',
    // Virtual fields
    name: 'SARL PROMO IMMO ALGER',
    phone: '0550 11 22 33',
    address: '12 Boulevard Mohamed V, Alger Centre',
    city: 'Alger',
    type: 'PROFESSIONNEL'
  },
  {
    id: 'cli-002',
    nom: 'EURL BATIMENT MODERN ORAN',
    email: 'direction@batiment-oran.dz',
    telephone: '041 33 44 55',
    adresse: 'Avenue Larbi Ben M\'hidi, Oran',
    ncBancaire: '003 00450 0100 112233 44',
    nif: '003031011223344',
    rc: '31/00-1122334B18',
    ai: '31011223344',
    nis: '200131010011223',
    creditMax: 3000000,
    creditActuel: 0,
    createdAt: '2026-02-01',
    name: 'EURL BATIMENT MODERN ORAN',
    phone: '041 33 44 55',
    address: 'Avenue Larbi Ben M\'hidi, Oran',
    city: 'Oran',
    type: 'PROFESSIONNEL'
  },
  {
    id: 'cli-003',
    nom: 'M. Karim BENALI',
    email: 'k.benali@gmail.com',
    telephone: '0661 88 99 00',
    adresse: 'Cité 1000 Logements, Bab Ezzouar',
    ncBancaire: '005 00990 0011 556677 88',
    nif: '198516010055667',
    rc: '',
    ai: '16055667788',
    nis: '',
    creditMax: 1000000,
    creditActuel: 350000,
    createdAt: '2026-03-15',
    name: 'M. Karim BENALI',
    phone: '0661 88 99 00',
    address: 'Cité 1000 Logements, Bab Ezzouar',
    city: 'Alger',
    type: 'PARTICULIER'
  },
  {
    id: 'cli-004',
    nom: 'SNC PHARMA PLUS BLIDA',
    email: 'pharmaplus.blida@gmail.com',
    telephone: '025 40 12 34',
    adresse: 'Boulevard 20 Novembre, Blida',
    ncBancaire: '001 00210 0300 445566 77',
    nif: '001009044556677',
    rc: '09/00-4455667B21',
    ai: '09044556677',
    nis: '201009010044556',
    creditMax: 2000000,
    creditActuel: 0,
    createdAt: '2026-04-20',
    name: 'SNC PHARMA PLUS BLIDA',
    phone: '025 40 12 34',
    address: 'Boulevard 20 Novembre, Blida',
    city: 'Blida',
    type: 'PROFESSIONNEL'
  }
];

export const initialInvoices: Invoice[] = [
  {
    id: 'inv-101',
    number: 'FAC-2026-001',
    type: 'FACTURE',
    status: 'PAYEE',
    clientId: 'cli-001',
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
        unitPriceHT: 45000.00,
        vatRate: 9, // 9% TVA
        discountPercent: 5,
        totalHT: 513000.00
      },
      {
        id: 'item-101-2',
        description: 'Fourniture et pose de volets roulants alu extrudé motorisés',
        category: 'Fourniture & Pose',
        unit: 'U',
        quantity: 12,
        unitPriceHT: 28000.00,
        vatRate: 9,
        discountPercent: 0,
        totalHT: 336000.00
      },
      {
        id: 'item-101-3',
        description: 'Main d\'œuvre de dépose ancienne menuiserie et pose étanche',
        category: 'Pose seule',
        unit: 'Forfait',
        quantity: 1,
        unitPriceHT: 85000.00,
        vatRate: 9,
        discountPercent: 0,
        totalHT: 85000.00
      }
    ],
    subtotalHT: 934000.00,
    discountAmount: 27000.00,
    taxAmount: 81630.00,
    totalTTC: 988630.00,
    depositAmount: 300000.00,
    paymentTerms: 'Règlement sous 30 jours par virement bancaire BNA.',
    notes: 'Chantiers de rénovation achevés avec succès.',
    createdAt: '2026-05-15'
  },
  {
    id: 'inv-102',
    number: 'FAC-2026-002',
    type: 'FACTURE',
    status: 'ENVOYEE',
    clientId: 'cli-002',
    issueDate: '2026-06-01',
    dueDate: '2026-07-01',
    items: [
      {
        id: 'item-102-1',
        description: 'Fourniture et pose de dalle de sol Grès Cérame 60x60 Mât',
        category: 'Fourniture & Pose',
        unit: 'm²',
        quantity: 250,
        unitPriceHT: 3200.00,
        vatRate: 9,
        discountPercent: 0,
        totalHT: 800000.00
      },
      {
        id: 'item-102-2',
        description: 'Fourniture et pose de plinthes assorties en céramique',
        category: 'Fourniture & Pose',
        unit: 'ml',
        quantity: 120,
        unitPriceHT: 650.00,
        vatRate: 9,
        discountPercent: 0,
        totalHT: 78000.00
      }
    ],
    subtotalHT: 878000.00,
    discountAmount: 0,
    taxAmount: 79020.00,
    totalTTC: 957020.00,
    depositAmount: 250000.00,
    paymentTerms: 'Solde à la réception du procès-verbal.',
    notes: 'Projet Bureaux Oran.',
    createdAt: '2026-06-01'
  },
  {
    id: 'inv-103',
    number: 'DEV-2026-001',
    type: 'DEVIS',
    status: 'ENVOYEE',
    clientId: 'cli-003',
    issueDate: '2026-07-05',
    dueDate: '2026-08-05',
    items: [
      {
        id: 'item-103-1',
        description: 'Fourniture et pose de garde-corps vitré inox pour balcon',
        category: 'Fourniture & Pose',
        unit: 'ml',
        quantity: 18,
        unitPriceHT: 18500.00,
        vatRate: 9,
        discountPercent: 0,
        totalHT: 333000.00
      }
    ],
    subtotalHT: 333000.00,
    discountAmount: 0,
    taxAmount: 29970.00,
    totalTTC: 362970.00,
    depositAmount: 100000.00,
    paymentTerms: 'Devis valable 30 jours. Acompte de 30% requis à la validation.',
    notes: 'Travaux villa Bab Ezzouar.',
    createdAt: '2026-07-05'
  }
];
