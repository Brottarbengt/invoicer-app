import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { SavedCustomer } from '@/types/invoice';

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
    SELECT id, name, company, address, zip_and_city as zipAndCity,
           customer_number as customerNumber, email, phone,
           org_or_person_number as orgOrPersonNumber,
           property_designation as propertyDesignation,
           created_at as createdAt
    FROM customers
    WHERE user_id = ?
    ORDER BY created_at DESC
  `
    )
    .all(session.userId) as SavedCustomer[];

  return NextResponse.json({ success: true, customers: rows });
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('invoicer_session')?.value;
    const session = getSessionUser(token);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Ej auktoriserad' }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      name,
      company = '',
      address = '',
      zipAndCity = '',
      customerNumber = '',
      email = '',
      phone = '',
      orgOrPersonNumber = '',
      propertyDesignation = '',
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Kundnamn krävs' }, { status: 400 });
    }

    const db = getDatabase();
    const now = new Date().toISOString();
    const customerId = id && id.startsWith('cust-') ? id : `cust-${Date.now()}`;

    // Check if customer exists by id
    const existing = db
      .prepare('SELECT id FROM customers WHERE id = ? AND user_id = ?')
      .get(customerId, session.userId);

    if (existing) {
      db.prepare(`
        UPDATE customers SET
          name = ?,
          company = ?,
          address = ?,
          zip_and_city = ?,
          customer_number = ?,
          email = ?,
          phone = ?,
          org_or_person_number = ?,
          property_designation = ?,
          updated_at = ?
        WHERE id = ? AND user_id = ?
      `).run(
        name.trim(),
        company.trim(),
        address.trim(),
        zipAndCity.trim(),
        customerNumber.trim(),
        email.trim(),
        phone.trim(),
        orgOrPersonNumber.trim(),
        propertyDesignation ? propertyDesignation.trim() : null,
        now,
        customerId,
        session.userId
      );
    } else {
      db.prepare(`
        INSERT INTO customers (
          id, user_id, name, company, address, zip_and_city, customer_number,
          email, phone, org_or_person_number, property_designation, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        customerId,
        session.userId,
        name.trim(),
        company.trim(),
        address.trim(),
        zipAndCity.trim(),
        customerNumber.trim(),
        email.trim(),
        phone.trim(),
        orgOrPersonNumber.trim(),
        propertyDesignation ? propertyDesignation.trim() : null,
        now,
        now
      );
    }

    // Return updated list
    const updatedList = db
      .prepare(
        `
      SELECT id, name, company, address, zip_and_city as zipAndCity,
             customer_number as customerNumber, email, phone,
             org_or_person_number as orgOrPersonNumber,
             property_designation as propertyDesignation,
             created_at as createdAt
      FROM customers
      WHERE user_id = ?
      ORDER BY created_at DESC
    `
      )
      .all(session.userId) as SavedCustomer[];

    return NextResponse.json({ success: true, customers: updatedList });
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
    db.prepare('DELETE FROM customers WHERE id = ? AND user_id = ?').run(id, session.userId);

    const updatedList = db
      .prepare(
        `
      SELECT id, name, company, address, zip_and_city as zipAndCity,
             customer_number as customerNumber, email, phone,
             org_or_person_number as orgOrPersonNumber,
             property_designation as propertyDesignation,
             created_at as createdAt
      FROM customers
      WHERE user_id = ?
      ORDER BY created_at DESC
    `
      )
      .all(session.userId) as SavedCustomer[];

    return NextResponse.json({ success: true, customers: updatedList });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
