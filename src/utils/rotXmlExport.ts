import { InvoiceData } from '@/types/invoice';
import { calculateInvoice } from './calculations';
import {
  validatePersonnummer,
  validatePaymentDate,
  validatePropertyDesignation,
  validateApartmentNumber,
  validateBrfOrgNumber,
} from './rotValidation';

export interface RotArendeData {
  invoice: InvoiceData;
  buyerPersonNumber: string; // 12 siffror
  paymentDate: string; // YYYY-MM-DD
  housingType: 'property' | 'coop';
  propertyDesignation?: string;
  apartmentNumber?: string;
  brfOrgNumber?: string;
  workCategory: 'Bygg' | 'El' | 'GlasPlatarbete' | 'MarkDraneringarbete' | 'Murning' | 'MalningTapetsering' | 'Vvs';
  laborHours: number; // Heltal > 0
  laborCostIncVat: number; // Pris för arbete inkl moms
  requestedRotAmount: number; // Begärt belopp
  buyerPaidAmount: number; // Betalt belopp
  materialCostIncVat: number; // Materialkostnad
  otherCostIncVat: number; // Övrig kostnad (servicebil, milersättning etc)
  invoiceNumber: string;
}

export interface RotValidationIssue {
  invoiceNumber: string;
  customerName: string;
  field: string;
  message: string;
}

export interface RotBatchResult {
  year: number;
  batchIndex: number;
  filename: string;
  xml: string;
  arendenCount: number;
  totalRequestedAmount: number;
}

/**
 * Hjälpfunktion för att säkert XML-escapa textsträngar
 */
export function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Extraherar och beräknar ROT-ärendeuppgifter för en faktura
 */
