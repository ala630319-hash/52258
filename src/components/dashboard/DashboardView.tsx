/**
 * Dashboard View (Section 30 - لوحة التحكم Dashboard)
 * Core analytical command center:
 * KPIs, Monthly Collection Target ring, 6-Month Chart, Payment Methods distribution, and Urgent Due Installments with direct pay action.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FinancialEngine } from '../../services/financialEngine';
import { Customer, Installment, InstallmentPlan } from '../../types';
import {
  Users,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Building2,
  DollarSign,
  PlusCircle,
  Receipt,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenRecordPayment: (installment: Installment, plan: InstallmentPlan) => void;
  onOpenCustomer360: (customer: Customer) => void;
  onOpenPlanDetails: (plan: InstallmentPlan) => void;
  onOpenCreatePlan: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenRecordPayment,
  onOpenCustomer360,
  onOpenPlanDetails,
  onOpenCreatePlan,
}) => {
  const { state, currency } = useApp();

  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'prev_month' | 'six_months'>('month');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7); // e.g. "2026-03"

  // Filter plans and installments by store if selected
  const activePlans = useMemo(() => {
    return state.plans.filter((p) => {
      if (selectedStoreId !== 'all' && p.store_id !== selectedStoreId) return false;
      return true;
    });
  }, [state.plans, selectedStoreId]);

  const activePlanIds = useMemo(() => activePlans.map((p) => p.id), [activePlans]);

  const activeInstallments = useMemo(() => {
    return state.installments.filter((i) => activePlanIds.includes(i.plan_id));
  }, [state.installments, activePlanIds]);

  const activePayments = useMemo(() => {
    return state.payments.filter((p) => activePlanIds.includes(p.plan_id) && p.status === 'recorded');
  }, [state.payments, activePlanIds]);

  // KPIs
  const totalCustomers = state.customers.length;
  const newCustomersThisMonth = state.customers.filter((c) => c.created_at.startsWith(currentMonthStr)).length;

  const totalContractedAmount = activePlans.reduce((sum, p) => sum + p.total_amount, 0);

  // Collected this month (installments paid + down payments created this month)
  const collectedThisMonth = activePayments
    .filter((p) => p.paid_at.startsWith(currentMonthStr))
    .reduce((sum, p) => sum + p.amount, 0) +
    activePlans
      .filter((p) => p.created_at.startsWith(currentMonthStr))
      .reduce((sum, p) => sum + p.down_payment, 0);

  // Due this month
  const dueThisMonth = activeInstallments
    .filter((i) => i.due_date.startsWith(currentMonthStr))
    .reduce((sum, i) => sum + i.amount, 0);

  // Overdue total and count
  const overdueInstallments = activeInstallments.filter((i) => i.status === 'overdue');
  const totalOverdueAmount = overdueInstallments.reduce((sum, i) => sum + i.remaining_amount, 0);

  const overdueCustomerIds = new Set(
    overdueInstallments.map((inst) => {
      const plan = state.plans.find((p) => p.id === inst.plan_id);
      return plan?.customer_id;
    }).filter(Boolean)
  );
  const overdueCustomersCount = overdueCustomerIds.size;

  // Collection rate %
  const collectionRate = dueThisMonth > 0
    ? Math.min(100, Math.round((collectedThisMonth / dueThisMonth) * 100))
    : 100;

  // Monthly Target comparison
  const monthlyTarget = state.settings.monthly_target || 50000;
  const targetPct = Math.min(100, Math.round((collectedThisMonth / monthlyTarget) * 100));

  // Payment Methods Breakdown
  const paymentMethodsBreakdown = useMemo(() => {
    const cash = activePayments.filter((p) => p.payment_method === 'cash').reduce((s, p) => s + p.amount, 0);
    const pos = activePayments.filter((p) => p.payment_method === 'pos_card').reduce((s, p) => s + p.amount, 0);
    const transfer = activePayments.filter((p) => p.payment_method === 'bank_transfer').reduce((s, p) => s + p.amount, 0);
    const total = cash + pos + transfer || 1;

    return {
      cash: { amount: cash, pct: Math.round((cash / total) * 100) },
      pos: { amount: pos, pct: Math.round((pos / total) * 100) },
      transfer: { amount: transfer, pct: Math.round((transfer / total) * 100) },
    };
  }, [activePayments]);

  // 6-Month Trend Data
  const sixMonthTrend = useMemo(() => {
    const months: { label: string; collected: number; due: number }[] = [];
    const date = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleDateString('ar-SA', { month: 'short' });

      const collected = activePayments
        .filter((p) => p.paid_at.startsWith(mStr))
        .reduce((s, p) => s + p.amount, 0);

      const due = activeInstallments
        .filter((inst) => inst.due_date.startsWith(mStr))
        .reduce((s, inst) => s + inst.amount, 0);

      months.push({ label: monthName, collected, due });
    }
    return months;
  }, [activePayments, activeInstallments]);

  const maxTrendVal = Math.max(...sixMonthTrend.map((m) => Math.max(m.collected, m.due)), 1000);

  // Urgent / Upcoming Installments
  const urgentInstallments = useMemo(() => {
    return activeInstallments
      .filter((i) => i.status === 'overdue' || (i.status === 'due' && i.due_date <= todayStr))
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 6);
  }, [activeInstallments, todayStr]);

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            لوحة مؤشرات الأداء والتحصيل
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            رؤية فورية للسيولة، الأقساط المستحقة، المتأخرات، ومستهدفات الفروع
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Store Filter */}
          <div className="w-44">
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">كافة المتاجر ({state.stores.length})</option>
              {state.stores.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onOpenCreatePlan}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            إنشاء خطة تقسيط
          </button>
        </div>
      </div>

      {/* 9 Core KPI Cards (Section 30 Mandates) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {/* 1: Total Customers */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">إجمالي العملاء</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalCustomers}</div>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
            +{newCustomersThisMonth} عميل هذا الشهر
          </span>
        </div>

        {/* 2: Total Plans Amount */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">إجمالي عقود التقسيط</span>
            <CreditCard className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {FinancialEngine.formatCurrency(totalContractedAmount, currency)}
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            {activePlans.length} خطة تقسيط
          </span>
        </div>

        {/* 3: Collected This Month */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1.5">
            <span className="text-xs font-bold">المحصل هذا الشهر</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600 font-mono">
            {FinancialEngine.formatCurrency(collectedThisMonth, currency)}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium block mt-1">
            نسبة الإنجاز: {collectionRate}%
          </span>
        </div>

        {/* 4: Due This Month */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-blue-800 mb-1.5">
            <span className="text-xs font-bold">المستحق هذا الشهر</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-700 font-mono">
            {FinancialEngine.formatCurrency(dueThisMonth, currency)}
          </div>
          <span className="text-[11px] text-blue-600 block mt-1">
            أقساط دورية جارية
          </span>
        </div>

        {/* 5: Total Overdue */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-rose-800 mb-1.5">
            <span className="text-xs font-bold">إجمالي المتأخرات</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-600 font-mono">
            {FinancialEngine.formatCurrency(totalOverdueAmount, currency)}
          </div>
          <span className="text-[11px] text-rose-700 font-bold block mt-1">
            {overdueCustomersCount} عملاء متأخرون ({overdueInstallments.length} قسط)
          </span>
        </div>
      </div>

      {/* Analytics Row: Monthly Target Progress + 6-Month Trends + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Module 1: Monthly Target Ring (المستهدف الشهري) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">المستهدف الشهري للتحصيل</h3>
                <p className="text-xs text-slate-400">متابعة الأداء مقابل الهدف المحدد في الإعدادات</p>
              </div>
              <Target className="w-5 h-5 text-emerald-600" />
            </div>

            {/* Circular Progress Gauge */}
            <div className="flex items-center justify-center my-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-600 transition-all duration-700 ease-out"
                    strokeDasharray={`${targetPct}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-900">{targetPct}%</span>
                  <span className="text-[10px] text-slate-400">من المستهدف</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">المحصل الفعلي:</span>
              <span className="font-mono font-bold text-emerald-700">
                {FinancialEngine.formatCurrency(collectedThisMonth, currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">المستهدف الشهري:</span>
              <span className="font-mono font-bold text-slate-800">
                {FinancialEngine.formatCurrency(monthlyTarget, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Module 2: 6-Month Collection Trend Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">مقارنة التحصيل (آخر 6 أشهر)</h3>
                <p className="text-xs text-slate-400">حجم السيولة المحصلة شهرياً</p>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="h-44 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-200">
              {sixMonthTrend.map((m, idx) => {
                const heightPct = Math.max(8, Math.round((m.collected / maxTrendVal) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[9px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(m.collected / 1000).toFixed(0)}k
                    </span>
                    <div
                      className="w-full bg-emerald-600 rounded-t-md hover:bg-emerald-500 transition-all cursor-pointer"
                      style={{ height: `${heightPct}%` }}
                      title={`${m.label}: محصل ${FinancialEngine.formatCurrency(m.collected, currency)}`}
                    />
                    <span className="text-[10px] text-slate-600 font-semibold">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-around text-xs text-slate-500 pt-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full inline-block"></span>
              التحصيل الفعلي
            </span>
          </div>
        </div>

        {/* Module 3: Payment Methods Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">توزيع طرق الدفع</h3>
                <p className="text-xs text-slate-400">نسب استخدام قنوات السداد</p>
              </div>
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="space-y-3.5 my-4">
              {/* POS Card */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">شبكة / مدى (POS)</span>
                  <span className="font-mono text-slate-900 font-bold">{paymentMethodsBreakdown.pos.pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${paymentMethodsBreakdown.pos.pct}%` }} />
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                  {FinancialEngine.formatCurrency(paymentMethodsBreakdown.pos.amount, currency)}
                </span>
              </div>

              {/* Cash */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">نقدًا (كاش)</span>
                  <span className="font-mono text-slate-900 font-bold">{paymentMethodsBreakdown.cash.pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${paymentMethodsBreakdown.cash.pct}%` }} />
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                  {FinancialEngine.formatCurrency(paymentMethodsBreakdown.cash.amount, currency)}
                </span>
              </div>

              {/* Bank Transfer */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">تحويل بنكي</span>
                  <span className="font-mono text-slate-900 font-bold">{paymentMethodsBreakdown.transfer.pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${paymentMethodsBreakdown.transfer.pct}%` }} />
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                  {FinancialEngine.formatCurrency(paymentMethodsBreakdown.transfer.amount, currency)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 text-center">
            إجمالي الدفعات المسجلة: <strong>{activePayments.length} سند قبض</strong>
          </div>
        </div>
      </div>

      {/* Urgent & Upcoming Due Installments (Section 30 - أقساط عاجلة مع سداد فوري) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              الأقساط العاجلة والمتأخرة المستحقة للتحصيل الفوري
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة مباشرة للأقساط التي حان موعد سدادها ولم تسدد بعد
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="p-3.5 text-start">العميل</th>
                <th className="p-3.5 text-start">رقم الخطة</th>
                <th className="p-3.5 text-start">القسط</th>
                <th className="p-3.5 text-start">تاريخ الاستحقاق</th>
                <th className="p-3.5 text-start">المبلغ المتبقي</th>
                <th className="p-3.5 text-start">الحالة</th>
                <th className="p-3.5 text-end">سداد فوري</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {urgentInstallments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    لا توجد أقساط متأخرة أو عاجلة حالياً - الأداء ممتاز!
                  </td>
                </tr>
              ) : (
                urgentInstallments.map((inst) => {
                  const plan = state.plans.find((p) => p.id === inst.plan_id);
                  const customer = plan ? state.customers.find((c) => c.id === plan.customer_id) : undefined;

                  return (
                    <tr key={inst.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5">
                        {customer ? (
                          <div>
                            <button
                              type="button"
                              onClick={() => onOpenCustomer360(customer)}
                              className="font-bold text-slate-900 hover:text-emerald-700 transition-colors text-start"
                            >
                              {customer.full_name}
                            </button>
                            <span className="font-mono text-[11px] text-slate-400 block">{customer.phone}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="p-3.5 font-mono text-slate-700">
                        {plan ? (
                          <button
                            type="button"
                            onClick={() => onOpenPlanDetails(plan)}
                            className="hover:text-emerald-700 font-bold"
                          >
                            {plan.plan_number}
                          </button>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="p-3.5 font-semibold text-slate-900">قسط #{inst.installment_number}</td>

                      <td className="p-3.5 font-mono text-rose-600 font-semibold">{inst.due_date}</td>

                      <td className="p-3.5 font-mono font-bold text-rose-600 text-sm">
                        {FinancialEngine.formatCurrency(inst.remaining_amount, currency)}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            inst.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inst.status === 'overdue' ? 'متأخر' : 'مستحق'}
                        </span>
                      </td>

                      <td className="p-3.5 text-end">
                        {plan && (
                          <button
                            type="button"
                            onClick={() => onOpenRecordPayment(inst, plan)}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                          >
                            <Receipt className="w-3.5 h-3.5" />
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
      </div>
    </div>
  );
};
