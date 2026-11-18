'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Trash2,
  Building2,
  FileText,
  CreditCard,
  Check,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { SenderInfo } from '@/types/invoice';
import { processImageFile } from '@/utils/image';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderProfile: SenderInfo;
  onSaveProfile: (updatedProfile: SenderInfo) => Promise<void>;
  userName?: string;
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({
  isOpen,
  onClose,
  senderProfile,
  onSaveProfile,
  userName,
}) => {
  const [formData, setFormData] = useState<SenderInfo>({ ...senderProfile });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...senderProfile });
      setError(null);
    }
  }, [isOpen, senderProfile]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vänligen välj en giltig bildfil (PNG, JPG, SVG, WebP)');
      return;
    }

    try {
      const dataUrl = await processImageFile(file);
      setFormData((prev) => ({
        ...prev,
        logoUrl: dataUrl,
      }));
      setError(null);
    } catch {
      setError('Kunde inte läsa in bilden. Försök med en annan fil.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logoUrl: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await onSaveProfile(formData);
    } catch (err: any) {
      setError(err?.message || 'Ett fel uppstod när uppgifterna skulle sparas.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center border border-amber-500/20">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Företagsuppgifter & Logotyp
              </h2>
              <p className="text-[11px] text-slate-500">
                Inställningar för {formData.company || userName || 'ditt konto'} – visas på fakturan och i sidhuvudet
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SECTION 1: LOGOTYP */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-700" />
                <span className="font-bold text-slate-800 text-xs">Logotyp / Sidhuvud</span>
              </div>
              <span className="text-[10.5px] text-slate-400">
                {formData.logoUrl ? 'Egen logotyp aktiv' : 'Endast text aktiv'}
              </span>
            </div>

            {formData.logoUrl ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-24 h-14 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.logoUrl}
                      alt="Förhandsgranskning"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-xs">Aktiv logotyp</div>
                    <div className="text-[10.5px] text-slate-500">
                      Visas i sidhuvudet och högst upp till vänster på dina fakturor.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleFileChange}
                    className="hidden"
                    id="logo-upload-input"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] border border-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Byt bild</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg text-[11px] border border-red-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    title="Ta bort logotypen och använd endast text"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Använd endast text</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white border border-dashed border-slate-300 rounded-xl text-center space-y-2">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-600 mb-1">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="font-bold text-slate-800 text-xs">
                  Ingen logga vald – ditt företagsnamn visas med snygg text
                </div>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  På fakturan och i sidhuvudet visas &quot;{formData.company || formData.name || 'Ditt företagsnamn'}&quot; i stilren typografi. Vill du ha en egen logga kan du ladda upp en bildfil.
                </p>

                <div className="pt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleFileChange}
                    className="hidden"
                    id="logo-upload-input-empty"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ladda upp logotyp (PNG, JPG, SVG)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: GRUNDUPPGIFTER */}
          <div className="space-y-3">
            <div className="font-bold text-slate-800 text-xs pb-1 border-b border-slate-100 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Företagsinformation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Företagsnamn / Firma *</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="t.ex. Nils Bygg & Snickeri AB"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ditt namn / Avsändare</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="t.ex. Nils Westergren"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gatuadress</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="t.ex. Storgatan 12"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Postnummer och Ort</label>
                <input
                  type="text"
                  value={formData.zipAndCity}
                  onChange={(e) => setFormData({ ...formData, zipAndCity: e.target.value })}
                  placeholder="t.ex. 821 41 Bollnäs"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Telefonnummer</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="t.ex. 070-123 45 67"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">E-postadress</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="t.ex. kontakt@mittforetag.se"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: SKATT & REGISTRERING */}
          <div className="space-y-3">
            <div className="font-bold text-slate-800 text-xs pb-1 border-b border-slate-100 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Organisationsnummer & Skatt</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Org.nr / Personnummer</label>
                <input
                  type="text"
                  value={formData.orgNumber}
                  onChange={(e) => setFormData({ ...formData, orgNumber: e.target.value })}
                  placeholder="t.ex. 556123-4567"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Momsnr (VAT)</label>
                <input
                  type="text"
                  value={formData.vatNumber}
                  onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                  placeholder="t.ex. SE556123456701"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">F-skatt status</label>
                <select
                  value={formData.taxStatus}
                  onChange={(e) => setFormData({ ...formData, taxStatus: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-xs"
                >
                  <option value="Godkänd för F-skatt">Godkänd för F-skatt</option>
                  <option value="Innehar F-skattsedel">Innehar F-skattsedel</option>
                  <option value="Ej godkänd för F-skatt">Ej godkänd för F-skatt</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 4: BETALNINGSUPPGIFTER */}
          <div className="space-y-3">
            <div className="font-bold text-slate-800 text-xs pb-1 border-b border-slate-100 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              <span>Betalningsuppgifter</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bankgiro</label>
                <input
                  type="text"
                  value={formData.bankgiro}
                  onChange={(e) => setFormData({ ...formData, bankgiro: e.target.value })}
                  placeholder="t.ex. 5227-5153"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plusgiro</label>
                <input
                  type="text"
                  value={formData.plusgiro}
                  onChange={(e) => setFormData({ ...formData, plusgiro: e.target.value })}
                  placeholder="valfritt"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bankkonto (clearing & kontonr)</label>
                <input
                  type="text"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  placeholder="t.ex. 8105-9, 123 456 789-0"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Sparar...' : 'Spara ändringar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
