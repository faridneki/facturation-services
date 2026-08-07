import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { ClientFormModal } from './components/ClientFormModal';
import { ClientList } from './components/ClientList';
import { CompanySettingsModal } from './components/CompanySettingsModal';
import { Dashboard } from './components/Dashboard';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoiceList } from './components/InvoiceList';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { PasswordChangeModal } from './components/PasswordChangeModal';
import { PrismaCodeModal } from './components/PrismaCodeModal';
import { api } from './services/api';
import { authService, User } from './services/authService';
import { Client, CompanySettings, DashboardStats, Invoice, InvoiceStatus } from './types';
import { calculateDashboardStats, generateNextDocumentNumber } from './utils/calculations';

export default function App() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());

  const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'clients'>('dashboard');

  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  // Modals & Views State
  const [isInvoiceEditorOpen, setIsInvoiceEditorOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Partial<Invoice> | null>(null);

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPrismaModalOpen, setIsPrismaModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentUser(authService.getCurrentUser());
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // Fetch initial data from server
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setDbError(null);

      const [compData, clientData, invData] = await Promise.all([
        api.getCompany(),
        api.getClients(),
        api.getInvoices()
      ]);

      const loadedClients = clientData || [];
      const loadedInvoices = invData || [];

      setCompany(compData);
      setClients(loadedClients);
      setInvoices(loadedInvoices);
      setStats(calculateDashboardStats(loadedInvoices, loadedClients));
    } catch (err: any) {
      console.error('Erreur chargement base de données:', err);
      const errMsg = err?.message || 'Connexion à la base de données PostgreSQL / Neon impossible.';
      setDbError(errMsg);
      setCompany({ id: 'comp-1', name: 'Mon Entreprise', country: 'Algérie' });
      setClients([]);
      setInvoices([]);
      setStats(calculateDashboardStats([], []));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Recalculate stats whenever invoices/clients change
  useEffect(() => {
    if (invoices && clients) {
      setStats(calculateDashboardStats(invoices, clients));
    }
  }, [invoices, clients]);

  // Company Handler
  const handleSaveCompany = async (updated: Partial<CompanySettings>) => {
    try {
      const result = await api.updateCompany(updated);
      setCompany(result);
    } catch (err) {
      alert('Erreur sauvegarde entreprise');
    }
  };

  // Client Handlers
  const handleSaveClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      if (editingClient) {
        const updated = await api.updateClient(editingClient.id, clientData);
        setClients(clients.map((c) => (c.id === editingClient.id ? updated : c)));
      } else {
        const created = await api.createClient(clientData);
        setClients([created, ...clients]);
      }
      setEditingClient(null);
    } catch (err) {
      alert('Erreur sauvegarde client');
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await api.deleteClient(id);
      setClients(clients.filter((c) => c.id !== id));
    } catch (err) {
      alert('Erreur suppression client');
    }
  };

  // Invoice Handlers
  const handleSaveInvoice = async (invoiceData: Partial<Invoice>) => {
    try {
      let savedDoc: Invoice;
      const isNew = !invoiceData.id;

      if (invoiceData.id) {
        savedDoc = await api.updateInvoice(invoiceData.id, invoiceData);
        setInvoices((prev) => prev.map((i) => (i.id === invoiceData.id ? savedDoc : i)));
      } else {
        savedDoc = await api.createInvoice(invoiceData);
        setInvoices((prev) => [savedDoc, ...prev]);
      }

      const docTypeName =
        savedDoc.type === 'DEVIS'
          ? 'Devis'
          : savedDoc.type === 'AVOIR'
          ? 'Avoir'
          : 'Facture';

      setIsInvoiceEditorOpen(false);
      setEditingInvoice(null);
      setActiveTab('invoices');

      setToast({
        type: 'success',
        title: `${docTypeName} N° ${savedDoc.number} ${isNew ? 'enregistré' : 'mis à jour'} avec succès !`,
        message: `Le document a été enregistré et vous avez été redirigé vers la liste des factures et devis.`
      });

      setTimeout(() => setToast(null), 6000);
    } catch (err) {
      alert('Erreur lors de l\'enregistrement du document. Veuillez réessayer.');
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: InvoiceStatus,
    paymentDate?: string,
    paymentMethod?: string
  ) => {
    try {
      const updated = await api.updateInvoiceStatus(id, status, paymentDate, paymentMethod);
      setInvoices(invoices.map((i) => (i.id === id ? updated : i)));
      if (selectedInvoice && selectedInvoice.id === id) {
        setSelectedInvoice(updated);
      }
    } catch (err) {
      alert('Erreur mise à jour statut');
    }
  };

  const handleConvertQuote = async (id: string) => {
    try {
      const res = await api.convertQuoteToInvoice(id);
      setInvoices([res.invoice, ...invoices.map((i) => (i.id === id ? res.quote : i))]);
      alert(`Devis converti en Facture N° ${res.invoice.number} avec succès !`);
    } catch (err) {
      alert('Erreur conversion du devis');
    }
  };

  const handleCreateAvoir = (sourceInvoice: Invoice) => {
    const nextAvoirNumber = generateNextDocumentNumber('AVOIR', invoices);
    setEditingInvoice({
      type: 'AVOIR',
      number: nextAvoirNumber,
      clientId: sourceInvoice.clientId,
      items: sourceInvoice.items.map((it) => ({
        ...it,
        id: `item-${Date.now()}-${Math.random().toString().substring(2, 6)}`
      })),
      notes: `Facture d'avoir relative à la ${sourceInvoice.type === 'DEVIS' ? 'proposition' : 'facture'} N° ${sourceInvoice.number}`,
      paymentTerms: sourceInvoice.paymentTerms,
      depositAmount: 0,
      convertedFromId: sourceInvoice.id,
      status: 'BROUILLON'
    });
    setSelectedInvoice(null);
    setIsInvoiceEditorOpen(true);
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await api.deleteInvoice(id);
      setInvoices(invoices.filter((i) => i.id !== id));
      if (selectedInvoice?.id === id) setSelectedInvoice(null);
    } catch (err) {
      alert('Erreur suppression document');
    }
  };

  // If not authenticated, render Login screen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        companyName={company?.name}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="h-12 w-12 rounded-xl bg-blue-600 animate-pulse flex items-center justify-center font-bold text-2xl mb-4">
          F
        </div>
        <p className="text-sm font-semibold text-slate-400">Chargement de Factura - Prestations & Pose...</p>
      </div>
    );
  }

  const activeCompany = company || { id: 'comp-1', name: 'Mon Entreprise', country: 'Algérie' };
  const activeStats = stats || calculateDashboardStats(invoices, clients);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setIsInvoiceEditorOpen(false);
          setActiveTab(tab);
        }}
        onNewInvoice={() => {
          setEditingInvoice(null);
          setIsInvoiceEditorOpen(true);
        }}
        onNewClient={() => {
          setEditingClient(null);
          setIsClientModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPrismaModal={() => setIsPrismaModalOpen(true)}
        onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
        onLogout={handleLogout}
        currentUser={currentUser}
        companyName={activeCompany.name}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Database Error Alert Banner */}
        {dbError && (
          <div className="mb-6 p-5 bg-amber-50 dark:bg-amber-950/90 border-2 border-amber-500/60 rounded-2xl text-slate-900 dark:text-white shadow-xl flex items-start justify-between animate-fade-in transition-all">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm shrink-0 mt-0.5">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-amber-950 dark:text-amber-100 flex items-center gap-2">
                  Base de données non disponible / Erreur de connexion
                </h3>
                <p className="text-xs text-amber-900 dark:text-amber-200 mt-1 font-mono bg-amber-100/80 dark:bg-amber-900/50 p-2 rounded-lg border border-amber-300 dark:border-amber-800">
                  {dbError}
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-2">
                  Aucune donnée de démonstration n'est affichée. Veuillez vérifier que la variable d'environnement <code className="font-semibold underline">DATABASE_URL</code> est accessible par l'application déployée.
                </p>
                <button
                  onClick={loadInitialData}
                  className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-xs font-semibold rounded-xl text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 focus:outline-none transition-colors shadow-sm cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-2" />
                  Réessayer la connexion
                </button>
              </div>
            </div>
            <button
              onClick={() => setDbError(null)}
              className="p-1.5 hover:bg-amber-200/50 dark:hover:bg-amber-900 rounded-lg text-amber-800 dark:text-amber-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Toast Notification Banner */}
        {toast && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/90 border-2 border-emerald-500/60 rounded-2xl text-slate-900 dark:text-white shadow-xl flex items-center justify-between animate-fade-in transition-all">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-sm shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-100">{toast.title}</h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1.5 hover:bg-emerald-200/50 dark:hover:bg-emerald-900 rounded-lg text-emerald-800 dark:text-emerald-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Invoice Editor Mode */}
        {isInvoiceEditorOpen ? (
          <InvoiceEditor
            initialInvoice={editingInvoice}
            invoices={invoices}
            clients={clients}
            company={activeCompany}
            onSave={handleSaveInvoice}
            onCancel={() => {
              setIsInvoiceEditorOpen(false);
              setEditingInvoice(null);
            }}
            onAddClientInline={() => {
              setEditingClient(null);
              setIsClientModalOpen(true);
            }}
          />
        ) : (
          <>
            {/* Tab Views */}
            {activeTab === 'dashboard' && (
              <Dashboard
                stats={activeStats}
                invoices={invoices}
                clients={clients}
                company={activeCompany}
                onNewInvoice={() => {
                  setEditingInvoice(null);
                  setIsInvoiceEditorOpen(true);
                }}
                onViewInvoice={(inv) => setSelectedInvoice(inv)}
                onViewAllInvoices={() => setActiveTab('invoices')}
                onUpdateStatus={(id, status) => handleUpdateStatus(id, status as InvoiceStatus)}
              />
            )}

            {activeTab === 'invoices' && (
              <InvoiceList
                invoices={invoices}
                clients={clients}
                company={activeCompany}
                onNewInvoice={() => {
                  setEditingInvoice(null);
                  setIsInvoiceEditorOpen(true);
                }}
                onEditInvoice={(inv) => {
                  setEditingInvoice(inv);
                  setIsInvoiceEditorOpen(true);
                }}
                onViewInvoice={(inv) => setSelectedInvoice(inv)}
                onDeleteInvoice={handleDeleteInvoice}
                onUpdateStatus={handleUpdateStatus}
                onConvertQuote={handleConvertQuote}
                onCreateAvoir={handleCreateAvoir}
              />
            )}

            {activeTab === 'clients' && (
              <ClientList
                clients={clients}
                invoices={invoices}
                onAddClient={() => {
                  setEditingClient(null);
                  setIsClientModalOpen(true);
                }}
                onEditClient={(client) => {
                  setEditingClient(client);
                  setIsClientModalOpen(true);
                }}
                onDeleteClient={handleDeleteClient}
                onCreateInvoiceForClient={(client) => {
                  setEditingInvoice({ clientId: client.id });
                  setIsInvoiceEditorOpen(true);
                }}
                onViewInvoice={(inv) => setSelectedInvoice(inv)}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <ClientFormModal
        isOpen={isClientModalOpen}
        onClose={() => {
          setIsClientModalOpen(false);
          setEditingClient(null);
        }}
        onSave={handleSaveClient}
        initialClient={editingClient}
      />

      <CompanySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        company={activeCompany}
        onSave={handleSaveCompany}
      />

      <InvoiceDetailModal
        invoice={selectedInvoice}
        client={clients.find((c) => c.id === selectedInvoice?.clientId) || selectedInvoice?.client || null}
        company={activeCompany}
        onClose={() => setSelectedInvoice(null)}
        onEdit={(inv) => {
          setSelectedInvoice(null);
          setEditingInvoice(inv);
          setIsInvoiceEditorOpen(true);
        }}
        onUpdateStatus={handleUpdateStatus}
        onConvertQuote={handleConvertQuote}
        onCreateAvoir={handleCreateAvoir}
      />

      <PrismaCodeModal
        isOpen={isPrismaModalOpen}
        onClose={() => setIsPrismaModalOpen(false)}
      />

      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
