import { DEFAULT_SAMPLE_INVOICE, InvoiceData, SenderInfo } from '@/types/invoice';

const STORAGE_KEYS = {
  CURRENT_INVOICE: 'faktura_current_data',
  SAVED_INVOICES: 'faktura_saved_list',
  SAVED_SENDER: 'faktura_saved_sender',
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
