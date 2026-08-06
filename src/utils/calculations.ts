import { Client, DashboardStats, DocumentType, Invoice, InvoiceItem } from '../types';

export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
  const cleaned = formatted.replace(/[\u202f\u00a0/]/g, ' ');
  return `${cleaned} DA`;
}

export function formatNumber(amount: number, decimals: number = 2): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount || 0);
  return formatted.replace(/[\u202f\u00a0/]/g, ' ');
}

export function numberToWordsFR(n: number): string {
  if (n === 0) return 'zéro';
  if (n < 0) return 'moins ' + numberToWordsFR(Math.abs(n));

  n = Math.floor(n);

  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

  if (n < 10) return units[n];
  if (n < 20) return teens[n - 10];

  if (n < 100) {
    const tenDigit = Math.floor(n / 10);
    const unitDigit = n % 10;

    if (tenDigit === 7) {
      if (unitDigit === 1) return 'soixante et onze';
      return 'soixante-' + teens[unitDigit];
    }

    if (tenDigit === 8) {
      if (unitDigit === 0) return 'quatre-vingts';
      return 'quatre-vingt-' + units[unitDigit];
    }

    if (tenDigit === 9) {
      return 'quatre-vingt-' + teens[unitDigit];
    }

    if (unitDigit === 0) return tens[tenDigit];
    if (unitDigit === 1) return tens[tenDigit] + ' et un';
    return tens[tenDigit] + '-' + units[unitDigit];
  }

  if (n < 1000) {
    const hundredDigit = Math.floor(n / 100);
    const remainder = n % 100;
    const hundredStr = hundredDigit === 1 ? 'cent' : units[hundredDigit] + ' cent';

    if (remainder === 0) {
      return hundredDigit > 1 ? hundredStr + 's' : hundredStr;
    }
    return hundredStr + ' ' + numberToWordsFR(remainder);
  }

  if (n < 1000000) {
    const thousandDigit = Math.floor(n / 1000);
    const remainder = n % 1000;
    const thousandStr = thousandDigit === 1 ? 'mille' : numberToWordsFR(thousandDigit) + ' mille';

    if (remainder === 0) return thousandStr;
    return thousandStr + ' ' + numberToWordsFR(remainder);
  }

  if (n < 1000000000) {
    const millionDigit = Math.floor(n / 1000000);
    const remainder = n % 1000000;
    const millionStr = millionDigit === 1 ? 'un million' : numberToWordsFR(millionDigit) + ' millions';

    if (remainder === 0) return millionStr;
    return millionStr + ' ' + numberToWordsFR(remainder);
  }

  const billionDigit = Math.floor(n / 1000000000);
  const remainder = n % 1000000000;
  const billionStr = billionDigit === 1 ? 'un milliard' : numberToWordsFR(billionDigit) + ' milliards';

  if (remainder === 0) return billionStr;
  return billionStr + ' ' + numberToWordsFR(remainder);
}

