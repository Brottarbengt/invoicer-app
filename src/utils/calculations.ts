import { InvoiceData, InvoiceItem } from '@/types/invoice';

export interface VatBreakdown {
  rate: number; // 25, 12, 6, 0
  base: number; // Momsunderlag
  vatAmount: number; // Momsbelopp
}

export interface InvoiceCalculation {
  subtotalItems: number; // Belopp före rabatt & avgifter
  discountAmount: number;
  taxableBaseBeforeFees: number;
  shipping: number;
  adminFee: number;
  totalBeforeVat: number; // Belopp före moms
  vatBreakdown: VatBreakdown[];
  totalVat: number;
  subtotalWithVat: number;
  rounding: number; // Öresutjämning
  totalToPay: number; // Att betala
  rotLaborBase: number;
  rotDeduction: number;
  totalToPayAfterRot: number;
}

export function getItemLineTotal(item: InvoiceItem): number {
  if (item.type !== 'item') return 0;

  const hasQty =
    item.quantity !== null &&
    item.quantity !== undefined &&
    item.quantity !== ('' as any) &&
    !isNaN(Number(item.quantity));

  const hasPrice =
    item.unitPrice !== null &&
    item.unitPrice !== undefined &&
    item.unitPrice !== ('' as any) &&
    !isNaN(Number(item.unitPrice));

  if (hasQty && hasPrice) {
    return Number(item.quantity) * Number(item.unitPrice);
  }

  if (
    item.totalPrice !== null &&
    item.totalPrice !== undefined &&
    item.totalPrice !== ('' as any) &&
    !isNaN(Number(item.totalPrice))
  ) {
    return Number(item.totalPrice);
  }

  if (hasPrice && !hasQty) {
    return Number(item.unitPrice);
  }

  return 0;
}

export function calculateInvoice(invoice: InvoiceData): InvoiceCalculation {
  let subtotalItems = 0;
  let rotLaborBase = 0;

  // Samla underlag per momssats
  const rateTotals: Record<number, number> = { 25: 0, 12: 0, 6: 0, 0: 0 };

  invoice.items.forEach((item: InvoiceItem) => {
    if (item.type === 'item') {
      const lineTotal = getItemLineTotal(item);
      subtotalItems += lineTotal;

      const rate = [25, 12, 6, 0].includes(item.vatRate) ? item.vatRate : 25;
      rateTotals[rate] = (rateTotals[rate] || 0) + lineTotal;

      if (item.isRotRut) {
        rotLaborBase += lineTotal;
      }
    }
  });

  // Rabatt
  let discountAmount = 0;
  if (invoice.discountValue > 0) {
    if (invoice.discountType === 'percent') {
      discountAmount = (subtotalItems * Math.min(100, invoice.discountValue)) / 100;
    } else {
      discountAmount = Math.min(subtotalItems, invoice.discountValue);
    }
  }

  const shipping = Number(invoice.shipping) || 0;
  const adminFee = Number(invoice.adminFee) || 0;

  // Belopp före moms
  const totalBeforeVat = Math.max(0, subtotalItems - discountAmount + shipping + adminFee);

  // Momsberäkning
  // Om rabatt finns, fördela den proportionellt på momssatserna
  const discountRatio = subtotalItems > 0 ? (subtotalItems - discountAmount) / subtotalItems : 1;

  const vatBreakdown: VatBreakdown[] = [25, 12, 6, 0].map((rate) => {
    let base = (rateTotals[rate] || 0) * discountRatio;
    
    // Om frakt eller expeditionsavgift finns läggs de normalt på 25% moms
    if (rate === 25) {
      base += shipping + adminFee;
    }

    let vatAmount = (base * rate) / 100;
    
    // Omvänd moms (omvänd skattskyldighet för byggsektorn)
    if (invoice.enableReverseVat) {
      vatAmount = 0;
    }

    return {
      rate,
      base: Math.round(base * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
    };
  });

  const totalVat = vatBreakdown.reduce((sum, v) => sum + v.vatAmount, 0);
  const exactTotal = totalBeforeVat + totalVat;

  // Öresutjämning
  let rounding = 0;
  let totalToPay = exactTotal;

  if (invoice.enableRounding) {
    const rounded = Math.round(exactTotal);
    rounding = Math.round((rounded - exactTotal) * 100) / 100;
    totalToPay = rounded;
  }

  // ROT / RUT
  let rotDeduction = 0;
  if (invoice.enableRot && rotLaborBase > 0) {
    // Normalt 30% av arbetskostnad inklusive moms för privatperson
    // Arbetskostnad inkl moms = rotLaborBase * 1.25
    const rotPercent = invoice.rotPercent || 30;
    const laborWithVat = rotLaborBase * (invoice.enableReverseVat ? 1.0 : 1.25);
    rotDeduction = Math.round(((laborWithVat * rotPercent) / 100) * 100) / 100;
  }

  const totalToPayAfterRot = Math.max(0, totalToPay - rotDeduction);

  return {
    subtotalItems,
    discountAmount,
    taxableBaseBeforeFees: subtotalItems - discountAmount,
    shipping,
    adminFee,
    totalBeforeVat,
    vatBreakdown,
    totalVat,
    subtotalWithVat: exactTotal,
    rounding,
    totalToPay,
    rotLaborBase,
    rotDeduction,
    totalToPayAfterRot,
  };
}

export function formatSEK(value: number, showDecimals: boolean = true): string {
  if (isNaN(value)) return '0,00';
  const parts = value.toFixed(showDecimals ? 2 : 0).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join(',');
}
