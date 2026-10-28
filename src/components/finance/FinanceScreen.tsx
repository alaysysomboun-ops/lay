import React, { useState, useMemo } from 'react';
import {
  FinancialRecord, CashShift, SaleTransaction, StoreSettings, User
} from '../../types';
import { formatCurrency, formatDateTime } from '../../services/formatters';
import { ExpenseFormModal } from './ExpenseFormModal';
import { ShiftModal } from './ShiftModal';
import {
  Wallet,
  Plus,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building,
  CheckCircle,
  AlertTriangle,
  History,
  Receipt,
  Search
} from 'lucide-react';

interface FinanceScreenProps {
  finances: FinancialRecord[];
  shifts: CashShift[];
  sales: SaleTransaction[];
  settings: StoreSettings;
  currentUser: User;
  onAddFinanceRecord: (record: Omit<FinancialRecord, 'id' | 'recordedBy'>) => void;
  onOpenShift: (openingCash: number) => void;
  onCloseShift: (actualCash: number, notes?: string) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const FinanceScreen: React.FC<FinanceScreenProps> = ({
  finances,
  shifts,
  sales,
  settings,
  currentUser,
  onAddFinanceRecord,
  onOpenShift,
  onCloseShift,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'TRANSACTIONS' | 'SHIFTS'>('TRANSACTIONS');
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeShift = shifts.find(s => s.status === 'OPEN');
  const canViewFinancials = currentUser.role !== 'CASHIER';

  // Current Month calculations
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);

  const completedSales = useMemo(() => {
    return sales.filter(s => s.status === 'COMPLETED' && s.createdAt.startsWith(currentMonthPrefix));
  }, [sales, currentMonthPrefix]);

  const monthRevenue = useMemo(() => {
    return completedSales.reduce((sum, s) => sum + s.grandTotal, 0);
  }, [completedSales]);

  const monthCOGS = useMemo(() => {
    return completedSales.reduce((sum, s) => sum + s.totalCost, 0);
  }, [completedSales]);

  const grossProfit = monthRevenue - monthCOGS;

  const monthExpenses = useMemo(() => {
    return finances
      .filter(f => f.type === 'EXPENSE' && f.date.startsWith(currentMonthPrefix))
      .reduce((sum, f) => sum + f.amount, 0);
  }, [finances, currentMonthPrefix]);

  const netProfit = grossProfit - monthExpenses;

  const ownerCapitalTotal = useMemo(() => {
    return finances
      .filter(f => f.type === 'CAPITAL_INJECTION')
      .reduce((sum, f) => sum + f.amount, 0);
  }, [finances]);

  const filteredFinances = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return finances.filter(f =>
      !q ||
      f.title.toLowerCase().includes(q) ||
      f.type.toLowerCase().includes(q) ||
      f.recordedBy.toLowerCase().includes(q) ||
      f.referenceId?.toLowerCase().includes(q)
    );
  }, [finances, searchQuery]);

  const getTransactionTypeBadge = (type: FinancialRecord['type']) => {
    switch (type) {
      case 'EXPENSE':
        return { label: 'ລາຍຈ່າຍ', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' };
      case 'CAPITAL_INJECTION':
        return { label: 'ເງິນທຶນເຈົ້າຂອງ (ບໍ່ນັບເປັນຍອດຂາຍ)', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' };
      case 'CUSTOMER_DEBT_PAYMENT':
        return { label: 'ຮັບຊຳລະໜີ້ລູກໜີ້ (ຕັດໜີ້)', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' };
      case 'SUPPLIER_PAYMENT':
        return { label: 'ຈ່າຍຊຳລະໜີ້ເຈົ້າໜີ້', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' };
      case 'OWNER_DRAW':
        return { label: 'ຖອນເງິນກຳໄລເຈົ້າຂອງ', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' };
      default:
        return { label: type, color: 'bg-slate-100 text-slate-700' };
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-blue-600" />
            ລະບົບລາຍຮັບ-ລາຍຈ່າຍ & ບໍລິຫານຜຽນ (Finance & Cash Register)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ແຍກລາຍຮັບຈາກການຂາຍອອກຈາກເງິນທຶນເຈົ້າຂອງ, ບັນທຶກລາຍຈ່າຍ ແລະ ຈັດການເງິນສົດໃນລິ້ນຊັກ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsShiftModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Clock className="w-4 h-4 text-blue-600" />
            {activeShift ? 'ຈັດການຜຽນປັດຈຸບັນ' : 'ເປີດຜຽນຂາຍໃໝ່'}
          </button>

          {canViewFinancials && (
            <button
              onClick={() => setIsExpenseOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              ບັນທຶກລາຍຈ່າຍ / ເຕີມທຶນ
            </button>
          )}
        </div>
      </div>

      {/* Financial Statement Overview */}
      {canViewFinancials && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-bold text-slate-500">1. ຍອດຂາຍສຸດທິເດືອນນີ້</span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
              {formatCurrency(monthRevenue, settings.currency)}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 block">ບໍ່ລວມເງິນທຶນເຈົ້າຂອງ</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-bold text-slate-500">2. ກຳໄລຂັ້ນຕົ້ນ (GP)</span>
            <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">
              {formatCurrency(grossProfit, settings.currency)}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 block">
              ຫັກຕົ້ນທຶນສິນຄ້າ {formatCurrency(monthCOGS, settings.currency)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-bold text-slate-500">3. ລາຍຈ່າຍດຳເນີນງານ</span>
            <h3 className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
              {formatCurrency(monthExpenses, settings.currency)}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 block">ຄ່າເຊົ່າ, ເງິນເດືອນ, ນ້ຳໄຟ ແລະ ອື່ນໆ</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-bold text-slate-500">4. ກຳໄລສຸດທິ (Net Profit)</span>
            <h3 className={`text-xl font-black font-mono mt-1 ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(netProfit, settings.currency)}
            </h3>
            <span className="text-[10px] text-slate-400 mt-1 block">
              ອັດຕາກຳໄລສຸດທິ: {monthRevenue > 0 ? ((netProfit / monthRevenue) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('TRANSACTIONS')}
          className={`px-5 py-3 font-bold text-xs border-b-2 cursor-pointer transition-all ${
            activeTab === 'TRANSACTIONS'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          ປື້ມບັນຊີລາຍວັນການເງິນ ({finances.length})
        </button>
        <button
          onClick={() => setActiveTab('SHIFTS')}
          className={`px-5 py-3 font-bold text-xs border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
            activeTab === 'SHIFTS'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          ປະຫວັດຮອບຜຽນແຄຊເຊຍ ({shifts.length})
        </button>
      </div>

      {/* TAB 1: Financial Transactions */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="space-y-4">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ຄົ້ນຫາຊື່ລາຍການ, ຜູ້ບັນທຶກ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">ວັນທີ</th>
                    <th className="py-3 px-4">ປະເພດລາຍການ</th>
                    <th className="py-3 px-4">ຊື່ລາຍການ / ລາຍລະອຽດ</th>
                    <th className="py-3 px-4">ວິທີຊຳລະ</th>
                    <th className="py-3 px-4 text-right">ຈຳນວນເງິນ</th>
                    <th className="py-3 px-4">ຜູ້ບັນທຶກ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredFinances.map((f) => {
                    const badge = getTransactionTypeBadge(f.type);
                    const isExpense = f.type === 'EXPENSE' || f.type === 'SUPPLIER_PAYMENT' || f.type === 'OWNER_DRAW';

                    return (
                      <tr key={f.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{f.date}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                          <div>{f.title}</div>
                          {f.note && <div className="text-[10px] text-slate-400 mt-0.5">{f.note}</div>}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{f.paymentMethod}</td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-extrabold text-sm ${
                            isExpense ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isExpense ? `-${formatCurrency(f.amount, settings.currency)}` : `+${formatCurrency(f.amount, settings.currency)}`}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{f.recordedBy}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Shifts History */}
      {activeTab === 'SHIFTS' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">ພະນັກງານແຄຊເຊຍ</th>
                  <th className="py-3 px-4">ເວລາເປີດຜຽນ - ປິດຜຽນ</th>
                  <th className="py-3 px-4 text-right">ເງິນທອນເລີ່ມຕົ້ນ</th>
                  <th className="py-3 px-4 text-right">ຍອດຂາຍລວມ</th>
                  <th className="py-3 px-4 text-right">ເງິນສົດທີ່ຄວນມີ</th>
                  <th className="py-3 px-4 text-right">ນັບໄດ້ຕົວຈິງ</th>
                  <th className="py-3 px-4 text-right">ສ່ວນຕ່າງເງິນສົດ</th>
                  <th className="py-3 px-4 text-center">ສະຖານະ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {shifts.map((s) => {
                  const isOpen = s.status === 'OPEN';
                  const diff = s.cashDifference || 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">
                        {s.cashierName}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-500 whitespace-nowrap">
                        <div>ເລີ່ມ: {formatDateTime(s.startTime, 'lo')}</div>
                        {s.endTime && <div>ປິດ: {formatDateTime(s.endTime, 'lo')}</div>}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300">
                        {formatCurrency(s.openingCash, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(s.totalSales, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(s.expectedCash, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        {s.actualCash !== undefined ? formatCurrency(s.actualCash, settings.currency) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        {s.actualCash !== undefined ? (
                          <span className={diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-blue-600' : 'text-rose-600'}>
                            {diff > 0 ? `+${formatCurrency(diff, settings.currency)}` : formatCurrency(diff, settings.currency)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isOpen
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 animate-pulse'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {isOpen ? 'ຜຽນກຳລັງເປີດ' : 'ປິດຜຽນແລ້ວ'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      <ExpenseFormModal
        isOpen={isExpenseOpen}
        onSave={(rec) => {
          onAddFinanceRecord(rec);
          onShowToast('success', 'ບັນທຶກລາຍການສຳເລັດ', rec.title);
        }}
        onClose={() => setIsExpenseOpen(false)}
      />

      {/* Shift Modal */}
      <ShiftModal
        isOpen={isShiftModalOpen}
        activeShift={activeShift}
        settings={settings}
        currentUser={currentUser}
        onOpenShift={(cash) => {
          onOpenShift(cash);
          onShowToast('success', 'ເປີດຜຽນຂາຍສຳເລັດ', `ເງິນທອນເລີ່ມຕົ້ນ ${formatCurrency(cash, settings.currency)}`);
        }}
        onCloseShift={(actual, notes) => {
          onCloseShift(actual, notes);
          onShowToast('success', 'ປິດຜຽນຂາຍຮຽບຮ້ອຍ', `ເງິນສົດໃນລິ້ນຊັກ ${formatCurrency(actual, settings.currency)}`);
        }}
        onCloseModal={() => setIsShiftModalOpen(false)}
      />
    </div>
  );
};
