import React, { useMemo } from 'react';
import {
  Product, SaleTransaction, Customer, Supplier, FinancialRecord,
  StoreSettings, User
} from '../../types';
import { formatCurrency, formatNumber } from '../../services/formatters';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Package,
  AlertTriangle,
  Users,
  Building2,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  BarChart,
  CreditCard,
  Banknote,
  QrCode
} from 'lucide-react';

interface DashboardScreenProps {
  products: Product[];
  sales: SaleTransaction[];
  customers: Customer[];
  suppliers: Supplier[];
  finances: FinancialRecord[];
  settings: StoreSettings;
  currentUser: User;
  onNavigateToPOS: () => void;
  onNavigateToInventory: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  products,
  sales,
  customers,
  suppliers,
  finances,
  settings,
  currentUser,
  onNavigateToPOS,
  onNavigateToInventory,
}) => {
  const canViewFinancials = currentUser.role === 'OWNER' || currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';

  // Current Date filters
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.substring(0, 7);

  // Filter completed sales
  const completedSales = useMemo(() => {
    return sales.filter(s => s.status === 'COMPLETED');
  }, [sales]);

  // Today Sales
  const todaySalesList = useMemo(() => {
    return completedSales.filter(s => s.createdAt.startsWith(todayStr));
  }, [completedSales, todayStr]);

  const todayRevenue = useMemo(() => {
    return todaySalesList.reduce((sum, s) => sum + s.grandTotal, 0);
  }, [todaySalesList]);

  // Month Sales
  const monthSalesList = useMemo(() => {
    return completedSales.filter(s => s.createdAt.startsWith(currentMonthPrefix));
  }, [completedSales, currentMonthPrefix]);

  const monthRevenue = useMemo(() => {
    return monthSalesList.reduce((sum, s) => sum + s.grandTotal, 0);
  }, [monthSalesList]);

  // Cost of Goods Sold (COGS) for Month
  const monthCOGS = useMemo(() => {
    return monthSalesList.reduce((sum, s) => sum + s.totalCost, 0);
  }, [monthSalesList]);

  // Gross Profit = Revenue - COGS
  const grossProfit = monthRevenue - monthCOGS;

  // Operating Expenses for Month (Rent, Salaries, Utilities, etc.)
  const monthExpenses = useMemo(() => {
    return finances
      .filter(f => f.type === 'EXPENSE' && f.date.startsWith(currentMonthPrefix))
      .reduce((sum, f) => sum + f.amount, 0);
  }, [finances, currentMonthPrefix]);

  // Net Profit = Gross Profit - Operating Expenses
  const netProfit = grossProfit - monthExpenses;

  // Total Inventory Valuation (sum of currentStock * costPrice)
  const totalStockValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.currentStock * p.costPrice, 0);
  }, [products]);

  // Low Stock Items
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.status === 'ACTIVE' && p.currentStock <= p.minStockAlert);
  }, [products]);

  // Accounts Receivable (AR) - Total Customer Debt
  const totalAR = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.currentDebt || 0), 0);
  }, [customers]);

  // Accounts Payable (AP) - Total Supplier Debt
  const totalAP = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.currentPayable || 0), 0);
  }, [suppliers]);

  // Top 10 Best Sellers
  const topBestSellers = useMemo(() => {
    const map = new Map<string, { product: Product; qty: number; revenue: number; profit: number }>();

    for (const sale of completedSales) {
      for (const item of sale.items) {
        const prod = products.find(p => p.id === item.productId);
        if (!prod) continue;

        const existing = map.get(item.productId) || {
          product: prod,
          qty: 0,
          revenue: 0,
          profit: 0,
        };

        const itemCost = item.quantity * item.unitCost;
        existing.qty += item.quantity;
        existing.revenue += item.total;
        existing.profit += (item.total - itemCost);
        map.set(item.productId, existing);
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [completedSales, products]);

  // Payment method breakdown
  const paymentBreakdown = useMemo(() => {
    let cash = 0;
    let qr = 0;
    let transfer = 0;
    let credit = 0;

    for (const s of monthSalesList) {
      if (s.paymentMethod === 'CASH') cash += s.grandTotal;
      else if (s.paymentMethod === 'PROMPTPAY') qr += s.grandTotal;
      else if (s.paymentMethod === 'TRANSFER') transfer += s.grandTotal;
      else if (s.paymentMethod === 'CREDIT') credit += s.grandTotal;
    }

    const total = cash + qr + transfer + credit || 1;
    return [
      { label: 'ເງິນສົດ (Cash)', amount: cash, pct: (cash / total) * 100, icon: Banknote, color: 'bg-emerald-500' },
      { label: 'BCEL One / QR Scan', amount: qr, pct: (qr / total) * 100, icon: QrCode, color: 'bg-blue-500' },
      { label: 'ໂອນຜ່ານທະນາຄານ', amount: transfer, pct: (transfer / total) * 100, icon: Building2, color: 'bg-indigo-500' },
      { label: 'ຂາຍເຊື່ອ (ສິນເຊື່ອ/ຕິດໜີ້)', amount: credit, pct: (credit / total) * 100, icon: CreditCard, color: 'bg-amber-500' },
    ];
  }, [monthSalesList]);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-3xl p-6 shadow-xl">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
            Retail & Wholesale Overview
          </span>
          <h2 className="text-2xl font-black mt-1">ພາບລວມການຂາຍ ແລະ ສະຖານະການເງິນ</h2>
          <p className="text-xs text-slate-400 mt-1">
            ຂໍ້ມູນອັບເດດແບບເວລາຈິງ • ປະຈຳວັນທີ {todayStr}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToPOS}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            ເປີດຈຸດຂາຍ POS
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Today Sales */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">ຍອດຂາຍມື້ນີ້</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {formatCurrency(todayRevenue, settings.currency)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{todaySalesList.length} ລາຍການຂາຍ</p>
          </div>
        </div>

        {/* Monthly Sales */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">ຍອດຂາຍເດືອນນີ້</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {formatCurrency(monthRevenue, settings.currency)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{monthSalesList.length} ອໍເດີ</p>
          </div>
        </div>

        {/* Gross Profit (GP) */}
        {canViewFinancials ? (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold">ກຳໄລຂັ້ນຕົ້ນ (GP)</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {formatCurrency(grossProfit, settings.currency)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ອັດຕາກຳໄລ: {monthRevenue > 0 ? ((grossProfit / monthRevenue) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col justify-center items-center text-center">
            <span className="text-xs text-slate-400 font-semibold">ກຳໄລຂັ້ນຕົ້ນ</span>
            <span className="text-[11px] text-slate-400 mt-1">ສະຫງວນສິດສະເພາະຜູ້ຈັດການ</span>
          </div>
        )}

        {/* Net Profit */}
        {canViewFinancials ? (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold">ກຳໄລສຸດທິ (Net)</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {netProfit >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              </div>
            </div>
            <div className="mt-3">
              <h3 className={`text-xl font-black font-mono ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatCurrency(netProfit, settings.currency)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">ຫັກລາຍຈ່າຍທັງໝົດແລ້ວ</p>
            </div>
          </div>
        ) : null}

        {/* Accounts Receivable (AR ລູກໜີ້) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">ລູກໜີ້ຄ້າງຊຳລະ (AR)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {formatCurrency(totalAR, settings.currency)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {customers.filter(c => c.currentDebt > 0).length} ລາຍຄ້າງຊຳລະ
            </p>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div
          onClick={onNavigateToInventory}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-rose-400 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">ສິນຄ້າໃກ້ໝົດ</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${lowStockProducts.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-xl font-black font-mono ${lowStockProducts.length > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {lowStockProducts.length} ລາຍການ
            </h3>
            <p className="text-[11px] text-rose-500 mt-0.5 font-semibold">ຄລິກເພື່ອສັ່ງຊື້ / ຕື່ມສະຕັອກ</p>
          </div>
        </div>
      </div>

      {/* Financial Health & Valuation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Breakdown (Sales - COGS - Expenses = Net Profit) */}
        {canViewFinancials && (
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart className="w-4 h-4 text-blue-600" />
                ໂຄງສ້າງລາຍຮັບ & ກຳໄລສຸດທິເດືອນນີ້
              </h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-sans">
                <span className="text-slate-600 dark:text-slate-300">1. ຍອດຂາຍສຸດທິ (Revenue):</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {formatCurrency(monthRevenue, settings.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 font-sans text-rose-700 dark:text-rose-300">
                <span>2. ຕົ້ນທຶນສິນຄ້າຂາຍ (COGS):</span>
                <span className="font-bold font-mono">
                  -{formatCurrency(monthCOGS, settings.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 font-sans text-indigo-700 dark:text-indigo-300">
                <span>= ກຳໄລຂັ້ນຕົ້ນ (Gross Profit):</span>
                <span className="font-bold font-mono">
                  {formatCurrency(grossProfit, settings.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 font-sans text-amber-700 dark:text-amber-300">
                <span>3. ລາຍຈ່າຍດຳເນີນງານ (Expenses):</span>
                <span className="font-bold font-mono">
                  -{formatCurrency(monthExpenses, settings.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-500 text-white font-sans text-sm font-bold shadow-md shadow-emerald-500/20">
                <span>= ກຳໄລສຸດທິ (Net Profit):</span>
                <span className="font-mono text-base">
                  {formatCurrency(netProfit, settings.currency)}
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400">
              * ມູນຄ່າສະຕັອກສິນຄ້າຄົງເຫຼືອລວມປັດຈຸບັນ: <strong>{formatCurrency(totalStockValue, settings.currency)}</strong> (ປະເມີນຕາມຕົ້ນທຶນສະເລ່ຍ)
            </div>
          </div>
        )}

        {/* Payment Methods Distribution */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              ຊ່ອງທາງຮັບເງິນເດືອນນີ້
            </h3>
          </div>

          <div className="space-y-3">
            {paymentBreakdown.map((pm, i) => {
              const Icon = pm.icon;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      {pm.label}
                    </span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      {formatCurrency(pm.amount, settings.currency)} ({pm.pct.toFixed(0)}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pm.color}`}
                      style={{ width: `${Math.max(3, pm.pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">ຍອດເຈົ້າໜີ້ຄ້າງຈ່າຍ (AP):</span>
            <span className="font-bold text-rose-600 font-mono">{formatCurrency(totalAP, settings.currency)}</span>
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              ລາຍການສິນຄ້າຕ້ອງສັ່ງເພີ່ມດ່ວນ ({lowStockProducts.length})
            </h3>
          </div>

          <div className="space-y-2.5 max-h-[260px] overflow-y-auto">
            {lowStockProducts.map(p => (
              <div
                key={p.id}
                className="p-2.5 rounded-xl border border-rose-100 dark:border-rose-950 bg-rose-50/40 dark:bg-rose-950/20 flex items-center justify-between"
              >
                <div>
                  <h5 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{p.name}</h5>
                  <span className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-rose-600 font-mono block">
                    {p.currentStock} {p.baseUnit}
                  </span>
                  <span className="text-[10px] text-slate-400">ຂັ້ນຕ່ຳ: {p.minStockAlert}</span>
                </div>
              </div>
            ))}

            {lowStockProducts.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <p className="text-xs font-semibold">ສະຕັອກສິນຄ້າພຽງພໍທຸກລາຍການ</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top 10 Best Sellers Table */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              10 ອັນດັບສິນຄ້າຂາຍດີ (Top 10 Best Sellers)
            </h3>
            <p className="text-xs text-slate-400">ຈັດອັນດັບຕາມຍອດຂາຍລວມສະສົມໃນລະບົບ</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">ສິນຄ້າ</th>
                <th className="py-2.5 px-3">ໝວດໝູ່</th>
                <th className="py-2.5 px-3 text-right">ຈຳນວນທີ່ຂາຍ</th>
                <th className="py-2.5 px-3 text-right">ຍອດຂາຍລວມ</th>
                {canViewFinancials && <th className="py-2.5 px-3 text-right">ກຳໄລທີ່ໄດ້</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {topBestSellers.map((item, index) => (
                <tr key={item.product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-400">{index + 1}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.product.imageUrl}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">{item.product.name}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{item.product.sku}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-500">{item.product.category}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white font-mono">
                    {formatNumber(item.qty)} {item.product.baseUnit}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {formatCurrency(item.revenue, settings.currency)}
                  </td>
                  {canViewFinancials && (
                    <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      +{formatCurrency(item.profit, settings.currency)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