export function extractRotArendeData(
  invoice: InvoiceData,
  overridePaymentDate?: string
): { arende?: RotArendeData; issues: RotValidationIssue[] } {
  const issues: RotValidationIssue[] = [];
  const invoiceNumber = invoice.invoiceNumber || 'Utkast';
  const customerName = invoice.recipient?.name || 'Okänd kund';

  if (!invoice.enableRot) {
    issues.push({
      invoiceNumber,
      customerName,
      field: 'enableRot',
      message: 'Fakturan har inte ROT-avdrag aktiverat.',
    });
    return { issues };
  }

  const calc = calculateInvoice(invoice);
  if (calc.rotDeduction <= 0 || calc.rotLaborBase <= 0) {
    issues.push({
      invoiceNumber,
      customerName,
      field: 'rotDeduction',
      message: 'Fakturan saknar ROT-berättigat arbete eller rotavdraget är 0 kr.',
    });
    return { issues };
  }

  // Betalningsdatum
  const paymentDate = overridePaymentDate || invoice.paymentDate || new Date().toISOString().split('T')[0];
  const dateVal = validatePaymentDate(paymentDate);
  if (!dateVal.valid) {
    issues.push({
      invoiceNumber,
      customerName,
      field: 'paymentDate',
      message: dateVal.error || 'Ogiltigt betalningsdatum.',
    });
  }

  const paymentYear = parseInt(paymentDate.split('-')[0], 10);

  // Personnummer
  const rawPnr = invoice.recipient?.orgOrPersonNumber || '';
  const pnrVal = validatePersonnummer(rawPnr, paymentYear);
  if (!pnrVal.valid || !pnrVal.pnr12) {
    issues.push({
      invoiceNumber,
      customerName,
      field: 'orgOrPersonNumber',
      message: pnrVal.error || 'Giltigt personnummer för köparen saknas.',
    });
  }

  // Bostadstyp
  const housingType: 'property' | 'coop' =
    invoice.recipient?.housingType ||
    (invoice.recipient?.apartmentNumber || invoice.recipient?.brfOrgNumber ? 'coop' : 'property');

  if (housingType === 'coop') {
    const aptVal = validateApartmentNumber(invoice.recipient?.apartmentNumber || '');
    if (!aptVal.valid) {
      issues.push({
        invoiceNumber,
        customerName,
        field: 'apartmentNumber',
        message: aptVal.error || 'Lägenhetsnummer saknas för bostadsrätt.',
      });
    }

    const brfVal = validateBrfOrgNumber(invoice.recipient?.brfOrgNumber || '');
    if (!brfVal.valid) {
      issues.push({
        invoiceNumber,
        customerName,
        field: 'brfOrgNumber',
        message: brfVal.error || 'BRF-organisationsnummer saknas för bostadsrätt.',
      });
    }
  } else {
    const propVal = validatePropertyDesignation(invoice.recipient?.propertyDesignation || '');
    if (!propVal.valid) {
      issues.push({
        invoiceNumber,
        customerName,
        field: 'propertyDesignation',
        message: propVal.error || 'Fastighetsbeteckning saknas för småhus.',
      });
    }
  }

  // Arbetstimmar
  let totalHours = 0;
  let materialExVat = 0;
  let otherExVat = 0;

  (invoice.items || []).forEach((item) => {
    if (item.type !== 'item') return;
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const lineTotal = qty * price;

    if (item.isRotRut) {
      // Räkna timmar
      totalHours += qty;
    } else {
      const desc = (item.description || '').toLowerCase();
      if (desc.includes('material') || desc.includes('beijer') || desc.includes('virke') || desc.includes('färg')) {
        materialExVat += lineTotal;
      } else {
        otherExVat += lineTotal;
      }
    }
  });

  const roundedHours = Math.max(1, Math.round(totalHours));

  // Belopp
  // Arbetskostnad inkl moms
  const laborCostIncVat = Math.round(calc.rotLaborBase * (invoice.enableReverseVat ? 1.0 : 1.25));
  const requestedRotAmount = Math.round(calc.rotDeduction);
  const buyerPaidAmount = Math.round(laborCostIncVat - requestedRotAmount);
  const materialCostIncVat = Math.round(materialExVat * (invoice.enableReverseVat ? 1.0 : 1.25));
  const otherCostIncVat = Math.round(otherExVat * (invoice.enableReverseVat ? 1.0 : 1.25));

  // Affärsregler enligt Skatteverket
  if (requestedRotAmount > buyerPaidAmount) {
    issues.push({
      invoiceNumber,
      customerName,
      field: 'requestedRotAmount',
      message: 'Begärt belopp får inte överstiga vad köparen har betalat för arbetet.',
    });
  }

  if (requestedRotAmount + buyerPaidAmount > laborCostIncVat) {
    issues.push({
      invoiceNumber,
      customerName,
      field: 'laborCostIncVat',
      message: 'Begärt belopp + Betalt belopp får inte överstiga arbetskostnaden.',
    });
  }

  const workCategory = invoice.rotWorkCategory || 'Bygg';

  const arende: RotArendeData = {
    invoice,
    buyerPersonNumber: pnrVal.pnr12 || '',
    paymentDate,
    housingType,
    propertyDesignation: invoice.recipient?.propertyDesignation?.trim(),
    apartmentNumber: invoice.recipient?.apartmentNumber?.trim(),
    brfOrgNumber: invoice.recipient?.brfOrgNumber?.replace(/\D/g, ''),
    workCategory,
    laborHours: roundedHours,
    laborCostIncVat,
    requestedRotAmount,
    buyerPaidAmount,
    materialCostIncVat,
    otherCostIncVat,
    invoiceNumber: invoiceNumber.slice(0, 20),
  };

  return { arende, issues };
}

/**
 * Genererar giltig XML (XSD v6.0) för ett eller flera ROT-ärenden inom samma kalenderår
 */
