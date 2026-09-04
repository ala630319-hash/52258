/**
 * Financial Audit Trail View (Section 22 & 33 - سجل التدقيق المالي غير القابل للتلاعب)
 * Immutable ledger of all financial mutations:
 * Payments, Reversals, Due date modifications, Plan approvals/cancellations, and Backup/Restore events.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FinancialAuditLog } from '../../types';
import {
  ShieldCheck,
  Search,
  RotateCcw,
  Receipt,
  Calendar,
  AlertCircle,
  FileText,
  Database,
  User,
  Clock,
  Filter,
} from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const { state } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return state.auditLogs
      .filter((log) => {
        if (actionFilter !== 'all' && log.action !== actionFilter) return false;
        return true;
      })
      .filter((log) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          log.details.toLowerCase().includes(q) ||
          log.user_name.toLowerCase().includes(q) ||
          log.entity_id.toLowerCase().includes(q) ||
          (log.reason && log.reason.toLowerCase().includes(q))
        );
      });
  }, [state.auditLogs, actionFilter, searchQuery]);

  const getActionBadge = (action: FinancialAuditLog['action']) => {
    switch (action) {
      case 'payment_created':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 w-fit">
            <Receipt className="w-3.5 h-3.5" /> تسجيل دفعة
          </span>
        );
      case 'payment_reversed':
        return (
          <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit">
            <RotateCcw className="w-3.5 h-3.5" /> عكس دفعة
          </span>
        );
      case 'installment_due_date_changed':
        return (
          <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 w-fit">
            <Calendar className="w-3.5 h-3.5" /> تعديل تاريخ استحقاق
          </span>
        );
      case 'plan_created':
        return (
          <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 w-fit">
            <FileText className="w-3.5 h-3.5" /> إنشاء خطة
          </span>
        );
      case 'plan_cancelled':
        return (
          <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 w-fit">
            <AlertCircle className="w-3.5 h-3.5" /> إلغاء خطة
          </span>
        );
      case 'backup_created':
      case 'backup_restored':
        return (
          <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 w-fit">
            <Database className="w-3.5 h-3.5" /> نسخة احتياطية
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-medium w-fit">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            سجل التدقيق المالي والرقابة
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            سجل مالي ثابت غير قابل للتعديل يوثق كافة التحصيلات، العكوسات، والتعديلات المحاسبية
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالبيان، اسم المستخدم، السبب، أو معرّف الكيان..."
            className="w-full ps-10 pe-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">كافة أنواع العمليات ({state.auditLogs.length})</option>
            <option value="payment_created">تسجيل دفعة (سداد)</option>
            <option value="payment_reversed">عكس دفعة</option>
            <option value="installment_due_date_changed">تعديل تاريخ استحقاق قسط</option>
            <option value="plan_created">إنشاء خطة تقسيط</option>
            <option value="plan_cancelled">إلغاء خطة</option>
            <option value="backup_created">إنشاء نسخة احتياطية</option>
            <option value="backup_restored">استعادة نسخة احتياطية</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="p-3.5 text-start">التاريخ والوقت</th>
                <th className="p-3.5 text-start">نوع العملية</th>
                <th className="p-3.5 text-start">تفاصيل الإجراء المالي</th>
                <th className="p-3.5 text-start">السبب المالي الموثق</th>
                <th className="p-3.5 text-start">المستخدم المسؤول</th>
                <th className="p-3.5 text-end">معرّف السجل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    لا توجد سجلات تدقيق تطابق البحث
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-mono text-slate-600 whitespace-nowrap text-xs">
                      {log.timestamp.replace('T', ' ').substring(0, 19)}
                    </td>

                    <td className="p-3.5">{getActionBadge(log.action)}</td>

                    <td className="p-3.5 text-slate-800 font-medium max-w-md">
                      <div>{log.details}</div>
                      {/* Old / New values comparison if available */}
                      {log.old_values && log.new_values && (
                        <div className="mt-1 text-[11px] font-mono bg-slate-50 p-1.5 rounded border border-slate-200 text-slate-600">
                          <span>سابقاً: {JSON.stringify(log.old_values)}</span>
                          <span className="mx-2 text-slate-300">|</span>
                          <span className="text-emerald-700">حالياً: {JSON.stringify(log.new_values)}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5">
                      {log.reason ? (
                        <span className="bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded text-xs block max-w-xs">
                          {log.reason}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{log.user_name}</div>
                      <span className="text-[11px] text-slate-400">{log.user_role}</span>
                    </td>

                    <td className="p-3.5 text-end font-mono text-[11px] text-slate-400">
                      {log.id}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
