/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import {
  Customer,
  InstallmentPlan,
  Installment,
  Payment,
} from './types';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { CustomerListView } from './components/customers/CustomerListView';
import { StoreManagementView } from './components/stores/StoreManagementView';
import { PlanListView } from './components/plans/PlanListView';
import { ReportsView } from './components/reports/ReportsView';
import { AuditTrailView } from './components/audit/AuditTrailView';
import { BackupManagementView } from './components/backups/BackupManagementView';
import { UserManagementView } from './components/users/UserManagementView';
import { SettingsView } from './components/settings/SettingsView';

// Modals & Drawers
import { SmartCustomerSearch } from './components/customers/SmartCustomerSearch';
import { Customer360Modal } from './components/customers/Customer360Modal';
import { CreatePlanModal } from './components/plans/CreatePlanModal';
import { PlanDetailsModal } from './components/plans/PlanDetailsModal';
import { RecordPaymentModal } from './components/payments/RecordPaymentModal';
import { ReceiptModal } from './components/documents/ReceiptModal';
import { InvoiceModal } from './components/documents/InvoiceModal';
import { PaymentReversalModal } from './components/payments/PaymentReversalModal';
import { NotificationsDrawer } from './components/notifications/NotificationsDrawer';

// Icons
import {
  LayoutDashboard,
  Users,
  Building2,
  FileSpreadsheet,
  BarChart3,
  ShieldCheck,
  Database,
  UserCog,
  Settings,
  Bell,
  PlusCircle,
  Menu,
  X,
  CreditCard,
  Receipt,
  UserCheck,
} from 'lucide-react';

type NavTab =
  | 'dashboard'
  | 'customers'
  | 'stores'
  | 'plans'
  | 'reports'
  | 'audit'
  | 'backups'
  | 'users'
  | 'settings';