export function amountToWordsFR(amount: number): string {
  const rounded = Math.round((amount || 0) * 100) / 100;
  const integerPart = Math.floor(Math.abs(rounded));
  const decimalPart = Math.round((Math.abs(rounded) - integerPart) * 100);

  const integerWords = numberToWordsFR(integerPart);

  let currencySuffix = ' dinars algériens';
  if (integerPart >= 1000000 && integerPart % 1000000 === 0) {
    currencySuffix = ' de dinars algériens';
  } else if (integerPart <= 1) {
    currencySuffix = ' dinar algérien';
  }

  let result = integerWords + currencySuffix;

  if (decimalPart > 0) {
    const decimalWords = numberToWordsFR(decimalPart);
    result += ' et ' + decimalWords + (decimalPart > 1 ? ' centimes' : ' centime');
  }

  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function generateNextDocumentNumber(
  type: DocumentType,
  existingInvoices: Invoice[],
  year: number = new Date().getFullYear()
): string {
  let prefix = 'FAC';
  if (type === 'DEVIS') prefix = 'DEV';
  else if (type === 'ACOMPTE') prefix = 'ACO';
  else if (type === 'AVOIR') prefix = 'AVR';

  const yearStr = String(year);
  const prefixYearPattern = new RegExp(`^${prefix}-${yearStr}-(\\d+)$`, 'i');

  let maxSeq = 0;

  existingInvoices.forEach((inv) => {
    if (inv.number) {
      const match = inv.number.match(prefixYearPattern);
      if (match && match[1]) {
        const seq = parseInt(match[1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  });

  // Fallback: search all invoices of that type if custom prefixes were used
  if (maxSeq === 0) {
    const typeInvoices = existingInvoices.filter((i) => i.type === type);
    typeInvoices.forEach((inv) => {
      if (inv.number) {
        const digits = inv.number.match(/(\d+)/g);
        if (digits && digits.length > 0) {
          const lastDigits = parseInt(digits[digits.length - 1], 10);
          if (!isNaN(lastDigits) && lastDigits > maxSeq) {
            maxSeq = lastDigits;
          }
        }
      }
    });
  }

  const nextSeq = maxSeq + 1;
  const paddedSeq = String(nextSeq).padStart(3, '0');
  return `${prefix}-${yearStr}-${paddedSeq}`;
}

export function formatDateFR(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getClientDisplayName(client?: Client | null): string {
  if (!client) return 'Client inconnu';
  return client.nom || client.name || 'Sans nom';
}

export function getClientPhone(client?: Client | null): string {
  if (!client) return '-';
  return client.telephone || client.phone || '-';
}

export function getClientAddress(client?: Client | null): string {
  if (!client) return '-';
  const parts = [
    client.adresse || client.address,
    client.city,
    client.zipCode
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '-';
}

export function calculateItemTotalHT(item: Pick<InvoiceItem, 'quantity' | 'unitPriceHT' | 'discountPercent'>): number {
  const qty = Number(item.quantity) || 0;
  const price = Number(item.unitPriceHT) || 0;
  const discount = Number(item.discountPercent) || 0;
  
  const rawTotal = qty * price;
  if (discount > 0) {
    return Math.max(0, rawTotal * (1 - discount / 100));
  }
  return rawTotal;
}

export interface VatBreakdown {
  rate: number;
  baseHT: number;
  vatAmount: number;
}

export function calculateInvoiceTotals(items: InvoiceItem[], globalDiscountPercent: number = 0, depositAmount: number = 0) {
  let subtotalHT = 0;
  const vatBreakdownMap: Record<number, VatBreakdown> = {};

  items.forEach(item => {
    const itemHT = calculateItemTotalHT(item);
    subtotalHT += itemHT;

    const rate = Number(item.vatRate) ?? 9;
    if (!vatBreakdownMap[rate]) {
      vatBreakdownMap[rate] = { rate, baseHT: 0, vatAmount: 0 };
    }
    vatBreakdownMap[rate].baseHT += itemHT;
  });

  // Global discount if any
  const discountAmount = globalDiscountPercent > 0 ? (subtotalHT * globalDiscountPercent) / 100 : 0;
  const netHT = Math.max(0, subtotalHT - discountAmount);

  // Recalculate tax with global discount ratio applied proportionally
  const discountRatio = subtotalHT > 0 ? netHT / subtotalHT : 1;
  let taxAmount = 0;

  const vatBreakdowns: VatBreakdown[] = Object.values(vatBreakdownMap).map(b => {
    const adjustedBase = b.baseHT * discountRatio;
    const vat = (adjustedBase * b.rate) / 100;
    taxAmount += vat;
    return {
      rate: b.rate,
      baseHT: adjustedBase,
      vatAmount: vat
    };
  });

  const totalTTC = netHT + taxAmount;
  const remainingDue = Math.max(0, totalTTC - (depositAmount || 0));

  return {
    subtotalHT,
    discountAmount,
    netHT,
    vatBreakdowns,
    taxAmount,
    totalTTC,
    depositAmount: depositAmount || 0,
    remainingDue
  };
}

export function calculateDashboardStats(invoices: Invoice[], clients: Client[]): DashboardStats {
  const now = new Date();
  const currentYear = now.getFullYear();

  const factures = invoices.filter(i => i.type === 'FACTURE');
  const devis = invoices.filter(i => i.type === 'DEVIS');

  let monthlyRevenue = 0;
  let annualRevenue = 0;
  let paidAmount = 0;
  let pendingAmount = 0;
  let overdueAmount = 0;

  let draftCount = 0;
  let sentCount = 0;
  let paidCount = 0;
  let overdueCount = 0;

  const currentMonthStr = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  factures.forEach(inv => {
    const isThisYear = inv.issueDate.startsWith(String(currentYear));
    const isThisMonth = inv.issueDate.startsWith(currentMonthStr);

    if (inv.status === 'PAYEE') {
      paidAmount += inv.totalTTC;
      paidCount++;
      if (isThisYear) annualRevenue += inv.totalTTC;
      if (isThisMonth) monthlyRevenue += inv.totalTTC;
    } else if (inv.status === 'ENVOYEE') {
      pendingAmount += inv.totalTTC;
      sentCount++;
    } else if (inv.status === 'EN_RETARD') {
      overdueAmount += inv.totalTTC;
      overdueCount++;
    } else if (inv.status === 'BROUILLON') {
      draftCount++;
    }
  });

  // Calculate monthly revenue trends for last 6 months
  const monthNames = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  const revenueByMonth: DashboardStats['revenueByMonth'] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;

    let ca = 0;
    let encaisse = 0;
    let devisTotal = 0;

    factures.forEach(inv => {
      if (inv.issueDate.startsWith(mStr)) {
        ca += inv.totalTTC;
        if (inv.status === 'PAYEE') encaisse += inv.totalTTC;
      }
    });

    devis.forEach(dev => {
      if (dev.issueDate.startsWith(mStr)) {
        devisTotal += dev.totalTTC;
      }
    });

    revenueByMonth.push({
      month: label,
      ca,
      encaisse,
      devis: devisTotal
    });
  }

  // Status breakdown for donut chart
  const statusBreakdown = [
    { name: 'Payées', value: paidCount, color: '#10b981' },
    { name: 'En attente', value: sentCount, color: '#3b82f6' },
    { name: 'En retard', value: overdueCount, color: '#ef4444' },
    { name: 'Brouillons', value: draftCount, color: '#9ca3af' }
  ].filter(s => s.value > 0);

  // Top services breakdown by revenue
  const serviceMap: Record<string, number> = {};
  factures.forEach(inv => {
    inv.items.forEach(item => {
      const category = item.category || 'Fourniture & Pose';
      serviceMap[category] = (serviceMap[category] || 0) + item.totalHT;
    });
  });

  const topServices = Object.entries(serviceMap)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  // Quotes conversion rate
  const acceptedQuotes = devis.filter(d => d.status === 'PAYEE' || d.convertedFromId || d.status === 'ENVOYEE').length;
  const quotesConversionRate = devis.length > 0 ? Math.round((acceptedQuotes / devis.length) * 100) : 0;

  return {
    monthlyRevenue,
    annualRevenue,
    paidAmount,
    pendingAmount,
    overdueAmount,
    draftCount,
    sentCount,
    paidCount,
    overdueCount,
    totalClients: clients.length,
    quotesCount: devis.length,
    quotesConversionRate,
    revenueByMonth,
    statusBreakdown,
    topServices
  };
}
