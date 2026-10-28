export type ItemType = 'item' | 'header' | 'text';

export interface InvoiceItem {
  id: string;
  type: ItemType;
  articleNumber?: string;
  description: string;
  quantity: number | null;
  unit: string;
  unitPrice: number | null;
  vatRate: number; // 25, 12, 6, 0
  isRotRut?: boolean;
}

export interface SenderInfo {
  name: string;
  company: string;
  address: string;
  zipAndCity: string;
  phone: string;
  email: string;
  website: string;
  orgNumber: string;
  vatNumber: string;
  bankgiro: string;
  plusgiro: string;
  bankAccount: string; // t.ex. "Handelsbanken, Clearing 6123, Konto 123 456 789"
  iban: string;
  swiftBic: string;
  taxStatus: string; // t.ex. "Godkänd för F-skatt"
  logoUrl: string;
  logoWidth: number;
}

export interface RecipientInfo {
  name: string;
  company: string;
  address: string;
  zipAndCity: string;
  customerNumber: string;
  email: string;
  phone: string;
  orgOrPersonNumber: string;
}

export interface SavedCustomer extends RecipientInfo {
  id: string;
  createdAt?: string;
}

export type ThemeType = 'modern' | 'clean' | 'classic' | 'minimal' | 'executive';

export interface InvoiceDesign {
  theme: ThemeType;
  primaryColor: string; // hex
  fontFamily: 'sans' | 'serif' | 'mono';
  showArticleNumber: boolean;
  showUnit: boolean;
  showVatColumn: boolean;
  compactMode: boolean;
}

export interface InvoiceData {
  id: string;
  title: string; // t.ex. "FAKTURA", "KREDITFAKTURA", "OFFERT"
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  paymentTerms: string; // t.ex. "15 dagar netto"
  latePaymentInterest: string; // t.ex. "8%"
  deliveryTerms: string;
  deliveryMethod: string;
  ourReference: string;
  yourReference: string;
  customerNumber: string;
  orderNumber: string;
  currency: string;
  
  sender: SenderInfo;
  recipient: RecipientInfo;
  
  items: InvoiceItem[];
  
  shipping: number;
  adminFee: number;
  discountType: 'amount' | 'percent';
  discountValue: number;
  
  enableRounding: boolean; // Öresutjämning
  enableRot: boolean;
  rotPercent: number; // standard 30%
  enableReverseVat: boolean; // Omvänd byggmoms
  
  notes: string;
  paymentNotice: string;
  
  design: InvoiceDesign;
}

export const DEFAULT_SAMPLE_CUSTOMERS: SavedCustomer[] = [
  {
    id: 'cust-nils-01',
    name: 'Nils Westergren',
    company: '',
    address: 'Blomstervägen 3',
    zipAndCity: '821 40 Bollnäs',
    customerNumber: '1',
    email: '',
    phone: '',
    orgOrPersonNumber: '',
  },
];

export const DEFAULT_SAMPLE_INVOICE: InvoiceData = {
  id: 'faktura-0120',
  title: 'FAKTURA',
  invoiceNumber: '0120',
  invoiceDate: '2026-10-12',
  dueDate: '2026-10-27',
  paymentTerms: '15 dagar netto',
  latePaymentInterest: '8%',
  deliveryTerms: '',
  deliveryMethod: '',
  ourReference: 'Karl',
  yourReference: 'Nils',
  customerNumber: '1',
  orderNumber: '',
  currency: 'SEK',
  
  sender: {
    name: 'Karl Westergren',
    company: "KW's BYGG",
    address: 'Moravägen 6',
    zipAndCity: '821 41 Bollnäs',
    phone: '0730-26 32 94',
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
  },
  
  recipient: {
    name: 'Nils Westergren',
    company: '',
    address: 'Blomstervägen 3',
    zipAndCity: '821 40 Bollnäs',
    customerNumber: '1',
    email: '',
    phone: '',
    orgOrPersonNumber: '',
  },
  
  items: [
    {
      id: 'row-1',
      type: 'header',
      articleNumber: '',
      description: 'Snickeritjänster Oktober - 2026',
      quantity: null,
      unit: '',
      unitPrice: null,
      vatRate: 25,
      isRotRut: false,
    },
    {
      id: 'row-2',
      type: 'item',
      articleNumber: '',
      description: 'Timmar',
      quantity: 14,
      unit: 'h',
      unitPrice: 500,
      vatRate: 25,
      isRotRut: true,
    },
    {
      id: 'row-3',
      type: 'item',
      articleNumber: '',
      description: 'Beijer bygg (Material)',
      quantity: 1,
      unit: 'st',
      unitPrice: 1200,
      vatRate: 25,
      isRotRut: false,
    },
    {
      id: 'row-4',
      type: 'item',
      articleNumber: '',
      description: 'Servicebil',
      quantity: 1,
      unit: 'st',
      unitPrice: 200,
      vatRate: 25,
      isRotRut: false,
    },
  ],
  
  shipping: 0,
  adminFee: 0,
  discountType: 'amount',
  discountValue: 0,
  
  enableRounding: true,
  enableRot: false,
  rotPercent: 30,
  enableReverseVat: false,
  
  notes: 'Tack för uppdraget!',
  paymentNotice: 'Var vänlig ange fakturanummer 0120 som referens vid betalning.',
  
  design: {
    theme: 'modern',
    primaryColor: '#dc2626', // KW's Bygg röd accent
    fontFamily: 'sans',
    showArticleNumber: false,
    showUnit: true,
    showVatColumn: false,
    compactMode: false,
  },
};
