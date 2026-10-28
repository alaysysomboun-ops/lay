import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Product, Customer, CartItem, StoreSettings, User, SaleTransaction,
  PaymentDetails, Category
} from '../../types';
import { formatCurrency } from '../../services/formatters';
import { storageService } from '../../services/storageService';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { CameraBarcodeScannerModal } from '../common/CameraBarcodeScannerModal';
import {
  Search,
  Barcode,
  Camera,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  UserCheck,
  Tag,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Package,
  ArrowRight,
  TrendingUp,
  Percent,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

interface POSScreenProps {
  products: Product[];
  customers: Customer[];
  categories: Category[];
  settings: StoreSettings;
  currentUser: User;
  onRefreshData: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const POSScreen: React.FC<POSScreenProps> = ({
  products,
  customers,
  categories,
  settings,
  currentUser,
  onRefreshData,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-walkin');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [overallDiscountAmount, setOverallDiscountAmount] = useState<number>(0);
  const [isVatEnabled, setIsVatEnabled] = useState<boolean>(settings.enableVat);

  // Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleTransaction | null>(null);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle barcode scanned from camera
  const handleCameraBarcodeScanned = (scannedCode: string) => {
    const q = scannedCode.trim().toLowerCase();
    const exactMatch = products.find(
      (p) =>
        p.status === 'ACTIVE' &&
        (p.barcode.toLowerCase() === q ||
          p.sku.toLowerCase() === q ||
          p.units?.some((u) => u.barcode?.toLowerCase() === q))
    );

    if (exactMatch) {
      const matchedUnit = exactMatch.units?.find((u) => u.barcode?.toLowerCase() === q);
      if (matchedUnit) {
        handleAddToCart(exactMatch, matchedUnit.unitName, matchedUnit.multiplier);
      } else {
        handleAddToCart(exactMatch);
      }
    } else {
      onShowToast('warning', 'ບໍ່ພົບສິນຄ້າ', `ບໍ່ພົບບາໂຄດ ຫຼື ລະຫັດ: ${scannedCode}`);
    }
  };

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || customers[0];
  }, [customers, selectedCustomerId]);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status !== 'ACTIVE') return false;
      const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  /**
   * Calculate wholesale tier price based on base quantity and customer type
   */
  const calculateUnitPrice = (product: Product, totalBaseQty: number, customer: Customer) => {
    let unitPrice = product.retailPrice;
    let tierApplied = '';

    // Check wholesale tiers (descending order of minQty)
    if (product.priceTiers && product.priceTiers.length > 0) {
      const sortedTiers = [...product.priceTiers].sort((a, b) => b.minQty - a.minQty);
      for (const tier of sortedTiers) {
        if (totalBaseQty >= tier.minQty) {
          unitPrice = tier.price;
          tierApplied = tier.label || `ສົ່ງ ${tier.minQty}+ ${product.baseUnit}`;
          break;
        }
      }
    }

    // If customer is Wholesale Grade A/B and didn't hit tier, apply standard wholesale
    if (!tierApplied && (customer.customerType === 'WHOLESALE_A' || customer.customerType === 'WHOLESALE_B')) {
      unitPrice = product.wholesalePrice;
      tierApplied = 'ລາຄາສົ່ງສະມາຊິກ';
    }

    // Apply customer special on-top discount % if any
    let discountPerUnit = 0;
    if (customer.priceTierDiscountPercent && customer.priceTierDiscountPercent > 0) {
      discountPerUnit = (unitPrice * customer.priceTierDiscountPercent) / 100;
      unitPrice = Math.max(0, unitPrice - discountPerUnit);
    }

    return { unitPrice, tierApplied };
  };

  /**
   * Add Product to Cart or increment quantity
   */
  const handleAddToCart = (product: Product, unitName?: string, unitMultiplier: number = 1) => {
    if (!settings.allowNegativeStock && product.currentStock <= 0) {
      onShowToast('error', 'ສິນຄ້າໝົດ', `ສິນຄ້າ "${product.name}" ບໍ່ມີສະຕັອກຄົງເຫຼືອ`);
      return;
    }

    setCart((prevCart) => {
      const uName = unitName || product.baseUnit;
      const existingIdx = prevCart.findIndex(
        (item) => item.product.id === product.id && item.unit === uName
      );

      let newCart = [...prevCart];

      if (existingIdx >= 0) {
        const item = newCart[existingIdx];
        const newQty = item.quantity + 1;
        const totalBaseQty = newQty * item.unitMultiplier;
        const { unitPrice, tierApplied } = calculateUnitPrice(product, totalBaseQty, selectedCustomer);

        const lineUnitPrice = unitPrice * item.unitMultiplier;
        const lineTotal = newQty * lineUnitPrice;

        newCart[existingIdx] = {
          ...item,
          quantity: newQty,
          appliedUnitPrice: lineUnitPrice,
          tierApplied,
          total: lineTotal,
        };
      } else {
        const totalBaseQty = 1 * unitMultiplier;
        const { unitPrice, tierApplied } = calculateUnitPrice(product, totalBaseQty, selectedCustomer);
        const lineUnitPrice = unitPrice * unitMultiplier;

        newCart.push({
          product,
          quantity: 1,
          unit: uName,
          unitMultiplier,
          unitCost: product.costPrice * unitMultiplier,
          appliedUnitPrice: lineUnitPrice,
          originalUnitPrice: (product.retailPrice || lineUnitPrice) * unitMultiplier,
          tierApplied,
          discountAmount: 0,
          total: lineUnitPrice,
        });
      }

      return newCart;
    });

    onShowToast('info', 'ເພີ່ມລົງກະຕ່າ', product.name);
  };

  /**
   * Adjust Quantity in Cart with Tier Price recalculation
   */
  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }

    setCart((prevCart) => {
      const newCart = [...prevCart];
      const item = newCart[index];
      const totalBaseQty = newQty * item.unitMultiplier;

      // Check stock limit
      if (!settings.allowNegativeStock && totalBaseQty > item.product.currentStock) {
        onShowToast(
          'warning',
          'ສະຕັອກບໍ່ພຽງພໍ',
          `ຄົງເຫຼືອໃນສາງ ${item.product.currentStock} ${item.product.baseUnit}`
        );
        return prevCart;
      }

      const { unitPrice, tierApplied } = calculateUnitPrice(item.product, totalBaseQty, selectedCustomer);
      const lineUnitPrice = unitPrice * item.unitMultiplier;

      newCart[index] = {
        ...item,
        quantity: newQty,
        appliedUnitPrice: lineUnitPrice,
        tierApplied,
        total: Math.max(0, newQty * lineUnitPrice - item.discountAmount),
      };

      return newCart;
    });
  };

  /**
   * Remove item from cart
   */
  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Clear Cart
   */
  const handleClearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    setOverallDiscountAmount(0);
  };

  // Recalculate cart pricing whenever customer changes
  useEffect(() => {
    if (cart.length === 0) return;
    setCart((prevCart) =>
      prevCart.map((item) => {
        const totalBaseQty = item.quantity * item.unitMultiplier;
        const { unitPrice, tierApplied } = calculateUnitPrice(item.product, totalBaseQty, selectedCustomer);
        const lineUnitPrice = unitPrice * item.unitMultiplier;
        return {
          ...item,
          appliedUnitPrice: lineUnitPrice,
          tierApplied,
          total: Math.max(0, item.quantity * lineUnitPrice - item.discountAmount),
        };
      })
    );
  }, [selectedCustomerId]);

  // Handle barcode or Enter key in search box
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = searchQuery.trim().toLowerCase();
      if (!q) return;

      const exactMatch = products.find(
        (p) =>
          p.status === 'ACTIVE' &&
          (p.barcode.toLowerCase() === q ||
            p.sku.toLowerCase() === q ||
            p.units?.some((u) => u.barcode?.toLowerCase() === q))
      );

      if (exactMatch) {
        const matchedUnit = exactMatch.units?.find((u) => u.barcode?.toLowerCase() === q);
        if (matchedUnit) {
          handleAddToCart(exactMatch, matchedUnit.unitName, matchedUnit.multiplier);
        } else {
          handleAddToCart(exactMatch);
        }
        setSearchQuery('');
      } else if (filteredProducts.length === 1) {
        handleAddToCart(filteredProducts[0]);
        setSearchQuery('');
      } else {
        onShowToast('warning', 'ບໍ່ພົບສິນຄ້າ', `ບໍ່ພົບບາໂຄດ ຫຼື ລະຫັດ: ${q}`);
      }
    }
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const discountTotal = useMemo(() => {
    return overallDiscountAmount;
  }, [overallDiscountAmount]);

  const discountedSubtotal = Math.max(0, subtotal - discountTotal);

  const taxAmount = useMemo(() => {
    if (!isVatEnabled) return 0;
    return (discountedSubtotal * settings.vatRate) / 100;
  }, [isVatEnabled, discountedSubtotal, settings.vatRate]);

  const grandTotal = discountedSubtotal + (isVatEnabled ? taxAmount : 0);

  // Total cost and estimated margin
  const totalCost = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  }, [cart]);

  const grossProfit = grandTotal - totalCost;
  const marginPercent = grandTotal > 0 ? (grossProfit / grandTotal) * 100 : 0;

  // On successful sale
  const handleConfirmPayment = (paymentDetails: PaymentDetails) => {
    const result = storageService.processSale(
      cart,
      selectedCustomer,
      subtotal,
      discountTotal,
      taxAmount,
      isVatEnabled ? settings.vatRate : 0,
      grandTotal,
      paymentDetails
    );

    if (result.success && result.sale) {
      setCompletedSale(result.sale);
      setIsPaymentOpen(false);
      setCart([]);
      setOverallDiscountAmount(0);
      onRefreshData();
      onShowToast('success', 'ບັນທຶກການຂາຍສຳເລັດ', `ເລກທີໃບບິນ: ${result.sale.receiptNumber}`);
    } else {
      onShowToast('error', 'ບັນທຶກການຂາຍບໍ່ສຳເລັດ', result.error || 'ກະລຸນາກວດສອບສະຕັອກສິນຄ້າ');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-950 overflow-hidden font-sans">
      {/* LEFT SIDE: Product Catalog & Fast Search */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Search Bar & Scanner trigger */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="ສະແກນບາໂຄດ ຫຼື ພິມຊື່ສິນຄ້າ / SKU [ກົດ Enter ເພື່ອໃສ່ກະຕ່າ]..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Camera Barcode Scanner Button */}
          <button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer transition-all active:scale-95 whitespace-nowrap shrink-0"
            title="ສະແກນບາໂຄ້ດດ້ວຍກ້ອງ (Camera Barcode Scanner)"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">ສະແກນດ້ວຍກ້ອງ</span>
          </button>

          {/* Quick barcode simulation buttons for testing */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500">
            <Barcode className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-[11px] text-slate-400">ບາໂຄດດ່ວນ:</span>
            <button
              onClick={() => {
                const beer = products.find((p) => p.sku === 'BEV-BL-001');
                if (beer) handleAddToCart(beer);
              }}
              className="px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded text-[11px] font-sans font-medium cursor-pointer"
            >
              ເບຍລາວ
            </button>
            <button
              onClick={() => {
                const rice = products.find((p) => p.sku === 'RICE-NOY-003');
                if (rice) handleAddToCart(rice);
              }}
              className="px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded text-[11px] font-sans font-medium cursor-pointer"
            >
              ເຂົ້າໄກ່ນ້ອຍ
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            ທັງໝົດ ({products.filter((p) => p.status === 'ACTIVE').length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.name
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-3.5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((product) => {
            const isLowStock = product.currentStock <= product.minStockAlert;
            const isOutOfStock = product.currentStock <= 0;

            return (
              <div
                key={product.id}
                onClick={() => handleAddToCart(product)}
                className={`group relative bg-white dark:bg-slate-800/90 rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden cursor-pointer select-none ${
                  isOutOfStock
                    ? 'opacity-60 border-rose-300 dark:border-rose-900/40'
                    : 'border-slate-200 dark:border-slate-700/80 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5'
                }`}
              >
                {/* Product Image */}
                <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Stock Badge */}
                  <span
                    className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                      isOutOfStock
                        ? 'bg-rose-600 text-white'
                        : isLowStock
                        ? 'bg-amber-500 text-white'
                        : 'bg-black/60 backdrop-blur-xs text-white'
                    }`}
                  >
                    {isOutOfStock
                      ? 'ໝົດສະຕັອກ'
                      : `ຄົງເຫຼືອ ${product.currentStock} ${product.baseUnit}`}
                  </span>

                  {/* Wholesale badge */}
                  {product.wholesaleMinQty && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-blue-600/90 backdrop-blur-xs text-white text-[9px] font-bold">
                      ສົ່ງ {product.wholesaleMinQty}+ {product.baseUnit}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-medium text-slate-400 truncate block">
                      {product.sku}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 leading-snug mt-0.5">
                      {product.name}
                    </h4>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">ຂາຍຍ່ອຍ</span>
                      <span className="font-extrabold text-sm text-blue-600 dark:text-blue-400">
                        {formatCurrency(product.retailPrice, settings.currency)}
                      </span>
                    </div>
                    {product.wholesalePrice > 0 && (
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                          ຂາຍສົ່ງ
                        </span>
                        <span className="font-bold text-xs text-slate-700 dark:text-slate-300 font-mono">
                          {formatCurrency(product.wholesalePrice, settings.currency)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">ບໍ່ພົບລາຍການສິນຄ້າທີ່ຄົ້ນຫາ</p>
              <p className="text-xs mt-1">ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ເລືອກໝວດໝູ່ໃໝ່</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Cart & Checkout Panel */}
      <div className="w-full lg:w-96 xl:w-[420px] bg-white dark:bg-slate-900 flex flex-col shadow-xl z-10 shrink-0">
        {/* Customer Selector & Tier Bar */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              ລູກຄ້າ ແລະ ລະດັບລາຄາ
            </span>
            {selectedCustomer.priceTierDiscountPercent ? (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                ຫຼຸດພິເສດ {selectedCustomer.priceTierDiscountPercent}%
              </span>
            ) : null}
          </div>

          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.customerType}) {c.currentDebt > 0 ? `[ໜີ້ຄ້າງ ${formatCurrency(c.currentDebt, settings.currency)}]` : ''}
              </option>
            ))}
          </select>

          {/* Credit limit warning if wholesale customer */}
          {selectedCustomer.creditLimit > 0 && (
            <div className="text-[11px] text-slate-500 flex justify-between px-1">
              <span>ວົງເງິນເຄຣດິດ: {formatCurrency(selectedCustomer.creditLimit, settings.currency)}</span>
              <span>ໜີ້ຄ້າງ: <strong className="text-amber-600">{formatCurrency(selectedCustomer.currentDebt, settings.currency)}</strong></span>
            </div>
          )}
        </div>

        {/* Cart Items Header */}
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>ລາຍການໃນກະຕ່າ ({cart.reduce((sum, it) => sum + it.quantity, 0)} ຫົວໜ່ວຍ)</span>
          {cart.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              ລ້າງກະຕ່າ
            </button>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {cart.map((item, idx) => {
            const isBelowCost = item.appliedUnitPrice < item.unitCost;

            return (
              <div
                key={`${item.product.id}-${item.unit}`}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {item.product.name}
                    </h5>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono">{item.product.sku}</span>
                      {item.tierApplied && (
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.2 rounded font-sans">
                          {item.tierApplied}
                        </span>
                      )}
                      {isBelowCost && (
                        <span className="text-[9px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded">
                          ຫຼຸດຕົ້ນທຶນ!
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Price, Quantity & Subtotal Row */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 overflow-hidden">
                    <button
                      onClick={() => handleUpdateQty(idx, item.quantity - 1)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateQty(idx, parseInt(e.target.value) || 1)}
                      className="w-12 text-center text-xs font-bold font-mono py-0.5 bg-transparent border-none focus:outline-hidden text-slate-900 dark:text-white"
                    />
                    <button
                      onClick={() => handleUpdateQty(idx, item.quantity + 1)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Unit price indicator */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-mono">
                      @{formatCurrency(item.appliedUnitPrice, settings.currency)}/{item.unit}
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white font-mono">
                      {formatCurrency(item.total, settings.currency)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Tag className="w-10 h-10 mb-2 opacity-30 stroke-[1.5]" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">ຍັງບໍ່ມີສິນຄ້າໃນກະຕ່າ</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                ກົດເລືອກສິນຄ້າ ຫຼື ສະແກນບາໂຄດເພື່ອເລີ່ມຕົ້ນການຂາຍ
              </p>
            </div>
          )}
        </div>

        {/* Cart Calculation & Summary Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 space-y-2.5">
          {/* Subtotal */}
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>ຍອດລວມສິນຄ້າ:</span>
            <span className="font-mono font-bold">{formatCurrency(subtotal, settings.currency)}</span>
          </div>

          {/* Discount input */}
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-emerald-600" />
              ສ່ວນຫຼຸດທ້າຍບິນ:
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                step="any"
                value={overallDiscountAmount || ''}
                onChange={(e) => setOverallDiscountAmount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-24 px-2 py-0.5 text-right font-mono text-xs font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <span className="text-slate-400 text-[10px]">₭</span>
            </div>
          </div>

          {/* VAT Toggle */}
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isVatEnabled}
                onChange={(e) => setIsVatEnabled(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>ອາກອນ VAT ({settings.vatRate}%)</span>
            </label>
            <span className="font-mono font-bold">
              {formatCurrency(taxAmount, settings.currency)}
            </span>
          </div>

          {/* Estimated Profit & Margin indicator */}
          {(currentUser.role === 'OWNER' || currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && cart.length > 0 && (
            <div className="p-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-[11px]">
              <span className="text-blue-700 dark:text-blue-300 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                ກຳໄລຂັ້ນຕົ້ນ (GP):
              </span>
              <span className="font-bold text-blue-800 dark:text-blue-200 font-mono">
                {formatCurrency(grossProfit, settings.currency)} ({marginPercent.toFixed(1)}%)
              </span>
            </div>
          )}

          {/* Grand Total */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-baseline justify-between">
            <span className="font-bold text-sm text-slate-900 dark:text-white">ຍອດຊຳລະສຸດທິ:</span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">
              {formatCurrency(grandTotal, settings.currency)}
            </span>
          </div>

          {/* Checkout Button */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => setIsPaymentOpen(true)}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <span>ຊຳລະເງິນ (F12 / Checkout)</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        grandTotal={grandTotal}
        customer={selectedCustomer}
        cartItems={cart}
        settings={settings}
        currentUser={currentUser}
        onClose={() => setIsPaymentOpen(false)}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        sale={completedSale}
        settings={settings}
        onClose={() => setCompletedSale(null)}
        onNewSale={() => setCompletedSale(null)}
      />

      {/* Camera Barcode Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={handleCameraBarcodeScanned}
        products={products}
        title="ສະແກນບາໂຄ້ດຂາຍສິນຄ້າ"
        subtitle="ນຳບາໂຄ້ດ ຫຼື QR Code ຂອງສິນຄ້າມາສ່ອງໃສ່ກ້ອງເພື່ອເພີ່ມລົງກະຕ່າ"
      />
    </div>
  );
};
