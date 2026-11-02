import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import { DEFAULT_SAMPLE_CUSTOMERS, SenderInfo, SavedCustomer, InvoiceData } from '@/types/invoice';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'invoicer.db');

// Singleton database instance
let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    initSchema(dbInstance);
    seedInitialData(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      pin_hash TEXT NOT NULL,
      person_number TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // User Profiles (company / sender info)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY,
      name TEXT,
      company TEXT,
      address TEXT,
      zip_and_city TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      org_number TEXT,
      vat_number TEXT,
      bankgiro TEXT,
      plusgiro TEXT,
      bank_account TEXT,
      iban TEXT,
      swift_bic TEXT,
      tax_status TEXT,
      logo_url TEXT,
      logo_width INTEGER,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Customers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      company TEXT,
      address TEXT,
      zip_and_city TEXT,
      customer_number TEXT,
      email TEXT,
      phone TEXT,
      org_or_person_number TEXT,
      property_designation TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Invoices table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      invoice_number TEXT NOT NULL,
      invoice_date TEXT,
      due_date TEXT,
      customer_number TEXT,
      recipient_name TEXT,
      project_title TEXT,
      total_to_pay REAL,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

export function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(`kw_invoicer_salt_${pin}`).digest('hex');
}

function seedInitialData(db: DatabaseSync) {
  // Check if Karl user exists
  const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get('karl');
  if (!existingUser) {
    const now = new Date().toISOString();
    // Default PIN: 1234
    const defaultPinHash = hashPin('1234');

    db.prepare(`
      INSERT INTO users (id, name, email, pin_hash, person_number, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'karl',
      'Karl Westergren',
      'Karlvestergren@gmail.com',
      defaultPinHash,
      '19841109-7515', // BankID ready
      now,
      now
    );

    // Initial sender profile for Karl
    db.prepare(`
      INSERT INTO user_profiles (
        user_id, name, company, address, zip_and_city, phone, email, website,
        org_number, vat_number, bankgiro, plusgiro, bank_account, iban, swift_bic,
        tax_status, logo_url, logo_width, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'karl',
      'Karl Westergren',
      "KW's BYGG",
      'Moravägen 6',
      '821 41 Bollnäs',
      '073-026 32 94',
      'Karlvestergren@gmail.com',
      '',
      '841109-7515',
      'SE841109751501',
      '5227-5153',
      '',
      '',
      '',
      '',
      'Godkänd för F-skatt',
      '/kws-bygg-logo.png',
      160,
      now
    );

    // Seed default sample customers for Karl
    const insertCust = db.prepare(`
      INSERT INTO customers (
        id, user_id, name, company, address, zip_and_city, customer_number,
        email, phone, org_or_person_number, property_designation, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const c of DEFAULT_SAMPLE_CUSTOMERS) {
      insertCust.run(
        c.id,
        'karl',
        c.name,
        c.company || '',
        c.address || '',
        c.zipAndCity || '',
        c.customerNumber || '',
        c.email || '',
        c.phone || '',
        c.orgOrPersonNumber || '',
        c.propertyDesignation || '',
        now,
        now
      );
    }
  }
}
