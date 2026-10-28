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
    onShowToast('success', 'ບັນທຶກການຕັ້ງຄ່າລະບົບຮຽບຮ້ອຍ');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            ຕັ້ງຄ່າລະບົບຮ້ານຄ້າ (Store Settings)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ກຳນົດຂໍ້ມູນຮ້ານຄ້າ, ສະກຸນເງິນ, ອາກອນມູນຄ່າເພີ່ມ ແລະ ນະໂຍບາຍຄວາມປອດໄພ
          </p>
        </div>

        <button
          onClick={handleSubmit}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
        >
          <Save className="w-4 h-4" />
          ບັນທຶກການຕັ້ງຄ່າ
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Profile Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Store className="w-4 h-4 text-blue-600" />
            ຂໍ້ມູນຮ້ານຄ້າ ແລະ ໃບບິນ (Store Information)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ຊື່ຮ້ານຄ້າ / ທຸລະກິດ *
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
                ສາຂາ
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
                ເລກປະຈຳຕົວຜູ້ເສຍອາກອນ / ທະບຽນວິສາຫະກິດ
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
                ເບີໂທລະສັບຮ້ານ
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
                ທີ່ຢູ່ຮ້ານຄ້າ
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
                ຂໍ້ຄວາມທ້າຍໃບບິນ (Receipt Footer)
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
            ສະກຸນເງິນຫຼັກ ແລະ ອັດຕາແລກປ່ຽນ (Currencies & Rates)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ສະກຸນເງິນຫຼັກຂອງລະບົບ
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value as Currency)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="LAK">LAK (₭ ກີບລາວ)</option>
                <option value="THB">THB (฿ ບາດໄທ)</option>
                <option value="VND">VND (₫ ດົງຫວຽດນາມ)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ອັດຕາແລກປ່ຽນ LAK ຕໍ່ 1 THB
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
                ອັດຕາແລກປ່ຽນ VND ຕໍ່ 1 THB
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
            ການຄວບຄຸມຄວາມປອດໄພ ແລະ ກົດການຂາຍ (Business Policies)
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
                  ຕ້ອງໄດ້ຮັບການອະນຸມັດຈາກຜູ້ຈັດການ ເມື່ອລາຄາຂາຍຕ່ຳກວ່າລາຄາຕົ້ນທຶນ (Below-Cost Authorization)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ປ້ອງກັນການຂາຍຂາດທຶນໂດຍບໍ່ໄດ້ຕັ້ງໃຈ ໂດຍລະບົບຈະບັງຄັບໃສ່ລະຫັດ PIN ຂອງຜູ້ຈັດການກ່ອນຕັດການຂາຍ
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
                  ອະນຸຍາດໃຫ້ຕັດຂາຍສິນຄ້າຈົນສະຕັອກຕິດລົບໄດ້ (Allow Negative Stock)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ຫາກປິດໄວ້ ລະບົບຈະບໍ່ອະນຸຍາດໃຫ້ເຮັດການຂາຍຫາກຈຳນວນຄົງເຫຼືອໃນສາງບໍ່ພຽງພໍ
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
                  ຄຳນວນອາກອນມູນຄ່າເພີ່ມ VAT ({formData.vatRate}%)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ສະແດງອາກອນມູນຄ່າເພີ່ມໃນໜ້າຈຸດຂາຍ POS ແລະ ເທິງໃບບິນຮັບເງິນ
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Danger Zone: Reset Data */}
        <div className="p-5 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300">
              ຣີເຊັດຂໍ້ມູນທັງໝົດກັບສູ່ຂໍ້ມູນຕົວຢ່າງ (Reset Demo Data)
            </h4>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
              ລຶບປະຫວັດການຂາຍ, ສະຕັອກທີ່ແກ້ໄຂ ແລະ ໂຫຼດສິນຄ້າຕົວຢ່າງຕັ້ງຕົ້ນສຳລັບການສາທິດລະບົບ
            </p>
          </div>
          <button
            type="button"
            onClick={onResetDemoData}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs shrink-0 cursor-pointer"
          >
            ຣີເຊັດຂໍ້ມູນຕົວຢ່າງ
          </button>
        </div>
      </form>
    </div>
  );
};
