'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { EMPTY_INVOICE, InvoiceData, RecipientInfo, SavedCustomer, SenderInfo, createEmptyInvoice } from '@/types/invoice';
import { CustomerSidebar } from '@/components/CustomerSidebar';
import { AiAssistant } from '@/components/AiAssistant';
import { InvoicePreview } from '@/components/InvoicePreview';
import { Header } from '@/components/Header';
import { SavedInvoicesModal } from '@/components/SavedInvoicesModal';
import { PinLoginModal } from '@/components/PinLoginModal';
import { RotExportModal } from '@/components/RotExportModal';
import { CompanySettingsModal } from '@/components/CompanySettingsModal';
import { InvoiceItemsEditor } from '@/components/InvoiceItemsEditor';
import { downloadPdfDirectly } from '@/utils/pdfExport';
import { applyRotFlagsToItems } from '@/utils/rotLabor';
import { Check, ZoomIn, ZoomOut, Sparkles, SlidersHorizontal, ChevronDown, ChevronUp, FileCode2, Building2 } from 'lucide-react';

interface AuthUser {
  userId: string;
  name: string;
  email?: string;
  personNumber?: string;
  senderProfile?: SenderInfo;
}

function buildBlankInvoice(invoiceNumber: string, senderProfile?: SenderInfo | null): InvoiceData {
  const empty = createEmptyInvoice(invoiceNumber);
  if (senderProfile) {
    empty.sender = { ...empty.sender, ...senderProfile };
  }
  return empty;
}

