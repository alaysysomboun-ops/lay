import React, { useState } from 'react';
import { StoreSettings, Currency, Language, User } from '../../types';
import { Settings, Store, Save, RotateCcw, ShieldCheck, Coins, Globe, CheckCircle } from 'lucide-react';

interface SettingsScreenProps {
  settings: StoreSettings;
  currentUser: User;
  onUpdateSettings: (settings: StoreSettings) => void;
  onResetDemoData: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  currentUser,
  onUpdateSettings,
  onResetDemoData,
  onShowToast,
}) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });

  const handleChange = (field: keyof StoreSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleExchangeRateChange = (curr: 'THB' | 'LAK' | 'VND', rate: number) => {
    setFormData((prev) => ({
      ...prev,
      exchangeRates: {
        ...prev.exchangeRates,
        [curr]: rate,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    onShowToast('success', 'บันทึกการตั้งค่าระบบเรียบร้อย');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            ตั้งค่าระบบร้านค้า (Store Settings)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            กำหนดข้อมูลร้านค้า สกุลเงิน ภาษีมูลค่าเพิ่ม และนโยบายความปลอดภัย
          </p>
        </div>

        <button
          onClick={handleSubmit}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
        >
          <Save className="w-4 h-4" />
          บันทึกการตั้งค่า
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Profile Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Store className="w-4 h-4 text-blue-600" />
            ข้อมูลร้านค้าและใบเสร็จ (Store Information)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ชื่อร้านค้า / กิจการ *
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => handleChange('storeName', e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                สาขา
              </label>
              <input
                type="text"
                value={formData.storeBranch}
                onChange={(e) => handleChange('storeBranch', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                เลขประจำตัวผู้เสียภาษี
              </label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => handleChange('taxId', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                เบอร์โทรศัพท์ร้าน
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ที่อยู่ร้านค้า
              </label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ข้อความท้ายใบเสร็จ (Receipt Footer)
              </label>
              <input
                type="text"
                value={formData.receiptFooter}
                onChange={(e) => handleChange('receiptFooter', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Currency & Tax Policies */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Coins className="w-4 h-4 text-emerald-600" />
            สกุลเงินหลักและอัตราแลกเปลี่ยน (Currencies & Rates)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                สกุลเงินหลักของระบบ
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value as Currency)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="THB">THB (฿ บาทไทย)</option>
                <option value="LAK">LAK (₭ กีบลาว)</option>
                <option value="VND">VND (₫ ดงเวียดนาม)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                อัตราแลกเปลี่ยน LAK ต่อ 1 THB
              </label>
              <input
                type="number"
                value={formData.exchangeRates.LAK}
                onChange={(e) => handleExchangeRateChange('LAK', parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                อัตราแลกเปลี่ยน VND ต่อ 1 THB
              </label>
              <input
                type="number"
                value={formData.exchangeRates.VND}
                onChange={(e) => handleExchangeRateChange('VND', parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Business Rules & Controls */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            การควบคุมความปลอดภัยและกฎการขาย (Business Policies)
          </h3>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requireManagerApprovalForBelowCost}
                onChange={(e) => handleChange('requireManagerApprovalForBelowCost', e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  ต้องได้รับอนุมัติจากผู้จัดการ เมื่อราคาขายต่ำกว่าราคาทุน (Below-Cost Authorization)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ป้องกันการขายขาดทุนโดยไม่ได้ตั้งใจ โดยระบบจะบังคับใส่ PIN ของผู้จัดการก่อนตัดการขาย
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowNegativeStock}
                onChange={(e) => handleChange('allowNegativeStock', e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  อนุญาตให้ตัดขายสินค้าจนสต็อกติดลบได้ (Allow Negative Stock)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  หากปิดไว้ ระบบจะไม่อนุญาตให้ทำการขายหากจำนวนคงเหลือในคลังไม่เพียงพอ
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableVat}
                onChange={(e) => handleChange('enableVat', e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  คำนวณภาษีมูลค่าเพิ่ม VAT ({formData.vatRate}%)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  แสดงภาษีมูลค่าเพิ่มในหน้าจุดขาย POS และบนใบเสร็จรับเงิน
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Danger Zone: Reset Data */}
        <div className="p-5 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300">
              รีเซ็ตข้อมูลทั้งหมดกลับสู่ข้อมูลตัวอย่าง (Reset Demo Data)
            </h4>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
              ล้างประวัติการขาย สต็อกที่แก้ไข และโหลดสินค้าตัวอย่างตั้งต้นสำหรับการสาธิตระบบ
            </p>
          </div>
          <button
            type="button"
            onClick={onResetDemoData}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs shrink-0 cursor-pointer"
          >
            รีเซ็ตข้อมูลตัวอย่าง
          </button>
        </div>
      </form>
    </div>
  );
};
