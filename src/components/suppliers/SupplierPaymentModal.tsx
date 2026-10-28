import React, { useState } from 'react';
import { Supplier, StoreSettings, PaymentMethod } from '../../types';
import { formatCurrency } from '../../services/formatters';
import { X, Check, Building, Banknote, AlertCircle } from 'lucide-react';

interface SupplierPaymentModalProps {
  isOpen: boolean;
  supplier: Supplier | null;
  settings: StoreSettings;
  onConfirmPayment: (supplierId: string, amount: number, method: PaymentMethod, note?: string) => void;
  onClose: () => void;
}

export const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  isOpen,
  supplier,
  settings,
  onConfirmPayment,
  onClose,
}) => {
  if (!isOpen || !supplier) return null;

  const [amount, setAmount] = useState<number>(supplier.currentPayable);
  const [method, setMethod] = useState<PaymentMethod>('TRANSFER');
  const [note, setNote] = useState<string>('ຊຳລະໜີ້ຄ່າສິນຄ້າຜູ້ສະໜອງ');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert('ກະລຸນາປ້ອນຈຳນວນເງິນ');
      return;
    }
    if (amount > supplier.currentPayable) {
      alert('ຈຳນວນເງິນຫຼາຍກວ່າຍອດໜີ້ຄ້າງຊຳລະ');
      return;
    }

    onConfirmPayment(supplier.id, Number(amount), method, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-600" />
            ຊຳລະໜີ້ຜູ້ສະໜອງ (Pay Accounts Payable)
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-400">ຜູ້ສະໜອງ:</span>
              <span className="font-bold text-slate-900 dark:text-white">{supplier.name}</span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-slate-600 dark:text-slate-400">ຍອດເຈົ້າໜີ້ຄ້າງຈ່າຍ (AP):</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 font-mono text-sm">
                {formatCurrency(supplier.currentPayable, settings.currency)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ຈຳນວນເງິນທີ່ຊຳລະ (₭) *
            </label>
            <input
              type="number"
              step="any"
              min="1"
              max={supplier.currentPayable}
              required
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full text-lg font-mono font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setAmount(supplier.currentPayable)}
              className="text-xs text-blue-600 hover:underline font-semibold mt-1"
            >
              ຈ່າຍເຕັມຈຳນວນ ({formatCurrency(supplier.currentPayable, settings.currency)})
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ວິທີຊຳລະເງິນ *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'TRANSFER', label: 'ໂອນຜ່ານທະນາຄານ' },
                { id: 'CASH', label: 'ເງິນສົດ' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMethod(opt.id as any)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    method === opt.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ໝາຍເຫດ / ເລກທີໃບໂອນ
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              ຢືນຢັນຈ່າຍຊຳລະ {formatCurrency(amount, settings.currency)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
