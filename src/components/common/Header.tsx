import React from 'react';
import {
  Menu,
  Globe,
  Coins,
  RotateCcw,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { StoreSettings, Currency, Language, User, CashShift } from '../../types';

interface HeaderProps {
  settings: StoreSettings;
  onUpdateCurrency: (currency: Currency) => void;
  onUpdateLanguage: (lang: Language) => void;
  currentUser: User;
  onOpenRoleSwitcher: () => void;
  onResetDemoData: () => void;
  onToggleMobileSidebar: () => void;
  activeShift?: CashShift;
  onOpenShiftModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateCurrency,
  onUpdateLanguage,
  currentUser,
  onOpenRoleSwitcher,
  onResetDemoData,
  onToggleMobileSidebar,
  activeShift,
  onOpenShiftModal,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-sm lg:text-base font-bold text-slate-900 dark:text-white leading-tight">
            {settings.storeName}
          </h2>
          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            {settings.storeBranch}
          </p>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Active Shift Status */}
        <button
          onClick={onOpenShiftModal}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeShift
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
          }`}
          title="จัดการกะการขาย (Shift)"
        >
          <Clock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {activeShift ? `กะเปิด: ${activeShift.cashierName.split(' ')[0]}` : 'ยังไม่เปิดกะ'}
          </span>
          <span className="sm:hidden">{activeShift ? 'กะเปิด' : 'เปิดกะ'}</span>
        </button>

        {/* Currency Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
          {(['THB', 'LAK', 'VND'] as Currency[]).map((curr) => (
            <button
              key={curr}
              onClick={() => onUpdateCurrency(curr)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                settings.currency === curr
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {curr === 'THB' ? '฿ THB' : curr === 'LAK' ? '₭ LAK' : '₫ VND'}
            </button>
          ))}
        </div>

        {/* Language Switcher */}
        <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
          {(
            [
              { code: 'th', label: 'TH' },
              { code: 'en', label: 'EN' },
              { code: 'lo', label: 'LO' },
              { code: 'vi', label: 'VI' },
            ] as const
          ).map((l) => (
            <button
              key={l.code}
              onClick={() => onUpdateLanguage(l.code)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                settings.language === l.code
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Current Role switcher badge */}
        <button
          onClick={onOpenRoleSwitcher}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
        >
          <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">{currentUser.role}</span>
        </button>

        {/* Reset Demo Data Button */}
        <button
          onClick={onResetDemoData}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          title="รีเซ็ตข้อมูลตัวอย่าง (Reset Demo Data)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
