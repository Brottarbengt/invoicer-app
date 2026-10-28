import { DEFAULT_SAMPLE_CUSTOMERS, DEFAULT_SAMPLE_INVOICE, InvoiceData, RecipientInfo, SavedCustomer, SenderInfo } from '@/types/invoice';

const STORAGE_KEYS = {
  CURRENT_INVOICE: 'faktura_current_data',
  SAVED_INVOICES: 'faktura_saved_list',
  SAVED_SENDER: 'faktura_saved_sender',
  SAVED_CUSTOMERS: 'faktura_saved_customers',
};

export function loadCurrentInvoice(): InvoiceData {
  if (typeof window === 'undefined') return DEFAULT_SAMPLE_INVOICE;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_INVOICE);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn('Failed to load current invoice from storage', err);
  }
  return DEFAULT_SAMPLE_INVOICE;
}

export function saveCurrentInvoice(invoice: InvoiceData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_INVOICE, JSON.stringify(invoice));
  } catch (err) {
    console.warn('Failed to save current invoice to storage', err);
  }
}

export function loadSavedSender(): SenderInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_SENDER);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn('Failed to load sender from storage', err);
  }
  return null;
}

export function saveSenderProfile(sender: SenderInfo): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_SENDER, JSON.stringify(sender));
  } catch (err) {
    console.warn('Failed to save sender to storage', err);
  }
}

export function getSavedInvoicesList(): InvoiceData[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = localStorage.getItem(STORAGE_KEYS.SAVED_INVOICES);
    if (list) {
      return JSON.parse(list);
    }
  } catch (err) {
    console.warn('Failed to load saved invoices', err);
  }
  return [];
}

export function saveInvoiceToList(invoice: InvoiceData): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getSavedInvoicesList();
    const index = list.findIndex((i) => i.id === invoice.id || i.invoiceNumber === invoice.invoiceNumber);
    if (index >= 0) {
      list[index] = invoice;
    } else {
      list.unshift(invoice);
    }
    localStorage.setItem(STORAGE_KEYS.SAVED_INVOICES, JSON.stringify(list));
  } catch (err) {
    console.warn('Failed to save invoice to list', err);
  }
}

export function incrementInvoiceNumber(currentNumber: string): string {
  const match = currentNumber.match(/\d+/);
  if (!match) return currentNumber + '-1';
  const numStr = match[0];
  const num = parseInt(numStr, 10) + 1;
  const padded = num.toString().padStart(numStr.length, '0');
  return currentNumber.replace(numStr, padded);
}

// CUSTOMER REGISTRY (KUNDREGISTER)
export function getSavedCustomers(): SavedCustomer[] {
  if (typeof window === 'undefined') return DEFAULT_SAMPLE_CUSTOMERS;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_CUSTOMERS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load saved customers', err);
  }
  return DEFAULT_SAMPLE_CUSTOMERS;
}

export function saveCustomer(recipient: RecipientInfo): SavedCustomer[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = getSavedCustomers();
    // Check if customer already exists (match by name or customerNumber)
    const existingIndex = list.findIndex(
      (c) =>
        (recipient.name && c.name.trim().toLowerCase() === recipient.name.trim().toLowerCase()) ||
        (recipient.customerNumber && c.customerNumber === recipient.customerNumber && recipient.customerNumber !== '')
    );

    const newCustomer: SavedCustomer = {
      ...recipient,
      id: existingIndex >= 0 ? list[existingIndex].id : `cust-${Date.now()}`,
      createdAt: existingIndex >= 0 ? list[existingIndex].createdAt : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      list[existingIndex] = newCustomer;
    } else {
      list.unshift(newCustomer);
    }

    localStorage.setItem(STORAGE_KEYS.SAVED_CUSTOMERS, JSON.stringify(list));
    return list;
  } catch (err) {
    console.warn('Failed to save customer', err);
    return [];
  }
}

export function deleteSavedCustomer(id: string): SavedCustomer[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = getSavedCustomers().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.SAVED_CUSTOMERS, JSON.stringify(list));
    return list;
  } catch (err) {
    console.warn('Failed to delete customer', err);
    return [];
  }
}
