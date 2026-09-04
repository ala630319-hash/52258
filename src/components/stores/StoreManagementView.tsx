/**
 * Store Management View (Section 9 - المتاجر)
 * Dedicated store management with code, status, financial aggregates (contracted, collected, remaining, overdue).
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Store } from '../../types';
import { FinancialEngine } from '../../services/financialEngine';
import {
  Store as StoreIcon,
  Plus,
  Edit,
  CheckCircle2,
  XCircle,
  Building2,
  Receipt,
  Users,
  AlertTriangle,
  X,
} from 'lucide-react';

export const StoreManagementView: React.FC = () => {
  const { state, addStore, updateStore, hasPermission, currency } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    status: 'active' as 'active' | 'inactive',
    notes: '',
  });

  // Calculate store financial metrics
  const storeMetrics = useMemo(() => {
    return state.stores.map((store) => {
      const storePlans = state.plans.filter((p) => p.store_id === store.id);
      const storePlanIds = storePlans.map((p) => p.id);
      const storeInstallments = state.installments.filter((i) => storePlanIds.includes(i.plan_id));

      const totalContracted = storePlans.reduce((sum, p) => sum + p.total_amount, 0);
      const totalCollected = storeInstallments.reduce((sum, i) => sum + i.paid_amount, 0) +
        storePlans.reduce((sum, p) => sum + p.down_payment, 0);
      const totalRemaining = storeInstallments.reduce((sum, i) => sum + i.remaining_amount, 0);
      const totalOverdue = storeInstallments
        .filter((i) => i.status === 'overdue')
        .reduce((sum, i) => sum + i.remaining_amount, 0);

      // Unique customers count
      const uniqueCustomerIds = new Set(storePlans.map((p) => p.customer_id));

      return {
        store,
        plansCount: storePlans.length,
        customersCount: uniqueCustomerIds.size,
        totalContracted,
        totalCollected,
        totalRemaining,
        totalOverdue,
      };
    });
  }, [state.stores, state.plans, state.installments]);

  const handleOpenAdd = () => {
    setEditingStore(null);
    setFormData({
      name: '',
      code: `STR-00${state.stores.length + 1}`,
      status: 'active',
      notes: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (store: Store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      code: store.code,
      status: store.status,
      notes: store.notes || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('يرجى إدخال اسم المتجر أو المعرض');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('يرجى إدخال كود فريد للمتجر');
      return;
    }

    try {
      if (editingStore) {
        updateStore({
          ...editingStore,
          name: formData.name.trim(),
          code: formData.code.trim(),
          status: formData.status,
          notes: formData.notes.trim(),
        });
      } else {
        addStore({
          name: formData.name.trim(),
          code: formData.code.trim(),
          status: formData.status,
          notes: formData.notes.trim(),
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">إدارة المتاجر والمعارض</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            ربط الخطط بالمتاجر ومتابعة أداء التحصيل والمبيعات لكل فرع
          </p>
        </div>
        {hasPermission('stores.create') && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            إضافة متجر جديد
          </button>
        )}
      </div>

      {/* Stores Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {storeMetrics.map((item) => {
          const { store, plansCount, customersCount, totalContracted, totalCollected, totalRemaining, totalOverdue } = item;
          const collectionRate = totalContracted > 0 ? Math.round((totalCollected / totalContracted) * 100) : 0;

          return (
            <div
              key={store.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{store.name}</h3>
                      <span className="font-mono text-xs text-slate-400 font-semibold">{store.code}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                        store.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {store.status === 'active' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> نشط
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" /> غير نشط
                        </>
                      )}
                    </span>
                    {hasPermission('stores.edit') && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(store)}
                        className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        title="تعديل المتجر"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {store.notes && (
                  <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg">{store.notes}</p>
                )}

                {/* KPI stats */}
                <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-slate-500 block mb-0.5">عدد الخطط</span>
                    <span className="text-base font-bold text-slate-900 flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5 text-slate-400" />
                      {plansCount} خطة
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-slate-500 block mb-0.5">عدد العملاء</span>
                    <span className="text-base font-bold text-slate-900 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {customersCount} عميل
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">إجمالي العقود:</span>
                    <span className="font-bold font-mono text-slate-900">
                      {FinancialEngine.formatCurrency(totalContracted, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">المحصل الفعلي:</span>
                    <span className="font-bold font-mono text-emerald-600">
                      {FinancialEngine.formatCurrency(totalCollected, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">المتبقي للتحصيل:</span>
                    <span className="font-bold font-mono text-blue-600">
                      {FinancialEngine.formatCurrency(totalRemaining, currency)}
                    </span>
                  </div>
                  {totalOverdue > 0 && (
                    <div className="flex justify-between bg-rose-50 p-1.5 rounded-lg text-rose-700">
                      <span className="flex items-center gap-1 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        المتأخرات:
                      </span>
                      <span className="font-bold font-mono">
                        {FinancialEngine.formatCurrency(totalOverdue, currency)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>نسبة التحصيل</span>
                  <span className="font-bold text-slate-800">{collectionRate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, collectionRate)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Store Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StoreIcon className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-lg">
                  {editingStore ? 'تعديل بيانات المتجر' : 'إضافة متجر جديد'}
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
                  اسم المتجر / المعرض <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: معرض الأفق للإلكترونيات"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كود / رقم المتجر الفريد <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="مثال: STR-004"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الحالة</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="active">نشط (يقبل إنشاء خطط)</option>
                  <option value="inactive">غير نشط (معطل)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات أو العنوان</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="المدينة، الحي، رقم الهاتف..."
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
                  {editingStore ? 'حفظ التعديلات' : 'إضافة المتجر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
