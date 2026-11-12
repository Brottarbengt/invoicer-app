import type { DatabaseSync } from 'node:sqlite';

/** Next free customer number for a user (numeric, never colliding). */
export function getNextCustomerNumber(db: DatabaseSync, userId: string): string {
  const rows = db
    .prepare('SELECT customer_number FROM customers WHERE user_id = ?')
    .all(userId) as Array<{ customer_number: string | null }>;

  let max = 0;
  for (const row of rows) {
    const n = parseInt(String(row.customer_number || ''), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }

  // Keep above known seed range (60/61) even if table was emptied
  return String(Math.max(max, 59) + 1);
}

/**
 * Suggest next invoice number.
 * Prefer customer-prefixed series: customer 60 → 6001, 6002, …
 * Fallback: global max numeric invoice number + 1.
 */
export function getNextInvoiceNumber(
  db: DatabaseSync,
  userId: string,
  customerNumber?: string | null,
  excludeInvoiceId?: string | null
): string {
  const rows = db
    .prepare('SELECT id, invoice_number FROM invoices WHERE user_id = ?')
    .all(userId) as Array<{ id: string; invoice_number: string }>;

  const usable = rows.filter((r) => !excludeInvoiceId || r.id !== excludeInvoiceId);

  const cust = (customerNumber || '').trim();
  if (cust && /^\d+$/.test(cust)) {
    let maxSeq = 0;
    for (const row of usable) {
      const num = String(row.invoice_number || '');
      if (num.startsWith(cust) && num.length > cust.length) {
        const suffix = num.slice(cust.length);
        if (/^\d+$/.test(suffix)) {
          maxSeq = Math.max(maxSeq, parseInt(suffix, 10));
        }
      }
    }
    return `${cust}${String(maxSeq + 1).padStart(2, '0')}`;
  }

  let max = 6000;
  for (const row of usable) {
    const n = parseInt(String(row.invoice_number || '').replace(/\D/g, ''), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return String(max + 1);
}

export function isInvoiceNumberTaken(
  db: DatabaseSync,
  userId: string,
  invoiceNumber: string,
  excludeInvoiceId?: string | null
): boolean {
  const row = db
    .prepare(
      `
      SELECT id FROM invoices
      WHERE user_id = ? AND invoice_number = ?
        AND (? IS NULL OR id != ?)
      LIMIT 1
    `
    )
    .get(userId, invoiceNumber.trim(), excludeInvoiceId ?? null, excludeInvoiceId ?? null);
  return Boolean(row);
}

export function isCustomerNumberTaken(
  db: DatabaseSync,
  userId: string,
  customerNumber: string,
  excludeCustomerId?: string | null
): boolean {
  const trimmed = customerNumber.trim();
  if (!trimmed) return false;

  const row = db
    .prepare(
      `
      SELECT id FROM customers
      WHERE user_id = ? AND customer_number = ?
        AND (? IS NULL OR id != ?)
      LIMIT 1
    `
    )
    .get(userId, trimmed, excludeCustomerId ?? null, excludeCustomerId ?? null);
  return Boolean(row);
}
