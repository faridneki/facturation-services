import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  Clock,
  Copy,
  Download,
  Edit,
  Eye,
  FileCheck2,
  FileText,
  FileX2,
  Filter,
  Plus,
  RotateCcw,
  Search,
  Trash2
} from 'lucide-react';
import React, { useState } from 'react';
import { Client, CompanySettings, DocumentType, Invoice, InvoiceStatus } from '../types';
import { formatCurrency, formatDateFR } from '../utils/calculations';
import { downloadInvoicePDF } from '../utils/pdfGenerator';
import { ConfirmationModal } from './ConfirmationModal';
import { StatusBadge } from './Dashboard';

interface InvoiceListProps {
  invoices: Invoice[];
  clients: Client[];
  company: CompanySettings;
  onNewInvoice: () => void;
  onEditInvoice: (inv: Invoice) => void;
  onViewInvoice: (inv: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onUpdateStatus: (id: string, status: InvoiceStatus) => void;
  onConvertQuote: (id: string) => void;
  onCreateAvoir?: (inv: Invoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  clients,
  company,
  onNewInvoice,
  onEditInvoice,
  onViewInvoice,
  onDeleteInvoice,
  onUpdateStatus,
  onConvertQuote,
  onCreateAvoir
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    const client = clients.find((c) => c.id === inv.clientId) || inv.client;
    const clientName = client?.name.toLowerCase() || '';

    const matchesSearch =
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      clientName.includes(search.toLowerCase()) ||
      (inv.notes && inv.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || inv.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesClient = clientFilter === 'ALL' || inv.clientId === clientFilter;

    return matchesSearch && matchesType && matchesStatus && matchesClient;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <span>Factures, Devis & Avoirs ({invoices.length})</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestion complète des pièces comptables, conversion de devis et génération PDF
          </p>
        </div>

        <button
          onClick={onNewInvoice}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Créer un Document</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par N°, client, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none"
          >
            <option value="ALL">Tous les types</option>
            <option value="FACTURE">Factures uniquement</option>
            <option value="DEVIS">Devis uniquement</option>
            <option value="ACOMPTE">Acomptes</option>
            <option value="AVOIR">Avoirs</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="BROUILLON">Brouillon</option>
            <option value="ENVOYEE">Envoyée</option>
            <option value="PAYEE">Payée</option>
            <option value="EN_RETARD">En retard</option>
            <option value="ANNULEE">Annulée</option>
          </select>

          {/* Client Filter */}
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none"
          >
            <option value="ALL">Tous les clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoices Table (Desktop) & Card List (Mobile) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Mobile View: Card List */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredInvoices.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Aucun document ne correspond à vos critères.
            </div>
          ) : (
            filteredInvoices.map((inv) => {
              const client = clients.find((c) => c.id === inv.clientId) || inv.client;
              const isQuote = inv.type === 'DEVIS';

              return (
                <div key={inv.id} className="p-4 space-y-3">
                  {/* Top line: Badges & Number & Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                          isQuote
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {inv.type}
                      </span>
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {inv.number}
                      </span>
                    </div>
                    <StatusBadge status={inv.status} />
                  </div>

                  {/* Client Info & Date */}
                  <div className="flex justify-between items-start text-xs">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {client?.name || 'Client inconnu'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Émis le {formatDateFR(inv.issueDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Total TTC</span>
                      <span className="font-mono font-extrabold text-sm text-blue-600 dark:text-blue-400">
                        {formatCurrency(inv.totalTTC)}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Buttons for Mobile */}
                  <div className="flex items-center justify-end space-x-1 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        downloadInvoicePDF(inv, client, company);
                      }}
                      title="PDF"
                      className="p-2 text-slate-600 hover:text-emerald-600 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center gap-1 text-xs font-medium"
                    >
                      <Download className="h-4 w-4" />
                      <span className="text-[10px]">PDF</span>
                    </button>

                    <button
                      onClick={() => onViewInvoice(inv)}
                      title="Aperçu"
                      className="p-2 text-slate-600 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center gap-1 text-xs font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="text-[10px]">Voir</span>
                    </button>

                    {isQuote && inv.status !== 'PAYEE' && (
                      <button
                        onClick={() => onConvertQuote(inv.id)}
                        title="Convertir"
                        className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl flex items-center gap-1 text-xs font-medium"
                      >
                        <FileCheck2 className="h-4 w-4" />
                        <span className="text-[10px]">Facturer</span>
                      </button>
                    )}

                    {(inv.type === 'FACTURE' || inv.type === 'ACOMPTE') && onCreateAvoir && (
                      <button
                        onClick={() => onCreateAvoir(inv)}
                        title="Créer un avoir pour ce document"
                        className="p-2 text-rose-600 bg-rose-50 dark:bg-rose-950/60 rounded-xl flex items-center gap-1 text-xs font-medium"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span className="text-[10px]">Avoir</span>
                      </button>
                    )}

                    {inv.status !== 'PAYEE' && (
                      <button
                        onClick={() => onUpdateStatus(inv.id, 'PAYEE')}
                        title="Payer"
                        className="p-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl flex items-center gap-1 text-xs font-medium"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-[10px]">Payée</span>
                      </button>
                    )}

                    <button
                      onClick={() => onEditInvoice(inv)}
                      title="Modifier"
                      className="p-2 text-amber-600 bg-slate-100 dark:bg-slate-800 rounded-xl"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => setDeletingInvoice(inv)}
                      title="Supprimer"
                      className="p-2 text-rose-600 bg-slate-100 dark:bg-slate-800 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Document</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Date d'émission</th>
                <th className="py-3.5 px-4">Échéance</th>
                <th className="py-3.5 px-4 text-right">Montant TTC</th>
                <th className="py-3.5 px-4 text-center">Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucun document ne correspond à vos critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const client = clients.find((c) => c.id === inv.clientId) || inv.client;
                  const isQuote = inv.type === 'DEVIS';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                              isQuote
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {inv.type}
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {inv.number}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 dark:text-white truncate max-w-[180px]">
                          {client?.name || 'Client inconnu'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {client?.city || client?.email}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {formatDateFR(inv.issueDate)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {formatDateFR(inv.dueDate)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(inv.totalTTC)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={inv.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1">
                        {/* Download PDF */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            downloadInvoicePDF(inv, client, company);
                          }}
                          title="Télécharger PDF"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Download className="h-4 w-4" />
                        </button>

                        {/* View Modal */}
                        <button
                          onClick={() => onViewInvoice(inv)}
                          title="Aperçu du document"
                          className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Convert Quote to Invoice */}
                        {isQuote && inv.status !== 'PAYEE' && (
                          <button
                            onClick={() => onConvertQuote(inv.id)}
                            title="Convertir ce devis en Facture"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <FileCheck2 className="h-4 w-4" />
                          </button>
                        )}

                        {/* Create Credit Note (Avoir) */}
                        {(inv.type === 'FACTURE' || inv.type === 'ACOMPTE') && onCreateAvoir && (
                          <button
                            onClick={() => onCreateAvoir(inv)}
                            title="Créer une Facture d'Avoir distincte (sans altérer l'original)"
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}

                        {/* Mark as Paid Quick Toggle */}
                        {inv.status !== 'PAYEE' && (
                          <button
                            onClick={() => onUpdateStatus(inv.id, 'PAYEE')}
                            title="Marquer comme Payée"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          onClick={() => onEditInvoice(inv)}
                          title="Modifier"
                          className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeletingInvoice(inv)}
                          title="Supprimer"
                          className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!deletingInvoice}
        title="Supprimer la Pièce"
        message={`Êtes-vous sûr de vouloir supprimer le document N° "${deletingInvoice?.number || ''}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        onConfirm={() => {
          if (deletingInvoice) {
            onDeleteInvoice(deletingInvoice.id);
            setDeletingInvoice(null);
          }
        }}
        onCancel={() => setDeletingInvoice(null)}
      />
    </div>
  );
};
