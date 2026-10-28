import React, { useState } from 'react';
import { Customer, CustomerType } from '../../types';
import { X, UserPlus, Users } from 'lucide-react';

interface CustomerFormModalProps {
  isOpen: boolean;
  customer?: Customer | null;
  onSave: (customer: Customer) => void;
  onClose: () => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  customer,
  onSave,
  onClose,
}) => {
  if (!isOpen) return null;

  const isEditing = !!customer;

  const [code, setCode] = useState(customer?.code || `CUST-${Math.floor(100 + Math.random() * 900)}`);
  const [name, setName] = useState(customer?.name || '');
  const [companyName, setCompanyName] = useState(customer?.companyName || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [taxId, setTaxId] = useState(customer?.taxId || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [customerType, setCustomerType] = useState<CustomerType>(customer?.customerType || 'RETAIL');
  const [priceTierDiscountPercent, setPriceTierDiscountPercent] = useState<number>(customer?.priceTierDiscountPercent || 0);
  const [creditLimit, setCreditLimit] = useState<number>(customer?.creditLimit || 0);
  const [creditDays, setCreditDays] = useState<number>(customer?.creditDays || 30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('ກະລຸນາປ້ອນຊື່ລູກຄ້າ');
      return;
    }

    const saved: Customer = {
      id: customer?.id || `cust-${Date.now()}`,
      code: code.trim(),
      name: name.trim(),
      companyName: companyName.trim() || undefined,
      phone: phone.trim(),
      email: email.trim() || undefined,
      taxId: taxId.trim() || undefined,
      address: address.trim(),
      customerType,
      priceTierDiscountPercent: Number(priceTierDiscountPercent) || 0,
      creditLimit: Number(creditLimit) || 0,
      creditDays: Number(creditDays) || 0,
      currentDebt: customer?.currentDebt || 0,
      totalPurchased: customer?.totalPurchased || 0,
      status: 'ACTIVE',
      createdAt: customer?.createdAt || new Date().toISOString(),
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            {isEditing ? 'ແກ້ໄຂຂໍ້ມູນລູກຄ້າ' : 'ເພີ່ມລູກຄ້າໃໝ່'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ລະຫັດລູກຄ້າ (Code) *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ປະເພດລູກຄ້າ *
              </label>
              <select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="RETAIL">ລູກຄ້າທົ່ວໄປ (ຂາຍຍ່ອຍ)</option>
                <option value="WHOLESALE_A">ຂາຍສົ່ງ ເກຣດ A (ຮ້ານຄ້າສົ່ງຍ່ອຍ)</option>
                <option value="WHOLESALE_B">ຂາຍສົ່ງ ເກຣດ B (ມິນິມາດ/ຮ້ານອາຫານ)</option>
                <option value="VIP">ລູກຄ້າ VIP (ປະຈຳ)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ຊື່ລູກຄ້າ / ຊື່ບຸກຄົນ *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ເຊັ່ນ ຮ້ານຂາຍເຄື່ອງຍ່ອຍ ປ້າພອນ ຫຼື ທ້າວ ສົມສັກ"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ຊື່ນິຕິບຸກຄົນ / ບໍລິສັດ
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ຖ້າມີ"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ເບີໂທລະສັບ
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="020-XXXX-XXXX"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ເລກປະຈຳຕົວຜູ້ເສຍອາກອນ
              </label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="ເລກອາກອນ"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ສ່ວນຫຼຸດພິເສດປະຈຳຕົວ (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={priceTierDiscountPercent}
                onChange={(e) => setPriceTierDiscountPercent(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Credit Limit & Terms */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-3">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
              ການໃຫ້ສິນເຊື່ອ ແລະ ວົງເງິນຂາຍເຊື່ອ (Credit Terms)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  ວົງເງິນສິນເຊື່ອສູງສຸດ (₭)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  ໄລຍະເວລາສິນເຊື່ອ (ວັນ)
                </label>
                <input
                  type="number"
                  min="0"
                  value={creditDays}
                  onChange={(e) => setCreditDays(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ທີ່ຢູ່ / ສະຖານທີ່ຈັດສົ່ງ
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ທີ່ຢູ່ຮ້ານຄ້າເພື່ອອອກໃບສົ່ງເຄື່ອງ ແລະ ໃບບິນ"
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              ບັນທຶກຂໍ້ມູນ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
