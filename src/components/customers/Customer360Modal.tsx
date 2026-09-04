/**
 * Customer 360 Modal Component (Section 26 - صفحة العميل Customer 360)
 * Comprehensive single-view dossier of a customer:
 * Summary KPIs, Plans, Installments, Payments, Invoices & Receipts, Statement of Account, and Activity Audit.
 */

import React, { useState, useMemo } from 'react';
import { Customer, InstallmentPlan, Installment, Payment } from '../../types';
import { useApp } from '../../context/AppContext';
import { FinancialEngine } from '../../services/financialEngine';
import {
  X,
  User,
  CreditCard,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Receipt,
  FileText,
  Clock,
  Printer,
  Download,
  AlertCircle,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface Customer360ModalProps {
  customer: Customer;
  onClose: () => void;
  onOpenRecordPayment?: (installment: Installment, plan: InstallmentPlan) => void;
  onOpenPlanInvoice?: (plan: InstallmentPlan) => void;
  onOpenReceipt?: (payment: Payment) => void;
  onOpenCreatePlanForCustomer?: (customer: Customer) => void;
}

export const Customer360Modal: React.FC<Customer360ModalProps> = ({
  customer,
  onClose,
  onOpenRecordPayment,
  onOpenPlanInvoice,
  onOpenReceipt,
  onOpenCreatePlanForCustomer,
}) => {
  const { state, currency } = useApp();
  const [activeTab, setActiveTab] = useState<'plans' | 'installments' | 'payments' | 'statement' | 'activity'>('plans');

  // Customer's plans
  const customerPlans = useMemo(() => {
    return state.plans.filter((p) => p.customer_id === customer.id);
  }, [state.plans, customer.id]);

  const customerPlanIds = useMemo(() => customerPlans.map((p) => p.id), [customerPlans]);

  // Customer's installments
  const customerInstallments = useMemo(() => {
    return state.installments.filter((i) => customerPlanIds.includes(i.plan_id));
  }, [state.installments, customerPlanIds]);

  // Customer's payments
  const customerPayments = useMemo(() => {
    return state.payments
      .filter((p) => p.customer_id === customer.id)
      .sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());
  }, [state.payments, customer.id]);

  // Customer's audit logs
  const customerLogs = useMemo(() => {
    return state.auditLogs
      .filter(
        (log) =>
          log.entity_id === customer.id ||
          customerPlanIds.includes(log.entity_id) ||
          customerPayments.some((p) => p.id === log.entity_id)
      )
      .slice(0, 30);
  }, [state.auditLogs, customer.id, customerPlanIds, customerPayments]);

  // Financial KPIs
  const totalPlansCount = customerPlans.length;
  const totalContractedAmount = customerPlans.reduce((sum, p) => sum + p.total_amount, 0);
  const totalPaidAmount = customerInstallments.reduce((sum, i) => sum + i.paid_amount, 0) +
    customerPlans.reduce((sum, p) => sum + p.down_payment, 0);
  const totalRemainingAmount = customerInstallments.reduce((sum, i) => sum + i.remaining_amount, 0);

  const totalOverdueAmount = customerInstallments
    .filter((i) => i.status === 'overdue')
    .reduce((sum, i) => sum + i.remaining_amount, 0);

  const lastPayment = customerPayments.find((p) => p.status === 'recorded');
  const lastPlan = customerPlans[0];

  // Printable Statement Export handler
  const handlePrintStatement = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const rows = [
      ['التاريخ', 'البيان / الحركة', 'رقم المرجع', 'مدين (المطلوب)', 'دائن (المدفوع)', 'طريقة الدفع'],
    ];

    // Add down payments & installments
    customerPlans.forEach((p) => {
      rows.push([
        p.created_at,
        `عقد تقسيط - ${p.plan_number}`,
        p.plan_number,
        p.total_amount.toFixed(2),
        '0.00',
        '-',
      ]);
      if (p.down_payment > 0) {
        rows.push([
          p.created_at,
          `سداد دفعة أولى - ${p.plan_number}`,
          p.plan_number,
          '0.00',
          p.down_payment.toFixed(2),
          'نقد/شبكة',
        ]);
      }
    });

    customerPayments.forEach((pm) => {
      rows.push([
        pm.paid_at.split('T')[0],
        `سداد دفعة قسط ${pm.status === 'reversed' ? '(معكوسة)' : ''}`,
        pm.payment_number,
        '0.00',
        pm.status === 'reversed' ? `-${pm.amount.toFixed(2)}` : pm.amount.toFixed(2),
        pm.payment_method,
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `statement_${customer.national_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 flex items-start justify-between relative shrink-0">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-inner">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{customer.full_name}</h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    customer.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {customer.status === 'active' ? 'عميل نشط' : 'عميل مؤرشف'}
                </span>
                {totalOverdueAmount > 0 && (
                  <span className="bg-rose-600 text-white text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    عليه متأخرات: {FinancialEngine.formatCurrency(totalOverdueAmount, currency)}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
                <span className="flex items-center gap-1 font-mono">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  {customer.national_id}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {customer.phone}
                </span>
                {customer.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {customer.address}
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-4 h-4" />
                  مسجل منذ {customer.created_at}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenCreatePlanForCustomer && (
              <button
                type="button"
                onClick={() => onOpenCreatePlanForCustomer(customer)}
                className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                خطة تقسيط جديدة
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Financial KPI Summary Cards (Section 26 Requirements) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs text-slate-500 block mb-0.5">إجمالي الخطط</span>
            <span className="text-lg font-bold text-slate-900">{totalPlansCount}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              {lastPlan ? lastPlan.plan_number : 'لا توجد'}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs text-slate-500 block mb-0.5">إجمالي المبالغ</span>
            <span className="text-lg font-bold text-slate-900 font-mono">
              {FinancialEngine.formatCurrency(totalContractedAmount, currency)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">قيمة العقود</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-emerald-100 bg-emerald-50/20 shadow-2xs">
            <span className="text-xs text-emerald-700 block mb-0.5">إجمالي المدفوع</span>
            <span className="text-lg font-bold text-emerald-600 font-mono">
              {FinancialEngine.formatCurrency(totalPaidAmount, currency)}
            </span>
            <span className="text-[11px] text-emerald-600/70 block mt-0.5">
              نسبة: {totalContractedAmount > 0 ? Math.round((totalPaidAmount / totalContractedAmount) * 100) : 0}%
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-blue-100 bg-blue-50/20 shadow-2xs">
            <span className="text-xs text-blue-700 block mb-0.5">إجمالي المتبقي</span>
            <span className="text-lg font-bold text-blue-600 font-mono">
              {FinancialEngine.formatCurrency(totalRemainingAmount, currency)}
            </span>
            <span className="text-[11px] text-blue-500/70 block mt-0.5">رصيد قائم</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-rose-200 bg-rose-50/30 shadow-2xs">
            <span className="text-xs text-rose-700 block mb-0.5">إجمالي المتأخرات</span>
            <span className="text-lg font-bold text-rose-600 font-mono">
              {FinancialEngine.formatCurrency(totalOverdueAmount, currency)}
            </span>
            <span className="text-[11px] text-rose-500/70 block mt-0.5">أقساط متأخرة</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs text-slate-500 block mb-0.5">آخر دفعة سداد</span>
            <span className="text-sm font-bold text-slate-800 font-mono truncate block">
              {lastPayment ? FinancialEngine.formatCurrency(lastPayment.amount, currency) : 'لا يوجد'}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {lastPayment ? lastPayment.paid_at.split('T')[0] : '-'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-4 bg-white shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'plans'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            الخطط ({customerPlans.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('installments')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'installments'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            الأقساط ومواعيد الاستحقاق ({customerInstallments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Receipt className="w-4 h-4" />
            الدفعات وسندات القبض ({customerPayments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('statement')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'statement'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            كشف الحساب المالي
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            سجل النشاط والتدقيق ({customerLogs.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* TAB 1: PLANS */}
          {activeTab === 'plans' && (
            <div className="space-y-4">
              {customerPlans.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>لا توجد خطط تقسيط مسجلة لهذا العميل حالياً</p>
                </div>
              ) : (
                customerPlans.map((plan) => {
                  const store = state.stores.find((s) => s.id === plan.store_id);
                  const planInsts = customerInstallments.filter((i) => i.plan_id === plan.id);
                  const paidInPlan = planInsts.reduce((s, i) => s + i.paid_amount, 0);
                  const progressPct = plan.remaining_amount > 0
                    ? Math.round((paidInPlan / plan.remaining_amount) * 100)
                    : 100;

                  return (
                    <div
                      key={plan.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 hover:border-emerald-300 transition-colors shadow-2xs"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 font-mono text-base">{plan.plan_number}</span>
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                                plan.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : plan.status === 'overdue'
                                  ? 'bg-rose-100 text-rose-800'
                                  : plan.status === 'active'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {plan.status === 'completed'
                                ? 'مكتملة السداد'
                                : plan.status === 'overdue'
                                ? 'متأخرة'
                                : plan.status === 'active'
                                ? 'نشطة'
                                : plan.status === 'approved'
                                ? 'معتمدة'
                                : plan.status === 'draft'
                                ? 'مسودة'
                                : 'ملغاة'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 mt-1 block">
                            المتجر: {store?.name || 'الفرع الرئيسي'} | تاريخ الإنشاء: {plan.created_at}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {onOpenPlanInvoice && (
                            <button
                              type="button"
                              onClick={() => onOpenPlanInvoice(plan)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              فاتورة الخطة
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Financial numbers */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg text-xs mb-3">
                        <div>
                          <span className="text-slate-500 block">إجمالي الخطة</span>
                          <span className="font-bold font-mono text-slate-900">
                            {FinancialEngine.formatCurrency(plan.total_amount, currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">الدفعة الأولى</span>
                          <span className="font-bold font-mono text-slate-900">
                            {FinancialEngine.formatCurrency(plan.down_payment, currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">المبلغ المتبقي للأقساط</span>
                          <span className="font-bold font-mono text-slate-900">
                            {FinancialEngine.formatCurrency(plan.remaining_amount, currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">المدة وعدد الأقساط</span>
                          <span className="font-bold text-slate-900">{plan.duration_months} أشهر ({plan.duration_months} قسط)</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>المسدد من الأقساط: {FinancialEngine.formatCurrency(paidInPlan, currency)}</span>
                          <span>نسبة الإنجاز: {progressPct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, progressPct)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: INSTALLMENTS SCHEDULE */}
          {activeTab === 'installments' && (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs sm:text-sm divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3 text-start">القسط</th>
                    <th className="p-3 text-start">الخطة</th>
                    <th className="p-3 text-start">تاريخ الاستحقاق</th>
                    <th className="p-3 text-start">المبلغ</th>
                    <th className="p-3 text-start">المدفوع</th>
                    <th className="p-3 text-start">المتبقي</th>
                    <th className="p-3 text-start">الحالة</th>
                    <th className="p-3 text-end">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerInstallments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">
                        لا توجد أقساط مسجلة
                      </td>
                    </tr>
                  ) : (
                    customerInstallments.map((inst) => {
                      const plan = customerPlans.find((p) => p.id === inst.plan_id);
                      return (
                        <tr key={inst.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3 font-semibold text-slate-900">قسط #{inst.installment_number}</td>
                          <td className="p-3 font-mono text-xs text-slate-600">{plan?.plan_number || '-'}</td>
                          <td className="p-3 font-mono text-slate-700">{inst.due_date}</td>
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
                            {inst.status !== 'paid' && onOpenRecordPayment && plan && (
                              <button
                                type="button"
                                onClick={() => onOpenRecordPayment(inst, plan)}
                                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1 rounded-md transition-colors"
                              >
                                سداد دفعة
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: PAYMENTS & RECEIPTS */}
          {activeTab === 'payments' && (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs sm:text-sm divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3 text-start">رقم الإيصال</th>
                    <th className="p-3 text-start">تاريخ السداد</th>
                    <th className="p-3 text-start">المبلغ</th>
                    <th className="p-3 text-start">طريقة الدفع</th>
                    <th className="p-3 text-start">الموظف المستلم</th>
                    <th className="p-3 text-start">الحالة</th>
                    <th className="p-3 text-end">معاينة الإيصال</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        لا توجد دفعات مسجلة حتى الآن
                      </td>
                    </tr>
                  ) : (
                    customerPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-900">{payment.payment_number}</td>
                        <td className="p-3 font-mono text-slate-600">{payment.paid_at.replace('T', ' ').substring(0, 16)}</td>
                        <td className="p-3 font-mono font-bold text-emerald-700 text-sm">
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
                            {payment.status === 'recorded' ? 'مسجلة ومعتمدة' : 'معكوسة'}
                          </span>
                        </td>
                        <td className="p-3 text-end">
                          {onOpenReceipt && (
                            <button
                              type="button"
                              onClick={() => onOpenReceipt(payment)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              سند قبض
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: STATEMENT OF ACCOUNT (كشف حساب العميل - Section 29) */}
          {activeTab === 'statement' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">كشف حساب العميل الشامل</h4>
                  <p className="text-xs text-slate-500">سجل محاسبي لكافة العقود والدفعات والأرصدة المستحقة</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    تصدير Excel (CSV)
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintStatement}
                    className="inline-flex items-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    طباعة الكشف
                  </button>
                </div>
              </div>

              {/* Printable Statement Layout */}
              <div className="border border-slate-200 rounded-xl overflow-hidden print-card">
                <div className="p-4 bg-slate-100/70 border-b border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800">العميل: {customer.full_name}</span>
                    <span className="text-slate-500 ms-3">الهوية: {customer.national_id}</span>
                  </div>
                  <div className="font-mono text-slate-600">
                    تاريخ الإصدار: {new Date().toISOString().split('T')[0]}
                  </div>
                </div>

                <table className="w-full text-start text-xs sm:text-sm divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-3 text-start">التاريخ</th>
                      <th className="p-3 text-start">نوع الحركة والبيان</th>
                      <th className="p-3 text-start">رقم المرجع</th>
                      <th className="p-3 text-start">مدين (عقود)</th>
                      <th className="p-3 text-start">دائن (سدادات)</th>
                      <th className="p-3 text-end">طريقة السداد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Contract rows */}
                    {customerPlans.map((plan) => (
                      <React.Fragment key={plan.id}>
                        <tr className="bg-slate-50/40">
                          <td className="p-3 font-mono">{plan.created_at}</td>
                          <td className="p-3 font-semibold text-slate-900">
                            عقد تقسيط #{plan.plan_number} ({plan.duration_months} أشهر)
                          </td>
                          <td className="p-3 font-mono text-slate-500">{plan.plan_number}</td>
                          <td className="p-3 font-mono font-bold text-slate-900">
                            {FinancialEngine.formatCurrency(plan.total_amount, currency)}
                          </td>
                          <td className="p-3 font-mono text-slate-400">0.00</td>
                          <td className="p-3 text-end text-slate-500">-</td>
                        </tr>
                        {plan.down_payment > 0 && (
                          <tr className="bg-emerald-50/20">
                            <td className="p-3 font-mono">{plan.created_at}</td>
                            <td className="p-3 text-emerald-800">سداد الدفعة الأولى للعقد</td>
                            <td className="p-3 font-mono text-slate-500">{plan.plan_number}</td>
                            <td className="p-3 font-mono text-slate-400">0.00</td>
                            <td className="p-3 font-mono font-bold text-emerald-700">
                              {FinancialEngine.formatCurrency(plan.down_payment, currency)}
                            </td>
                            <td className="p-3 text-end text-slate-600">نقد/شبكة</td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}

                    {/* Payments rows */}
                    {customerPayments.map((pm) => (
                      <tr key={pm.id} className={pm.status === 'reversed' ? 'bg-rose-50/30' : ''}>
                        <td className="p-3 font-mono">{pm.paid_at.split('T')[0]}</td>
                        <td className="p-3">
                          سداد قسط مالي بموجب سند قبض
                          {pm.status === 'reversed' && (
                            <span className="text-xs text-rose-600 font-bold block">(دفعة معكوسة)</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-700">{pm.payment_number}</td>
                        <td className="p-3 font-mono text-slate-400">0.00</td>
                        <td className="p-3 font-mono font-bold text-emerald-700">
                          {pm.status === 'reversed' ? `-${FinancialEngine.formatCurrency(pm.amount, currency)}` : FinancialEngine.formatCurrency(pm.amount, currency)}
                        </td>
                        <td className="p-3 text-end text-slate-700">
                          {pm.payment_method === 'cash' ? 'نقدًا' : pm.payment_method === 'bank_transfer' ? 'تحويل' : 'شبكة'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold text-xs sm:text-sm">
                    <tr>
                      <td colSpan={3} className="p-3 text-slate-900">الإجمالي النهائي والأرصدة القائمة:</td>
                      <td className="p-3 font-mono text-slate-900">{FinancialEngine.formatCurrency(totalContractedAmount, currency)}</td>
                      <td className="p-3 font-mono text-emerald-700">{FinancialEngine.formatCurrency(totalPaidAmount, currency)}</td>
                      <td className="p-3 text-end font-mono text-rose-600">
                        المتبقي: {FinancialEngine.formatCurrency(totalRemainingAmount, currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ACTIVITY LOGS */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              {customerLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">لا توجد حركات مسجلة</div>
              ) : (
                customerLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-start justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-800 block mb-0.5">{log.details}</span>
                      <span className="text-slate-500">بواسطة: {log.user_name} ({log.user_role})</span>
                      {log.reason && (
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded block mt-1">السبب: {log.reason}</span>
                      )}
                    </div>
                    <span className="font-mono text-slate-400 whitespace-nowrap">
                      {log.timestamp.replace('T', ' ').substring(0, 16)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
