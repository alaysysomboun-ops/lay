import React, { useState } from 'react';
import { Customer, StoreSettings, PaymentMethod } from '../../types';
import { formatCurrency } from '../../services/formatters';
import { X, Check, Banknote, QrCode, Building, Wallet, AlertCircle } from 'lucide-react';

interface DebtCollectionModalProps {
  isOpen: boolean;
  customer: Customer | null;
  settings: StoreSettings;
  onConfirmCollection: (customerId: string, amount: number, method: PaymentMethod, note?: string) => void;
  onClose: () => void;
}

export const DebtCollectionModal: React.FC<DebtCollectionModalProps> = ({
  isOpen,
  customer,
  settings,
  onConfirmCollection,
  onClose,
}) => {
  if (!isOpen || !customer) return null;

  const [amount, setAmount] = useState<number>(customer.currentDebt);
  const [method, setMethod] = useState<PaymentMethod>('TRANSFER');
  const [note, setNote] = useState<string>('รับชำระหนี้ค้างตามใบแจ้งหนี้');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert('กรุณากรอกจำนวนเงินที่ถูกต้อง');
      return;
    }
    if (amount > customer.currentDebt) {
      alert('จำนวนเงินชำระมากกว่ายอดหนี้ค้างชำระ');
      return;
    }

    onConfirmCollection(customer.id, Number(amount), method, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            รับชำระหนี้จากลูกค้า (Debt Collection)
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-400">ลูกค้า:</span>
              <span className="font-bold text-slate-900 dark:text-white">{customer.name}</span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-slate-600 dark:text-slate-400">ยอดหนี้ค้างชำระทั้งหมด:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-sm">
                {formatCurrency(customer.currentDebt, settings.currency)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              จำนวนเงินที่รับชำระ (บาท) *
            </label>
            <input
              type="number"
              step="any"
              min="1"
              max={customer.currentDebt}
              required
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full text-lg font-mono font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <div className="flex gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setAmount(customer.currentDebt)}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                ชำระเต็มจำนวน ({customer.currentDebt.toLocaleString()}฿)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ช่องทางการรับเงิน *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'TRANSFER', label: 'โอนเงิน', icon: Building },
                { id: 'CASH', label: 'เงินสด', icon: Banknote },
                { id: 'PROMPTPAY', label: 'พร้อมเพย์ QR', icon: QrCode },
              ].map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMethod(opt.id as any)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center text-xs font-bold transition-all cursor-pointer ${
                      method === opt.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              หมายเหตุ / เลขที่ใบเสร็จรับเงิน
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              ระบบจะบันทึกเป็น <strong>การรับชำระหนี้ (Debt Collection)</strong> ซึ่งเป็นการรับกระแสเงินสดเข้ามาในกิจการ โดยไม่นับเป็นยอดขายซ้ำ
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              ยืนยันรับชำระ {amount.toLocaleString()} บาท
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
