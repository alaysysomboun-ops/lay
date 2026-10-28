import React, { useState, useMemo } from 'react';
import { Product, Category, Supplier, Warehouse, StoreSettings, User } from '../../types';
import { formatCurrency, formatNumber } from '../../services/formatters';
import { ProductFormModal } from './ProductFormModal';
import { ProductImportModal } from './ProductImportModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { CameraBarcodeScannerModal } from '../common/CameraBarcodeScannerModal';
import {
  Plus,
  Search,
  Camera,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Package,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface ProductListScreenProps {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  settings: StoreSettings;
  currentUser: User;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onImportProducts: (products: Product[]) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const ProductListScreen: React.FC<ProductListScreenProps> = ({
  products,
  categories,
  suppliers,
  warehouses,
  settings,
  currentUser,
  onSaveProduct,
  onDeleteProduct,
  onImportProducts,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  const canManageProducts = currentUser.role === 'OWNER' || currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
  const canViewCost = currentUser.role !== 'CASHIER';

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;

      let matchesStock = true;
      if (stockFilter === 'IN_STOCK') matchesStock = p.currentStock > p.minStockAlert;
      else if (stockFilter === 'LOW_STOCK') matchesStock = p.currentStock <= p.minStockAlert && p.currentStock > 0;
      else if (stockFilter === 'OUT_OF_STOCK') matchesStock = p.currentStock <= 0;

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  const handleExportCsv = () => {
    const headers = ['SKU', 'Barcode', 'Name', 'Category', 'BaseUnit', 'CostPrice', 'RetailPrice', 'WholesalePrice', 'CurrentStock', 'MinStockAlert'];
    const rows = filteredProducts.map((p) => [
      `"${p.sku}"`,
      `"${p.barcode}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.baseUnit}"`,
      p.costPrice,
      p.retailPrice,
      p.wholesalePrice,
      p.currentStock,
      p.minStockAlert,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('success', 'ສົ່ງອອກຂໍ້ມູນສຳເລັດ', `ສົ່ງອອກສິນຄ້າ ${filteredProducts.length} ລາຍການເປັນ CSV`);
  };

  const handleConfirmDelete = () => {
    if (deletingProductId) {
      onDeleteProduct(deletingProductId);
      setDeletingProductId(null);
      onShowToast('success', 'ລຶບສິນຄ້າຮຽບຮ້ອຍ');
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            ຈັດການລາຍການສິນຄ້າ ແລະ ລາຄາ (Products & Pricing)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ກຳນົດລາຄາຕົ້ນທຶນ, ລາຄາຂາຍຍ່ອຍ ແລະ ຂັ້ນໄດລາຄາຂາຍສົ່ງຫຼາຍລະດັບຕາມຈຳນວນ
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            ສົ່ງອອກ CSV
          </button>

          {canManageProducts && (
            <button
              onClick={() => setIsImportOpen(true)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              ນຳເຂົ້າ CSV
            </button>
          )}

          {canManageProducts && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              ເພີ່ມສິນຄ້າໃໝ່
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່, SKU, ຫຼື ບາຣ໌ໂຄ້ດ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
            title="ສະແກນບາໂຄ້ດດ້ວຍກ້ອງ"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">ທຸກໝວດໝູ່</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">ສະຖານະສະຕັອກທັງໝົດ</option>
            <option value="IN_STOCK">ສະຕັອກປົກກະຕິ</option>
            <option value="LOW_STOCK">ສະຕັອກໃກ້ໝົດ</option>
            <option value="OUT_OF_STOCK">ໝົດສະຕັອກ</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">ຮູບພາບ & ສິນຄ້າ</th>
                <th className="py-3 px-4">ໝວດໝູ່</th>
                {canViewCost && <th className="py-3 px-4 text-right">ຕົ້ນທຶນຕໍ່ໜ່ວຍ</th>}
                <th className="py-3 px-4 text-right">ລາຄາຂາຍຍ່ອຍ</th>
                <th className="py-3 px-4 text-right">ລາຄາຂາຍສົ່ງມາດຕະຖານ</th>
                <th className="py-3 px-4">ຂັ້ນໄດລາຄາຂາຍສົ່ງ (Tiers)</th>
                <th className="py-3 px-4 text-right">ສະຕັອກຄົງເຫຼືອ</th>
                <th className="py-3 px-4 text-center">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((p) => {
                const isLow = p.currentStock <= p.minStockAlert && p.currentStock > 0;
                const isOut = p.currentStock <= 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Name & SKU */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white leading-tight">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                            <span>SKU: {p.sku}</span>
                            <span>•</span>
                            <span>ບາຣ໌ໂຄ້ດ: {p.barcode}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      {p.category}
                    </td>

                    {/* Cost */}
                    {canViewCost && (
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {formatCurrency(p.costPrice, settings.currency)}
                      </td>
                    )}

                    {/* Retail Price */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(p.retailPrice, settings.currency)}
                    </td>

                    {/* Wholesale Standard */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {p.wholesalePrice > 0 ? formatCurrency(p.wholesalePrice, settings.currency) : '-'}
                    </td>

                    {/* Price Tiers preview */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {p.priceTiers && p.priceTiers.length > 0 ? (
                          p.priceTiers.map((t, i) => (
                            <span
                              key={i}
                              className="inline-block text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                            >
                              ≥{t.minQty} @ {formatNumber(t.price)}₭
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400">-</span>
                        )}
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4 text-right font-mono">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          isOut
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                            : isLow
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}
                      >
                        {p.currentStock} {p.baseUnit}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canManageProducts ? (
                          <>
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setIsFormOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                              title="ແກ້ໄຂ"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingProductId(p.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="ລຶບ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-400 text-[11px]">ເບິ່ງຢ່າງດຽວ</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-xs">ບໍ່ພົບຂໍ້ມູນສິນຄ້າ</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        product={editingProduct}
        categories={categories}
        suppliers={suppliers}
        warehouses={warehouses}
        onSave={onSaveProduct}
        onClose={() => setIsFormOpen(false)}
      />

      {/* CSV Import Modal */}
      <ProductImportModal
        isOpen={isImportOpen}
        onImport={onImportProducts}
        onClose={() => setIsImportOpen(false)}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deletingProductId}
        title="ຢືນຢັນການລຶບສິນຄ້າ"
        message="ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບສິນຄ້ານີ້ອອກຈາກລະບົບ? ປະຫວັດການຂາຍຜ່ານມາຈະຍັງຄົງຢູ່"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingProductId(null)}
      />

      {/* Camera Barcode Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={(code) => {
          setSearchQuery(code);
          onShowToast('info', 'ສະແກນບາໂຄ້ດສຳເລັດ', `ຄົ້ນຫາ: ${code}`);
        }}
        products={products}
        title="ສະແກນຄົ້ນຫາສິນຄ້າ"
        subtitle="ສ່ອງກ້ອງໃສ່ບາໂຄ້ດເພື່ອຄົ້ນຫາລາຍການສິນຄ້າໃນລະບົບ"
      />
    </div>
  );
};
