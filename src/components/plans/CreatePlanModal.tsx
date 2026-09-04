/**
 * Create Installment Plan Modal (Sections 8, 10, 11, 12, 13, 14, 16)
 * Includes Smart Customer Search, Mandatory First Installment Rule, Live Schedule Preview, and Instant 1st Payment option.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, InstallmentDuration, PaymentMethod } from '../../types';
import { FinancialEngine } from '../../services/financialEngine';
import { SmartCustomerSearch } from '../customers/SmartCustomerSearch';
import {
  X,
  FilePlus,
  AlertCircle,
  Calendar,
  CreditCard,
  Building2,
  DollarSign,
  Receipt,
  CheckCircle2,
} from 'lucide-react';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCustomer?: Customer | null;
  onPlanCreated?: (plan: any) => void;
}

export const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  isOpen,
  onClose,
  preselectedCustomer = null,
  onPlanCreated,
}) => {
  const { state, createPlan, currency } = useApp();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(preselectedCustomer);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    state.stores.find((s) => s.status === 'active')?.id || state.stores[0]?.id || ''
  );
  const [totalAmountStr, setTotalAmountStr] = useState<string>('');
  const [downPaymentStr, setDownPaymentStr] = useState<string>('0');
  const [durationMonths, setDurationMonths] = useState<InstallmentDuration>(4);
  const [notes, setNotes] = useState<string>('');

  // Immediate first installment payment (Section 13)
  const [payFirstInstallmentNow, setPayFirstInstallmentNow] = useState<boolean>(true);
  const [firstPaymentMethod, setFirstPaymentMethod] = useState<PaymentMethod>('pos_card');
  const [firstPaymentRef, setFirstPaymentRef] = useState<string>('');

  const [formError, setFormError] = useState<string | null>(null);

  // Financial calculations
  const totalAmount = parseFloat(totalAmountStr) || 0;
  const downPayment = parseFloat(downPaymentStr) || 0;
  const remainingAmount = Math.max(0, totalAmount - downPayment);

  const todayStr = new Date().toISOString().split('T')[0];

  // Live generated installments preview
  const previewInstallments = useMemo(() => {
    if (totalAmount <= 0 || remainingAmount <= 0) return [];
    try {
      return FinancialEngine.generateInstallments(
        'preview-plan',
        remainingAmount,
        durationMonths,
        todayStr,
        todayStr
      );
    } catch {
      return [];
    }
  }, [totalAmount, remainingAmount, durationMonths, todayStr]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedCustomer) {
      setFormError('يرجى اختيار العميل أولاً باستخدام حقل البحث الذكي');
      return;
    }
    if (!selectedStoreId) {
      setFormError('يرجى تحديد المتجر أو المعرض');
      return;
    }
    if (totalAmount <= 0) {
      setFormError('يرجى إدخال إجمالي مبلغ الخطة بشكل صحيح');
      return;
    }
    if (downPayment > totalAmount) {
      setFormError('الدفعة الأولى لا يمكن أن تتجاوز إجمالي مبلغ الخطة');
      return;
    }

    try {
      const { plan } = createPlan({
        customerId: selectedCustomer.id,
        storeId: selectedStoreId,
        totalAmount,
        downPayment,
        durationMonths,
        notes: notes.trim(),
        payFirstInstallmentNow,
        firstPaymentMethod,
        firstPaymentRef: firstPaymentRef.trim() || undefined,
      });

      if (onPlanCreated) {
        onPlanCreated(plan);
      }
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء إنشاء الخطة');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 my-4 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <FilePlus className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-lg">إنشاء خطة تقسيط جديدة</h3>
              <p className="text-xs text-slate-400">تطبيق القواعد المالية وحساب الأقساط بدقة متناهية</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Customer (Smart Search) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>العميل <span className="text-rose-500">*</span></span>
              <span className="text-slate-400 text-[11px] font-normal">
                (البحث الذكي بالاسم، الجوال 05x، أو الهوية)
              </span>
            </label>
            <SmartCustomerSearch
              customers={state.customers}
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
            />
          </div>

          {/* Section 2: Store & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المتجر / المعرض <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {state.stores.map((st) => (
                    <option key={st.id} value={st.id} disabled={st.status !== 'active'}>
                      {st.name} ({st.code}) {st.status !== 'active' ? '- غير نشط' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                مدة التقسيط (الشهور) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-6 gap-1">
                {([2, 3, 4, 6, 9, 12] as InstallmentDuration[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDurationMonths(d)}
                    className={`py-2 text-center text-xs font-bold rounded-lg border transition-all ${
                      durationMonths === d
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {d} شهر
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Financial Figures */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                إجمالي قيمة الخطة ({currency}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={totalAmountStr}
                onChange={(e) => setTotalAmountStr(e.target.value)}
                placeholder="مثال: 10000"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الدفعة الأولى المقدمة ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={downPaymentStr}
                onChange={(e) => setDownPaymentStr(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">تخصم من الإجمالي قبل توزيع الأقساط</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المبلغ المتبقي للأقساط
              </label>
              <div className="w-full px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-mono font-bold text-emerald-800">
                {FinancialEngine.formatCurrency(remainingAmount, currency)}
              </div>
              <span className="text-[10px] text-emerald-700 mt-0.5 block">
                موزع على {durationMonths} أقساط
              </span>
            </div>
          </div>

          {/* Section 4: Mandatory First Installment Rule Alert (Section 13) */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <span className="font-bold block text-sm mb-0.5">
                قاعدة القسط الأول الإجباري (Section 13):
              </span>
              القسط الأول يبدأ من تاريخ اليوم ({todayStr}) ويكون مستحقاً فوراً ولا ينتظر شهراً كاملاً.
              يمكنك تحصيله وتسجيل سند قبض له الآن مباشرة.
            </div>
          </div>

          {/* Section 5: First Installment Immediate Payment Option */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={payFirstInstallmentNow}
                onChange={(e) => setPayFirstInstallmentNow(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-900">
                تسجيل دفعة سداد القسط الأول الآن وإصدار سند قبض فوري
              </span>
            </label>

            {payFirstInstallmentNow && previewInstallments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-xs text-slate-500 block mb-1">مبلغ القسط الأول المستحق:</span>
                  <div className="font-mono font-bold text-emerald-700 text-sm bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    {FinancialEngine.formatCurrency(previewInstallments[0].amount, currency)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الدفع</label>
                  <select
                    value={firstPaymentMethod}
                    onChange={(e) => setFirstPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="pos_card">شبكة / بطاقة مدى</option>
                    <option value="cash">نقدًا (كاش)</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم المرجع / الإيصال</label>
                  <input
                    type="text"
                    value={firstPaymentRef}
                    onChange={(e) => setFirstPaymentRef(e.target.value)}
                    placeholder="رقم مرجع الشبكة أو الحوالة"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Live Installments Schedule Preview */}
          {previewInstallments.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  معاينة جدول الأقساط المتوقع ({previewInstallments.length} أقساط)
                </h4>
                <span className="text-[11px] text-slate-500">
                  مجموع الأقساط: {FinancialEngine.formatCurrency(remainingAmount, currency)} تماماً
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-start divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2.5 text-start">القسط</th>
                      <th className="p-2.5 text-start">تاريخ الاستحقاق</th>
                      <th className="p-2.5 text-start">المبلغ</th>
                      <th className="p-2.5 text-end">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {previewInstallments.map((inst, idx) => (
                      <tr
                        key={idx}
                        className={idx === 0 ? 'bg-emerald-50/50 font-bold text-emerald-950' : 'hover:bg-slate-50/50'}
                      >
                        <td className="p-2.5">
                          #{inst.installment_number}
                          {idx === 0 && <span className="ms-1.5 text-[10px] text-emerald-700 font-normal">(مستحق فوراً)</span>}
                        </td>
                        <td className="p-2.5">{inst.due_date}</td>
                        <td className="p-2.5 text-emerald-800">{FinancialEngine.formatCurrency(inst.amount, currency)}</td>
                        <td className="p-2.5 text-end text-slate-400 font-sans text-[11px]">
                          {idx === previewInstallments.length - 1 ? 'يشمل معالجة الكسور النهائية' : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 7: Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات الخطة أو العقد</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="وصف البضاعة المباعة أو أي شروط إضافية..."
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              تأكيد واعتماد خطة التقسيط
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
