import React, { useState } from 'react';
import { Customer, PaymentMethod, PaymentDetails, StoreSettings, User, CartItem } from '../../types';
import { formatCurrency } from '../../services/formatters';
import {
  Banknote,
  QrCode,
  CreditCard,
  Building,
  Check,
  X,
  AlertTriangle,
  Lock,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  grandTotal: number;
  customer: Customer;
  cartItems: CartItem[];
  settings: StoreSettings;
  currentUser: User;
  onClose: () => void;
  onConfirmPayment: (paymentDetails: PaymentDetails) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  grandTotal,
  customer,
  cartItems,
  settings,
  currentUser,
  onClose,
  onConfirmPayment,
}) => {
  if (!isOpen) return null;

  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = useState<number>(grandTotal);
  const [refNumber, setRefNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [managerApprovalPin, setManagerApprovalPin] = useState<string>('');
  const [isManagerApproved, setIsManagerApproved] = useState<boolean>(false);

  // Check if any item sold below unit cost
  const belowCostItems = cartItems.filter(item => item.appliedUnitPrice < item.unitCost);
  const hasBelowCost = belowCostItems.length > 0;
  const isAuthorized = currentUser.role === 'OWNER' || currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN' || isManagerApproved;

  const change = Math.max(0, cashReceived - grandTotal);
  const isCashInsufficient = method === 'CASH' && cashReceived < grandTotal;

  // Credit limit checks
  const isCredit = method === 'CREDIT';
  const remainingCredit = customer.creditLimit - customer.currentDebt;
  const isCreditExceeded = isCredit && (customer.currentDebt + grandTotal > customer.creditLimit);

  // Quick cash buttons adapted for Kip (or active currency)
  const quickCashOptions = settings.currency === 'LAK' ? [
    { label: 'ພໍດີ', amount: grandTotal },
    { label: '50,000', amount: Math.ceil(grandTotal / 50000) * 50000 || 50000 },
    { label: '100,000', amount: Math.ceil(grandTotal / 100000) * 100000 || 100000 },
    { label: '500,000', amount: Math.ceil(grandTotal / 500000) * 500000 || 500000 },
    { label: '1,000,000', amount: Math.ceil(grandTotal / 1000000) * 1000000 || 1000000 },
  ] : [
    { label: 'ພໍດີ', amount: grandTotal },
    { label: '100', amount: Math.ceil(grandTotal / 100) * 100 || 100 },
    { label: '500', amount: Math.ceil(grandTotal / 500) * 500 || 500 },
    { label: '1,000', amount: Math.ceil(grandTotal / 1000) * 1000 || 1000 },
  ];

  const handleVerifyManagerPin = () => {
    if (managerApprovalPin === '1111' || managerApprovalPin === '2222') {
      setIsManagerApproved(true);
    } else {
      alert('PIN ຜູ້ຈັດການບໍ່ຖືກຕ້ອງ (ທົດສອບ: 1111 ຫຼື 2222)');
    }
  };

  const handleSubmit = () => {
    if (isSubmitting) return;

    if (hasBelowCost && !isAuthorized) {
      alert('ມີສິນຄ້າຂາຍຫຼຸດຕົ້ນທຶນ! ຕ້ອງໃຫ້ຜູ້ຈັດການອະນຸມັດກ່ອນ');
      return;
    }

    if (isCashInsufficient) {
      alert('ຈຳນວນເງິນສົດທີ່ຮັບມາຍັງບໍ່ພຽງພໍ');
      return;
    }

    if (isCredit && customer.id === 'cust-walkin') {
      alert('ລູກຄ້າທົ່ວໄປບໍ່ສາມາດຂາຍຕິດໜີ້ໄດ້ ກະລຸນາເລືອກລູກຄ້າຂາຍສົ່ງທີ່ມີວົງເງິນເຄຣດິດ');
      return;
    }

    if (isCreditExceeded && !isAuthorized) {
      alert(`ຍອດຂາຍເກີນວົງເງິນເຄຣດິດຄົງເຫຼືອ (${formatCurrency(remainingCredit, settings.currency)}) ຕ້ອງໃຫ້ຜູ້ຈັດການອະນຸມັດ`);
      return;
    }

    setIsSubmitting(true);

    const details: PaymentDetails = {
      method,
      amount: grandTotal,
      cashReceived: method === 'CASH' ? cashReceived : grandTotal,
      change: method === 'CASH' ? change : 0,
      referenceNumber: refNumber || undefined,
      dueDate: isCredit ? new Date(Date.now() + (customer.creditDays || 30) * 86400 * 1000).toISOString().split('T')[0] : undefined,
    };

    onConfirmPayment(details);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">ຊຳລະເງິນ (Checkout)</h3>
            <p className="text-xs text-slate-500">
              ລູກຄ້າ: <span className="font-semibold text-slate-700 dark:text-slate-300">{customer.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Total display banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-5 shadow-lg shadow-blue-500/20 text-center">
            <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">ຍອດຊຳລະສຸດທິ</p>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 font-mono">
              {formatCurrency(grandTotal, settings.currency)}
            </div>
          </div>

          {/* Warning: Below Cost Item */}
          {hasBelowCost && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300">
                    ແຈ້ງເຕືອນ: ມີສິນຄ້າຂາຍຫຼຸດຕົ້ນທຶນ!
                  </h4>
                  <ul className="text-[11px] text-rose-700 dark:text-rose-400 mt-1 space-y-0.5 list-disc list-inside">
                    {belowCostItems.map((it, i) => (
                      <li key={i}>
                        {it.product.name} - ລາຄາຂາຍ: {formatCurrency(it.appliedUnitPrice, settings.currency)} (ຕົ້ນທຶນ: {formatCurrency(it.unitCost, settings.currency)})
                      </li>
                    ))}
                  </ul>

                  {!isAuthorized ? (
                    <div className="mt-2.5 pt-2 border-t border-rose-200 dark:border-rose-900 flex items-center gap-2">
                      <input
                        type="password"
                        placeholder="PIN ຜູ້ຈັດການ (ທົດສອບ: 2222)"
                        value={managerApprovalPin}
                        onChange={(e) => setManagerApprovalPin(e.target.value)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-rose-300 bg-white dark:bg-slate-800 dark:border-rose-800 text-slate-900 dark:text-white w-52"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyManagerPin}
                        className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700"
                      >
                        ອະນຸມັດ
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> ອະນຸມັດການຂາຍຫຼຸດຕົ້ນທຶນແລ້ວ
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              ເລືອກຊ່ອງທາງການຊຳລະ:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'CASH' as PaymentMethod, label: 'ເງິນສົດ', icon: Banknote },
                { id: 'PROMPTPAY' as PaymentMethod, label: 'QR Payment', icon: QrCode },
                { id: 'TRANSFER' as PaymentMethod, label: 'ໂອນເງິນ', icon: Building },
                { id: 'CREDIT' as PaymentMethod, label: 'ຂາຍຕິດໜີ້', icon: CreditCard },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = method === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMethod(tab.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Details */}
          {method === 'CASH' && (
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                ຮັບເງິນສົດມາ (Cash Tendered):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={cashReceived || ''}
                  onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                  className="w-full text-2xl font-bold font-mono px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-2">
                {quickCashOptions.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCashReceived(opt.amount)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer font-mono"
                  >
                    {opt.label} {opt.label !== 'ພໍດີ' && opt.label.includes(',') ? '' : ''}
                  </button>
                ))}
              </div>

              {/* Change Indicator */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">ເງິນທອນ (Change):</span>
                <span
                  className={`text-xl font-extrabold font-mono ${
                    isCashInsufficient ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {isCashInsufficient ? 'ເງິນຍັງບໍ່ພໍ' : formatCurrency(change, settings.currency)}
                </span>
              </div>
            </div>
          )}

          {/* PromptPay / Lao QR Details */}
          {method === 'PROMPTPAY' && (
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex flex-col items-center text-center space-y-3">
              <div className="w-44 h-44 bg-white p-2 rounded-xl shadow-md border border-slate-200 flex flex-col items-center justify-center">
                <div className="w-full h-full border-2 border-dashed border-blue-400 rounded-lg flex flex-col items-center justify-center p-2 bg-slate-50">
                  <QrCode className="w-24 h-24 text-slate-800" />
                  <span className="text-[10px] font-bold text-blue-700 mt-1">LAO QR Payment</span>
                  <span className="text-[9px] font-mono text-slate-500 font-bold">
                    {formatCurrency(grandTotal, settings.currency)}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">ສະແກນຊຳລະຜ່ານ BCEL One ຫຼື ແອັບທະນາຄານໃດກໍ່ໄດ້</p>
                <p className="text-[11px] text-slate-500 mt-0.5">BCEL ID: 020-55512345 ({settings.storeName})</p>
              </div>
              <input
                type="text"
                placeholder="ເລກອ້າງອີງສະລິບ / Transaction Ref (ຖ້າມີ)"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Bank Transfer Details */}
          {method === 'TRANSFER' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                <p className="font-bold">ທະນາຄານການຄ້າຕ່າງປະເທດລາວ (BCEL)</p>
                <p>ເລກບັນຊີ: <span className="font-mono font-bold text-blue-600">010-12-00-01234567-001</span></p>
                <p>ຊື່ບັນຊີ: ບໍລິສັດ ສຸວັນນະພູມ ສະມາດເທຣດດິ້ງ</p>
              </div>
              <input
                type="text"
                placeholder="ເລກອ້າງອີງການໂອນ / Slip Reference *"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Credit Sale (Accounts Receivable) Details */}
          {method === 'CREDIT' && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-3">
              <div className="text-xs space-y-1.5 text-slate-800 dark:text-slate-200">
                <div className="flex justify-between">
                  <span>ວົງເງິນເຄຣດິດອະນຸມັດ:</span>
                  <span className="font-bold font-mono">{formatCurrency(customer.creditLimit, settings.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ໜີ້ຄ້າງຊຳລະປັດຈຸບັນ:</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400 font-mono">
                    {formatCurrency(customer.currentDebt, settings.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ວົງເງິນຄົງເຫຼືອ:</span>
                  <span className={`font-bold font-mono ${remainingCredit < grandTotal ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatCurrency(remainingCredit, settings.currency)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-amber-200 dark:border-amber-800 pt-1 text-slate-600 dark:text-slate-400">
                  <span>ກຳນົດຊຳລະໃນ (ວັນ):</span>
                  <span>{customer.creditDays || 30} ວັນ</span>
                </div>
              </div>

              {isCreditExceeded && (
                <div className="p-2.5 rounded-lg bg-rose-100 text-rose-800 text-[11px] font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  ຍອດຂາຍນີ້ເກີນວົງເງິນເຄຣດິດທີ່ກຳນົດ! (ຕ້ອງໄດ້ຮັບອະນຸມັດຈາກຜູ້ຈັດການ)
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            ຍົກເລີກ
          </button>
          <button
            type="button"
            disabled={isSubmitting || isCashInsufficient || (hasBelowCost && !isAuthorized)}
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            {isSubmitting ? 'ກຳລັງບັນທຶກ...' : 'ຢືນຢັນຮັບຊຳລະເງິນ'}
          </button>
        </div>
      </div>
    </div>
  );
};
