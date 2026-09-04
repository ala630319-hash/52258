/**
 * Plan Invoice & Agreement Modal (Section 28 - فاتورة الخطة / العقد المالي)
 * Official A4 printable agreement containing customer info, store info, financial breakdown, installments table, terms, and signatures.
 */

import React from 'react';
import { InstallmentPlan } from '../../types';
import { useApp } from '../../context/AppContext';
import { FinancialEngine } from '../../services/financialEngine';
import { X, Printer, FileText, CheckCircle2, Shield } from 'lucide-react';

interface InvoiceModalProps {
  plan: InstallmentPlan;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ plan, onClose }) => {
  const { state, currency } = useApp();

  const customer = state.customers.find((c) => c.id === plan.customer_id);
  const store = state.stores.find((s) => s.id === plan.store_id);
  const installments = state.installments.filter((i) => i.plan_id === plan.id);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-70 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 my-4 flex flex-col max-h-[95vh]">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">عقد وخطة التقسيط الرسمية</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              طباعة العقد (A4)
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

        {/* Printable A4 Contract Area */}
        <div className="p-6 sm:p-10 overflow-y-auto print-card flex-1 bg-white text-slate-900 font-sans">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {state.settings.system_name_ar}
              </h1>
              <p className="text-xs text-slate-500">{state.settings.system_name_en}</p>
              <p className="text-xs text-slate-700 mt-1">
                المتجر المصدر: <strong className="font-bold">{store?.name}</strong> (كود: {store?.code})
              </p>
            </div>

            <div className="text-end">
              <span className="inline-block bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded tracking-wider uppercase mb-1">
                عقد خطة تقسيط
              </span>
              <div className="font-mono text-sm font-bold text-slate-900">{plan.plan_number}</div>
              <div className="font-mono text-xs text-slate-500 mt-0.5">تاريخ الإنشاء: {plan.created_at}</div>
            </div>
          </div>

          {/* Customer & Store Information Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <h4 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">
                بيانات الطرف الثاني (العميل):
              </h4>
              <div className="space-y-1 text-slate-700">
                <div>الاسم: <strong className="text-slate-900 font-bold">{customer?.full_name}</strong></div>
                <div>الهوية الوطنية / الإقامة: <strong className="font-mono text-slate-900">{customer?.national_id}</strong></div>
                <div>رقم الجوال: <strong className="font-mono text-slate-900">{customer?.phone}</strong></div>
                <div>العنوان: {customer?.address || 'غير محدد'}</div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">
                بيانات الطرف الأول (المؤسسة / المتجر):
              </h4>
              <div className="space-y-1 text-slate-700">
                <div>الاسم: <strong className="text-slate-900">{store?.name}</strong></div>
                <div>الفرع: {store?.notes || 'المركز الرئيسي'}</div>
                <div>الموظف المسؤول: {plan.approved_by || 'إدارة العمليات'}</div>
                <div>حالة العقد: <span className="font-bold text-emerald-700">معتمد وساري المفعول</span></div>
              </div>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="mb-6">
            <h4 className="font-bold text-xs text-slate-900 mb-2">الملخص المالي للعقد:</h4>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1">إجمالي قيمة الخطة</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {FinancialEngine.formatCurrency(plan.total_amount, currency)}
                </span>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1">الدفعة الأولى المستلمة</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {FinancialEngine.formatCurrency(plan.down_payment, currency)}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-emerald-800 block mb-1">المبلغ المتبقي للأقساط</span>
                <span className="text-base font-bold font-mono text-emerald-900">
                  {FinancialEngine.formatCurrency(plan.remaining_amount, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Installments Table */}
          <div className="mb-6">
            <h4 className="font-bold text-xs text-slate-900 mb-2">
              جدول الأقساط ومواعيد السداد المستحقة ({plan.duration_months} أشهر):
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-start divide-y divide-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-2.5 text-start">رقم القسط</th>
                    <th className="p-2.5 text-start">تاريخ الاستحقاق</th>
                    <th className="p-2.5 text-start">مبلغ القسط</th>
                    <th className="p-2.5 text-start">حالة السداد</th>
                    <th className="p-2.5 text-end">المتبقي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {installments.map((inst, idx) => (
                    <tr key={inst.id} className={idx === 0 ? 'bg-emerald-50/40 font-semibold' : ''}>
                      <td className="p-2.5">
                        قسط #{inst.installment_number}
                        {idx === 0 && <span className="text-[10px] text-emerald-800 font-sans ms-1">(مستحق فوراً)</span>}
                      </td>
                      <td className="p-2.5">{inst.due_date}</td>
                      <td className="p-2.5 text-slate-900">{FinancialEngine.formatCurrency(inst.amount, currency)}</td>
                      <td className="p-2.5 font-sans">
                        {inst.status === 'paid'
                          ? 'مدفوع بالكامل'
                          : inst.status === 'partially_paid'
                          ? 'مدفوع جزئياً'
                          : inst.status === 'overdue'
                          ? 'متأخر'
                          : 'مستحق'}
                      </td>
                      <td className="p-2.5 text-end text-rose-600 font-bold">
                        {FinancialEngine.formatCurrency(inst.remaining_amount, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="mb-8 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1 leading-relaxed">
            <h5 className="font-bold text-slate-800 mb-1">الشروط والأحكام العامة:</h5>
            <p>1. يقر الطرف الثاني (العميل) بصحة البيانات المذكورة أعلاه والتزامه بسداد الأقساط في مواعيد استحقاقها المحددة.</p>
            <p>2. القسط الأول مستحق في نفس تاريخ توقيع هذا العقد ويعتبر جزءاً لا يتجزأ من سريانه.</p>
            <p>3. في حال التأخر عن السداد، يحق للمؤسسة اتخاذ كافة الإجراءات النظامية المتبعة.</p>
            {plan.notes && <p className="font-semibold text-slate-800">ملاحظات العقد: {plan.notes}</p>}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-10 text-center text-xs pt-4 border-t-2 border-slate-800">
            <div>
              <p className="font-bold text-slate-800 mb-1">الطرف الثاني (العميل المقترض)</p>
              <p className="text-slate-500 mb-12">التوقيع بالاستلام والالتزام بالسداد</p>
              <div className="w-48 border-b border-slate-400 mx-auto"></div>
            </div>

            <div>
              <p className="font-bold text-slate-800 mb-1">الطرف الأول (المؤسسة / المتجر)</p>
              <p className="text-slate-500 mb-12">الاعتماد والختم الرسمي</p>
              <div className="w-48 border-b border-slate-400 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
