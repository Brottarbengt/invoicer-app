'use client';

import React, { useEffect, useState } from 'react';
import { DEFAULT_SAMPLE_INVOICE, InvoiceData } from '@/types/invoice';
import { InvoiceEditor } from '@/components/InvoiceEditor';
import { InvoicePreview } from '@/components/InvoicePreview';
import { Header } from '@/components/Header';
import { SavedInvoicesModal } from '@/components/SavedInvoicesModal';
import {
  getSavedInvoicesList,
  incrementInvoiceNumber,
  loadCurrentInvoice,
  loadSavedSender,
  saveCurrentInvoice,
  saveInvoiceToList,
} from '@/utils/storage';
import { downloadPdfDirectly, printInvoice } from '@/utils/pdfExport';
import { addDaysToDate, getTodayDateString } from '@/utils/calculations';
import { Check, ZoomIn, ZoomOut, Maximize2, Sparkles, AlertCircle } from 'lucide-react';

export default function Home() {
  const [invoice, setInvoice] = useState<InvoiceData>(DEFAULT_SAMPLE_INVOICE);
  const [savedInvoices, setSavedInvoices] = useState<InvoiceData[]>([]);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' } | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(0.85);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load initial data on mount
  useEffect(() => {
    const loaded = loadCurrentInvoice();
    const savedSender = loadSavedSender();
    if (savedSender && loaded.id !== DEFAULT_SAMPLE_INVOICE.id) {
      loaded.sender = savedSender;
    }
    setInvoice(loaded);
    setSavedInvoices(getSavedInvoicesList());

    // Auto-adjust zoom depending on window width
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 1280 && window.innerWidth >= 768) {
        setPreviewZoom(0.72);
      } else if (window.innerWidth >= 1280) {
        setPreviewZoom(0.85);
      }
    }
  }, []);

  // Save current invoice continuously to storage
  const handleInvoiceChange = (updated: InvoiceData) => {
    setInvoice(updated);
    saveCurrentInvoice(updated);
  };

  const handlePrint = () => {
    printInvoice();
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    const cleanCompanyName = (invoice.sender.company || 'Faktura').replace(/[^a-zA-Z0-9åäöÅÄÖ_-]/g, '_');
    const filename = `Faktura_${invoice.invoiceNumber || 'ny'}_${cleanCompanyName}.pdf`;
    
    showToast('Genererar PDF...', 'info');
    const success = await downloadPdfDirectly('invoice-sheet', filename);
    setIsDownloadingPdf(false);
    if (success) {
      showToast(`PDF nedladdad: ${filename}`);
    }
  };

  const handleSaveInvoice = () => {
    saveInvoiceToList(invoice);
    setSavedInvoices(getSavedInvoicesList());
    showToast(`Faktura #${invoice.invoiceNumber || 'utkast'} sparades!`);
  };

  const handleNextInvoice = () => {
    const nextNumber = incrementInvoiceNumber(invoice.invoiceNumber || '0120');
    const today = getTodayDateString();
    const nextDueDate = addDaysToDate(today, 15);

    const newInvoice: InvoiceData = {
      ...invoice,
      id: `faktura-${nextNumber}-${Date.now()}`,
      invoiceNumber: nextNumber,
      invoiceDate: today,
      dueDate: nextDueDate,
      items: [
        {
          id: `item-${Date.now()}`,
          type: 'item',
          articleNumber: '',
          description: '',
          quantity: 1,
          unit: 'st',
          unitPrice: 0,
          vatRate: 25,
          isRotRut: false,
        },
      ],
      shipping: 0,
      adminFee: 0,
      discountValue: 0,
      notes: 'Tack för uppdraget!',
    };

    setInvoice(newInvoice);
    saveCurrentInvoice(newInvoice);
    showToast(`Ny faktura skapad (#${nextNumber})`);
  };

  const handleResetToSample = () => {
    setInvoice(DEFAULT_SAMPLE_INVOICE);
    saveCurrentInvoice(DEFAULT_SAMPLE_INVOICE);
    showToast('Exempelfaktura 0120 (Karl & Nils Westergren) har laddats!');
  };

  const handleDeleteSavedInvoice = (id: string) => {
    const filtered = savedInvoices.filter((i) => i.id !== id);
    setSavedInvoices(filtered);
    if (typeof window !== 'undefined') {
      localStorage.setItem('faktura_saved_list', JSON.stringify(filtered));
    }
    showToast('Faktura raderad från sparade listan', 'info');
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

      {/* Main Header */}
      <Header
        onPrint={handlePrint}
        onDownloadPdf={handleDownloadPdf}
        onNextInvoice={handleNextInvoice}
        onResetToSample={handleResetToSample}
        onSaveInvoice={handleSaveInvoice}
        onOpenSavedModal={() => setIsSavedModalOpen(true)}
        savedCount={savedInvoices.length}
        mobileView={mobileView}
        onToggleMobileView={() => setMobileView(mobileView === 'editor' ? 'preview' : 'editor')}
        isDownloadingPdf={isDownloadingPdf}
      />

      {/* Hero Notice Bar with Context */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white text-xs px-4 py-2 text-center font-medium shadow-xs no-print flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 shrink-0 text-amber-200" />
        <span>
          <strong>Ny modern fakturamall</strong> med automatiska uträkningar, A4-anpassning, obegränsat antal rader, Swish QR-kod och valfritt ROT-avdrag.
        </span>
      </div>

      {/* Main Split Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: EDITOR COLUMN */}
          <div
            className={`lg:col-span-6 xl:col-span-5 space-y-4 no-print ${
              mobileView === 'preview' ? 'hidden lg:block' : 'block'
            }`}
          >
            <InvoiceEditor
              invoice={invoice}
              onChange={handleInvoiceChange}
              onSaveSenderProfile={() => showToast('Dina företagsuppgifter sparades som standardprofil!')}
            />
          </div>

          {/* RIGHT: LIVE PREVIEW COLUMN */}
          <div
            className={`lg:col-span-6 xl:col-span-7 flex flex-col items-center ${
              mobileView === 'editor' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Zoom / Scaling Controls */}
            <div className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2 mb-3 shadow-xs no-print text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <span>Förhandsgranskning A4</span>
                <span className="text-[11px] font-normal text-slate-400 hidden sm:inline">
                  (Realtidsvisning)
                </span>
              </span>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 hidden sm:inline">Zoom:</span>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(Math.max(0.5, previewZoom - 0.1))}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                  title="Minska zoom"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] text-slate-700 w-10 text-center">
                  {Math.round(previewZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(Math.min(1.2, previewZoom + 0.1))}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                  title="Öka zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(0.85)}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-600 font-medium"
                >
                  Återställ
                </button>
              </div>
            </div>

            {/* A4 Sheet Display Container */}
            <div
              className="w-full flex justify-center overflow-x-auto py-2"
              style={{
                minHeight: '750px',
              }}
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
