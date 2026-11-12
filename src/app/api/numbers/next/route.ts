import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { getNextCustomerNumber, getNextInvoiceNumber } from '@/lib/numbering';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('invoicer_session')?.value;
  const session = getSessionUser(token);

  if (!session) {
    return NextResponse.json({ success: false, error: 'Ej auktoriserad' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'invoice';
  const customerNumber = searchParams.get('customerNumber');
  const excludeInvoiceId = searchParams.get('excludeInvoiceId');

  const db = getDatabase();

  if (type === 'customer') {
    return NextResponse.json({
      success: true,
      type: 'customer',
      number: getNextCustomerNumber(db, session.userId),
    });
  }

  return NextResponse.json({
    success: true,
    type: 'invoice',
    number: getNextInvoiceNumber(db, session.userId, customerNumber, excludeInvoiceId),
    customerNumber: customerNumber || null,
  });
}
