import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { SenderInfo } from '@/types/invoice';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('invoicer_session')?.value;
    const session = getSessionUser(token);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Ej auktoriserad' }, { status: 401 });
    }

    const sender: SenderInfo = await req.json();
    const db = getDatabase();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO user_profiles (
        user_id, name, company, address, zip_and_city, phone, email, website,
        org_number, vat_number, bankgiro, plusgiro, bank_account, iban, swift_bic,
        tax_status, logo_url, logo_width, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        name = excluded.name,
        company = excluded.company,
        address = excluded.address,
        zip_and_city = excluded.zip_and_city,
        phone = excluded.phone,
        email = excluded.email,
        website = excluded.website,
        org_number = excluded.org_number,
        vat_number = excluded.vat_number,
        bankgiro = excluded.bankgiro,
        plusgiro = excluded.plusgiro,
        bank_account = excluded.bank_account,
        iban = excluded.iban,
        swift_bic = excluded.swift_bic,
        tax_status = excluded.tax_status,
        logo_url = excluded.logo_url,
        logo_width = excluded.logo_width,
        updated_at = excluded.updated_at
    `).run(
      session.userId,
      sender.name || '',
      sender.company || '',
      sender.address || '',
      sender.zipAndCity || '',
      sender.phone || '',
      sender.email || '',
      sender.website || '',
      sender.orgNumber || '',
      sender.vatNumber || '',
      sender.bankgiro || '',
      sender.plusgiro || '',
      sender.bankAccount || '',
      sender.iban || '',
      sender.swiftBic || '',
      sender.taxStatus || 'Godkänd för F-skatt',
      sender.logoUrl || '/kws-bygg-logo.png',
      sender.logoWidth || 160,
      now
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
