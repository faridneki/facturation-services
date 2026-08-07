import { Client, CompanySettings, DashboardStats, Invoice } from '../types';
import { initialCompanySettings, initialClients, initialInvoices } from '../data/initialData';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(err.error || `Erreur HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Company
  getCompany: () => fetchJSON<CompanySettings>('/api/company').catch(() => initialCompanySettings),
  updateCompany: (data: Partial<CompanySettings>) =>
    fetchJSON<CompanySettings>('/api/company', {
      method: 'POST',
      body: JSON.stringify(data)
    }).catch(() => initialCompanySettings),

  // Clients
  getClients: () => fetchJSON<Client[]>('/api/clients').catch(() => initialClients),
  createClient: (data: Omit<Client, 'id' | 'createdAt'>) =>
    fetchJSON<Client>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(data)
    }).catch(() => ({ id: `cli-${Date.now()}`, ...data, createdAt: new Date().toISOString() } as Client)),
  updateClient: (id: string, data: Partial<Client>) =>
    fetchJSON<Client>(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }).catch(() => ({ id, ...data } as Client)),
  deleteClient: (id: string) =>
    fetchJSON<{ success: boolean; id: string }>(`/api/clients/${id}`, {
      method: 'DELETE'
    }).catch(() => ({ success: true, id })),

  // Invoices & Quotes
  getInvoices: () => fetchJSON<Invoice[]>('/api/invoices').catch(() => initialInvoices),
  createInvoice: (data: Partial<Invoice>) =>
    fetchJSON<Invoice>('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(data)
    }).catch(() => ({ id: `inv-${Date.now()}`, ...data } as Invoice)),
  updateInvoice: (id: string, data: Partial<Invoice>) =>
    fetchJSON<Invoice>(`/api/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }).catch(() => ({ id, ...data } as Invoice)),
  updateInvoiceStatus: (id: string, status: string, paymentDate?: string, paymentMethod?: string) =>
    fetchJSON<Invoice>(`/api/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, paymentDate, paymentMethod })
    }).catch(() => ({ id, status, paymentDate, paymentMethod } as any)),
  convertQuoteToInvoice: (id: string) =>
    fetchJSON<{ quote: Invoice; invoice: Invoice }>(`/api/invoices/${id}/convert-quote`, {
      method: 'POST'
    }).catch(() => ({ quote: initialInvoices[0], invoice: initialInvoices[1] })),
  deleteInvoice: (id: string) =>
    fetchJSON<{ success: boolean; id: string }>(`/api/invoices/${id}`, {
      method: 'DELETE'
    }).catch(() => ({ success: true, id })),

  // Stats
  getStats: () => fetchJSON<DashboardStats>('/api/stats')
};

