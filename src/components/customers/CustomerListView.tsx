/**
 * Customer List & Management View (Section 7 & 8)
 * Clean list with smart search, status tabs, add/edit modal, and instant access to Customer 360.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import {
  UserPlus,
  Search,
  UserCheck,
  CreditCard,
  Phone,
  Edit2,
  Archive,
  RotateCcw,
  Eye,
  PlusCircle,
  X,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Customer360Modal } from './Customer360Modal';

interface CustomerListViewProps {
  onOpenCreatePlanForCustomer?: (customer: Customer) => void;
  onOpenPlanInvoice?: (plan: any) => void;
  onOpenReceipt?: (payment: any) => void;
  onOpenRecordPayment?: (installment: any, plan: any) => void;
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({
  onOpenCreatePlanForCustomer,
  onOpenPlanInvoice,
  onOpenReceipt,
  onOpenRecordPayment,
}) => {
  const { state, addCustomer, updateCustomer, archiveCustomer, restoreCustomer, hasPermission } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [selected360Customer, setSelected360Customer] = useState<Customer | null>(null);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    national_id: '',
    birth_date: '',
    phone: '',
    address: '',
    notes: '',
  });

  const filteredCustomers = useMemo(() => {
    return state.customers
      .filter((c) => {
        if (statusFilter === 'all') return true;
        return c.status === statusFilter;
      })
      .filter((c) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          c.full_name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.national_id.includes(q) ||
          (c.address && c.address.toLowerCase().includes(q))
        );
      });
  }, [state.customers, statusFilter, searchQuery]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      full_name: '',
      national_id: '',
      birth_date: '',
      phone: '',
      address: '',
      notes: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      full_name: customer.full_name,
      national_id: customer.national_id,
      birth_date: customer.birth_date,
      phone: customer.phone,
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validations (Section 7)
    if (!formData.full_name.trim()) {
      setFormError('يرجى إدخال اسم العميل الرباعي');
      return;
    }
    if (!/^\d{10}$/.test(formData.national_id.trim())) {
      setFormError('رقم الهوية / الإقامة يجب أن يتكون من 10 أرقام تماماً');
      return;
    }
    if (!/^05\d{8}$/.test(formData.phone.trim().replace(/\s+/g, ''))) {
      setFormError('رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام (مثال: 0501234567)');
      return;
    }

    try {
      if (editingCustomer) {
        updateCustomer({
          ...editingCustomer,
          full_name: formData.full_name.trim(),
          national_id: formData.national_id.trim(),
          birth_date: formData.birth_date,
          phone: formData.phone.trim().replace(/\s+/g, ''),
          address: formData.address.trim(),
          notes: formData.notes.trim(),
        });
      } else {
        addCustomer({
          full_name: formData.full_name.trim(),
          national_id: formData.national_id.trim(),
          birth_date: formData.birth_date,
          phone: formData.phone.trim().replace(/\s+/g, ''),
          address: formData.address.trim(),
          notes: formData.notes.trim(),
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء حفظ بيانات العميل');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">إدارة العملاء</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            سجل العملاء، التحقق من الهويات، وملفات العملاء الشاملة (Customer 360)
          </p>
        </div>
        {hasPermission('customers.create') && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all hover:shadow-md cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            إضافة عميل جديد
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، رقم الهوية، أو الجوال..."
            className="w-full ps-10 pe-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'active'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            النشطون ({state.customers.filter((c) => c.status === 'active').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('archived')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'archived'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            المؤرشفون ({state.customers.filter((c) => c.status === 'archived').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({state.customers.length})
          </button>
        </div>
      </div>

      {/* Customer Cards Grid / Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="p-3.5 text-start">العميل</th>
                <th className="p-3.5 text-start">رقم الهوية / الإقامة</th>
                <th className="p-3.5 text-start">رقم الجوال</th>
                <th className="p-3.5 text-start">المدينة / العنوان</th>
                <th className="p-3.5 text-start">الخطط النشطة</th>
                <th className="p-3.5 text-start">الحالة</th>
                <th className="p-3.5 text-end">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    لا يوجد عملاء يطابقون شروط البحث
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const plans = state.plans.filter((p) => p.customer_id === cust.id);
                  const activePlansCount = plans.filter(
                    (p) => p.status === 'active' || p.status === 'overdue'
                  ).length;

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {cust.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{cust.full_name}</div>
                            <span className="text-[11px] text-slate-400">مسجل في {cust.created_at}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-slate-800 font-medium">
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          {cust.national_id}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono text-slate-800">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {cust.phone}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-600 max-w-xs truncate">
                        {cust.address || '-'}
                      </td>

                      <td className="p-3.5">
                        <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          {activePlansCount} نشطة / {plans.length} إجمالي
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            cust.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {cust.status === 'active' ? 'نشط' : 'مؤرشف'}
                        </span>
                      </td>

                      <td className="p-3.5 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Open 360 Dossier */}
                          <button
                            type="button"
                            onClick={() => setSelected360Customer(cust)}
                            className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            title="عرض ملف العميل الشامل Customer 360"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            ملف 360°
                          </button>

                          {/* Create Plan for Customer */}
                          {onOpenCreatePlanForCustomer && cust.status === 'active' && hasPermission('plans.create') && (
                            <button
                              type="button"
                              onClick={() => onOpenCreatePlanForCustomer(cust)}
                              className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg text-xs transition-colors"
                              title="إنشاء خطة تقسيط لهذا العميل"
                            >
                              <PlusCircle className="w-4 h-4 text-emerald-600" />
                            </button>
                          )}

                          {/* Edit Customer */}
                          {hasPermission('customers.edit') && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(cust)}
                              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                              title="تعديل بيانات العميل"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Archive or Restore */}
                          {hasPermission('customers.archive') && (
                            cust.status === 'active' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`هل أنت متأكد من أرشفة العميل "${cust.full_name}"؟`)) {
                                    archiveCustomer(cust.id);
                                  }
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                                title="أرشفة العميل (حفظ آمن بدون حذف البيانات)"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => restoreCustomer(cust.id)}
                                className="text-slate-400 hover:text-emerald-600 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                                title="استعادة العميل من الأرشيف"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-lg">
                  {editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الاسم الرباعي الكامل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="مثال: أحمد بن محمد بن عبدالله آل سعد"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم الهوية / الإقامة (10 أرقام) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={formData.national_id}
                    onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                    placeholder="مثال: 1087654321"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم الجوال (05x) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="مثال: 0501234567"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تاريخ الميلاد (اختياري)
                  </label>
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المدينة والعنوان السكني
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="مثال: الرياض - حي الملز"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات إضافية (جهة العمل، الضامن، إلخ)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="أي ملاحظات تفصيلية تخص العميل..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {editingCustomer ? 'حفظ التعديلات' : 'تسجيل العميل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer 360 Full Modal */}
      {selected360Customer && (
        <Customer360Modal
          customer={selected360Customer}
          onClose={() => setSelected360Customer(null)}
          onOpenRecordPayment={onOpenRecordPayment}
          onOpenPlanInvoice={onOpenPlanInvoice}
          onOpenReceipt={onOpenReceipt}
          onOpenCreatePlanForCustomer={onOpenCreatePlanForCustomer}
        />
      )}
    </div>
  );
};
