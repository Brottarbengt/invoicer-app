'use client';

import React from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  DollarSign,
  Calculator,
  Type,
  Heading,
  ListPlus,
  AlignLeft,
} from 'lucide-react';
import { InvoiceItem, ItemType } from '@/types/invoice';
import { formatSEK, getItemLineTotal } from '@/utils/calculations';

interface InvoiceItemsEditorProps {
  items: InvoiceItem[];
  enableRot: boolean;
  onChangeItems: (items: InvoiceItem[]) => void;
}

export const InvoiceItemsEditor: React.FC<InvoiceItemsEditorProps> = ({
  items,
  enableRot,
  onChangeItems,
}) => {
  const handleUpdateItem = (index: number, updates: Partial<InvoiceItem>) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      ...updates,
    };
    onChangeItems(updated);
  };

  const handleAddItem = (isFixedAmount = false) => {
    const newItem: InvoiceItem = isFixedAmount
      ? {
          id: `item-${Date.now()}`,
          type: 'item',
          description: '',
          subDescription: '',
          quantity: null,
          unit: '',
          unitPrice: null,
          totalPrice: 0,
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

    onChangeItems([...items, newItem]);
  };

  const handleAddHeaderOrText = (type: 'header' | 'text') => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      type,
      description: type === 'header' ? 'RUBRIK' : 'Kommentar eller informationstext...',
      quantity: null,
      unit: '',
      unitPrice: null,
      totalPrice: null,
      vatRate: 25,
      isRotRut: false,
    };
    onChangeItems([...items, newItem]);
  };

  const handleDeleteItem = (index: number) => {
    const updated = items.filter((_, idx) => idx !== index);
    onChangeItems(updated);
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === items.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...items];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onChangeItems(updated);
  };

  const handleSwitchToFixedAmount = (index: number) => {
    const item = items[index];
    const currentTotal = getItemLineTotal(item);
    handleUpdateItem(index, {
      quantity: null,
      unit: '',
      unitPrice: null,
      totalPrice: currentTotal > 0 ? currentTotal : 0,
    });
  };

  const handleSwitchToQuantityPrice = (index: number) => {
    const item = items[index];
    const currentTotal = getItemLineTotal(item);
    handleUpdateItem(index, {
      quantity: 1,
      unit: 'st',
      unitPrice: currentTotal > 0 ? currentTotal : 0,
      totalPrice: null,
    });
  };

  return (
    <div className="space-y-3">
      {/* Header & Add Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 text-xs">
            Fakturarader ({items.length})
          </span>
          <span className="text-[10.5px] text-slate-400">
            Redigera text, antal, priser eller ange fasta belopp
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleAddItem(false)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Lägg till en rad med antal, enhet och à-pris"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ny rad (antal & pris)</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddItem(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold border border-slate-700 transition-colors cursor-pointer"
            title="Lägg till en rad som bara har ett belopp och tomt under antal, enhet och pris"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ny rad (fast belopp)</span>
          </button>

          <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-slate-200">
            <button
              type="button"
              onClick={() => handleAddHeaderOrText('header')}
              className="p-1 hover:bg-slate-100 text-slate-500 rounded text-[10.5px] font-medium"
              title="Lägg till mellanrubrik"
            >
              + Rubrik
            </button>
            <button
              type="button"
              onClick={() => handleAddHeaderOrText('text')}
              className="p-1 hover:bg-slate-100 text-slate-500 rounded text-[10.5px] font-medium"
              title="Lägg till textrad"
            >
              + Textrad
            </button>
          </div>
        </div>
      </div>

      {/* Datalist for unit suggestions */}
      <datalist id="unit-options">
        <option value="tim" />
        <option value="st" />
        <option value="m" />
        <option value="m²" />
        <option value="m³" />
        <option value="kg" />
        <option value="l" />
        <option value="mil" />
        <option value="dagar" />
      </datalist>

      {/* Rows List */}
      {items.length === 0 ? (
        <div className="py-6 px-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center space-y-2">
          <p className="text-slate-500 text-xs">Fakturan har inga rader än.</p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleAddItem(false)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
            >
              + Lägg till vanlig rad
            </button>
            <button
              type="button"
              onClick={() => handleAddItem(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200"
            >
              + Lägg till rad med fast belopp
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {items.map((item, index) => {
            const isHeader = item.type === 'header';
            const isText = item.type === 'text';
            const lineTotal = getItemLineTotal(item);

            const isFixedAmount =
              item.type === 'item' &&
              (item.quantity === null || item.quantity === undefined || item.quantity === ('' as any)) &&
              (item.unitPrice === null || item.unitPrice === undefined || item.unitPrice === ('' as any));

            if (isHeader) {
              return (
                <div
                  key={item.id || index}
                  className="bg-amber-50/60 border border-amber-200 rounded-lg p-2 flex items-center gap-2"
                >
                  <span className="text-[10px] font-bold text-amber-700 uppercase px-1.5 py-0.5 bg-amber-100 rounded">
                    Rubrik #{index + 1}
                  </span>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(index, { description: e.target.value })}
                    placeholder="Rubriktext (t.ex. MATERIALKOSTNAD)"
                    className="flex-1 px-2 py-1 bg-white border border-amber-300 rounded text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveItem(index, 'up')}
                      className="p-1 hover:bg-amber-100 rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                      title="Flytta upp"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => handleMoveItem(index, 'down')}
                      className="p-1 hover:bg-amber-100 rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                      title="Flytta ner"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(index)}
                      className="p-1 hover:bg-red-100 text-red-500 rounded cursor-pointer"
                      title="Ta bort rad"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

            if (isText) {
              return (
                <div
                  key={item.id || index}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center gap-2"
                >
                  <span className="text-[10px] font-semibold text-slate-500 uppercase px-1.5 py-0.5 bg-slate-200 rounded">
                    Text #{index + 1}
                  </span>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(index, { description: e.target.value })}
                    placeholder="Information eller kommentar..."
                    className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 italic focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveItem(index, 'up')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => handleMoveItem(index, 'down')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(index)}
                      className="p-1 hover:bg-red-100 text-red-500 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.id || index}
                className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs hover:border-slate-300 transition-all space-y-2"
              >
                {/* Row Header Bar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      #{index + 1}
                    </span>

                    {/* Mode Tag */}
                    {isFixedAmount ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                        <DollarSign className="w-2.5 h-2.5" />
                        <span>Endast belopp (tomt antal/pris)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.2 rounded">
                        <Calculator className="w-2.5 h-2.5" />
                        <span>Antal × À-pris</span>
                      </span>
                    )}

                    {/* Switch mode buttons */}
                    {isFixedAmount ? (
                      <button
                        type="button"
                        onClick={() => handleSwitchToQuantityPrice(index)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        title="Växla till att ange antal, enhet och à-pris"
                      >
                        (Ändra till antal & à-pris)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSwitchToFixedAmount(index)}
                        className="text-[10px] text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                        title="Töm antal, enhet och à-pris och ange endast ett fast belopp"
                      >
                        (Ändra till endast belopp)
                      </button>
                    )}
                  </div>

                  {/* Actions: Reorder & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveItem(index, 'up')}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                      title="Flytta upp"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => handleMoveItem(index, 'down')}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                      title="Flytta ner"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(index)}
                      className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded cursor-pointer transition-colors"
                      title="Ta bort rad"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Primary Field: Beskrivning */}
                <div>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(index, { description: e.target.value })}
                    placeholder="Beskrivning av arbete eller material (t.ex. Snickeriarbete, Kökssocklar)..."
                    className="w-full px-2.5 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                  />
                </div>

                {/* Optional SubDescription / Detaljer */}
                <div>
                  <input
                    type="text"
                    value={item.subDescription || ''}
                    onChange={(e) => handleUpdateItem(index, { subDescription: e.target.value })}
                    placeholder="Valfri undertext/detaljer (visas mindre under beskrivningen)..."
                    className="w-full px-2.5 py-1 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200/80 rounded-lg text-[11px] text-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                {/* Numbers & Calculations Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center pt-1">
                  {/* Antal */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      Antal:
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={item.quantity !== null && item.quantity !== undefined ? item.quantity : ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(',', '.').trim();
                        if (val === '') {
                          handleUpdateItem(index, { quantity: null });
                        } else {
                          const num = parseFloat(val);
                          handleUpdateItem(index, { quantity: isNaN(num) ? null : num });
                        }
                      }}
                      placeholder="Tomt"
                      className="w-full px-2 py-1 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded text-xs text-right font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>

                  {/* Enhet */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      Enhet:
                    </label>
                    <input
                      type="text"
                      list="unit-options"
                      value={item.unit || ''}
                      onChange={(e) => handleUpdateItem(index, { unit: e.target.value })}
                      placeholder="Tomt"
                      className="w-full px-2 py-1 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded text-xs text-center focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>

                  {/* À-pris (exkl moms) */}
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      À-pris (exkl moms):
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={item.unitPrice !== null && item.unitPrice !== undefined ? item.unitPrice : ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(',', '.').trim();
                        if (val === '') {
                          handleUpdateItem(index, { unitPrice: null });
                        } else {
                          const num = parseFloat(val);
                          handleUpdateItem(index, { unitPrice: isNaN(num) ? null : num });
                        }
                      }}
                      placeholder="Tomt"
                      className="w-full px-2 py-1 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded text-xs text-right font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>

                  {/* Belopp (exkl moms) */}
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-semibold text-slate-700 mb-0.5 flex items-center justify-between">
                      <span>Belopp (exkl moms):</span>
                      {isFixedAmount && (
                        <span className="text-[9px] text-emerald-600 font-bold uppercase">Fast</span>
                      )}
                    </label>

                    {/* If both quantity and unitPrice are set, auto-calculate. If either is empty, allow typing amount directly! */}
                    {item.quantity !== null &&
                    item.quantity !== undefined &&
                    item.unitPrice !== null &&
                    item.unitPrice !== undefined ? (
                      <div className="w-full px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-bold text-slate-900 text-right select-none flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-normal">beräknat</span>
                        <span>{formatSEK(lineTotal)} kr</span>
                      </div>
                    ) : (
                      <div className="relative">
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
                            const num = parseFloat(val);
                            handleUpdateItem(index, {
                              totalPrice: val === '' || isNaN(num) ? null : num,
                            });
                          }}
                          placeholder="Ange belopp..."
                          className="w-full px-2 py-1 bg-emerald-50/50 hover:bg-white focus:bg-white border border-emerald-300 rounded text-xs font-bold text-slate-900 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    )}
                  </div>

                  {/* ROT-avdrag Checkbox */}
                  <div className="col-span-2 sm:col-span-2 flex sm:flex-col justify-end items-start sm:items-center pt-1 sm:pt-0">
                    <label
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10.5px] font-bold border transition-colors cursor-pointer select-none ${
                        item.isRotRut
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/30'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                      title="Markera om denna rad berättigar till 30% ROT-avdrag (arbetskostnad)"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(item.isRotRut)}
                        onChange={(e) => handleUpdateItem(index, { isRotRut: e.target.checked })}
                        className="rounded text-emerald-600 accent-emerald-600 w-3 h-3 cursor-pointer"
                      />
                      <span>ROT (30%)</span>
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
