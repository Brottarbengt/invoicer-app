export type ItemType = 'item' | 'header' | 'text';

export interface InvoiceItem {
  id: string;
  type: ItemType;
  articleNumber?: string;
  description: string;
  subDescription?: string;
  quantity: number | null;
  unit: string;
  unitPrice: number | null;
  totalPrice?: number | null;
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
  bankAccount: string;
  iban: string;
  swiftBic: string;
  taxStatus: string;
  logoUrl: string;
  logoWidth: number;
}

export type RotWorkCategory =
  | 'Bygg'
  | 'El'
  | 'GlasPlatarbete'
  | 'MarkDraneringarbete'
  | 'Murning'
  | 'MalningTapetsering'
  | 'Vvs';

export const ROT_WORK_CATEGORY_LABELS: Record<RotWorkCategory, string> = {
  Bygg: 'Bygg (snickeri, reparation, ombyggnad)',
  El: 'El (elinstallation, reparation)',
  GlasPlatarbete: 'Glas & Plåtarbete',
  MarkDraneringarbete: 'Mark & Dräneringsarbete',
  Murning: 'Murning & Putsning',
  MalningTapetsering: 'Målning & Tapetsering',
  Vvs: 'VVS (rörarbete, värme, sanitet)',
};

export interface RecipientInfo {
  name: string;
  company: string;
  address: string;
  zipAndCity: string;
  customerNumber: string;
  email: string;
  phone: string;
  orgOrPersonNumber: string;
  housingType?: 'property' | 'coop'; // 'property' för Småhus, 'coop' för Bostadsrätt
  propertyDesignation?: string; // t.ex. "ÖSTBY 8:46" (Småhus)
  apartmentNumber?: string; // t.ex. "1201" (Bostadsrätt)
  brfOrgNumber?: string; // 10 eller 12 siffror (Bostadsrätt)
}

export interface SavedCustomer extends RecipientInfo {
  id: string;
  createdAt?: string;
  notes?: string;
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
  title: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  paymentTerms: string;
  latePaymentInterest: string;
  deliveryTerms: string;
  deliveryMethod: string;
  ourReference: string;
  yourReference: string;
  customerNumber: string;
  orderNumber: string;
  currency: string;
  
  projectTitle?: string; // t.ex. "Dörrbyte"
  projectDates?: string; // t.ex. "Utförda 2026-11-02 • ÖSTBY 8:46"
  rotWorkCategory?: RotWorkCategory; // Standard: 'Bygg'
  paymentDate?: string; // Format YYYY-MM-DD för ROT-ansökan
  
  sender: SenderInfo;
  recipient: RecipientInfo;
  
  items: InvoiceItem[];
  
  shipping: number;
  adminFee: number;
  discountType: 'amount' | 'percent';
  discountValue: number;
  
  enableRounding: boolean;
  enableRot: boolean;
  rotPercent: number; // standard 30%
  enableReverseVat: boolean;
  
  notes: string;
  paymentNotice: string;
  
  design: InvoiceDesign;
}

export function createEmptyInvoice(invoiceNumber: string = ''): InvoiceData {
  const today = new Date().toISOString().split('T')[0];
  const d = new Date();
  d.setDate(d.getDate() + 14);
  const dueDate = d.toISOString().split('T')[0];

  return {
    id: `faktura-ny-${Date.now()}`,
    title: 'FAKTURA',
    invoiceNumber,
    invoiceDate: today,
    dueDate,
    paymentTerms: '14 dagar netto',
    latePaymentInterest: '8%',
    deliveryTerms: '',
    deliveryMethod: '',
    ourReference: '',
    yourReference: '',
    customerNumber: '',
    orderNumber: '',
    currency: 'SEK',
    projectTitle: '',
    projectDates: `Utförda ${today}`,
    sender: {
      name: '',
      company: '',
      address: '',
      zipAndCity: '',
      phone: '',
      email: '',
      website: '',
      orgNumber: '',
      vatNumber: '',
      bankgiro: '',
      plusgiro: '',
      bankAccount: '',
      iban: '',
      swiftBic: '',
      taxStatus: 'Godkänd för F-skatt',
      logoUrl: '',
      logoWidth: 160,
    },
    recipient: {
      name: '',
      company: '',
      address: '',
      zipAndCity: '',
      customerNumber: '',
      email: '',
      phone: '',
      orgOrPersonNumber: '',
    },
    items: [],
    shipping: 0,
    adminFee: 0,
    discountType: 'amount',
    discountValue: 0,
    enableRounding: true,
    enableRot: false,
    rotPercent: 30,
    enableReverseVat: false,
    notes: 'Tack för uppdraget!',
    paymentNotice: '',
    design: {
      theme: 'modern',
      primaryColor: '#dc2626',
      fontFamily: 'sans',
      showArticleNumber: false,
      showUnit: true,
      showVatColumn: false,
      compactMode: false,
    },
  };
}

/** Blank draft used only as React initial state before auth loads next number. */
export const EMPTY_INVOICE: InvoiceData = createEmptyInvoice('');
