import {
  ArrowLeft,
  Eye,
  FileDown,
  Plus,
  Save,
  Sparkles,
  Trash2
} from 'lucide-react';
import React, { useState } from 'react';
import { Client, CompanySettings, DocumentType, Invoice, InvoiceItem, ServiceUnit } from '../types';
import { calculateInvoiceTotals, formatCurrency, generateNextDocumentNumber } from '../utils/calculations';
import { downloadInvoicePDF } from '../utils/pdfGenerator';

interface InvoiceEditorProps {
  initialInvoice?: Partial<Invoice> | null;
  invoices?: Invoice[];
  clients: Client[];
  company: CompanySettings;
  onSave: (invoiceData: Partial<Invoice>) => void;
  onCancel: () => void;
  onAddClientInline: () => void;
}

const SERVICE_PRESETS = [
  {
    description: 'Fourniture et pose de fenêtres Aluminium double vitrage profilé thermique',
    category: 'Fourniture & Pose' as const,
    unit: 'U' as ServiceUnit,
    quantity: 4,
    unitPriceHT: 45000,
    vatRate: 9
  },
  {
    description: 'Fourniture et pose de dalle de sol Grès Cérame 60x60cm Mât avec mortier colle spécial',
    category: 'Fourniture & Pose' as const,
    unit: 'm²' as ServiceUnit,
    quantity: 50,
    unitPriceHT: 3500,
    vatRate: 9
  },
  {
    description: 'Fourniture et pose de garde-corps vitré inox pour balcons et terrasses',
    category: 'Fourniture & Pose' as const,
    unit: 'ml' as ServiceUnit,
    quantity: 15,
    unitPriceHT: 18500,
    vatRate: 9
  },
  {
    description: 'Fourniture et pose de faux plafond en plaques de plâtre BA13 avec ossature métallique',
    category: 'Fourniture & Pose' as const,
    unit: 'm²' as ServiceUnit,
    quantity: 80,
    unitPriceHT: 2400,
    vatRate: 9
  },
  {
    description: 'Main d\'œuvre de pose et mise en œuvre chantier par équipe spécialisée',
    category: 'Pose seule' as const,
    unit: 'Jour' as ServiceUnit,
    quantity: 3,
    unitPriceHT: 15000,
    vatRate: 9
  },
  {
    description: 'Forfait dépose ancienne installation, préparation du support et nettoyage chantier',
    category: 'Pose seule' as const,
    unit: 'Forfait' as ServiceUnit,
    quantity: 1,
    unitPriceHT: 25000,
    vatRate: 9
  }
];

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  initialInvoice,
  invoices = [],
  clients,
  company,
  onSave,
  onCancel,
  onAddClientInline
}) => {
  const isEditing = Boolean(initialInvoice?.id);

  const [type, setType] = useState<DocumentType>(initialInvoice?.type || 'FACTURE');
  const [number, setNumber] = useState(() => {
    if (initialInvoice?.number) return initialInvoice.number;
    const initialType = initialInvoice?.type || 'FACTURE';
    return generateNextDocumentNumber(initialType, invoices);
  });
  const [clientId, setClientId] = useState<string>(initialInvoice?.clientId || (clients[0]?.id || ''));
  const [issueDate, setIssueDate] = useState(
    initialInvoice?.issueDate || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(
    initialInvoice?.dueDate ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState(initialInvoice?.status || 'BROUILLON');
  const [notes, setNotes] = useState(initialInvoice?.notes || '');
  const [paymentTerms, setPaymentTerms] = useState(
    initialInvoice?.paymentTerms || company.paymentTerms || company.legalTerms || 'Paiement à 30 jours par virement ou chèque bancaire.'
  );
  const [depositAmount, setDepositAmount] = useState<number>(initialInvoice?.depositAmount || 0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Line items state
  const [items, setItems] = useState<InvoiceItem[]>(
    initialInvoice?.items && initialInvoice.items.length > 0
      ? initialInvoice.items
      : [
          {
            id: `item-${Date.now()}-1`,
            description: 'Fourniture et pose de fenêtres Aluminium double vitrage profilé thermique',
            category: 'Fourniture & Pose',
            unit: 'U',
            quantity: 2,
            unitPriceHT: 45000,
            vatRate: company.defaultVatRate || 9,
            discountPercent: 0,
            totalHT: 90000
          }
        ]
  );

  const selectedClient = clients.find(c => c.id === clientId);

  // Toggle PDF preview mode
  const [showPreview, setShowPreview] = useState(false);

  const totals = calculateInvoiceTotals(items, 0, depositAmount);

  const handleAddItem = (preset?: typeof SERVICE_PRESETS[0]) => {
    const newItem: InvoiceItem = preset
      ? {
          id: `item-${Date.now()}-${Math.random()}`,
          description: preset.description,
          category: preset.category,
          unit: preset.unit,
          quantity: preset.quantity,
          unitPriceHT: preset.unitPriceHT,
          vatRate: preset.vatRate,
          discountPercent: 0,
          totalHT: preset.quantity * preset.unitPriceHT
        }
      : {
          id: `item-${Date.now()}-${Math.random()}`,
          description: '',
          category: 'Fourniture & Pose',
          unit: 'm²',
          quantity: 1,
          unitPriceHT: 0,
          vatRate: company.defaultVatRate || 9,
          discountPercent: 0,
          totalHT: 0
        };

    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };
        const qty = Number(updated.quantity) || 0;
        const price = Number(updated.unitPriceHT) || 0;
        const discount = Number(updated.discountPercent) || 0;

        const rawHT = qty * price;
        updated.totalHT = discount > 0 ? rawHT * (1 - discount / 100) : rawHT;

        return updated;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      setValidationError('Une facture doit contenir au moins une prestation.');
      return;
    }
    setValidationError(null);
    setItems(items.filter((item) => item.id !== id));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      setValidationError('Veuillez sélectionner un client.');
      return;
    }

    if (items.some((i) => !i.description.trim())) {
      setValidationError('Veuillez remplir la désignation de chaque prestation.');
      return;
    }

    setValidationError(null);

    const invoiceData: Partial<Invoice> = {
      ...(initialInvoice || {}),
      number,
      type,
      status,
      clientId,
      issueDate,
      dueDate,
      items,
      subtotalHT: totals.subtotalHT,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      totalTTC: totals.totalTTC,
      depositAmount,
      notes,
      paymentTerms
    };

    onSave(invoiceData);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {isEditing ? `Édition Document N° ${number}` : 'Nouveau Document de Facturation'}
            </h1>
            <p className="text-xs text-slate-500">
              Saisie des prestations de fourniture et pose avec calcul automatique des taxes (TVA 9%)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const clientObj = selectedClient || clients.find(c => c.id === clientId) || {
                id: clientId || 'temp',
                name: 'Client',
                type: 'PARTICULIER'
              } as Client;

              const tempInvoice: Invoice = {
                id: 'temp',
                number: number || 'N/A',
                type,
                status,
                clientId,
                issueDate,
                dueDate,
                items,
                subtotalHT: totals.subtotalHT,
                discountAmount: totals.discountAmount,
                taxAmount: totals.taxAmount,
                totalTTC: totals.totalTTC,
                depositAmount,
                notes,
                paymentTerms,
                createdAt: new Date().toISOString()
              };
              downloadInvoicePDF(tempInvoice, clientObj, company);
            }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-200"
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Télécharger PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl hover:bg-slate-700"
          >
            <Eye className="h-4 w-4" />
            <span>{showPreview ? 'Masquer aperçu' : 'Aperçu Direct'}</span>
          </button>

          <button
            onClick={handleFormSubmit}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            <Save className="h-4 w-4" />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>

      {/* Editor Main Form */}
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {validationError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-500 font-bold text-xs flex items-center justify-between">
            <span>{validationError}</span>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="text-rose-400 hover:text-rose-300 ml-2"
            >
              ✕
            </button>
          </div>
        )}
        {/* Document Meta Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            1. Informations Générales du Document
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Document Type */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Type de Document *
              </label>
              <select
                disabled={isEditing}
                value={type}
                onChange={(e) => {
                  if (isEditing) return;
                  const newType = e.target.value as DocumentType;
                  setType(newType);
                  setNumber(generateNextDocumentNumber(newType, invoices));
                }}
                className={`w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold outline-none ${
                  isEditing
                    ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500'
                }`}
              >
                <option value="FACTURE">Facture de Vente</option>
                <option value="DEVIS">Devis Commercial</option>
                <option value="ACOMPTE">Facture d'Acompte</option>
                <option value="AVOIR">Facture d'Avoir</option>
              </select>
              {isEditing && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium leading-tight">
                  🔒 Le type ne peut pas être modifié sur un document existant pour préserver l'original.
                </p>
              )}
            </div>

            {/* Document Number */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Numéro du Document *
              </label>
              <input
                type="text"
                required
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Client Selector */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Client Destinataire *
                </label>
                <button
                  type="button"
                  onClick={onAddClientInline}
                  className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-0.5"
                >
                  <Plus className="h-3 w-3" /> Nouveau
                </button>
              </div>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Sélectionner un client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom || c.name} {c.adresse ? `(${c.adresse})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Statut Initial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="BROUILLON">Brouillon</option>
                <option value="ENVOYEE">Envoyée au client</option>
                <option value="PAYEE">Payée (Encaissée)</option>
                <option value="EN_RETARD">En retard</option>
                <option value="ANNULEE">Annulée</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs pt-2">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date d'émission
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date d'échéance de paiement
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Acompte perçu (DA)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                placeholder="ex: 50000 DA"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none"
              />
            </div>
          </div>
        </div>

        {/* Prestations Table Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                2. Prestations de Fourniture & Pose
              </h2>
              <p className="text-xs text-slate-500">
                Détail des éléments facturés : désignation, unité de mesure, quantité, prix unitaire HT et taux de TVA (9%).
              </p>
            </div>

            {/* Quick Presets Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium hidden md:inline">
                Saisie rapide :
              </span>
              <select
                onChange={(e) => {
                  const presetIdx = parseInt(e.target.value, 10);
                  if (!isNaN(presetIdx) && SERVICE_PRESETS[presetIdx]) {
                    handleAddItem(SERVICE_PRESETS[presetIdx]);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="px-3 py-1.5 text-xs rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 font-medium outline-none cursor-pointer"
              >
                <option value="" disabled>
                  + Ajouter un modèle de prestation...
                </option>
                {SERVICE_PRESETS.map((p, idx) => (
                  <option key={idx} value={idx}>
                    {p.description.substring(0, 45)}... ({p.unit})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleAddItem()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ligne vierge</span>
              </button>
            </div>
          </div>

          {/* Line Items Cards (Mobile) & Table (Desktop) */}
          {/* Mobile Card Stack */}
          <div className="block md:hidden space-y-4">
            {items.map((item, idx) => (
              <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                    Prestation #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1 text-rose-500 hover:text-rose-700 text-xs font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Supprimer</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Désignation
                  </label>
                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                    placeholder="Désignation détaillée (ex: Fourniture et pose fenêtres alu...)"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Catégorie</label>
                    <select
                      value={item.category || 'Fourniture & Pose'}
                      onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                    >
                      <option value="Fourniture & Pose">Fourniture & Pose</option>
                      <option value="Pose seule">Pose seule</option>
                      <option value="Fourniture seule">Fourniture seule</option>
                      <option value="Main d'œuvre">Main d'œuvre</option>
                      <option value="Étude & Conseil">Étude & Conseil</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Unité</label>
                    <select
                      value={item.unit}
                      onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value as ServiceUnit)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none"
                    >
                      <option value="m²">m²</option>
                      <option value="ml">ml</option>
                      <option value="m³">m³</option>
                      <option value="U">U</option>
                      <option value="Forfait">Forfait</option>
                      <option value="Heure">Heure</option>
                      <option value="Jour">Jour</option>
                      <option value="Ensemble">Ensemble</option>
                      <option value="Kg">Kg</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Qté</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">P.U. HT</label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={item.unitPriceHT}
                      onChange={(e) => handleUpdateItem(item.id, 'unitPriceHT', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold outline-none text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">TVA</label>
                    <select
                      value={item.vatRate}
                      onChange={(e) => handleUpdateItem(item.id, 'vatRate', parseFloat(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                    >
                      <option value={9}>9%</option>
                      <option value={19}>19%</option>
                      <option value={0}>0%</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Total HT :</span>
                  <span className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                    {formatCurrency(item.totalHT)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-2 px-2 w-[35%]">Désignation de la prestation</th>
                  <th className="py-2 px-2 w-[15%]">Catégorie</th>
                  <th className="py-2 px-2 w-[10%]">Unité</th>
                  <th className="py-2 px-2 w-[10%]">Quantité</th>
                  <th className="py-2 px-2 w-[12%]">P.U. HT (DA)</th>
                  <th className="py-2 px-2 w-[8%]">TVA %</th>
                  <th className="py-2 px-2 w-[10%] text-right">Total HT</th>
                  <th className="py-2 px-2 w-[4%] text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-2">
                      <textarea
                        rows={2}
                        value={item.description}
                        onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                        placeholder="Désignation détaillée (ex: Fourniture et pose fenêtres alu...)"
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <select
                        value={item.category || 'Fourniture & Pose'}
                        onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                      >
                        <option value="Fourniture & Pose">Fourniture & Pose</option>
                        <option value="Pose seule">Pose seule</option>
                        <option value="Fourniture seule">Fourniture seule</option>
                        <option value="Main d'œuvre">Main d'œuvre</option>
                        <option value="Étude & Conseil">Étude & Conseil</option>
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <select
                        value={item.unit}
                        onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value as ServiceUnit)}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none"
                      >
                        <option value="m²">m² (mètre carré)</option>
                        <option value="ml">ml (mètre linéaire)</option>
                        <option value="m³">m³ (mètre cube)</option>
                        <option value="U">U (Unité)</option>
                        <option value="Forfait">Forfait</option>
                        <option value="Heure">Heure</option>
                        <option value="Jour">Jour</option>
                        <option value="Ensemble">Ensemble</option>
                        <option value="Kg">Kg</option>
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none text-center"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={item.unitPriceHT}
                        onChange={(e) => handleUpdateItem(item.id, 'unitPriceHT', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold outline-none text-right"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <select
                        value={item.vatRate}
                        onChange={(e) => handleUpdateItem(item.id, 'vatRate', parseFloat(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                      >
                        <option value={9}>9% (Réduit)</option>
                        <option value={19}>19% (Normal)</option>
                        <option value={0}>0% (Exonéré)</option>
                      </select>
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.totalHT)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => handleAddItem()}
            className="w-full py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-1"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter une prestation supplémentaire</span>
          </button>
        </div>

        {/* Bottom Totals & Notes Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notes & Terms */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs">
            <h2 className="font-bold uppercase tracking-wider text-slate-400">
              3. Notes & Conditions Particulières
            </h2>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Objet / Notes figurant sur la facture
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Travaux de fourniture et pose fenêtres - Réception du PV de chantier."
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mentions de Règlement & Pénalités légales
              </label>
              <textarea
                rows={3}
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          {/* Totals Summary Box */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg space-y-4 flex flex-col justify-between">
            <h2 className="font-bold text-sm uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span>Calcul Financier Final (DA)</span>
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Sous-total HT Prestations :</span>
                <span className="font-mono font-semibold">{formatCurrency(totals.subtotalHT)}</span>
              </div>

              {totals.vatBreakdowns.map((vat) => (
                <div key={vat.rate} className="flex justify-between text-slate-400 text-[11px]">
                  <span>Montant TVA ({vat.rate}%) :</span>
                  <span className="font-mono">{formatCurrency(vat.vatAmount)}</span>
                </div>
              ))}

              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
                <span>TOTAL TTC :</span>
                <span className="font-mono text-base text-blue-400">{formatCurrency(totals.totalTTC)}</span>
              </div>

              {depositAmount > 0 && (
                <>
                  <div className="flex justify-between text-emerald-400 text-xs">
                    <span>Acompte déduit :</span>
                    <span className="font-mono">-{formatCurrency(depositAmount)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between text-base font-extrabold text-emerald-400">
                    <span>NET À PAYER :</span>
                    <span className="font-mono">{formatCurrency(totals.remainingDue)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-medium text-xs"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Enregistrer le Document
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
