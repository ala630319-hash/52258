/**
 * Payment Receipt Modal (Section 27 - سند القبض المالي)
 * Official printable payment voucher with Arabic text conversion (Tafqeet), customer details, collector info, and remaining balance.
 */

import React from 'react';
import { Payment } from '../../types';
import { useApp } from '../../context/AppContext';
import { FinancialEngine } from '../../services/financialEngine';
import { X, Printer, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  payment: Payment;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, onClose }) => {
  const { state, currency } = useApp();

  const customer = state.customers.find((c) => c.id === payment.customer_id);
  const plan = state.plans.find((p) => p.id === payment.plan_id);
  const installment = state.installments.find((i) => i.id === payment.installment_id);
  const store = plan ? state.stores.find((s) => s.id === plan.store_id) : undefined;

  const amountWords = FinancialEngine.numberToArabicWords(payment.amount);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-70 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 my-4 flex flex-col max-h-[94vh]">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">سند قبض مالي معتمد</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              طباعة السند
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Voucher Printable Area */}
        <div className="p-6 sm:p-8 overflow-y-auto print-card flex-1 bg-white text-slate-900 font-sans">
          {/* Voucher Border Wrapper */}
          <div className="border-2 border-slate-800 rounded-2xl p-6 sm:p-8 relative">
            {/* Header / Brand */}
            <div className="flex flex-row items-center justify-between border-b-2 border-slate-800 pb-5 mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  {state.settings.system_name_ar}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">{state.settings.system_name_en}</p>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  الفرع: {store?.name || 'المركز الرئيسي'}
                </p>
              </div>

              <div className="text-end">
                <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded font-bold text-sm mb-1 tracking-wider">
                  سند قبض مالي
                </div>
                <div className="font-mono text-xs text-slate-600">
                  <span>رقم السند: </span>
                  <strong className="text-slate-900 font-bold">{payment.payment_number}</strong>
                </div>
                <div className="font-mono text-xs text-slate-500 mt-0.5">
                  التاريخ: {payment.paid_at.replace('T', ' ').substring(0, 16)}
                </div>
              </div>
            </div>

            {/* Voucher Body */}
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-baseline justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-600 font-medium">استلمنا من المكرم / السيد:</span>
                <span className="font-bold text-base text-slate-900">{customer?.full_name}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">رقم الهوية / الإقامة:</span>
                  <span className="font-mono font-bold text-slate-800">{customer?.national_id}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">رقم الجوال:</span>
                  <span className="font-mono font-bold text-slate-800">{customer?.phone}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-900 font-semibold">مبلغ وقدره بالأرقام:</span>
                  <span className="font-mono text-lg font-black text-emerald-700">
                    {FinancialEngine.formatCurrency(payment.amount, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60">
                  <span className="text-emerald-800 text-xs font-semibold">المبلغ كتابة:</span>
                  <span className="font-bold text-xs text-emerald-900">{amountWords}</span>
                </div>
              </div>

              {/* Related Installment & Plan Details */}
              <div className="border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500">وذلك سداداً عن: </span>
                    <strong className="text-slate-800">
                      قسط رقم #{installment?.installment_number || '-'} (عقد {plan?.plan_number})
                    </strong>
                  </div>
                  <div className="text-end">
                    <span className="text-slate-500">طريقة الدفع: </span>
                    <strong className="text-slate-800">
                      {payment.payment_method === 'cash'
                        ? 'نقدًا (كاش)'
                        : payment.payment_method === 'bank_transfer'
                        ? 'تحويل بنكي'
                        : 'شبكة / مدى (POS)'}
                    </strong>
                  </div>
                </div>

                {payment.reference_number && (
                  <div>
                    <span className="text-slate-500">رقم المرجع / العملية: </span>
                    <strong className="font-mono text-slate-800">{payment.reference_number}</strong>
                  </div>
                )}

                {installment && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-600">المتبقي من قيمة هذا القسط بعد السداد:</span>
                    <span className="font-mono font-bold text-rose-600">
                      {FinancialEngine.formatCurrency(installment.remaining_amount, currency)}
                    </span>
                  </div>
                )}
              </div>

              {payment.notes && (
                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                  ملاحظات: {payment.notes}
                </div>
              )}

              {payment.status === 'reversed' && (
                <div className="p-3 bg-rose-100 border border-rose-300 text-rose-800 rounded-xl font-bold text-center">
                  *** تم عكس هذا السند بموجب إشعار مالي ملغى ***
                </div>
              )}
            </div>

            {/* Signatures & Stamps */}
            <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <p className="text-slate-500 mb-10">توقيع العميل / المستلم</p>
                <div className="w-32 border-b border-slate-400 mx-auto"></div>
              </div>
              <div>
                <p className="text-slate-500 mb-2">الموظف المسؤول / أمين الصندوق</p>
                <p className="font-bold text-slate-800 mb-6">{payment.created_by}</p>
                <div className="w-32 border-b border-slate-400 mx-auto"></div>
                <span className="text-[10px] text-slate-400 block mt-1">ختم الاعتماد المالي</span>
              </div>
            </div>

            {/* Micro security note */}
            <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>وثيقة مالية معتمدة صادرة إلكترونياً ولا يعتد بها في حال الكشط أو التعديل</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
