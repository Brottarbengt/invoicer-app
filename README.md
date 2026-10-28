# Modern Svensk Fakturamall & Fakturagenerator

En modern, webbaserad svensk fakturamall skapad för att ersätta gamla stela och felbenägna PDF-formulär (såsom Visma SPCS-mallen).

Applikationen har stöd för alla funktioner i originalmallen, men löser alla kända problem med beräkningar, formatering och layout.

## ✨ Viktiga funktioner & Förbättringar

1. **Realtidsberäkningar utan fel**
   - Automatisk summering av antal × à-pris per rad
   - Automatisk fördelning av momsunderlag (25%, 12%, 6%, momsfritt)
   - Svensk öresutjämning (avrundning till heltal kronor)
   - Valfri expeditionsavgift, frakt och procentuell eller fast rabatt
2. **Modern & Luftig Skandinavisk Design**
   - Ersätter den gamla gråa 90-talslayouten med stilren typografi, tydlig hierarki och professionellt intryck
   - Anpassningsbara accentfärger (t.ex. KW's Bygg röd, marinblå, antracit, skogsgrön, m.fl.)
   - Möjlighet att ladda upp egen företagslogotyp eller justera storlek
3. **Flexibla Fakturarader**
   - Obegränsat antal rader (inte låst till 21 fält som den gamla mallen)
   - Stöd för både artikelrader och rena text-/rubrikrader (t.ex. *"Snickeritjänster Oktober - 2026"*)
   - Flytta rader upp/ned eller ta bort med ett klick
   - Valbara enheter: `st`, `h`, `tim`, `m`, `m²`, `kg`, `mil`, `dagar`
4. **Hantverkarfunktioner (Bygg & Hantverk)**
   - **ROT-avdrag**: Aktivera med ett klick – beräknar automatiskt 30% skattereduktion på valda arbetskostnader och visar tydligt nettobelopp för kunden samt belopp att begära från Skatteverket
   - **Omvänd byggmoms**: Omvänd skattskyldighet för byggtjänster (0% moms och automatisk lagtext)
5. **Betalning direkt till företagskonto**
   - Stöd för Bankgiro, företagskonto (Clearing + Kontonr), Plusgiro, IBAN/BIC och OCR/Referens
   - Anpassad för bokföring och revisor med tydlig betalningsreferens
   - Tydlig märkning för *"Godkänd för F-skatt"*
6. **Kundregister (Sparade kunder)**
   - Spara kunduppgifter direkt från fakturarutan med knappen nere till höger
   - Klicka på en kund i listan under rutan för att omedelbart fylla i alla mottagaruppgifter
   - Möjlighet att söka bland och hantera kunder
7. **A4-optimerad Utskrift & PDF-export**
   - **Skriv ut / Spara PDF**: Använder webbläsarens inbyggda utskriftsmotor med pixel-perfekt `@media print` A4-styling utan att klippa av sidor
   - **Ladda ner PDF**: Direkt export till PDF-fil med ett klick
8. **Spara & Återanvänd**
   - **Spara företagsprofil**: Spara dina uppgifter en gång så slipper du fylla i dem igen
   - **Nästa faktura (+1)**: Ökar automatiskt fakturanummer (t.ex. `0120` ➔ `0121`), sätter dagens datum och räknar fram förfallodatum
   - **Exempeldata**: Direkt återställning till Karl Westergrens faktura 0120 med ett klick

## 🚀 Kom igång lokalt

```bash
# Installera beroenden
npm install

# Starta utvecklingsservern
npm run dev -- -p 3845
```

Öppna webbläsaren på `http://localhost:3845`.

## 📦 Bygg för produktion

```bash
npm run build
npm start -- -p 3845
```
