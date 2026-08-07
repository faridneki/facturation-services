import { Client, CompanySettings, DashboardStats, Invoice } from '../types';

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
  getCompany: () => fetchJSON<CompanySettings>('/api/company'),
  updateCompany: (data: Partial<CompanySettings>) =>
    fetchJSON<CompanySettings>('/api/company', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Clients
  getClients: () => fetchJSON<Client[]>('/api/clients'),
  createClient: (data: Omit<Client, 'id' | 'createdAt'>) =>
    fetchJSON<Client>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateClient: (id: string, data: Partial<Client>) =>
    fetchJSON<Client>(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteClient: (id: string) =>
    fetchJSON<{ success: boolean; id: string }>(`/api/clients/${id}`, {
      method: 'DELETE'
    }),

  // Invoices & Quotes
  getInvoices: () => fetchJSON<Invoice[]>('/api/invoices'),
  createInvoice: (data: Partial<Invoice>) =>
    fetchJSON<Invoice>('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateInvoice: (id: string, data: Partial<Invoice>) =>
    fetchJSON<Invoice>(`/api/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  updateInvoiceStatus: (id: string, status: string, paymentDate?: string, paymentMethod?: string) =>
    fetchJSON<Invoice>(`/api/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, paymentDate, paymentMethod })
    }),
  convertQuoteToInvoice: (id: string) =>
    fetchJSON<{ quote: Invoice; invoice: Invoice }>(`/api/invoices/${id}/convert-quote`, {
      method: 'POST'
    }),
  deleteInvoice: (id: string) =>
    fetchJSON<{ success: boolean; id: string }>(`/api/invoices/${id}`, {
      method: 'DELETE'
    }),

  // Stats
  getStats: () => fetchJSON<DashboardStats>('/api/stats'),

  // Demo Data Management
  clearDemoData: () => fetchJSON<{ success: boolean; message: string }>('/api/demo/clear', { method: 'POST' }),
  resetDemoData: () => fetchJSON<{ success: boolean; message: string }>('/api/demo/reset', { method: 'POST' })
};

