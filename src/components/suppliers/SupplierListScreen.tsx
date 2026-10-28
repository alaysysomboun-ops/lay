import React, { useState, useMemo } from 'react';
import { Supplier, PurchaseOrder, Product, StoreSettings, User, PaymentMethod } from '../../types';
import { formatCurrency, formatDateTime } from '../../services/formatters';
import { PurchaseOrderModal } from './PurchaseOrderModal';
import { SupplierPaymentModal } from './SupplierPaymentModal';
import {
  Truck,
  Plus,
  Search,
  Building,
  Phone,
  Wallet,
  CheckCircle,
  FileText,
  PackageCheck
} from 'lucide-react';

interface SupplierListScreenProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  settings: StoreSettings;
  currentUser: User;
  onSavePO: (po: PurchaseOrder) => void;
  onReceivePO: (poId: string) => void;
  onPaySupplier: (supplierId: string, amount: number, method: PaymentMethod, note?: string) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const SupplierListScreen: React.FC<SupplierListScreenProps> = ({
  suppliers,
  purchaseOrders,
  products,
  settings,
  currentUser,
  onSavePO,
  onReceivePO,
  onPaySupplier,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'SUPPLIERS' | 'ORDERS'>('SUPPLIERS');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);

  // Accounts Payable (AP) Total
  const totalAP = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.currentPayable || 0), 0);
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return suppliers.filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.phone.includes(q)
    );
  }, [suppliers, searchQuery]);

  const filteredPOs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return purchaseOrders.filter(
      (po) =>
        !q ||
        po.poNumber.toLowerCase().includes(q) ||
        po.supplierName.toLowerCase().includes(q)
    );
  }, [purchaseOrders, searchQuery]);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            ລະບົບຜູ້ສະໜອງ ແລະ ການຈັດຊື້ (Suppliers & Purchasing)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ຈັດການຄູ່ຄ້າ, ສັ່ງຊື້ສິນຄ້າ, ຮັບເຂົ້າສະຕັອກ ແລະ ຈັດການຍອດເຈົ້າໜີ້ຄ້າງຈ່າຍ (AP)
          </p>
        </div>

        <button
          onClick={() => setIsPOModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" />
          ສ້າງໃບສັ່ງຊື້ (New PO)
        </button>
      </div>

      {/* AP Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Accounts Payable Overview
          </span>
          <h3 className="text-2xl font-black mt-0.5 font-mono">
            ຍອດເຈົ້າໜີ້ຄ້າງຈ່າຍລວມ: {formatCurrency(totalAP, settings.currency)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            ມີເຈົ້າໜີ້ຄ້າງຈ່າຍ {suppliers.filter((s) => s.currentPayable > 0).length} ລາຍການ ຈາກຜູ້ສະໜອງ {suppliers.length} ລາຍ
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('SUPPLIERS')}
          className={`px-5 py-3 font-bold text-xs border-b-2 cursor-pointer transition-all ${
            activeTab === 'SUPPLIERS'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          ລາຍຊື່ຜູ້ສະໜອງ ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`px-5 py-3 font-bold text-xs border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
            activeTab === 'ORDERS'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          ລາຍການໃບສັ່ງຊື້ PO ({purchaseOrders.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="ຄົ້ນຫາຜູ້ສະໜອງ, ລະຫັດ, ຫຼື ເລກ PO..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* TAB 1: Suppliers */}
      {activeTab === 'SUPPLIERS' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">ລະຫັດ & ຊື່ຜູ້ສະໜອງ</th>
                  <th className="py-3 px-4">ຜູ້ຕິດຕໍ່ & ເບີໂທ</th>
                  <th className="py-3 px-4">ທີ່ຢູ່</th>
                  <th className="py-3 px-4 text-right">ກຳນົດສິນເຊື່ອ</th>
                  <th className="py-3 px-4 text-right">ຍອດຄ້າງຈ່າຍ (AP)</th>
                  <th className="py-3 px-4 text-center">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSuppliers.map((s) => {
                  const hasPayable = s.currentPayable > 0;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{s.code}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-700 dark:text-slate-300">{s.contactPerson}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{s.phone}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{s.address}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                        {s.creditDays} ວັນ
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {hasPayable ? (
                          <span className="font-extrabold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded-lg">
                            {formatCurrency(s.currentPayable, settings.currency)}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {hasPayable ? (
                          <button
                            onClick={() => setPayingSupplier(s)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 text-[11px] font-bold flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            ຊຳລະໜີ້
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Purchase Orders */}
      {activeTab === 'ORDERS' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">ເລກທີໃບສັ່ງຊື້ (PO)</th>
                  <th className="py-3 px-4">ວັນທີສັ່ງຊື້</th>
                  <th className="py-3 px-4">ຜູ້ສະໜອງ</th>
                  <th className="py-3 px-4 text-right">ຈຳນວນລາຍການ</th>
                  <th className="py-3 px-4 text-right">ຍອດລວມທັງໝົດ</th>
                  <th className="py-3 px-4 text-center">ສະຖານະ</th>
                  <th className="py-3 px-4 text-center">ການຮັບສິນຄ້າ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPOs.map((po) => {
                  const isReceived = po.status === 'RECEIVED';
                  return (
                    <tr key={po.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {po.poNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDateTime(po.createdAt, 'lo')}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {po.supplierName}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                        {po.items.length} ລາຍການ
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(po.grandTotal, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isReceived
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          {isReceived ? 'ຮັບເຂົ້າສາງແລ້ວ' : 'ລໍຖ້າຮັບສິນຄ້າ'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {!isReceived ? (
                          <button
                            onClick={() => {
                              onReceivePO(po.id);
                              onShowToast('success', 'ຮັບສິນຄ້າເຂົ້າສາງສຳເລັດ', `ປັບເພີ່ມສະຕັອກຕາມ ${po.poNumber} ຮຽບຮ້ອຍ`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            ຮັບເຂົ້າສາງ
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            ສຳເລັດແລ້ວ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredPOs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-xs">ຍັງບໍ່ມີໃບສັ່ງຊື້</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PO Modal */}
      <PurchaseOrderModal
        isOpen={isPOModalOpen}
        suppliers={suppliers}
        products={products}
        onSavePO={(po) => {
          onSavePO(po);
          onShowToast('success', 'ບັນທຶກໃບສັ່ງຊື້ຮຽບຮ້ອຍ', `ເລກທີ ${po.poNumber}`);
        }}
        onClose={() => setIsPOModalOpen(false)}
      />

      {/* Supplier Payment Modal */}
      <SupplierPaymentModal
        isOpen={!!payingSupplier}
        supplier={payingSupplier}
        settings={settings}
        onConfirmPayment={(sid, amt, method, note) => {
          onPaySupplier(sid, amt, method, note);
          setPayingSupplier(null);
          onShowToast('success', 'ບັນທຶກການຊຳລະເງິນໃຫ້ຜູ້ສະໜອງຮຽບຮ້ອຍ');
        }}
        onClose={() => setPayingSupplier(null)}
      />
    </div>
  );
};
