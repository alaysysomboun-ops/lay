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
      alert('กรุณากรอกรายการและจำนวนเงิน');
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
            บันทึกรายการการเงิน / ค่าใช้จ่าย
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ประเภทรายการเงิน *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'EXPENSE', label: 'ค่าใช้จ่ายร้าน', desc: 'หักกำไร' },
                { id: 'CAPITAL_INJECTION', label: 'เงินทุนเจ้าของ', desc: 'เพิ่มสภาพคล่อง' },
                { id: 'OWNER_DRAW', label: 'ถอนเงินกำไร', desc: 'เจ้าของถอน' },
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
              <span>เงินทุนเจ้าของจะถูกบันทึกเป็นกระแสเงินสดส่วนของเจ้าของ (Equity) และจะไม่ถูกนับเป็นยอดขายสินค้า</span>
            </div>
          )}

          {type === 'EXPENSE' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                หมวดหมู่ค่าใช้จ่าย *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="RENT">ค่าเช่าร้าน / อาคาร</option>
                <option value="SALARY">เงินเดือนและค่าจ้างพนักงาน</option>
                <option value="UTILITIES">ค่าน้ำ / ค่าไฟฟ้า / ค่าอินเทอร์เน็ต</option>
                <option value="SHIPPING">ค่าขนส่งและโลจิสติกส์</option>
                <option value="SUPPLIES">วัสดุสิ้นเปลืองและของใช้ร้าน</option>
                <option value="MARKETING">ค่าการตลาดและโฆษณา</option>
                <option value="MAINTENANCE">ค่าซ่อมบำรุงอุปกรณ์</option>
                <option value="OTHER">ค่าใช้จ่ายเบ็ดเตล็ดอื่น ๆ</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ชื่อรายการ *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ค่าไฟฟ้าประจำเดือน, ค่าน้ำมันรถส่งของ"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                จำนวนเงิน (บาท) *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                วันที่ทำรายการ
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
              ช่องทางการจ่ายเงิน *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'TRANSFER', label: 'โอนธนาคาร' },
                { id: 'CASH', label: 'เงินสดในลิ้นชัก' },
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
              หมายเหตุเพิ่มเติม
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เลขที่ใบเสร็จ หรือ รายละเอียด"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              บันทึกรายการ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
