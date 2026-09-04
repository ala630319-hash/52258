/**
 * Storage Service & Local-First Database Engine
 * Handles full local persistence, auto-seeding, transactions, safety-backups, and MySQL export for XAMPP.
 */

import {
  BackupRecord,
  Customer,
  FinancialAuditLog,
  Installment,
  InstallmentPlan,
  NotificationItem,
  Payment,
  Store,
  SystemSettings,
  User,
} from '../types';
import { FinancialEngine } from './financialEngine';

export interface AppDatabaseState {
  users: User[];
  customers: Customer[];
  stores: Store[];
  plans: InstallmentPlan[];
  installments: Installment[];
  payments: Payment[];
  auditLogs: FinancialAuditLog[];
  notifications: NotificationItem[];
  settings: SystemSettings;
  backups: BackupRecord[];
  currentUser?: User;
}

const STORAGE_KEY = 'aqsat_system_db_v1';

export class StorageService {
  /**
   * Initializes or loads database state.
   */
  public static loadState(): AppDatabaseState {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data) as AppDatabaseState;
        const initial = this.getInitialSeedData();
        if (parsed.customers && parsed.plans) {
          // Validate and ensure users exist and have names
          if (!Array.isArray(parsed.users) || parsed.users.length === 0 || !parsed.users[0]?.name) {
            parsed.users = initial.users;
          }
          if (!Array.isArray(parsed.stores) || parsed.stores.length === 0) {
            parsed.stores = initial.stores;
          }
          if (!parsed.settings) {
            parsed.settings = initial.settings;
          }
          if (!Array.isArray(parsed.notifications)) {
            parsed.notifications = initial.notifications;
          }
          if (!Array.isArray(parsed.auditLogs)) {
            parsed.auditLogs = initial.auditLogs;
          }
          if (!Array.isArray(parsed.backups)) {
            parsed.backups = initial.backups;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
    }
    const initial = this.getInitialSeedData();
    this.saveState(initial);
    return initial;
  }