const MainLayout: React.FC = () => {
  const { state, currentUser, setCurrentUser, hasPermission } = useApp();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [customer360, setCustomer360] = useState<Customer | null>(null);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [createPlanCustomerId, setCreatePlanCustomerId] = useState<string | undefined>(undefined);
  const [planDetails, setPlanDetails] = useState<InstallmentPlan | null>(null);
  const [paymentData, setPaymentData] = useState<{ installment: Installment; plan: InstallmentPlan } | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [invoicePlan, setInvoicePlan] = useState<InstallmentPlan | null>(null);
  const [reversalPayment, setReversalPayment] = useState<Payment | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Quick Plan Creation handler
  const handleOpenCreatePlan = (customerId?: string) => {
    setCreatePlanCustomerId(customerId);
    setShowCreatePlan(true);
  };

  // Quick Payment handler
  const handleOpenRecordPayment = (installment: Installment, plan: InstallmentPlan) => {
    setPaymentData({ installment, plan });
  };

  // Unread notifications count
  const unreadCount = state.notifications.filter((n) => !n.is_read).length;

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; permission?: string }[] = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'customers', label: 'إدارة العملاء', icon: <Users className="w-5 h-5" /> },
    { id: 'plans', label: 'خطط التقسيط', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { id: 'stores', label: 'المتاجر والفروع', icon: <Building2 className="w-5 h-5" /> },
    { id: 'reports', label: 'التقارير المالية', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'audit', label: 'سجل التدقيق والرقابة', icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'backups', label: 'النسخ وقواعد البيانات', icon: <Database className="w-5 h-5" /> },
    { id: 'users', label: 'المستخدمون والأدوار', icon: <UserCog className="w-5 h-5" /> },
    { id: 'settings', label: 'إعدادات الهوية', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Fixed Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Mobile menu trigger + Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              {state.settings.logo_url ? (
                <img
                  src={state.settings.logo_url}
                  alt="Logo"
                  className="w-9 h-9 rounded-xl object-contain bg-emerald-50 p-1 border border-emerald-200"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white flex items-center justify-center font-black text-lg shadow-xs">
                  ق
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="font-extrabold text-base leading-tight text-slate-900">
                  {state.settings.system_name_ar}
                </h1>
                <p className="text-[10px] text-slate-400 font-medium font-sans">
                  {state.settings.system_name_en}
                </p>
              </div>
            </div>
          </div>

          {/* Center: Smart Customer Search */}
          <div className="flex-1 max-w-lg mx-2">
            <SmartCustomerSearch
              onSelectCustomer={(c) => setCustomer360(c)}
              onQuickNewPlan={(c) => handleOpenCreatePlan(c.id)}
            />
          </div>

          {/* Right Actions: Quick Plan, Notifications, User Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {hasPermission('plans.create') && (
              <button
                type="button"
                onClick={() => handleOpenCreatePlan()}
                className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                خطة تقسيط
              </button>
            )}

            {/* Notifications Button */}
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="التنبيهات المباشرة"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 end-1 bg-rose-500 text-white font-mono font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Current User Quick Switcher Dropdown */}
            <div className="flex items-center gap-2 ps-2 border-s border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                {currentUser?.name ? currentUser.name.charAt(0) : 'م'}
              </div>
              <div className="hidden md:block text-start">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser?.name || 'مستخدم النظام'}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">
                  {currentUser?.role === 'admin'
                    ? 'مدير عام'
                    : currentUser?.role === 'store_manager'
                    ? 'مدير فرع'
                    : currentUser?.role === 'collector'
                    ? 'محصل'
                    : currentUser?.role === 'accountant'
                    ? 'محاسب'
                    : 'مشاهد'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col lg:flex-row gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-64 shrink-0">
          <nav className="sticky top-24 bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-start cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-slate-900/60 backdrop-blur-xs flex">
            <div className="w-72 bg-white h-full p-4 flex flex-col shadow-2xl animate-in slide-in-from-start duration-200">
              <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    ق
                  </div>
                  <span className="font-bold text-sm text-slate-900">{state.settings.system_name_ar}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-start ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main Content View Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenRecordPayment={handleOpenRecordPayment}
              onOpenCustomer360={(c) => setCustomer360(c)}
              onOpenPlanDetails={(p) => setPlanDetails(p)}
              onOpenCreatePlan={() => handleOpenCreatePlan()}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerListView
              onViewCustomer360={(c) => setCustomer360(c)}
              onCreatePlanForCustomer={(c) => handleOpenCreatePlan(c.id)}
            />
          )}

          {activeTab === 'plans' && (
            <PlanListView
              onOpenCreatePlan={() => handleOpenCreatePlan()}
              onOpenPlanDetails={(p) => setPlanDetails(p)}
              onOpenPlanInvoice={(p) => setInvoicePlan(p)}
              onOpenCustomer360={(c) => setCustomer360(c)}
            />
          )}

          {activeTab === 'stores' && <StoreManagementView />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'audit' && <AuditTrailView />}

          {activeTab === 'backups' && <BackupManagementView />}

          {activeTab === 'users' && <UserManagementView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* GLOBAL MODALS */}

      {/* Customer 360 Dossier */}
      {customer360 && (
        <Customer360Modal
          customer={customer360}
          onClose={() => setCustomer360(null)}
          onOpenCreatePlan={(c) => handleOpenCreatePlan(c.id)}
          onOpenPlanDetails={(p) => setPlanDetails(p)}
          onOpenRecordPayment={handleOpenRecordPayment}
        />
      )}

      {/* Create Plan Modal */}
      {showCreatePlan && (
        <CreatePlanModal
          preselectedCustomerId={createPlanCustomerId}
          onClose={() => setShowCreatePlan(false)}
          onPlanCreated={(plan) => {
            setShowCreatePlan(false);
            setPlanDetails(plan);
          }}
        />
      )}

      {/* Plan Details Modal */}
      {planDetails && (
        <PlanDetailsModal
          plan={planDetails}
          onClose={() => setPlanDetails(null)}
          onOpenRecordPayment={handleOpenRecordPayment}
          onOpenInvoice={(p) => setInvoicePlan(p)}
        />
      )}

      {/* Record Payment Modal */}
      {paymentData && (
        <RecordPaymentModal
          installment={paymentData.installment}
          plan={paymentData.plan}
          onClose={() => setPaymentData(null)}
          onPaymentRecorded={(payment) => {
            setPaymentData(null);
            setReceiptPayment(payment);
          }}
        />
      )}

      {/* Official Printable Receipt Voucher */}
      {receiptPayment && (
        <ReceiptModal
          payment={receiptPayment}
          onClose={() => setReceiptPayment(null)}
        />
      )}

      {/* Official Printable Plan Invoice & Agreement */}
      {invoicePlan && (
        <InvoiceModal
          plan={invoicePlan}
          onClose={() => setInvoicePlan(null)}
        />
      )}

      {/* Payment Reversal Modal */}
      {reversalPayment && (
        <PaymentReversalModal
          payment={reversalPayment}
          onClose={() => setReversalPayment(null)}
        />
      )}

      {/* Real-time Notifications Drawer */}
      <NotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onOpenRecordPayment={handleOpenRecordPayment}
        onOpenCustomer360={(c) => setCustomer360(c)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
