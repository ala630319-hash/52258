/**
 * Payment Reversal Modal (Section 25 - عكس الدفعات)
 * Enforces manager authorization, mandatory reversal reason, atomic balance restoration, and permanent audit logging.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Payment } from '../../types';
import { FinancialEngine } from '../../services/financialEngine';
import {
  X,
  RotateCcw,
  AlertTriangle,
  Receipt,
  User,
  Calendar,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';

interface PaymentReversalModalProps {
  payment: Payment;
  onClose: () => void;
  onReversalSuccess?: () => void;
}

export const PaymentReversalModal: React.FC<PaymentReversalModalProps> = ({
  payment,
  onClose,
  onReversalSuccess,
}) => {
  const { state, reversePayment, hasPermission, currency } = useApp();

  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const customer = state.customers.find((c) => c.id === payment.customer_id);
  const plan = state.plans.find((p) => p.id === payment.plan_id);

  const handleReverse = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasPermission('payments.reverse')) {
      setError('عفوًا، عكس الدفعات متاح لمدير النظام فقط وفق السياسة المالية الصارمة');
      return;
    }

    if (!reason.trim()) {
      setError('يجب كتابة سبب عكس الدفعة بدقة للتوثيق المالي والمحاسبي');
      return;
    }

    try {
      reversePayment(payment.id, reason.trim());
      if (onReversalSuccess) {
        onReversalSuccess();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء عكس الدفعة');
    }
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-rose-200">
        {/* Warning Header */}
        <div className="bg-rose-950 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="font-bold text-base sm:text-lg">عكس دفعة مالية (إلغاء سداد)</h3>
              <p className="text-xs text-rose-300">إجراء رقابي محمي - صلاحية المدير العام فقط</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-rose-300 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Callout */}
        <div className="bg-rose-50 p-4 border-b border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">قاعدة الأمان المالي:</span> لا يتم حذف الدفعات من قاعدة البيانات أبداً.
            سيتم تحويل حالة هذه الدفعة إلى <strong>&quot;معكوسة&quot;</strong>، وإعادة فتح رصيد القسط، وتسجيل تفاصيل العملية واسم المدير في سجل التدقيق غير القابل للتعديل.
          </div>
        </div>

        {/* Payment Summary */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">رقم سند القبض:</span>
            <span className="font-mono font-bold text-slate-800">{payment.payment_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">العميل:</span>
            <span className="font-bold text-slate-800">{customer?.full_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">خطة التقسيط:</span>
            <span className="font-mono text-slate-800">{plan?.plan_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">مبلغ الدفعة المراد عكسها:</span>
            <span className="font-mono font-bold text-rose-600 text-sm">
              {FinancialEngine.formatCurrency(payment.amount, currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">تاريخ تسجيل الدفعة:</span>
            <span className="font-mono text-slate-700">{payment.paid_at.replace('T', ' ').substring(0, 16)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">سجلت بواسطة:</span>
            <span className="text-slate-700">{payment.created_by}</span>
          </div>
        </div>

        {/* Reversal Form */}
        <form onSubmit={handleReverse} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              سبب عكس الدفعة (إلزامي للتوثيق المالي) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: تسجيل خاطئ لمبلغ الدفعة، أو استرجاع العملية من قبل البنك..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              تراجع
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              تأكيد عكس الدفعة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
