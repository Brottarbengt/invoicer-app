'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Delete, UserPlus, Check, X, Shield, ArrowRight, Smartphone } from 'lucide-react';

interface PublicUser {
  id: string;
  name: string;
  company: string;
  logoUrl?: string;
}

interface PinLoginModalProps {
  availableUsers: PublicUser[];
  onLoginSuccess: (user: any) => void;
}

export const PinLoginModal: React.FC<PinLoginModalProps> = ({ availableUsers, onLoginSuccess }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(availableUsers[0]?.id || 'karl');
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newPersonNum, setNewPersonNum] = useState('');
  const [newPin, setNewPin] = useState('');
  const [registerError, setRegisterError] = useState<string | null>(null);

  useEffect(() => {
    if (availableUsers.length > 0 && !selectedUserId) {
      setSelectedUserId(availableUsers[0].id);
    }
  }, [availableUsers, selectedUserId]);

  // Handle keyboard typing for PIN
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isRegisterOpen) return;
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 6) {
          setError(null);
          setPin((prev) => prev + e.key);
        }
      } else if (e.key === 'Backspace') {
        setError(null);
        setPin((prev) => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        if (pin.length >= 4) {
          submitPin(pin);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isRegisterOpen, selectedUserId]);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      setError(null);
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        submitPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setError(null);
    setPin('');
  };

  const submitPin = async (codeToSubmit: string) => {
    if (!selectedUserId || codeToSubmit.length < 4) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, pin: codeToSubmit }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'Fel PIN-kod');
        setPin('');
      }
    } catch {
      setError('Kunde inte ansluta till servern');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newPin.length < 4) {
      setRegisterError('Ange namn och minst 4 siffror i PIN');
      return;
    }

    setIsLoading(true);
    setRegisterError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          companyName: newCompany.trim(),
          personNumber: newPersonNum.trim(),
          pin: newPin,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsRegisterOpen(false);
        // Refresh users
        window.location.reload();
      } else {
        setRegisterError(data.error || 'Kunde inte skapa användare');
      }
    } catch {
      setRegisterError('Nätverksfel vid registrering');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedUser = availableUsers.find((u) => u.id === selectedUserId) || availableUsers[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-5 pb-3 text-center bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-xl mx-auto mb-2.5 shadow-md shadow-red-500/20">
            KW
          </div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">KW&apos;s Bygg Fakturering</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Ange PIN-kod för att logga in</p>

          {/* User selector */}
          {availableUsers.length > 1 ? (
            <div className="mt-3 flex items-center justify-center gap-1.5 overflow-x-auto pb-1">
              {availableUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setSelectedUserId(u.id);
                    setPin('');
                    setError(null);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    selectedUserId === u.id
                      ? 'bg-red-50 text-red-700 border-red-300 ring-2 ring-red-400/30'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {u.name}
                </button>
              ))}
            </div>
          ) : selectedUser ? (
            <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200 text-xs font-semibold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{selectedUser.name}</span>
              <span className="text-slate-400 font-normal">({selectedUser.company})</span>
            </div>
          ) : null}
        </div>

        {/* PIN Dots display */}
        <div className="py-4 text-center">
          <div className="flex items-center justify-center gap-3">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  pin.length > idx
                    ? 'bg-red-600 scale-110 shadow-xs'
                    : 'bg-slate-200 border-2 border-slate-300'
                }`}
              />
            ))}
          </div>

          {error ? (
            <p className="text-[11px] font-bold text-red-600 mt-2.5 animate-shake">{error}</p>
          ) : (
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Standard-PIN är 1234</p>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                className="h-13 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-xl transition-colors flex items-center justify-center cursor-pointer border border-slate-200/80 shadow-2xs select-none"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="h-13 rounded-2xl text-slate-400 hover:text-slate-600 text-xs font-semibold flex items-center justify-center cursor-pointer select-none"
            >
              Rensa
            </button>

            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-13 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-xl transition-colors flex items-center justify-center cursor-pointer border border-slate-200/80 shadow-2xs select-none"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="h-13 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer border border-slate-200/80 shadow-2xs select-none"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Footer info & Add user / Future BankID */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center space-y-2">
          <div className="text-[10.5px] text-slate-400 flex items-center justify-center gap-1 font-medium">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sparar session i 30 dagar på denna enhet</span>
          </div>

          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-red-600" />
              <span>Ny användare</span>
            </button>

            <span className="text-slate-300">•</span>

            <span
              title="Arkitekturen är förberedd för personnummer och BankID-integration"
              className="text-[10.5px] text-slate-400 inline-flex items-center gap-1 cursor-help"
            >
              <Smartphone className="w-3 h-3 text-slate-400" />
              <span>BankID (förberedd)</span>
            </span>
          </div>
        </div>
      </div>

      {/* New User Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-red-600" />
                Lägg till användare
              </h3>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Namn *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="t.ex. Nils Westergren"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Företagsnamn</label>
                <input
                  type="text"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="t.ex. Annefors Snickeri AB"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Personnummer (för BankID)</label>
                <input
                  type="text"
                  value={newPersonNum}
                  onChange={(e) => setNewPersonNum(e.target.value)}
                  placeholder="19790118-7554"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">PIN-kod (4-6 siffror) *</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="****"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono text-center text-sm"
                />
              </div>

              {registerError && (
                <p className="text-[11px] font-bold text-red-600">{registerError}</p>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Skapa konto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
