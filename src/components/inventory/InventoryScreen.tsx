import React, { useState, useMemo } from 'react';
import {
  Product, StockMovement, Warehouse, StoreSettings, User
} from '../../types';
import { formatCurrency, formatDateTime, formatNumber } from '../../services/formatters';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Plus,
  AlertTriangle,
  History,
  Search,
  Filter,
  DollarSign,
  TrendingDown
} from 'lucide-react';

interface InventoryScreenProps {
  products: Product[];
  movements: StockMovement[];
  warehouses: Warehouse[];
  settings: StoreSettings;
  currentUser: User;
  onAdjustStock: (productId: string, qty: number, type: 'ADJUST_COUNT' | 'ADJUST_DAMAGE' | 'PURCHASE_RECEIPT', reason: string) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  products,
  movements,
  warehouses,
  settings,
  currentUser,
  onAdjustStock,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'HISTORY'>('ITEMS');
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const canManageInventory = currentUser.role !== 'CASHIER';
  const canViewCost = currentUser.role !== 'CASHIER';

  // Overall Inventory Value
  const totalStockValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.currentStock * p.costPrice, 0);
  }, [products]);

  const totalItemCount = useMemo(() => {
    return products.reduce((sum, p) => sum + p.currentStock, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => p.currentStock <= p.minStockAlert).length;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter(p =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const filteredMovements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return movements.filter(m =>
      !q ||
      m.productName.toLowerCase().includes(q) ||
      m.sku.toLowerCase().includes(q) ||
      m.referenceId?.toLowerCase().includes(q) ||
      m.userName.toLowerCase().includes(q)
    );
  }, [movements, searchQuery]);

  const getMovementBadge = (type: StockMovement['type']) => {
    switch (type) {
      case 'SALE':
        return { label: 'ขายสินค้า (POS)', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' };
      case 'SALE_CANCEL':
        return { label: 'ยกเลิกการขาย (คืนสต็อก)', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
      case 'PURCHASE_RECEIPT':
        return { label: 'รับสินค้าเข้า', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
      case 'ADJUST_DAMAGE':
        return { label: 'ชำรุด / สูญหาย', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400' };
      case 'ADJUST_COUNT':
        return { label: 'ปรับปรุงจากการตรวจนับ', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' };
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
            <Boxes className="w-6 h-6 text-blue-600" />
            ระบบคลังสินค้าและสต็อก (Inventory & Stock Ledger)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ตรวจนับสินค้า รับเข้า จ่ายออก และตรวจสอบประวัติการเคลื่อนไหวสต็อกอย่างเป็นระบบ
          </p>
        </div>

        {canManageInventory && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdjustOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              รับเข้า / ปรับปรุงสต็อก
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold">จำนวนสินค้าคงเหลือรวม</span>
            <h4 className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {formatNumber(totalItemCount)} <span className="text-xs font-normal text-slate-400">หน่วย</span>
            </h4>
          </div>
        </div>

        {canViewCost && (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold">มูลค่าสต็อกคงเหลือ (ตามต้นทุน)</span>
              <h4 className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {formatCurrency(totalStockValue, settings.currency)}
              </h4>
            </div>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60' : 'bg-slate-100 text-slate-500'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold">สินค้าที่ถึงจุดสั่งซื้อขั้นต่ำ</span>
            <h4 className={`text-xl font-black font-mono mt-0.5 ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
              {lowStockCount} <span className="text-xs font-normal text-slate-400">รายการ</span>
            </h4>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('ITEMS')}
          className={`px-5 py-3 font-bold text-xs border-b-2 cursor-pointer transition-all ${
            activeTab === 'ITEMS'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          รายการสต็อกรายสินค้า (Stock on Hand)
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-5 py-3 font-bold text-xs border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
            activeTab === 'HISTORY'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          ประวัติการเคลื่อนไหวสต็อก (Movement Ledger)
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="ค้นหาชื่อสินค้า, SKU, หรือเลขอ้างอิง..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* TAB 1: Stock on Hand */}
      {activeTab === 'ITEMS' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">สินค้า</th>
                  <th className="py-3 px-4">หมวดหมู่</th>
                  {canViewCost && <th className="py-3 px-4 text-right">ต้นทุน/หน่วย</th>}
                  <th className="py-3 px-4 text-right">สต็อกคงเหลือ</th>
                  <th className="py-3 px-4 text-right">จุดเตือนขั้นต่ำ</th>
                  {canViewCost && <th className="py-3 px-4 text-right">มูลค่ารวมในคลัง</th>}
                  <th className="py-3 px-4 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.map((p) => {
                  const isLow = p.currentStock <= p.minStockAlert && p.currentStock > 0;
                  const isOut = p.currentStock <= 0;
                  const itemValue = p.currentStock * p.costPrice;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img src={p.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                            <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{p.category}</td>
                      {canViewCost && (
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          {formatCurrency(p.costPrice, settings.currency)}
                        </td>
                      )}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {p.currentStock} {p.baseUnit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {p.minStockAlert} {p.baseUnit}
                      </td>
                      {canViewCost && (
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(itemValue, settings.currency)}
                        </td>
                      )}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isOut
                              ? 'bg-rose-100 text-rose-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isOut ? 'หมดสต็อก' : isLow ? 'ใกล้หมด' : 'พร้อมขาย'}
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

      {/* TAB 2: Movements Ledger */}
      {activeTab === 'HISTORY' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">วัน-เวลา</th>
                  <th className="py-3 px-4">สินค้า</th>
                  <th className="py-3 px-4">ประเภทรายการ</th>
                  <th className="py-3 px-4 text-right">จำนวนเปลี่ยนแปลง</th>
                  <th className="py-3 px-4 text-right">ก่อน -&gt; หลัง</th>
                  <th className="py-3 px-4">เลขอ้างอิง / เหตุผล</th>
                  <th className="py-3 px-4">ผู้ทำรายการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMovements.map((m) => {
                  const badge = getMovementBadge(m.type);
                  const isPositive = m.quantityChange > 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDateTime(m.createdAt, 'th')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {m.productName}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-extrabold ${
                          isPositive ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {m.quantityBefore} -&gt; {m.quantityAfter}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        <div className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                          {m.referenceId || '-'}
                        </div>
                        {m.reason && <div className="text-[10px] text-slate-500">{m.reason}</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                        {m.userName}
                      </td>
                    </tr>
                  );
                })}

                {filteredMovements.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-xs">ยังไม่มีประวัติการเคลื่อนไหวสต็อก</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustOpen}
        products={products}
        onAdjust={(pid, qty, type, reason) => {
          onAdjustStock(pid, qty, type, reason);
          onShowToast('success', 'บันทึกการปรับสต็อกเรียบร้อย', reason);
        }}
        onClose={() => setIsAdjustOpen(false)}
      />
    </div>
  );
};
