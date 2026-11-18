'use client';

import React from 'react';
import { InvoiceData, InvoiceItem, RecipientInfo, SenderInfo } from '@/types/invoice';
import { calculateInvoice, formatSEK, getItemLineTotal } from '@/utils/calculations';
import { isNonLaborItem, isRotEligibleLabor } from '@/utils/rotLabor';
import { Plus, DollarSign, Trash2 } from 'lucide-react';

interface InvoicePreviewProps {
  invoice: InvoiceData;
  scale?: number;
  onUpdateInvoice?: (updated: InvoiceData) => void;
}

function extractCity(zipAndCity?: string): string {
  if (!zipAndCity) return '';
  const cleaned = zipAndCity
    .replace(/^(?:SE[-\s]*)?\d{3}\s*\d{2}\s*[,.-]?\s*/i, '')
    .replace(/^(?:SE[-\s]*)?\d{5}\s*[,.-]?\s*/i, '')
    .replace(/^[\d\s,-]+/, '')
    .trim();
  return cleaned || zipAndCity;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, onUpdateInvoice }) => {
  const calc = calculateInvoice(invoice);

  // ROT calculations
  const rotExclMoms = invoice.enableRot && calc.rotDeduction > 0 ? calc.rotDeduction / 1.25 : 0;
  const taxableBase = Math.max(0, calc.totalBeforeVat - rotExclMoms);
  const vatAmount = taxableBase * 0.25;

  const updateInvoice = (updates: Partial<InvoiceData>) => {
    if (!onUpdateInvoice) return;
    onUpdateInvoice({
      ...invoice,
      ...updates,
    });
  };

  const updateSender = (updates: Partial<SenderInfo>) => {
    if (!onUpdateInvoice) return;
    onUpdateInvoice({
      ...invoice,
      sender: {
        ...invoice.sender,
        ...updates,
      },
    });
  };

  const updateRecipient = (updates: Partial<RecipientInfo>) => {
    if (!onUpdateInvoice) return;
    onUpdateInvoice({
      ...invoice,
      recipient: {
        ...invoice.recipient,
        ...updates,
      },
    });
  };

  const updateItem = (index: number, updates: Partial<InvoiceItem>) => {
    if (!onUpdateInvoice) return;
    const newItems = [...(invoice.items || [])];
    newItems[index] = {
      ...newItems[index],
      ...updates,
    };
    onUpdateInvoice({
      ...invoice,
      items: newItems,
    });
  };

  const deleteItem = (index: number) => {
    if (!onUpdateInvoice) return;
    const newItems = (invoice.items || []).filter((_, i) => i !== index);
    onUpdateInvoice({
      ...invoice,
      items: newItems,
    });
  };

  const addItem = (isFixedAmount = false) => {
    if (!onUpdateInvoice) return;
    const newItem: InvoiceItem = isFixedAmount
      ? {
          id: `item-${Date.now()}`,
          type: 'item',
          description: '',
          subDescription: '',
          quantity: null,
          unit: '',
          unitPrice: null,
          totalPrice: null,
          vatRate: 25,
          isRotRut: false,
        }
      : {
          id: `item-${Date.now()}`,
          type: 'item',
          description: '',
          subDescription: '',
          quantity: 1,
          unit: 'st',
          unitPrice: 0,
          totalPrice: null,
          vatRate: 25,
          isRotRut: false,
        };
    onUpdateInvoice({
      ...invoice,
      items: [...(invoice.items || []), newItem],
    });
  };

  const isEditable = Boolean(onUpdateInvoice);

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
        fontFamily: 'var(--font-sans), system-ui, sans-serif',
        fontSize: '12px',
        lineHeight: 1.4,
        overflow: 'hidden',
      }}
    >
      <div>
        {/* TOP HEADER */}
        <div className="flex items-center justify-between pb-3.5 border-b-2 border-slate-100">
          <div className="flex items-center gap-4 flex-1">
            {invoice.sender.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={invoice.sender.logoUrl}
                alt={invoice.sender.company || invoice.sender.name || 'Logotyp'}
                style={{
                  maxHeight: '56px',
                  width: invoice.sender.logoWidth ? `${Math.min(invoice.sender.logoWidth, 240)}px` : 'auto',
                }}
                className="h-auto max-h-14 object-contain shrink-0"
              />
            ) : null}

            <div className="flex flex-col flex-1 max-w-[340px]">
              {isEditable ? (
                <input
                  type="text"
                  value={invoice.sender.company || invoice.sender.name || ''}
                  onChange={(e) => updateSender({ company: e.target.value })}
                  className="text-xl font-black text-slate-900 tracking-tight leading-tight bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none transition-colors w-full"
                />
              ) : (
                <span className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                  {invoice.sender.company || invoice.sender.name || ''}
                </span>
              )}

              {isEditable ? (
                <input
                  type="text"
                  value={invoice.sender.name || ''}
                  onChange={(e) => updateSender({ name: e.target.value })}
                  className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none transition-colors w-full"
                />
              ) : (
                invoice.sender.name && invoice.sender.company && (
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                    {invoice.sender.name}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            {isEditable ? (
              <input
                type="text"
                value={invoice.title || 'FAKTURA'}
                onChange={(e) => updateInvoice({ title: e.target.value })}
                className="text-2xl font-black tracking-widest text-slate-900 leading-none mb-1 text-right bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none w-44"
              />
            ) : (
              <div className="text-2xl font-black tracking-widest text-slate-900 leading-none mb-1">
                {invoice.title || 'FAKTURA'}
              </div>
            )}

            <div className="flex items-center justify-end gap-1 text-xs font-bold text-slate-900 tracking-wide mt-1">
              <span className="text-slate-500 font-semibold">Nr #</span>
              {isEditable ? (
                <input
                  type="text"
                  value={invoice.invoiceNumber || ''}
                  onChange={(e) =>
                    updateInvoice({ invoiceNumber: e.target.value.replace(/[^\d]/g, '') })
                  }
                  className="w-16 font-mono font-bold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none text-left transition-colors"
                />
              ) : (
                <span className="font-mono">{invoice.invoiceNumber || ''}</span>
              )}
            </div>
          </div>
        </div>

        {/* RECIPIENT & SENDER - NO BOXES/CARDS, CLEAN TEXT ONLY */}
        <div className="grid grid-cols-2 gap-8 mt-3.5">
          {/* Fakturamottagare */}
          <div>
            <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Fakturamottagare
            </div>
            <div className="space-y-0.5 text-[11.5px] text-slate-600 leading-snug">
              {isEditable ? (
                <>
                  <input
                    type="text"
                    value={invoice.recipient.name || ''}
                    onChange={(e) => updateRecipient({ name: e.target.value })}
                    className="w-full text-[14px] font-bold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none transition-colors"
                  />
                  <input
                    type="text"
                    value={invoice.recipient.address || ''}
                    onChange={(e) => updateRecipient({ address: e.target.value })}
                    className={`w-full bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none transition-colors ${!invoice.recipient.address ? 'print:hidden' : ''}`}
                  />
                  <input
                    type="text"
                    value={invoice.recipient.zipAndCity || ''}
                    onChange={(e) => updateRecipient({ zipAndCity: e.target.value })}
                    className={`w-full bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none transition-colors ${!invoice.recipient.zipAndCity ? 'print:hidden' : ''}`}
                  />
                  <div className={`flex items-center gap-1 pt-0.5 ${!invoice.recipient.orgOrPersonNumber ? 'print:hidden' : ''}`}>
                    <span className="text-slate-500 font-semibold shrink-0">Personnr:</span>
                    <input
                      type="text"
                      value={invoice.recipient.orgOrPersonNumber || ''}
                      onChange={(e) => updateRecipient({ orgOrPersonNumber: e.target.value })}
                      className="w-full font-mono text-[11px] bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none transition-colors"
                    />
                  </div>
                  <div className={`flex items-center gap-1 ${!invoice.recipient.propertyDesignation ? 'print:hidden' : ''}`}>
                    <span className="text-slate-500 font-semibold shrink-0">Fastighetsbet:</span>
                    <input
                      type="text"
                      value={invoice.recipient.propertyDesignation || ''}
                      onChange={(e) => updateRecipient({ propertyDesignation: e.target.value })}
                      className="w-full text-[11px] bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none transition-colors"
                    />
                  </div>
                </>
              ) : invoice.recipient.name ? (
                <>
                  <div className="text-[14px] font-bold text-slate-900 mb-0.5">
                    {invoice.recipient.name}
                  </div>
                  {invoice.recipient.address && (
                    <div>
                      {invoice.recipient.address}, {invoice.recipient.zipAndCity}
                    </div>
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
                </>
              ) : (
                <div className="text-slate-400 italic text-[11.5px] print:hidden">Ingen kund angiven.</div>
              )}
            </div>
          </div>

          {/* Utställare / Avsändare */}
          <div>
            <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Utställare / Avsändare
            </div>
            <div className="space-y-0.5 text-[11.5px] text-slate-600 leading-snug">
              {isEditable ? (
                <>
                  <div className={`flex items-center gap-1 ${!invoice.sender.name ? 'print:hidden' : ''}`}>
                    <span className="text-slate-500 font-semibold shrink-0">Kontakt:</span>
                    <input
                      type="text"
                      value={invoice.sender.name || ''}
                      onChange={(e) => updateSender({ name: e.target.value })}
                      className="w-full font-bold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none transition-colors"
                    />
                  </div>
                  <input
                    type="text"
                    value={invoice.sender.address || ''}
                    onChange={(e) => updateSender({ address: e.target.value })}
                    className={`w-full bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none transition-colors ${!invoice.sender.address ? 'print:hidden' : ''}`}
                  />
                  <input
                    type="text"
                    value={invoice.sender.zipAndCity || ''}
                    onChange={(e) => updateSender({ zipAndCity: e.target.value })}
                    className={`w-full bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none transition-colors ${!invoice.sender.zipAndCity ? 'print:hidden' : ''}`}
                  />
                  <div className={`flex items-center gap-1 ${!invoice.sender.phone ? 'print:hidden' : ''}`}>
                    <span className="text-slate-500 font-semibold shrink-0">Tel:</span>
                    <input
                      type="text"
                      value={invoice.sender.phone || ''}
                      onChange={(e) => updateSender({ phone: e.target.value })}
                      className="w-full bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none transition-colors"
                    />
                  </div>
                  <div className={`flex items-center gap-1 ${!invoice.sender.email ? 'print:hidden' : ''}`}>
                    <span className="text-slate-500 font-semibold shrink-0">E-post:</span>
                    <input
                      type="text"
                      value={invoice.sender.email || ''}
                      onChange={(e) => updateSender({ email: e.target.value })}
                      className="w-full bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none transition-colors"
                    />
                  </div>
                  <input
                    type="text"
                    value={invoice.sender.taxStatus || 'Godkänd för F-skatt'}
                    onChange={(e) => updateSender({ taxStatus: e.target.value })}
                    className="text-slate-500 font-medium pt-0.5 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none transition-colors"
                  />
                </>
              ) : (
                <>
                  {invoice.sender.name && (
                    <div>
                      <strong className="text-slate-700">Kontakt:</strong> {invoice.sender.name}
                    </div>
                  )}
                  {(invoice.sender.address || invoice.sender.zipAndCity) && (
                    <div>
                      {invoice.sender.address}
                      {invoice.sender.zipAndCity ? `, ${invoice.sender.zipAndCity}` : ''}
                    </div>
                  )}
                  {invoice.sender.phone && (
                    <div>
                      <strong className="text-slate-700">Tel:</strong> {invoice.sender.phone}
                    </div>
                  )}
                  {invoice.sender.email && (
                    <div>
                      <strong className="text-slate-700">E-post:</strong> {invoice.sender.email}
                    </div>
                  )}
                  <div className="text-slate-500 font-medium pt-0.5">
                    {invoice.sender.taxStatus || 'Godkänd för F-skatt'}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* PROJECT INFO - CLEAN MINIMALIST (NO DARK BLUE BACKGROUND, NO RED BACKGROUND) */}
        <div className="mt-3.5 pt-2 pb-1.5 border-t border-b border-slate-200 flex items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              Projekt:
            </span>
            {isEditable ? (
              <input
                type="text"
                value={invoice.projectTitle || ''}
                onChange={(e) => updateInvoice({ projectTitle: e.target.value })}
                className="w-full font-bold text-sm text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none transition-colors"
              />
            ) : (
              <span className="font-bold text-sm text-slate-900">
                {invoice.projectTitle || ''}
              </span>
            )}
          </div>

          <div className={`flex items-center gap-1.5 shrink-0 ${!invoice.projectDates && !invoice.invoiceDate ? 'print:hidden' : ''}`}>
            <span className="text-[10px] font-semibold text-slate-400 shrink-0">
              Period / Datum:
            </span>
            {isEditable ? (
              <input
                type="text"
                value={invoice.projectDates || ''}
                onChange={(e) => updateInvoice({ projectDates: e.target.value })}
                className="text-[11px] text-slate-600 font-medium text-right bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none transition-colors"
              />
            ) : (
              <span className="text-[11px] text-slate-600 font-medium">
                {(invoice.projectDates || (invoice.invoiceDate ? `Utförda ${invoice.invoiceDate}` : ''))
                  .replace(/\s*[-•,]?\s*Fastighet:.*$/i, '')
                  .trim()}
              </span>
            )}
          </div>
        </div>

        {/* METADATA DETAILS STRIP */}
        <div className="grid grid-cols-4 gap-3 mt-2 px-3 py-1.5 bg-slate-50/60 border border-slate-200 rounded-lg text-xs">
          <div className="flex flex-col">
            <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">
              Fakturadatum
            </span>
            {isEditable ? (
              <input
                type="text"
                value={invoice.invoiceDate || ''}
                onChange={(e) => updateInvoice({ invoiceDate: e.target.value })}
                className="font-bold text-slate-900 text-xs bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none mt-0.5"
              />
            ) : (
              <span className="font-bold text-slate-900 text-xs mt-0.5">{invoice.invoiceDate || ''}</span>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">
              Förfallodatum
            </span>
            {isEditable ? (
              <input
                type="text"
                value={invoice.dueDate || ''}
                onChange={(e) => updateInvoice({ dueDate: e.target.value })}
                className="font-bold text-red-600 text-xs bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none mt-0.5"
              />
            ) : (
              <span className="font-bold text-red-600 text-xs mt-0.5">{invoice.dueDate || ''}</span>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">
              Betalningsvillkor
            </span>
            {isEditable ? (
              <input
                type="text"
                value={invoice.paymentTerms || ''}
                onChange={(e) => updateInvoice({ paymentTerms: e.target.value })}
                className="font-bold text-slate-900 text-xs bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none mt-0.5"
              />
            ) : (
              <span className="font-bold text-slate-900 text-xs mt-0.5">
                {invoice.paymentTerms || ''}
              </span>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">
              Referenser
            </span>
            {isEditable ? (
              <div className="flex items-center gap-1 mt-0.5 text-xs font-bold text-slate-900">
                <span className="text-[10px] text-slate-400 font-normal">Vår:</span>
                <input
                  type="text"
                  value={invoice.ourReference || ''}
                  onChange={(e) => updateInvoice({ ourReference: e.target.value })}
                  className="w-14 font-bold text-slate-900 text-xs bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-0.5 outline-none"
                />
                <span className="text-[10px] text-slate-400 font-normal">/ Er:</span>
                <input
                  type="text"
                  value={invoice.yourReference || ''}
                  onChange={(e) => updateInvoice({ yourReference: e.target.value })}
                  className="w-14 font-bold text-slate-900 text-xs bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-0.5 outline-none"
                />
              </div>
            ) : (
              <span className="font-bold text-slate-900 text-xs mt-0.5 truncate">
                Vår: {invoice.ourReference || invoice.sender.name || ''}{' '}
                {invoice.yourReference ? `/ Er: ${invoice.yourReference}` : ''}
              </span>
            )}
          </div>
        </div>

        {/* LINE ITEMS TABLE */}
        <div className="mt-2.5 border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[9.5px] uppercase font-bold text-slate-600 tracking-wider">
                <th className="py-2 px-3 text-left w-[46%]">Beskrivning</th>
                <th className="py-2 px-2 text-right w-[11%]">Antal</th>
                <th className="py-2 px-2 text-center w-[10%]">Enhet</th>
                <th className="py-2 px-2 text-right w-[15%]">À-pris (exkl.)</th>
                <th className="py-2 px-3 text-right w-[18%]">Belopp (exkl.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11.5px]">
              {invoice.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic text-xs">
                    <div>Inga fakturarader än.</div>
                    {isEditable && (
                      <div className="mt-2 flex items-center justify-center gap-2 not-italic">
                        <button
                          type="button"
                          onClick={() => addItem(false)}
                          className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-semibold border border-red-200 transition-colors cursor-pointer"
                        >
                          + Lägg till rad
                        </button>
                        <button
                          type="button"
                          onClick={() => addItem(true)}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                        >
                          + Fast belopp
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                invoice.items.map((item, idx) => {
                  if (item.type === 'header') {
                    return (
                      <tr key={item.id || idx} className="bg-slate-50/80 font-bold text-slate-900 group">
                        <td colSpan={4} className="py-1 px-3 text-xs tracking-tight text-red-700">
                          {isEditable ? (
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItem(idx, { description: e.target.value })}
                              className="w-full bg-transparent font-bold text-red-700 focus:bg-white focus:outline-none"
                            />
                          ) : (
                            item.description
                          )}
                        </td>
                        <td className="py-1 px-2 text-right">
                          {isEditable && (
                            <button
                              type="button"
                              onClick={() => deleteItem(idx)}
                              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-1 no-print print:hidden cursor-pointer"
                              title="Ta bort rubrik"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  }

                  if (item.type === 'text') {
                    return (
                      <tr key={item.id || idx} className="text-slate-600 italic group">
                        <td colSpan={4} className="py-1 px-3 text-[11px]">
                          {isEditable ? (
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItem(idx, { description: e.target.value })}
                              className="w-full bg-transparent text-slate-600 italic focus:bg-white focus:outline-none"
                            />
                          ) : (
                            item.description
                          )}
                        </td>
                        <td className="py-1 px-2 text-right">
                          {isEditable && (
                            <button
                              type="button"
                              onClick={() => deleteItem(idx)}
                              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-1 no-print print:hidden cursor-pointer"
                              title="Ta bort text"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  }

                  const lineTotal = getItemLineTotal(item);
                  const hasQty =
                    item.quantity !== null &&
                    item.quantity !== undefined &&
                    item.quantity !== ('' as any) &&
                    !isNaN(Number(item.quantity));
                  const hasUnitPrice =
                    item.unitPrice !== null &&
                    item.unitPrice !== undefined &&
                    item.unitPrice !== ('' as any) &&
                    !isNaN(Number(item.unitPrice));
                  const hasUnit = Boolean(item.unit && item.unit.trim());

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Beskrivning */}
                      <td className="py-1.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {isEditable ? (
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItem(idx, { description: e.target.value })}
                              className="w-full font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none text-xs"
                            />
                          ) : (
                            <span className="font-bold text-slate-900">{item.description}</span>
                          )}

                          {/* ROT marker: only for items that can have ROT, and only ONCE */}
                          {(() => {
                            if (!invoice.enableRot) return null;
                            if (isNonLaborItem(item)) return null;

                            if (item.isRotRut) {
                              return isEditable ? (
                                <button
                                  type="button"
                                  onClick={() => updateItem(idx, { isRotRut: false })}
                                  title="Klicka för att ta bort 30% ROT-avdrag för denna rad"
                                  className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded uppercase transition-colors cursor-pointer shrink-0 select-none"
                                >
                                  ROT
                                </button>
                              ) : (
                                <span className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded uppercase shrink-0">
                                  ROT
                                </span>
                              );
                            }

                            if (isEditable && isRotEligibleLabor(item)) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => updateItem(idx, { isRotRut: true })}
                                  title="Klicka för att aktivera 30% ROT-avdrag för denna rad"
                                  className="no-print print:hidden text-[8.5px] font-semibold text-slate-400 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 px-1.5 py-0.2 rounded transition-colors cursor-pointer shrink-0 select-none"
                                >
                                  + ROT
                                </button>
                              );
                            }

                            return null;
                          })()}
                        </div>

                        {/* Undertext / Detaljer */}
                        {isEditable ? (
                          <input
                            type="text"
                            value={item.subDescription || ''}
                            onChange={(e) => updateItem(idx, { subDescription: e.target.value })}
                            className={`w-full text-[10px] text-slate-500 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 outline-none mt-0.5 ${
                              !item.subDescription ? 'print:hidden' : ''
                            }`}
                          />
                        ) : item.subDescription ? (
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                            {item.subDescription}
                          </div>
                        ) : null}
                      </td>

                      {/* Antal */}
                      <td className="py-1.5 px-2 text-right font-medium text-slate-800">
                        {isEditable ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.quantity !== null && item.quantity !== undefined ? item.quantity : ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(',', '.').trim();
                              updateItem(idx, {
                                quantity: val === '' ? null : isNaN(Number(val)) ? null : Number(val),
                              });
                            }}
                            className="w-full text-right font-medium text-slate-800 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 outline-none text-xs"
                          />
                        ) : hasQty ? (
                          formatSEK(Number(item.quantity), false)
                        ) : (
                          ''
                        )}
                      </td>

                      {/* Enhet */}
                      <td className="py-1.5 px-2 text-center text-slate-500">
                        {isEditable ? (
                          <input
                            type="text"
                            value={item.unit || ''}
                            onChange={(e) => updateItem(idx, { unit: e.target.value })}
                            className="w-full text-center text-slate-500 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 outline-none text-xs"
                          />
                        ) : hasUnit ? (
                          item.unit
                        ) : (
                          ''
                        )}
                      </td>

                      {/* À-pris */}
                      <td className="py-1.5 px-2 text-right font-medium text-slate-800">
                        {isEditable ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.unitPrice !== null && item.unitPrice !== undefined ? item.unitPrice : ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(',', '.').trim();
                              updateItem(idx, {
                                unitPrice: val === '' ? null : isNaN(Number(val)) ? null : Number(val),
                              });
                            }}
                            className="w-full text-right font-medium text-slate-800 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 outline-none text-xs"
                          />
                        ) : hasUnitPrice ? (
                          `${formatSEK(Number(item.unitPrice))} kr`
                        ) : (
                          ''
                        )}
                      </td>

                      {/* Belopp */}
                      <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                        <div className="flex items-center justify-end gap-1">
                          {isEditable && (!hasQty || !hasUnitPrice) ? (
                            <input
                              type="text"
                              inputMode="decimal"
                              value={
                                item.totalPrice !== null && item.totalPrice !== undefined
                                  ? item.totalPrice
                                  : lineTotal > 0
                                  ? lineTotal
                                  : ''
                              }
                              onChange={(e) => {
                                const val = e.target.value.replace(',', '.').trim();
                                updateItem(idx, {
                                  totalPrice: val === '' ? null : isNaN(Number(val)) ? null : Number(val),
                                });
                              }}
                              className="w-full text-right font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 outline-none text-xs"
                            />
                          ) : (
                            <span>
                              {lineTotal > 0 || hasQty || hasUnitPrice ? `${formatSEK(lineTotal)} kr` : ''}
                            </span>
                          )}

                          {isEditable && (
                            <button
                              type="button"
                              onClick={() => deleteItem(idx)}
                              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-0.5 no-print print:hidden cursor-pointer shrink-0 transition-opacity"
                              title="Ta bort rad"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
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
                  <td className="py-1.5 px-2 text-right font-bold text-emerald-700">1,00</td>
                  <td className="py-1.5 px-2 text-center font-bold text-emerald-700">kr</td>
                  <td className="py-1.5 px-2 text-right font-bold text-emerald-700">
                    -{formatSEK(rotExclMoms)} kr
                  </td>
                  <td className="py-1.5 px-3 text-right font-extrabold text-emerald-700">
                    -{formatSEK(rotExclMoms)} kr
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Inline Add-Buttons below table (Hidden on Print & PDF) */}
          {isEditable && (
            <div className="p-1.5 px-3 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between no-print print:hidden text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addItem(false)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded text-[11px] border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-red-600" />
                  <span>+ Ny rad</span>
                </button>

                <button
                  type="button"
                  onClick={() => addItem(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded text-[11px] border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                  title="Lägg till en rad som bara har ett belopp och tomt under antal, enhet och pris"
                >
                  <DollarSign className="w-3 h-3 text-emerald-600" />
                  <span>+ Fast belopp</span>
                </button>
              </div>

              <span className="text-[10px] text-slate-400">
                Skriv och ändra direkt i tabellens fält
              </span>
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: PAYMENT INFO & SUMMARY CARDS */}
        <div className="grid grid-cols-12 gap-4 mt-2.5 items-start">
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
              <div className="flex justify-between py-0.5 border-b border-dashed border-slate-200 items-center">
                <span className="text-slate-500">Bankgiro:</span>
                {isEditable ? (
                  <input
                    type="text"
                    value={invoice.sender.bankgiro || ''}
                    onChange={(e) => updateSender({ bankgiro: e.target.value })}
                    className="font-extrabold text-slate-900 text-xs tracking-wide text-right bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 outline-none w-28"
                  />
                ) : (
                  <span className="font-extrabold text-slate-900 text-xs tracking-wide">
                    {invoice.sender.bankgiro || ''}
                  </span>
                )}
              </div>

              <div className="flex justify-between py-0.5 border-b border-dashed border-slate-200 items-center">
                <span className="text-slate-500">Ange som OCR / Referens:</span>
                {isEditable ? (
                  <input
                    type="text"
                    value={invoice.invoiceNumber || ''}
                    onChange={(e) =>
                      updateInvoice({ invoiceNumber: e.target.value.replace(/[^\d]/g, '') })
                    }
                    className="font-mono font-bold text-slate-900 text-right bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 outline-none w-28"
                  />
                ) : (
                  <span className="font-mono font-bold text-slate-900">
                    {invoice.invoiceNumber || ''}
                  </span>
                )}
              </div>

              <div className="flex justify-between py-0.5 border-b border-dashed border-slate-200 items-center">
                <span className="text-slate-500">Förfallodatum:</span>
                {isEditable ? (
                  <input
                    type="text"
                    value={invoice.dueDate || ''}
                    onChange={(e) => updateInvoice({ dueDate: e.target.value })}
                    className="font-bold text-red-600 text-right bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 outline-none w-28"
                  />
                ) : (
                  <span className="font-bold text-red-600">{invoice.dueDate || ''}</span>
                )}
              </div>

              <div className="flex justify-between py-0.5 items-center">
                <span className="text-slate-500">Dröjsmålsränta:</span>
                {isEditable ? (
                  <input
                    type="text"
                    value={invoice.latePaymentInterest || '8%'}
                    onChange={(e) => updateInvoice({ latePaymentInterest: e.target.value })}
                    className="font-medium text-slate-800 text-right bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 outline-none w-14"
                  />
                ) : (
                  <span className="font-medium text-slate-800">
                    {invoice.latePaymentInterest || '8%'}
                  </span>
                )}
              </div>
            </div>

            {/* ROT Information Box */}
            {invoice.enableRot && calc.rotDeduction > 0 && (
              <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[9.5px] text-emerald-900 leading-snug">
                <strong>Information om ROT-avdrag:</strong>
                <br />
                Du betalar fakturans nettosumma ({formatSEK(calc.totalToPayAfterRot)} kr).{' '}
                {invoice.sender.company || invoice.sender.name || 'Avsändaren'} ansöker därefter om resterande{' '}
                {formatSEK(calc.rotDeduction)} kr direkt från Skatteverket
                {invoice.recipient.propertyDesignation
                  ? ` för fastighet ${invoice.recipient.propertyDesignation}`
                  : ''}
                {invoice.recipient.orgOrPersonNumber
                  ? ` (personnr ${invoice.recipient.orgOrPersonNumber})`
                  : ''}
                . Vid eventuellt avslag debiteras kvarvarande belopp.
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
          <div className="font-medium text-slate-700">{invoice.sender.company || invoice.sender.name || '—'}</div>
          {invoice.sender.company && invoice.sender.name && <div>{invoice.sender.name}</div>}
          <div>{invoice.sender.taxStatus || 'Godkänd för F-skatt'}</div>
        </div>
        <div>
          <div className="font-bold text-slate-800 uppercase tracking-wider mb-0.5">Registrering</div>
          <div className="flex items-center gap-1">
            <span>Org.nr:</span>
            {isEditable ? (
              <input
                type="text"
                value={invoice.sender.orgNumber || ''}
                onChange={(e) => updateSender({ orgNumber: e.target.value })}
                className="w-24 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-0.5 outline-none font-mono"
              />
            ) : (
              <span>{invoice.sender.orgNumber || ''}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span>Momsnr:</span>
            {isEditable ? (
              <input
                type="text"
                value={invoice.sender.vatNumber || ''}
                onChange={(e) => updateSender({ vatNumber: e.target.value })}
                className="w-28 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-0.5 outline-none font-mono"
              />
            ) : (
              <span>{invoice.sender.vatNumber || ''}</span>
            )}
          </div>
          {invoice.sender.zipAndCity && <div>Ort: {extractCity(invoice.sender.zipAndCity)}</div>}
        </div>
        <div>
          <div className="font-bold text-slate-800 uppercase tracking-wider mb-0.5">Kontakt</div>
          <div className="flex items-center gap-1">
            <span>Tel:</span>
            {isEditable ? (
              <input
                type="text"
                value={invoice.sender.phone || ''}
                onChange={(e) => updateSender({ phone: e.target.value })}
                className="w-24 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-0.5 outline-none"
              />
            ) : (
              <span>{invoice.sender.phone || ''}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span>E-post:</span>
            {isEditable ? (
              <input
                type="text"
                value={invoice.sender.email || ''}
                onChange={(e) => updateSender({ email: e.target.value })}
                className="w-36 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-0.5 outline-none"
              />
            ) : (
              <span>{invoice.sender.email || ''}</span>
            )}
          </div>
          {(invoice.sender.address || invoice.sender.zipAndCity) && (
            <div>
              {invoice.sender.address}
              {invoice.sender.zipAndCity ? `, ${invoice.sender.zipAndCity}` : ''}
            </div>
          )}
        </div>
        <div>
          <div className="font-bold text-slate-800 uppercase tracking-wider mb-0.5">Betalsätt</div>
          <div className="flex items-center gap-1">
            <span>Bankgiro:</span>
            {isEditable ? (
              <input
                type="text"
                value={invoice.sender.bankgiro || ''}
                onChange={(e) => updateSender({ bankgiro: e.target.value })}
                className="w-20 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-0.5 outline-none"
              />
            ) : (
              <span>{invoice.sender.bankgiro || ''}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span>Villkor:</span>
            {isEditable ? (
              <input
                type="text"
                value={invoice.paymentTerms || '14 dagar netto'}
                onChange={(e) => updateInvoice({ paymentTerms: e.target.value })}
                className="w-24 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-0.5 outline-none"
              />
            ) : (
              <span>{invoice.paymentTerms || '14 dagar netto'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
