'use client';

import React from 'react';
import { InvoiceData } from '@/types/invoice';
import { calculateInvoice, formatSEK } from '@/utils/calculations';
import { CheckCircle2, Landmark } from 'lucide-react';

interface InvoicePreviewProps {
  invoice: InvoiceData;
  scale?: number;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice }) => {
  const calc = calculateInvoice(invoice);
  const { design } = invoice;

  const primaryColor = design.primaryColor || '#dc2626';

  return (
    <div
      id="invoice-sheet"
      className="invoice-sheet bg-white text-slate-800 transition-all mx-auto shadow-2xl print:shadow-none print:m-0 print:border-none print:w-full"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '16mm 18mm 18mm 18mm',
        boxSizing: 'border-box',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily:
          design.fontFamily === 'serif'
            ? 'Georgia, Cambria, serif'
            : design.fontFamily === 'mono'
            ? 'ui-monospace, SFMono-Regular, monospace'
            : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div>
        {/* HEADER SECTION */}
        <div className="flex items-start justify-between border-b pb-6 mb-6" style={{ borderColor: '#e2e8f0' }}>
          {/* Logo & Company Title */}
          <div className="flex flex-col items-start max-w-[55%]">
            {invoice.sender.logoUrl ? (
              <div className="mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={invoice.sender.logoUrl}
                  alt={invoice.sender.company || 'Logotyp'}
                  style={{ width: `${invoice.sender.logoWidth || 160}px`, maxHeight: '80px', objectFit: 'contain' }}
                  className="block"
                />
              </div>
            ) : (
              <div className="text-2xl font-black tracking-tight" style={{ color: primaryColor }}>
                {invoice.sender.company || invoice.sender.name || 'FÖRETAGSNAMN'}
              </div>
            )}
            {invoice.sender.company && invoice.sender.name && invoice.sender.logoUrl && (
              <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                {invoice.sender.company}
              </div>
            )}
          </div>

          {/* Invoice Title & Meta */}
          <div className="text-right">
            <div
              className="text-3xl font-extrabold uppercase tracking-tight mb-2"
              style={{ color: primaryColor }}
            >
              {invoice.title || 'FAKTURA'}
            </div>
            
            <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-md mb-3 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fakturanr:</span>
              <span className="text-base font-bold text-slate-900">{invoice.invoiceNumber || '—'}</span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-right">
              <span className="text-slate-500">Fakturadatum:</span>
              <span className="font-semibold text-slate-800">{invoice.invoiceDate || '—'}</span>
              
              <span className="text-slate-500">Förfallodatum:</span>
              <span className="font-bold" style={{ color: primaryColor }}>
                {invoice.dueDate || '—'}
              </span>

              {invoice.customerNumber && (
                <>
                  <span className="text-slate-500">Kundnummer:</span>
                  <span className="font-semibold text-slate-800">{invoice.customerNumber}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* PARTNER INFO (Avsändare & Mottagare) */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          {/* Mottagare (Faktureringsadress) */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Faktureras till (Mottagare)</span>
              {invoice.recipient.customerNumber && (
                <span className="text-slate-500 font-normal">Kund #{invoice.recipient.customerNumber}</span>
              )}
            </div>
            <div className="text-sm font-bold text-slate-900">
              {invoice.recipient.name || invoice.recipient.company || 'Kundens namn'}
            </div>
            {invoice.recipient.company && invoice.recipient.name && (
              <div className="text-xs text-slate-600">{invoice.recipient.company}</div>
            )}
            <div className="text-xs text-slate-700 mt-1 whitespace-pre-line leading-relaxed">
              {invoice.recipient.address || 'Gatuadress'}
              {'\n'}
              {invoice.recipient.zipAndCity || 'Postnr Ort'}
            </div>
            {invoice.recipient.orgOrPersonNumber && (
              <div className="text-[11px] text-slate-500 mt-2">
                Org/Personnr: <span className="font-medium text-slate-700">{invoice.recipient.orgOrPersonNumber}</span>
              </div>
            )}
            {invoice.recipient.email && (
              <div className="text-[11px] text-slate-500">E-post: {invoice.recipient.email}</div>
            )}
          </div>

          {/* Avsändare (Företagskontakt) */}
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Avsändare & Kontakt
            </div>
            <div className="text-sm font-bold text-slate-900">
              {invoice.sender.company || invoice.sender.name}
            </div>
            {invoice.sender.company && invoice.sender.name && (
              <div className="text-xs text-slate-600">Ref: {invoice.sender.name}</div>
            )}
            <div className="text-xs text-slate-700 mt-1 leading-relaxed">
              {invoice.sender.address}
              {invoice.sender.address && invoice.sender.zipAndCity && <br />}
              {invoice.sender.zipAndCity}
            </div>
            <div className="text-[11px] text-slate-600 mt-2 space-y-0.5">
              {invoice.sender.phone && <div>Tel: <span className="font-medium">{invoice.sender.phone}</span></div>}
              {invoice.sender.email && <div>E-post: <span className="font-medium">{invoice.sender.email}</span></div>}
              {invoice.sender.orgNumber && (
                <div>Org.nr: <span className="font-medium">{invoice.sender.orgNumber}</span></div>
              )}
            </div>
          </div>
        </div>

        {/* REFERENSER & VILLKOR BAR */}
        <div className="bg-slate-100/90 border border-slate-200 rounded-lg px-4 py-2.5 mb-6 text-xs text-slate-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Vår referens</span>
              <span className="font-semibold">{invoice.ourReference || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Er referens</span>
              <span className="font-semibold">{invoice.yourReference || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Betalningsvillkor</span>
              <span className="font-semibold">{invoice.paymentTerms || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Dröjsmålsränta</span>
              <span className="font-semibold">{invoice.latePaymentInterest || '8%'}</span>
            </div>
          </div>
          {(invoice.orderNumber || invoice.deliveryTerms || invoice.deliveryMethod) && (
            <div className="grid grid-cols-3 gap-4 pt-2 mt-2 border-t border-slate-200 text-xs">
              {invoice.orderNumber && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Ordernummer</span>
                  <span className="font-semibold">{invoice.orderNumber}</span>
                </div>
              )}
              {invoice.deliveryTerms && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Leveransvillkor</span>
                  <span className="font-semibold">{invoice.deliveryTerms}</span>
                </div>
              )}
              {invoice.deliveryMethod && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Leveranssätt</span>
                  <span className="font-semibold">{invoice.deliveryMethod}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ARTICLES & SERVICES TABLE */}
        <div className="mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className="text-white text-[11px] uppercase tracking-wider font-semibold"
                style={{ backgroundColor: primaryColor }}
              >
                {design.showArticleNumber && <th className="py-2.5 px-3 rounded-l-md w-24">Artikelnr</th>}
                <th
                  className={`py-2.5 px-3 ${!design.showArticleNumber ? 'rounded-l-md' : ''}`}
                >
                  Benämning / Beskrivning
                </th>
                <th className="py-2.5 px-3 text-right w-16">Antal</th>
                {design.showUnit && <th className="py-2.5 px-3 text-center w-14">Enhet</th>}
                <th className="py-2.5 px-3 text-right w-24">À-pris</th>
                {design.showVatColumn && <th className="py-2.5 px-3 text-right w-16">Moms</th>}
                <th className="py-2.5 px-3 text-right rounded-r-md w-28">Belopp ({invoice.currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item, idx) => {
                if (item.type === 'header') {
                  return (
                    <tr key={item.id || idx} className="bg-slate-50/80 font-bold text-slate-900">
                      <td
                        colSpan={
                          3 +
                          (design.showArticleNumber ? 1 : 0) +
                          (design.showUnit ? 1 : 0) +
                          (design.showVatColumn ? 1 : 0)
                        }
                        className="py-2.5 px-3 text-sm tracking-tight border-b border-slate-200"
                        style={{ color: primaryColor }}
                      >
                        {item.description}
                      </td>
                    </tr>
                  );
                }

                if (item.type === 'text') {
                  return (
                    <tr key={item.id || idx} className="text-slate-600 italic">
                      <td
                        colSpan={
                          3 +
                          (design.showArticleNumber ? 1 : 0) +
                          (design.showUnit ? 1 : 0) +
                          (design.showVatColumn ? 1 : 0)
                        }
                        className="py-1.5 px-3 text-xs"
                      >
                        {item.description}
                      </td>
                    </tr>
                  );
                }

                const lineTotal =
                  item.quantity !== null && item.unitPrice !== null
                    ? item.quantity * item.unitPrice
                    : 0;

                return (
                  <tr
                    key={item.id || idx}
                    className={`hover:bg-slate-50/50 transition-colors ${
                      idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                    }`}
                  >
                    {design.showArticleNumber && (
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {item.articleNumber || '—'}
                      </td>
                    )}
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      <div>{item.description || '—'}</div>
                      {item.isRotRut && invoice.enableRot && (
                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          ROT/RUT-berättigad arbetskostnad
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 font-medium">
                      {item.quantity !== null ? item.quantity : '—'}
                    </td>
                    {design.showUnit && (
                      <td className="py-2.5 px-3 text-center text-slate-500">
                        {item.unit || 'st'}
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-right text-slate-700 font-medium">
                      {item.unitPrice !== null ? formatSEK(item.unitPrice) : '—'}
                    </td>
                    {design.showVatColumn && (
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        {item.vatRate}%
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatSEK(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* SUMMARY & VAT BREAKDOWN SECTION */}
        <div className="grid grid-cols-2 gap-8 mb-6 pt-2 border-t border-slate-200">
          {/* Left: VAT Breakdown table & Notes */}
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Momsunderlag
              </div>
              <table className="w-full text-xs border border-slate-200 rounded-md overflow-hidden">
                <thead className="bg-slate-100 text-[10px] text-slate-500 uppercase">
                  <tr>
                    <th className="py-1 px-2.5 text-left">Momssats</th>
                    <th className="py-1 px-2.5 text-right">Underlag</th>
                    <th className="py-1 px-2.5 text-right">Momsbelopp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {calc.vatBreakdown.map((vb) => {
                    if (vb.base === 0 && vb.vatAmount === 0 && vb.rate !== 25) return null;
                    return (
                      <tr key={vb.rate} className="text-slate-700">
                        <td className="py-1 px-2.5 font-medium">
                          {vb.rate > 0 ? `Moms ${vb.rate}%` : 'Momsfritt'}
                        </td>
                        <td className="py-1 px-2.5 text-right text-slate-600">
                          {formatSEK(vb.base)}
                        </td>
                        <td className="py-1 px-2.5 text-right font-semibold text-slate-800">
                          {formatSEK(vb.vatAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Reverse VAT notice */}
            {invoice.enableReverseVat && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-2.5 rounded-md font-medium">
                Omvänd skattskyldighet för byggtjänster tillämpas enligt 1 kap. 2 § första stycket 4 b ML. Köparen redovisar momsen.
              </div>
            )}

            {/* Notes / Message */}
            {invoice.notes && (
              <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 text-xs text-slate-700">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Meddelande / Anteckningar
                </div>
                <div className="whitespace-pre-line">{invoice.notes}</div>
              </div>
            )}
          </div>

          {/* Right: Subtotals, Fees, Total */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
            {invoice.discountValue > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>
                  Rabatt {invoice.discountType === 'percent' ? `(${invoice.discountValue}%)` : ''}:
                </span>
                <span className="font-semibold text-red-600">
                  -{formatSEK(calc.discountAmount)} {invoice.currency}
                </span>
              </div>
            )}

            {invoice.shipping > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Frakt:</span>
                <span className="font-medium">
                  {formatSEK(invoice.shipping)} {invoice.currency}
                </span>
              </div>
            )}

            {invoice.adminFee > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Expeditionsavgift:</span>
                <span className="font-medium">
                  {formatSEK(invoice.adminFee)} {invoice.currency}
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-200">
              <span className="font-medium">Belopp före moms:</span>
              <span className="font-bold">
                {formatSEK(calc.totalBeforeVat)} {invoice.currency}
              </span>
            </div>

            <div className="flex justify-between text-slate-700">
              <span className="font-medium">Total moms:</span>
              <span className="font-bold">
                {formatSEK(calc.totalVat)} {invoice.currency}
              </span>
            </div>

            {invoice.enableRounding && calc.rounding !== 0 && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Öresutjämning:</span>
                <span>
                  {calc.rounding > 0 ? `+${formatSEK(calc.rounding)}` : formatSEK(calc.rounding)}{' '}
                  {invoice.currency}
                </span>
              </div>
            )}

            {/* MAIN TOTAL */}
            <div
              className="pt-3 mt-2 border-t-2 rounded-md p-3 flex justify-between items-center text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider block opacity-90">
                  Att betala ({invoice.currency})
                </span>
                <span className="text-[10px] opacity-75">
                  Förfaller {invoice.dueDate || 'vid förfallodatum'}
                </span>
              </div>
              <div className="text-2xl font-black tracking-tight">
                {formatSEK(calc.totalToPay)} {invoice.currency}
              </div>
            </div>

            {/* ROT / RUT if active */}
            {invoice.enableRot && calc.rotDeduction > 0 && (
              <div className="bg-emerald-50 border border-emerald-300 rounded p-2.5 mt-2 text-xs text-emerald-950 space-y-1">
                <div className="flex justify-between">
                  <span>Skattereduktion ROT ({invoice.rotPercent || 30}%):</span>
                  <span className="font-bold text-emerald-700">
                    -{formatSEK(calc.rotDeduction)} {invoice.currency}
                  </span>
                </div>
                <div className="flex justify-between font-extrabold text-sm border-t border-emerald-200 pt-1 text-emerald-900">
                  <span>Att betala efter ROT:</span>
                  <span>
                    {formatSEK(calc.totalToPayAfterRot)} {invoice.currency}
                  </span>
                </div>
                <div className="text-[10px] text-emerald-700">
                  Beloppet {formatSEK(calc.rotDeduction)} {invoice.currency} ansöks från Skatteverket.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER & PAYMENT DETAILS (Clean, professional Swedish layout) */}
      <div className="border-t-2 pt-4 mt-auto text-xs" style={{ borderColor: primaryColor }}>
        <div className="grid grid-cols-12 gap-5 items-start">
          {/* Kolumn 1: Betalningsuppgifter */}
          <div className="col-span-5 space-y-1.5">
            <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-slate-600" />
              Betalningsinformation
            </div>
            {invoice.sender.bankgiro && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 w-20">Bankgiro:</span>
                <span className="font-black text-slate-900 text-sm tracking-wide">{invoice.sender.bankgiro}</span>
              </div>
            )}
            {invoice.sender.bankAccount && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 w-20">Bankkonto:</span>
                <span className="font-semibold text-slate-900">{invoice.sender.bankAccount}</span>
              </div>
            )}
            {invoice.sender.plusgiro && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 w-20">Plusgiro:</span>
                <span className="font-semibold text-slate-800">{invoice.sender.plusgiro}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-slate-500 w-20">OCR / Ref:</span>
              <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                {invoice.invoiceNumber || 'Fakturanummer'}
              </span>
            </div>
            {invoice.sender.iban && (
              <div className="flex items-center gap-2 text-[10px] text-slate-600 pt-0.5">
                <span className="w-20">IBAN:</span>
                <span className="font-mono">{invoice.sender.iban}</span>
              </div>
            )}
            {invoice.sender.swiftBic && (
              <div className="flex items-center gap-2 text-[10px] text-slate-600">
                <span className="w-20">SWIFT/BIC:</span>
                <span className="font-mono">{invoice.sender.swiftBic}</span>
              </div>
            )}
          </div>

          {/* Kolumn 2: Företagsinfo & Skatt */}
          <div className="col-span-4 space-y-1 text-slate-600">
            <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
              Företagsuppgifter
            </div>
            <div>
              Org.nr: <span className="font-semibold text-slate-800">{invoice.sender.orgNumber || '—'}</span>
            </div>
            {invoice.sender.vatNumber && (
              <div>
                VAT: <span className="font-semibold text-slate-800">{invoice.sender.vatNumber}</span>
              </div>
            )}
            {invoice.sender.email && <div>E-post: {invoice.sender.email}</div>}
            {invoice.sender.phone && <div>Tel: {invoice.sender.phone}</div>}
            
            {/* F-skatt badge */}
            <div className="pt-1.5 flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{invoice.sender.taxStatus || 'Godkänd för F-skatt'}</span>
            </div>
          </div>

          {/* Kolumn 3: Betalningsnotis & Tack */}
          <div className="col-span-3 flex flex-col justify-between text-left pl-3 border-l border-slate-200 min-h-[90px]">
            <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[10px] text-slate-600 leading-tight space-y-1">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Betalningsvillkor</div>
              <div>Inbetalning till företagets bankgiro/konto senast <strong>{invoice.dueDate || 'förfallodagen'}</strong>.</div>
              <div className="text-slate-500">Ange fakturanr som meddelande.</div>
            </div>
            <div className="text-slate-500 text-[10px] italic pt-1">
              Tack för förtroendet och gott samarbete!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
