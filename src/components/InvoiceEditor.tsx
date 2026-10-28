'use client';

import React, { useEffect, useState } from 'react';
import { InvoiceData, InvoiceItem, ItemType, SavedCustomer } from '@/types/invoice';
import { addDaysToDate, getTodayDateString } from '@/utils/calculations';
import {
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  CreditCard,
  FileText,
  Hammer,
  MoveDown,
  MoveUp,
  Palette,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  deleteSavedCustomer,
  getSavedCustomers,
  saveCustomer,
  saveSenderProfile,
} from '@/utils/storage';

interface InvoiceEditorProps {
  invoice: InvoiceData;
  onChange: (updated: InvoiceData) => void;
  onSaveSenderProfile: () => void;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  invoice,
  onChange,
  onSaveSenderProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'details' | 'customer' | 'sender' | 'payment' | 'design'>('items');
  const [senderSavedToast, setSenderSavedToast] = useState(false);
  const [customerSavedToast, setCustomerSavedToast] = useState(false);
  const [savedCustomers, setSavedCustomers] = useState<SavedCustomer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');

  useEffect(() => {
    setSavedCustomers(getSavedCustomers());
  }, []);

  const updateField = <K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => {
    onChange({ ...invoice, [field]: value });
  };

  const updateSender = (field: keyof InvoiceData['sender'], value: string | number) => {
    onChange({
      ...invoice,
      sender: { ...invoice.sender, [field]: value },
    });
  };

  const updateRecipient = (field: keyof InvoiceData['recipient'], value: string) => {
    onChange({
      ...invoice,
      recipient: { ...invoice.recipient, [field]: value },
    });
  };

  const updateDesign = (field: keyof InvoiceData['design'], value: any) => {
    onChange({
      ...invoice,
      design: { ...invoice.design, [field]: value },
    });
  };

