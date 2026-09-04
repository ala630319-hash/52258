export type UserRole = 'admin' | 'store_manager' | 'collector' | 'accountant' | 'viewer' | 'employee';

export type PermissionKey =
  | 'customers.view'
  | 'customers.create'
  | 'customers.edit'
  | 'customers.archive'
  | 'stores.view'
  | 'stores.create'
  | 'stores.edit'
  | 'stores.archive'
  | 'plans.view'
  | 'plans.create'
  | 'plans.edit'
  | 'plans.approve'
  | 'plans.cancel'
  | 'installments.view'
  | 'installments.edit_due_date'
  | 'payments.view'
  | 'payments.create'
  | 'payments.reverse'
  | 'reports.view'
  | 'reports.export'
  | 'users.manage'
  | 'permissions.manage'
  | 'backups.create'
  | 'backups.download'
  | 'backups.restore'
  | 'backups.delete'
  | 'settings.manage'
  | 'audit_logs.view';

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: UserRole;
  permissions: PermissionKey[];
  avatar?: string;
  last_login?: string;
  is_active?: boolean;
  store_id?: string;
}

export type CustomerStatus = 'active' | 'archived';

export interface Customer {
  id: string;
  full_name: string;
  national_id: string;
  birth_date: string;
  phone: string;
  address: string;
  notes?: string;
  created_at: string;
  status: CustomerStatus;
}

export interface Store {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive';
  notes?: string;
  created_at: string;
}

export type PlanStatus =
  | 'draft'
  | 'approved'
  | 'active'
  | 'completed'
  | 'overdue'
  | 'cancelled';

export type InstallmentDuration = 2 | 3 | 4 | 6 | 9 | 12;

export interface InstallmentPlan {
  id: string;
  plan_number: string; // e.g. PLAN-2026-00001
  customer_id: string;
  store_id: string;
  total_amount: number;
  down_payment: number;
  remaining_amount: number;
  duration_months: InstallmentDuration;
  created_at: string; // YYYY-MM-DD
  start_date: string; // YYYY-MM-DD (equals creation date as per rule)
  notes?: string;
  status: PlanStatus;
  approved_at?: string;
  approved_by?: string;
  cancelled_at?: string;
  cancelled_reason?: string;
}

export type InstallmentStatus =
  | 'due'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export interface Installment {
  id: string;
  plan_id: string;
  installment_number: number;
  amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date: string; // YYYY-MM-DD
  status: InstallmentStatus;
  notes?: string;
  last_payment_date?: string;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'pos_card';
export type PaymentStatus = 'recorded' | 'reversed';

export interface Payment {
  id: string;
  payment_number: string; // e.g. PAY-2026-000001
  installment_id: string;
  plan_id: string;
  customer_id: string;
  amount: number;
  paid_at: string; // ISO datetime
  payment_method: PaymentMethod;
  created_by: string; // user name or id
  reference_number?: string;
  notes?: string;
  status: PaymentStatus;
  reversed_at?: string;
  reversed_by?: string;
  reversal_reason?: string;
}

export interface FinancialAuditLog {
  id: string;
  action:
    | 'plan_created'
    | 'plan_approved'
    | 'plan_cancelled'
    | 'plan_rescheduled'
    | 'installment_due_date_changed'
    | 'payment_created'
    | 'payment_reversed'
    | 'customer_archived'
    | 'customer_restored'
    | 'backup_created'
    | 'backup_restored'
    | 'settings_updated';
  entity_type: 'plan' | 'installment' | 'payment' | 'customer' | 'backup' | 'settings';
  entity_id: string;
  user_name: string;
  user_role: string;
  timestamp: string; // ISO string
  details: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  reason?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  created_at: string;
  read: boolean;
  target_id?: string;
  target_type?: 'plan' | 'installment' | 'customer' | 'backup';
}

export interface SystemSettings {
  app_name_ar: string;
  app_name_en: string;
  app_logo: string | null; // data url or path
  login_page_image: string | null;
  default_currency: string;
  date_format: string;
  monthly_target: number;
  timezone: string;
  max_backups: number;
  session_timeout_minutes: number;
}

export interface BackupRecord {
  id: string;
  file_name: string;
  created_at: string;
  size_bytes: number;
  type: 'manual' | 'automatic' | 'safety_before_restore';
  created_by: string;
  status: 'valid' | 'corrupted';
  data_snapshot?: string; // serialized JSON payload
}
