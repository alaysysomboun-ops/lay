import React, { useState, useMemo } from 'react';
import {
  SaleTransaction, Product, Customer, Supplier, FinancialRecord,
  StoreSettings, User
} from '../../types';
import { formatCurrency, formatNumber, formatDateTime } from '../../services/formatters';
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  Package,
  Layers,
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react';

interface ReportsScreenProps {
  sales: SaleTransaction[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  finances: FinancialRecord[];
  settings: StoreSettings;
  currentUser: User;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  sales,
  products,
  customers,
  suppliers,
  finances,
  settings,
  currentUser,
  onShowToast,
}) => {
  const [period, setPeriod] = useState<'ALL' | 'TODAY' | 'MONTH' | 'YEAR'>('MONTH');
  const [reportType, setReportType] = useState<'SALES_PROFIT' | 'PRODUCTS' | 'CATEGORIES' | 'AR_AP' | 'CASHFLOW'>('SALES_PROFIT');

  const todayStr = new Date().toISOString().split('T')[0];
  const monthStr = todayStr.substring(0, 7);
  const yearStr = todayStr.substring(0, 4);

  // Filter sales by date
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (s.status !== 'COMPLETED') return false;
      if (period === 'TODAY') return s.createdAt.startsWith(todayStr);
      if (period === 'MONTH') return s.createdAt.startsWith(monthStr);
      if (period === 'YEAR') return s.createdAt.startsWith(yearStr);
      return true;
    });
  }, [sales, period, todayStr, monthStr, yearStr]);

  // Aggregate numbers
  const totalRevenue = useMemo(() => filteredSales.reduce((sum, s) => sum + s.grandTotal, 0), [filteredSales]);
  const totalCOGS = useMemo(() => filteredSales.reduce((sum, s) => sum + s.totalCost, 0), [filteredSales]);
  const grossProfit = totalRevenue - totalCOGS;

  const filteredExpenses = useMemo(() => {
    return finances.filter((f) => {
      if (f.type !== 'EXPENSE') return false;
      if (period === 'TODAY') return f.date === todayStr;
      if (period === 'MONTH') return f.date.startsWith(monthStr);
      if (period === 'YEAR') return f.date.startsWith(yearStr);
      return true;
    }).reduce((sum, f) => sum + f.amount, 0);
  }, [finances, period, todayStr, monthStr, yearStr]);

  const netProfit = grossProfit - filteredExpenses;

  // Breakdown by Product
  const productReport = useMemo(() => {
    const map = new Map<string, { product: Product; qty: number; revenue: number; cost: number; profit: number }>();
    for (const sale of filteredSales) {
      for (const item of sale.items) {
        const prod = products.find(p => p.id === item.productId);
        if (!prod) continue;

        const cur = map.get(item.productId) || {
          product: prod,
          qty: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
        };

        const itemCost = item.quantity * item.unitCost;
        cur.qty += item.quantity;
        cur.revenue += item.total;
        cur.cost += itemCost;
        cur.profit += (item.total - itemCost);
        map.set(item.productId, cur);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales, products]);

  // Breakdown by Category
  const categoryReport = useMemo(() => {
    const map = new Map<string, { category: string; count: number; revenue: number; profit: number }>();
    for (const item of productReport) {
      const cat = item.product.category;
      const cur = map.get(cat) || { category: cat, count: 0, revenue: 0, profit: 0 };
      cur.count += item.qty;
      cur.revenue += item.revenue;
      cur.profit += item.profit;
      map.set(cat, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [productReport]);

  const handleExportReportCsv = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportType === 'SALES_PROFIT' || reportType === 'PRODUCTS') {
      headers = ['SKU', 'ProductName', 'Category', 'QuantitySold', 'TotalRevenue', 'TotalCost', 'GrossProfit'];
      rows = productReport.map(r => [
        `"${r.product.sku}"`,
        `"${r.product.name.replace(/"/g, '""')}"`,
        `"${r.product.category}"`,
        r.qty.toString(),
        r.revenue.toFixed(2),
        r.cost.toFixed(2),
        r.profit.toFixed(2),
      ]);
    } else if (reportType === 'CATEGORIES') {
      headers = ['Category', 'QuantitySold', 'TotalRevenue', 'GrossProfit'];
      rows = categoryReport.map(r => [
        `"${r.category}"`,
        r.count.toString(),
        r.revenue.toFixed(2),
        r.profit.toFixed(2),
      ]);
    } else {
      headers = ['Type', 'Name', 'Phone', 'Balance'];
      rows = [
        ...customers.filter(c => c.currentDebt > 0).map(c => ['ลูกหนี้ (AR)', c.name, c.phone, c.currentDebt.toFixed(2)]),
        ...suppliers.filter(s => s.currentPayable > 0).map(s => ['เจ้าหนี้ (AP)', s.name, s.phone, s.currentPayable.toFixed(2)]),
      ];
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report_${reportType}_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('success', 'ส่งออกรายงานสำเร็จ', 'ไฟล์ CSV ดาวน์โหลดเรียบร้อย');
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            รายงานและสถิติวิเคราะห์ (Reports & Business Analytics)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            สรุปยอดขาย ต้นทุนขาย กำไรขั้นต้น กำไรสุทธิ และรายงานลูกหนี้-เจ้าหนี้
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            {[
              { id: 'TODAY', label: 'วันนี้' },
              { id: 'MONTH', label: 'เดือนนี้' },
              { id: 'YEAR', label: 'ปีนี้' },
              { id: 'ALL', label: 'ทั้งหมด' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === p.id
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportReportCsv}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            ส่งออก CSV
          </button>
        </div>
      </div>

      {/* Financial Health Summary Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500">ยอดขายรวม (Revenue)</span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {formatCurrency(totalRevenue, settings.currency)}
          </h3>
          <span className="text-[10px] text-slate-400 mt-1 block">{filteredSales.length} รายการขาย</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500">ต้นทุนขาย (COGS)</span>
          <h3 className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
            {formatCurrency(totalCOGS, settings.currency)}
          </h3>
          <span className="text-[10px] text-slate-400 mt-1 block">ต้นทุนสินค้าที่ตัดสต็อก</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500">กำไรขั้นต้น (Gross Profit)</span>
          <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">
            {formatCurrency(grossProfit, settings.currency)}
          </h3>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0}% GP Margin
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500">กำไรสุทธิ (Net Profit)</span>
          <h3 className={`text-xl font-black font-mono mt-1 ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(netProfit, settings.currency)}
          </h3>
          <span className="text-[10px] text-slate-400 mt-1 block">หักค่าใช้จ่าย {formatCurrency(filteredExpenses, settings.currency)}</span>
        </div>
      </div>

      {/* Report Types Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {[
          { id: 'SALES_PROFIT', label: 'ยอดขายและกำไรตามสินค้า', icon: Package },
          { id: 'CATEGORIES', label: 'ยอดขายตามหมวดหมู่', icon: Layers },
          { id: 'AR_AP', label: 'รายงานลูกหนี้ & เจ้าหนี้ (AR/AP)', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`px-5 py-3 font-bold text-xs border-b-2 cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                isSelected
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* REPORT CONTENT */}
      {reportType === 'SALES_PROFIT' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">สินค้า</th>
                  <th className="py-3 px-4">หมวดหมู่</th>
                  <th className="py-3 px-4 text-right">จำนวนขาย</th>
                  <th className="py-3 px-4 text-right">ยอดขายรวม</th>
                  <th className="py-3 px-4 text-right">ต้นทุนรวม</th>
                  <th className="py-3 px-4 text-right">กำไรขั้นต้น (GP)</th>
                  <th className="py-3 px-4 text-right">มาร์จิ้น (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {productReport.map((r) => {
                  const margin = r.revenue > 0 ? (r.profit / r.revenue) * 100 : 0;
                  return (
                    <tr key={r.product.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-sans">
                        <div className="font-bold text-slate-900 dark:text-white">{r.product.name}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{r.product.sku}</span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-400">{r.product.category}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {r.qty} {r.product.baseUnit}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(r.revenue, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {formatCurrency(r.cost, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(r.profit, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-700 dark:text-slate-300">
                        {margin.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}

                {productReport.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                      ไม่มียอดขายในช่วงเวลาที่เลือก
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'CATEGORIES' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">หมวดหมู่สินค้า</th>
                  <th className="py-3 px-4 text-right">จำนวนชิ้นที่ขาย</th>
                  <th className="py-3 px-4 text-right">ยอดขายรวม</th>
                  <th className="py-3 px-4 text-right">กำไรขั้นต้นรวม</th>
                  <th className="py-3 px-4 text-right">สัดส่วนยอดขาย (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {categoryReport.map((c, i) => {
                  const share = totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 0;
                  return (
                    <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">
                        {c.category}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-700 dark:text-slate-300">
                        {c.count} ชิ้น
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(c.revenue, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(c.profit, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-200">
                        {share.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'AR_AP' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* AR */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
              <span>รายงานลูกหนี้ค้างชำระ (Accounts Receivable)</span>
              <span className="text-amber-600 font-mono">
                {formatCurrency(customers.reduce((sum, c) => sum + (c.currentDebt || 0), 0), settings.currency)}
              </span>
            </h4>
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-400">
                  <tr>
                    <th className="p-2">ลูกค้า</th>
                    <th className="p-2">โทร</th>
                    <th className="p-2 text-right">วงเงิน</th>
                    <th className="p-2 text-right">หนี้ค้าง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customers.filter(c => c.currentDebt > 0).map(c => (
                    <tr key={c.id}>
                      <td className="p-2 font-bold">{c.name}</td>
                      <td className="p-2 text-slate-400">{c.phone}</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(c.creditLimit, settings.currency)}</td>
                      <td className="p-2 text-right font-mono font-bold text-amber-600">{formatCurrency(c.currentDebt, settings.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AP */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
              <span>รายงานเจ้าหนี้ค้างจ่าย (Accounts Payable)</span>
              <span className="text-rose-600 font-mono">
                {formatCurrency(suppliers.reduce((sum, s) => sum + (s.currentPayable || 0), 0), settings.currency)}
              </span>
            </h4>
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-400">
                  <tr>
                    <th className="p-2">ซัพพลายเออร์</th>
                    <th className="p-2">ผู้ติดต่อ</th>
                    <th className="p-2 text-right">เครดิต</th>
                    <th className="p-2 text-right">ยอดค้างจ่าย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {suppliers.filter(s => s.currentPayable > 0).map(s => (
                    <tr key={s.id}>
                      <td className="p-2 font-bold">{s.name}</td>
                      <td className="p-2 text-slate-400">{s.contactPerson}</td>
                      <td className="p-2 text-right font-mono">{s.creditDays} วัน</td>
                      <td className="p-2 text-right font-mono font-bold text-rose-600">{formatCurrency(s.currentPayable, settings.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
