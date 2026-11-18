import { NextRequest, NextResponse } from 'next/server';
import { InvoiceData, InvoiceItem } from '@/types/invoice';
import { getSessionUser } from '@/lib/auth';
import { applyRotFlagsToItems, convertInclusiveVatPricesFromPrompt } from '@/utils/rotLabor';

interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

interface ParseRequest {
  prompt: string;
  currentInvoice: InvoiceData;
  attachedText?: string;
  history?: ChatHistoryItem[];
  model?: string;
}

const SYSTEM_INSTRUCTIONS = `Du är en intelligent fakturaassistent för Karl Westergren (KW's Bygg, enskild firma i Bollnäs).
Din uppgift är att hantera fakturans rader och uppgifter baserat på användarens instruktioner, konversation och eventuellt bifogade underlag.

VIKTIGA REGLER FÖR ÄNDRINGAR OCH RADER:
1. ARBETS- OCH SNICKARPRIS:
   - Karl Westergrens standardpris för snickararbete är 550 kr/tim exkl moms.
   - Om användaren inte uttryckligen anger ett annat timpris, sätt ALLTID unitPrice: 550 och unit: "tim".
   - Sätt isRotRut: true på godkända arbetstimmar/snickeri om kunden vill ha ROT-avdrag.

2. BEFINTLIGA RADER OCH ÄNDRINGAR (KRITISKT):
   - Du ser nedan vilka rader som redan finns på fakturan med deras exakta priser och antal.
   - Om användaren ber om att "ta bort" en post (t.ex. 'ta bort servicebilen'): ta bort ENDAST den specifika posten. Du MÅSTE behålla alla övriga rader med deras EXAKTA priser oförändrade!
   - Om användaren ber om att "ändra" timmar eller pris på en specifik post: uppdatera ENDAST den posten. Rör ALDRIG priser eller antal på övriga rader!
   - Om användaren ber om att "lägga till" en post: lägg till den till de befintliga raderna och behåll de tidigare.
   - Om användaren ber om att "skapa en ny faktura" eller "börja om": ersätt de tidigare raderna med de nya som efterfrågas.

3. SKAPA ALDRIG PÅHITTADE RADER:
   - Hitta ALDRIG på personer, kollegor eller timmar som inte nämnts i användarens instruktion eller bifogade underlag.
   - Lägg ALDRIG till Nils Westergren eller milersättning om det inte uttryckligen efterfrågas!
   - Skapa ALDRIG rader med 0 timmar eller 0 i antal.

4. MATERIAL & UNDERLAG FRÅN BYGGHANDEL (t.ex. Beijer Bygg, K-bygg):
   - Om användaren nämner material eller om en faktura/kvitto är bifogat:
     Skapa en rad med beskrivning "Material: Beijer Bygg" / "Material: K-bygg" (eller motsvarande).
   - I svenska fakturor skrivs decimaler med komma (t.ex. 341,94). Sätt beloppet med punkt (t.ex. 341.94).
   - unitPrice ska ALLTID vara EXKLUSIVE moms.
   - Om användaren skriver "inkl moms", "ink moms" eller "inklusive moms": dividera beloppet med 1.25 och avrunda till 2 decimaler.
     Exempel: 725 kr ink moms → unitPrice: 580.00
   - Om användaren skriver "exkl moms" eller inget anges: använd beloppet som det är.
   - Om användaren ber om att inte räkna in verktyg/skydd (t.ex. kniv, handskar, såg), dra bort dessa från summan.
   - Sätt quantity: 1, unit: "st", isRotRut: false.
   - unitPrice för material får aldrig vara 0 om det finns priser på underlaget!

5. SERVICEBIL / MILERSÄTTNING:
   - Om servicebil nämns: sätt beskrivning "Servicebil", quantity: antal (eller 1), unit: "st", unitPrice: priset (t.ex. 500 eller 200 kr), isRotRut: false.
   - Om milersättning nämns: sätt beskrivning "Milersättning", unit: "mil", isRotRut: false.

6. KUND OCH PROJEKT:
   - Om användaren nämner en kund (t.ex. "med Erik Beijer", "till Jerry"), sätt "customerName" till detta namn.
   - Om användaren anger ett projektnamn (t.ex. "Kaminmontering"), sätt "projectTitle" till detta.
   - Om ett projektnamn redan finns och användaren inte ber om att byta: BEHÅLL det befintliga projektnamnet!

7. ROT-AVDRAG:
   - Sätt enableRot: true och rotPercent: 30 om användaren önskar ROT-avdrag ELLER om ROT redan är aktivt på fakturan.
   - På ALLA arbetstimmar/snickerirader (unit "tim"/"h"): sätt ALLTID isRotRut: true när ROT är aktivt.
   - Sätt ALLTID isRotRut: false på material, servicebil, frakt och milersättning.

8. FAKTURANUMMER:
   - Om användaren ber om att ändra fakturanummer / OCR / referens: sätt "invoiceNumber" till det nya numret (endast siffror, t.ex. "6002").
   - Om användaren INTE nämner fakturanummer: sätt "invoiceNumber" till null (behåll befintligt).
   - Ändra ALDRIG fakturanummer på eget bevåg.

9. SVENSK SAMMANFATTNING (summaryMessage):
   - Skriv ALLTID en naturlig, trevlig svensk sammanfattning med dina egna ord om vad du precis ändrade eller skapade på fakturan. Kopiera aldrig instruktionstext eller malltext!

Svara ENDAST med ett giltigt JSON-objekt:
{
  "customerName": "Kundens namn om det nämns, annars null",
  "invoiceNumber": "Nytt fakturanummer om användaren begär det, annars null",
  "projectTitle": "Projektnamnet",
  "projectDates": "Tidsperiod eller datum om känt, annars null",
  "enableRot": true,
  "rotPercent": 30,
  "items": [
    {
      "description": "Radens beskrivning",
      "subDescription": "Valfri undertitel eller specifikation",
      "quantity": 1,
      "unit": "tim eller st eller mil",
      "unitPrice": 100,
      "vatRate": 25,
      "isRotRut": false
    }
  ],
  "summaryMessage": "En naturlig förklaring med dina egna ord om vad som ändrades"
}`;

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const token = req.cookies.get('invoicer_session')?.value;
    const session = getSessionUser(token);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Inloggning krävs för att använda AI-assistenten.' },
        { status: 401 }
      );
    }

    const body: ParseRequest = await req.json();
    const { prompt, currentInvoice, attachedText, history = [], model = 'qwen2.5:7b' } = body;

    // Build description of current invoice items
    const existingItemsText =
      currentInvoice.items && currentInvoice.items.length > 0
        ? currentInvoice.items
            .map(
              (it, idx) =>
                `${idx + 1}. "${it.description}"${it.subDescription ? ` (${it.subDescription})` : ''} - Antal: ${it.quantity} ${it.unit}, À-pris: ${it.unitPrice} kr, ROT: ${it.isRotRut ? 'Ja' : 'Nej'}`
            )
            .join('\n')
        : 'Inga rader än (tom faktura)';

    const chatHistoryText =
      history && history.length > 0
        ? history.map((h) => `${h.role === 'user' ? 'Användare' : 'Assistent'}: ${h.content}`).join('\n')
        : 'Ingen tidigare historik';

    const fullPrompt = `${SYSTEM_INSTRUCTIONS}

BEFINTLIG FAKTURASTATUS:
- Kund: ${currentRecipientSummary(currentInvoice)}
- Nuvarande fakturanummer / OCR: ${currentInvoice.invoiceNumber || '(ej angett)'}
- Nuvarande kundnummer: ${currentInvoice.customerNumber || currentInvoice.recipient?.customerNumber || '(ej angett)'}
- Nuvarande projektnamn: ${currentInvoice.projectTitle || '(ej angett)'}
- Nuvarande ROT-status: ${currentInvoice.enableRot ? `Ja (${currentInvoice.rotPercent || 30}%)` : 'Nej'}
- Befintliga rader på fakturan:
${existingItemsText}

${attachedText ? `BIFOGAT UNDERLAG / TEXT:\n${attachedText}\n` : ''}
${history && history.length > 0 ? `TIDIGARE CHATTHISTORIK:\n${chatHistoryText}\n` : ''}
ANVÄNDARENS NYA INSTRUKTION:
${prompt}
`;

    // Try calling local Ollama
    let ollamaResponse = null;
    let usedModel = model;
    try {
      const ollamaRes = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: fullPrompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.1,
          },
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (ollamaRes.ok) {
        const data = await ollamaRes.json();
        const parsed = JSON.parse(data.response);
        if (parsed && Array.isArray(parsed.items)) {
          ollamaResponse = parsed;
          usedModel = data.model || model;
        }
      }
    } catch (err: any) {
      console.warn('Ollama call failed or timed out:', err.message);
      ollamaResponse = null;
    }

    const durationMs = Date.now() - startTime;

    if (ollamaResponse) {
      let sanitizedItems = (ollamaResponse.items || []).map((item: any, idx: number) => {
        const cleanQuantity =
          item.quantity !== null && item.quantity !== undefined
            ? parseFloat(String(item.quantity).replace(',', '.'))
            : 1;
        const cleanUnitPrice =
          item.unitPrice !== null && item.unitPrice !== undefined
            ? parseFloat(String(item.unitPrice).replace(',', '.'))
            : 0;

        return {
          id: `item-${Date.now()}-${idx}`,
          type: 'item' as const,
          articleNumber: item.articleNumber || '',
          description: item.description || 'Arbete',
          subDescription: item.subDescription || '',
          quantity: isNaN(cleanQuantity) ? 1 : cleanQuantity,
          unit: item.unit || 'st',
          unitPrice: isNaN(cleanUnitPrice) ? 0 : cleanUnitPrice,
          vatRate: [25, 12, 6, 0].includes(Number(item.vatRate)) ? Number(item.vatRate) : 25,
          isRotRut: Boolean(item.isRotRut),
        };
      });

      // Convert "725 kr ink moms" → exkl. moms, and mark labor for ROT
      sanitizedItems = convertInclusiveVatPricesFromPrompt(prompt, sanitizedItems);
      const enableRot =
        ollamaResponse.enableRot !== undefined
          ? Boolean(ollamaResponse.enableRot)
          : Boolean(currentInvoice.enableRot);
      sanitizedItems = applyRotFlagsToItems(sanitizedItems, enableRot);

      const cleanProjectDates = (ollamaResponse.projectDates || '')
        .replace(/\s*[-•,]?\s*Fastighet:.*$/i, '')
        .trim();

      const rawInvoiceNumber =
        ollamaResponse.invoiceNumber !== null && ollamaResponse.invoiceNumber !== undefined
          ? String(ollamaResponse.invoiceNumber).replace(/\D/g, '')
          : '';

      return NextResponse.json({
        success: true,
        source: 'ollama',
        model: usedModel,
        durationMs,
        data: {
          ...ollamaResponse,
          enableRot,
          invoiceNumber: rawInvoiceNumber || null,
          projectDates: cleanProjectDates || null,
          items: sanitizedItems,
        },
      });
    }

    // If Ollama is offline or did not return a valid response, return offline error (no fallback)
    return NextResponse.json(
      {
        success: false,
        error: 'AI är offline. Kontrollera att Ollama körs på din dator.',
      },
      { status: 503 }
    );
  } catch (error: any) {
    console.error('Error in parse-invoice API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Kunde inte tolka fakturan' },
      { status: 500 }
    );
  }
}

function currentRecipientSummary(inv: InvoiceData): string {
  if (!inv.recipient) return 'Ingen';
  return `${inv.recipient.name || 'Kund'} (Fastighet: ${inv.recipient.propertyDesignation || '—'}, Adress: ${inv.recipient.address || '—'})`;
}
