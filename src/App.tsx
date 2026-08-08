import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { ClientFormModal } from './components/ClientFormModal';
import { ClientList } from './components/ClientList';
import { CompanySettingsModal } from './components/CompanySettingsModal';
import { ConfirmationModal } from './components/ConfirmationModal';
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
import { initialCompanySettings } from './data/initialData';

export default function App() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());

  const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'clients'>('dashboard');

  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dbHealth, setDbHealth] = useState<{
    dbHost: string;
    dbName: string;
    dbStatus: string;
    provider: string;
    fullHost?: string;
  } | null>(null);

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
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);

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

      const [compData, clientData, invData, healthData] = await Promise.all([
        api.getCompany(),
        api.getClients(),
        api.getInvoices(),
        api.getHealth().catch(() => null)
      ]);

      if (healthData) {
        setDbHealth(healthData);
      }

      const loadedCompany = compData || initialCompanySettings;
      const loadedClients = Array.isArray(clientData) ? clientData : [];
      const loadedInvoices = Array.isArray(invData) ? invData : [];

      setCompany(loadedCompany);
      setClients(loadedClients);
      setInvoices(loadedInvoices);
      setStats(calculateDashboardStats(loadedInvoices, loadedClients));
    } catch (err: any) {
      console.error('Erreur chargement base de données:', err);
      setCompany(initialCompanySettings);
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
      console.warn('Backend updateCompany error, applying local state:', err);
      setCompany((prev) => ({ ...(prev || { id: 'comp-1', name: 'ALGERIE BATI PRO', country: 'Algérie' }), ...updated }));
    }
    setIsSettingsOpen(false);
    setToast({
      type: 'success',
      title: 'Fiche Entreprise enregistrée !',
      message: 'Les informations de votre entreprise ont été mises à jour.'
    });
    setTimeout(() => setToast(null), 5000);
  };

  // Client Handlers
  const handleSaveClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    let savedClient: Client;
    try {
      if (editingClient) {
        savedClient = await api.updateClient(editingClient.id, clientData);
      } else {
        savedClient = await api.createClient(clientData);
      }
    } catch (err) {
      console.warn('Backend client CRUD error, applying local fallback:', err);
      if (editingClient) {
        savedClient = { ...editingClient, ...clientData };
      } else {
        savedClient = {
          ...clientData,
          id: `cli-${Date.now()}`,
          createdAt: new Date().toISOString()
        } as Client;
      }
    }

    if (editingClient) {
      setClients((prev) => prev.map((c) => (c.id === editingClient.id ? savedClient : c)));
    } else {
      setClients((prev) => [savedClient, ...prev]);
    }

    setEditingClient(null);
    setIsClientModalOpen(false);
    setToast({
      type: 'success',
      title: 'Fiche Client enregistrée !',
      message: 'Les coordonnées et identifiants fiscaux du client ont été enregistrés.'
    });
    setTimeout(() => setToast(null), 5000);
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await api.deleteClient(id);
    } catch (err) {
      console.warn('Backend deleteClient error, applying local fallback:', err);
    }
    setClients((prev) => prev.filter((c) => c.id !== id));
    setToast({
      type: 'info',
      title: 'Client supprimé',
      message: 'Le client a été supprimé de la liste.'
    });
    setTimeout(() => setToast(null), 4000);
  };

  // Invoice Handlers
  const handleSaveInvoice = async (invoiceData: Partial<Invoice>) => {
    let savedDoc: Invoice;
    const isNew = !invoiceData.id;

    try {
      if (invoiceData.id) {
        savedDoc = await api.updateInvoice(invoiceData.id, invoiceData);
      } else {
        savedDoc = await api.createInvoice(invoiceData);
      }
    } catch (err) {
      console.warn('Backend invoice CRUD error, applying local fallback:', err);
      const targetClient = clients.find((c) => c.id === invoiceData.clientId);
      const docId = invoiceData.id || `inv-${Date.now()}`;
      savedDoc = {
        id: docId,
        number: invoiceData.number || 'FAC-2026-001',
        type: invoiceData.type || 'FACTURE',
        status: invoiceData.status || 'BROUILLON',
        clientId: invoiceData.clientId || (clients[0]?.id || 'cli-1'),
        client: targetClient || (invoiceData.client as Client),
        issueDate: invoiceData.issueDate || new Date().toISOString().split('T')[0],
        dueDate: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentDate: invoiceData.paymentDate,
        paymentMethod: invoiceData.paymentMethod,
        items: invoiceData.items || [],
        subtotalHT: invoiceData.subtotalHT || 0,
        discountAmount: invoiceData.discountAmount || 0,
        taxAmount: invoiceData.taxAmount || 0,
        totalTTC: invoiceData.totalTTC || 0,
        depositAmount: invoiceData.depositAmount || 0,
        notes: invoiceData.notes || '',
        paymentTerms: invoiceData.paymentTerms || 'Règlement sous 30 jours',
        createdAt: invoiceData.createdAt || new Date().toISOString()
      };
    }

    if (invoiceData.id) {
      setInvoices((prev) => prev.map((i) => (i.id === invoiceData.id ? savedDoc : i)));
    } else {
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
      title: `${docTypeName} N° ${savedDoc.number || ''} ${isNew ? 'enregistré' : 'mis à jour'} avec succès !`,
      message: `Le document a été enregistré avec succès.`
    });

    setTimeout(() => setToast(null), 6000);
  };

  const handleUpdateStatus = async (
    id: string,
    status: InvoiceStatus,
    paymentDate?: string,
    paymentMethod?: string
  ) => {
    let updated: Invoice | null = null;
    try {
      updated = await api.updateInvoiceStatus(id, status, paymentDate, paymentMethod);
    } catch (err) {
      console.warn('Backend updateInvoiceStatus error, applying local fallback:', err);
    }

    setInvoices((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        if (updated) return updated;
        return {
          ...i,
          status,
          ...(paymentDate ? { paymentDate } : {}),
          ...(paymentMethod ? { paymentMethod: paymentMethod as any } : {})
        };
      })
    );

    if (selectedInvoice && selectedInvoice.id === id) {
      setSelectedInvoice((prev) =>
        prev
          ? updated || {
              ...prev,
              status,
              ...(paymentDate ? { paymentDate } : {}),
              ...(paymentMethod ? { paymentMethod: paymentMethod as any } : {})
            }
          : null
      );
    }

    setToast({
      type: 'success',
      title: 'Statut mis à jour !',
      message: `Le statut du document a été modifié en ${status}.`
    });
    setTimeout(() => setToast(null), 4000);
  };

  const handleConvertQuote = async (id: string) => {
    let resInvoice: Invoice | null = null;
    let resQuote: Invoice | null = null;

    try {
      const res = await api.convertQuoteToInvoice(id);
      resInvoice = res.invoice;
      resQuote = res.quote;
    } catch (err) {
      console.warn('Backend convertQuote error, applying local fallback:', err);
      const targetQuote = invoices.find((i) => i.id === id);
      if (targetQuote) {
        resQuote = { ...targetQuote, status: 'PAYEE' };
        resInvoice = {
          ...targetQuote,
          id: `inv-${Date.now()}`,
          number: generateNextDocumentNumber('FACTURE', invoices),
          type: 'FACTURE',
          status: 'ENVOYEE',
          convertedFromId: targetQuote.id,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        };
      }
    }

    if (resInvoice && resQuote) {
      setInvoices((prev) => [resInvoice!, ...prev.map((i) => (i.id === id ? resQuote! : i))]);
      setToast({
        type: 'success',
        title: 'Devis converti !',
        message: `Le devis a été converti en Facture N° ${resInvoice.number}.`
      });
      setTimeout(() => setToast(null), 5000);
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
    } catch (err) {
      console.warn('Backend deleteInvoice error, applying local fallback:', err);
    }
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    if (selectedInvoice?.id === id) setSelectedInvoice(null);
    setToast({
      type: 'info',
      title: 'Document supprimé',
      message: 'La pièce a été supprimée avec succès.'
    });
    setTimeout(() => setToast(null), 4000);
  };

  const handleClearDemoData = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Vider la Base de Données',
      message: 'Voulez-vous vraiment effacer TOUTES les données (clients, factures, devis) de la base Neon ? Cette opération réinitialise vos données.',
      confirmText: 'Effacer Tout',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await api.clearDemoData();
        } catch (err: any) {
          console.warn('Backend clear warning:', err);
        }
        setClients([]);
        setInvoices([]);
        setToast({
          type: 'info',
          title: 'Base de données vidée !',
          message: 'Toutes les données ont été supprimées de la base. Vous avez une base 100% propre pour vos saisies.'
        });
        setTimeout(() => setToast(null), 5000);
      }
    });
  };

  const handleResetDemoData = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Charger les Exemples de Test',
      message: 'Voulez-vous charger des exemples réels de clients et factures directement dans votre base PostgreSQL Neon ?',
      confirmText: 'Charger les Exemples',
      variant: 'info',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await api.resetDemoData();
          await loadInitialData();
          setToast({
            type: 'success',
            title: 'Exemples chargés !',
            message: 'Des exemples de clients et factures ont été enregistrés dans la base de données.'
          });
          setTimeout(() => setToast(null), 5000);
        } catch (err: any) {
          console.warn('Error resetting backend demo data, applying local fallback:', err);
          const fallbackClients: Client[] = [
            {
              id: 'cli-6691338',
              nom: 'SARL PROMO IMMO ALGER',
              email: 'contact@promoimmo-alger.dz',
              telephone: '0550 11 22 33',
              adresse: '12 Boulevard Mohamed V, Alger Centre',
              nif: '002016098765432',
              rc: '16/00-9876543B20',
              ai: '16098765432',
              nis: '199816010098765',
              creditMax: 5000000,
              creditActuel: 1250000,
              createdAt: new Date().toISOString()
            },
            {
              id: 'cli-6691339',
              nom: 'EURL BATIMENT MODERN ORAN',
              email: 'direction@batiment-oran.dz',
              telephone: '041 33 44 55',
              adresse: "Avenue Larbi Ben M'hidi, Oran",
              nif: '003031011223344',
              rc: '31/00-1122334B18',
              ai: '31011223344',
              nis: '200131010011223',
              creditMax: 3000000,
              creditActuel: 0,
              createdAt: new Date().toISOString()
            }
          ];

          const fallbackInvoices: Invoice[] = [
            {
              id: 'inv-101',
              number: 'FAC-2026-001',
              type: 'FACTURE',
              status: 'PAYEE',
              clientId: 'cli-6691338',
              client: fallbackClients[0],
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
                  unitPriceHT: 45000,
                  vatRate: 9,
                  discountPercent: 5,
                  totalHT: 513000
                }
              ],
              subtotalHT: 513000,
              discountAmount: 27000,
              taxAmount: 43740,
              totalTTC: 529740,
              depositAmount: 0,
              createdAt: new Date().toISOString(),
              paymentTerms: 'Règlement sous 30 jours par virement bancaire.'
            }
          ];

          setClients(fallbackClients);
          setInvoices(fallbackInvoices);
          setToast({
            type: 'success',
            title: 'Exemples chargés !',
            message: 'Des exemples de clients et factures ont été chargés avec succès.'
          });
          setTimeout(() => setToast(null), 5000);
        }
      }
    });
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
        onClearDemoData={handleClearDemoData}
        onResetDemoData={handleResetDemoData}
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
                dbHealth={dbHealth}
                onNewInvoice={() => {
                  setEditingInvoice(null);
                  setIsInvoiceEditorOpen(true);
                }}
                onViewInvoice={(inv) => setSelectedInvoice(inv)}
                onViewAllInvoices={() => setActiveTab('invoices')}
                onUpdateStatus={(id, status) => handleUpdateStatus(id, status as InvoiceStatus)}
                onResetDemoData={handleResetDemoData}
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

      <ConfirmationModal
        isOpen={!!confirmModal?.isOpen}
        title={confirmModal?.title || ''}
        message={confirmModal?.message || ''}
        confirmText={confirmModal?.confirmText}
        variant={confirmModal?.variant}
        onConfirm={() => {
          if (confirmModal?.onConfirm) confirmModal.onConfirm();
        }}
        onCancel={() => setConfirmModal(null)}
      />
    </div>
  );
}
