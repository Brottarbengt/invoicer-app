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

export const DEFAULT_SAMPLE_CUSTOMERS: SavedCustomer[] = [
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
  },
  {
    id: 'cust-andreas-60',
    name: 'Andreas Modig',
    company: '',
    address: 'Moravägen 6',
    zipAndCity: '821 41 Bollnäs',
    customerNumber: '60',
    email: 'fakturor7959@gmail.com',
    phone: '070-632 59 56',
    orgOrPersonNumber: '',
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
  },
  {
    id: 'cust-erik-52',
    name: 'Erik Beijer',
    company: '',
    address: 'Brånanvägen 18',
    zipAndCity: '821 34 Bollnäs',
    customerNumber: '52',
    email: '',
    phone: '',
    orgOrPersonNumber: '',
  },
  {
    id: 'cust-lars-53',
    name: 'Lars Persson',
    company: '',
    address: 'Villavägen 2',
    zipAndCity: '703 85 Glanshammar',
    customerNumber: '53',
    email: '',
    phone: '070-590 83 04',
    orgOrPersonNumber: '',
  },
  {
    id: 'cust-johan-18',
    name: 'Johan Köck',
    company: '',
    address: 'Herte 8642',
    zipAndCity: '821 92 Bollnäs',
    customerNumber: '18',
    email: '',
    phone: '070-373 34 47',
    orgOrPersonNumber: '',
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
    orgOrPersonNumber: '556987-1234',
  },
  {
    id: 'cust-madde-34',
    name: 'Madeleine Helin',
    company: '',
    address: 'Lingonvägen 20',
    zipAndCity: '821 35 Bollnäs',
    customerNumber: '34',
    email: '',
    phone: '070-679 02 18',
    orgOrPersonNumber: '',
  },
  {
    id: 'cust-kenneth-26',
    name: 'Kenneth Andersson',
    company: '',
    address: 'Norrbågen 41B',
    zipAndCity: '806 34 Gävle',
    customerNumber: '26',
    email: '',
    phone: '076-803 38 24',
    orgOrPersonNumber: '',
  },
];

export function createEmptyInvoice(invoiceNumber: string = '0121'): InvoiceData {
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
    ourReference: 'Karl',
    yourReference: '',
    customerNumber: '',
    orderNumber: '',
    currency: 'SEK',
    projectTitle: '',
    projectDates: `Utförda ${today}`,
    sender: {
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

export const DEFAULT_SAMPLE_INVOICE: InvoiceData = createEmptyInvoice('0121');
