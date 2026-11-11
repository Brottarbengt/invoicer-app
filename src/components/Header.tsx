'use client';

import React from 'react';
import {
  Download,
  FolderOpen,
  Printer,
  PlusCircle,
  Save,
  Users,
  Sparkles,
  FileCheck2,
  FileCode2,
} from 'lucide-react';

interface HeaderProps {
  invoiceNumber: string;
  recipientName: string;
  userName?: string;
  companyName?: string;
  isRotEnabled?: boolean;
  onOpenRotModal?: () => void;
  onLogout?: () => void;
  onPrint: () => void;
  onDownloadPdf: () => void;
  onNextInvoice: () => void;
  onSaveInvoice: () => void;
  onOpenSavedModal: () => void;
  savedCount: number;
  isDownloadingPdf: boolean;
  activeMobileTab: 'customers' | 'assistant' | 'preview';
  onSelectMobileTab: (tab: 'customers' | 'assistant' | 'preview') => void;
}

export const Header: React.FC<HeaderProps> = ({
  invoiceNumber,
  recipientName,
  userName,
  companyName,
  isRotEnabled,
  onOpenRotModal,
  onLogout,
  onPrint,
  onDownloadPdf,
  onNextInvoice,
  onSaveInvoice,
  onOpenSavedModal,
  savedCount,
  isDownloadingPdf,
  activeMobileTab,
  onSelectMobileTab,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800 no-print">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Active Invoice info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-black text-sm text-white shadow-xs">
            KW
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white">
                KW&apos;s Bygg Fakturering
              </h1>
              <span className="text-[10px] font-mono font-bold bg-slate-800 text-red-400 border border-slate-700 px-2 py-0.5 rounded-full">
                #{invoiceNumber || '6101'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[220px] sm:max-w-none">
              Mottagare: <span className="text-slate-200 font-semibold">{recipientName || 'Ingen vald'}</span>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            type="button"
            onClick={onNextInvoice}
            title="Skapa ny faktura (ökar numret)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Ny faktura</span>
          </button>

          <button
            type="button"
            onClick={onSaveInvoice}
            title="Spara fakturan i lokal historik"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Spara</span>
          </button>

          <button
            type="button"
            onClick={onOpenSavedModal}
            title="Se sparade fakturor"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Arkiv ({savedCount})</span>
          </button>

          {isRotEnabled && onOpenRotModal && (
            <button
              type="button"
              onClick={onOpenRotModal}
              title="Exportera godkänd XML-fil för ROT-utbetalning hos Skatteverket"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs border border-emerald-600 cursor-pointer animate-in fade-in"
            >
              <FileCode2 className="w-3.5 h-3.5 text-emerald-200" />
              <span>ROT på fil</span>
            </button>
          )}

          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-red-400" />
            <span>{isDownloadingPdf ? 'Skapar PDF...' : 'Ladda ner PDF'}</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Skriv ut / Spara</span>
          </button>

          {userName && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title={`Inloggad som ${userName}. Klicka för att byta användare eller logga ut.`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="hidden xl:inline">{userName}</span>
              <span className="text-[10px] text-slate-400">(Logga ut)</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Tab Navigation Bar (Under 1024px) */}
      <div className="lg:hidden flex items-center border-t border-slate-800 bg-slate-950 text-xs">
        <button
          type="button"
          onClick={() => onSelectMobileTab('customers')}
          className={`flex-1 py-2 text-center font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            activeMobileTab === 'customers'
              ? 'border-red-500 text-white bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Kunder</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMobileTab('assistant')}
          className={`flex-1 py-2 text-center font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            activeMobileTab === 'assistant'
              ? 'border-red-500 text-white bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
          <span>AI Assistent</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMobileTab('preview')}
          className={`flex-1 py-2 text-center font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            activeMobileTab === 'preview'
              ? 'border-red-500 text-white bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Faktura A4</span>
        </button>
      </div>
    </header>
  );
};
