import crypto from 'crypto';
import { getDatabase, hashPin } from './db';
import { SenderInfo } from '@/types/invoice';

export interface UserSession {
  userId: string;
  name: string;
  email?: string;
  personNumber?: string;
  senderProfile: SenderInfo;
}

export function getSessionUser(token?: string | null): UserSession | null {
  if (!token) return null;
  const db = getDatabase();

  const now = new Date().toISOString();
  // Clean expired sessions
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);

  const session = db
    .prepare(
      `
    SELECT s.user_id, u.name, u.email, u.person_number
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `
    )
    .get(token, now) as any;

  if (!session) return null;

  // Fetch user sender/company profile
  const profile = db
    .prepare('SELECT * FROM user_profiles WHERE user_id = ?')
    .get(session.user_id) as any;

  const senderProfile: SenderInfo = profile
    ? {
        name: profile.name || session.name,
        company: profile.company || "KW's BYGG",
        address: profile.address || '',
        zipAndCity: profile.zip_and_city || '',
        phone: profile.phone || '',
        email: profile.email || '',
        website: profile.website || '',
        orgNumber: profile.org_number || '',
        vatNumber: profile.vat_number || '',
        bankgiro: profile.bankgiro || '',
        plusgiro: profile.plusgiro || '',
        bankAccount: profile.bank_account || '',
        iban: profile.iban || '',
        swiftBic: profile.swift_bic || '',
        taxStatus: profile.tax_status || 'Godkänd för F-skatt',
        logoUrl: profile.logo_url || '/kws-bygg-logo.png',
        logoWidth: profile.logo_width || 160,
      }
    : {
        name: session.name,
        company: "KW's BYGG",
        address: 'Moravägen 6',
        zipAndCity: '821 41 Bollnäs',
        phone: '073-026 32 94',
        email: 'Karlvestergren@gmail.com',
        website: '',
        orgNumber: '841109-7515',
        vatNumber: 'SE841109751501',
        bankgiro: '5227-5153',
        plusgiro: '',
        bankAccount: '',
        iban: '',
        swiftBic: '',
        taxStatus: 'Godkänd för F-skatt',
        logoUrl: '/kws-bygg-logo.png',
        logoWidth: 160,
      };

  return {
    userId: session.user_id,
    name: session.name,
    email: session.email || undefined,
    personNumber: session.person_number || undefined,
    senderProfile,
  };
}

export function listPublicUsers(): { id: string; name: string; company: string; logoUrl: string }[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `
    SELECT u.id, u.name, p.company, p.logo_url
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    ORDER BY u.created_at ASC
  `
    )
    .all() as any[];

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    company: r.company || "KW's BYGG",
    logoUrl: r.logo_url || '/kws-bygg-logo.png',
  }));
}

export function createSession(userId: string): { token: string; expiresAt: Date } {
  const db = getDatabase();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days session
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO sessions (token, user_id, created_at, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(token, userId, now, expiresAt.toISOString());

  return { token, expiresAt };
}

export function deleteSession(token: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function verifyPin(userId: string, pin: string): boolean {
  const db = getDatabase();
  const user = db.prepare('SELECT pin_hash FROM users WHERE id = ?').get(userId) as any;
  if (!user) return false;
  return user.pin_hash === hashPin(pin);
}

export function changePin(userId: string, newPin: string): void {
  const db = getDatabase();
  const newHash = hashPin(newPin);
  const now = new Date().toISOString();
  db.prepare('UPDATE users SET pin_hash = ?, updated_at = ? WHERE id = ?').run(newHash, now, userId);
}

export function createNewUser(
  id: string,
  name: string,
  pin: string,
  companyName: string = '',
  personNumber: string = ''
): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  const pinH = hashPin(pin);

  db.prepare(`
    INSERT INTO users (id, name, email, pin_hash, person_number, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, '', pinH, personNumber, now, now);

  db.prepare(`
    INSERT INTO user_profiles (
      user_id, name, company, address, zip_and_city, phone, email, website,
      org_number, vat_number, bankgiro, plusgiro, bank_account, iban, swift_bic,
      tax_status, logo_url, logo_width, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    name,
    companyName || name,
    '',
    '',
    '',
    '',
    '',
    personNumber,
    '',
    '',
    '',
    '',
    '',
    '',
    'Godkänd för F-skatt',
    '',
    160,
    now
  );
}
