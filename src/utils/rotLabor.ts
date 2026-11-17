import { InvoiceItem } from '@/types/invoice';

/** Labor rows that may receive ROT when enableRot is on. */
export function isRotEligibleLabor(item: InvoiceItem): boolean {
  if (item.type && item.type !== 'item') return false;

  const unit = (item.unit || '').toLowerCase().trim();
  const desc = `${item.description || ''} ${item.subDescription || ''}`.toLowerCase();

  // Never ROT on materials / travel / fees
  if (
    /material|beijer|k-bygg|hägg|servicebil|miler|framkör|förbruk|hyra|cramo|skylift|skruv|plyfa|glasull|isolering/.test(
      desc
    )
  ) {
    return false;
  }

  if (unit === 'tim' || unit === 'h' || unit === 'timme' || unit === 'timmar') return true;
  if (/snicker|arbetstim|snickararbete|kakling|montage|\barbete\b/.test(desc)) return true;

  return Boolean(item.isRotRut);
}

/** When ROT is enabled, mark eligible labor rows with isRotRut. */
export function applyRotFlagsToItems(items: InvoiceItem[], enableRot: boolean): InvoiceItem[] {
  if (!enableRot) return items;
  return items.map((item) => {
    if (isRotEligibleLabor(item)) {
      return { ...item, isRotRut: true };
    }
    // Keep non-labor flags false for safety on material/service lines
    if (
      item.type === 'item' &&
      /material|beijer|servicebil|miler|framkör|förbruk/.test(
        `${item.description || ''} ${item.subDescription || ''}`.toLowerCase()
      )
    ) {
      return { ...item, isRotRut: false };
    }
    return item;
  });
}

/**
 * If the user wrote amounts as "inkl moms" / "ink moms", convert matching
 * unitPrices that were mistakenly stored as inclusive.
 * Example: 725 kr ink moms → 580.00
 */
export function convertInclusiveVatPricesFromPrompt(
  prompt: string,
  items: InvoiceItem[]
): InvoiceItem[] {
  const inklAmounts = new Set<number>();
  const re = /(\d+(?:[.,]\d+)?)\s*kr\s*(?:inkl?\.?|inklusive)\s*moms/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(prompt)) !== null) {
    const amount = parseFloat(match[1].replace(',', '.'));
    if (!Number.isNaN(amount)) {
      inklAmounts.add(amount);
      inklAmounts.add(Math.round(amount * 100) / 100);
    }
  }

  if (inklAmounts.size === 0) return items;

  return items.map((item) => {
    const price = Number(item.unitPrice);
    if (Number.isNaN(price)) return item;
    const rounded = Math.round(price * 100) / 100;
    if (inklAmounts.has(price) || inklAmounts.has(rounded)) {
      return {
        ...item,
        unitPrice: Math.round((price / 1.25) * 100) / 100,
      };
    }
    return item;
  });
}
