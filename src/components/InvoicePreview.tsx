'use client';

import React from 'react';
import { InvoiceData } from '@/types/invoice';
import { calculateInvoice, formatSEK } from '@/utils/calculations';

interface InvoicePreviewProps {
  invoice: InvoiceData;
  scale?: number;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice }) => {
  const calc = calculateInvoice(invoice);

  // ROT calculations
  const rotExclMoms = invoice.enableRot && calc.rotDeduction > 0 ? calc.rotDeduction / 1.25 : 0;
  const taxableBase = Math.max(0, calc.totalBeforeVat - rotExclMoms);
  const vatAmount = taxableBase * 0.25;

  return (
    <div
      id="invoice-sheet"
      className="invoice-sheet bg-white text-slate-800 transition-all mx-auto shadow-2xl print:shadow-none print:m-0 print:border-none print:w-full select-none"
      style={{
        width: '210mm',
        minHeight: '297mm',
        maxHeight: '297mm',
        height: '297mm',
        padding: '14mm 18mm 12mm 18mm',
        boxSizing: 'border-box',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily:
          'Plus Jakarta Sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '12px',
        lineHeight: 1.4,
        overflow: 'hidden',
      }}
    >
      <div>
        {/* TOP HEADER */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100">
          <div className="flex items-center gap-4">
            {invoice.sender.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={invoice.sender.logoUrl}
                alt={invoice.sender.company || "KW's Bygg"}
                className="h-12 w-auto object-contain"
              />
            ) : (
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl rounded">
                KW
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                {invoice.sender.company || "KW's Bygg"}
              </span>
              <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                {invoice.sender.name || 'Karl Westergren'} • Bygg & Snickeri
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black tracking-widest text-slate-900 leading-none mb-1">
              {invoice.title || 'FAKTURA'}
            </div>
            <div className="inline-block bg-slate-50 text-slate-900 font-bold text-xs px-3.5 py-1 rounded-md border border-slate-300">
              Nr #{invoice.invoiceNumber || '6101'}
            </div>
          </div>
        </div>

        {/* RECIPIENT & SENDER CARDS */}
        <div className="grid grid-cols-2 gap-4 mt-3.5">
          {/* Mottagare */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 min-h-[105px]">
            <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-xs inline-block" />
              Fakturamottagare
            </div>
            {invoice.recipient.name ? (
              <>
                <div className="text-[14px] font-bold text-slate-900 mb-0.5">
                  {invoice.recipient.name}
                </div>
                <div className="text-[11.5px] text-slate-600 leading-snug space-y-0.5">
                  {invoice.recipient.address && (
                    <div>{invoice.recipient.address}, {invoice.recipient.zipAndCity}</div>
                  )}
                  {invoice.recipient.orgOrPersonNumber && (
                    <div>
                      <strong className="text-slate-700">Personnr:</strong> {invoice.recipient.orgOrPersonNumber}
                    </div>
                  )}
                  {invoice.recipient.propertyDesignation && (
                    <div>
                      <strong className="text-slate-700">Fastighetsbet:</strong> {invoice.recipient.propertyDesignation}
                    </div>
                  )}
                  <div className="text-slate-500 pt-0.5">
                    {invoice.recipient.email && <span>{invoice.recipient.email} • </span>}
                    {invoice.recipient.phone && <span>Tel: {invoice.recipient.phone} • </span>}
                    {invoice.recipient.customerNumber && (
                      <span>Kundnr: <strong>{invoice.recipient.customerNumber}</strong></span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-2.5 text-slate-400 italic text-[11.5px]">
                Ingen kund vald. Klicka på en kund i registret till vänster eller skriv i assistenten.
              </div>
            )}
          </div>

          {/* Avsändare */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 min-h-[105px]">
            <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-xs inline-block" />
              Utställare / Avsändare
            </div>
            <div className="text-[14px] font-bold text-slate-900 mb-0.5">
              {invoice.sender.name || 'Karl Westergren'}
            </div>
            <div className="text-[11.5px] text-slate-600 leading-snug space-y-0.5">
              <div>{invoice.sender.address}, {invoice.sender.zipAndCity}</div>
              <div><strong className="text-slate-700">Tel:</strong> {invoice.sender.phone}</div>
              <div><strong className="text-slate-700">E-post:</strong> {invoice.sender.email}</div>
              <div className="text-slate-500 font-medium pt-0.5">
                {invoice.sender.taxStatus || 'Innehar F-skattsedel'}
              </div>
            </div>
          </div>
        </div>

        {/* PROJECT BANNER */}
        <div className="mt-3 bg-[#0F172A] text-white rounded-lg px-4 py-2 flex items-center justify-between text-xs h-9">
          <div className="flex items-center gap-2.5">
            <span className="bg-red-600 text-white text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded">
              Projekt
            </span>
            <span className="font-bold text-sm tracking-tight text-white">
              {invoice.projectTitle || '(Ej angett)'}
            </span>
          </div>
          <div className="text-slate-300 font-medium text-[11px]">
            {(invoice.projectDates || (invoice.invoiceDate ? `Utförda ${invoice.invoiceDate}` : ''))
              .replace(/\s*[-•,]?\s*Fastighet:.*$/i, '')
              .trim()}
          </div>
        </div>

        {/* METADATA DETAILS STRIP */}
        <div className="grid grid-cols-4 gap-3 mt-3 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs">
          <div className="flex flex-col">
            <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">Fakturadatum</span>
            <span className="font-bold text-slate-900 text-xs mt-0.5">{invoice.invoiceDate || '—'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">Förfallodatum</span>
            <span className="font-bold text-red-600 text-xs mt-0.5">{invoice.dueDate || '—'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">Betalningsvillkor</span>
            <span className="font-bold text-slate-900 text-xs mt-0.5">{invoice.paymentTerms || '14 dagar netto'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">Referenser</span>
            <span className="font-bold text-slate-900 text-xs mt-0.5">
              Vår: {invoice.ourReference || 'Karl'} {invoice.yourReference ? `/ Er: ${invoice.yourReference}` : ''}
            </span>
          </div>
        </div>

        {/* LINE ITEMS TABLE */}
        <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[9.5px] uppercase font-bold text-slate-600 tracking-wider">
                <th className="py-2 px-3 text-left w-[48%]">Beskrivning</th>
                <th className="py-2 px-3 text-right w-[11%]">Antal</th>
                <th className="py-2 px-3 text-center w-[10%]">Enhet</th>
                <th className="py-2 px-3 text-right w-[15%]">À-pris (exkl.)</th>
                <th className="py-2 px-3 text-right w-[16%]">Belopp (exkl.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11.5px]">
              {invoice.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 italic text-xs">
                    Inga fakturarader än. Klistra in underlag i AI-assistenten för att generera rader.
                  </td>
                </tr>
              ) : (
                invoice.items.map((item, idx) => {
                if (item.type === 'header') {
                  return (
                    <tr key={item.id || idx} className="bg-slate-50/80 font-bold text-slate-900">
                      <td colSpan={5} className="py-1.5 px-3 text-xs tracking-tight text-red-700">
                        {item.description}
                      </td>
                    </tr>
                  );
                }

                if (item.type === 'text') {
                  return (
                    <tr key={item.id || idx} className="text-slate-600 italic">
                      <td colSpan={5} className="py-1 px-3 text-[11px]">
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
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-1.5 px-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{item.description}</span>
                        {item.isRotRut && invoice.enableRot && (
                          <span className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 uppercase">
                            ROT
                          </span>
                        )}
                      </div>
                      {item.subDescription && (
                        <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                          {item.subDescription}
                        </div>
                      )}
                    </td>
                    <td className="py-1.5 px-3 text-right font-medium text-slate-800">
                      {item.quantity !== null ? formatSEK(item.quantity, false) : '—'}
                    </td>
                    <td className="py-1.5 px-3 text-center text-slate-500">
                      {item.unit || 'st'}
                    </td>
                    <td className="py-1.5 px-3 text-right font-medium text-slate-800">
                      {item.unitPrice !== null ? `${formatSEK(item.unitPrice)} kr` : '—'}
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                      {formatSEK(lineTotal)} kr
                    </td>
                  </tr>
                );
              })
              )}

              {/* ROT-avdrag Rad om aktivt */}
              {invoice.enableRot && calc.rotDeduction > 0 && (
                <tr className="bg-emerald-50/70 border-t border-emerald-100">
                  <td className="py-1.5 px-3">
                    <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                      <span>ROT-avdrag</span>
                      <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded uppercase">
                        -{invoice.rotPercent || 30}% Arbetskostnad
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">
                      Preliminär skattereduktion 30% på arbetskostnad ({formatSEK(calc.rotDeduction)} kr inkl. moms)
                      {invoice.recipient.propertyDesignation ? ` • Fastighet: ${invoice.recipient.propertyDesignation}` : ''}
                    </div>
                  </td>
                  <td className="py-1.5 px-3 text-right font-bold text-emerald-700">1,00</td>
                  <td className="py-1.5 px-3 text-center font-bold text-emerald-700">kr</td>
                  <td className="py-1.5 px-3 text-right font-bold text-emerald-700">
                    -{formatSEK(rotExclMoms)} kr
                  </td>
                  <td className="py-1.5 px-3 text-right font-extrabold text-emerald-700">
                    -{formatSEK(rotExclMoms)} kr
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* BOTTOM SECTION: PAYMENT INFO & SUMMARY CARDS */}
        <div className="grid grid-cols-12 gap-4 mt-3 items-start">
          {/* Betalningsinformation */}
          <div className="col-span-7 bg-[#FAFAFA] border border-slate-200 rounded-xl p-3 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-2">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[10.5px]">
                Betalningsinformation
              </span>
              <span className="bg-slate-100 text-slate-600 font-bold text-[9px] px-2 py-0.5 rounded border border-slate-200">
                Godkänd för F-skatt
              </span>
            </div>

            <div className="space-y-1 text-[11.5px]">
              <div className="flex justify-between py-0.5 border-b border-dashed border-slate-200">
                <span className="text-slate-500">Bankgiro:</span>
                <span className="font-extrabold text-slate-900 text-xs tracking-wide">
                  {invoice.sender.bankgiro || '5227-5153'}
                </span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-dashed border-slate-200">
                <span className="text-slate-500">Ange som OCR / Referens:</span>
                <span className="font-bold text-slate-900">{invoice.invoiceNumber || '6101'}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-dashed border-slate-200">
                <span className="text-slate-500">Förfallodatum:</span>
                <span className="font-bold text-red-600">{invoice.dueDate || '2026-11-16'}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Dröjsmålsränta:</span>
                <span className="font-bold text-slate-800">{invoice.latePaymentInterest || '8 %'}</span>
              </div>
            </div>

            {/* ROT Information Box */}
            {invoice.enableRot && calc.rotDeduction > 0 && (
              <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[9.5px] text-emerald-900 leading-snug">
                <strong>Information om ROT-avdrag:</strong>
                <br />
                Du betalar fakturans nettosumma ({formatSEK(calc.totalToPayAfterRot)} kr). {invoice.sender.name || "Karl Westergren"} ansöker därefter om resterande {formatSEK(calc.rotDeduction)} kr direkt från Skatteverket
                {invoice.recipient.propertyDesignation ? ` för fastighet ${invoice.recipient.propertyDesignation}` : ''}
                {invoice.recipient.orgOrPersonNumber ? ` (personnr ${invoice.recipient.orgOrPersonNumber})` : ''}.
                Vid eventuellt avslag debiteras kvarvarande belopp.
              </div>
            )}
          </div>

          {/* Summeringskort */}
          <div className="col-span-5 bg-white border border-slate-300 rounded-xl overflow-hidden text-xs">
            <div className="p-3 space-y-1 text-[11.5px]">
              <div className="flex justify-between text-slate-600">
                <span>Delsumma före ROT:</span>
                <span className="font-medium text-slate-800">{formatSEK(calc.totalBeforeVat)} kr</span>
              </div>

              {invoice.enableRot && calc.rotDeduction > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Avgår ROT-avdrag:</span>
                  <span>-{formatSEK(rotExclMoms)} kr</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Beskattningsunderlag:</span>
                <span>{formatSEK(taxableBase)} kr</span>
              </div>

              <div className="flex justify-between text-slate-700">
                <span>Moms (25%):</span>
                <span className="font-medium">{formatSEK(vatAmount)} kr</span>
              </div>

              {invoice.enableRot && calc.rotDeduction > 0 && (
                <div className="pt-1 mt-1 border-t border-dashed border-slate-200 space-y-0.5 text-[10px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Total kostnad före ROT:</span>
                    <span>{formatSEK(calc.totalToPay)} kr</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Varav ROT (kundens avdrag):</span>
                    <span>-{formatSEK(calc.rotDeduction)} kr</span>
                  </div>
                </div>
              )}
            </div>

            {/* ATT BETALA BLOCK */}
            <div className="bg-[#0F172A] text-white p-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 leading-none">
                  Att betala
                </div>
                <div className="text-[9.5px] text-slate-400 mt-0.5">
                  Förfaller {invoice.dueDate || 'vid förfallodag'}
                </div>
              </div>
              <div className="text-xl font-black text-white tracking-tight">
                {formatSEK(calc.totalToPayAfterRot)} kr
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER LEGAL INFO */}
      <div className="pt-2 border-t border-slate-200 grid grid-cols-4 gap-3 text-[9px] text-slate-500 leading-tight mt-auto">
        <div>
          <div className="font-bold text-slate-800 uppercase tracking-wider mb-0.5">Företag</div>
          <div>{invoice.sender.company || "KW's Bygg"}</div>
          <div>{invoice.sender.name || 'Karl Westergren EF'}</div>
          <div>{invoice.sender.taxStatus || 'Innehar F-skattsedel'}</div>
        </div>
        <div>
          <div className="font-bold text-slate-800 uppercase tracking-wider mb-0.5">Registrering</div>
          <div>Org.nr: {invoice.sender.orgNumber || '841109-7515'}</div>
          <div>Momsnr: {invoice.sender.vatNumber || 'SE841109751501'}</div>
          <div>Säte: Bollnäs</div>
        </div>
        <div>
          <div className="font-bold text-slate-800 uppercase tracking-wider mb-0.5">Kontakt</div>
          <div>Tel: {invoice.sender.phone || '073-026 32 94'}</div>
          <div>{invoice.sender.email || 'Karlvestergren@gmail.com'}</div>
          <div>{invoice.sender.address}, {invoice.sender.zipAndCity}</div>
        </div>
        <div>
          <div className="font-bold text-slate-800 uppercase tracking-wider mb-0.5">Betalsätt</div>
          <div>Bankgiro: {invoice.sender.bankgiro || '5227-5153'}</div>
          <div>Villkor: {invoice.paymentTerms || '14 dagar netto'}</div>
          <div>Valuta: {invoice.currency || 'SEK'}</div>
        </div>
      </div>
    </div>
  );
};