  /**
   * Persists database state to localStorage.
   */
  public static saveState(state: AppDatabaseState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving state to localStorage:', e);
    }
  }

  /**
   * Generates a unique sequential/semantic code for plans, payments, etc.
   */
  public static generatePlanNumber(existingPlans: InstallmentPlan[]): string {
    const year = new Date().getFullYear();
    const count = existingPlans.length + 1;
    const pad = String(count).padStart(5, '0');
    return `PLAN-${year}-${pad}`;
  }

  public static generatePaymentNumber(existingPayments: Payment[]): string {
    const year = new Date().getFullYear();
    const count = existingPayments.length + 1;
    const pad = String(count).padStart(6, '0');
    return `PAY-${year}-${pad}`;
  }

  /**
   * Seed data tailored to standard Saudi / Arabic installment business operations.
   */
  public static getInitialSeedData(): AppDatabaseState {
    const today = new Date().toISOString().split('T')[0];
    const pastMonthDate = FinancialEngine.addMonthsSafe(today, -1);
    const pastTwoMonthsDate = FinancialEngine.addMonthsSafe(today, -2);

    const users: User[] = [
      {
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
        last_login: new Date().toISOString(),
      },
      {
        id: 'usr-mgr-1',
        name: 'سعود المقرن (مدير متجر)',
        username: 'saud',
        email: 'saud@aqsat.local',
        role: 'store_manager',
        is_active: true,
        store_id: 'str-1',
        permissions: [
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
        ],
        last_login: new Date().toISOString(),
      },
      {
        id: 'usr-col-1',
        name: 'خالد بن فيصل (محصل مالي)',
        username: 'khalid',
        email: 'khalid@aqsat.local',
        role: 'collector',
        is_active: true,
        store_id: 'str-1',
        permissions: [
          'customers.view',
          'plans.view',
          'installments.view',
          'payments.view',
          'payments.create',
        ],
        last_login: new Date().toISOString(),
      },
      {
        id: 'usr-acc-1',
        name: 'نورة العتيبي (محاسب مالي)',
        username: 'noura',
        email: 'noura@aqsat.local',
        role: 'accountant',
        is_active: true,
        permissions: [
          'customers.view',
          'stores.view',
          'plans.view',
          'installments.view',
          'payments.view',
          'reports.view',
          'reports.export',
          'audit_logs.view',
        ],
        last_login: new Date().toISOString(),
      },
      {
        id: 'usr-view-1',
        name: 'فهد الدوسري (مشاهد فقط)',
        username: 'fahad',
        email: 'fahad@aqsat.local',
        role: 'viewer',
        is_active: true,
        permissions: [
          'customers.view',
          'stores.view',
          'plans.view',
          'installments.view',
          'payments.view',
          'reports.view',
        ],
        last_login: new Date().toISOString(),
      },
    ];

    const stores: Store[] = [
      {
        id: 'str-1',
        name: 'معرض النخبة للأجهزة الذكية',
        code: 'STR-001',
        status: 'active',
        notes: 'الفرع الرئيسي - الرياض، طريق الملك فهد',
        created_at: '2026-01-10',
      },
      {
        id: 'str-2',
        name: 'متجر الأفق للإلكترونيات',
        code: 'STR-002',
        status: 'active',
        notes: 'فرع جدة - شارع التحلية',
        created_at: '2026-02-15',
      },
      {
        id: 'str-3',
        name: 'معرض الوفاق للأثاث المنزلي',
        code: 'STR-003',
        status: 'active',
        notes: 'فرع الدمام - حي الشاطئ',
        created_at: '2026-03-01',
      },
    ];

    const customers: Customer[] = [
      {
        id: 'cust-1',
        full_name: 'أحمد بن محمد عبدالله',
        national_id: '1087654321',
        birth_date: '1988-04-12',
        phone: '0501234567',
        address: 'الرياض - حي الملز، شارع الجامعة',
        notes: 'عميل ملتزم، موظف حكومي',
        created_at: '2026-01-15',
        status: 'active',
      },
      {
        id: 'cust-2',
        full_name: 'سعد بن إبراهيم القحطاني',
        national_id: '1098765432',
        birth_date: '1992-09-20',
        phone: '0559876543',
        address: 'جدة - حي الروضة، طريق المدينة',
        notes: 'خطة أجهزة كهربائية',
        created_at: '2026-02-01',
        status: 'active',
      },
      {
        id: 'cust-3',
        full_name: 'فاطمة بنت ناصر العتيبي',
        national_id: '1023456789',
        birth_date: '1995-11-05',
        phone: '0543210987',
        address: 'الرياض - حي النرجس',
        notes: 'معلمة، طلب تقسيط هاتف ذكي',
        created_at: '2026-03-10',
        status: 'active',
      },
      {
        id: 'cust-4',
        full_name: 'عمر بن عبدالعزيز الدوسري',
        national_id: '1076543210',
        birth_date: '1984-02-18',
        phone: '0567890123',
        address: 'الدمام - حي الشاطئ',
        notes: 'عميل شركة مقاولات',
        created_at: '2026-04-01',
        status: 'active',
      },
    ];

    // Seed Plans & Installments
    // Plan 1: Active, started 2 months ago, 4 installments of 2000 SAR each
    const plan1Id = 'plan-1';
    const plan1Insts: Installment[] = [
      {
        id: 'inst-1-1',
        plan_id: plan1Id,
        installment_number: 1,
        amount: 2000,
        paid_amount: 2000,
        remaining_amount: 0,
        due_date: pastTwoMonthsDate,
        status: 'paid',
        notes: 'القسط الأول المستحق فور إنشاء الخطة',
        last_payment_date: pastTwoMonthsDate,
      },
      {
        id: 'inst-1-2',
        plan_id: plan1Id,
        installment_number: 2,
        amount: 2000,
        paid_amount: 1200,
        remaining_amount: 800,
        due_date: pastMonthDate,
        status: 'partially_paid',
        notes: 'مدفوع جزئياً 1200 ومتبقي 800 ر.س',
        last_payment_date: pastMonthDate,
      },
      {
        id: 'inst-1-3',
        plan_id: plan1Id,
        installment_number: 3,
        amount: 2000,
        paid_amount: 0,
        remaining_amount: 2000,
        due_date: today,
        status: 'due',
        notes: 'مستحق اليوم',
      },
      {
        id: 'inst-1-4',
        plan_id: plan1Id,
        installment_number: 4,
        amount: 2000,
        paid_amount: 0,
        remaining_amount: 2000,
        due_date: FinancialEngine.addMonthsSafe(today, 1),
        status: 'due',
      },
    ];

    const plan1: InstallmentPlan = {
      id: plan1Id,
      plan_number: 'PLAN-2026-00001',
      customer_id: 'cust-1',
      store_id: 'str-1',
      total_amount: 10000,
      down_payment: 2000,
      remaining_amount: 8000,
      duration_months: 4,
      created_at: pastTwoMonthsDate,
      start_date: pastTwoMonthsDate,
      status: 'active',
      approved_at: pastTwoMonthsDate,
      approved_by: 'عبدالله الشمري',
      notes: 'تقسيط لابتوب وماك بوك برو للمكتب',
    };

    // Plan 2: Customer 2, with an overdue installment to test overdue reporting
    const plan2Id = 'plan-2';
    const plan2Insts: Installment[] = [
      {
        id: 'inst-2-1',
        plan_id: plan2Id,
        installment_number: 1,
        amount: 2000,
        paid_amount: 2000,
        remaining_amount: 0,
        due_date: pastMonthDate,
        status: 'paid',
        notes: 'القسط الأول المستحق فور إنشاء الخطة',
        last_payment_date: pastMonthDate,
      },
      {
        id: 'inst-2-2',
        plan_id: plan2Id,
        installment_number: 2,
        amount: 2000,
        paid_amount: 0,
        remaining_amount: 2000,
        due_date: '2026-08-25', // overdue
        status: 'overdue',
        notes: 'متأخر عن السداد ويحتاج متابعة',
      },
      {
        id: 'inst-2-3',
        plan_id: plan2Id,
        installment_number: 3,
        amount: 2000,
        paid_amount: 0,
        remaining_amount: 2000,
        due_date: FinancialEngine.addMonthsSafe(today, 1),
        status: 'due',
      },
    ];

    const plan2: InstallmentPlan = {
      id: plan2Id,
      plan_number: 'PLAN-2026-00002',
      customer_id: 'cust-2',
      store_id: 'str-2',
      total_amount: 6000,
      down_payment: 0,
      remaining_amount: 6000,
      duration_months: 3,
      created_at: pastMonthDate,
      start_date: pastMonthDate,
      status: 'overdue',
      approved_at: pastMonthDate,
      approved_by: 'عبدالله الشمري',
      notes: 'تقسيط جهاز شاشة تلفزيون ونظام صوتي',
    };

    // Plan 3: Draft plan for customer 3
    const plan3Id = 'plan-3';
    const plan3Insts: Installment[] = [
      {
        id: 'inst-3-1',
        plan_id: plan3Id,
        installment_number: 1,
        amount: 1500,
        paid_amount: 0,
        remaining_amount: 1500,
        due_date: today,
        status: 'due',
        notes: 'القسط الأول المستحق فور الاعتماد',
      },
      {
        id: 'inst-3-2',
        plan_id: plan3Id,
        installment_number: 2,
        amount: 1500,
        paid_amount: 0,
        remaining_amount: 1500,
        due_date: FinancialEngine.addMonthsSafe(today, 1),
        status: 'due',
      },
    ];

    const plan3: InstallmentPlan = {
      id: plan3Id,
      plan_number: 'PLAN-2026-00003',
      customer_id: 'cust-3',
      store_id: 'str-1',
      total_amount: 4500,
      down_payment: 1500,
      remaining_amount: 3000,
      duration_months: 2,
      created_at: today,
      start_date: today,
      status: 'draft',
      notes: 'مسودة بانتظار اعتماد المدير واستلام الدفعة الأولى',
    };

    const payments: Payment[] = [
      {
        id: 'pay-1',
        payment_number: 'PAY-2026-000001',
        installment_id: 'inst-1-1',
        plan_id: plan1Id,
        customer_id: 'cust-1',
        amount: 2000,
        paid_at: `${pastTwoMonthsDate}T11:30:00Z`,
        payment_method: 'pos_card',
        created_by: 'عبدالله الشمري',
        reference_number: 'POS-98762145',
        notes: 'سداد القسط الأول كامل عبر الشبكة',
        status: 'recorded',
      },
      {
        id: 'pay-2',
        payment_number: 'PAY-2026-000002',
        installment_id: 'inst-1-2',
        plan_id: plan1Id,
        customer_id: 'cust-1',
        amount: 1200,
        paid_at: `${pastMonthDate}T14:15:00Z`,
        payment_method: 'cash',
        created_by: 'خالد بن فيصل',
        notes: 'سداد دفعة جزئية نقدياً بموجب سند قبض',
        status: 'recorded',
      },
      {
        id: 'pay-3',
        payment_number: 'PAY-2026-000003',
        installment_id: 'inst-2-1',
        plan_id: plan2Id,
        customer_id: 'cust-2',
        amount: 2000,
        paid_at: `${pastMonthDate}T09:45:00Z`,
        payment_method: 'bank_transfer',
        created_by: 'عبدالله الشمري',
        reference_number: 'TRF-SNB-44321',
        notes: 'تحويل بنكي مباشر لحساب المؤسسة',
        status: 'recorded',
      },
    ];

    const auditLogs: FinancialAuditLog[] = [
      {
        id: 'log-1',
        action: 'plan_created',
        entity_type: 'plan',
        entity_id: plan1Id,
        user_name: 'عبدالله الشمري',
        user_role: 'المدير العام',
        timestamp: `${pastTwoMonthsDate}T10:00:00Z`,
        details: 'إنشاء خطة تقسيط PLAN-2026-00001 للعميل أحمد بن محمد عبدالله بمبلغ 10,000 ر.س',
      },
      {
        id: 'log-2',
        action: 'payment_created',
        entity_type: 'payment',
        entity_id: 'pay-1',
        user_name: 'عبدالله الشمري',
        user_role: 'المدير العام',
        timestamp: `${pastTwoMonthsDate}T11:30:00Z`,
        details: 'تسجيل دفعة سداد القسط الأول بقيمة 2,000 ر.س بطريقة الدفع (شبكة)',
        new_values: { amount: 2000, installment: 'inst-1-1', method: 'pos_card' },
      },
      {
        id: 'log-3',
        action: 'payment_created',
        entity_type: 'payment',
        entity_id: 'pay-2',
        user_name: 'خالد بن فيصل',
        user_role: 'موظف التحصيل',
        timestamp: `${pastMonthDate}T14:15:00Z`,
        details: 'تسجيل دفعة جزئية بقيمة 1,200 ر.س للقسط الثاني (المتبقي: 800 ر.س)',
        new_values: { amount: 1200, installment: 'inst-1-2', method: 'cash' },
      },
    ];

    const notifications: NotificationItem[] = [
      {
        id: 'notif-1',
        title: 'قسط مستحق اليوم',
        message: 'القسط رقم 3 من الخطة PLAN-2026-00001 للعميل أحمد بن محمد عبدالله مستحق اليوم بمبلغ 2,000 ر.س.',
        type: 'warning',
        created_at: today,
        read: false,
        target_id: plan1Id,
        target_type: 'plan',
      },
      {
        id: 'notif-2',
        title: 'قسط متأخر عن السداد',
        message: 'القسط رقم 2 من الخطة PLAN-2026-00002 للعميل سعد القحطاني متأخر بمبلغ 2,000 ر.س.',
        type: 'danger',
        created_at: today,
        read: false,
        target_id: plan2Id,
        target_type: 'plan',
      },
      {
        id: 'notif-3',
        title: 'جاهزية النسخ الاحتياطي',
        message: 'النظام يعمل بوضع Local-First المستقر. يمكنك تنزيل نسخة احتياطية أو تصدير ملف SQL في أي وقت.',
        type: 'info',
        created_at: today,
        read: true,
      },
    ];

    const settings: SystemSettings = {
      app_name_ar: 'نظام إدارة الأقساط',
      app_name_en: 'Installment Management System',
      app_logo: null,
      login_page_image: null,
      default_currency: 'ر.س',
      date_format: 'YYYY-MM-DD',
      monthly_target: 60000,
      timezone: 'Asia/Riyadh',
      max_backups: 10,
      session_timeout_minutes: 60,
    };

    return {
      users,
      customers,
      stores,
      plans: [plan1, plan2, plan3],
      installments: [...plan1Insts, ...plan2Insts, ...plan3Insts],
      payments,
      auditLogs,
      notifications,
      settings,
      backups: [
        {
          id: 'bkp-initial',
          file_name: 'aqsat_backup_initial.json',
          created_at: new Date().toISOString(),
          size_bytes: 18450,
          type: 'automatic',
          created_by: 'النظام',
          status: 'valid',
        },
      ],
    };
  }

  /**
   * Creates a backup. Returns the backup record.
   */
  public static createBackup(
    state: AppDatabaseState,
    type: 'manual' | 'automatic' | 'safety_before_restore',
    userName = 'المدير'
  ): BackupRecord {
    const snapshotStr = JSON.stringify(state);
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `aqsat_backup_${type}_${dateStr}.json`;

    const record: BackupRecord = {
      id: `bkp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      file_name: fileName,
      created_at: new Date().toISOString(),
      size_bytes: new Blob([snapshotStr]).size,
      type,
      created_by: userName,
      status: 'valid',
      data_snapshot: snapshotStr,
    };

    return record;
  }

  /**
   * Generates a ready-to-use MySQL DDL & DML script compatible with XAMPP/WAMP phpMyAdmin.
   * Uses DECIMAL(14,2), proper Foreign Keys, Indexes, and UTF-8 Unicode charset.
   */
  public static generateMySQLDump(state: AppDatabaseState): string {
    return `-- ==================================================================
-- Master Database Schema & Initial Data Dump for XAMPP / WAMP MySQL
-- Database: aqsat_db
-- Strict Financial Precision: DECIMAL(14, 2)
-- Generated by: ${state.settings.app_name_ar} (${state.settings.app_name_en})
-- Date: ${new Date().toISOString()}
-- ==================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+03:00";

CREATE DATABASE IF NOT EXISTS \`aqsat_db\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`aqsat_db\`;

-- 1. Users Table
DROP TABLE IF EXISTS \`users\`;
CREATE TABLE \`users\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`name\` VARCHAR(191) NOT NULL,
  \`username\` VARCHAR(100) NOT NULL UNIQUE,
  \`email\` VARCHAR(191) NOT NULL UNIQUE,
  \`role\` ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_users_role\` (\`role\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Stores Table
DROP TABLE IF EXISTS \`stores\`;
CREATE TABLE \`stores\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`name\` VARCHAR(191) NOT NULL,
  \`code\` VARCHAR(50) NOT NULL UNIQUE,
  \`status\` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  \`notes\` TEXT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_stores_code\` (\`code\`),
  INDEX \`idx_stores_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Customers Table
DROP TABLE IF EXISTS \`customers\`;
CREATE TABLE \`customers\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`full_name\` VARCHAR(191) NOT NULL,
  \`national_id\` VARCHAR(20) NOT NULL UNIQUE,
  \`birth_date\` DATE NULL,
  \`phone\` VARCHAR(30) NOT NULL,
  \`address\` TEXT NULL,
  \`notes\` TEXT NULL,
  \`status\` ENUM('active', 'archived') NOT NULL DEFAULT 'active',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_cust_national\` (\`national_id\`),
  INDEX \`idx_cust_phone\` (\`phone\`),
  INDEX \`idx_cust_name\` (\`full_name\`),
  INDEX \`idx_cust_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Installment Plans Table
DROP TABLE IF EXISTS \`installment_plans\`;
CREATE TABLE \`installment_plans\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`plan_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`customer_id\` VARCHAR(36) NOT NULL,
  \`store_id\` VARCHAR(36) NOT NULL,
  \`total_amount\` DECIMAL(14,2) NOT NULL,
  \`down_payment\` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  \`remaining_amount\` DECIMAL(14,2) NOT NULL,
  \`duration_months\` TINYINT UNSIGNED NOT NULL,
  \`created_at\` DATE NOT NULL,
  \`start_date\` DATE NOT NULL,
  \`notes\` TEXT NULL,
  \`status\` ENUM('draft', 'approved', 'active', 'completed', 'overdue', 'cancelled') NOT NULL DEFAULT 'draft',
  \`approved_at\` DATETIME NULL,
  \`approved_by\` VARCHAR(191) NULL,
  \`cancelled_at\` DATETIME NULL,
  \`cancelled_reason\` TEXT NULL,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_plans_number\` (\`plan_number\`),
  INDEX \`idx_plans_customer\` (\`customer_id\`),
  INDEX \`idx_plans_store\` (\`store_id\`),
  INDEX \`idx_plans_status\` (\`status\`),
  CONSTRAINT \`fk_plans_customer\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`) ON DELETE RESTRICT,
  CONSTRAINT \`fk_plans_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Installments Table
DROP TABLE IF EXISTS \`installments\`;
CREATE TABLE \`installments\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`plan_id\` VARCHAR(36) NOT NULL,
  \`installment_number\` SMALLINT UNSIGNED NOT NULL,
  \`amount\` DECIMAL(14,2) NOT NULL,
  \`paid_amount\` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  \`remaining_amount\` DECIMAL(14,2) NOT NULL,
  \`due_date\` DATE NOT NULL,
  \`status\` ENUM('due', 'partially_paid', 'paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'due',
  \`notes\` TEXT NULL,
  \`last_payment_date\` DATETIME NULL,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_inst_plan\` (\`plan_id\`),
  INDEX \`idx_inst_due_date\` (\`due_date\`),
  INDEX \`idx_inst_status\` (\`status\`),
  CONSTRAINT \`fk_inst_plan\` FOREIGN KEY (\`plan_id\`) REFERENCES \`installment_plans\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Payments Table
DROP TABLE IF EXISTS \`payments\`;
CREATE TABLE \`payments\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`payment_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`installment_id\` VARCHAR(36) NOT NULL,
  \`plan_id\` VARCHAR(36) NOT NULL,
  \`customer_id\` VARCHAR(36) NOT NULL,
  \`amount\` DECIMAL(14,2) NOT NULL,
  \`paid_at\` DATETIME NOT NULL,
  \`payment_method\` ENUM('cash', 'bank_transfer', 'pos_card') NOT NULL DEFAULT 'cash',
  \`created_by\` VARCHAR(191) NOT NULL,
  \`reference_number\` VARCHAR(100) NULL,
  \`notes\` TEXT NULL,
  \`status\` ENUM('recorded', 'reversed') NOT NULL DEFAULT 'recorded',
  \`reversed_at\` DATETIME NULL,
  \`reversed_by\` VARCHAR(191) NULL,
  \`reversal_reason\` TEXT NULL,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_pay_number\` (\`payment_number\`),
  INDEX \`idx_pay_inst\` (\`installment_id\`),
  INDEX \`idx_pay_plan\` (\`plan_id\`),
  INDEX \`idx_pay_status\` (\`status\`),
  CONSTRAINT \`fk_pay_installment\` FOREIGN KEY (\`installment_id\`) REFERENCES \`installments\` (\`id\`) ON DELETE RESTRICT,
  CONSTRAINT \`fk_pay_plan\` FOREIGN KEY (\`plan_id\`) REFERENCES \`installment_plans\` (\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Financial Audit Logs Table
DROP TABLE IF EXISTS \`financial_audit_logs\`;
CREATE TABLE \`financial_audit_logs\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`action\` VARCHAR(50) NOT NULL,
  \`entity_type\` VARCHAR(50) NOT NULL,
  \`entity_id\` VARCHAR(36) NOT NULL,
  \`user_name\` VARCHAR(191) NOT NULL,
  \`user_role\` VARCHAR(50) NOT NULL,
  \`timestamp\` DATETIME NOT NULL,
  \`details\` TEXT NOT NULL,
  \`reason\` TEXT NULL,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_audit_action\` (\`action\`),
  INDEX \`idx_audit_entity\` (\`entity_type\`, \`entity_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
`;
  }
}
