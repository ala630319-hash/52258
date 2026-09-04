/**
 * Reports Hub View (Section 31 - التقارير)
 * Comprehensive analytical reports with date ranges, store filters, sortable tables, CSV export, and print capabilities:
 * 1. Collections Report (تقرير التحصيل)
 * 2. Overdue Installments Report (تقرير المتأخرات)
 * 3. Upcoming Due Installments Report (تقرير الأقساط المستحقة)
 * 4. Store Performance & Comparison (تقرير المتاجر)
 * 5. Payment Methods Analysis (تقرير طرق الدفع)
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FinancialEngine } from '../../services/financialEngine';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Filter,
  Building2,
  AlertTriangle,
  Receipt,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { state, currency } = useApp();

  const [activeReport, setActiveReport] = useState<'collections' | 'overdue' | 'upcoming' | 'stores' | 'methods'>('collections');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Collections Report Data
  const collectionsData = useMemo(() => {
    return state.payments
      .filter((p) => {
        if (selectedStoreId !== 'all') {
          const plan = state.plans.find((pl) => pl.id === p.plan_id);
          if (plan?.store_id !== selectedStoreId) return false;
        }
        const payDate = p.paid_at.split('T')[0];
        if (fromDate && payDate < fromDate) return false;
        if (toDate && payDate > toDate) return false;
        return true;
      })
      .map((p) => {
        const customer = state.customers.find((c) => c.id === p.customer_id);
        const plan = state.plans.find((pl) => pl.id === p.plan_id);
        const store = plan ? state.stores.find((s) => s.id === plan.store_id) : undefined;
        return { payment: p, customer, plan, store };
      });
  }, [state.payments, state.plans, state.customers, state.stores, selectedStoreId, fromDate, toDate]);

  // Overdue Installments Data
  const overdueData = useMemo(() => {
    return state.installments
      .filter((inst) => inst.status === 'overdue')
      .filter((inst) => {
        if (selectedStoreId !== 'all') {
          const plan = state.plans.find((pl) => pl.id === inst.plan_id);
          if (plan?.store_id !== selectedStoreId) return false;
        }
        if (fromDate && inst.due_date < fromDate) return false;
        if (toDate && inst.due_date > toDate) return false;
        return true;
      })
      .map((inst) => {
        const plan = state.plans.find((pl) => pl.id === inst.plan_id);
        const customer = plan ? state.customers.find((c) => c.id === plan.customer_id) : undefined;
        const store = plan ? state.stores.find((s) => s.id === plan.store_id) : undefined;
        return { installment: inst, plan, customer, store };
      });
  }, [state.installments, state.plans, state.customers, state.stores, selectedStoreId, fromDate, toDate]);

  // Upcoming Due Installments Data
  const upcomingData = useMemo(() => {
    return state.installments
      .filter((inst) => inst.status === 'due' || inst.status === 'partially_paid')
      .filter((inst) => {
        if (selectedStoreId !== 'all') {
          const plan = state.plans.find((pl) => pl.id === inst.plan_id);
          if (plan?.store_id !== selectedStoreId) return false;
        }
        if (fromDate && inst.due_date < fromDate) return false;
        if (toDate && inst.due_date > toDate) return false;
        return true;
      })
      .map((inst) => {
        const plan = state.plans.find((pl) => pl.id === inst.plan_id);
        const customer = plan ? state.customers.find((c) => c.id === plan.customer_id) : undefined;
        const store = plan ? state.stores.find((s) => s.id === plan.store_id) : undefined;
        return { installment: inst, plan, customer, store };
      });
  }, [state.installments, state.plans, state.customers, state.stores, selectedStoreId, fromDate, toDate]);

  // Store Performance Data
  const storesData = useMemo(() => {
    return state.stores.map((store) => {
      const storePlans = state.plans.filter((p) => p.store_id === store.id);
      const storePlanIds = storePlans.map((p) => p.id);
      const storeInsts = state.installments.filter((i) => storePlanIds.includes(i.plan_id));
      const totalContracted = storePlans.reduce((s, p) => s + p.total_amount, 0);
      const totalCollected = storeInsts.reduce((s, i) => s + i.paid_amount, 0) +
        storePlans.reduce((s, p) => s + p.down_payment, 0);
      const totalRemaining = storeInsts.reduce((s, i) => s + i.remaining_amount, 0);
      const overdue = storeInsts.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.remaining_amount, 0);
      const rate = totalContracted > 0 ? Math.round((totalCollected / totalContracted) * 100) : 0;

      return {
        store,
        plansCount: storePlans.length,
        totalContracted,
        totalCollected,
        totalRemaining,
        overdue,
        rate,
      };
    });
  }, [state.stores, state.plans, state.installments]);

  // Export to CSV
  const handleExportCSV = () => {
    let rows: string[][] = [];

    if (activeReport === 'collections') {
      rows.push(['رقم السند', 'تاريخ السداد', 'العميل', 'المتجر', 'المبلغ', 'طريقة الدفع', 'الموظف', 'الحالة']);
      collectionsData.forEach(({ payment: p, customer: c, store: s }) => {
        rows.push([
          p.payment_number,
          p.paid_at.replace('T', ' ').substring(0, 16),
          c?.full_name || '',
          s?.name || '',
          p.amount.toFixed(2),
          p.payment_method,
          p.created_by,
          p.status === 'recorded' ? 'معتمدة' : 'معكوسة',
        ]);
      });
    } else if (activeReport === 'overdue') {
      rows.push(['العميل', 'الهوية', 'الجوال', 'الخطة', 'القسط', 'تاريخ الاستحقاق', 'المبلغ المتأخر', 'المتجر']);
      overdueData.forEach(({ installment: inst, customer: c, plan: pl, store: s }) => {
        rows.push([
          c?.full_name || '',
          c?.national_id || '',
          c?.phone || '',
          pl?.plan_number || '',
          `قسط #${inst.installment_number}`,
          inst.due_date,
          inst.remaining_amount.toFixed(2),
          s?.name || '',
        ]);
      });
    } else {
      rows.push(['المتجر', 'الكود', 'عدد الخطط', 'إجمالي العقود', 'المحصل', 'المتبقي', 'المتأخرات', 'نسبة التحصيل']);
      storesData.forEach((st) => {
        rows.push([
          st.store?.name || 'الفرع',
          st.store?.code || '',
          st.plansCount.toString(),
          st.totalContracted.toFixed(2),
          st.totalCollected.toFixed(2),
          st.totalRemaining.toFixed(2),
          st.overdue.toFixed(2),
          `${st.rate}%`,
        ]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `report_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">مركز التقارير المالية</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            تقارير تحليلية ومحاسبية دقيقة قابلة للطباعة والتصدير الفوري إلى Excel/CSV
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            تصدير CSV / Excel
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            طباعة التقرير
          </button>
        </div>
      </div>

      {/* Report Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-2xs overflow-x-auto gap-1">
        <button
          type="button"
          onClick={() => setActiveReport('collections')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeReport === 'collections'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          تقرير التحصيل ({collectionsData.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('overdue')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeReport === 'overdue'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          تقرير الأقساط المتأخرة ({overdueData.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('upcoming')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeReport === 'upcoming'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          تقرير الأقساط المستحقة القادمة ({upcomingData.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('stores')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeReport === 'stores'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          تقرير أداء المتاجر والمقارنة ({storesData.length})
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold">المتجر:</span>
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">كافة المتاجر ({state.stores.length})</option>
            {state.stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold">من تاريخ:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold">إلى تاريخ:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {(fromDate || toDate || selectedStoreId !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setFromDate('');
              setToDate('');
              setSelectedStoreId('all');
            }}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline ms-auto"
          >
            إعادة تعيين الفلاتر
          </button>
        )}
      </div>

      {/* Report Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs print-card">
        {/* REPORT 1: COLLECTIONS */}
        {activeReport === 'collections' && (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs sm:text-sm divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3.5 text-start">رقم السند</th>
                  <th className="p-3.5 text-start">تاريخ ووقت السداد</th>
                  <th className="p-3.5 text-start">العميل</th>
                  <th className="p-3.5 text-start">المتجر</th>
                  <th className="p-3.5 text-start">المبلغ المحصل</th>
                  <th className="p-3.5 text-start">طريقة الدفع</th>
                  <th className="p-3.5 text-start">الموظف المحصل</th>
                  <th className="p-3.5 text-end">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {collectionsData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      لا توجد عمليات تحصيل تطابق الفلاتر المحددة
                    </td>
                  </tr>
                ) : (
                  collectionsData.map(({ payment: p, customer: c, store: s }) => (
                    <tr key={p.id} className={p.status === 'reversed' ? 'bg-rose-50/40' : 'hover:bg-slate-50/70'}>
                      <td className="p-3.5 font-mono font-bold text-slate-900">{p.payment_number}</td>
                      <td className="p-3.5 font-mono text-slate-600">{p.paid_at.replace('T', ' ').substring(0, 16)}</td>
                      <td className="p-3.5 font-bold text-slate-900">{c?.full_name || '-'}</td>
                      <td className="p-3.5 text-slate-700">{s?.name || '-'}</td>
                      <td className="p-3.5 font-mono font-bold text-emerald-700">
                        {FinancialEngine.formatCurrency(p.amount, currency)}
                      </td>
                      <td className="p-3.5 text-slate-700">
                        {p.payment_method === 'cash'
                          ? 'نقدًا'
                          : p.payment_method === 'bank_transfer'
                          ? 'تحويل بنكي'
                          : 'شبكة / مدى'}
                      </td>
                      <td className="p-3.5 text-slate-600">{p.created_by}</td>
                      <td className="p-3.5 text-end">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            p.status === 'recorded'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800 font-semibold'
                          }`}
                        >
                          {p.status === 'recorded' ? 'معتمدة' : 'معكوسة'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {collectionsData.length > 0 && (
                <tfoot className="bg-slate-100 font-bold text-xs sm:text-sm">
                  <tr>
                    <td colSpan={4} className="p-3.5 text-slate-900">
                      إجمالي المبالغ المحصلة في التقرير:
                    </td>
                    <td colSpan={4} className="p-3.5 font-mono text-emerald-700 text-base">
                      {FinancialEngine.formatCurrency(
                        collectionsData
                          .filter(({ payment: p }) => p.status === 'recorded')
                          .reduce((s, { payment: p }) => s + p.amount, 0),
                        currency
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* REPORT 2: OVERDUE */}
        {activeReport === 'overdue' && (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs sm:text-sm divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3.5 text-start">العميل</th>
                  <th className="p-3.5 text-start">الهوية والجوال</th>
                  <th className="p-3.5 text-start">خطة التقسيط</th>
                  <th className="p-3.5 text-start">القسط المتأخر</th>
                  <th className="p-3.5 text-start">تاريخ الاستحقاق</th>
                  <th className="p-3.5 text-start">المبلغ المتأخر</th>
                  <th className="p-3.5 text-end">المتجر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      ممتاز! لا توجد أي أقساط متأخرة
                    </td>
                  </tr>
                ) : (
                  overdueData.map(({ installment: inst, customer: c, plan: pl, store: s }) => (
                    <tr key={inst.id} className="hover:bg-slate-50/70">
                      <td className="p-3.5 font-bold text-slate-900">{c?.full_name}</td>
                      <td className="p-3.5 font-mono text-slate-600 text-xs">
                        <div>{c?.phone}</div>
                        <div className="text-[11px] text-slate-400">{c?.national_id}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">{pl?.plan_number}</td>
                      <td className="p-3.5 font-bold text-slate-800">قسط #{inst.installment_number}</td>
                      <td className="p-3.5 font-mono text-rose-600 font-semibold">{inst.due_date}</td>
                      <td className="p-3.5 font-mono font-bold text-rose-600 text-sm">
                        {FinancialEngine.formatCurrency(inst.remaining_amount, currency)}
                      </td>
                      <td className="p-3.5 text-end text-slate-600">{s?.name}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {overdueData.length > 0 && (
                <tfoot className="bg-rose-50 font-bold text-xs sm:text-sm">
                  <tr>
                    <td colSpan={5} className="p-3.5 text-rose-900">
                      إجمالي مبالغ الأقساط المتأخرة:
                    </td>
                    <td colSpan={2} className="p-3.5 font-mono text-rose-700 text-base">
                      {FinancialEngine.formatCurrency(
                        overdueData.reduce((s, { installment: i }) => s + i.remaining_amount, 0),
                        currency
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* REPORT 3: UPCOMING */}
        {activeReport === 'upcoming' && (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs sm:text-sm divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3.5 text-start">العميل</th>
                  <th className="p-3.5 text-start">رقم الخطة</th>
                  <th className="p-3.5 text-start">القسط</th>
                  <th className="p-3.5 text-start">تاريخ الاستحقاق</th>
                  <th className="p-3.5 text-start">قيمة القسط</th>
                  <th className="p-3.5 text-start">المتبقي</th>
                  <th className="p-3.5 text-end">المتجر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      لا توجد أقساط مستحقة قادمة في النطاق الزمني المحدد
                    </td>
                  </tr>
                ) : (
                  upcomingData.map(({ installment: inst, customer: c, plan: pl, store: s }) => (
                    <tr key={inst.id} className="hover:bg-slate-50/70">
                      <td className="p-3.5 font-bold text-slate-900">{c?.full_name}</td>
                      <td className="p-3.5 font-mono text-slate-700">{pl?.plan_number}</td>
                      <td className="p-3.5 font-semibold text-slate-800">قسط #{inst.installment_number}</td>
                      <td className="p-3.5 font-mono text-blue-700 font-semibold">{inst.due_date}</td>
                      <td className="p-3.5 font-mono font-medium text-slate-900">
                        {FinancialEngine.formatCurrency(inst.amount, currency)}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {FinancialEngine.formatCurrency(inst.remaining_amount, currency)}
                      </td>
                      <td className="p-3.5 text-end text-slate-600">{s?.name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 4: STORES COMPARISON */}
        {activeReport === 'stores' && (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs sm:text-sm divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3.5 text-start">المتجر</th>
                  <th className="p-3.5 text-start">الكود</th>
                  <th className="p-3.5 text-start">عدد الخطط</th>
                  <th className="p-3.5 text-start">إجمالي قيمة العقود</th>
                  <th className="p-3.5 text-start">المحصل الفعلي</th>
                  <th className="p-3.5 text-start">المتبقي للتحصيل</th>
                  <th className="p-3.5 text-start">المتأخرات</th>
                  <th className="p-3.5 text-end">نسبة التحصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {storesData.map((st) => (
                  <tr key={st.store?.id || Math.random()} className="hover:bg-slate-50/70">
                    <td className="p-3.5 font-bold text-slate-900">{st.store?.name || 'الفرع'}</td>
                    <td className="p-3.5 font-mono text-slate-500 font-semibold">{st.store?.code || '-'}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{st.plansCount}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {FinancialEngine.formatCurrency(st.totalContracted, currency)}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-emerald-700">
                      {FinancialEngine.formatCurrency(st.totalCollected, currency)}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-blue-700">
                      {FinancialEngine.formatCurrency(st.totalRemaining, currency)}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-rose-600">
                      {FinancialEngine.formatCurrency(st.overdue, currency)}
                    </td>
                    <td className="p-3.5 text-end">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-full text-xs">
                        {st.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
