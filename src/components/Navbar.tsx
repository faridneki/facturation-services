import { Building2, Code, Database, FileText, KeyRound, LayoutDashboard, LogOut, Plus, RotateCcw, Trash2, Users } from 'lucide-react';
import React from 'react';
import { User } from '../services/authService';

interface NavbarProps {
  activeTab: 'dashboard' | 'invoices' | 'clients';
  setActiveTab: (tab: 'dashboard' | 'invoices' | 'clients') => void;
  onNewInvoice: () => void;
  onNewClient: () => void;
  onOpenSettings: () => void;
  onOpenPrismaModal: () => void;
  onOpenPasswordModal: () => void;
  onClearDemoData: () => void;
  onResetDemoData?: () => void;
  onLogout: () => void;
  currentUser: User | null;
  companyName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onNewInvoice,
  onNewClient,
  onOpenSettings,
  onOpenPrismaModal,
  onOpenPasswordModal,
  onClearDemoData,
  onResetDemoData,
  onLogout,
  currentUser,
  companyName
}) => {

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-bold text-xl">
              F
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Factura <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">BTP & Services</span>
              </span>
              <p className="text-xs text-slate-400 truncate max-w-[180px] sm:max-w-xs">{companyName}</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              id="nav-dashboard-btn"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Tableau de Bord</span>
            </button>

            <button
              id="nav-invoices-btn"
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'invoices'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Factures & Devis</span>
            </button>

            <button
              id="nav-clients-btn"
              onClick={() => setActiveTab('clients')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'clients'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Clients</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {onResetDemoData && (
              <button
                id="reset-db-btn"
                onClick={onResetDemoData}
                title="Charger des exemples de test dans la base Neon"
                className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800 rounded-lg transition-all active:scale-95"
              >
                <RotateCcw className="h-3.5 w-3.5 text-blue-400" />
                <span className="inline">Charger Exemples</span>
              </button>
            )}

            <button
              id="clear-db-btn"
              onClick={onClearDemoData}
              title="Vider la base de données"
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 rounded-lg transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
              <span>Vider</span>
            </button>

            <button
              id="prisma-schema-btn"
              onClick={onOpenPrismaModal}
              title="Afficher le schéma Prisma & Base de données"
              className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors"
            >
              <Code className="h-3.5 w-3.5 text-emerald-400" />
              <span>Code Prisma</span>
            </button>

            <button
              id="security-settings-btn"
              onClick={onOpenPasswordModal}
              title="Changer de mot de passe / Identifiants"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
            >
              <KeyRound className="h-4 w-4 text-amber-400" />
            </button>

            <button
              id="company-settings-btn"
              onClick={onOpenSettings}
              title="Paramètres Entreprise"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
            >
              <Building2 className="h-4 w-4 text-blue-400" />
            </button>

            <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />

            <button
              id="btn-create-invoice"
              onClick={onNewInvoice}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm transition-all shadow-blue-900/30 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Créer Document</span>
            </button>

            {/* User Logout Button */}
            <button
              id="btn-logout"
              onClick={onLogout}
              title={`Déconnecter (${currentUser?.username || 'admin'})`}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700/80 hover:border-rose-700/80 text-xs rounded-lg transition-all"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-400" />
              <span className="hidden sm:inline font-mono">{currentUser?.username || 'admin'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/80 bg-slate-900/90 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 min-h-[44px] min-w-[44px] rounded-xl transition-all ${
              activeTab === 'dashboard'
                ? 'text-blue-400 font-bold bg-blue-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="h-5 w-5 mb-0.5" />
            <span className="text-[10px]">Tableau de bord</span>
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 min-h-[44px] min-w-[44px] rounded-xl transition-all ${
              activeTab === 'invoices'
                ? 'text-blue-400 font-bold bg-blue-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-5 w-5 mb-0.5" />
            <span className="text-[10px]">Factures & Devis</span>
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 min-h-[44px] min-w-[44px] rounded-xl transition-all ${
              activeTab === 'clients'
                ? 'text-blue-400 font-bold bg-blue-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-5 w-5 mb-0.5" />
            <span className="text-[10px]">Clients</span>
          </button>
        </div>
      </div>
    </header>
  );
};
