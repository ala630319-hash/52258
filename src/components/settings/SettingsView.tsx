/**
 * Settings & Identity View (Section 37 - إعدادات هوية البرنامج)
 * Allows customization of Arabic/English system name, logo upload/preview, login background, monthly collection target, and currency.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings as SettingsIcon,
  Save,
  Image,
  Upload,
  CheckCircle,
  Building,
  Target,
  DollarSign,
  Globe,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { state, updateSettings, hasPermission } = useApp();

  const [formData, setFormData] = useState({
    system_name_ar: state.settings.system_name_ar,
    system_name_en: state.settings.system_name_en,
    default_currency: state.settings.default_currency,
    monthly_target: state.settings.monthly_target,
    logo_url: state.settings.logo_url || '',
    login_background_url: state.settings.login_background_url || '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, login_background_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedSuccess(false);

    if (!hasPermission('settings.manage')) {
      setError('ليس لديك صلاحية لتعديل إعدادات النظام');
      return;
    }

    try {
      updateSettings({
        system_name_ar: formData.system_name_ar.trim(),
        system_name_en: formData.system_name_en.trim(),
        default_currency: formData.default_currency.trim(),
        monthly_target: Number(formData.monthly_target) || 50000,
        logo_url: formData.logo_url,
        login_background_url: formData.login_background_url,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-emerald-600" />
          إعدادات وهوية النظام
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          تخصيص المظهر، شعار المؤسسة، الأهداف الشهرية، والعملة الافتراضية
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>تم حفظ إعدادات وهوية النظام بنجاح وتطبيقها على كافة الشاشات والمطبوعات.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: System Identity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-4 h-4 text-slate-500" />
            هوية واسم المنشأة
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم النظام بالعربية <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.system_name_ar}
                onChange={(e) => setFormData({ ...formData, system_name_ar: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم النظام بالإنجليزية <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.system_name_en}
                onChange={(e) => setFormData({ ...formData, system_name_en: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                العملة الافتراضية
              </label>
              <input
                type="text"
                value={formData.default_currency}
                onChange={(e) => setFormData({ ...formData, default_currency: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="ر.س أو SAR"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المستهدف الشهري للتحصيل ({formData.default_currency})
              </label>
              <input
                type="number"
                min="1000"
                step="500"
                value={formData.monthly_target}
                onChange={(e) => setFormData({ ...formData, monthly_target: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Logo & Visual Assets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
            <Image className="w-4 h-4 text-slate-500" />
            الشعار والصور الرسمية
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">شعار المؤسسة (Logo)</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 shrink-0">
                  {formData.logo_url ? (
                    <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-[11px] text-slate-400 text-center px-1">شعار النظام الافتراضي</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    رفع شعار جديد
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  {formData.logo_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo_url: '' })}
                      className="text-[11px] text-rose-600 block hover:underline"
                    >
                      إعادة تعيين للشعار الافتراضي
                    </button>
                  )}
                  <p className="text-[10px] text-slate-400">صيغ مدعومة: PNG, SVG, JPG بحد أقصى 2 ميجابايت</p>
                </div>
              </div>
            </div>

            {/* Login Background */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">خلفية شاشة الدخول</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 shrink-0">
                  {formData.login_background_url ? (
                    <img src={formData.login_background_url} alt="Background" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[11px] text-slate-400 text-center px-1">الخلفية الرسمية</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    رفع صورة خلفية
                    <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
                  </label>
                  {formData.login_background_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, login_background_url: '' })}
                      className="text-[11px] text-rose-600 block hover:underline"
                    >
                      إلغاء الصورة واستخدام النمط الرسمي
                    </button>
                  )}
                  <p className="text-[10px] text-slate-400">تظهر في واجهة تسجيل الدخول والترحيب</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            حفظ التغييرات وتطبيق الهوية
          </button>
        </div>
      </form>
    </div>
  );
};
