import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { InvoiceData } from '@/types/invoice';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('invoicer_session')?.value;
  const session = getSessionUser(token);

  if (!session) {
    return NextResponse.json({ success: false, error: 'Ej auktoriserad' }, { status: 401 });
  }

  const db = getDatabase();
  const rows = db
    .prepare(
      `
    SELECT id, invoice_number, invoice_date, due_date, customer_number,
           recipient_name, project_title, total_to_pay, data_json, created_at, updated_at
    FROM invoices
    WHERE user_id = ?
    ORDER BY created_at DESC
  `
    )
    .all(session.userId) as any[];

  const invoices = rows.map((r) => {
    try {
      return JSON.parse(r.data_json) as InvoiceData;
    } catch {
      return null;
    }
  }).filter(Boolean);

  return NextResponse.json({ success: true, invoices });
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('invoicer_session')?.value;
    const session = getSessionUser(token);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Ej auktoriserad' }, { status: 401 });
    }

    const invoice: InvoiceData = await req.json();

    if (!invoice.id || !invoice.invoiceNumber) {
      return NextResponse.json({ success: false, error: 'Faktura-ID och nummer krävs' }, { status: 400 });
    }

    const db = getDatabase();
    const now = new Date().toISOString();
    const dataJson = JSON.stringify(invoice);

    const existing = db
      .prepare('SELECT id FROM invoices WHERE id = ? AND user_id = ?')
      .get(invoice.id, session.userId);

    if (existing) {
      db.prepare(`
        UPDATE invoices SET
          invoice_number = ?,
          invoice_date = ?,
          due_date = ?,
          customer_number = ?,
          recipient_name = ?,
          project_title = ?,
          data_json = ?,
          updated_at = ?
        WHERE id = ? AND user_id = ?
      `).run(
        invoice.invoiceNumber,
        invoice.invoiceDate || '',
        invoice.dueDate || '',
        invoice.customerNumber || '',
        invoice.recipient?.name || '',
        invoice.projectTitle || '',
        dataJson,
        now,
        invoice.id,
        session.userId
      );
    } else {
      db.prepare(`
        INSERT INTO invoices (
          id, user_id, invoice_number, invoice_date, due_date,
          customer_number, recipient_name, project_title, data_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoice.id,
        session.userId,
        invoice.invoiceNumber,
        invoice.invoiceDate || '',
        invoice.dueDate || '',
        invoice.customerNumber || '',
        invoice.recipient?.name || '',
        invoice.projectTitle || '',
        dataJson,
        now,
        now
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('invoicer_session')?.value;
    const session = getSessionUser(token);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Ej auktoriserad' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID saknas' }, { status: 400 });
    }

    const db = getDatabase();
    db.prepare('DELETE FROM invoices WHERE id = ? AND user_id = ?').run(id, session.userId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
