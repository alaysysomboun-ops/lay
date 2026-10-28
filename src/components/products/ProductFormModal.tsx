import React, { useState, useEffect } from 'react';
import { Product, Category, Supplier, Warehouse, PriceTier, UnitConversion } from '../../types';
import { X, Plus, Trash2, Layers, Tag, DollarSign, Package, Camera } from 'lucide-react';
import { CameraBarcodeScannerModal } from '../common/CameraBarcodeScannerModal';

interface ProductFormModalProps {
  isOpen: boolean;
  product?: Product | null;
  categories: Category[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  onSave: (product: Product) => void;
  onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  product,
  categories,
  suppliers,
  warehouses,
  onSave,
  onClose,
}) => {
  if (!isOpen) return null;

  const isEditing = !!product;

  const [sku, setSku] = useState(product?.sku || '');
  const [barcode, setBarcode] = useState(product?.barcode || '');
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || categories[0]?.name || '');
  const [baseUnit, setBaseUnit] = useState(product?.baseUnit || 'ອັນ');
  const [costPrice, setCostPrice] = useState<number>(product?.costPrice || 0);
  const [retailPrice, setRetailPrice] = useState<number>(product?.retailPrice || 0);
  const [wholesalePrice, setWholesalePrice] = useState<number>(product?.wholesalePrice || 0);
  const [wholesaleMinQty, setWholesaleMinQty] = useState<number>(product?.wholesaleMinQty || 6);
  const [currentStock, setCurrentStock] = useState<number>(product?.currentStock || 0);
  const [minStockAlert, setMinStockAlert] = useState<number>(product?.minStockAlert || 10);
  const [warehouseId, setWarehouseId] = useState(product?.warehouseId || warehouses[0]?.id || 'wh-front');
  const [supplierId, setSupplierId] = useState(product?.supplierId || suppliers[0]?.id || '');
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || '');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(product?.status || 'ACTIVE');

  // Wholesale Tiers
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>(
    product?.priceTiers || [
      { minQty: 1, price: product?.retailPrice || 0, label: 'ຂາຍຍ່ອຍ' },
      { minQty: 10, price: product?.wholesalePrice || 0, label: 'ຂາຍສົ່ງ ຂັ້ນ 1 (10+)' }
    ]
  );

  // Unit conversions (e.g. ແພັກ, ແກັດ)
  const [units, setUnits] = useState<UnitConversion[]>(product?.units || []);
  const [isCameraScanOpen, setIsCameraScanOpen] = useState(false);

  const handleAddTier = () => {
    setPriceTiers([
      ...priceTiers,
      { minQty: 20, price: wholesalePrice > 0 ? wholesalePrice * 0.95 : 0, label: 'ຂາຍສົ່ງ ຂັ້ນໃໝ່' }
    ]);
  };

  const handleRemoveTier = (idx: number) => {
    setPriceTiers(priceTiers.filter((_, i) => i !== idx));
  };

  const handleUpdateTier = (idx: number, field: keyof PriceTier, value: any) => {
    const updated = [...priceTiers];
    updated[idx] = { ...updated[idx], [field]: value };
    setPriceTiers(updated);
  };

  const handleAddUnit = () => {
    setUnits([
      ...units,
      { unitName: 'ແພັກ', multiplier: 6, retailPrice: retailPrice * 5.8, wholesalePrice: wholesalePrice * 5.5 }
    ]);
  };

  const handleRemoveUnit = (idx: number) => {
    setUnits(units.filter((_, i) => i !== idx));
  };

  const handleUpdateUnit = (idx: number, field: keyof UnitConversion, value: any) => {
    const updated = [...units];
    updated[idx] = { ...updated[idx], [field]: value };
    setUnits(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) {
      alert('ກະລຸນາປ້ອນ SKU ແລະ ຊື່ສິນຄ້າ');
      return;
    }

    const newProduct: Product = {
      id: product?.id || `p-${Date.now()}`,
      sku: sku.trim(),
      barcode: barcode.trim() || sku.trim(),
      name: name.trim(),
      category,
      baseUnit: baseUnit.trim(),
      units,
      costPrice: Number(costPrice) || 0,
      retailPrice: Number(retailPrice) || 0,
      wholesalePrice: Number(wholesalePrice) || 0,
      wholesaleMinQty: Number(wholesaleMinQty) || 1,
      priceTiers,
      currentStock: Number(currentStock) || 0,
      minStockAlert: Number(minStockAlert) || 0,
      warehouseId,
      supplierId: supplierId || undefined,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80',
      status,
      createdAt: product?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            {isEditing ? 'ແກ້ໄຂຂໍ້ມູນສິນຄ້າ' : 'ເພີ່ມສິນຄ້າໃໝ່'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ລະຫັດສິນຄ້າ (SKU) *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="ເຊັ່ນ BEV-BEER-001"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  ບາຣ໌ໂຄ້ດ (Barcode)
                </label>
                <button
                  type="button"
                  onClick={() => setIsCameraScanOpen(true)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  ສະແກນດ້ວຍກ້ອງ
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="ສະແກນບາຣ໌ໂຄ້ດ ຫຼື ປ້ອນລະຫັດ"
                  className="w-full px-3 py-2 pr-9 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setIsCameraScanOpen(true)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                  title="ສະແກນບາໂຄ້ດດ້ວຍກ້ອງ"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ຊື່ສິນຄ້າ *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ເຊັ່ນ ເບຍລາວ ກະປ໋ອງ 330ml (Beerlao)"
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ໝວດໝູ່ສິນຄ້າ
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ຫົວໜ່ວຍຫຼັກ (Base Unit) *
              </label>
              <input
                type="text"
                required
                value={baseUnit}
                onChange={(e) => setBaseUnit(e.target.value)}
                placeholder="ເຊັ່ນ ອັນ, ແກ້ວ, ກະປ໋ອງ, ຖົງ, ກ່ອງ"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Pricing Section */}
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-3">
            <h4 className="font-bold text-xs text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              ການກຳນົດລາຄາຂາຍ ແລະ ລາຄາຕົ້ນທຶນ (ຕໍ່ {baseUnit || 'ໜ່ວຍ'})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  ລາຄາຕົ້ນທຶນ (Cost) ₭
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  ລາຄາຂາຍຍ່ອຍ ₭
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  ລາຄາຂາຍສົ່ງມາດຕະຖານ ₭
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Wholesale Multi-Tier Pricing Matrix */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  ຂັ້ນໄດລາຄາຂາຍສົ່ງຕາມຈຳນວນ (Volume Price Tiers)
                </h4>
                <p className="text-[11px] text-slate-500">
                  ລະບົບຈະປັບລາຄາໃຫ້ອັດຕະໂນມັດໃນຈຸດຂາຍເມື່ອຈຳນວນຮອດເກນ
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTier}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                ເພີ່ມຂັ້ນໄດລາຄາ
              </button>
            </div>

            <div className="space-y-2">
              {priceTiers.map((tier, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tier.label || ''}
                    placeholder="ຊື່ລະດັບລາຄາ (ເຊັ່ນ ຂາຍສົ່ງ 10+)"
                    onChange={(e) => handleUpdateTier(idx, 'label', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-400">ຂັ້ນຕ່ຳ:</span>
                    <input
                      type="number"
                      min="1"
                      value={tier.minQty}
                      onChange={(e) => handleUpdateTier(idx, 'minQty', parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-400">ລາຄາ:</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={tier.price}
                      onChange={(e) => handleUpdateTier(idx, 'price', parseFloat(e.target.value) || 0)}
                      className="w-28 px-2 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 text-right"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTier(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Stock & Warehouse */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ຈຳນວນສະຕັອກຄົງເຫຼືອ *
              </label>
              <input
                type="number"
                step="any"
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ຈຸດແຈ້ງເຕືອນຂັ້ນຕ່ຳ
              </label>
              <input
                type="number"
                step="any"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ສາງເກັບສິນຄ້າ
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Supplier & Image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ຜູ້ສະໜອງຫຼັກ (Supplier)
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">-- ບໍ່ລະບຸ --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ລິ້ງຮູບພາບ (Image URL)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </form>

        {/* Modal Actions */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            ຍົກເລີກ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 cursor-pointer transition-all active:scale-98"
          >
            {isEditing ? 'ບັນທຶກການແກ້ໄຂ' : 'ບັນທຶກສິນຄ້າໃໝ່'}
          </button>
        </div>
      </div>

      {/* Camera Barcode Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScanOpen}
        onClose={() => setIsCameraScanOpen(false)}
        onScan={(code) => {
          setBarcode(code);
          if (!sku) setSku(code);
        }}
        title="ສະແກນບາໂຄ້ດສິນຄ້າ"
        subtitle="ສ່ອງກ້ອງໃສ່ບາໂຄ້ດເທິງກ່ອງສິນຄ້າເພື່ອປ້ອນລະຫັດອັດຕະໂນມັດ"
      />
    </div>
  );
};
