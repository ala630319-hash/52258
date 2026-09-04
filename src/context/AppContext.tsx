/**
 * Main Application Context
 * Centralizes transactional operations, role-based authorization, state persistence, and event notifications.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  AppDatabaseState,
  StorageService,
} from '../services/storageService';
import { FinancialEngine } from '../services/financialEngine';
import {
  Customer,
  FinancialAuditLog,
  Installment,
  InstallmentDuration,
  InstallmentPlan,
  NotificationItem,
  Payment,
  PaymentMethod,
  PermissionKey,
  Store,
  SystemSettings,
  User,
  UserRole,
} from '../types';

interface CreatePlanInput {
  customerId: string;
  storeId: string;
  totalAmount: number;
  downPayment: number;
  durationMonths: InstallmentDuration;
  notes?: string;
  payFirstInstallmentNow?: boolean;
  firstPaymentMethod?: PaymentMethod;
  firstPaymentRef?: string;
}

interface AppContextType {
  state: AppDatabaseState;
  currentUser: User;
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  currency: string;
  // Permissions & Auth
  hasPermission: (perm: PermissionKey) => boolean;
  switchUser: (role: UserRole) => void;
  setCurrentUser: (user: User) => void;
  addUser: (data: Omit<User, 'id' | 'permissions'> & { permissions?: PermissionKey[] }) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  // Customers
  addCustomer: (data: Omit<Customer, 'id' | 'created_at' | 'status'>) => Customer;
  updateCustomer: (customer: Customer) => void;
  archiveCustomer: (id: string) => void;
  restoreCustomer: (id: string) => void;
  // Stores
  addStore: (data: Omit<Store, 'id' | 'created_at'>) => Store;
  updateStore: (store: Store) => void;
  // Plans & Installments
  createPlan: (input: CreatePlanInput) => { plan: InstallmentPlan; installments: Installment[] };
  approvePlan: (planId: string) => void;
  cancelPlan: (planId: string, reason: string) => void;
  updateInstallmentDueDate: (installmentId: string, newDate: string, reason: string) => void;
  // Payments
  recordPayment: (
    installmentId: string,
    amount: number,
    method: PaymentMethod,
    reference?: string,
    notes?: string
  ) => Payment;
  reversePayment: (paymentId: string, reason: string) => void;
  // Settings & Backups
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  createBackup: (type?: 'manual' | 'automatic') => void;
  restoreBackup: (backupId: string) => { success: boolean; safetyBackupId?: string; error?: string };
  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  // Global search helpers
  getPlanById: (id: string) => InstallmentPlan | undefined;
  getCustomerById: (id: string) => Customer | undefined;
  getStoreById: (id: string) => Store | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppDatabaseState>(() => StorageService.loadState());
  const [language, setLanguageState] = useState<'ar' | 'en'>('ar');
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const loaded = StorageService.loadState();
    return loaded.users[0]?.id || 'usr-admin-1';
  });

  // Sync to localStorage
  useEffect(() => {
    StorageService.saveState(state);
  }, [state]);

  // Set document dir on language change
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: 'ar' | 'en') => {
    setLanguageState(lang);
  };

  const fallbackUser: User = {
    id: 'usr-admin-1',
    name: 'عبدالله الشمري (المدير العام)',
    username: 'admin',
    email: 'admin@aqsat.local',
    role: 'admin',
    is_active: true,
    permissions: [
      'customers.view',
      'customers.create',
      'customers.edit',
      'customers.archive',
      'stores.view',
      'stores.create',
      'stores.edit',
      'stores.archive',
      'plans.view',
      'plans.create',
      'plans.edit',
      'plans.approve',
      'plans.cancel',
      'installments.view',
      'installments.edit_due_date',
      'payments.view',
      'payments.create',
      'payments.reverse',
      'reports.view',
      'reports.export',
      'users.manage',
      'permissions.manage',
      'backups.create',
      'backups.download',
      'backups.restore',
      'backups.delete',
      'settings.manage',
      'audit_logs.view',
    ],
  };

  const currentUser = useMemo(() => {
    if (!state.users || state.users.length === 0) return fallbackUser;
    const user = state.users.find((u) => u.id === currentUserId);
    return user || state.users[0] || fallbackUser;
  }, [state.users, currentUserId]);

  const stateWithCurrentUser = useMemo(() => ({
    ...state,
    currentUser,
  }), [state, currentUser]);

  const currency = state.settings.default_currency || 'ر.س';

  const hasPermission = (perm: PermissionKey): boolean => {
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions.includes(perm);
  };

  const switchUser = (role: UserRole) => {
    const target = state.users.find((u) => u.role === role);
    if (target) {
      setCurrentUserId(target.id);
    }
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserId(user.id);
  };

  const addUser = (data: Omit<User, 'id' | 'permissions'> & { permissions?: PermissionKey[] }): User => {
    const id = `usr-${Date.now()}`;
    const defaultPermissions: PermissionKey[] =
      data.role === 'admin'
        ? [
            'customers.view',
            'customers.create',
            'customers.edit',
            'customers.archive',
            'stores.view',
            'stores.create',
            'stores.edit',
            'stores.archive',
            'plans.view',
            'plans.create',
            'plans.edit',
            'plans.approve',
            'plans.cancel',
            'installments.view',
            'installments.edit_due_date',
            'payments.view',
            'payments.create',
            'payments.reverse',
            'reports.view',
            'reports.export',
            'users.manage',
            'permissions.manage',
            'backups.create',
            'backups.download',
            'backups.restore',
            'backups.delete',
            'settings.manage',
            'audit_logs.view',
          ]
        : data.role === 'store_manager'
        ? [
            'customers.view',
            'customers.create',
            'customers.edit',
            'stores.view',
            'plans.view',
            'plans.create',
            'plans.edit',
            'plans.approve',
            'installments.view',
            'payments.view',
            'payments.create',
            'reports.view',
          ]
        : data.role === 'collector'
        ? ['customers.view', 'plans.view', 'installments.view', 'payments.view', 'payments.create']
        : data.role === 'accountant'
        ? [
            'customers.view',
            'stores.view',
            'plans.view',
            'installments.view',
            'payments.view',
            'reports.view',
            'reports.export',
            'audit_logs.view',
          ]
        : ['customers.view', 'stores.view', 'plans.view', 'installments.view', 'payments.view', 'reports.view'];

    const newUser: User = {
      id,
      name: data.name,
      username: data.username,
      email: data.email,
      role: data.role,
      permissions: data.permissions || defaultPermissions,
      is_active: data.is_active !== undefined ? data.is_active : true,
      store_id: data.store_id,
      last_login: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
    }));

    return newUser;
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    }));
  };

  // Helper log generator
  const logAudit = (
    action: FinancialAuditLog['action'],
    entity_type: FinancialAuditLog['entity_type'],
    entity_id: string,
    details: string,
    reason?: string,
    old_values?: Record<string, unknown>,
    new_values?: Record<string, unknown>
  ): FinancialAuditLog => {
    return {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      entity_type,
      entity_id,
      user_name: currentUser.name,
      user_role: currentUser.role === 'admin' ? 'المدير العام' : 'موظف التحصيل',
      timestamp: new Date().toISOString(),
      details,
      reason,
      old_values,
      new_values,
    };
  };

  // =================== Customers ===================
  const addCustomer = (data: Omit<Customer, 'id' | 'created_at' | 'status'>): Customer => {
    if (!hasPermission('customers.create')) {
      throw new Error('ليس لديك صلاحية لإضافة عميل');
    }

    // Check duplicate national id
    const existing = state.customers.find((c) => c.national_id === data.national_id);
    if (existing) {
      throw new Error('رقم الهوية / الإقامة مسجل مسبقاً لعميل آخر');
    }

    const newCustomer: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      created_at: new Date().toISOString().split('T')[0],
      status: 'active',
    };

    const audit = logAudit(
      'customer_archived', // generic customer action
      'customer',
      newCustomer.id,
      `إضافة عميل جديد: ${newCustomer.full_name} (الهوية: ${newCustomer.national_id})`
    );

    setState((prev) => ({
      ...prev,
      customers: [newCustomer, ...prev.customers],
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return newCustomer;
  };

  const updateCustomer = (customer: Customer) => {
    if (!hasPermission('customers.edit')) {
      throw new Error('ليس لديك صلاحية لتعديل بيانات العميل');
    }

    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) => (c.id === customer.id ? customer : c)),
      auditLogs: [
        logAudit('customer_archived', 'customer', customer.id, `تعديل بيانات العميل: ${customer.full_name}`),
        ...prev.auditLogs,
      ],
    }));
  };

  const archiveCustomer = (id: string) => {
    if (!hasPermission('customers.archive')) {
      throw new Error('ليس لديك صلاحية لأرشفة العميل');
    }

    setState((prev) => {
      const cust = prev.customers.find((c) => c.id === id);
      return {
        ...prev,
        customers: prev.customers.map((c) => (c.id === id ? { ...c, status: 'archived' } : c)),
        auditLogs: [
          logAudit('customer_archived', 'customer', id, `أرشفة العميل: ${cust?.full_name || id}`),
          ...prev.auditLogs,
        ],
      };
    });
  };

  const restoreCustomer = (id: string) => {
    if (!hasPermission('customers.archive')) {
      throw new Error('ليس لديك صلاحية لاستعادة العميل');
    }

    setState((prev) => {
      const cust = prev.customers.find((c) => c.id === id);
      return {
        ...prev,
        customers: prev.customers.map((c) => (c.id === id ? { ...c, status: 'active' } : c)),
        auditLogs: [
          logAudit('customer_restored', 'customer', id, `استعادة العميل من الأرشيف: ${cust?.full_name || id}`),
          ...prev.auditLogs,
        ],
      };
    });
  };

  // =================== Stores ===================
  const addStore = (data: Omit<Store, 'id' | 'created_at'>): Store => {
    if (!hasPermission('stores.create')) {
      throw new Error('ليس لديك صلاحية لإضافة متجر');
    }

    const newStore: Store = {
      ...data,
      id: `str-${Date.now()}`,
      created_at: new Date().toISOString().split('T')[0],
    };

    setState((prev) => ({
      ...prev,
      stores: [newStore, ...prev.stores],
    }));

    return newStore;
  };

  const updateStore = (store: Store) => {
    if (!hasPermission('stores.edit')) {
      throw new Error('ليس لديك صلاحية لتعديل بيانات المتجر');
    }

    setState((prev) => ({
      ...prev,
      stores: prev.stores.map((s) => (s.id === store.id ? store : s)),
    }));
  };

  // =================== Plans & Installments ===================
  const createPlan = (input: CreatePlanInput) => {
    if (!hasPermission('plans.create')) {
      throw new Error('ليس لديك صلاحية لإنشاء خطة تقسيط');
    }

    const today = new Date().toISOString().split('T')[0];
    const remaining = FinancialEngine.calculateRemainingAmount(input.totalAmount, input.downPayment);
    const planId = `plan-${Date.now()}`;
    const planNumber = StorageService.generatePlanNumber(state.plans);

    // Section 13: 1st installment date equals plan creation date and is due immediately!
    const installmentsRaw = FinancialEngine.generateInstallments(
      planId,
      remaining,
      input.durationMonths,
      today,
      today
    );

    const planInstallments: Installment[] = installmentsRaw.map((raw, idx) => ({
      ...raw,
      id: `inst-${planId}-${idx + 1}`,
    }));

    const newPlan: InstallmentPlan = {
      id: planId,
      plan_number: planNumber,
      customer_id: input.customerId,
      store_id: input.storeId,
      total_amount: FinancialEngine.round2(input.totalAmount),
      down_payment: FinancialEngine.round2(input.downPayment),
      remaining_amount: remaining,
      duration_months: input.durationMonths,
      created_at: today,
      start_date: today,
      notes: input.notes,
      status: 'approved', // Auto-approved upon creation or active
      approved_at: today,
      approved_by: currentUser.name,
    };

    const newAuditLogs: FinancialAuditLog[] = [
      logAudit(
        'plan_created',
        'plan',
        planId,
        `إنشاء خطة التقسيط رقم ${planNumber} بمبلغ إجمالي ${newPlan.total_amount} ر.س ومتبقي ${remaining} ر.س موزعة على ${newPlan.duration_months} أشهر`,
        undefined,
        undefined,
        { plan: newPlan, installments: planInstallments }
      ),
    ];

    let newPayments: Payment[] = [];
    let finalInstallments = [...planInstallments];

    // Check if immediate 1st installment payment requested (Section 13: القسط الأول مستحق اليوم ويجب تحصيله)
    if (input.payFirstInstallmentNow && planInstallments.length > 0) {
      const firstInst = planInstallments[0];
      const payAmount = firstInst.amount;
      const paymentNumber = StorageService.generatePaymentNumber(state.payments);
      const paymentId = `pay-${Date.now()}`;

      const { updatedInstallment } = FinancialEngine.applyPayment(firstInst, payAmount, today);
      finalInstallments[0] = updatedInstallment;

      const payment: Payment = {
        id: paymentId,
        payment_number: paymentNumber,
        installment_id: firstInst.id,
        plan_id: planId,
        customer_id: input.customerId,
        amount: payAmount,
        paid_at: new Date().toISOString(),
        payment_method: input.firstPaymentMethod || 'cash',
        created_by: currentUser.name,
        reference_number: input.firstPaymentRef,
        notes: 'سداد القسط الأول الإجباري عند إنشاء الخطة',
        status: 'recorded',
      };

      newPayments.push(payment);
      newAuditLogs.push(
        logAudit(
          'payment_created',
          'payment',
          paymentId,
          `سداد فوري للقسط الأول بمبلغ ${payAmount} ر.س بطريقة (${payment.payment_method}) بموجب إيصال ${paymentNumber}`
        )
      );
    }

    // Determine final plan status
    newPlan.status = FinancialEngine.calculatePlanStatus(newPlan, finalInstallments);

    setState((prev) => ({
      ...prev,
      plans: [newPlan, ...prev.plans],
      installments: [...finalInstallments, ...prev.installments],
      payments: [...newPayments, ...prev.payments],
      auditLogs: [...newAuditLogs, ...prev.auditLogs],
    }));

    return { plan: newPlan, installments: finalInstallments };
  };

  const approvePlan = (planId: string) => {
    if (!hasPermission('plans.approve')) {
      throw new Error('ليس لديك صلاحية لاعتماد خطة التقسيط');
    }

    const today = new Date().toISOString().split('T')[0];
    setState((prev) => {
      const plan = prev.plans.find((p) => p.id === planId);
      if (!plan) return prev;

      const updatedPlan: InstallmentPlan = {
        ...plan,
        status: 'active',
        approved_at: today,
        approved_by: currentUser.name,
      };

      const audit = logAudit(
        'plan_approved',
        'plan',
        planId,
        `اعتماد خطة التقسيط رقم ${plan.plan_number} وتفعيل جدول الأقساط`
      );

      return {
        ...prev,
        plans: prev.plans.map((p) => (p.id === planId ? updatedPlan : p)),
        auditLogs: [audit, ...prev.auditLogs],
      };
    });
  };

  const cancelPlan = (planId: string, reason: string) => {
    if (!hasPermission('plans.cancel')) {
      throw new Error('ليس لديك صلاحية لإلغاء خطة التقسيط');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('يجب تحديد سبب إلغاء الخطة');
    }

    setState((prev) => {
      const plan = prev.plans.find((p) => p.id === planId);
      if (!plan) return prev;

      // Check if plan has payments
      const planPayments = prev.payments.filter((p) => p.plan_id === planId && p.status === 'recorded');
      if (planPayments.length > 0) {
        throw new Error('لا يمكن إلغاء خطة تحتوي على دفعات مسجلة نشطة. يجب عكس الدفعات أولاً.');
      }

      const updatedPlan: InstallmentPlan = {
        ...plan,
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_reason: reason,
      };

      const audit = logAudit(
        'plan_cancelled',
        'plan',
        planId,
        `إلغاء الخطة ${plan.plan_number} بسبب: ${reason}`,
        reason
      );

      return {
        ...prev,
        plans: prev.plans.map((p) => (p.id === planId ? updatedPlan : p)),
        auditLogs: [audit, ...prev.auditLogs],
      };
    });
  };

  const updateInstallmentDueDate = (installmentId: string, newDate: string, reason: string) => {
    if (!hasPermission('installments.edit_due_date')) {
      throw new Error('ليس لديك صلاحية لتعديل تاريخ استحقاق القسط');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('يجب إدخال سبب تعديل تاريخ الاستحقاق للتوثيق المالي');
    }

    setState((prev) => {
      const inst = prev.installments.find((i) => i.id === installmentId);
      if (!inst) return prev;

      const oldDate = inst.due_date;
      const updatedInst: Installment = {
        ...inst,
        due_date: newDate,
        status: FinancialEngine.calculateInstallmentStatus(inst.amount, inst.paid_amount, newDate),
      };

      // Also re-check plan status
      const otherInsts = prev.installments.filter((i) => i.plan_id === inst.plan_id && i.id !== inst.id);
      const allPlanInsts = [updatedInst, ...otherInsts];
      const plan = prev.plans.find((p) => p.id === inst.plan_id);
      const updatedPlanStatus = plan ? FinancialEngine.calculatePlanStatus(plan, allPlanInsts) : undefined;

      const audit = logAudit(
        'installment_due_date_changed',
        'installment',
        installmentId,
        `تعديل تاريخ استحقاق القسط رقم ${inst.installment_number} من ${oldDate} إلى ${newDate}`,
        reason,
        { old_due_date: oldDate },
        { new_due_date: newDate }
      );

      return {
        ...prev,
        installments: prev.installments.map((i) => (i.id === installmentId ? updatedInst : i)),
        plans: plan && updatedPlanStatus ? prev.plans.map((p) => (p.id === plan.id ? { ...p, status: updatedPlanStatus } : p)) : prev.plans,
        auditLogs: [audit, ...prev.auditLogs],
      };
    });
  };

  // =================== Payments & Atomic Reversals ===================
  const recordPayment = (
    installmentId: string,
    amount: number,
    method: PaymentMethod,
    reference?: string,
    notes?: string
  ): Payment => {
    if (!hasPermission('payments.create')) {
      throw new Error('ليس لديك صلاحية لتسجيل دفعة مالية');
    }

    const inst = state.installments.find((i) => i.id === installmentId);
    if (!inst) {
      throw new Error('القسط المالي غير موجود');
    }

    const plan = state.plans.find((p) => p.id === inst.plan_id);
    if (!plan) {
      throw new Error('خطة التقسيط المرتبطة بالقسط غير موجودة');
    }

    if (plan.status === 'cancelled') {
      throw new Error('لا يمكن تسجيل دفعة لخطة ملغاة');
    }

    // Atomic transaction: apply payment via financial engine
    const today = new Date().toISOString().split('T')[0];
    const { updatedInstallment } = FinancialEngine.applyPayment(inst, amount, today);

    const paymentNumber = StorageService.generatePaymentNumber(state.payments);
    const paymentId = `pay-${Date.now()}`;

    const newPayment: Payment = {
      id: paymentId,
      payment_number: paymentNumber,
      installment_id: installmentId,
      plan_id: inst.plan_id,
      customer_id: plan.customer_id,
      amount: FinancialEngine.round2(amount),
      paid_at: new Date().toISOString(),
      payment_method: method,
      created_by: currentUser.name,
      reference_number: reference,
      notes,
      status: 'recorded',
    };

    // Recalculate plan status
    const allPlanInsts = state.installments.map((i) => (i.id === installmentId ? updatedInstallment : i));
    const targetPlanInsts = allPlanInsts.filter((i) => i.plan_id === plan.id);
    const newPlanStatus = FinancialEngine.calculatePlanStatus(plan, targetPlanInsts);

    const audit = logAudit(
      'payment_created',
      'payment',
      paymentId,
      `تسجيل دفعة بقيمة ${newPayment.amount} ر.س للقسط رقم ${inst.installment_number} (الخطة: ${plan.plan_number}) بطريقة (${method})`,
      undefined,
      { installment_paid_before: inst.paid_amount, remaining_before: inst.remaining_amount },
      { installment_paid_after: updatedInstallment.paid_amount, remaining_after: updatedInstallment.remaining_amount }
    );

    setState((prev) => ({
      ...prev,
      payments: [newPayment, ...prev.payments],
      installments: prev.installments.map((i) => (i.id === installmentId ? updatedInstallment : i)),
      plans: prev.plans.map((p) => (p.id === plan.id ? { ...p, status: newPlanStatus } : p)),
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return newPayment;
  };

  const reversePayment = (paymentId: string, reason: string) => {
    if (!hasPermission('payments.reverse')) {
      throw new Error('ليس لديك صلاحية لعكس الدفعات المالية (المدير فقط)');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('يجب تحديد سبب عكس الدفعة بدقة وفق قواعد التدقيق المالي');
    }

    const payment = state.payments.find((p) => p.id === paymentId);
    if (!payment) {
      throw new Error('الدفعة المالية غير موجودة');
    }

    if (payment.status === 'reversed') {
      throw new Error('الدفعة معكوسة بالفعل');
    }

    const inst = state.installments.find((i) => i.id === payment.installment_id);
    if (!inst) {
      throw new Error('القسط المرتبط بالدفعة غير موجود');
    }

    const plan = state.plans.find((p) => p.id === payment.plan_id);
    if (!plan) {
      throw new Error('خطة التقسيط غير موجودة');
    }

    // Atomic reversal
    const today = new Date().toISOString().split('T')[0];
    const { updatedInstallment } = FinancialEngine.reversePayment(inst, payment, today);

    const updatedPayment: Payment = {
      ...payment,
      status: 'reversed',
      reversed_at: new Date().toISOString(),
      reversed_by: currentUser.name,
      reversal_reason: reason,
    };

    // Recalculate plan status
    const allPlanInsts = state.installments.map((i) => (i.id === inst.id ? updatedInstallment : i));
    const targetPlanInsts = allPlanInsts.filter((i) => i.plan_id === plan.id);
    const newPlanStatus = FinancialEngine.calculatePlanStatus(plan, targetPlanInsts);

    const audit = logAudit(
      'payment_reversed',
      'payment',
      paymentId,
      `عكس الدفعة رقم ${payment.payment_number} بمبلغ ${payment.amount} ر.س وإعادة فتح القسط رقم ${inst.installment_number}. السبب: ${reason}`,
      reason,
      { payment_status: 'recorded', installment_paid: inst.paid_amount },
      { payment_status: 'reversed', installment_paid: updatedInstallment.paid_amount }
    );

    setState((prev) => ({
      ...prev,
      payments: prev.payments.map((p) => (p.id === paymentId ? updatedPayment : p)),
      installments: prev.installments.map((i) => (i.id === inst.id ? updatedInstallment : i)),
      plans: prev.plans.map((p) => (p.id === plan.id ? { ...p, status: newPlanStatus } : p)),
      auditLogs: [audit, ...prev.auditLogs],
    }));
  };

  // =================== Settings & Backups ===================
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    if (!hasPermission('settings.manage')) {
      throw new Error('ليس لديك صلاحية لتعديل إعدادات النظام');
    }

    setState((prev) => {
      const updated = { ...prev.settings, ...newSettings };
      return {
        ...prev,
        settings: updated,
        auditLogs: [
          logAudit('settings_updated', 'settings', 'global-settings', 'تحديث إعدادات هوية البرنامج والمظهر'),
          ...prev.auditLogs,
        ],
      };
    });
  };

  const createBackup = (type: 'manual' | 'automatic' = 'manual') => {
    if (!hasPermission('backups.create')) {
      throw new Error('ليس لديك صلاحية لإنشاء نسخة احتياطية');
    }

    const bkp = StorageService.createBackup(state, type, currentUser.name);
    const audit = logAudit('backup_created', 'backup', bkp.id, `إنشاء نسخة احتياطية (${type}) باسم ${bkp.file_name}`);

    setState((prev) => ({
      ...prev,
      backups: [bkp, ...prev.backups],
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          title: 'تم إنشاء نسخة احتياطية',
          message: `تم حفظ النسخة ${bkp.file_name} بنجاح بحجم ${(bkp.size_bytes / 1024).toFixed(1)} ك.ب.`,
          type: 'success',
          created_at: new Date().toISOString().split('T')[0],
          read: false,
        },
        ...prev.notifications,
      ],
    }));
  };

  const restoreBackup = (backupId: string) => {
    if (!hasPermission('backups.restore')) {
      return { success: false, error: 'ليس لديك صلاحية لاستعادة النسخ الاحتياطية (المدير فقط)' };
    }

    const bkp = state.backups.find((b) => b.id === backupId);
    if (!bkp || !bkp.data_snapshot) {
      return { success: false, error: 'بيانات النسخة الاحتياطية المطلوبة غير متوفرة' };
    }

    try {
      const parsed = JSON.parse(bkp.data_snapshot) as AppDatabaseState;
      if (!parsed.plans || !parsed.customers || !parsed.installments) {
        return { success: false, error: 'فشل التحقق من سلامة بنية ملف النسخة الاحتياطية' };
      }

      // CRITICAL REQUIREMENT (Section 34):
      // "أهم قاعدة: قبل الاستعادة، النظام ينشئ تلقائيًا نسخة أمان من الوضع الحالي حتى يمكن الرجوع إليها إذا تمت الاستعادة بالخطأ."
      const safetyBackup = StorageService.createBackup(state, 'safety_before_restore', currentUser.name);

      const restoreAudit = logAudit(
        'backup_restored',
        'backup',
        backupId,
        `استعادة حالة النظام من النسخة: ${bkp.file_name}. تم إنشاء نسخة أمان وقائية تلقائية برقم: ${safetyBackup.id}`
      );

      // Merge backups list to keep the safety backup and history intact!
      const mergedBackups = [safetyBackup, ...parsed.backups.filter((b) => b.id !== safetyBackup.id)];

      const restoredState: AppDatabaseState = {
        ...parsed,
        backups: mergedBackups,
        auditLogs: [restoreAudit, ...parsed.auditLogs],
        notifications: [
          {
            id: `notif-${Date.now()}`,
            title: 'تمت استعادة النظام بنجاح',
            message: `تمت استعادة البيانات من النسخة (${bkp.file_name}). تم حفظ نسخة أمان تلقائية للوضع السابق.`,
            type: 'warning',
            created_at: new Date().toISOString().split('T')[0],
            read: false,
          },
          ...parsed.notifications,
        ],
      };

      setState(restoredState);
      return { success: true, safetyBackupId: safetyBackup.id };
    } catch (e: any) {
      return { success: false, error: `خطأ أثناء تنفيذ الاستعادة: ${e.message}` };
    }
  };

  // =================== Notifications ===================
  const markNotificationRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  const markAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  };

  // Lookup helpers
  const getPlanById = (id: string) => state.plans.find((p) => p.id === id);
  const getCustomerById = (id: string) => state.customers.find((c) => c.id === id);
  const getStoreById = (id: string) => state.stores.find((s) => s.id === id);

  return (
    <AppContext.Provider
      value={{
        state: stateWithCurrentUser,
        currentUser,
        language,
        setLanguage,
        currency,
        hasPermission,
        switchUser,
        setCurrentUser,
        addUser,
        updateUser,
        addCustomer,
        updateCustomer,
        archiveCustomer,
        restoreCustomer,
        addStore,
        updateStore,
        createPlan,
        approvePlan,
        cancelPlan,
        updateInstallmentDueDate,
        recordPayment,
        reversePayment,
        updateSettings,
        createBackup,
        restoreBackup,
        markNotificationRead,
        markAllNotificationsRead,
        getPlanById,
        getCustomerById,
        getStoreById,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
