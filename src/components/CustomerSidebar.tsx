'use client';

import React, { useState, useMemo } from 'react';
import { RecipientInfo, SavedCustomer } from '@/types/invoice';
import {
  Search,
  UserPlus,
  Home,
  Phone,
  Mail,
  Check,
  Trash2,
  Edit2,
  X,
  Users,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface CustomerSidebarProps {
  customers: SavedCustomer[];
  selectedCustomerId?: string;
  currentRecipient: RecipientInfo;
  onSelectCustomer: (customer: SavedCustomer) => void;
  onSaveCustomer: (customer: RecipientInfo, notes?: string) => void;
  onDeleteCustomer: (id: string) => void;
}

export const CustomerSidebar: React.FC<CustomerSidebarProps> = ({
  customers,
  selectedCustomerId,
  currentRecipient,
  onSelectCustomer,
  onSaveCustomer,
  onDeleteCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<SavedCustomer | null>(null);

  // Form state for creating / editing customer
  const [formName, setFormName] = useState('');
  const [formCustomerNumber, setFormCustomerNumber] = useState('');
  const [formOrgOrPersonNumber, setFormOrgOrPersonNumber] = useState('');
  const [formPropertyDesignation, setFormPropertyDesignation] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formZipAndCity, setFormZipAndCity] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Live filtering
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const matchName = c.name?.toLowerCase().includes(q);
      const matchCompany = c.company?.toLowerCase().includes(q);
      const matchCustNum = c.customerNumber?.toLowerCase().includes(q);
      const matchAddress = c.address?.toLowerCase().includes(q) || c.zipAndCity?.toLowerCase().includes(q);
      const matchProperty = c.propertyDesignation?.toLowerCase().includes(q);
      const matchPersonNum = c.orgOrPersonNumber?.toLowerCase().includes(q);
      const matchPhone = c.phone?.toLowerCase().includes(q);
      const matchEmail = c.email?.toLowerCase().includes(q);
      const matchNotes = c.notes?.toLowerCase().includes(q);
      return (
        matchName ||
        matchCompany ||
        matchCustNum ||
        matchAddress ||
        matchProperty ||
        matchPersonNum ||
        matchPhone ||
        matchEmail ||
        matchNotes
      );
    });
  }, [customers, searchQuery]);

  const openNewModal = () => {
    setEditingCustomer(null);
    setFormName('');
    // Auto increment highest customer number
    const maxNum = customers.reduce((max, c) => {
      const n = parseInt(c.customerNumber, 10);
      return !isNaN(n) && n > max ? n : max;
    }, 61);
    setFormCustomerNumber(String(maxNum + 1));
    setFormOrgOrPersonNumber('');
    setFormPropertyDesignation('');
    setFormAddress('');
    setFormZipAndCity('');
    setFormPhone('');
    setFormEmail('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: SavedCustomer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(c);
    setFormName(c.name || '');
    setFormCustomerNumber(c.customerNumber || '');
    setFormOrgOrPersonNumber(c.orgOrPersonNumber || '');
    setFormPropertyDesignation(c.propertyDesignation || '');
    setFormAddress(c.address || '');
    setFormZipAndCity(c.zipAndCity || '');
    setFormPhone(c.phone || '');
    setFormEmail(c.email || '');
    setFormNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const recipient: RecipientInfo = {
      name: formName.trim(),
      company: '',
      address: formAddress.trim(),
      zipAndCity: formZipAndCity.trim(),
      customerNumber: formCustomerNumber.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      orgOrPersonNumber: formOrgOrPersonNumber.trim(),
      propertyDesignation: formPropertyDesignation.trim(),
    };

    onSaveCustomer(recipient, formNotes.trim());
    setIsModalOpen(false);
  };

  const isCustomerActive = (c: SavedCustomer) => {
    if (selectedCustomerId) {
      return c.id === selectedCustomerId;
    }
    if (currentRecipient.name && c.name) {
      return c.name.trim().toLowerCase() === currentRecipient.name.trim().toLowerCase();
    }
    return false;
  };

  return (
    <aside className="w-full bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col h-[780px] overflow-hidden">
      {/* Header & Quick Action */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">Kundregister</h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {filteredCustomers.length} {filteredCustomers.length === 1 ? 'kund' : 'kunder'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openNewModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Ny kund</span>
          </button>
        </div>

        {/* Live Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sök namn, adress, fastighet, persnr..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Customer List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y-0">
        {filteredCustomers.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">Inga kunder matchade sökningen</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Prova ett annat sökord eller lägg till kunden</p>
            <button
              type="button"
              onClick={openNewModal}
              className="mt-3 text-xs font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Skapa &quot;{searchQuery}&quot; som kund
            </button>
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const active = isCustomerActive(customer);
            return (
              <div
                key={customer.id}
                onClick={() => onSelectCustomer(customer)}
                className={`group relative p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  active
                    ? 'bg-red-50/80 border-red-300 shadow-xs ring-1 ring-red-400/40'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-red-700 transition-colors truncate">
                        {customer.name}
                      </span>
                      {customer.customerNumber && (
                        <span className="text-[9.5px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                          #{customer.customerNumber}
                        </span>
                      )}
                      {active && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.2 rounded-full">
                          <Check className="w-2.5 h-2.5" />
                          Aktiv
                        </span>
                      )}
                    </div>

                    {/* Address */}
                    {customer.address && (
                      <div className="text-[11px] text-slate-600 mt-1 truncate">
                        {customer.address}{customer.zipAndCity ? `, ${customer.zipAndCity}` : ''}
                      </div>
                    )}

                    {/* Person / Org Number */}
                    {customer.orgOrPersonNumber && (
                      <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                        {customer.orgOrPersonNumber}
                      </div>
                    )}

                    {/* Phone or Email */}
                    {(customer.phone || customer.email) && (
                      <div className="flex items-center gap-2 text-[10.5px] text-slate-400 mt-1">
                        {customer.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" />
                            {customer.phone}
                          </span>
                        )}
                        {customer.email && (
                          <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
                            <Mail className="w-2.5 h-2.5 shrink-0" />
                            {customer.email}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons (hover) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      type="button"
                      onClick={(e) => openEditModal(customer, e)}
                      title="Redigera kund"
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Vill du ta bort ${customer.name}?`)) {
                          onDeleteCustomer(customer.id);
                        }
                      }}
                      title="Ta bort kund"
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Customer Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-red-600" />
                {editingCustomer ? 'Redigera kund' : 'Lägg till ny kund'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kundnamn / Beställare *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="t.ex. Jerry van Kooten"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kundnummer</label>
                  <input
                    type="text"
                    value={formCustomerNumber}
                    onChange={(e) => setFormCustomerNumber(e.target.value)}
                    placeholder="t.ex. 61"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Personnr / Org.nr</label>
                  <input
                    type="text"
                    value={formOrgOrPersonNumber}
                    onChange={(e) => setFormOrgOrPersonNumber(e.target.value)}
                    placeholder="19700526-1578"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gatuadress</label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Kolforsen 39"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Postnr & Ort</label>
                  <input
                    type="text"
                    value={formZipAndCity}
                    onChange={(e) => setFormZipAndCity(e.target.value)}
                    placeholder="816 93 Ockelbo"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefon</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="070-123 45 67"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">E-post</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="jerry@jvkooten.info"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {editingCustomer ? 'Spara ändringar' : 'Lägg till kund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
