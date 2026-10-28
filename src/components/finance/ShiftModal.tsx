import React, { useState } from 'react';
import { CashShift, StoreSettings, User } from '../../types';
import { formatCurrency, formatDateTime } from '../../services/formatters';
import { X, Clock, Banknote, CheckCircle, AlertTriangle } from 'lucide-react';

interface ShiftModalProps {
  isOpen: boolean;
  activeShift?: CashShift;
  settings: StoreSettings;
  currentUser: User;
  onOpenShift: (openingCash: number) => void;
  onCloseShift: (actualCash: number, notes?: string) => void;
  onCloseModal: () => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  activeShift,
  settings,
  currentUser,
  onOpenShift,
  onCloseShift,
  onCloseModal,
}) => {
  if (!isOpen) return null;

  const [openingFloat, setOpeningFloat] = useState<number>(500000);
  const [closingCash, setClosingCash] = useState<number>(activeShift?.expectedCash || 0);
  const [closingNotes, setClosingNotes] = useState<string>('');

  const handleStartShift = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenShift(Number(openingFloat) || 0);
    onCloseModal();
  };

  const handleEndShift = (e: React.FormEvent) => {
    e.preventDefault();
    onCloseShift(Number(closingCash) || 0, closingNotes);
    onCloseModal();
  };

  const cashDiff = activeShift ? closingCash - activeShift.expectedCash : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            {activeShift ? 'ຈັດການ ແລະ ປິດກະການຂາຍ (Shift Management)' : 'ເປີດກະການຂາຍໃໝ່ (Open Shift)'}
          </h3>
          <button onClick={onCloseModal} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {!activeShift ? (
            /* Open Shift Form */
            <form onSubmit={handleStartShift} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                ພະນັກງານຂາຍ: <strong>{currentUser.name}</strong> ({currentUser.role})
                <br />
                ກະລຸນາກວດນັບເງິນສົດເລີ່ມຕົ້ນໃນລີ້ນຊັກ (ເງິນທອນ) ກ່ອນເລີ່ມຕົ້ນການຂາຍສິນຄ້າ
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ເງິນທອນເລີ່ມຕົ້ນໃນລີ້ນຊັກ (₭) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(parseFloat(e.target.value) || 0)}
                  className="w-full text-xl font-mono font-black px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onCloseModal}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  ຢືນຢັນເປີດກະຂາຍ
                </button>
              </div>
            </form>
          ) : (
            /* Close Shift Form */
            <form onSubmit={handleEndShift} className="space-y-4">
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono">
                <div className="flex justify-between font-sans">
                  <span className="text-slate-500">ແຄຊເຊຍປະຈຳກະ:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activeShift.cashierName}</span>
                </div>
                <div className="flex justify-between font-sans">
                  <span className="text-slate-500">ເວລາເລີ່ມກະ:</span>
                  <span>{formatDateTime(activeShift.startTime, 'lo')}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1">
                  <span>ເງິນທອນເລີ່ມຕົ້ນ:</span>
                  <span className="font-bold">{formatCurrency(activeShift.openingCash, settings.currency)}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>ຍອດຂາຍເງິນສົດ:</span>
                  <span className="font-bold">+{formatCurrency(activeShift.totalCashSales, settings.currency)}</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>ຍອດຂາຍໂອນ / BCEL:</span>
                  <span className="font-bold">{formatCurrency(activeShift.totalPromptPaySales, settings.currency)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1 text-slate-900 dark:text-white font-sans text-xs">
                  <strong>ເງິນສົດທີ່ລະບົບຄຳນວນ (Expected Cash):</strong>
                  <strong className="font-mono text-sm text-blue-600">
                    {formatCurrency(activeShift.expectedCash, settings.currency)}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ນັບເງິນສົດຕົວຈິງໃນລີ້ນຊັກໄດ້ (₭) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={closingCash}
                  onChange={(e) => setClosingCash(parseFloat(e.target.value) || 0)}
                  className="w-full text-xl font-mono font-black px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Difference Banner */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                  cashDiff === 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : cashDiff > 0
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                <span>
                  {cashDiff === 0
                    ? 'ຍອດເງິນສົດກົງພໍດີ'
                    : cashDiff > 0
                    ? `ເງິນສົດເກີນໃນລີ້ນຊັກ (+${cashDiff.toLocaleString()} ₭)`
                    : `ເງິນສົດຂາດຫາຍ (-${Math.abs(cashDiff).toLocaleString()} ₭)`}
                </span>
                <span className="font-mono font-black text-sm">
                  {cashDiff > 0 ? `+${cashDiff.toLocaleString()} ₭` : `${cashDiff.toLocaleString()} ₭`}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ໝາຍເຫດປິດກະ / ຊີ້ແຈງສ່ວນຕ່າງ
                </label>
                <input
                  type="text"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="ເຊັ່ນ: ເງິນສົດກົງຕາມລະບົບ ຫຼື ນຳເງິນສົ່ງມອບໃຫ້ເຈົ້າຂອງຮ້ານ"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onCloseModal}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 cursor-pointer"
                >
                  ຢືນຢັນປິດກະການຂາຍ
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
