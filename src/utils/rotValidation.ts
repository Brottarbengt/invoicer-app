/**
 * Validering och normalisering för Skatteverket ROT-ansökningar
 */

/**
 * Normaliserar ett svenskt personnummer till exakt 12 siffror (ÅÅÅÅMMDDNNNN)
 * Hanterar formaten:
 * - 19841109-7515 -> 198411097515
 * - 841109-7515   -> 198411097515
 * - 841109+7515   -> 188411097515 (+ innebär minst 100 år gammal)
 * - 198411097515  -> 198411097515
 */
export function normalizePersonnummer(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  const isPlus = trimmed.includes('+');
  const digits = trimmed.replace(/\D/g, '');

  if (digits.length === 12) {
    return digits;
  }

  if (digits.length === 10) {
    const yy = parseInt(digits.slice(0, 2), 10);
    const currentYear = new Date().getFullYear();
    const currentYY = currentYear % 100;
    const currentCentury = Math.floor(currentYear / 100) * 100;

    let century: number;
    if (isPlus) {
      // Person som fyllt 100 år
      century = yy > currentYY ? currentCentury - 200 : currentCentury - 100;
    } else {
      century = yy > currentYY ? currentCentury - 100 : currentCentury;
    }

    return `${century + yy}${digits.slice(2)}`;
  }

  return null;
}

/**
 * Luhn-algoritm (2121-kontroll) på 10 siffror
 */
export function validateLuhn(tenDigits: string): boolean {
  if (!tenDigits || tenDigits.length !== 10 || !/^\d{10}$/.test(tenDigits)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let digit = parseInt(tenDigits.charAt(i), 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  return sum % 10 === 0;
}

export interface PersonnummerValidationResult {
  valid: boolean;
  pnr12?: string;
  birthYear?: number;
  error?: string;
}

/**
 * Full validering av köparens personnummer mot Skatteverkets krav
 */
export function validatePersonnummer(
  raw: string,
  paymentYear?: number
): PersonnummerValidationResult {
  const pnr12 = normalizePersonnummer(raw);
  if (!pnr12) {
    return {
      valid: false,
      error: 'Personnumret måste bestå av 10 eller 12 siffror.',
    };
  }

  const year = parseInt(pnr12.slice(0, 4), 10);
  const month = parseInt(pnr12.slice(4, 6), 10);
  const day = parseInt(pnr12.slice(6, 8), 10);

  if (month < 1 || month > 12) {
    return { valid: false, error: 'Ogiltig månad i personnumret.' };
  }

  if (day < 1 || day > 31) {
    return { valid: false, error: 'Ogiltig dag i personnumret.' };
  }

  // Kontrollera Luhn på de sista 10 siffrorna
  const tenDigits = pnr12.slice(2);
  if (!validateLuhn(tenDigits)) {
    return {
      valid: false,
      error: 'Personnumrets kontrollsiffra stämmer inte (Luhn-kontroll misslyckades).',
    };
  }

  // Ålderskontroll enligt Skatteverkets regel:
  // "Köparen ska fylla minst 18 år under betalningsåret"
  if (paymentYear) {
    const ageDuringPaymentYear = paymentYear - year;
    if (ageDuringPaymentYear < 18) {
      return {
        valid: false,
        pnr12,
        birthYear: year,
        error: `Köparen måste fylla minst 18 år under betalningsåret (${paymentYear}). Födelseår är ${year}.`,
      };
    }
  }

  return {
    valid: true,
    pnr12,
    birthYear: year,
  };
}

/**
 * Validerar Bostadsrättsföreningens organisationsnummer (10 eller 12 siffror)
 */
export function validateBrfOrgNumber(raw: string): { valid: boolean; normalized?: string; error?: string } {
  if (!raw) {
    return { valid: false, error: 'Bostadsrättsföreningens organisationsnummer saknas.' };
  }

  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 10 && digits.length !== 12) {
    return { valid: false, error: 'BRF-organisationsnummer ska vara 10 eller 12 siffror.' };
  }

  const tenDigits = digits.length === 12 ? digits.slice(2) : digits;
  if (!validateLuhn(tenDigits)) {
    return { valid: false, error: 'BRF-organisationsnumret har ogiltig kontrollsiffra.' };
  }

  return { valid: true, normalized: digits };
}

/**
 * Validerar lägenhetsnummer (1-25 tecken, ofta 4 siffror t.ex. 1201)
 */
export function validateApartmentNumber(raw: string): { valid: boolean; error?: string } {
  if (!raw || !raw.trim()) {
    return { valid: false, error: 'Lägenhetsnummer saknas för bostadsrätt.' };
  }

  const trimmed = raw.trim();
  if (trimmed.length > 25) {
    return { valid: false, error: 'Lägenhetsnummer får vara högst 25 tecken.' };
  }

  return { valid: true };
}

/**
 * Validerar fastighetsbeteckning för småhus (1-40 tecken)
 */
export function validatePropertyDesignation(raw: string): { valid: boolean; error?: string } {
  if (!raw || !raw.trim()) {
    return { valid: false, error: 'Fastighetsbeteckning saknas för småhus.' };
  }

  const trimmed = raw.trim();
  if (trimmed.length > 40) {
    return { valid: false, error: 'Fastighetsbeteckning får vara högst 40 tecken.' };
  }

  return { valid: true };
}

/**
 * Validerar betalningsdatum enligt Skatteverkets regler:
 * - Inte före 2009-07-01
 * - Inte i framtiden
 * - Giltigt format YYYY-MM-DD
 */
export function validatePaymentDate(dateStr: string): { valid: boolean; error?: string } {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { valid: false, error: 'Betalningsdatum måste anges i formatet ÅÅÅÅ-MM-DD.' };
  }

  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  const parsed = new Date(y, m - 1, d);
  if (isNaN(parsed.getTime())) {
    return { valid: false, error: 'Ogiltigt datum.' };
  }

  const minDate = new Date('2009-07-01');
  if (parsed < minDate) {
    return { valid: false, error: 'Betalningsdatum får inte vara före 2009-07-01.' };
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (parsed > today) {
    return { valid: false, error: 'Betalningsdatum får inte vara i framtiden.' };
  }

  return { valid: true };
}
