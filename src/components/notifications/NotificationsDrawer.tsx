/**
 * Notifications Drawer (Section 35 - التنبيهات الذكية)
 * Real-time notifications for:
 * - Installments due today
 * - Installments due within 3 days
 * - Overdue installments
 * - Reversed payments
 * Includes direct action links to customer or installment pay.
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { Installment, InstallmentPlan, Customer } from '../../types';
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  RotateCcw,
  CheckCheck,
  Receipt,
  ArrowLeft,
} from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRecordPayment: (installment: Installment, plan: InstallmentPlan) => void;
  onOpenCustomer360: (customer: Customer) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onOpenRecordPayment,
  onOpenCustomer360,
}) => {
  const { state, markNotificationRead, markAllNotificationsRead } = useApp();

  if (!isOpen) return null;

  const handleNotificationClick = (notif: (typeof state.notifications)[0]) => {
    markNotificationRead(notif.id);

    if (notif.entity_type === 'installment' && notif.entity_id) {
      const inst = state.installments.find((i) => i.id === notif.entity_id);
      if (inst) {
        const plan = state.plans.find((p) => p.id === inst.plan_id);
        if (plan) {
          onOpenRecordPayment(inst, plan);
          onClose();
        }
      }
    } else if (notif.entity_type === 'customer' && notif.entity_id) {
      const cust = state.customers.find((c) => c.id === notif.entity_id);
      if (cust) {
        onOpenCustomer360(cust);
        onClose();
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'payment_reversed':
        return <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'due_today':
      case 'due_soon':
      default:
        return <Clock className="w-4 h-4 text-blue-600 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-60 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-s border-slate-200 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">مركز التنبيهات المباشرة</h3>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-mono font-bold">
              {state.notifications.filter((n) => !n.is_read).length} غير مقروءة
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="text-xs text-slate-300 hover:text-white underline"
              title="تحديد الكل كمقروء"
            >
              قراءة الكل
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {state.notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              لا توجد تنبيهات حالياً - كل العمليات في موعدها
            </div>
          ) : (
            state.notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-3.5 rounded-xl cursor-pointer transition-colors flex items-start gap-3 my-1 ${
                  n.is_read ? 'bg-white hover:bg-slate-50 opacity-70' : 'bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100'
                }`}
              >
                <div className="mt-0.5">{getIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-xs text-slate-900">{n.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {n.created_at.substring(11, 16)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                    <span>عرض التفاصيل والإجراء</span>
                    <ArrowLeft className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
          يتم تحديث التنبيهات تلقائياً عند استحقاق الأقساط وتسجيل العمليات
        </div>
      </div>
    </div>
  );
};
