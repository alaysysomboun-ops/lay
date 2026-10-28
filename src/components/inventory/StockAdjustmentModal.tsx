import React, { useState } from 'react';
import { Product, MovementType } from '../../types';
import { X, Check, Boxes, AlertTriangle } from 'lucide-react';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  products: Product[];
  onAdjust: (productId: string, qty: number, type: 'ADJUST_COUNT' | 'ADJUST_DAMAGE' | 'PURCHASE_RECEIPT', reason: string) => void;
  onClose: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  products,
  onAdjust,
  onClose,
}) => {
  if (!isOpen) return null;

  const [productId, setProductId] = useState(products[0]?.id || '');
  const [type, setType] = useState<'ADJUST_COUNT' | 'ADJUST_DAMAGE' | 'PURCHASE_RECEIPT'>('PURCHASE_RECEIPT');
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState<string>('รับสินค้าเข้าคลังประจำงวด');

  const selectedProduct = products.find(p => p.id === productId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || quantity === undefined) return;
    onAdjust(productId, Number(quantity), type, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            ปรับปรุงสต็อก / รับสินค้าเข้า
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              เลือกสินค้า *
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (คงเหลือ: {p.currentStock} {p.baseUnit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ประเภทการปรับปรุงสต็อก *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'PURCHASE_RECEIPT', label: 'รับเข้า (+)', desc: 'ซื้อเข้าเพิ่ม' },
                { id: 'ADJUST_DAMAGE', label: 'ชำรุด/สูญหาย (-)', desc: 'ตัดสต็อกออก' },
                { id: 'ADJUST_COUNT', label: 'ตรวจนับตรง', desc: 'ตั้งยอดใหม่' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setType(opt.id as any);
                    if (opt.id === 'PURCHASE_RECEIPT') setReason('รับสินค้าเข้าคลัง');
                    else if (opt.id === 'ADJUST_DAMAGE') setReason('สินค้าหมดอายุ/เสียหาย');
                    else setReason('ปรับยอดตามการตรวจนับจริงประจำเดือน');
                  }}
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

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {type === 'ADJUST_COUNT' ? 'จำนวนคงเหลือจริงใหม่ (ชิ้น/หน่วย)' : 'จำนวนที่ต้องการเพิ่ม/ลด (หน่วย)'}
            </label>
            <input
              type="number"
              step="any"
              required
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            {selectedProduct && (
              <p className="text-[11px] text-slate-500 mt-1">
                สต็อกปัจจุบัน: <strong>{selectedProduct.currentStock} {selectedProduct.baseUnit}</strong>
                {type === 'PURCHASE_RECEIPT' && ` -> สต็อกใหม่จะเป็น: ${selectedProduct.currentStock + quantity} ${selectedProduct.baseUnit}`}
                {type === 'ADJUST_DAMAGE' && ` -> สต็อกใหม่จะเป็น: ${Math.max(0, selectedProduct.currentStock - quantity)} ${selectedProduct.baseUnit}`}
                {type === 'ADJUST_COUNT' && ` -> สต็อกใหม่จะเป็น: ${quantity} ${selectedProduct.baseUnit}`}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              เหตุผลการปรับปรุงสต็อก (Audit Reason) *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ระบุเหตุผลเพื่อบันทึกใน Audit Log..."
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
              ยืนยันปรับสต็อก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
