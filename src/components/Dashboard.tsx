import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileText,
  Plus,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react';
import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Client, CompanySettings, DashboardStats, Invoice } from '../types';
import { formatCurrency, formatDateFR } from '../utils/calculations';
import { downloadInvoicePDF } from '../utils/pdfGenerator';

interface DashboardProps {
  stats: DashboardStats;
  invoices: Invoice[];
  clients: Client[];
  company: CompanySettings;
  onNewInvoice: () => void;
  onViewInvoice: (inv: Invoice) => void;
  onViewAllInvoices: () => void;
  onUpdateStatus: (id: string, status: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  invoices = [],
  clients = [],
  company,
  onNewInvoice,
  onViewInvoice,
  onViewAllInvoices,
  onUpdateStatus
}) => {
  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  const safeClients = Array.isArray(clients) ? clients : [];
  const safeStats = stats || {
    monthlyRevenue: 0,
    annualRevenue: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    draftCount: 0,
    sentCount: 0,
    paidCount: 0,
    overdueCount: 0,
    totalClients: 0,
    quotesCount: 0,
    quotesConversionRate: 0,
    revenueByMonth: [],
    statusBreakdown: [],
    topServices: []
  };

  const overdueInvoices = safeInvoices.filter(i => i && i.status === 'EN_RETARD');
  const recentInvoices = safeInvoices.slice(0, 5);
  const statusBreakdown = safeStats.statusBreakdown || [];
  const revenueByMonth = safeStats.revenueByMonth || [];
  const topServices = safeStats.topServices || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-2">
            Synthèse d'Activité
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Tableau de Bord de Facturation
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Suivi des revenus mensuels, prestations de fourniture & pose et gestion des encaissements.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onNewInvoice}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm shadow-md transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau Devis / Facture</span>
          </button>
        </div>
      </div>

      {/* Overdue Alert Banner if any */}
      {overdueInvoices.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">
                {overdueInvoices.length} facture(s) en retard de paiement
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Montant total impayé : <span className="font-bold text-amber-700 dark:text-amber-300">{formatCurrency(safeStats.overdueAmount)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onViewAllInvoices}
            className="text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Voir les impayés
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Chiffre d'Affaires Mensuel
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(safeStats.monthlyRevenue)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500 inline" />
              <span>Encaissé ce mois-ci</span>
            </p>
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              En Attente de Règlement
            </span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(safeStats.pendingAmount)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {safeStats.sentCount} facture(s) émise(s) non réglée(s)
            </p>
          </div>
        </div>

        {/* Annual Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              CA Annuel Cumulé
            </span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FileCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(safeStats.annualRevenue)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Total facturé & payé année 2026
            </p>
          </div>
        </div>

        {/* Active Clients */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Clients & Devis
            </span>
            <div className="p-2 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {safeStats.totalClients} <span className="text-sm font-normal text-slate-500">Clients</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {safeStats.quotesCount} devis ({safeStats.quotesConversionRate}% acceptés)
            </p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Évolution du Chiffre d'Affaires (€)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparatif des montants facturés, encaissés et devis soumis sur les 6 derniers mois
              </p>
            </div>
          </div>

          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEncaisse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `${v / 1000}k€`} />
                <Tooltip
                  formatter={(val: number) => [formatCurrency(val), '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="ca" name="Total Facturé TTC" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCa)" />
                <Area type="monotone" dataKey="encaisse" name="Encaissé (Payé)" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEncaisse)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Donut Chart (1 col) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Répartition par Statut
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              État de traitement des factures émises
            </p>
          </div>

          <div className="h-56 w-full my-auto flex items-center justify-center">
            {statusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`${val} document(s)`, '']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">Aucune donnée disponible</p>
            )}
          </div>
        </div>
      </div>

      {/* Prestations Bar Chart & Recent Invoices List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prestations breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Top Prestations (Fourniture & Pose)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Répartition du chiffre d'affaires par catégorie d'intervention
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topServices} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `${v / 1000}k€`} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={90} />
                <Tooltip
                  formatter={(val: number) => [formatCurrency(val), 'Chiffre d\'affaires HT']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Invoices Table (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Factures & Devis Récents
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dernières opérations enregistrées
              </p>
            </div>
            <button
              onClick={onViewAllInvoices}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Voir tout ({safeInvoices.length})</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Numéro</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Total TTC</th>
                  <th className="py-2.5 px-3 text-center">Statut</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentInvoices.map((inv) => {
                  const client = safeClients.find(c => c.id === inv.clientId) || inv.client;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-slate-900 dark:text-white">
                        {inv.number}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                        {client?.name || 'Client inconnu'}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {formatDateFR(inv.issueDate)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(inv.totalTTC)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3 px-3 text-right space-x-1">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          title="Voir le document"
                          className="p-1.5 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            downloadInvoicePDF(inv, client, company);
                          }}
                          title="Télécharger PDF"
                          className="p-1.5 text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'PAYEE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="h-3 w-3" />
          Payée
        </span>
      );
    case 'ENVOYEE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          <Clock className="h-3 w-3" />
          Envoyée
        </span>
      );
    case 'EN_RETARD':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
          <AlertTriangle className="h-3 w-3" />
          En retard
        </span>
      );
    case 'BROUILLON':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          Brouillon
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
          {status}
        </span>
      );
  }
};
