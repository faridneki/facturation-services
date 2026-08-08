import { Check, Copy, Database, Terminal, X } from 'lucide-react';
import React, { useState } from 'react';

interface PrismaCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrismaCodeModal: React.FC<PrismaCodeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);

  const prismaSchemaCode = `// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Client {
  id           String   @id @default(cuid())
  nom          String
  email        String?
  telephone    String
  adresse      String?
  ncBancaire   String?
  nif          String?
  rc           String?
  ai           String?
  nis          String?
  creditMax    Float    @default(0)
  creditActuel Float    @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  factures     Facture[]
}

model CompanyInfo {
  id          String   @id @default(cuid())
  name        String
  legalName   String?
  taxId       String?  // NIF
  rc          String?  // Registre de Commerce
  ai          String?  // Article d'Imposition
  nis         String?  // NIS
  art         String?  // Article d'Imposition (si différent)
  address     String?
  city        String?
  postalCode  String?
  country     String?  @default("Algérie")
  email       String?
  phone       String?
  website     String?
  bankName    String?
  bankAccount String?
  bankRib     String?
  logoUrl     String?
  logoBase64  String?
  footerText  String?
  legalTerms  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum DocumentType {
  FACTURE
  DEVIS
  ACOMPTE
  AVOIR
}

enum InvoiceStatus {
  BROUILLON
  ENVOYEE
  PAYEE
  EN_RETARD
  ANNULEE
}

model Facture {
  id              String        @id @default(cuid())
  number          String        @unique
  type            DocumentType  @default(FACTURE)
  status          InvoiceStatus @default(BROUILLON)
  clientId        String
  client          Client        @relation(fields: [clientId], references: [id], onDelete: Cascade)
  issueDate       DateTime      @default(now())
  dueDate         DateTime
  paymentDate     DateTime?
  paymentMethod   String?
  subtotalHT      Float
  discountAmount  Float         @default(0)
  taxAmount       Float
  totalTTC        Float
  depositAmount   Float         @default(0)
  notes           String?
  paymentTerms    String?
  convertedFromId String?
  items           FactureItem[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

model FactureItem {
  id              String   @id @default(cuid())
  factureId       String
  facture         Facture  @relation(fields: [factureId], references: [id], onDelete: Cascade)
  description     String
  category        String?
  unit            String   @default("m²")
  quantity        Float    @default(1.0)
  unitPriceHT     Float
  vatRate         Float    @default(9.0)
  discountPercent Float    @default(0.0)
  totalHT         Float
}
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(prismaSchemaCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Schéma Prisma DB (Algérie - Factures & Services)
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <p className="text-slate-300">
            Ce projet contient le schéma Prisma complet situé dans <code className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono">prisma/schema.prisma</code>. Il inclut les modèles <code className="text-emerald-400 font-bold">Client</code> et <code className="text-emerald-400 font-bold">CompanyInfo</code> avec tous les identifiants fiscaux (NIF, RC, AI, NIS).
          </p>

          {/* CLI Instructions */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
              <Terminal className="h-4 w-4" />
              Commandes d'initialisation dans votre terminal VS Code :
            </span>
            <pre className="font-mono text-[11px] text-slate-300 space-y-1">
              <div><span className="text-slate-500"># 1. Configurer l'URL de votre base Neon dans votre fichier .env</span></div>
              <div className="text-emerald-300">DATABASE_URL="postgresql://neondb_owner:...@ep-young-wildflower-agt8whdg-pooler.c-2.eu-central-1.aws.neon.tech/facturation_db?sslmode=require"</div>
              <div className="pt-1"><span className="text-slate-500"># 2. Synchroniser le schéma Prisma avec Neon (notez l'accès à facturation_db)</span></div>
              <div>npx prisma db push</div>
              <div className="pt-1"><span className="text-slate-500"># 3. Ouvrir Prisma Studio sur la base Neon</span></div>
              <div>npx prisma studio</div>
            </pre>
          </div>

          {/* Code Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-400 text-xs">Contenu de <code className="text-white">prisma/schema.prisma</code></span>
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copié !' : 'Copier le Schéma'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-72">
              {prismaSchemaCode}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
