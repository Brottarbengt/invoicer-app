'use client';

import React, { useEffect, useState } from 'react';
import { DEFAULT_SAMPLE_INVOICE, InvoiceData, RecipientInfo, SavedCustomer, createEmptyInvoice } from '@/types/invoice';
import { CustomerSidebar } from '@/components/CustomerSidebar';
import { AiAssistant } from '@/components/AiAssistant';
import { InvoicePreview } from '@/components/InvoicePreview';
import { Header } from '@/components/Header';
import { SavedInvoicesModal } from '@/components/SavedInvoicesModal';
import {
  getSavedCustomers,
  getSavedInvoicesList,
  incrementInvoiceNumber,
  loadCurrentInvoice,
  loadSavedSender,
  saveCurrentInvoice,
  saveCustomer,
  deleteSavedCustomer,
  saveInvoiceToList,
} from '@/utils/storage';
import { downloadPdfDirectly, printInvoice } from '@/utils/pdfExport';
import { addDaysToDate, getTodayDateString } from '@/utils/calculations';
import { Check, ZoomIn, ZoomOut, Sparkles, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

export default function Home() {
  const [invoice, setInvoice] = useState<InvoiceData>(DEFAULT_SAMPLE_INVOICE);
  const [customers, setCustomers] = useState<SavedCustomer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  const [savedInvoices, setSavedInvoices] = useState<InvoiceData[]>([]);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'customers' | 'assistant' | 'preview'>('assistant');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' } | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(0.78);
  const [showManualEditor, setShowManualEditor] = useState(false);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load initial data on mount - starts completely empty as requested
  useEffect(() => {
    const empty = createEmptyInvoice('0121');
    const savedSender = loadSavedSender();
    if (savedSender) {
      empty.sender = savedSender;
    }
    setInvoice(empty);
    setSelectedCustomerId(undefined);
    setCustomers(getSavedCustomers());
    setSavedInvoices(getSavedInvoicesList());

    if (typeof window !== 'undefined') {
      if (window.innerWidth < 1440 && window.innerWidth >= 1024) {
        setPreviewZoom(0.68);
      } else if (window.innerWidth >= 1440) {
        setPreviewZoom(0.78);
      }
    }
  }, []);

  const handleInvoiceChange = (updated: InvoiceData) => {
    setInvoice(updated);
    saveCurrentInvoice(updated);
  };

  // Select customer from sidebar
  const handleSelectCustomer = (customer: SavedCustomer) => {
    setSelectedCustomerId(customer.id);
    const updated: InvoiceData = {
      ...invoice,
      customerNumber: customer.customerNumber || invoice.customerNumber,
      yourReference: customer.name.split(' ')[0] || invoice.yourReference,
      recipient: {
        name: customer.name,
        company: customer.company || '',
        address: customer.address || '',
        zipAndCity: customer.zipAndCity || '',
        customerNumber: customer.customerNumber || '',
        email: customer.email || '',
        phone: customer.phone || '',
        orgOrPersonNumber: customer.orgOrPersonNumber || '',
        propertyDesignation: '',
      },
    };
    handleInvoiceChange(updated);
    showToast(`Kunden ${customer.name} har valts!`);

    // On mobile, automatically advance to assistant view
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileTab('assistant');
    }
  };

  // Save new or edited customer
  const handleSaveCustomer = (recipient: RecipientInfo, notes?: string) => {
    const updatedList = saveCustomer(recipient, notes);
    setCustomers(updatedList);
    showToast(`Kunden ${recipient.name} har sparats!`);
  };

  // Delete customer
  const handleDeleteCustomer = (id: string) => {
    const updatedList = deleteSavedCustomer(id);
    setCustomers(updatedList);
    showToast('Kund borttagen', 'info');
  };

  // Apply AI parsed data
  const handleApplyAiData = (data: Partial<InvoiceData> & { customerName?: string }) => {
    let newRecipient = invoice.recipient;
    let newCustomerNumber = invoice.customerNumber;
    let newYourRef = invoice.yourReference;

    if (data.customerName) {
      const q = data.customerName.trim().toLowerCase();
      const match = customers.find(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          q.includes(c.name.toLowerCase()) ||
          (c.company && c.company.toLowerCase().includes(q))
      );
      if (match) {
        setSelectedCustomerId(match.id);
        newCustomerNumber = match.customerNumber || invoice.customerNumber;
        newYourRef = match.name.split(' ')[0] || invoice.yourReference;
        newRecipient = {
          name: match.name,
          company: match.company || '',
          address: match.address || '',
          zipAndCity: match.zipAndCity || '',
          customerNumber: match.customerNumber || '',
          email: match.email || '',
          phone: match.phone || '',
          orgOrPersonNumber: match.orgOrPersonNumber || '',
          propertyDesignation: '',
        };
      }
    }

    const updated: InvoiceData = {
      ...invoice,
      ...data,
      customerNumber: newCustomerNumber,
      yourReference: newYourRef,
      recipient: newRecipient,
      projectTitle: data.projectTitle || invoice.projectTitle,
      projectDates: data.projectDates || invoice.projectDates,
      items: data.items && data.items.length > 0 ? data.items : invoice.items,
    };
    handleInvoiceChange(updated);
    showToast('Fakturan uppdaterades av AI:n!');

    // On mobile, show preview tab to see results
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileTab('preview');
    }
  };

  // Reset invoice - completely clear
  const handleResetInvoice = () => {
    const empty = createEmptyInvoice(invoice.invoiceNumber || '0121');
    const savedSender = loadSavedSender();
    if (savedSender) {
      empty.sender = savedSender;
    }
    setInvoice(empty);
    setSelectedCustomerId(undefined);
    showToast('Fakturan tömdes helt', 'info');
  };

  // Next invoice (+1) - starts clean with incremented invoice number
  const handleNextInvoice = () => {
    const nextNumber = incrementInvoiceNumber(invoice.invoiceNumber || '0121');
    const empty = createEmptyInvoice(nextNumber);
    const savedSender = loadSavedSender();
    if (savedSender) {
      empty.sender = savedSender;
    }
    setInvoice(empty);
    setSelectedCustomerId(undefined);
    showToast(`Ny faktura skapad (#${nextNumber})`);
  };

  const handlePrint = () => {
    printInvoice();
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    const cleanCustomerName = (invoice.recipient.name || 'Kund').replace(/[^a-zA-Z0-9åäöÅÄÖ_-]/g, '_');
    const filename = `Faktura_${invoice.invoiceNumber || '6101'}_${cleanCustomerName}.pdf`;

    showToast('Genererar skarp PDF...', 'info');
    const success = await downloadPdfDirectly('invoice-sheet', filename);
    setIsDownloadingPdf(false);
    if (success) {
      showToast(`PDF sparad: ${filename}`);
    }
  };

  const handleSaveInvoice = () => {
    saveInvoiceToList(invoice);
    setSavedInvoices(getSavedInvoicesList());
    showToast(`Faktura #${invoice.invoiceNumber || 'utkast'} sparades i arkivet!`);
  };

  const handleDeleteSavedInvoice = (id: string) => {
    const filtered = savedInvoices.filter((i) => i.id !== id);
    setSavedInvoices(filtered);
    if (typeof window !== 'undefined') {
      localStorage.setItem('faktura_saved_list', JSON.stringify(filtered));
    }
    showToast('Faktura raderad från arkivet', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-bounce-short">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Responsive Header */}
      <Header
        invoiceNumber={invoice.invoiceNumber}
        recipientName={invoice.recipient.name}
        onPrint={handlePrint}
        onDownloadPdf={handleDownloadPdf}
        onNextInvoice={handleNextInvoice}
        onSaveInvoice={handleSaveInvoice}
        onOpenSavedModal={() => setIsSavedModalOpen(true)}
        savedCount={savedInvoices.length}
        isDownloadingPdf={isDownloadingPdf}
        activeMobileTab={mobileTab}
        onSelectMobileTab={(tab) => setMobileTab(tab)}
      />

      {/* Hero Notice Bar with Context */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-200 text-xs px-4 py-1.5 text-center font-medium shadow-xs no-print flex items-center justify-center gap-2 border-b border-slate-700/60">
        <Sparkles className="w-3.5 h-3.5 text-red-400 shrink-0" />
        <span>
          <strong>Lokal AI-fakturering:</strong> Välj kund till vänster, klistra in underlag i AI-rutan och se A4-fakturan räknas ut direkt med ROT & moms.
        </span>
      </div>

      {/* Main 3-Column / Responsive Layout */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-2.5 sm:p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* COLUMN 1: KUNDREGISTER (Left) */}
          <div
            className={`lg:col-span-3 ${
              mobileTab === 'customers' ? 'block' : 'hidden lg:block'
            }`}
          >
            <CustomerSidebar
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              currentRecipient={invoice.recipient}
              onSelectCustomer={handleSelectCustomer}
              onSaveCustomer={handleSaveCustomer}
              onDeleteCustomer={handleDeleteCustomer}
            />
          </div>

          {/* COLUMN 2: AI PROMPT ASSISTENT (Center) */}
          <div
            className={`lg:col-span-4 ${
              mobileTab === 'assistant' ? 'block' : 'hidden lg:block'
            }`}
          >
            <AiAssistant
              currentInvoice={invoice}
              onApplyInvoiceData={handleApplyAiData}
              onResetInvoice={handleResetInvoice}
            />
          </div>

          {/* COLUMN 3: LIVE A4 FAKTURA PREVIEW (Right) */}
          <div
            className={`lg:col-span-5 flex flex-col items-center ${
              mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Toolbar above preview */}
            <div className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3.5 py-2 mb-2.5 shadow-xs no-print text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span>A4 Live Faktura</span>
                <span className="text-[11px] font-normal text-slate-400 hidden sm:inline">
                  (Realtidsvisning)
                </span>
              </span>

              {/* ROT Toggle, Zoom & Quick manual toggle */}
              <div className="flex items-center gap-2">
                <label
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer select-none ${
                    invoice.enableRot
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/40 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                  title="Klicka för att aktivera eller stänga av 30% ROT-avdrag"
                >
                  <input
                    type="checkbox"
                    checked={invoice.enableRot}
                    onChange={(e) => handleInvoiceChange({ ...invoice, enableRot: e.target.checked })}
                    className="w-3.5 h-3.5 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                  />
                  <span>ROT (30%)</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowManualEditor(!showManualEditor)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                    showManualEditor
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Justera fält</span>
                  {showManualEditor ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(Math.max(0.45, previewZoom - 0.08))}
                    className="p-1 rounded hover:bg-slate-200 text-slate-700 cursor-pointer"
                    title="Minska zoom"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-[10.5px] text-slate-700 w-8 text-center">
                    {Math.round(previewZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(Math.min(1.1, previewZoom + 0.08))}
                    className="p-1 rounded hover:bg-slate-200 text-slate-700 cursor-pointer"
                    title="Öka zoom"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Manual Item Editor Drawer (if opened) */}
            {showManualEditor && (
              <div className="w-full bg-white border border-slate-200 rounded-xl p-3 mb-3 shadow-xs text-xs space-y-2 animate-in fade-in duration-150">
                <div className="font-bold text-slate-800 pb-1 border-b border-slate-100 flex justify-between items-center">
                  <span>Snabbjustera fakturauppgifter</span>
                  <span className="text-[10px] text-slate-400 font-normal">Ändras live på fakturan</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600">Projektnamn:</label>
                    <input
                      type="text"
                      value={invoice.projectTitle || ''}
                      onChange={(e) => handleInvoiceChange({ ...invoice, projectTitle: e.target.value })}
                      placeholder="t.ex. Dörrbyte"
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600">Projektperiod / Fastighet:</label>
                    <input
                      type="text"
                      value={invoice.projectDates || ''}
                      onChange={(e) => handleInvoiceChange({ ...invoice, projectDates: e.target.value })}
                      placeholder="t.ex. Utförda 2026-11-02 • ÖSTBY 8:46"
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={invoice.enableRot}
                      onChange={(e) => handleInvoiceChange({ ...invoice, enableRot: e.target.checked })}
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    <span>Aktivera 30% ROT-avdrag på arbetskostnad</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      const updatedItems = [
                        ...invoice.items,
                        {
                          id: `item-${Date.now()}`,
                          type: 'item' as const,
                          description: 'Ny post',
                          subDescription: '',
                          quantity: 1,
                          unit: 'st',
                          unitPrice: 0,
                          vatRate: 25,
                          isRotRut: false,
                        },
                      ];
                      handleInvoiceChange({ ...invoice, items: updatedItems });
                    }}
                    className="text-[11px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    + Lägg till manuell rad
                  </button>
                </div>
              </div>
            )}

            {/* A4 Sheet Display Container */}
            <div
              className="w-full flex justify-center overflow-x-auto py-1"
              style={{ minHeight: '720px' }}
            >
              <div
                style={{
                  transform: `scale(${previewZoom})`,
                  transformOrigin: 'top center',
                  marginBottom: `calc((297mm * ${previewZoom}) - 297mm)`,
                }}
                className="transition-transform duration-150"
              >
                <InvoicePreview invoice={invoice} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Saved Invoices Modal */}
      <SavedInvoicesModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        invoices={savedInvoices}
        onSelectInvoice={(selected) => {
          setInvoice(selected);
          saveCurrentInvoice(selected);
          showToast(`Laddade faktura #${selected.invoiceNumber || 'utkast'}`);
        }}
        onDeleteInvoice={handleDeleteSavedInvoice}
      />
    </div>
  );
}
