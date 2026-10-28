/**
 * Smart POS & Wholesale Management System
 * Comprehensive Data Types & Models
 */

export type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAREHOUSE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  pin?: string;
  avatar?: string;
}

export type Currency = 'THB' | 'LAK' | 'VND';
export type Language = 'th' | 'en' | 'lo' | 'vi';

export interface PriceTier {
  minQty: number;
  price: number;
  label?: string; // e.g. "ขายส่ง 10-49 ชิ้น"
}

export interface UnitConversion {
  unitName: string; // e.g. "ลัง", "แพ็ค", "กล่อง"
  multiplier: number; // e.g. 1 ลัง = 24 ชิ้น
  barcode?: string;
  retailPrice?: number;
  wholesalePrice?: number;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  baseUnit: string; // e.g. "ชิ้น", "ขวด", "ซอง"
  units?: UnitConversion[];
  costPrice: number; // ราคาทุนต่อ baseUnit
  retailPrice: number; // ราคาขายปลีกต่อ baseUnit
  wholesalePrice: number; // ราคาขายส่งมาตรฐาน
  wholesaleMinQty: number; // จำนวนขั้นต่ำสำหรับราคาส่ง
  priceTiers: PriceTier[]; // ตารางราคาหลายระดับตามจำนวน
  currentStock: number; // จำนวนสต็อกคงเหลือ
  minStockAlert: number; // จุดเตือนสต็อกขั้นต่ำ
  warehouseId: string;
  supplierId?: string;
  imageUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location: string;
  isDefault?: boolean;
}

export type CustomerType = 'RETAIL' | 'WHOLESALE_A' | 'WHOLESALE_B' | 'VIP';

export interface Customer {
  id: string;
  code: string;
  name: string;
  companyName?: string;
  phone: string;
  email?: string;
  taxId?: string;
  address: string;
  customerType: CustomerType;
  priceTierDiscountPercent?: number; // ส่วนลดพิเศษประจำตัวลูกค้า (%)
  creditLimit: number; // วงเงินเครดิตที่อนุญาต
  creditDays: number; // ระยะเวลาเครดิต (วัน)
  currentDebt: number; // ยอดหนี้ค้างชำระปัจจุบัน
  totalPurchased: number; // ยอดซื้อสะสม
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  taxId?: string;
  address: string;
  currentPayable: number; // ยอดค้างชำระเจ้าหนี้
  creditDays: number;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit: string;
  unitMultiplier: number;
  unitCost: number;
  appliedUnitPrice: number;
  originalUnitPrice: number;
  tierApplied?: string;
  discountAmount: number; // ส่วนลดต่อรายการ
  total: number;
  note?: string;
  isPriceOverridden?: boolean;
  overriddenBy?: string;
}

export type PaymentMethod = 'CASH' | 'PROMPTPAY' | 'TRANSFER' | 'CREDIT';

export interface PaymentDetails {
  method: PaymentMethod;
  amount: number;
  cashReceived?: number;
  change?: number;
  referenceNumber?: string;
  dueDate?: string; // กรณีขายเชื่อ
}

export interface SaleTransaction {
  id: string;
  receiptNumber: string;
  createdAt: string;
  cashierId: string;
  cashierName: string;
  customerId: string;
  customerName: string;
  customerType: CustomerType;
  items: {
    productId: string;
    productName: string;
    sku: string;
    unit: string;
    quantity: number;
    unitCost: number;
    unitPrice: number;
    subtotal: number;
    discount: number;
    total: number;
    tierApplied?: string;
  }[];
  subtotal: number;
  discountTotal: number;
  taxAmount: number; // VAT
  taxRate: number; // % เช่น 7% หรือ 0%
  grandTotal: number;
  totalCost: number; // ต้นทุนสินค้ารวม
  grossProfit: number; // กำไรขั้นต้น
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails;
  status: 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  shiftId?: string;
  isCreditSale?: boolean;
  isDebtPaid?: boolean;
}

export type MovementType = 
  | 'PURCHASE_RECEIPT' 
  | 'SALE' 
  | 'SALE_CANCEL' 
  | 'ADJUST_DAMAGE' 
  | 'ADJUST_COUNT' 
  | 'TRANSFER_IN' 
  | 'TRANSFER_OUT';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  type: MovementType;
  quantityChange: number; // บวก หรือ ลบ
  quantityBefore: number;
  quantityAfter: number;
  referenceId?: string; // เลขที่ใบเสร็จ หรือ PO
  reason?: string;
  unitCost?: number;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number; // ราคาทุนซื้อ
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  createdAt: string;
  expectedDate?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  shippingFee: number;
  otherFees: number;
  grandTotal: number;
  status: 'DRAFT' | 'PENDING' | 'RECEIVED' | 'CANCELLED';
  isPaid: boolean;
  paidAmount: number;
  receivedAt?: string;
  receivedBy?: string;
  note?: string;
}

export type ExpenseCategory = 
  | 'RENT' 
  | 'SALARY' 
  | 'UTILITIES' 
  | 'SHIPPING' 
  | 'SUPPLIES' 
  | 'MARKETING' 
  | 'MAINTENANCE' 
  | 'OTHER';

export type FinancialTransactionType = 
  | 'SALE_INCOME' 
  | 'CUSTOMER_DEBT_PAYMENT' 
  | 'CAPITAL_INJECTION' // ทุนเจ้าของ (ไม่นับเป็นยอดขาย)
  | 'EXPENSE' 
  | 'SUPPLIER_PAYMENT' 
  | 'OWNER_DRAW'; // ถอนทุน

export interface FinancialRecord {
  id: string;
  date: string;
  type: FinancialTransactionType;
  category?: ExpenseCategory | string;
  title: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceId?: string;
  note?: string;
  recordedBy: string;
  shiftId?: string;
}

export interface CashShift {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  openingCash: number;
  expectedCash: number;
  actualCash?: number;
  cashDifference?: number;
  totalSales: number;
  totalCashSales: number;
  totalPromptPaySales: number;
  totalCreditSales: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  module: 'POS' | 'PRODUCT' | 'INVENTORY' | 'FINANCE' | 'CUSTOMER' | 'SUPPLIER' | 'AUTH' | 'SETTINGS';
  details: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
}

export interface StoreSettings {
  storeName: string;
  storeBranch: string;
  taxId: string;
  phone: string;
  address: string;
  receiptHeader: string;
  receiptFooter: string;
  currency: Currency;
  language: Language;
  enableVat: boolean;
  vatRate: number; // e.g. 7
  allowNegativeStock: boolean;
  requireManagerApprovalForBelowCost: boolean;
  exchangeRates: {
    THB: number; // base 1
    LAK: number; // e.g. 650 LAK per THB
    VND: number; // e.g. 700 VND per THB
  };
}
