import {
  Building2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Edit2,
  FileText,
  Hash,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Users
} from 'lucide-react';
import React, { useState } from 'react';
import { Client, Invoice } from '../types';
import { formatCurrency, formatDateFR, getClientAddress, getClientDisplayName, getClientPhone } from '../utils/calculations';
import { ConfirmationModal } from './ConfirmationModal';

interface ClientListProps {
  clients: Client[];
  invoices: Invoice[];
  onAddClient: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onCreateInvoiceForClient: (client: Client) => void;
  onViewInvoice: (inv: Invoice) => void;
}

export const ClientList: React.FC<ClientListProps> = ({
  clients,
  invoices,
  onAddClient,
  onEditClient,
  onDeleteClient,
  onCreateInvoiceForClient,
  onViewInvoice
}) => {
  const [search, setSearch] = useState('');
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(c => {
    const displayName = getClientDisplayName(c).toLowerCase();
    const phone = getClientPhone(c).toLowerCase();
    const email = (c.email || '').toLowerCase();
    const nif = (c.nif || c.siret || '').toLowerCase();
    const rc = (c.rc || '').toLowerCase();
    const q = search.toLowerCase();

    return (
      displayName.includes(q) ||
      phone.includes(q) ||
      email.includes(q) ||
      nif.includes(q) ||
      rc.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            <span>Gestion des Clients & Crédits ({clients.length})</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Répertoire des clients, suivis d'encours de crédits (DA) et identifiants fiscaux (NIF, RC, AI, NIS)
          </p>
        </div>

        <button
          id="btn-add-client-top"
          onClick={onAddClient}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter un Client</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, email, NIF, RC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Affichage de <span className="font-bold text-slate-900 dark:text-white">{filteredClients.length}</span> client(s)
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.map((client) => {
          const displayName = getClientDisplayName(client);
          const phone = getClientPhone(client);
          const address = getClientAddress(client);

          const clientInvoices = invoices.filter(i => i.clientId === client.id);
          const totalInvoiced = clientInvoices
            .filter(i => i.type === 'FACTURE')
            .reduce((acc, curr) => acc + curr.totalTTC, 0);
          const totalPaid = clientInvoices
            .filter(i => i.type === 'FACTURE' && i.status === 'PAYEE')
            .reduce((acc, curr) => acc + curr.totalTTC, 0);
          const balanceDue = totalInvoiced - totalPaid;

          const creditMax = client.creditMax ?? 0;
          const creditActuel = client.creditActuel ?? balanceDue;
          const creditRatio = creditMax > 0 ? Math.min(100, Math.round((creditActuel / creditMax) * 100)) : 0;

          const isExpanded = expandedClientId === client.id;

          return (
            <div
              key={client.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header & Actions */}
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    <Building2 className="h-3 w-3" />
                    CLIENT
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditClient(client)}
                      title="Modifier le client"
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingClient(client)}
                      title="Supprimer le client"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Client Name & Contact */}
                <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                  {displayName}
                </h3>

                {/* Info List */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-900 dark:text-white">{phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <a href={`mailto:${client.email}`} className="hover:underline text-blue-600 dark:text-blue-400 truncate">
                        {client.email}
                      </a>
                    </div>
                  )}
                  {address && address !== '-' && (
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{address}</span>
                    </div>
                  )}
                  {client.ncBancaire && (
                    <div className="flex items-center gap-2 truncate font-mono text-[11px] text-slate-500">
                      <CreditCard className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Compte: {client.ncBancaire}</span>
                    </div>
                  )}
                </div>

                {/* Fiscal Badges (Algeria) */}
                {(client.nif || client.rc || client.ai || client.nis) && (
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1 text-[10px] font-mono text-slate-500">
                    {client.nif && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">NIF: {client.nif}</span>}
                    {client.rc && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">RC: {client.rc}</span>}
                    {client.ai && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">AI: {client.ai}</span>}
                    {client.nis && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">NIS: {client.nis}</span>}
                  </div>
                )}

                {/* Credit Gauge Status */}
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 font-medium">Crédit Actuel / Plafond :</span>
                    <span className={`font-bold font-mono ${creditRatio > 80 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                      {formatCurrency(creditActuel)} / {creditMax > 0 ? formatCurrency(creditMax) : 'Illimité'}
                    </span>
                  </div>

                  {creditMax > 0 && (
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          creditRatio >= 90 ? 'bg-rose-500' : creditRatio >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${creditRatio}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions & Expandable List */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => onCreateInvoiceForClient(client)}
                    className="flex items-center space-x-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Créer un Devis / Facture</span>
                  </button>

                  <button
                    onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                    className="flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    <span>{clientInvoices.length} Doc(s)</span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Expandable Invoice History */}
                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-1.5 text-xs">
                    {clientInvoices.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Aucune document enregistré</p>
                    ) : (
                      clientInvoices.map((inv) => (
                        <div
                          key={inv.id}
                          onClick={() => onViewInvoice(inv)}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <FileText className="h-3.5 w-3.5 text-blue-500" />
                            <span className="font-mono font-semibold">{inv.number}</span>
                            <span className="text-[10px] text-slate-400">{formatDateFR(inv.issueDate)}</span>
                          </div>
                          <span className="font-bold font-mono text-slate-900 dark:text-white">{formatCurrency(inv.totalTTC)}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmationModal
        isOpen={!!deletingClient}
        title="Supprimer le Client"
        message={`Êtes-vous sûr de vouloir supprimer le client "${deletingClient ? getClientDisplayName(deletingClient) : ''}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        onConfirm={() => {
          if (deletingClient) {
            onDeleteClient(deletingClient.id);
            setDeletingClient(null);
          }
        }}
        onCancel={() => setDeletingClient(null)}
      />
    </div>
  );
};
