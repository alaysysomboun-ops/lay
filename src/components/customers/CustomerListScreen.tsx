import React, { useState, useMemo } from 'react';
import { Customer, StoreSettings, User, PaymentMethod } from '../../types';
import { formatCurrency, formatNumber } from '../../services/formatters';
import { CustomerFormModal } from './CustomerFormModal';
import { DebtCollectionModal } from './DebtCollectionModal';
import {
  Users,
  UserPlus,
  Search,
  Wallet,
  Phone,
  Building,
  Edit,
  ArrowUpRight,
  CreditCard,
  AlertTriangle
} from 'lucide-react';

interface CustomerListScreenProps {
  customers: Customer[];
  settings: StoreSettings;
  currentUser: User;
  onSaveCustomer: (customer: Customer) => void;
  onCollectDebt: (customerId: string, amount: number, method: PaymentMethod, note?: string) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const CustomerListScreen: React.FC<CustomerListScreenProps> = ({
  customers,
  settings,
  currentUser,
  onSaveCustomer,
  onCollectDebt,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [debtCollectingCustomer, setDebtCollectingCustomer] = useState<Customer | null>(null);

  // Total Accounts Receivable (AR)
  const totalAR = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.currentDebt || 0), 0);
  }, [customers]);

  const debtorCount = useMemo(() => {
    return customers.filter(c => c.currentDebt > 0).length;
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.companyName?.toLowerCase().includes(q);

      const matchesType = selectedType === 'ALL' || c.customerType === selectedType;
      return matchesSearch && matchesType;
    });
  }, [customers, searchQuery, selectedType]);

  const getCustomerTypeBadge = (type: Customer['customerType']) => {
    switch (type) {
      case 'WHOLESALE_A':
        return { label: 'ຂາຍສົ່ງ ເກຣດ A', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' };
      case 'WHOLESALE_B':
        return { label: 'ຂາຍສົ່ງ ເກຣດ B', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' };
      case 'VIP':
        return { label: 'ລູກຄ້າ VIP', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };
      default:
        return { label: 'ລູກຄ້າທົ່ວໄປ', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            ລະບົບບໍລິຫານລູກຄ້າ ແລະ ບັນຊີລູກໜີ້ (Customer & Accounts Receivable)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ຈັດການຂໍ້ມູນລູກຄ້າຂາຍສົ່ງ, ວົງເງິນສິນເຊື່ອ ແລະ ລະບົບຮັບຊຳລະໜີ້ຄ້າງ
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setIsFormOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
        >
          <UserPlus className="w-4 h-4" />
          ເພີ່ມລູກຄ້າໃໝ່
        </button>
      </div>

      {/* AR Overview Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500 to-amber-700 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-amber-100 uppercase tracking-wider">
            Accounts Receivable Summary
          </span>
          <h3 className="text-2xl font-black mt-0.5 font-mono">
            ຍອດລູກໜີ້ຄ້າງຊຳລະລວມ: {formatCurrency(totalAR, settings.currency)}
          </h3>
          <p className="text-xs text-amber-100 mt-1">
            ມີລູກໜີ້ຄ້າງຊຳລະທັງໝົດ {debtorCount} ລາຍການ ຈາກລູກຄ້າ {customers.length} ລາຍ
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່, ລະຫັດລູກຄ້າ, ເບີໂທ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">ທຸກປະເພດລູກຄ້າ</option>
            <option value="WHOLESALE_A">ຂາຍສົ່ງ ເກຣດ A</option>
            <option value="WHOLESALE_B">ຂາຍສົ່ງ ເກຣດ B</option>
            <option value="VIP">ລູກຄ້າ VIP</option>
            <option value="RETAIL">ລູກຄ້າທົ່ວໄປ</option>
          </select>
        </div>
      </div>

      {/* Customer Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">ລະຫັດ & ຊື່ລູກຄ້າ</th>
                <th className="py-3 px-4">ປະເພດລູກຄ້າ</th>
                <th className="py-3 px-4">ເບີໂທ & ທີ່ຢູ່</th>
                <th className="py-3 px-4 text-right">ວົງເງິນສິນເຊື່ອ</th>
                <th className="py-3 px-4 text-right">ໜີ້ຄ້າງຊຳລະ (AR)</th>
                <th className="py-3 px-4 text-right">ຍອດຊື້ສະສົມ</th>
                <th className="py-3 px-4 text-center">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.map((c) => {
                const badge = getCustomerTypeBadge(c.customerType);
                const hasDebt = c.currentDebt > 0;

                return (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                          <span>{c.code}</span>
                          {c.companyName && <span>• {c.companyName}</span>}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.color}`}>
                        {badge.label}
                      </span>
                      {c.priceTierDiscountPercent ? (
                        <span className="block text-[10px] text-emerald-600 mt-0.5">
                          ສ່ວນຫຼຸດພິເສດ {c.priceTierDiscountPercent}%
                        </span>
                      ) : null}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {c.phone}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{c.address}</div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      {c.creditLimit > 0 ? (
                        <div>
                          <span className="font-bold">{formatCurrency(c.creditLimit, settings.currency)}</span>
                          <span className="block text-[10px] text-slate-400">{c.creditDays} ວັນ</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      {hasDebt ? (
                        <span className="font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg">
                          {formatCurrency(c.currentDebt, settings.currency)}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(c.totalPurchased || 0, settings.currency)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {hasDebt && (
                          <button
                            onClick={() => setDebtCollectingCustomer(c)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            title="ຮັບຊຳລະໜີ້"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            ຮັບຊຳລະໜີ້
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingCustomer(c);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        customer={editingCustomer}
        onSave={(c) => {
          onSaveCustomer(c);
          onShowToast('success', 'ບັນທຶກຂໍ້ມູນລູກຄ້າຮຽບຮ້ອຍ');
        }}
        onClose={() => setIsFormOpen(false)}
      />

      {/* Debt Collection Modal */}
      <DebtCollectionModal
        isOpen={!!debtCollectingCustomer}
        customer={debtCollectingCustomer}
        settings={settings}
        onConfirmCollection={(cid, amt, method, note) => {
          onCollectDebt(cid, amt, method, note);
          setDebtCollectingCustomer(null);
          onShowToast('success', 'ຮັບຊຳລະໜີ້ຮຽບຮ້ອຍ', `ຕັດໜີ້ຄ້າງ ${formatCurrency(amt, settings.currency)}`);
        }}
        onClose={() => setDebtCollectingCustomer(null)}
      />
    </div>
  );
};