export function generateRotXmlString(
  arenden: RotArendeData[],
  batchName: string = 'Rot Begaran'
): string {
  if (arenden.length === 0) {
    throw new Error('Minst ett ärende krävs för att skapa Skatteverkets XML-fil.');
  }

  if (arenden.length > 100) {
    throw new Error('Högst 100 ärenden är tillåtna per XML-fil enligt Skatteverket.');
  }

  const cleanBatchName = escapeXml(batchName.slice(0, 16));

  const arendenXml = arenden
    .map((ar) => {
      let housingXml = '';
      if (ar.housingType === 'coop') {
        housingXml = `\t\t\t<ns2:LagenhetsNr>${escapeXml(ar.apartmentNumber)}</ns2:LagenhetsNr>\n\t\t\t<ns2:BrfOrgNr>${escapeXml(ar.brfOrgNumber)}</ns2:BrfOrgNr>`;
      } else {
        housingXml = `\t\t\t<ns2:Fastighetsbeteckning>${escapeXml(ar.propertyDesignation)}</ns2:Fastighetsbeteckning>`;
      }

      // Kategori för utfört arbete (t.ex. Bygg, El, Vvs)
      const cat = ar.workCategory;
      const workXml = `\t\t\t<ns2:UtfortArbete>\n\t\t\t\t<ns2:${cat}>\n\t\t\t\t\t<ns2:AntalTimmar>${ar.laborHours}</ns2:AntalTimmar>\n\t\t\t\t\t<ns2:Materialkostnad>${ar.materialCostIncVat}</ns2:Materialkostnad>\n\t\t\t\t</ns2:${cat}>\n\t\t\t</ns2:UtfortArbete>`;

      return `\t\t<ns2:Arenden>
\t\t\t<ns2:Kopare>${ar.buyerPersonNumber}</ns2:Kopare>
\t\t\t<ns2:BetalningsDatum>${ar.paymentDate}</ns2:BetalningsDatum>
\t\t\t<ns2:PrisForArbete>${ar.laborCostIncVat}</ns2:PrisForArbete>
\t\t\t<ns2:BetaltBelopp>${ar.buyerPaidAmount}</ns2:BetaltBelopp>
\t\t\t<ns2:BegartBelopp>${ar.requestedRotAmount}</ns2:BegartBelopp>
\t\t\t<ns2:FakturaNr>${escapeXml(ar.invoiceNumber)}</ns2:FakturaNr>
\t\t\t<ns2:Ovrigkostnad>${ar.otherCostIncVat}</ns2:Ovrigkostnad>
${housingXml}
${workXml}
\t\t</ns2:Arenden>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ns1:Begaran
        xmlns:ns1="http://xmls.skatteverket.se/se/skatteverket/ht/begaran/6.0"
        xmlns:ns2="http://xmls.skatteverket.se/se/skatteverket/ht/komponent/begaran/6.0">
\t<ns2:NamnPaBegaran>${cleanBatchName}</ns2:NamnPaBegaran>
\t<ns2:RotBegaran>
${arendenXml}
\t</ns2:RotBegaran>
</ns1:Begaran>
`;
}

/**
 * Grupperar och batchar en lista av fakturor per år och max 100 ärenden
 */
export function buildRotXmlBatches(
  invoices: InvoiceData[],
  defaultPaymentDate?: string
): { batches: RotBatchResult[]; allIssues: RotValidationIssue[] } {
  const allIssues: RotValidationIssue[] = [];
  const validArenden: RotArendeData[] = [];

  for (const inv of invoices) {
    const { arende, issues } = extractRotArendeData(inv, defaultPaymentDate);
    if (issues.length > 0) {
      allIssues.push(...issues);
    }
    if (arende) {
      validArenden.push(arende);
    }
  }

  // Gruppera efter kalenderår för betalningen
  const byYear = new Map<number, RotArendeData[]>();
  for (const ar of validArenden) {
    const year = parseInt(ar.paymentDate.split('-')[0], 10);
    const existing = byYear.get(year) || [];
    existing.push(ar);
    byYear.set(year, existing);
  }

  const batches: RotBatchResult[] = [];

  byYear.forEach((list, year) => {
    // Dela upp i max 100 ärenden per batch
    for (let i = 0; i < list.length; i += 100) {
      const slice = list.slice(i, i + 100);
      const batchIdx = Math.floor(i / 100) + 1;
      const batchName = list.length <= 100 ? `ROT ${year}` : `ROT ${year} del ${batchIdx}`;
      const filename = `Begaran_ROT_${year}_batch${batchIdx}.xml`;
      const xml = generateRotXmlString(slice, batchName);
      const totalRequestedAmount = slice.reduce((sum, ar) => sum + ar.requestedRotAmount, 0);

      batches.push({
        year,
        batchIndex: batchIdx,
        filename,
        xml,
        arendenCount: slice.length,
        totalRequestedAmount,
      });
    }
  });

  return { batches, allIssues };
}

/**
 * Startar nedladdning av en genererad XML-fil i webbläsaren
 */
export function triggerXmlDownload(xmlString: string, filename: string): void {
  const blob = new Blob([xmlString], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
