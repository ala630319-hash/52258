/**
 * Plan Details Modal (Sections 11, 23, 24, 25)
 * Displays plan details, installments schedule with due date modifications, payment history, and reversal controls.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InstallmentPlan, Installment, Payment } from '../../types';
import { FinancialEngine } from '../../services/financialEngine';
import {
  X,
  FileText,
  User,
  Building2,
  Calendar,
  CreditCard,
  Printer,
  RotateCcw,
  Ban,
  Clock,
  Edit2,
  Receipt,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';

interface PlanDetailsModalProps {
  plan: InstallmentPlan;
  onClose: () => void;
  onOpenRecordPayment: (installment: Installment, plan: InstallmentPlan) => void;
  onOpenPlanInvoice: (plan: InstallmentPlan) => void;
  onOpenReceipt: (payment: Payment) => void;
  onOpenReversePayment: (payment: Payment) => void;
}

export const PlanDetailsModal: React.FC<PlanDetailsModalProps> = ({
  plan,
  onClose,
  onOpenRecordPayment,
  onOpenPlanInvoice,
  onOpenReceipt,
  onOpenReversePayment,
}) => {
  const { state, cancelPlan, updateInstallmentDueDate, hasPermission, currency } = useApp();

  const customer = state.customers.find((c) => c.id === plan.customer_id);
  const store = state.stores.find((s) => s.id === plan.store_id);
  const planInstallments = state.installments.filter((i) => i.plan_id === plan.id);
  const planPayments = state.payments.filter((p) => p.plan_id === plan.id);

  // Installment due date edit state
  const [editingDueDateInst, setEditingDueDateInst] = useState<Installment | null>(null);
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [dueDateReason, setDueDateReason] = useState<string>('');
  const [dueDateError, setDueDateError] = useState<string | null>(null);

  // Cancel plan state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Financial aggregates
  const totalPaidInInstallments = planInstallments.reduce((sum, i) => sum + i.paid_amount, 0);
  const totalPaidOverall = totalPaidInInstallments + plan.down_payment;
  const remainingInInstallments = planInstallments.reduce((sum, i) => sum + i.remaining_amount, 0);
  const progressPct = plan.total_amount > 0 ? Math.round((totalPaidOverall / plan.total_amount) * 100) : 0;

  const handleSaveDueDate = (e: React.FormEvent) => {
    e.preventDefault();
    setDueDateError(null);
    if (!editingDueDateInst) return;
    if (!dueDateReason.trim()) {
      setDueDateError('يجب إدخال سبب تعديل تاريخ الاستحقاق وفق ضوابط التدقيق المالي');
      return;
    }

    try {
      updateInstallmentDueDate(editingDueDateInst.id, newDueDate, dueDateReason.trim());
      setEditingDueDateInst(null);
    } catch (err: any) {
      setDueDateError(err.message || 'حدث خطأ أثناء تعديل التاريخ');
    }
  };

  const handleCancelPlan = (e: React.FormEvent) => {
    e.preventDefault();
    setCancelError(null);
    if (!cancelReason.trim()) {
      setCancelError('يرجى تحديد سبب إلغاء الخطة');
      return;
    }

    try {
      cancelPlan(plan.id, cancelReason.trim());
      setIsCancelModalOpen(false);
      onClose();
    } catch (err: any) {
      setCancelError(err.message || 'تعذر إلغاء الخطة');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 flex items-start justify-between shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xl sm:text-2xl font-bold">{plan.plan_number}</span>
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold ${
                  plan.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : plan.status === 'overdue'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : plan.status === 'active'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : plan.status === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                }`}
              >
                {plan.status === 'completed'
                  ? 'مكتملة السداد'
                  : plan.status === 'overdue'
                  ? 'متأخرة السداد'
                  : plan.status === 'active'
                  ? 'خطة نشطة'
                  : plan.status === 'approved'
                  ? 'معتمدة'
                  : plan.status === 'draft'
                  ? 'مسودة'
                  : 'ملغاة'}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" />
                العميل: <strong className="text-white">{customer?.full_name || 'غير معروف'}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                المتجر: <strong className="text-white">{store?.name || 'غير محدد'}</strong>
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-4 h-4" />
                تاريخ الإنشاء: {plan.created_at}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenPlanInvoice(plan)}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              طباعة الفاتورة / العقد
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Financial Metrics Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200 shrink-0 text-xs sm:text-sm">
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-xs mb-0.5">إجمالي قيمة الخطة</span>
            <span className="text-lg font-bold font-mono text-slate-900">
              {FinancialEngine.formatCurrency(plan.total_amount, currency)}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-xs mb-0.5">الدفعة الأولى المقدمة</span>
            <span className="text-lg font-bold font-mono text-slate-900">
              {FinancialEngine.formatCurrency(plan.down_payment, currency)}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/20">
            <span className="text-emerald-700 block text-xs mb-0.5">المسدد الإجمالي</span>
            <span className="text-lg font-bold font-mono text-emerald-600">
              {FinancialEngine.formatCurrency(totalPaidOverall, currency)}
            </span>
            <span className="text-[11px] text-emerald-600/80 block">يشمل المقدمة والأقساط</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-rose-200 bg-rose-50/20">
            <span className="text-rose-700 block text-xs mb-0.5">المتبقي من الأقساط</span>
            <span className="text-lg font-bold font-mono text-rose-600">
              {FinancialEngine.formatCurrency(remainingInInstallments, currency)}
            </span>
            <span className="text-[11px] text-rose-600/80 block">الرصيد المستحق</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-2 bg-white border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>نسبة السداد الكلية: {progressPct}%</span>
          <div className="w-1/2 bg-slate-100 rounded-full h-2 overflow-hidden mx-3">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, progressPct)}%` }}
            />
          </div>
          <span>{plan.duration_months} أشهر ({planInstallments.length} أقساط)</span>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Section 1: Installments Schedule */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-600" />
                جدول الأقساط ومواعيد الاستحقاق
              </h4>
              <span className="text-xs text-slate-400">
                القسط الأول بدأ في {plan.start_date}
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs sm:text-sm shadow-2xs">
              <table className="w-full text-start divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3 text-start">القسط</th>
                    <th className="p-3 text-start">تاريخ الاستحقاق</th>
                    <th className="p-3 text-start">المبلغ</th>
                    <th className="p-3 text-start">المدفوع</th>
                    <th className="p-3 text-start">المتبقي</th>
                    <th className="p-3 text-start">الحالة</th>
                    <th className="p-3 text-end">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {planInstallments.map((inst) => (
                    <tr key={inst.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">قسط #{inst.installment_number}</td>

                      <td className="p-3 font-mono text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span>{inst.due_date}</span>
                          {hasPermission('installments.edit_due_date') && plan.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDueDateInst(inst);
                                setNewDueDate(inst.due_date);
                                setDueDateReason('');
                                setDueDateError(null);
                              }}
                              className="text-slate-400 hover:text-emerald-700 p-0.5 rounded transition-colors"
                              title="تعديل تاريخ الاستحقاق (توثيق مالي)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="p-3 font-mono font-medium text-slate-900">
                        {FinancialEngine.formatCurrency(inst.amount, currency)}
                      </td>
                      <td className="p-3 font-mono text-emerald-600 font-medium">
                        {FinancialEngine.formatCurrency(inst.paid_amount, currency)}
                      </td>
                      <td className="p-3 font-mono text-rose-600 font-bold">
                        {FinancialEngine.formatCurrency(inst.remaining_amount, currency)}
                      </td>

                      <td className="p-3">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            inst.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inst.status === 'partially_paid'
                              ? 'bg-amber-100 text-amber-800'
                              : inst.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800 font-bold'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {inst.status === 'paid'
                            ? 'مدفوع بالكامل'
                            : inst.status === 'partially_paid'
                            ? 'مدفوع جزئياً'
                            : inst.status === 'overdue'
                            ? 'متأخر'
                            : 'مستحق'}
                        </span>
                      </td>

                      <td className="p-3 text-end">
                        {inst.status !== 'paid' && plan.status !== 'cancelled' && hasPermission('payments.create') && (
                          <button
                            type="button"
                            onClick={() => onOpenRecordPayment(inst, plan)}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            تسجيل دفعة
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Payments History on this Plan */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-slate-600" />
              سجل الدفعات وسندات القبض المسجلة ({planPayments.length})
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs sm:text-sm">
              <table className="w-full text-start divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3 text-start">رقم السند</th>
                    <th className="p-3 text-start">تاريخ السداد</th>
                    <th className="p-3 text-start">المبلغ</th>
                    <th className="p-3 text-start">طريقة الدفع</th>
                    <th className="p-3 text-start">الموظف</th>
                    <th className="p-3 text-start">الحالة</th>
                    <th className="p-3 text-end">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {planPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        لا توجد دفعات مسجلة على هذه الخطة حتى الآن
                      </td>
                    </tr>
                  ) : (
                    planPayments.map((payment) => (
                      <tr key={payment.id} className={payment.status === 'reversed' ? 'bg-rose-50/40' : 'hover:bg-slate-50/70'}>
                        <td className="p-3 font-mono font-bold text-slate-900">{payment.payment_number}</td>
                        <td className="p-3 font-mono text-slate-600">{payment.paid_at.replace('T', ' ').substring(0, 16)}</td>
                        <td className="p-3 font-mono font-bold text-emerald-700">
                          {FinancialEngine.formatCurrency(payment.amount, currency)}
                        </td>
                        <td className="p-3 text-slate-700">
                          {payment.payment_method === 'cash'
                            ? 'نقدًا'
                            : payment.payment_method === 'bank_transfer'
                            ? 'تحويل بنكي'
                            : 'بطاقة / شبكة'}
                        </td>
                        <td className="p-3 text-slate-600">{payment.created_by}</td>
                        <td className="p-3">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                              payment.status === 'recorded'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800 font-semibold'
                            }`}
                          >
                            {payment.status === 'recorded' ? 'معتمدة' : 'معكوسة'}
                          </span>
                        </td>
                        <td className="p-3 text-end">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenReceipt(payment)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              سند
                            </button>

                            {/* Reversal action (Admin only - Section 25) */}
                            {payment.status === 'recorded' && hasPermission('payments.reverse') && (
                              <button
                                type="button"
                                onClick={() => onOpenReversePayment(payment)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-md transition-colors"
                                title="عكس الدفعة (صلاحية المدير فقط)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                عكس الدفعة
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            {plan.status !== 'cancelled' && hasPermission('plans.cancel') && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="text-xs text-rose-700 hover:text-rose-800 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <Ban className="w-4 h-4" />
                إلغاء الخطة
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>

      {/* Due Date Edit Modal (Section 24) */}
      {editingDueDateInst && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                تعديل تاريخ استحقاق القسط #{editingDueDateInst.installment_number}
              </h4>
              <button
                type="button"
                onClick={() => setEditingDueDateInst(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDueDate} className="p-5 space-y-4">
              {dueDateError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {dueDateError}
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">التاريخ الحالي:</span>
                  <span className="font-mono font-bold text-slate-800">{editingDueDateInst.due_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">مبلغ القسط:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {FinancialEngine.formatCurrency(editingDueDateInst.amount, currency)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تاريخ الاستحقاق الجديد <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سبب التعديل (إلزامي للتدقيق المالي) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={dueDateReason}
                  onChange={(e) => setDueDateReason(e.target.value)}
                  placeholder="مثال: طلب العميل إعادة جدولة بسبب تأخر صرف الراتب..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDueDateInst(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  حفظ وتوثيق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Plan Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-rose-900 text-white p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-300" />
                تأكيد إلغاء خطة التقسيط {plan.plan_number}
              </h4>
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelPlan} className="p-5 space-y-4">
              {cancelError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {cancelError}
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed">
                هل أنت متأكد من رغبتك في إلغاء هذه الخطة؟ سيتم تحويل حالة الخطة إلى ملغاة ولن يمكن تسجيل دفعات جديدة عليها.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سبب الإلغاء (إلزامي للتوثيق المالي) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="سبب إلغاء العقد أو إعادة البضاعة..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  تراجع
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  تأكيد الإلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
