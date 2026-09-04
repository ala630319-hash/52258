/**
 * Plan List View (Sections 10, 11, 23)
 * Displays all installment plans with search, status filters, progress meters, and direct action triggers.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { InstallmentPlan, PlanStatus, Customer } from '../../types';
import { FinancialEngine } from '../../services/financialEngine';
import {
  FilePlus,
  Search,
  FileText,
  Printer,
  Eye,
  Building2,
  User,
  AlertCircle,
  Calendar,
  DollarSign,
  PlusCircle,
} from 'lucide-react';

interface PlanListViewProps {
  onOpenCreatePlan: () => void;
  onOpenPlanDetails: (plan: InstallmentPlan) => void;
  onOpenPlanInvoice: (plan: InstallmentPlan) => void;
  onOpenRecordPaymentForPlan?: (plan: InstallmentPlan) => void;
  onOpenCustomer360?: (customer: Customer) => void;
}

export const PlanListView: React.FC<PlanListViewProps> = ({
  onOpenCreatePlan,
  onOpenPlanDetails,
  onOpenPlanInvoice,
  onOpenRecordPaymentForPlan,
  onOpenCustomer360,
}) => {
  const { state, hasPermission, currency } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PlanStatus | 'all'>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');

  // Filter plans
  const filteredPlans = useMemo(() => {
    return state.plans
      .filter((plan) => {
        if (statusFilter !== 'all' && plan.status !== statusFilter) return false;
        if (storeFilter !== 'all' && plan.store_id !== storeFilter) return false;
        return true;
      })
      .filter((plan) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        const customer = state.customers.find((c) => c.id === plan.customer_id);
        const store = state.stores.find((s) => s.id === plan.store_id);

        return (
          plan.plan_number.toLowerCase().includes(q) ||
          (customer && customer.full_name.toLowerCase().includes(q)) ||
          (customer && customer.national_id.includes(q)) ||
          (customer && customer.phone.includes(q)) ||
          (store && store.name.toLowerCase().includes(q))
        );
      });
  }, [state.plans, state.customers, state.stores, statusFilter, storeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">خطط التقسيط</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            متابعة العقود، مواعيد الاستحقاق، نسب السداد، وحالة الأقساط
          </p>
        </div>
        {hasPermission('plans.create') && (
          <button
            type="button"
            onClick={onOpenCreatePlan}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all hover:shadow-md cursor-pointer"
          >
            <FilePlus className="w-4 h-4" />
            إنشاء خطة تقسيط جديدة
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto flex-1">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الخطة، اسم العميل، الهوية، أو المتجر..."
              className="w-full ps-10 pe-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">كافة المتاجر ({state.stores.length})</option>
              {state.stores.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({state.plans.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'active'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            نشطة ({state.plans.filter((p) => p.status === 'active').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'overdue'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            متأخرة ({state.plans.filter((p) => p.status === 'overdue').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'completed'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            مكتملة ({state.plans.filter((p) => p.status === 'completed').length})
          </button>
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="p-3.5 text-start">رقم الخطة</th>
                <th className="p-3.5 text-start">العميل</th>
                <th className="p-3.5 text-start">المتجر</th>
                <th className="p-3.5 text-start">إجمالي الخطة</th>
                <th className="p-3.5 text-start">المحصل والمتبقي</th>
                <th className="p-3.5 text-start">المدة والتقدم</th>
                <th className="p-3.5 text-start">الحالة</th>
                <th className="p-3.5 text-end">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    لا توجد خطط تطابق البحث
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => {
                  const customer = state.customers.find((c) => c.id === plan.customer_id);
                  const store = state.stores.find((s) => s.id === plan.store_id);
                  const planInsts = state.installments.filter((i) => i.plan_id === plan.id);
                  const paidInInsts = planInsts.reduce((sum, i) => sum + i.paid_amount, 0);
                  const remainingInInsts = planInsts.reduce((sum, i) => sum + i.remaining_amount, 0);
                  const totalPaid = paidInInsts + plan.down_payment;
                  const progressPct = plan.total_amount > 0 ? Math.round((totalPaid / plan.total_amount) * 100) : 0;

                  return (
                    <tr key={plan.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-slate-900">{plan.plan_number}</div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">بدأت: {plan.start_date}</span>
                      </td>

                      <td className="p-3.5">
                        {customer ? (
                          <div>
                            <button
                              type="button"
                              onClick={() => onOpenCustomer360 && onOpenCustomer360(customer)}
                              className="font-bold text-slate-900 hover:text-emerald-700 transition-colors text-start block"
                              title="عرض ملف العميل الشامل 360"
                            >
                              {customer.full_name}
                            </button>
                            <span className="font-mono text-[11px] text-slate-400">هوية: {customer.national_id}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">عميل محذوف</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="font-medium text-slate-800">{store?.name || '-'}</span>
                      </td>

                      <td className="p-3.5 font-mono">
                        <div className="font-bold text-slate-900">
                          {FinancialEngine.formatCurrency(plan.total_amount, currency)}
                        </div>
                        {plan.down_payment > 0 && (
                          <span className="text-[11px] text-emerald-700 block">
                            دفعة أولى: {FinancialEngine.formatCurrency(plan.down_payment, currency)}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 font-mono text-xs">
                        <div className="text-emerald-700 font-semibold">
                          محصل: {FinancialEngine.formatCurrency(totalPaid, currency)}
                        </div>
                        <div className="text-rose-600 font-bold">
                          متبقي: {FinancialEngine.formatCurrency(remainingInInsts, currency)}
                        </div>
                      </td>

                      <td className="p-3.5 min-w-[130px]">
                        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                          <span>{plan.duration_months} أشهر</span>
                          <span className="font-bold text-slate-700">{progressPct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              plan.status === 'completed'
                                ? 'bg-emerald-600'
                                : plan.status === 'overdue'
                                ? 'bg-rose-500'
                                : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.min(100, progressPct)}%` }}
                          />
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            plan.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 font-semibold'
                              : plan.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800 font-bold'
                              : plan.status === 'active'
                              ? 'bg-blue-100 text-blue-800'
                              : plan.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {plan.status === 'completed'
                            ? 'مكتملة'
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
                      </td>

                      <td className="p-3.5 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Details */}
                          <button
                            type="button"
                            onClick={() => onOpenPlanDetails(plan)}
                            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            title="عرض تفاصيل الخطة والأقساط"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            تفاصيل
                          </button>

                          {/* Print Invoice */}
                          <button
                            type="button"
                            onClick={() => onOpenPlanInvoice(plan)}
                            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            title="طباعة فاتورة وعقد الخطة"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
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
    </div>
  );
};
