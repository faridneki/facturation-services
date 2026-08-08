import {
  CheckCircle2,
  Clock,
  Download,
  Edit,
  FileCheck2,
  Printer,
  RotateCcw,
  X
} from 'lucide-react';
import React, { useState } from 'react';
import { Client, CompanyInfo, Invoice, InvoiceStatus } from '../types';
import { calculateInvoiceTotals, formatCurrency, formatDateFR, getClientAddress, getClientDisplayName, getClientPhone } from '../utils/calculations';
import { downloadInvoicePDF } from '../utils/pdfGenerator';
import { StatusBadge } from './Dashboard';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  client: Client | null;
  company: CompanyInfo;
  onClose: () => void;
  onEdit: (inv: Invoice) => void;
  onUpdateStatus: (id: string, status: InvoiceStatus, paymentDate?: string, paymentMethod?: string) => void;
  onConvertQuote: (id: string) => void;
  onCreateAvoir?: (inv: Invoice) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  client,
  company,
  onClose,
  onEdit,
  onUpdateStatus,
  onConvertQuote,
  onCreateAvoir
}) => {
  if (!invoice) return null;

  const activeClient: Client = client || (invoice as any).client || {
    id: invoice.clientId || 'default',
    nom: 'Client Inconnu',
    telephone: '-',
    createdAt: new Date().toISOString()
  };

  const [paymentMethod, setPaymentMethod] = useState<'Virement' | 'Carte' | 'Chèque' | 'Espèces'>('Virement');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const totals = calculateInvoiceTotals(invoice.items, 0, invoice.depositAmount);
  const isQuote = invoice.type === 'DEVIS';

  const clientDisplayName = getClientDisplayName(activeClient);
  const clientPhone = getClientPhone(activeClient);
  const clientAddress = getClientAddress(activeClient);

  const handleMarkPaid = () => {
    onUpdateStatus(invoice.id, 'PAYEE', new Date().toISOString().split('T')[0], paymentMethod);
    setShowPaymentForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center space-x-3">
            <span className="font-mono font-bold text-lg text-slate-900 dark:text-white">
              {invoice.type} N° {invoice.number}
            </span>
            <StatusBadge status={invoice.status} />
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                downloadInvoicePDF(invoice, activeClient, company);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
            >
              <Download className="h-4 w-4" />
              <span>Télécharger PDF</span>
            </button>

            <button
              onClick={() => onEdit(invoice)}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
              title="Modifier le document"
            >
              <Edit className="h-5 w-5" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet Content */}
        <div className="p-8 overflow-y-auto space-y-6 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
          {/* Header Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
            {/* Company Info */}
            <div>
              {company.logoBase64 || company.logoUrl ? (
                <img
                  src={company.logoBase64 || company.logoUrl}
                  alt="Logo Entreprise"
                  className="h-16 max-w-[200px] object-contain mb-2"
                />
              ) : null}
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{company.name}</h2>
              {company.legalName && company.legalName !== company.name && (
                <p className="text-xs text-slate-500 font-medium">{company.legalName}</p>
              )}
              {company.address && <p className="text-xs text-slate-500 mt-1">{company.address}</p>}
              <p className="text-xs text-slate-500">
                Tél : {company.phone || '-'} | Email : {company.email || '-'}
              </p>
              <p className="text-xs text-slate-500 font-mono mt-1">
                NIF : {company.taxId || company.siret || '-'} | RC : {company.rc || '-'}
              </p>
            </div>

            {/* Client Info Frame */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                Facturé à :
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white">{clientDisplayName}</h3>
              {clientPhone && clientPhone !== '-' && (
                <p className="text-xs text-slate-500">Tél : {clientPhone}</p>
              )}
              {clientAddress && clientAddress !== '-' && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{clientAddress}</p>
              )}
              {(client.nif || client.siret || client.rc) && (
                <p className="text-xs text-slate-500 font-mono mt-1">
                  NIF : {client.nif || client.siret || '-'} {client.rc ? `| RC : ${client.rc}` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Dates & Reference */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <div>
              <span className="text-slate-400 block">Date d'émission</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatDateFR(invoice.issueDate)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Date d'échéance</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatDateFR(invoice.dueDate)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Mode de règlement</span>
              <span className="font-semibold text-slate-900 dark:text-white">{invoice.paymentMethod || 'Non spécifié'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Date de paiement</span>
              <span className="font-semibold text-slate-900 dark:text-white">{invoice.paymentDate ? formatDateFR(invoice.paymentDate) : '-'}</span>
            </div>
          </div>

          {invoice.notes && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-xs text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <span className="font-bold">Objet / Notes : </span>
              <span>{invoice.notes}</span>
            </div>
          )}

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Désignation (Fourniture & Pose)</th>
                  <th className="py-2.5 px-3 text-center">Unité</th>
                  <th className="py-2.5 px-3 text-center">Qté</th>
                  <th className="py-2.5 px-3 text-right">P.U. HT</th>
                  <th className="py-2.5 px-3 text-center">TVA</th>
                  <th className="py-2.5 px-3 text-right">Total HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{item.description}</div>
                      {item.category && <div className="text-[10px] text-slate-400">[{item.category}]</div>}
                    </td>
                    <td className="py-3 px-3 text-center font-medium">{item.unit}</td>
                    <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(item.unitPriceHT)}</td>
                    <td className="py-3 px-3 text-center">{item.vatRate || 9}%</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.totalHT)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Totals */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            {/* Payment & IBAN Info */}
            <div className="text-xs text-slate-500 space-y-1 max-w-sm">
              <p className="font-bold text-slate-900 dark:text-white">Coordonnées bancaires :</p>
              <p className="font-mono">Banque : {company.bankName || 'BNA'}</p>
              <p className="font-mono">RIB / CCP : {company.bankRib || company.iban || '-'}</p>
              <p className="italic text-[11px] mt-2">{invoice.paymentTerms || company.paymentTerms || company.legalTerms}</p>
            </div>

            {/* Financial Summary */}
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Total HT :</span>
                <span className="font-mono font-semibold">{formatCurrency(totals.subtotalHT)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Total TVA (9%) :</span>
                <span className="font-mono font-semibold">{formatCurrency(totals.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>TOTAL TTC :</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">{formatCurrency(totals.totalTTC)}</span>
              </div>
              {totals.depositAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold pt-1">
                  <span>NET À PAYER :</span>
                  <span className="font-mono">{formatCurrency(totals.remainingDue)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {isQuote && (
              <button
                onClick={() => onConvertQuote(invoice.id)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-sm"
              >
                <FileCheck2 className="h-4 w-4" />
                <span>Convertir en Facture</span>
              </button>
            )}

            {(invoice.type === 'FACTURE' || invoice.type === 'ACOMPTE') && onCreateAvoir && (
              <button
                onClick={() => onCreateAvoir(invoice)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-sm"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Créer un Avoir</span>
              </button>
            )}

            {invoice.status !== 'PAYEE' && (
              <button
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Enregistrer le Paiement</span>
              </button>
            )}
          </div>

          {showPaymentForm && (
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-300 dark:border-slate-700">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              >
                <option value="Virement">Virement</option>
                <option value="Chèque">Chèque bancaire</option>
                <option value="Espèces">Espèces</option>
                <option value="Carte">Carte CIB / Edahabia</option>
              </select>
              <button
                onClick={handleMarkPaid}
                className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg"
              >
                Valider
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
