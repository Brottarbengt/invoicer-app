'use client';

import React from 'react';
import {
  Download,
  FileCheck,
  FolderOpen,
  Printer,
  PlusCircle,
  RotateCcw,
  Save,
  Eye,
  Edit3,
} from 'lucide-react';

interface HeaderProps {
  onPrint: () => void;
  onDownloadPdf: () => void;
  onNextInvoice: () => void;
  onResetToSample: () => void;
  onSaveInvoice: () => void;
  onOpenSavedModal: () => void;
  savedCount: number;
  mobileView: 'editor' | 'preview';
  onToggleMobileView: () => void;
  isDownloadingPdf: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onPrint,
  onDownloadPdf,
  onNextInvoice,
  onResetToSample,
  onSaveInvoice,
  onOpenSavedModal,
  savedCount,
  mobileView,
  onToggleMobileView,
  isDownloadingPdf,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800 no-print">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center font-black text-lg text-white shadow-inner">
            F
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white">
                Modern Fakturamall
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-semibold bg-red-950 text-red-300 border border-red-800/80 px-2 py-0.5 rounded-full">
                Svensk standard
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Ersätter den gamla Visma-mallen med automatisk beräkning, kundregister & A4-anpassning
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mobile toggle */}
          <button
            type="button"
            onClick={onToggleMobileView}
            className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium"
          >
            {mobileView === 'editor' ? (
              <>
                <Eye className="w-3.5 h-3.5 text-red-400" />
                <span>Förhandsgranska</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                <span>Redigera</span>
              </>
            )}
          </button>

          {/* Quick presets */}
          <button
            type="button"
            onClick={onResetToSample}
            title="Ladda Karl Westergrens exempel från din bifogade PDF"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Exempel: Faktura 0120</span>
          </button>

          <button
            type="button"
            onClick={onNextInvoice}
            title="Skapa nästa faktura (ökar fakturanummer automatiskt)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Ny faktura (+1)</span>
          </button>

          <button
            type="button"
            onClick={onSaveInvoice}
            title="Spara fakturan lokalt"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Spara</span>
          </button>

          <button
            type="button"
            onClick={onOpenSavedModal}
            title="Se sparade fakturor"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Sparade ({savedCount})</span>
          </button>

          {/* Download project source zip */}
          <a
            href="/invoicer-project.zip"
            download="invoicer-project.zip"
            title="Ladda ner hela projektet som en ZIP-fil"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold border border-emerald-600 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-200" />
            <span className="hidden sm:inline">Ladda ner ZIP</span>
          </a>

          {/* Primary export buttons */}
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold border border-slate-600 transition-all shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-red-300" />
            <span>{isDownloadingPdf ? 'Skapar PDF...' : 'Ladda ner PDF'}</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm ring-1 ring-red-400"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Skriv ut / Spara PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};
