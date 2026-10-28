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

  // Quick cash buttons
  const quickCashOptions = [
    { label: 'พอดี', amount: grandTotal },
    { label: '100', amount: Math.ceil(grandTotal / 100) * 100 || 100 },
    { label: '500', amount: Math.ceil(grandTotal / 500) * 500 || 500 },
    { label: '1,000', amount: Math.ceil(grandTotal / 1000) * 1000 || 1000 },
  ];

  const handleVerifyManagerPin = () => {
    if (managerApprovalPin === '1111' || managerApprovalPin === '2222') {
      setIsManagerApproved(true);
    } else {
      alert('PIN ผู้จัดการไม่ถูกต้อง (ทดสอบ: 1111 หรือ 2222)');
    }
  };

  const handleSubmit = () => {
    if (isSubmitting) return;

    if (hasBelowCost && !isAuthorized) {
      alert('มีสินค้าขายต่ำกว่าราคาทุน ต้องให้ผู้จัดการอนุมัติก่อนทำรายการ');
      return;
    }

    if (isCashInsufficient) {
      alert('จำนวนเงินสดที่รับมาไม่เพียงพอ');
      return;
    }

    if (isCredit && customer.id === 'cust-walkin') {
      alert('ลูกค้าทั่วไปไม่สามารถขายเชื่อได้ กรุณาเลือกลูกค้าขายส่งที่มีวงเงินเครดิต');
      return;
    }

    if (isCreditExceeded && !isAuthorized) {
      alert(`ยอดขายเกินวงเงินเครดิตคงเหลือ (${formatCurrency(remainingCredit, settings.currency)}) ต้องให้ผู้จัดการอนุมัติ`);
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
            <h3 className="font-bold text-base text-slate-900 dark:text-white">ชำระเงิน (Checkout)</h3>
            <p className="text-xs text-slate-500">
              ลูกค้า: <span className="font-semibold text-slate-700 dark:text-slate-300">{customer.name}</span>
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
            <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">ยอดชำระสุทธิ</p>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
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
                    แจ้งเตือน: มีสินค้าขายต่ำกว่าราคาทุน!
                  </h4>
                  <ul className="text-[11px] text-rose-700 dark:text-rose-400 mt-1 space-y-0.5 list-disc list-inside">
                    {belowCostItems.map((it, i) => (
                      <li key={i}>
                        {it.product.name} - ราคาขาย: {it.appliedUnitPrice.toFixed(2)}฿ (ทุน: {it.unitCost.toFixed(2)}฿)
                      </li>
                    ))}
                  </ul>

                  {!isAuthorized ? (
                    <div className="mt-2.5 pt-2 border-t border-rose-200 dark:border-rose-900 flex items-center gap-2">
                      <input
                        type="password"
                        placeholder="PIN ผู้จัดการ (ทดสอบ: 2222)"
                        value={managerApprovalPin}
                        onChange={(e) => setManagerApprovalPin(e.target.value)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-rose-300 bg-white dark:bg-slate-800 dark:border-rose-800 text-slate-900 dark:text-white w-48"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyManagerPin}
                        className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700"
                      >
                        อนุมัติ
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> อนุมัติการขายต่ำกว่าทุนแล้ว
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              เลือกวิธีชำระเงิน:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'CASH' as PaymentMethod, label: 'เงินสด', icon: Banknote },
                { id: 'PROMPTPAY' as PaymentMethod, label: 'พร้อมเพย์ QR', icon: QrCode },
                { id: 'TRANSFER' as PaymentMethod, label: 'โอนธนาคาร', icon: Building },
                { id: 'CREDIT' as PaymentMethod, label: 'ขายเชื่อ (เครดิต)', icon: CreditCard },
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
                รับเงินสด (Cash Tendered):
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
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    {opt.label} {opt.label !== 'พอดี' && `(${opt.amount})`}
                  </button>
                ))}
              </div>

              {/* Change Indicator */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">เงินทอน (Change):</span>
                <span
                  className={`text-xl font-extrabold font-mono ${
                    isCashInsufficient ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {isCashInsufficient ? 'เงินไม่พอ' : formatCurrency(change, settings.currency)}
                </span>
              </div>
            </div>
          )}

          {/* PromptPay QR Details */}
          {method === 'PROMPTPAY' && (
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex flex-col items-center text-center space-y-3">
              <div className="w-44 h-44 bg-white p-2 rounded-xl shadow-md border border-slate-200 flex flex-col items-center justify-center">
                {/* Simulated dynamic PromptPay QR */}
                <div className="w-full h-full border-2 border-dashed border-blue-400 rounded-lg flex flex-col items-center justify-center p-2 bg-slate-50">
                  <QrCode className="w-24 h-24 text-slate-800" />
                  <span className="text-[10px] font-bold text-blue-700 mt-1">PromptPay QR</span>
                  <span className="text-[9px] font-mono text-slate-500">
                    {formatCurrency(grandTotal, settings.currency)}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">สแกนชำระด้วยแอพธนาคารใดก็ได้</p>
                <p className="text-[11px] text-slate-500 mt-0.5">PromptPay ID: 0105567890123 ({settings.storeName})</p>
              </div>
              <input
                type="text"
                placeholder="เลขอ้างอิงสลิป / Transaction Ref (ถ้ามี)"
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
                <p className="font-bold">ธนาคารกสิกรไทย (KBANK)</p>
                <p>เลขที่บัญชี: <span className="font-mono font-bold text-blue-600">012-3-45678-9</span></p>
                <p>ชื่อบัญชี: บจก. สยาม สมาร์ทเทรดดิ้ง</p>
              </div>
              <input
                type="text"
                placeholder="เลขอ้างอิงการโอน / Slip Reference *"
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
                  <span>วงเงินเครดิตอนุมัติ:</span>
                  <span className="font-bold">{formatCurrency(customer.creditLimit, settings.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>หนี้ค้างชำระปัจจุบัน:</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    {formatCurrency(customer.currentDebt, settings.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>วงเงินคงเหลือ:</span>
                  <span className={`font-bold ${remainingCredit < grandTotal ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatCurrency(remainingCredit, settings.currency)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-amber-200 dark:border-amber-800 pt-1 text-slate-600 dark:text-slate-400">
                  <span>กำหนดชำระใน (วัน):</span>
                  <span>{customer.creditDays || 30} วัน</span>
                </div>
              </div>

              {isCreditExceeded && (
                <div className="p-2.5 rounded-lg bg-rose-100 text-rose-800 text-[11px] font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  ยอดขายนี้เกินวงเงินเครดิตที่กำหนด! (ต้องได้รับอนุมัติจากผู้จัดการ)
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
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isSubmitting || isCashInsufficient || (hasBelowCost && !isAuthorized)}
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันรับชำระเงิน'}
          </button>
        </div>
      </div>
    </div>
  );
};
