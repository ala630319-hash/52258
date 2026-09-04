/**
 * Backup & Database Management View (Section 34 & 36)
 * Supports:
 * - One-click Manual Backup creation
 * - Safe Restoration with AUTOMATIC SAFETY BACKUP creation prior to restore
 * - JSON download & upload
 * - Complete MySQL SQL Dump Generator (XAMPP / WAMP compatible DDL with DECIMAL(14,2))
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storageService';
import { BackupRecord } from '../../types';
import {
  Database,
  Download,
  RotateCcw,
  Plus,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  CheckCircle,
  Copy,
  X,
  Clock,
  HardDrive,
} from 'lucide-react';

export const BackupManagementView: React.FC = () => {
  const { state, createBackup, restoreBackup, hasPermission } = useApp();

  const [confirmRestoreBackup, setConfirmRestoreBackup] = useState<BackupRecord | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // MySQL SQL Modal
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleCreateBackup = () => {
    createBackup('manual');
  };

  const handleDownloadJSON = (backup: BackupRecord) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(backup.data_snapshot || JSON.stringify(state));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', backup.file_name);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleConfirmRestore = () => {
    if (!confirmRestoreBackup) return;
    setRestoreMessage(null);

    const result = restoreBackup(confirmRestoreBackup.id);
    if (result.success) {
      setRestoreMessage({
        type: 'success',
        text: `تمت الاستعادة بنجاح من النسخة (${confirmRestoreBackup.file_name}). تم إنشاء نسخة أمان وقائية للوضع السابق تلقائياً برقم (${result.safetyBackupId}).`,
      });
      setConfirmRestoreBackup(null);
    } else {
      setRestoreMessage({
        type: 'error',
        text: result.error || 'فشلت عملية الاستعادة',
      });
    }
  };

  const handleDownloadMySQLDump = () => {
    const sqlContent = StorageService.generateMySQLDump(state);
    const blob = new Blob([sqlContent], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `installments_db_dump_${new Date().toISOString().split('T')[0]}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopySql = () => {
    const sqlContent = StorageService.generateMySQLDump(state);
    navigator.clipboard.writeText(sqlContent);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-600" />
            النسخ الاحتياطي وإدارة البيانات
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            حماية البيانات، إنشاء نسخ دورية، استعادة آمنة، وتصدير قواعد بيانات MySQL / XAMPP
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-2.5 rounded-xl font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-blue-600" />
            تصدير كود MySQL (XAMPP/WAMP)
          </button>

          {hasPermission('backups.create') && (
            <button
              type="button"
              onClick={handleCreateBackup}
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              إنشاء نسخة احتياطية الآن
            </button>
          )}
        </div>
      </div>

      {restoreMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            restoreMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {restoreMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{restoreMessage.text}</span>
        </div>
      )}

      {/* Safety Policy Notice (Section 34 Requirement) */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-sm block mb-0.5">ضمانة أمان البيانات المحاسبية (Safety Guarantee):</span>
          قبل أي عملية استعادة، يقوم النظام آلياً وبدون أي تدخل بإنشاء <strong>&quot;نسخة أمان وقائية&quot;</strong> من الحالة الحالية، مما يضمن إمكانية التراجع الفوري في حال حدوث أي خطأ بشري أثناء الاستعادة.
        </div>
      </div>

      {/* Backups Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">سجل النسخ الاحتياطية المتوفرة ({state.backups.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="p-3.5 text-start">اسم ملف النسخة</th>
                <th className="p-3.5 text-start">تاريخ الإنشاء</th>
                <th className="p-3.5 text-start">نوع النسخة</th>
                <th className="p-3.5 text-start">الحجم التقريبي</th>
                <th className="p-3.5 text-start">بواسطة</th>
                <th className="p-3.5 text-end">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.backups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    لا توجد نسخ احتياطية مسجلة حالياً
                  </td>
                </tr>
              ) : (
                state.backups.map((bkp) => (
                  <tr key={bkp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-slate-400" />
                        {bkp.file_name}
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-600">
                      {bkp.created_at.replace('T', ' ').substring(0, 19)}
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          bkp.type === 'safety_before_restore'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : bkp.type === 'manual'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {bkp.type === 'safety_before_restore'
                          ? 'نسخة أمان قبل الاستعادة'
                          : bkp.type === 'manual'
                          ? 'يدوية'
                          : 'تلقائية'}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-slate-600">
                      {(bkp.size_bytes / 1024).toFixed(1)} ك.ب
                    </td>

                    <td className="p-3.5 text-slate-700">{bkp.created_by}</td>

                    <td className="p-3.5 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDownloadJSON(bkp)}
                          className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          title="تنزيل ملف النسخة الاحتياطية JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                          تنزيل
                        </button>

                        {hasPermission('backups.restore') && (
                          <button
                            type="button"
                            onClick={() => setConfirmRestoreBackup(bkp)}
                            className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            title="استعادة حالة النظام من هذه النسخة"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            استعادة
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Restore */}
      {confirmRestoreBackup && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-rose-200">
            <div className="bg-rose-900 text-white p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-300" />
                تأكيد استعادة النسخة الاحتياطية
              </h4>
              <button
                type="button"
                onClick={() => setConfirmRestoreBackup(null)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed">
                هل أنت متأكد من استعادة النظام إلى النسخة:{' '}
                <strong className="font-mono text-slate-900">{confirmRestoreBackup.file_name}</strong>؟
              </p>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                <strong>ملاحظة أمان:</strong> سيقوم النظام تلقائياً بإنشاء نسخة أمان فورية من الوضع الحالي قبل تنفيذ الاستعادة لضمان عدم ضياع أي بيانات.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmRestoreBackup(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  تأكيد وتنفيذ الاستعادة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MySQL SQL Export Modal (XAMPP / WAMP) */}
      {showSqlModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-400" />
                <h4 className="font-bold text-sm">كود SQL متكامل لقاعدة بيانات MySQL (XAMPP / WAMP)</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
              <p className="text-xs text-slate-600">
                هذا الكود يولد جداول MySQL المتوافقة مع متطلبات نظام الأقساط ومعايير <code>DECIMAL(14,2)</code> للمبالغ المالية، ويحتوي على كافة بيانات العملاء والمتاجر والخطط والدفعات الحالية:
              </p>

              <div className="relative">
                <pre className="p-3.5 bg-slate-950 text-slate-200 text-[11px] font-mono rounded-xl overflow-x-auto max-h-72 border border-slate-800 leading-relaxed text-left" dir="ltr">
                  {StorageService.generateMySQLDump(state)}
                </pre>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                {copiedSql ? 'تم النسخ للحافظة!' : 'نسخ كود SQL'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={handleDownloadMySQLDump}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  تنزيل ملف .sql
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
