/**
 * User & Permissions Management View (Section 32 - المستخدمون والصلاحيات RBAC)
 * Supports user accounts, role assignment (Admin, Store Manager, Collector, Accountant, Viewer),
 * active/inactive status, and instant active user switcher.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Edit2,
  Key,
  Building,
  CheckCircle,
  XCircle,
  X,
  UserCheck,
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const { state, currentUser, addUser, updateUser, setCurrentUser, hasPermission } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    role: 'collector' as UserRole,
    store_id: '',
  });

  const [error, setError] = useState<string | null>(null);

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'مدير عام (Super Admin)', bg: 'bg-purple-100 text-purple-800' };
      case 'store_manager':
        return { label: 'مدير فرع / متجر', bg: 'bg-blue-100 text-blue-800' };
      case 'collector':
        return { label: 'محصل مالي', bg: 'bg-emerald-100 text-emerald-800' };
      case 'accountant':
        return { label: 'محاسب مالي', bg: 'bg-amber-100 text-amber-800' };
      case 'viewer':
        return { label: 'مشاهد فقط', bg: 'bg-slate-100 text-slate-700' };
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.username.trim()) {
      setError('الرجاء إدخال الاسم واسم المستخدم');
      return;
    }

    try {
      addUser({
        name: formData.name.trim(),
        username: formData.username.trim(),
        role: formData.role,
        store_id: formData.store_id || undefined,
        is_active: true,
      });
      setShowAddModal(false);
      setFormData({ name: '', username: '', role: 'collector', store_id: '' });
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إضافة المستخدم');
    }
  };

  const handleToggleActive = (user: User) => {
    if (user.id === currentUser?.id) {
      alert('لا يمكنك تعطيل حسابك النشط الحالي');
      return;
    }
    updateUser(user.id, { is_active: !user.is_active });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            إدارة المستخدمين والصلاحيات (RBAC)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            تحديد الأدوار، تقييد العمليات المالية، وربط الموظفين بالمتاجر
          </p>
        </div>

        {hasPermission('users.manage') && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            إضافة مستخدم جديد
          </button>
        )}
      </div>

      {/* Role Switcher Widget (For quick testing across roles) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
            {currentUser?.name ? currentUser.name.charAt(0) : 'م'}
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">المستخدم النشط الحالي في الجلسة:</div>
            <div className="font-bold text-slate-900 flex items-center gap-2">
              {currentUser?.name || 'مستخدم النظام'}
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {getRoleLabel(currentUser?.role || 'admin').label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">التبديل إلى مستخدم آخر:</span>
          <select
            value={currentUser?.id || ''}
            onChange={(e) => {
              const u = state.users.find((user) => user.id === e.target.value);
              if (u) setCurrentUser(u);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {state.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({getRoleLabel(u.role).label})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">قائمة المستخدمين في النظام ({state.users.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="p-3.5 text-start">الاسم</th>
                <th className="p-3.5 text-start">اسم المستخدم</th>
                <th className="p-3.5 text-start">الدور والصلاحية</th>
                <th className="p-3.5 text-start">المتجر التابع له</th>
                <th className="p-3.5 text-start">الحالة</th>
                <th className="p-3.5 text-end">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.users.map((user) => {
                const store = state.stores.find((s) => s.id === user.store_id);
                const roleBadge = getRoleLabel(user.role);

                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        {user.id === currentUser?.id && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="أنت" />
                        )}
                        {user.name}
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-600 font-medium">{user.username}</td>

                    <td className="p-3.5">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${roleBadge.bg}`}>
                        {roleBadge.label}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-700">
                      {store ? store.name : <span className="text-slate-400">كافة الفروع</span>}
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          user.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {user.is_active ? 'نشط' : 'معطل'}
                      </span>
                    </td>

                    <td className="p-3.5 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCurrentUser(user)}
                          className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          title="تسجيل الدخول بهذا المستخدم فوراً"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          دخول به
                        </button>

                        {hasPermission('users.manage') && user.id !== currentUser?.id && (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(user)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              user.is_active
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {user.is_active ? 'تعطيل' : 'تفعيل'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                إضافة مستخدم جديد
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الاسم الكامل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: تركي السالم"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم المستخدم (Username) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="مثال: turki"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الدور والصلاحية <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                >
                  <option value="admin">مدير عام (Super Admin) - صلاحيات كاملة</option>
                  <option value="store_manager">مدير فرع / متجر - إدارة الفرع</option>
                  <option value="collector">محصل مالي - تسجيل دفعات وسندات</option>
                  <option value="accountant">محاسب - تقارير وكشوف حساب فقط</option>
                  <option value="viewer">مشاهد فقط - قراءة بدون تعديل</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ربط بمتجر محدد (اختياري)
                </label>
                <select
                  value={formData.store_id}
                  onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">كافة الفروع / إدارة عامة</option>
                  {state.stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إضافة المستخدم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
