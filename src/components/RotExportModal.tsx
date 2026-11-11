'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { InvoiceData, RotWorkCategory, ROT_WORK_CATEGORY_LABELS } from '@/types/invoice';
import { calculateInvoice, formatSEK } from '@/utils/calculations';
import {
  extractRotArendeData,
  generateRotXmlString,
  triggerXmlDownload,
  RotValidationIssue,
} from '@/utils/rotXmlExport';
import {
  validatePersonnummer,
  validatePaymentDate,
  validatePropertyDesignation,
  validateApartmentNumber,
  validateBrfOrgNumber,
} from '@/utils/rotValidation';
import {
  FileCode2,
  X,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Home,
  Building,
  User,
  ShieldCheck,
  Download,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

interface RotExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData;
  onUpdateInvoice: (updated: InvoiceData) => void;
  onSuccessToast: (message: string) => void;
}

export const RotExportModal: React.FC<RotExportModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onUpdateInvoice,
  onSuccessToast,
}) => {
  // Form states initialized from invoice
  const [paymentDate, setPaymentDate] = useState<string>(invoice.paymentDate || '');
  const [personNumber, setPersonNumber] = useState<string>(invoice.recipient?.orgOrPersonNumber || '');
  const [housingType, setHousingType] = useState<'property' | 'coop'>(
    invoice.recipient?.housingType ||
      (invoice.recipient?.apartmentNumber || invoice.recipient?.brfOrgNumber ? 'coop' : 'property')
  );
  const [propertyDesignation, setPropertyDesignation] = useState<string>(
    invoice.recipient?.propertyDesignation || ''
  );
  const [apartmentNumber, setApartmentNumber] = useState<string>(
    invoice.recipient?.apartmentNumber || ''
  );
  const [brfOrgNumber, setBrfOrgNumber] = useState<string>(invoice.recipient?.brfOrgNumber || '');
  const [workCategory, setWorkCategory] = useState<RotWorkCategory>(
    invoice.rotWorkCategory || 'Bygg'
  );

  // Sync state when modal opens or invoice changes
  useEffect(() => {
    if (isOpen) {
      const todayStr = new Date().toISOString().split('T')[0];
      setPaymentDate(invoice.paymentDate || todayStr);
      setPersonNumber(invoice.recipient?.orgOrPersonNumber || '');
      setHousingType(
        invoice.recipient?.housingType ||
          (invoice.recipient?.apartmentNumber || invoice.recipient?.brfOrgNumber ? 'coop' : 'property')
      );
      setPropertyDesignation(invoice.recipient?.propertyDesignation || '');
      setApartmentNumber(invoice.recipient?.apartmentNumber || '');
      setBrfOrgNumber(invoice.recipient?.brfOrgNumber || '');
      setWorkCategory(invoice.rotWorkCategory || 'Bygg');
    }
  }, [isOpen, invoice]);

  // Create temporary updated invoice object for live validation & calculation
  const tempInvoice: InvoiceData = useMemo(() => {
    return {
      ...invoice,
      paymentDate,
      rotWorkCategory: workCategory,
      recipient: {
        ...invoice.recipient,
        orgOrPersonNumber: personNumber,
        housingType,
        propertyDesignation: housingType === 'property' ? propertyDesignation : undefined,
        apartmentNumber: housingType === 'coop' ? apartmentNumber : undefined,
        brfOrgNumber: housingType === 'coop' ? brfOrgNumber : undefined,
      },
    };
  }, [
    invoice,
    paymentDate,
    workCategory,
    personNumber,
    housingType,
    propertyDesignation,
    apartmentNumber,
    brfOrgNumber,
  ]);

  const { arende, issues } = useMemo(() => {
    return extractRotArendeData(tempInvoice, paymentDate);
  }, [tempInvoice, paymentDate]);

  const calc = useMemo(() => calculateInvoice(invoice), [invoice]);

  if (!isOpen) return null;

  const paymentYear = parseInt(paymentDate.split('-')[0], 10) || new Date().getFullYear();
  const pnrVal = validatePersonnummer(personNumber, paymentYear);
  const dateVal = validatePaymentDate(paymentDate);

  const canExport = issues.length === 0 && Boolean(arende);

  const handleExport = () => {
    if (!arende || issues.length > 0) return;

    try {
      // 1. Persist the ROT parameters to the invoice state
      onUpdateInvoice(tempInvoice);

      // 2. Generate XML string
      const batchName = `ROT ${paymentYear}`;
      const xmlString = generateRotXmlString([arende], batchName);

      // 3. Trigger download
      const safeInvoiceNr = (invoice.invoiceNumber || 'utkast').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Begaran_ROT_${safeInvoiceNr}_${paymentDate}.xml`;
      triggerXmlDownload(xmlString, filename);

      onSuccessToast(`ROT XML-fil för Skatteverket nedladdad: ${filename}`);
      onClose();
    } catch (err: any) {
      alert(`Kunde inte generera XML: ${err.message || 'Okänt fel'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-xs">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">ROT på fil – Skatteverket XML</h2>
              <p className="text-[11px] text-slate-300">
                Begäran om utbetalning enligt officiellt schema v6.0
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* NOTICE: Payment Date is mandatory */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong>Ange datumet kunden betalade fakturan.</strong>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Skatteverket kräver att betalningsdatum anges per ärende och att datumet inte är i
                framtiden.
              </p>
            </div>
          </div>

          {/* SECTION 1: BETALNINGSDATUM */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-red-600" />
                <span>Kundens betalningsdatum (ÅÅÅÅ-MM-DD) *</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentDate(new Date().toISOString().split('T')[0])}
                  className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-700 text-[10.5px] font-semibold border border-slate-200 cursor-pointer"
                >
                  Idag
                </button>
                {invoice.invoiceDate && (
                  <button
                    type="button"
                    onClick={() => setPaymentDate(invoice.invoiceDate)}
                    className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-700 text-[10.5px] font-semibold border border-slate-200 cursor-pointer"
                  >
                    Fakturadatum
                  </button>
                )}
              </div>
            </div>

            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
            {!dateVal.valid && (
              <p className="text-[11px] font-bold text-red-600">{dateVal.error}</p>
            )}
          </div>

          {/* SECTION 2: KÖPARENS PERSONNUMMER */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-red-600" />
                <span>Köparens personnummer (12 siffror) *</span>
              </label>
              {pnrVal.valid && pnrVal.pnr12 && (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Format: {pnrVal.pnr12}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  required
                  value={personNumber}
                  onChange={(e) => setPersonNumber(e.target.value)}
                  placeholder="t.ex. 19700526-1578"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
              <div className="flex items-center text-slate-600 text-[11px] font-medium">
                Mottagare: <strong className="ml-1 text-slate-900">{invoice.recipient?.name || 'Ej angiven'}</strong>
              </div>
            </div>

            {!pnrVal.valid && personNumber && (
              <p className="text-[11px] font-bold text-red-600">{pnrVal.error}</p>
            )}
          </div>

          {/* SECTION 3: BOSTADSTYP & BETECKNING */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>Bostadstyp för ROT *</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHousingType('property')}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    housingType === 'property'
                      ? 'bg-red-600 text-white border-red-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Småhus / Fastighet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHousingType('coop')}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    housingType === 'coop'
                      ? 'bg-red-600 text-white border-red-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Bostadsrätt</span>
                </button>
              </div>
            </div>

            {housingType === 'property' ? (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Fastighetsbeteckning (max 40 tecken) *
                </label>
                <input
                  type="text"
                  required
                  value={propertyDesignation}
                  onChange={(e) => setPropertyDesignation(e.target.value)}
                  placeholder="t.ex. BOLLNÄS SÄVERSTA 1:1 eller ÖSTBY 8:46"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 uppercase"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    BRF Organisationsnummer *
                  </label>
                  <input
                    type="text"
                    required
                    value={brfOrgNumber}
                    onChange={(e) => setBrfOrgNumber(e.target.value)}
                    placeholder="t.ex. 716400-1234"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Lägenhetsnummer (4 siffror) *
                  </label>
                  <input
                    type="text"
                    required
                    value={apartmentNumber}
                    onChange={(e) => setApartmentNumber(e.target.value)}
                    placeholder="t.ex. 1201"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: ARBETSKATEGORI */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <label className="font-bold text-slate-800 block">
              Skatteverkets arbetskategori för ROT
            </label>
            <select
              value={workCategory}
              onChange={(e) => setWorkCategory(e.target.value as RotWorkCategory)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer"
            >
              {Object.entries(ROT_WORK_CATEGORY_LABELS).map(([catKey, label]) => (
                <option key={catKey} value={catKey}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* SECTION 5: SUMMERING FÖR SKATTEVERKET */}
          {arende && (
            <div className="border border-emerald-200 bg-emerald-50/60 rounded-xl p-4 space-y-2">
              <div className="font-bold text-emerald-950 flex items-center justify-between pb-1.5 border-b border-emerald-200">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Summering som exporteras till XML</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-800">
                  Faktura #{arende.invoiceNumber}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-[11.5px]">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                    Arbetskostnad (inkl. moms)
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatSEK(arende.laborCostIncVat)} kr
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 uppercase block font-semibold">
                    Begärt belopp (30%)
                  </span>
                  <span className="font-extrabold text-emerald-800 text-sm">
                    {formatSEK(arende.requestedRotAmount)} kr
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                    Köparens betalda del
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatSEK(arende.buyerPaidAmount)} kr
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                    Arbetade timmar
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {arende.laborHours} tim
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                    Materialkostnad
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatSEK(arende.materialCostIncVat)} kr
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                    Övrig kostnad (bil/resor)
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatSEK(arende.otherCostIncVat)} kr
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* VALIDATION WARNINGS IF ANY */}
          {issues.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 space-y-1.5 text-red-900">
              <div className="font-bold flex items-center gap-1.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Åtgärda följande för att Skatteverket ska godkänna filen:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-800 pl-1">
                {issues.map((iss, i) => (
                  <li key={i}>{iss.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200/80 rounded-xl font-semibold transition-colors cursor-pointer text-xs"
          >
            Avbryt
          </button>

          <button
            type="button"
            disabled={!canExport}
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Skapa och ladda ner ROT XML</span>
          </button>
        </div>
      </div>
    </div>
  );
};