export default function Home() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  // Invoice & Customer state
  const [invoice, setInvoice] = useState<InvoiceData>(EMPTY_INVOICE);
  const [customers, setCustomers] = useState<SavedCustomer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  const [savedInvoices, setSavedInvoices] = useState<InvoiceData[]>([]);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isRotModalOpen, setIsRotModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'customers' | 'assistant' | 'preview'>('assistant');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' } | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(0.78);
  const [showManualEditor, setShowManualEditor] = useState(false);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = async (updatedProfile: SenderInfo) => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
      });
      const data = await res.json();
      if (data.success) {
        const savedSender = data.senderProfile || updatedProfile;
        if (currentUser) {
          setCurrentUser({
            ...currentUser,
            senderProfile: savedSender,
            name: savedSender.name || currentUser.name,
          });
        }
        setInvoice((prev) => ({
          ...prev,
          sender: {
            ...prev.sender,
            ...savedSender,
          },
        }));
        setAvailableUsers((prev) =>
          prev.map((u) =>
            u.id === currentUser?.userId
              ? {
                  ...u,
                  name: savedSender.name || u.name,
                  company: savedSender.company,
                  logoUrl: savedSender.logoUrl,
                }
              : u
          )
        );
        showToast('Företagsuppgifter och logotyp sparade!', 'success');
        setIsCompanyModalOpen(false);
      } else {
        showToast(data.error || 'Kunde inte spara företagsuppgifter', 'info');
      }
    } catch {
      showToast('Nätverksfel vid sparande av profil', 'info');
    }
  };

  // Fetch customers from SQLite
  const refreshCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success && Array.isArray(data.customers)) {
        setCustomers(data.customers);
        return;
      }
      showToast(data.error || 'Kunde inte ladda kunder', 'info');
    } catch {
      showToast('Kunde inte ladda kunder från databasen', 'info');
    }
  }, []);

  // Fetch invoices from SQLite
  const refreshInvoices = useCallback(async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      if (data.success && Array.isArray(data.invoices)) {
        setSavedInvoices(data.invoices);
        return;
      }
      showToast(data.error || 'Kunde inte ladda fakturor', 'info');
    } catch {
      showToast('Kunde inte ladda fakturor från databasen', 'info');
    }
  }, []);

  const fetchNextInvoiceNumber = useCallback(
    async (customerNumber?: string, excludeInvoiceId?: string) => {
      try {
        const params = new URLSearchParams({ type: 'invoice' });
        if (customerNumber) params.set('customerNumber', customerNumber);
        if (excludeInvoiceId) params.set('excludeInvoiceId', excludeInvoiceId);
        const res = await fetch(`/api/numbers/next?${params.toString()}`);
        const data = await res.json();
        if (data.success && data.number) return String(data.number);
      } catch (err) {
        console.warn('Could not fetch next invoice number', err);
      }
      return customerNumber ? `${customerNumber}01` : '';
    },
    []
  );

  // Initialize and check session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        setAvailableUsers(data.availableUsers || []);

        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
          setCurrentUser(data.user);

          const nextNumber = await fetchNextInvoiceNumber();
          setInvoice(buildBlankInvoice(nextNumber, data.user.senderProfile));

          // Load data from server DB
          await refreshCustomers();
          await refreshInvoices();
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };

    initAuth();

    if (typeof window !== 'undefined') {
      if (window.innerWidth < 1440 && window.innerWidth >= 1024) {
        setPreviewZoom(0.68);
      } else if (window.innerWidth >= 1440) {
        setPreviewZoom(0.78);
      }
    }
  }, [refreshCustomers, refreshInvoices, fetchNextInvoiceNumber]);

  const handleLoginSuccess = async (user: AuthUser) => {
    setIsAuthenticated(true);
    setCurrentUser(user);

    const nextNumber = await fetchNextInvoiceNumber();
    setInvoice(buildBlankInvoice(nextNumber, user.senderProfile));
    setSelectedCustomerId(undefined);

    await refreshCustomers();
    await refreshInvoices();
    showToast(`Välkommen, ${user.name}!`);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    showToast('Du har loggats ut', 'info');
  };

  const handleInvoiceChange = (updated: InvoiceData) => {
    setInvoice(updated);
  };

  /** Toggle ROT and mark labor rows so the deduction actually appears. */
  const handleToggleRot = (enabled: boolean) => {
    handleInvoiceChange({
      ...invoice,
      enableRot: enabled,
      rotPercent: invoice.rotPercent || 30,
      items: applyRotFlagsToItems(invoice.items, enabled),
    });
    showToast(enabled ? 'ROT aktiverat (30% på arbetskostnad)' : 'ROT avstängt', 'info');
  };

  // Select customer from sidebar
  const handleSelectCustomer = async (customer: SavedCustomer) => {
    setSelectedCustomerId(customer.id);

    const currentNum = (invoice.invoiceNumber || '').trim();
    const looksUnassigned =
      !currentNum || !currentNum.startsWith(customer.customerNumber || '___');

    let invoiceNumber = invoice.invoiceNumber;
    if (looksUnassigned && customer.customerNumber) {
      invoiceNumber = await fetchNextInvoiceNumber(customer.customerNumber, invoice.id);
    }

    const updated: InvoiceData = {
      ...invoice,
      invoiceNumber,
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
        propertyDesignation: customer.propertyDesignation || '',
        housingType: customer.housingType,
        apartmentNumber: customer.apartmentNumber,
        brfOrgNumber: customer.brfOrgNumber,
      },
    };
    handleInvoiceChange(updated);
    showToast(`Kunden ${customer.name} har valts (#${invoiceNumber})`);

    // On mobile, automatically advance to assistant view
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileTab('assistant');
    }
  };

  // Save new or edited customer to SQLite
  const handleSaveCustomer = async (recipient: RecipientInfo & { id?: string }) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipient),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.customers)) {
        setCustomers(data.customers);
        showToast(`Kunden ${recipient.name} har sparats!`);
        return;
      }
      showToast(data.error || 'Kunde inte spara kunden', 'info');
    } catch {
      showToast('Kunde inte spara kunden till databasen', 'info');
    }
  };

  // Delete customer from SQLite
  const handleDeleteCustomer = async (id: string) => {
    try {
      const res = await fetch(`/api/customers?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.customers)) {
        setCustomers(data.customers);
        showToast('Kund borttagen', 'info');
        return;
      }
      showToast(data.error || 'Kunde inte ta bort kunden', 'info');
    } catch {
      showToast('Kunde inte ta bort kunden från databasen', 'info');
    }
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
          propertyDesignation: match.propertyDesignation || '',
          housingType: match.housingType,
          apartmentNumber: match.apartmentNumber,
          brfOrgNumber: match.brfOrgNumber,
        };
      }
    }

    const nextInvoiceNumber =
      data.invoiceNumber && String(data.invoiceNumber).trim()
        ? String(data.invoiceNumber).replace(/\D/g, '')
        : invoice.invoiceNumber;

    const enableRot =
      data.enableRot !== undefined ? Boolean(data.enableRot) : invoice.enableRot;
    const baseItems = data.items && data.items.length > 0 ? data.items : invoice.items;
    const items = applyRotFlagsToItems(baseItems, enableRot);

    // Pure ROT toggle from checkbox — avoid "AI updated" toast noise
    const onlyRotToggle =
      data.enableRot !== undefined &&
      Object.keys(data).every((k) => k === 'enableRot' || k === 'rotPercent');

    const updated: InvoiceData = {
      ...invoice,
      ...data,
      enableRot,
      rotPercent: data.rotPercent || invoice.rotPercent || 30,
      invoiceNumber: nextInvoiceNumber,
      customerNumber: newCustomerNumber,
      yourReference: newYourRef,
      recipient: newRecipient,
      projectTitle: data.projectTitle || invoice.projectTitle,
      projectDates: data.projectDates || invoice.projectDates,
      items,
    };
    handleInvoiceChange(updated);

    if (onlyRotToggle) {
      showToast(enableRot ? 'ROT aktiverat (30% på arbetskostnad)' : 'ROT avstängt', 'info');
    } else {
      showToast(
        data.invoiceNumber
          ? `Fakturanummer uppdaterat till #${nextInvoiceNumber}`
          : 'Fakturan uppdaterades av AI:n!'
      );
    }

    // On mobile, show preview tab to see results
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileTab('preview');
    }
  };

  // Reset invoice - completely clear but keep allocated number
  const handleResetInvoice = () => {
    setInvoice(buildBlankInvoice(invoice.invoiceNumber || '', currentUser?.senderProfile));
    setSelectedCustomerId(undefined);
    showToast('Fakturan tömdes helt', 'info');
  };

  // Next invoice - persist current draft then allocate a unique number from DB
  const handleNextInvoice = async () => {
    const hasContent =
      Boolean(invoice.recipient?.name?.trim()) ||
      (invoice.items && invoice.items.length > 0) ||
      Boolean(invoice.projectTitle?.trim());

    if (hasContent && invoice.invoiceNumber?.trim()) {
      try {
        const res = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invoice),
        });
        const data = await res.json();
        if (!data.success) {
          showToast(data.error || 'Kunde inte spara innan ny faktura', 'info');
          return;
        }
        await refreshInvoices();
      } catch {
        showToast('Kunde inte spara innan ny faktura', 'info');
        return;
      }
    }

    const nextNumber = await fetchNextInvoiceNumber(
      invoice.customerNumber || invoice.recipient?.customerNumber || undefined
    );
    setInvoice(buildBlankInvoice(nextNumber, currentUser?.senderProfile));
    setSelectedCustomerId(undefined);
    showToast(nextNumber ? `Ny faktura skapad (#${nextNumber})` : 'Ny faktura skapad');
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    const previousTab = mobileTab;
    // Ensure the A4 preview is mounted/visible before html2canvas runs
    if (mobileTab !== 'preview') {
      setMobileTab('preview');
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    const cleanCustomerName = (invoice.recipient.name || 'Kund').replace(/[^a-zA-Z0-9åäöÅÄÖ_-]/g, '_');
    const filename = `Faktura_${invoice.invoiceNumber || 'utkast'}_${cleanCustomerName}.pdf`;

    showToast('Genererar skarp PDF...', 'info');
    const success = await downloadPdfDirectly('invoice-sheet', filename);
    setIsDownloadingPdf(false);
    if (previousTab !== 'preview') {
      setMobileTab(previousTab);
    }
    if (success) {
      showToast(`PDF sparad: ${filename}`);
    }
  };

  // Save invoice to SQLite
  const handleSaveInvoice = async () => {
    if (!invoice.invoiceNumber?.trim()) {
      showToast('Ange ett fakturanummer innan du sparar', 'info');
      return;
    }

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice),
      });
      const data = await res.json();
      if (data.success) {
        await refreshInvoices();
        showToast(`Faktura #${invoice.invoiceNumber} sparades!`);
        return;
      }
      showToast(data.error || 'Kunde inte spara fakturan', 'info');
    } catch {
      showToast('Kunde inte spara fakturan till databasen', 'info');
    }
  };

  // Delete invoice from SQLite
  const handleDeleteSavedInvoice = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await refreshInvoices();
        showToast('Faktura raderad', 'info');
        return;
      }
      showToast(data.error || 'Kunde inte radera fakturan', 'info');
    } catch {
      showToast('Kunde inte radera fakturan från databasen', 'info');
    }
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

      {/* PIN Login Screen when not logged in */}
      {isAuthenticated === false && (
        <PinLoginModal availableUsers={availableUsers} onLoginSuccess={handleLoginSuccess} />
      )}

      {/* Main Responsive Header */}
      <Header
        invoiceNumber={invoice.invoiceNumber}
        recipientName={invoice.recipient.name}
        userName={currentUser?.name}
        companyName={currentUser?.senderProfile?.company || invoice.sender.company}
        logoUrl={currentUser?.senderProfile?.logoUrl ?? invoice.sender.logoUrl}
        onOpenCompanySettings={() => setIsCompanyModalOpen(true)}
        isRotEnabled={invoice.enableRot}
        onOpenRotModal={() => setIsRotModalOpen(true)}
        onLogout={handleLogout}
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
          <strong>Lokal AI-fakturering med SQLite:</strong> All data synkas permanent till din dator. Välj kund till vänster, klistra in underlag i AI-rutan och se A4-fakturan räknas ut direkt.
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

              {/* ROT Toggle, ROT File Export, Zoom & Quick manual toggle */}
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
                    onChange={(e) => handleToggleRot(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                  />
                  <span>ROT (30%)</span>
                </label>

                {invoice.enableRot && (
                  <button
                    type="button"
                    onClick={() => setIsRotModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600 shadow-xs transition-all cursor-pointer animate-in fade-in"
                    title="Skapa Skatteverket XML för denna ROT-faktura"
                  >
                    <FileCode2 className="w-3 h-3 text-emerald-200" />
                    <span>ROT på fil</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowManualEditor(!showManualEditor)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                    showManualEditor
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title="Öppna redigeraren för att ändra rader, antal, priser och fasta belopp"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>{showManualEditor ? 'Dölj redigerare' : `Redigera rader & fält (${invoice.items.length})`}</span>
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
              <div className="w-full bg-white border border-slate-200 rounded-xl p-3.5 mb-3 shadow-xs text-xs space-y-3 animate-in fade-in duration-150">
                <div className="font-bold text-slate-800 pb-1.5 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Snabbjustera fakturauppgifter & rader</span>
                    <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">Ändras live på fakturan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={invoice.enableRot}
                        onChange={(e) => handleToggleRot(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500"
                      />
                      <span>ROT (30%)</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsCompanyModalOpen(true)}
                      className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                    >
                      <Building2 className="w-3 h-3 text-amber-500" />
                      <span>Företagsinfo & logga</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600">Fakturanummer / OCR:</label>
                    <input
                      type="text"
                      value={invoice.invoiceNumber || ''}
                      onChange={(e) =>
                        handleInvoiceChange({
                          ...invoice,
                          invoiceNumber: e.target.value.replace(/[^\d]/g, ''),
                        })
                      }
                      placeholder="t.ex. 6002"
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50 focus:bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600">Projektnamn:</label>
                    <input
                      type="text"
                      value={invoice.projectTitle || ''}
                      onChange={(e) => handleInvoiceChange({ ...invoice, projectTitle: e.target.value })}
                      placeholder="t.ex. Kaminmontering"
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600">Projektperiod / Datum:</label>
                    <input
                      type="text"
                      value={invoice.projectDates || ''}
                      onChange={(e) => handleInvoiceChange({ ...invoice, projectDates: e.target.value })}
                      placeholder="t.ex. Utförda 2026-11-02"
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Interactive Invoice Items Editor */}
                <div className="pt-2 border-t border-slate-100">
                  <InvoiceItemsEditor
                    items={invoice.items}
                    enableRot={invoice.enableRot}
                    onChangeItems={(updatedItems) => handleInvoiceChange({ ...invoice, items: updatedItems })}
                  />
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
                <InvoicePreview
                  invoice={invoice}
                  onOpenEditor={() => setShowManualEditor(true)}
                />
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
          setSelectedCustomerId(undefined);
          showToast(`Laddade faktura #${selected.invoiceNumber || 'utkast'}`);
        }}
        onDeleteInvoice={handleDeleteSavedInvoice}
      />

      {/* Skatteverket ROT XML Export Modal */}
      <RotExportModal
        isOpen={isRotModalOpen}
        onClose={() => setIsRotModalOpen(false)}
        invoice={invoice}
        onUpdateInvoice={(updated) => handleInvoiceChange(updated)}
        onSuccessToast={(msg) => showToast(msg, 'success')}
      />

      {/* Company Settings & Logo Modal */}
      {currentUser?.senderProfile && (
        <CompanySettingsModal
          isOpen={isCompanyModalOpen}
          onClose={() => setIsCompanyModalOpen(false)}
          senderProfile={currentUser.senderProfile}
          onSaveProfile={handleSaveProfile}
          userName={currentUser.name}
        />
      )}
    </div>
  );
}
