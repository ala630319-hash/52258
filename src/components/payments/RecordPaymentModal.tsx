/**
 * Record Payment Modal (Sections 19, 20, 21, 27)
 * Handles full or partial installment payment, method selection, reference numbers, and triggers immediate receipt generation.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Installment, InstallmentPlan, Payment, PaymentMethod } from '../../types';
import { FinancialEngine } from '../../services/financialEngine';
import {
  X,
  Receipt,
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building2,
  User,
} from 'lucide-react';

interface RecordPaymentModalProps {
  installment: Installment;
  plan: InstallmentPlan;
  onClose: () => void;
  onPaymentSuccess: (payment: Payment) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  installment,
  plan,
  onClose,
  onPaymentSuccess,
}) => {
  const { recordPayment, state, currency } = useApp();

  const customer = state.customers.find((c) => c.id === plan.customer_id);
  const store = state.stores.find((s) => s.id === plan.store_id);

  const [amountStr, setAmountStr] = useState<string>(installment.remaining_amount.toFixed(2));
  const [method, setMethod] = useState<PaymentMethod>('pos_card');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const amount = parseFloat(amountStr) || 0;

  const handlePayFull = () => {
    setAmountStr(installment.remaining_amount.toFixed(2));
    setFormError(null);
  };

  const handlePayHalf = () => {
    const half = FinancialEngine.round2(installment.remaining_amount / 2);
    setAmountStr(half.toFixed(2));
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (amount <= 0) {
      setFormError('مبلغ الدفعة يجب أن يكون أكبر من الصفر');
      return;
    }

    if (amount > installment.remaining_amount) {
      setFormError(
        `المبلغ المدخل (${amount}) يتجاوز المتبقي من القسط (${installment.remaining_amount} ${currency})`
      );
      return;
    }

    try {
      const payment = recordPayment(
        installment.id,
        amount,
        method,
        referenceNumber.trim() || undefined,
        notes.trim() || undefined
      );

      onPaymentSuccess(payment);
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء تسجيل الدفعة');
    }
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base sm:text-lg">تسجيل دفعة سداد قسط</h3>
              <p className="text-xs text-slate-400">
                القسط #{installment.installment_number} - {plan.plan_number}
              </p>
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

        {/* Customer & Installment Info Summary */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> العميل:
            </span>
            <span className="font-bold text-slate-800">{customer?.full_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> المتجر:
            </span>
            <span className="font-semibold text-slate-800">{store?.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> تاريخ استحقاق القسط:
            </span>
            <span className="font-mono font-semibold text-slate-800">{installment.due_date}</span>
          </div>

          <div className="pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">قيمة القسط</span>
              <span className="font-mono font-bold text-slate-900">
                {FinancialEngine.formatCurrency(installment.amount, currency)}
              </span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">المدفوع سابقاً</span>
              <span className="font-mono font-bold text-emerald-600">
                {FinancialEngine.formatCurrency(installment.paid_amount, currency)}
              </span>
            </div>
            <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
              <span className="text-[11px] text-emerald-800 block">المتبقي حالياً</span>
              <span className="font-mono font-bold text-emerald-900">
                {FinancialEngine.formatCurrency(installment.remaining_amount, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                مبلغ الدفعة ({currency}) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePayHalf}
                  className="text-[11px] text-slate-600 hover:text-emerald-700 bg-slate-100 px-2 py-0.5 rounded transition-colors"
                >
                  نصف المتبقي
                </button>
                <button
                  type="button"
                  onClick={handlePayFull}
                  className="text-[11px] text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded transition-colors"
                >
                  كامل المتبقي ({installment.remaining_amount})
                </button>
              </div>
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={installment.remaining_amount}
              required
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                طريقة الدفع <span className="text-rose-500">*</span>
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="pos_card">شبكة / بطاقة مدى (POS)</option>
                <option value="cash">نقدًا (كاش)</option>
                <option value="bank_transfer">تحويل بنكي</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم المرجع / الإيصال البنكي
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="رقم العملية أو الحوالة"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات التحصيل</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي تفاصيل خاصة بهذه العملية..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
            />
          </div>

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
              تأكيد السداد واستخراج سند القبض
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
