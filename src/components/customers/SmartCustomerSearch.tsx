/**
 * Smart Customer Search Component (Section 8 - البحث الذكي عن العميل)
 * Autocomplete search by name, partial name, phone, or national ID.
 * Displays matching results dynamically and renders a rich customer card upon selection.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Customer } from '../../types';
import { Search, UserCheck, X, Phone, CreditCard, MapPin, UserPlus } from 'lucide-react';

interface SmartCustomerSearchProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onAddNewCustomer?: () => void;
  disabled?: boolean;
}

export const SmartCustomerSearch: React.FC<SmartCustomerSearchProps> = ({
  customers,
  selectedCustomer,
  onSelectCustomer,
  onAddNewCustomer,
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter customers matching query (name, partial name, phone, national_id)
  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return customers
      .filter((c) => c.status === 'active')
      .filter((c) => {
        return (
          c.full_name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.national_id.includes(q)
        );
      })
      .slice(0, 8); // internal pagination/limit
  }, [customers, query]);

  if (selectedCustomer) {
    return (
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex items-start justify-between relative transition-all">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-base">{selectedCustomer.full_name}</h4>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-medium">
                عميل نشط
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-mono">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                {selectedCustomer.national_id}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {selectedCustomer.phone}
              </span>
              {selectedCustomer.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {selectedCustomer.address}
                </span>
              )}
            </div>
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => onSelectCustomer(null)}
            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-white/60 transition-colors"
            title="تغيير العميل"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          placeholder="ابحث عن العميل بالاسم، رقم الجوال (05x)، أو رقم الهوية..."
          className="w-full ps-10 pe-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && query.trim().length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
          {filteredCustomers.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {filteredCustomers.map((cust) => (
                <li
                  key={cust.id}
                  onClick={() => {
                    onSelectCustomer(cust);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="p-3 hover:bg-emerald-50/70 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="font-semibold text-slate-900 group-hover:text-emerald-900 text-sm">
                      {cust.full_name}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono">جوال: {cust.phone}</span>
                      <span className="text-slate-300">|</span>
                      <span className="font-mono">هوية: {cust.national_id}</span>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    اختيار
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center">
              <p className="text-xs text-slate-500 mb-2">لم يتم العثور على أي عميل يطابق &quot;{query}&quot;</p>
              {onAddNewCustomer && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onAddNewCustomer();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  إضافة عميل جديد الآن
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