  // Line item helpers
  const addItem = (type: ItemType = 'item') => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      articleNumber: '',
      description: type === 'header' ? 'Ny rubrik' : '',
      quantity: type === 'item' ? 1 : null,
      unit: type === 'item' ? 'st' : '',
      unitPrice: type === 'item' ? 0 : null,
      vatRate: 25,
      isRotRut: false,
    };
    onChange({ ...invoice, items: [...invoice.items, newItem] });
  };

  const updateItem = (index: number, updates: Partial<InvoiceItem>) => {
    const newItems = [...invoice.items];
    newItems[index] = { ...newItems[index], ...updates };
    onChange({ ...invoice, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = invoice.items.filter((_, i) => i !== index);
    onChange({ ...invoice, items: newItems });
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= invoice.items.length) return;
    const newItems = [...invoice.items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    onChange({ ...invoice, items: newItems });
  };

  // Quick days selector for due date
  const setQuickPaymentTerms = (days: number, label: string) => {
    const newDueDate = addDaysToDate(invoice.invoiceDate || getTodayDateString(), days);
    onChange({
      ...invoice,
      paymentTerms: label,
      dueDate: newDueDate,
    });
  };

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateSender('logoUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSender = () => {
    saveSenderProfile(invoice.sender);
    onSaveSenderProfile();
    setSenderSavedToast(true);
    setTimeout(() => setSenderSavedToast(false), 3000);
  };

  // Customer registry actions
  const handleSaveCustomer = () => {
    if (!invoice.recipient.name && !invoice.recipient.company) {
      alert('Vänligen fyll i kundens namn eller företagsnamn innan du sparar.');
      return;
    }
    const updatedList = saveCustomer(invoice.recipient);
    setSavedCustomers(updatedList);
    setCustomerSavedToast(true);
    setTimeout(() => setCustomerSavedToast(false), 3000);
  };

  const handleSelectCustomer = (customer: SavedCustomer) => {
    onChange({
      ...invoice,
      customerNumber: customer.customerNumber || invoice.customerNumber,
      recipient: {
        name: customer.name || '',
        company: customer.company || '',
        address: customer.address || '',
        zipAndCity: customer.zipAndCity || '',
        customerNumber: customer.customerNumber || '',
        email: customer.email || '',
        phone: customer.phone || '',
        orgOrPersonNumber: customer.orgOrPersonNumber || '',
      },
    });
  };

  const handleDeleteCustomer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedList = deleteSavedCustomer(id);
    setSavedCustomers(updatedList);
  };

  const filteredCustomers = savedCustomers.filter((c) => {
    if (!customerSearch.trim()) return true;
    const query = customerSearch.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.company && c.company.toLowerCase().includes(query)) ||
      (c.customerNumber && c.customerNumber.includes(query)) ||
      (c.zipAndCity && c.zipAndCity.toLowerCase().includes(query))
    );
  });

  const colorPresets = [
    { name: "KW Bygg Röd", hex: "#dc2626" },
    { name: "Klassisk Blå", hex: "#2563eb" },
    { name: "Marinblå", hex: "#1e3a8a" },
    { name: "Mörk Skiffer", hex: "#0f172a" },
    { name: "Hantverksgrön", hex: "#047857" },
    { name: "Modern Bärnsten", hex: "#d97706" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/80 overflow-x-auto text-xs font-semibold text-slate-600">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-1.5 py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'items'
              ? 'border-red-600 text-red-600 bg-white font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Artiklar & Rader ({invoice.items.length})
        </button>
        <button
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-1.5 py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'details'
              ? 'border-red-600 text-red-600 bg-white font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Fakturadetaljer & Villkor
        </button>
        <button
          onClick={() => setActiveTab('customer')}
          className={`flex items-center gap-1.5 py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'customer'
              ? 'border-red-600 text-red-600 bg-white font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          Mottagare (Kund)
        </button>
        <button
          onClick={() => setActiveTab('sender')}
          className={`flex items-center gap-1.5 py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'sender'
              ? 'border-red-600 text-red-600 bg-white font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Mina företagsuppgifter
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`flex items-center gap-1.5 py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'payment'
              ? 'border-red-600 text-red-600 bg-white font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Betalsätt & ROT
        </button>
        <button
          onClick={() => setActiveTab('design')}
          className={`flex items-center gap-1.5 py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'design'
              ? 'border-red-600 text-red-600 bg-white font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Palette className="w-4 h-4" />
          Utseende & Färg
        </button>
      </div>

      <div className="p-5">
        {/* TAB 1: ARTIKLAR & RADER */}
        {activeTab === 'items' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Fakturarader & Tjänster</h3>
                <p className="text-xs text-slate-500">
                  Lägg till artiklar, timmar, material eller rubriker. Alla belopp beräknas automatiskt.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addItem('item')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Lägg till artikel
                </button>
                <button
                  type="button"
                  onClick={() => addItem('header')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Lägg till rubrik
                </button>
              </div>
            </div>

            {/* Line items list */}
            <div className="space-y-2.5">
              {invoice.items.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                  Inga rader tillagda än. Klicka på &quot;Lägg till artikel&quot; för att börja.
                </div>
              )}

              {invoice.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className={`p-3 rounded-lg border transition-all ${
                    item.type === 'header'
                      ? 'bg-slate-50 border-slate-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {item.type === 'header' ? (
                    /* HEADER ROW */
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 w-14">
                        Rubrik
                      </span>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(idx, { description: e.target.value })}
                        placeholder="t.ex. Snickeritjänster Oktober - 2026"
                        className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded font-bold text-xs text-slate-800 focus:outline-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => moveItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                        title="Flytta upp"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(idx, 'down')}
                        disabled={idx === invoice.items.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                        title="Flytta ned"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                        title="Ta bort"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    /* NORMAL ITEM ROW */
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        {/* Description */}
                        <div className="col-span-12 md:col-span-5">
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-0.5">
                            Beskrivning
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(idx, { description: e.target.value })}
                            placeholder="t.ex. Snickeriarbete, Beijer Bygg, Servicebil..."
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-800 focus:outline-red-500"
                          />
                        </div>

                        {/* Quantity */}
                        <div className="col-span-4 md:col-span-2">
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-0.5">
                            Antal
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={item.quantity === null ? '' : item.quantity}
                            onChange={(e) =>
                              updateItem(idx, {
                                quantity: e.target.value === '' ? null : parseFloat(e.target.value),
                              })
                            }
                            placeholder="1"
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs text-right font-medium text-slate-800 focus:outline-red-500"
                          />
                        </div>

                        {/* Unit */}
                        <div className="col-span-4 md:col-span-2">
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-0.5">
                            Enhet
                          </label>
                          <select
                            value={item.unit}
                            onChange={(e) => updateItem(idx, { unit: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:outline-red-500 bg-white"
                          >
                            <option value="st">st (styck)</option>
                            <option value="h">h (timmar)</option>
                            <option value="tim">tim</option>
                            <option value="m">m (meter)</option>
                            <option value="m²">m²</option>
                            <option value="kg">kg</option>
                            <option value="km">km</option>
                            <option value="mil">mil</option>
                            <option value="dagar">dagar</option>
                          </select>
                        </div>

                        {/* Unit Price */}
                        <div className="col-span-4 md:col-span-2">
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-0.5">
                            À-pris (SEK)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={item.unitPrice === null ? '' : item.unitPrice}
                            onChange={(e) =>
                              updateItem(idx, {
                                unitPrice: e.target.value === '' ? null : parseFloat(e.target.value),
                              })
                            }
                            placeholder="0"
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs text-right font-semibold text-slate-800 focus:outline-red-500"
                          />
                        </div>

                        {/* Actions */}
                        <div className="col-span-12 md:col-span-1 flex items-end justify-end gap-1 pt-1 md:pt-4">
                          <button
                            type="button"
                            onClick={() => moveItem(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                            title="Flytta upp"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItem(idx, 'down')}
                            disabled={idx === invoice.items.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                            title="Flytta ned"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                            title="Ta bort rad"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Extra item options: VAT rate & ROT indicator */}
                      <div className="flex flex-wrap items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <span>Momssats:</span>
                            <select
                              value={item.vatRate}
                              onChange={(e) => updateItem(idx, { vatRate: parseInt(e.target.value, 10) })}
                              className="px-1.5 py-0.5 border border-slate-200 rounded text-[11px] bg-slate-50"
                            >
                              <option value="25">25% (Standard)</option>
                              <option value="12">12%</option>
                              <option value="6">6%</option>
                              <option value="0">0% (Momsfritt)</option>
                            </select>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!item.isRotRut}
                              onChange={(e) => updateItem(idx, { isRotRut: e.target.checked })}
                              className="rounded text-red-600 focus:ring-red-500"
                            />
                            <span>ROT/RUT-arbete</span>
                          </label>
                        </div>

                        <div className="font-semibold text-slate-700">
                          Radsumma:{' '}
                          <span className="text-slate-900 font-bold">
                            {item.quantity !== null && item.unitPrice !== null
                              ? (item.quantity * item.unitPrice).toLocaleString('sv-SE', {
                                  minimumFractionDigits: 2,
                                })
                              : '0,00'}{' '}
                            SEK
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Extra charges & Discount */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Avgifter, Rabatt & Justeringar
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Frakt (SEK)</label>
                  <input
                    type="number"
                    value={invoice.shipping || ''}
                    onChange={(e) => updateField('shipping', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Expeditionsavgift (SEK)</label>
                  <input
                    type="number"
                    value={invoice.adminFee || ''}
                    onChange={(e) => updateField('adminFee', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Rabatt</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={invoice.discountValue || ''}
                      onChange={(e) => updateField('discountValue', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                    />
                    <select
                      value={invoice.discountType}
                      onChange={(e) => updateField('discountType', e.target.value as 'amount' | 'percent')}
                      className="px-2 py-1.5 border border-slate-300 rounded text-xs bg-white"
                    >
                      <option value="amount">SEK</option>
                      <option value="percent">%</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoice.enableRounding}
                    onChange={(e) => updateField('enableRounding', e.target.checked)}
                    className="rounded text-red-600"
                  />
                  <span>Öresutjämning (avrunda automatiskt till jämna kronor)</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FAKTURADETALJER & VILLKOR */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Fakturainformation & Betalningsvillkor</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fakturanummer
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={invoice.invoiceNumber}
                    onChange={(e) => updateField('invoiceNumber', e.target.value)}
                    placeholder="0120"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fakturadatum
                </label>
                <input
                  type="date"
                  value={invoice.invoiceDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    updateField('invoiceDate', newDate);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Förfallodatum
                </label>
                <input
                  type="date"
                  value={invoice.dueDate}
                  onChange={(e) => updateField('dueDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-red-500 font-semibold text-red-600"
                />
              </div>
            </div>

            {/* Quick buttons for payment terms */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Snabbval betalningsvillkor
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { days: 10, label: '10 dagar netto' },
                  { days: 14, label: '14 dagar netto' },
                  { days: 15, label: '15 dagar netto' },
                  { days: 30, label: '30 dagar netto' },
                  { days: 60, label: '60 dagar netto' },
                ].map((term) => (
                  <button
                    key={term.days}
                    type="button"
                    onClick={() => setQuickPaymentTerms(term.days, term.label)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors font-medium cursor-pointer ${
                      invoice.paymentTerms === term.label
                        ? 'bg-red-600 text-white font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {term.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vår referens
                </label>
                <input
                  type="text"
                  value={invoice.ourReference}
                  onChange={(e) => updateField('ourReference', e.target.value)}
                  placeholder="Karl"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Er referens
                </label>
                <input
                  type="text"
                  value={invoice.yourReference}
                  onChange={(e) => updateField('yourReference', e.target.value)}
                  placeholder="Nils"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dröjsmålsränta
                </label>
                <input
                  type="text"
                  value={invoice.latePaymentInterest}
                  onChange={(e) => updateField('latePaymentInterest', e.target.value)}
                  placeholder="8%"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ordernummer (valfritt)
                </label>
                <input
                  type="text"
                  value={invoice.orderNumber}
                  onChange={(e) => updateField('orderNumber', e.target.value)}
                  placeholder="Order #1024"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valuta
                </label>
                <input
                  type="text"
                  value={invoice.currency}
                  onChange={(e) => updateField('currency', e.target.value)}
                  placeholder="SEK"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500 uppercase font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Anteckningar / Meddelande till kunden
              </label>
              <textarea
                value={invoice.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={2}
                placeholder="Tack för uppdraget!..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500"
              />
            </div>
          </div>
        )}

        {/* TAB 3: MOTTAGARE (KUND) MED KUNDREGISTER */}
        {activeTab === 'customer' && (
          <div className="space-y-5">
            {/* Huvudruta: Kund & Fakturaadress */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Fakturamottagare (Kund)</h3>
                  <p className="text-xs text-slate-500">
                    Fyll i kunduppgifterna nedan för den aktuella fakturan.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kundnamn / Kontakt <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={invoice.recipient.name}
                    onChange={(e) => updateRecipient('name', e.target.value)}
                    placeholder="Nils Westergren"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-red-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Företag / Organisation (om företagskund)
                  </label>
                  <input
                    type="text"
                    value={invoice.recipient.company}
                    onChange={(e) => updateRecipient('company', e.target.value)}
                    placeholder="Kundföretag AB"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Faktureringsadress
                  </label>
                  <input
                    type="text"
                    value={invoice.recipient.address}
                    onChange={(e) => updateRecipient('address', e.target.value)}
                    placeholder="Blomstervägen 3"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Postnummer & Ort
                  </label>
                  <input
                    type="text"
                    value={invoice.recipient.zipAndCity}
                    onChange={(e) => updateRecipient('zipAndCity', e.target.value)}
                    placeholder="821 40 Bollnäs"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kundnummer
                  </label>
                  <input
                    type="text"
                    value={invoice.customerNumber}
                    onChange={(e) => {
                      updateField('customerNumber', e.target.value);
                      updateRecipient('customerNumber', e.target.value);
                    }}
                    placeholder="1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Org.nr eller Personnummer (vid t.ex. ROT)
                  </label>
                  <input
                    type="text"
                    value={invoice.recipient.orgOrPersonNumber}
                    onChange={(e) => updateRecipient('orgOrPersonNumber', e.target.value)}
                    placeholder="ÅÅMMDD-XXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kundens e-post
                  </label>
                  <input
                    type="email"
                    value={invoice.recipient.email}
                    onChange={(e) => updateRecipient('email', e.target.value)}
                    placeholder="nils@example.se"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kundens telefon
                  </label>
                  <input
                    type="text"
                    value={invoice.recipient.phone}
                    onChange={(e) => updateRecipient('phone', e.target.value)}
                    placeholder="070-123 45 67"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500 bg-white"
                  />
                </div>
              </div>

              {/* Knapp NERE TILL HÖGER i rutan som sparar mottagaren till listan under */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 mt-2">
                <div className="text-xs">
                  {customerSavedToast && (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Kunden har sparats i listan nedan!
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSaveCustomer}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                  title="Spara uppgifterna i formuläret till kundlistan nedan"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Spara kund till lista</span>
                </button>
              </div>
            </div>

            {/* LISTA UNDER RUTAN: Sparade kunder (Kundregister) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-2">
                      <span>Sparade kunder</span>
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200">
                        {savedCustomers.length}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Klicka på en kund i listan så fylls uppgifterna i formuläret ovan automatiskt.
                    </p>
                  </div>
                </div>

                {savedCustomers.length > 2 && (
                  <div className="relative w-52">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Sök kund eller ort..."
                      className="w-full pl-7 pr-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-red-500"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                  </div>
                )}
              </div>

              {filteredCustomers.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-xl">
                  {savedCustomers.length === 0 ? (
                    <div>
                      Inga sparade kunder ännu. Fyll i kundens uppgifter i rutan ovan och klicka på{' '}
                      <strong>&quot;Spara kund till lista&quot;</strong> nere till höger!
                    </div>
                  ) : (
                    <div>Ingen kund matchar sökningen &quot;{customerSearch}&quot;.</div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {filteredCustomers.map((cust) => {
                    const isSelected =
                      (cust.name && invoice.recipient.name === cust.name) ||
                      (cust.company && invoice.recipient.company === cust.company);

                    return (
                      <div
                        key={cust.id}
                        onClick={() => handleSelectCustomer(cust)}
                        className={`group relative p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-red-50/60 border-red-400 shadow-xs ring-1 ring-red-400/30'
                            : 'bg-slate-50/50 hover:bg-slate-100/80 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs truncate">
                                {cust.name || cust.company || 'Namnlös kund'}
                              </span>
                              {cust.customerNumber && (
                                <span className="bg-slate-200 text-slate-700 text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold shrink-0">
                                  #{cust.customerNumber}
                                </span>
                              )}
                            </div>
                            {cust.company && cust.name && (
                              <div className="text-[11px] text-slate-600 truncate">{cust.company}</div>
                            )}
                            <div className="text-[11px] text-slate-500 mt-1 truncate">
                              {cust.address ? `${cust.address}, ` : ''}
                              {cust.zipAndCity || 'Ingen adress sparad'}
                            </div>
                            {(cust.phone || cust.email || cust.orgOrPersonNumber) && (
                              <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                                {cust.phone && <span className="mr-2">Tel: {cust.phone}</span>}
                                {cust.orgOrPersonNumber && <span>{cust.orgOrPersonNumber}</span>}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isSelected ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold">
                                <Check className="w-3 h-3" /> Vald
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-400 group-hover:text-red-600 transition-colors">
                                Välj
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomer(cust.id, e)}
                              title="Ta bort från kundlistan"
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MINA FÖRETAGSUPPGIFTER (AVSÄNDARE) */}
        {activeTab === 'sender' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Avsändare & Företagsprofil</h3>
                <p className="text-xs text-slate-500">
                  Dina företagsuppgifter som visas högst upp och i sidfoten.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveSender}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Spara som min standardprofil
              </button>
            </div>

            {senderSavedToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold animate-fade-in">
                Dina företagsuppgifter har sparats som standardprofil i webbläsaren!
              </div>
            )}

            {/* Logo upload */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Företagslogotyp
              </label>
              <div className="flex flex-wrap items-center gap-4">
                {invoice.sender.logoUrl ? (
                  <div className="p-2 bg-white rounded border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={invoice.sender.logoUrl}
                      alt="Logo preview"
                      className="h-12 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-12 bg-slate-200 rounded border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                    Ingen logo
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-xs">
                    <Upload className="w-3.5 h-3.5" /> Ladda upp bild...
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  {invoice.sender.logoUrl && (
                    <button
                      type="button"
                      onClick={() => updateSender('logoUrl', '')}
                      className="px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium cursor-pointer"
                    >
                      Ta bort logo
                    </button>
                  )}
                </div>

                {invoice.sender.logoUrl && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 ml-auto">
                    <span>Logobredd:</span>
                    <input
                      type="range"
                      min="100"
                      max="240"
                      value={invoice.sender.logoWidth || 160}
                      onChange={(e) => updateSender('logoWidth', parseInt(e.target.value, 10))}
                      className="w-24"
                    />
                    <span className="font-mono text-[11px]">{invoice.sender.logoWidth || 160}px</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Företagsnamn
                </label>
                <input
                  type="text"
                  value={invoice.sender.company}
                  onChange={(e) => updateSender('company', e.target.value)}
                  placeholder="KW's BYGG"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kontaktperson / Innehavare
                </label>
                <input
                  type="text"
                  value={invoice.sender.name}
                  onChange={(e) => updateSender('name', e.target.value)}
                  placeholder="Karl Westergren"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gatuadress
                </label>
                <input
                  type="text"
                  value={invoice.sender.address}
                  onChange={(e) => updateSender('address', e.target.value)}
                  placeholder="Moravägen 6"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Postnummer & Ort
                </label>
                <input
                  type="text"
                  value={invoice.sender.zipAndCity}
                  onChange={(e) => updateSender('zipAndCity', e.target.value)}
                  placeholder="821 41 Bollnäs"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organisationsnummer / Personnummer
                </label>
                <input
                  type="text"
                  value={invoice.sender.orgNumber}
                  onChange={(e) => updateSender('orgNumber', e.target.value)}
                  placeholder="841109-7515"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Momsregistreringsnummer (VAT-nr)
                </label>
                <input
                  type="text"
                  value={invoice.sender.vatNumber}
                  onChange={(e) => updateSender('vatNumber', e.target.value)}
                  placeholder="SE841109751501"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefon
                </label>
                <input
                  type="text"
                  value={invoice.sender.phone}
                  onChange={(e) => updateSender('phone', e.target.value)}
                  placeholder="0730-26 32 94"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-post
                </label>
                <input
                  type="email"
                  value={invoice.sender.email}
                  onChange={(e) => updateSender('email', e.target.value)}
                  placeholder="Karlvestergren@gmail.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  F-skattsedel status
                </label>
                <input
                  type="text"
                  value={invoice.sender.taxStatus}
                  onChange={(e) => updateSender('taxStatus', e.target.value)}
                  placeholder="Godkänd för F-skatt"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BETALSÄTT, BANKKONTON & ROT */}
        {activeTab === 'payment' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Betalsätt till företagskonto & Skatteavdrag</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bankgiro <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={invoice.sender.bankgiro}
                  onChange={(e) => updateSender('bankgiro', e.target.value)}
                  placeholder="5227-5153"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-black text-slate-900 focus:outline-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Företagskonto / Clearingnr
                </label>
                <input
                  type="text"
                  value={invoice.sender.bankAccount}
                  onChange={(e) => updateSender('bankAccount', e.target.value)}
                  placeholder="t.ex. Clearing 6123, Konto 123 456 789"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plusgiro (om tillämpligt)
                </label>
                <input
                  type="text"
                  value={invoice.sender.plusgiro}
                  onChange={(e) => updateSender('plusgiro', e.target.value)}
                  placeholder="12 34 56-7"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  IBAN (utlandsbetalningar)
                </label>
                <input
                  type="text"
                  value={invoice.sender.iban}
                  onChange={(e) => updateSender('iban', e.target.value)}
                  placeholder="SE..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SWIFT / BIC
                </label>
                <input
                  type="text"
                  value={invoice.sender.swiftBic}
                  onChange={(e) => updateSender('swiftBic', e.target.value)}
                  placeholder="SWEDESSX..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-red-500"
                />
              </div>
            </div>

            {/* Hantverkare: ROT/RUT & Omvänd byggmoms */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mt-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                <Hammer className="w-4 h-4 text-red-600" />
                Hantverkarinställningar (ROT-avdrag & Omvänd byggmoms)
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoice.enableRot}
                    onChange={(e) => updateField('enableRot', e.target.checked)}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Aktivera ROT-avdrag ({invoice.rotPercent || 30}% skattereduktion)
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Drar automatiskt av 30% på arbetskostnader markerade som ROT och visar tydligt nettobelopp för kunden.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoice.enableReverseVat}
                    onChange={(e) => updateField('enableReverseVat', e.target.checked)}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Omvänd skattskyldighet för byggtjänster (Byggmoms 0%)
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Sätter moms till 0 kr och infogar lagstadgad text om att köparen är skattskyldig.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: UTSEENDE & FÄRG */}
        {activeTab === 'design' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Design & Accentfärger</h3>
            
            {/* Color swatches */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Välj accentfärg
              </label>
              <div className="flex flex-wrap gap-2.5">
                {colorPresets.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => updateDesign('primaryColor', c.hex)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      invoice.design.primaryColor === c.hex
                        ? 'border-slate-800 ring-2 ring-slate-800/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full inline-block border border-black/10"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom color picker */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs text-slate-600">Egen färgkod:</span>
              <input
                type="color"
                value={invoice.design.primaryColor}
                onChange={(e) => updateDesign('primaryColor', e.target.value)}
                className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
              />
              <span className="font-mono text-xs text-slate-700">{invoice.design.primaryColor}</span>
            </div>

            {/* Layout options */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mt-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                Synliga kolumner & element
              </span>
              <div className="space-y-2 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoice.design.showArticleNumber}
                    onChange={(e) => updateDesign('showArticleNumber', e.target.checked)}
                    className="rounded text-red-600"
                  />
                  <span>Visa kolumn för Artikelnummer</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoice.design.showUnit}
                    onChange={(e) => updateDesign('showUnit', e.target.checked)}
                    className="rounded text-red-600"
                  />
                  <span>Visa kolumn för Enhet (st, h, m)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoice.design.showVatColumn}
                    onChange={(e) => updateDesign('showVatColumn', e.target.checked)}
                    className="rounded text-red-600"
                  />
                  <span>Visa separat Moms-kolumn per rad</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
