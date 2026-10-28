import React, { useState } from 'react';
import { Supplier, Product, PurchaseOrder, PurchaseOrderItem } from '../../types';
import { X, Plus, Trash2, Truck } from 'lucide-react';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  suppliers: Supplier[];
  products: Product[];
  onSavePO: (po: PurchaseOrder) => void;
  onClose: () => void;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  suppliers,
  products,
  onSavePO,
  onClose,
}) => {
  if (!isOpen) return null;

  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [items, setItems] = useState<PurchaseOrderItem[]>([
    {
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      sku: products[0]?.sku || '',
      unit: products[0]?.baseUnit || 'ອັນ',
      quantity: 50,
      unitPrice: products[0]?.costPrice || 10000,
      total: (products[0]?.costPrice || 10000) * 50,
    }
  ]);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [note, setNote] = useState<string>('');

  const selectedSupplier = suppliers.find(s => s.id === supplierId) || suppliers[0];

  const handleAddItem = () => {
    const prod = products[0];
    if (!prod) return;
    setItems([
      ...items,
      {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unit: prod.baseUnit,
        quantity: 20,
        unitPrice: prod.costPrice,
        total: prod.costPrice * 20,
      }
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const next = [...items];
    const cur = next[index];

    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        cur.productId = prod.id;
        cur.productName = prod.name;
        cur.sku = prod.sku;
        cur.unit = prod.baseUnit;
        cur.unitPrice = prod.costPrice;
        cur.total = cur.quantity * prod.costPrice;
      }
    } else {
      (cur as any)[field] = value;
      if (field === 'quantity' || field === 'unitPrice') {
        cur.total = cur.quantity * cur.unitPrice;
      }
    }
    setItems(next);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, it) => sum + it.total, 0);
  const grandTotal = subtotal + Number(shippingFee || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('ກະລຸນາເພີ່ມລາຍການສິນຄ້າທີ່ຕ້ອງການສັ່ງຊື້');
      return;
    }

    const now = new Date();
    const poNumber = `PO-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      supplierId,
      supplierName: selectedSupplier.name,
      createdAt: now.toISOString(),
      items,
      subtotal,
      shippingFee: Number(shippingFee) || 0,
      otherFees: 0,
      grandTotal,
      status: 'DRAFT',
      isPaid: false,
      paidAmount: 0,
      note,
    };

    onSavePO(newPO);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            ສ້າງໃບສັ່ງຊື້ສິນຄ້າ (Create Purchase Order - PO)
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ເລືອກຜູ້ສະໜອງ / ຮ້ານຄ້າຕົ້ນທາງ *
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) - ສິນເຊື່ອ {s.creditDays} ວັນ
                </option>
              ))}
            </select>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">ລາຍການສິນຄ້າທີ່ຈະສັ່ງຊື້</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                ເພີ່ມລາຍການ
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <select
                    value={item.productId}
                    onChange={(e) => handleUpdateItem(idx, 'productId', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    placeholder="ຈຳນວນ"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                    className="w-16 px-2 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center"
                  />

                  <input
                    type="number"
                    step="any"
                    placeholder="ຕົ້ນທຶນ"
                    value={item.unitPrice}
                    onChange={(e) => handleUpdateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-right"
                  />

                  <span className="w-24 text-right font-mono font-bold text-xs text-slate-900 dark:text-white">
                    {item.total.toLocaleString()}₭
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ຄ່າຂົນສົ່ງ / Landed Cost (₭)
              </label>
              <input
                type="number"
                min="0"
                value={shippingFee}
                onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ໝາຍເຫດໃບສັ່ງຊື້
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ລະບຸຂໍ້ກຳນົດການຈັດສົ່ງ"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">ຍອດລວມໃບສັ່ງຊື້ທັງໝົດ:</span>
            <span className="text-lg font-black text-blue-600 font-mono">{grandTotal.toLocaleString()} ₭</span>
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              ບັນທຶກໃບສັ່ງຊື້ PO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
