'use client';

import React from 'react';
import { InvoiceData } from '@/types/invoice';
import { calculateInvoice, formatSEK } from '@/utils/calculations';
import { Clock, Copy, FileText, Trash2, X } from 'lucide-react';

interface SavedInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: InvoiceData[];
  onSelectInvoice: (invoice: InvoiceData) => void;
  onDeleteInvoice: (id: string) => void;
}

export const SavedInvoicesModal: React.FC<SavedInvoicesModalProps> = ({
  isOpen,
  onClose,
  invoices,
  onSelectInvoice,
  onDeleteInvoice,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600" />
            <h2 className="font-bold text-slate-800 text-sm">Sparade Fakturor ({invoices.length})</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Du har inga sparade fakturor än. Klicka på &quot;Spara&quot; i toppmenyn för att spara en faktura.
            </div>
          ) : (
            invoices.map((inv) => {
              const calc = calculateInvoice(inv);
              return (
                <div
                  key={inv.id || inv.invoiceNumber}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all bg-white"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        #{inv.invoiceNumber || 'Utan nummer'}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {inv.recipient.name || inv.recipient.company || 'Ingen kund angiven'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {inv.invoiceDate || '—'}
                      </span>
                      <span>·</span>
                      <span>Förfaller: {inv.dueDate || '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        {formatSEK(calc.totalToPay)} {inv.currency}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {inv.items.length} rader
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onSelectInvoice(inv);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    >
                      Öppna
                    </button>

                    <button
                      onClick={() => onDeleteInvoice(inv.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Radera faktura"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};
