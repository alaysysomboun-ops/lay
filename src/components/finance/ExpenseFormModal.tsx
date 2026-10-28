import React, { useState } from 'react';
import { FinancialRecord, FinancialTransactionType, ExpenseCategory, PaymentMethod } from '../../types';
import { X, Plus, Wallet, AlertCircle } from 'lucide-react';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onSave: (record: Omit<FinancialRecord, 'id' | 'recordedBy'>) => void;
  onClose: () => void;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onSave,
  onClose,
}) => {
  if (!isOpen) return null;

  const [type, setType] = useState<FinancialTransactionType>('EXPENSE');
  const [category, setCategory] = useState<ExpenseCategory>('RENT');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TRANSFER');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || amount <= 0) {
      alert('ກະລຸນາປ້ອນລາຍການ ແລະ ຈຳນວນເງິນ');
      return;
    }

    onSave({
      date,
      type,
      category: type === 'EXPENSE' ? category : undefined,
      title: title.trim(),
      amount: Number(amount),
      paymentMethod,
      note: note.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            ບັນທຶກລາຍການການເງິນ / ລາຍຈ່າຍ
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ປະເພດລາຍການເງິນ *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'EXPENSE', label: 'ລາຍຈ່າຍຮ້ານ', desc: 'ຫັກກຳໄລ' },
                { id: 'CAPITAL_INJECTION', label: 'ທຶນເຈົ້າຂອງຮ້ານ', desc: 'ເພີ່ມສະພາບຄ່ອງ' },
                { id: 'OWNER_DRAW', label: 'ຖອນກຳໄລອອກ', desc: 'ເຈົ້າຂອງຖອນ' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id as any)}
                  className={`p-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                    type === opt.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div>{opt.label}</div>
                  <div className="text-[10px] font-normal text-slate-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {type === 'CAPITAL_INJECTION' && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>ເງິນທຶນເຈົ້າຂອງຮ້ານຈະຖືກບັນທຶກເປັນກະແສເງິນສົດສ່ວນຂອງເຈົ້າຂອງ (Equity) ແລະ ຈະບໍ່ຖືກນັບເປັນຍອດຂາຍສິນຄ້າ</span>
            </div>
          )}

          {type === 'EXPENSE' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ໝວດໝູ່ລາຍຈ່າຍ *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="RENT">ຄ່າເຊົ່າຮ້ານ / ອາຄານ</option>
                <option value="SALARY">ເງິນເດືອນ ແລະ ຄ່າຈ້າງພະນັກງານ</option>
                <option value="UTILITIES">ຄ່ານ້ຳ / ຄ່າໄຟຟ້າ / ຄ່າອິນເຕີເນັດ</option>
                <option value="SHIPPING">ຄ່າຂົນສົ່ງ ແລະ ໂລຈິສຕິກ</option>
                <option value="SUPPLIES">ວັດສະດຸສິ້ນເປືອງ ແລະ ເຄື່ອງໃຊ້ໃນຮ້ານ</option>
                <option value="MARKETING">ຄ່າການຕະຫຼາດ ແລະ ໂຄສະນາ</option>
                <option value="MAINTENANCE">ຄ່າສ້ອມແປງບຳລຸງຮັກສາອຸປະກອນ</option>
                <option value="OTHER">ລາຍຈ່າຍເບັດຕະເລັດອື່ນໆ</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ຊື່ລາຍການ *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ເຊັ່ນ: ຄ່າໄຟຟ້າປະຈຳເດືອນ, ຄ່ານ້ຳມັນລົດສົ່ງເຄື່ອງ"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ຈຳນວນເງິນ (₭) *
              </label>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ວັນທີເຮັດລາຍການ
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ຊ່ອງທາງການຈ່າຍເງິນ *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'TRANSFER', label: 'ໂອນຜ່ານທະນາຄານ / BCEL' },
                { id: 'CASH', label: 'ເງິນສົດໃນລີ້ນຊັກ' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPaymentMethod(opt.id as any)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === opt.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
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
              ໝາຍເຫດເພີ່ມເຕີມ
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ເລກທີໃບບິນ ຫຼື ລາຍລະອຽດ"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold cursor-pointer"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs shadow-blue-500/20"
            >
              ບັນທຶກລາຍການ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
