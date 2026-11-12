/**
 * Import customers + full invoices from extracted 2026 PDF folder data
 * into data/invoicer.db for user "karl".
 */
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';

const db = new DatabaseSync('data/invoicer.db');
const USER_ID = 'karl';
const now = new Date().toISOString();

const sender = {
  name: 'Karl Westergren',
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

const design = {
  theme: 'modern',
  primaryColor: '#dc2626',
  fontFamily: 'sans',
  showArticleNumber: false,
  showUnit: true,
  showVatColumn: false,
  compactMode: false,
};

function item(partial) {
  return {
    id: partial.id,
    type: 'item',
    articleNumber: '',
    description: partial.description,
    subDescription: partial.subDescription || '',
    quantity: partial.quantity,
    unit: partial.unit || 'st',
    unitPrice: partial.unitPrice,
    vatRate: partial.vatRate ?? 25,
    isRotRut: Boolean(partial.isRotRut),
  };
}

const customers = [
  {
    id: 'cust-andreas-60',
    name: 'Andreas Modig',
    company: '',
    address: 'Annefors 7951',
    zipAndCity: '821 92 Bollnäs',
    customerNumber: '60',
    email: 'fakturor7959@gmail.com',
    phone: '070-632 59 56',
    orgOrPersonNumber: '',
    propertyDesignation: 'Annefors 1:1',
    housingType: 'property',
  },
  {
    id: 'cust-jerry-61',
    name: 'Jerry van Kooten',
    company: '',
    address: 'Kolforsen 39',
    zipAndCity: '816 93 Ockelbo',
    customerNumber: '61',
    email: 'jerry@jvkooten.info',
    phone: '',
    orgOrPersonNumber: '19700526-1578',
    propertyDesignation: 'ÖSTBY 8:46',
    housingType: 'property',
  },
  {
    id: 'cust-tolino-24',
    name: 'Tolino trädgård AB',
    company: 'Tolino trädgård AB',
    address: 'Säbyvikskullen 1',
    zipAndCity: '179 96 Svartsjö',
    customerNumber: '24',
    email: '',
    phone: '070-239 55 90',
    orgOrPersonNumber: '',
    propertyDesignation: '',
  },
  {
    id: 'cust-nils-01',
    name: 'Nils Westergren',
    company: 'Annefors Snickeri & Bygg AB',
    address: 'Blomstervägen 3',
    zipAndCity: '821 40 Bollnäs',
    customerNumber: '1',
    email: 'Nils_westergren@hotmail.com',
    phone: '070-653 43 14',
    orgOrPersonNumber: '559055-5974',
    propertyDesignation: '',
  },
  {
    id: 'cust-ida-15',
    name: 'Ida Söderqvist & Svante',
    company: '',
    address: 'Lillebovägen 12',
    zipAndCity: '191 44 Sollentuna',
    customerNumber: '15',
    email: '',
    phone: '',
    orgOrPersonNumber: '',
    propertyDesignation: '',
  },
  {
    id: 'cust-johan-18',
    name: 'Johan Käck',
    company: '',
    address: 'Herte 8642',
    zipAndCity: '821 92 Bollnäs',
    customerNumber: '18',
    email: '',
    phone: '070-373 34 47',
    orgOrPersonNumber: '',
    propertyDesignation: '',
  },
  {
    id: 'cust-lars-52',
    name: 'Lars Persson',
    company: '',
    address: 'Villavägen 2',
    zipAndCity: '703 85 Glanshammar',
    customerNumber: '52',
    email: '',
    phone: '070-590 83 04',
    orgOrPersonNumber: '',
    propertyDesignation: '',
  },
  {
    // Invoice series 9008 — PDF accidentally reused kundnr 52; use 90 to avoid clash with Lars
    id: 'cust-erik-90',
    name: 'Erik Beijer',
    company: '',
    address: 'Brånanvägen 18',
    zipAndCity: '821 34 Bollnäs',
    customerNumber: '90',
    email: '',
    phone: '',
    orgOrPersonNumber: '',
    propertyDesignation: '',
  },
];

function makeInvoice(cfg) {
  const cust = customers.find((c) => c.customerNumber === cfg.customerNumber);
  return {
    id: `faktura-import-${cfg.invoiceNumber}`,
    title: 'FAKTURA',
    invoiceNumber: cfg.invoiceNumber,
    invoiceDate: cfg.invoiceDate,
    dueDate: cfg.dueDate,
    paymentTerms: cfg.paymentTerms || '14 dagar netto',
    latePaymentInterest: '8%',
    deliveryTerms: '',
    deliveryMethod: '',
    ourReference: 'Karl',
    yourReference: cfg.yourReference || cust.name.split(' ')[0],
    customerNumber: cfg.customerNumber,
    orderNumber: '',
    currency: 'SEK',
    projectTitle: cfg.projectTitle || '',
    projectDates: cfg.projectDates || '',
    enableRot: Boolean(cfg.enableRot),
    rotPercent: 30,
    enableReverseVat: Boolean(cfg.enableReverseVat),
    shipping: 0,
    adminFee: 0,
    discountType: 'amount',
    discountValue: 0,
    enableRounding: true,
    notes: 'Tack för uppdraget!',
    paymentNotice: '',
    sender,
    design,
    recipient: {
      name: cust.name,
      company: cust.company || '',
      address: cust.address || '',
      zipAndCity: cust.zipAndCity || '',
      customerNumber: cust.customerNumber,
      email: cust.email || '',
      phone: cust.phone || '',
      orgOrPersonNumber: cust.orgOrPersonNumber || '',
      propertyDesignation: cust.propertyDesignation || '',
      housingType: cust.housingType,
    },
    items: cfg.items,
  };
}

const invoices = [
  makeInvoice({
    invoiceNumber: '6001',
    customerNumber: '60',
    invoiceDate: '2026-10-30',
    dueDate: '2026-11-13',
    yourReference: 'Andreas',
    projectTitle: 'Fönsterrenovering Annefors 1:1',
    projectDates: 'Utförda 15/10 – 21/10 2026',
    enableRot: true,
    items: [
      item({
        id: '6001-1',
        description: 'Arbetstimmar Snickeri',
        subDescription: 'Arbete utfört mellan 15/10 till 21/10 2026. Fönsterrenovering Annefors 1:1.',
        quantity: 26,
        unit: 'tim',
        unitPrice: 550,
        isRotRut: true,
      }),
      item({
        id: '6001-2',
        description: 'Material: Beijer Bygg',
        subDescription: 'Inköpt material enligt 4 st fakturor (exkl. arbetshandskar & kniv).',
        quantity: 1,
        unit: 'st',
        unitPrice: 1446.88,
      }),
      item({
        id: '6001-3',
        description: 'Servicebil',
        subDescription: 'Framkörning & servicebil 3 tillfällen',
        quantity: 3,
        unit: 'st',
        unitPrice: 200,
      }),
    ],
  }),
  makeInvoice({
    invoiceNumber: '6002',
    customerNumber: '60',
    invoiceDate: '2026-11-12',
    dueDate: '2026-11-26',
    yourReference: 'Andreas',
    projectTitle: 'Fönsterrenovering del 2',
    projectDates: 'Utfört mellan 2026-10-26 till 2026-11-13',
    enableRot: true,
    items: [
      item({
        id: '6002-1',
        description: 'Snickararbete',
        quantity: 49,
        unit: 'tim',
        unitPrice: 550,
        isRotRut: true,
      }),
      item({
        id: '6002-2',
        description: 'Material: Beijer Bygg',
        subDescription: 'Foder, slippapper, färg, underbleck',
        quantity: 1,
        unit: 'st',
        unitPrice: 1000,
      }),
      item({
        id: '6002-3',
        description: 'Hägglunds Plåt',
        quantity: 1,
        unit: 'st',
        unitPrice: 2538,
      }),
      item({
        id: '6002-4',
        description: 'Servicebil',
        quantity: 2,
        unit: 'st',
        unitPrice: 250,
      }),
    ],
  }),
  makeInvoice({
    invoiceNumber: '6101',
    customerNumber: '61',
    invoiceDate: '2026-11-02',
    dueDate: '2026-11-16',
    yourReference: 'Jerry',
    projectTitle: 'Dörrbyte',
    projectDates: 'Utförda 2026-11-02 • ÖSTBY 8:46',
    enableRot: true,
    items: [
      item({
        id: '6101-1',
        description: 'Arbetstimmar Snickeri',
        subDescription: 'Karl Westergren — Dörrbyte, arbete utfört 2026-11-02',
        quantity: 5,
        unit: 'tim',
        unitPrice: 550,
        isRotRut: true,
      }),
      item({
        id: '6101-2',
        description: 'Snickartimmar',
        subDescription: 'Nils Westergren — Dörrbyte, arbete utfört 2026-11-02',
        quantity: 5,
        unit: 'tim',
        unitPrice: 550,
        isRotRut: true,
      }),
      item({
        id: '6101-3',
        description: 'Milersättning',
        subDescription: 'Reseersättning (13 mil)',
        quantity: 13,
        unit: 'mil',
        unitPrice: 40,
      }),
      item({
        id: '6101-4',
        description: 'Förbrukningsmaterial',
        subDescription: 'Förbrukningsmaterial dörrmontage',
        quantity: 1,
        unit: 'st',
        unitPrice: 50,
      }),
    ],
  }),
  makeInvoice({
    // Printed fakturanr in PDF is 2408 (filename says 2407)
    invoiceNumber: '2408',
    customerNumber: '24',
    invoiceDate: '2026-08-10',
    dueDate: '2026-08-25',
    paymentTerms: '15 dagar netto',
    yourReference: 'Tobias',
    projectTitle: 'Timmermanstjänster Augusti 2026',
    projectDates: 'Rastbord i timmer-utförande — Engelska Parken',
    items: [
      item({
        id: '2408-1',
        description: 'Rastbord i timmer-utförande',
        quantity: 2,
        unit: 'st',
        unitPrice: 15544,
      }),
      item({
        id: '2408-2',
        description: 'Servicebil',
        quantity: 1,
        unit: 'st',
        unitPrice: 1500,
      }),
    ],
  }),
  makeInvoice({
    invoiceNumber: '0119',
    customerNumber: '1',
    invoiceDate: '2026-07-01',
    dueDate: '2026-07-16',
    paymentTerms: '15 dagar netto',
    yourReference: 'Nils',
    projectTitle: 'Snickeritjänster Juni 2026',
    projectDates: 'Utförda 25 - 26/6 - 2026',
    enableReverseVat: true,
    items: [
      item({
        id: '0119-1',
        description: 'Timmar Juni',
        quantity: 12,
        unit: 'tim',
        unitPrice: 550,
        vatRate: 0,
      }),
    ],
  }),
  makeInvoice({
    invoiceNumber: '0120',
    customerNumber: '1',
    invoiceDate: '2026-10-12',
    dueDate: '2026-10-27',
    paymentTerms: '15 dagar netto',
    yourReference: 'Nils',
    projectTitle: 'Snickeritjänster Oktober 2026',
    projectDates: 'Oktober 2026',
    items: [
      item({ id: '0120-1', description: 'Timmar', quantity: 14, unit: 'tim', unitPrice: 500 }),
      item({ id: '0120-2', description: 'Beijer bygg', quantity: 1, unit: 'st', unitPrice: 1200 }),
      item({ id: '0120-3', description: 'Servicebil', quantity: 1, unit: 'st', unitPrice: 200 }),
    ],
  }),
  makeInvoice({
    invoiceNumber: '1506',
    customerNumber: '15',
    invoiceDate: '2025-06-29',
    dueDate: '2025-07-14',
    paymentTerms: '15 dagar',
    yourReference: 'Svante',
    projectTitle: 'Vindduk och knutlådor - timmerstommen',
    projectDates: 'Utförda 15/6 & 17/6 - 2026',
    items: [
      item({
        id: '1506-1',
        description: 'Vindduk och knutlådor - timmerstommen',
        quantity: 14,
        unit: 'tim',
        unitPrice: 550,
      }),
      item({ id: '1506-2', description: 'Servicebil', quantity: 1, unit: 'st', unitPrice: 200 }),
    ],
  }),
  makeInvoice({
    invoiceNumber: '1507',
    customerNumber: '15',
    invoiceDate: '2025-09-14',
    dueDate: '2025-09-29',
    paymentTerms: '15 dagar',
    yourReference: 'Svante',
    projectTitle: 'Snickartjänster September 2026',
    projectDates: 'September 2026',
    items: [
      item({
        id: '1507-1',
        description: 'Halvsulningar, fönstermontage mm.',
        quantity: 31,
        unit: 'tim',
        unitPrice: 550,
      }),
      item({ id: '1507-2', description: 'Servicebil', quantity: 2, unit: 'st', unitPrice: 200 }),
    ],
  }),
  makeInvoice({
    invoiceNumber: '1806',
    customerNumber: '18',
    invoiceDate: '2026-06-02',
    dueDate: '2026-07-02',
    paymentTerms: '30 dagar netto',
    yourReference: 'Johan',
    projectTitle: 'Byta Offerbräda i Henninge hos Kerstin',
    projectDates: 'Utförda 1 & 2 /6 - 2026',
    enableReverseVat: true,
    items: [
      item({
        id: '1806-1',
        description: 'Byta Offerbräda i Henninge hos Kerstin',
        quantity: 18,
        unit: 'tim',
        unitPrice: 500,
        vatRate: 0,
      }),
      item({
        id: '1806-2',
        description: 'Framkörningsavgift',
        quantity: 2,
        unit: 'st',
        unitPrice: 240,
        vatRate: 0,
      }),
    ],
  }),
  makeInvoice({
    invoiceNumber: '5201',
    customerNumber: '52',
    invoiceDate: '2026-05-21',
    dueDate: '2026-06-04',
    yourReference: 'Lars',
    projectTitle: 'Taklagning på ladan',
    projectDates: 'Utförda 6/3 : 2026',
    items: [
      item({
        id: '5201-1',
        description: 'Snickeritjänster',
        subDescription: 'Taklagning på ladan',
        quantity: 16,
        unit: 'tim',
        unitPrice: 550,
      }),
      item({
        id: '5201-2',
        description: 'Material: Beijer - Farmarskruv',
        quantity: 1,
        unit: 'pkt',
        unitPrice: 475,
      }),
      item({
        id: '5201-3',
        description: 'Cramo - Hyra av skylift',
        quantity: 1,
        unit: 'st',
        unitPrice: 1960,
      }),
      item({
        id: '5201-4',
        description: 'Framkörningsavgift',
        quantity: 1,
        unit: 'st',
        unitPrice: 300,
      }),
      item({
        id: '5201-5',
        description: 'Avdrag tidigare betalning',
        subDescription: '11 118,75 kr (inkl moms)',
        quantity: 1,
        unit: 'st',
        unitPrice: -8895,
      }),
    ],
  }),
  makeInvoice({
    invoiceNumber: '9008',
    customerNumber: '90',
    invoiceDate: '2026-05-31',
    dueDate: '2026-06-15',
    yourReference: 'Erik',
    projectTitle: 'Kakling och silikon i badrum',
    projectDates: 'Utförda 27/5 - 2026',
    enableRot: true,
    items: [
      item({
        id: '9008-1',
        description: 'Kakling och silikon i badrum',
        quantity: 11,
        unit: 'tim',
        unitPrice: 550,
        isRotRut: true,
      }),
      item({
        id: '9008-2',
        description: 'Framkörningsavgift',
        quantity: 1,
        unit: 'st',
        unitPrice: 240,
      }),
    ],
  }),
];

function calcTotalToPay(inv) {
  const labor = inv.items
    .filter((i) => i.isRotRut)
    .reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const subtotal = inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  if (inv.enableReverseVat) return Math.round(subtotal * 100) / 100;
  const rotExcl = inv.enableRot ? labor * (inv.rotPercent / 100) : 0;
  const taxable = Math.max(0, subtotal - rotExcl);
  const vat = taxable * 0.25;
  const totalBeforeRot = subtotal + (subtotal - labor > -1 ? (subtotal - labor) * 0 : 0);
  // Match app logic approximately: (subtotal - rotExcl) * 1.25
  // Actually app: rot on labor incl vat display; totalToPay = (subtotal - rotExcl) * 1.25 for normal
  // Simpler: use same as preview — taxable * 1.25 when no reverse vat
  return Math.round(taxable * 1.25 * 100) / 100;
}

// Upsert customers
const insertCust = db.prepare(`
  INSERT INTO customers (
    id, user_id, name, company, address, zip_and_city, customer_number,
    email, phone, org_or_person_number, property_designation, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    company = excluded.company,
    address = excluded.address,
    zip_and_city = excluded.zip_and_city,
    customer_number = excluded.customer_number,
    email = excluded.email,
    phone = excluded.phone,
    org_or_person_number = excluded.org_or_person_number,
    property_designation = excluded.property_designation,
    updated_at = excluded.updated_at
`);

for (const c of customers) {
  insertCust.run(
    c.id,
    USER_ID,
    c.name,
    c.company || '',
    c.address || '',
    c.zipAndCity || '',
    c.customerNumber,
    c.email || '',
    c.phone || '',
    c.orgOrPersonNumber || '',
    c.propertyDesignation || null,
    now,
    now
  );
  console.log('Customer', c.customerNumber, c.name);
}

const insertInv = db.prepare(`
  INSERT INTO invoices (
    id, user_id, invoice_number, invoice_date, due_date,
    customer_number, recipient_name, project_title, total_to_pay, data_json, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    invoice_number = excluded.invoice_number,
    invoice_date = excluded.invoice_date,
    due_date = excluded.due_date,
    customer_number = excluded.customer_number,
    recipient_name = excluded.recipient_name,
    project_title = excluded.project_title,
    total_to_pay = excluded.total_to_pay,
    data_json = excluded.data_json,
    updated_at = excluded.updated_at
`);

// Also replace by invoice_number if a different id already holds that number
const findByNumber = db.prepare(
  'SELECT id FROM invoices WHERE user_id = ? AND invoice_number = ?'
);
const deleteById = db.prepare('DELETE FROM invoices WHERE id = ?');

for (const inv of invoices) {
  const existing = findByNumber.get(USER_ID, inv.invoiceNumber);
  if (existing && existing.id !== inv.id) {
    deleteById.run(existing.id);
  }
  const total = calcTotalToPay(inv);
  insertInv.run(
    inv.id,
    USER_ID,
    inv.invoiceNumber,
    inv.invoiceDate,
    inv.dueDate,
    inv.customerNumber,
    inv.recipient.name,
    inv.projectTitle,
    total,
    JSON.stringify(inv),
    now,
    now
  );
  console.log('Invoice', inv.invoiceNumber, inv.recipient.name, inv.projectTitle, '≈', total, 'kr');
}

console.log('\nDone.');
console.log(
  'Customers:',
  db.prepare('SELECT COUNT(*) as c FROM customers WHERE user_id = ?').get(USER_ID).c
);
console.log(
  'Invoices:',
  db.prepare('SELECT invoice_number, recipient_name, project_title FROM invoices WHERE user_id = ? ORDER BY invoice_number').all(USER_ID)
);
