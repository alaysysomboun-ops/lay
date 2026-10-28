import {
  Product, Customer, Supplier, SaleTransaction, StockMovement,
  PurchaseOrder, FinancialRecord, CashShift, StoreSettings, AuditLog,
  User, CartItem, PaymentDetails, Role
} from '../types';
import {
  INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_SUPPLIERS,
  INITIAL_SALES, INITIAL_FINANCIAL_RECORDS, INITIAL_SHIFTS,
  INITIAL_SETTINGS, INITIAL_USERS, INITIAL_AUDIT_LOGS
} from '../data/initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'smartpos_products_v1',
  CUSTOMERS: 'smartpos_customers_v1',
  SUPPLIERS: 'smartpos_suppliers_v1',
  SALES: 'smartpos_sales_v1',
  MOVEMENTS: 'smartpos_movements_v1',
  PURCHASE_ORDERS: 'smartpos_purchase_orders_v1',
  FINANCE: 'smartpos_finance_v1',
  SHIFTS: 'smartpos_shifts_v1',
  SETTINGS: 'smartpos_settings_v1',
  AUDIT_LOGS: 'smartpos_audit_logs_v1',
  CURRENT_USER: 'smartpos_current_user_v1',
};

class StorageService {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Failed to load ${key} from storage:`, e);
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save ${key} to storage:`, e);
    }
  }

  // Current logged in user
  getCurrentUser(): User {
    return this.getItem<User>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  }

  setCurrentUser(user: User): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_SWITCH',
      module: 'AUTH',
      details: `สลับบทบาทผู้ใช้เป็น ${user.name} (${user.role})`,
    });
  }

  getUsers(): User[] {
    return INITIAL_USERS;
  }

  // Settings
  getSettings(): StoreSettings {
    return this.getItem<StoreSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  updateSettings(settings: StoreSettings): void {
    this.setItem(STORAGE_KEYS.SETTINGS, settings);
    const user = this.getCurrentUser();
    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE_SETTINGS',
      module: 'SETTINGS',
      details: 'อัปเดตข้อมูลร้านค้าและการตั้งค่าระบบ',
    });
  }

  // Products
  getProducts(): Product[] {
    return this.getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }

  saveProduct(product: Product): void {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    const user = this.getCurrentUser();
    
    if (index >= 0) {
      const oldProd = products[index];
      products[index] = { ...product, updatedAt: new Date().toISOString() };
      this.logAudit({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'UPDATE_PRODUCT',
        module: 'PRODUCT',
        details: `แก้ไขสินค้า ${product.name} (SKU: ${product.sku}) - ทุน: ${product.costPrice}, ปลีก: ${product.retailPrice}, ส่ง: ${product.wholesalePrice}`,
        oldValue: JSON.stringify({ cost: oldProd.costPrice, retail: oldProd.retailPrice, stock: oldProd.currentStock }),
        newValue: JSON.stringify({ cost: product.costPrice, retail: product.retailPrice, stock: product.currentStock }),
      });
    } else {
      products.unshift({
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      this.logAudit({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'CREATE_PRODUCT',
        module: 'PRODUCT',
        details: `เพิ่มสินค้าใหม่ ${product.name} (SKU: ${product.sku}) สต็อกเริ่มต้น: ${product.currentStock}`,
      });
    }
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
  }

  deleteProduct(productId: string): void {
    const products = this.getProducts();
    const target = products.find(p => p.id === productId);
    const filtered = products.filter(p => p.id !== productId);
    this.setItem(STORAGE_KEYS.PRODUCTS, filtered);
    if (target) {
      const user = this.getCurrentUser();
      this.logAudit({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'DELETE_PRODUCT',
        module: 'PRODUCT',
        details: `ลบสินค้า ${target.name} (SKU: ${target.sku})`,
      });
    }
  }

  // Customers
  getCustomers(): Customer[] {
    return this.getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }

  saveCustomer(customer: Customer): void {
    const customers = this.getCustomers();
    const idx = customers.findIndex(c => c.id === customer.id);
    if (idx >= 0) {
      customers[idx] = customer;
    } else {
      customers.push(customer);
    }
    this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
  }

  // Suppliers
  getSuppliers(): Supplier[] {
    return this.getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  }

  saveSupplier(supplier: Supplier): void {
    const suppliers = this.getSuppliers();
    const idx = suppliers.findIndex(s => s.id === supplier.id);
    if (idx >= 0) {
      suppliers[idx] = supplier;
    } else {
      suppliers.push(supplier);
    }
    this.setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
  }

  // Sales
  getSales(): SaleTransaction[] {
    return this.getItem<SaleTransaction[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
  }

  // Shifts
  getShifts(): CashShift[] {
    return this.getItem<CashShift[]>(STORAGE_KEYS.SHIFTS, INITIAL_SHIFTS);
  }

  getCurrentShift(): CashShift | undefined {
    const shifts = this.getShifts();
    return shifts.find(s => s.status === 'OPEN');
  }

  openShift(openingCash: number): CashShift {
    const user = this.getCurrentUser();
    const shifts = this.getShifts();
    
    // Close any previous open shift safely
    shifts.forEach(s => {
      if (s.status === 'OPEN') s.status = 'CLOSED';
    });

    const newShift: CashShift = {
      id: `shift-${Date.now()}`,
      cashierId: user.id,
      cashierName: user.name,
      startTime: new Date().toISOString(),
      openingCash,
      expectedCash: openingCash,
      totalSales: 0,
      totalCashSales: 0,
      totalPromptPaySales: 0,
      totalCreditSales: 0,
      status: 'OPEN',
    };

    shifts.unshift(newShift);
    this.setItem(STORAGE_KEYS.SHIFTS, shifts);

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'OPEN_SHIFT',
      module: 'FINANCE',
      details: `เปิดกะการขาย เงินทอนเริ่มต้น: ${openingCash.toLocaleString()} บาท`,
    });

    return newShift;
  }

  closeShift(actualCash: number, notes?: string): CashShift | undefined {
    const shifts = this.getShifts();
    const current = shifts.find(s => s.status === 'OPEN');
    if (!current) return undefined;

    const user = this.getCurrentUser();
    current.status = 'CLOSED';
    current.endTime = new Date().toISOString();
    current.actualCash = actualCash;
    current.cashDifference = actualCash - current.expectedCash;
    current.notes = notes;

    this.setItem(STORAGE_KEYS.SHIFTS, shifts);

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CLOSE_SHIFT',
      module: 'FINANCE',
      details: `ปิดกะการขาย ยอดคาดหวัง: ${current.expectedCash.toLocaleString()} บาท, นับได้จริง: ${actualCash.toLocaleString()} บาท, ส่วนต่าง: ${current.cashDifference.toLocaleString()} บาท`,
    });

    return current;
  }

  /**
   * ATOMIC POS TRANSACTION:
   * Process Sale, deduct stock, update customer AR, update shift cash, log movements & audit
   */
  processSale(
    items: CartItem[],
    customer: Customer,
    subtotal: number,
    discountTotal: number,
    taxAmount: number,
    taxRate: number,
    grandTotal: number,
    paymentDetails: PaymentDetails
  ): { success: boolean; sale?: SaleTransaction; error?: string } {
    const settings = this.getSettings();
    const products = this.getProducts();
    const user = this.getCurrentUser();
    const now = new Date();
    const dateStr = now.toISOString();

    // 1. Validate Stock availability if allowNegativeStock is false
    if (!settings.allowNegativeStock) {
      for (const item of items) {
        const prod = products.find(p => p.id === item.product.id);
        const deductionQty = item.quantity * (item.unitMultiplier || 1);
        if (!prod || prod.currentStock < deductionQty) {
          return {
            success: false,
            error: `สินค้า "${item.product.name}" มีสต็อกคงเหลือเพียง ${prod?.currentStock || 0} ${item.product.baseUnit} ไม่พอสำหรับการขาย ${deductionQty} ${item.product.baseUnit}`,
          };
        }
      }
    }

    // 2. Generate Receipt ID: INV-YYYYMMDD-XXXX
    const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randSeq = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `INV-${datePrefix}-${randSeq}`;

    // 3. Compute cost and gross profit
    let totalCost = 0;
    const saleItems = items.map(it => {
      const totalUnits = it.quantity * (it.unitMultiplier || 1);
      const itemCost = totalUnits * it.unitCost;
      totalCost += itemCost;
      return {
        productId: it.product.id,
        productName: it.product.name,
        sku: it.product.sku,
        unit: it.unit,
        quantity: it.quantity,
        unitCost: it.unitCost,
        unitPrice: it.appliedUnitPrice,
        subtotal: it.quantity * it.appliedUnitPrice,
        discount: it.discountAmount,
        total: it.total,
        tierApplied: it.tierApplied,
      };
    });

    const grossProfit = grandTotal - totalCost;
    const isCredit = paymentDetails.method === 'CREDIT';

    // 4. Create Sale Record
    const newSale: SaleTransaction = {
      id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      receiptNumber,
      createdAt: dateStr,
      cashierId: user.id,
      cashierName: user.name,
      customerId: customer.id,
      customerName: customer.name,
      customerType: customer.customerType,
      items: saleItems,
      subtotal,
      discountTotal,
      taxAmount,
      taxRate,
      grandTotal,
      totalCost,
      grossProfit,
      paymentMethod: paymentDetails.method,
      paymentDetails,
      status: 'COMPLETED',
      isCreditSale: isCredit,
      isDebtPaid: !isCredit,
    };

    // 5. Deduct Stock & Record Movements
    const movements: StockMovement[] = this.getItem<StockMovement[]>(STORAGE_KEYS.MOVEMENTS, []);
    
    for (const item of items) {
      const pIndex = products.findIndex(p => p.id === item.product.id);
      if (pIndex >= 0) {
        const prod = products[pIndex];
        const deductionQty = item.quantity * (item.unitMultiplier || 1);
        const qtyBefore = prod.currentStock;
        const qtyAfter = qtyBefore - deductionQty;
        prod.currentStock = qtyAfter;
        prod.updatedAt = dateStr;

        movements.unshift({
          id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          warehouseId: prod.warehouseId || 'wh-front',
          type: 'SALE',
          quantityChange: -deductionQty,
          quantityBefore: qtyBefore,
          quantityAfter: qtyAfter,
          referenceId: receiptNumber,
          unitCost: prod.costPrice,
          userId: user.id,
          userName: user.name,
          createdAt: dateStr,
        });
      }
    }

    // 6. Update Customer info if registered customer
    const customers = this.getCustomers();
    const custIdx = customers.findIndex(c => c.id === customer.id);
    if (custIdx >= 0) {
      customers[custIdx].totalPurchased = (customers[custIdx].totalPurchased || 0) + grandTotal;
      if (isCredit) {
        customers[custIdx].currentDebt = (customers[custIdx].currentDebt || 0) + grandTotal;
      }
      this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
    }

    // 7. Update Active Shift
    const shifts = this.getShifts();
    const curShift = shifts.find(s => s.status === 'OPEN');
    if (curShift) {
      curShift.totalSales += grandTotal;
      if (paymentDetails.method === 'CASH') {
        curShift.totalCashSales += grandTotal;
        curShift.expectedCash += grandTotal;
      } else if (paymentDetails.method === 'PROMPTPAY' || paymentDetails.method === 'TRANSFER') {
        curShift.totalPromptPaySales += grandTotal;
      } else if (paymentDetails.method === 'CREDIT') {
        curShift.totalCreditSales += grandTotal;
      }
      this.setItem(STORAGE_KEYS.SHIFTS, shifts);
    }

    // 8. Save Products, Sales, Movements
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
    
    const sales = this.getSales();
    sales.unshift(newSale);
    this.setItem(STORAGE_KEYS.SALES, sales);
    this.setItem(STORAGE_KEYS.MOVEMENTS, movements);

    // 9. Audit Log
    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'SALE_CHECKOUT',
      module: 'POS',
      details: `ขายสินค้าสำเร็จ ${receiptNumber} ยอดรวม ${grandTotal.toLocaleString()} บาท (${paymentDetails.method}) โดย ${user.name}`,
    });

    return { success: true, sale: newSale };
  }

  // Cancel or Refund Sale
  refundSale(saleId: string, reason: string): { success: boolean; error?: string } {
    const sales = this.getSales();
    const target = sales.find(s => s.id === saleId);
    if (!target) return { success: false, error: 'ไม่พบรายการขายที่ต้องการยกเลิก' };
    if (target.status !== 'COMPLETED') return { success: false, error: 'รายการนี้ถูกยกเลิกไปแล้ว' };

    const user = this.getCurrentUser();
    const products = this.getProducts();
    const movements = this.getItem<StockMovement[]>(STORAGE_KEYS.MOVEMENTS, []);
    const nowStr = new Date().toISOString();

    // Restock items
    for (const item of target.items) {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        const qtyBefore = prod.currentStock;
        const qtyAfter = qtyBefore + item.quantity;
        prod.currentStock = qtyAfter;
        prod.updatedAt = nowStr;

        movements.unshift({
          id: `mov-refund-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          warehouseId: prod.warehouseId || 'wh-front',
          type: 'SALE_CANCEL',
          quantityChange: item.quantity,
          quantityBefore: qtyBefore,
          quantityAfter: qtyAfter,
          referenceId: target.receiptNumber,
          reason,
          unitCost: prod.costPrice,
          userId: user.id,
          userName: user.name,
          createdAt: nowStr,
        });
      }
    }

    // If was credit, reduce debt
    if (target.isCreditSale) {
      const customers = this.getCustomers();
      const cust = customers.find(c => c.id === target.customerId);
      if (cust) {
        cust.currentDebt = Math.max(0, (cust.currentDebt || 0) - target.grandTotal);
        this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
      }
    }

    target.status = 'CANCELLED';
    target.cancellationReason = reason;
    target.cancelledAt = nowStr;
    target.cancelledBy = user.name;

    this.setItem(STORAGE_KEYS.SALES, sales);
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
    this.setItem(STORAGE_KEYS.MOVEMENTS, movements);

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CANCEL_SALE',
      module: 'POS',
      details: `ยกเลิกการขาย ${target.receiptNumber} ยอด ${target.grandTotal.toLocaleString()} บาท เหตุผล: ${reason}`,
    });

    return { success: true };
  }

  // Stock Movement & Adjustment
  adjustStock(
    productId: string,
    adjustedQty: number,
    type: 'ADJUST_COUNT' | 'ADJUST_DAMAGE' | 'PURCHASE_RECEIPT',
    reason: string
  ): void {
    const products = this.getProducts();
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const user = this.getCurrentUser();
    const qtyBefore = prod.currentStock;
    const qtyChange = type === 'ADJUST_COUNT' ? (adjustedQty - qtyBefore) : adjustedQty;
    const qtyAfter = type === 'ADJUST_COUNT' ? adjustedQty : (qtyBefore + adjustedQty);

    prod.currentStock = Math.max(0, qtyAfter);
    prod.updatedAt = new Date().toISOString();

    const movements = this.getItem<StockMovement[]>(STORAGE_KEYS.MOVEMENTS, []);
    movements.unshift({
      id: `mov-adj-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      warehouseId: prod.warehouseId || 'wh-front',
      type,
      quantityChange: qtyChange,
      quantityBefore: qtyBefore,
      quantityAfter: prod.currentStock,
      reason,
      unitCost: prod.costPrice,
      userId: user.id,
      userName: user.name,
      createdAt: new Date().toISOString(),
    });

    this.setItem(STORAGE_KEYS.PRODUCTS, products);
    this.setItem(STORAGE_KEYS.MOVEMENTS, movements);

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'ADJUST_STOCK',
      module: 'INVENTORY',
      details: `ปรับสต็อก ${prod.name} (${type}) จาก ${qtyBefore} เป็น ${prod.currentStock} ชิ้น เหตุผล: ${reason}`,
    });
  }

  getStockMovements(): StockMovement[] {
    return this.getItem<StockMovement[]>(STORAGE_KEYS.MOVEMENTS, []);
  }

  // Finance Records
  getFinancialRecords(): FinancialRecord[] {
    return this.getItem<FinancialRecord[]>(STORAGE_KEYS.FINANCE, INITIAL_FINANCIAL_RECORDS);
  }

  addFinancialRecord(record: Omit<FinancialRecord, 'id' | 'recordedBy'>): FinancialRecord {
    const records = this.getFinancialRecords();
    const user = this.getCurrentUser();
    const newRecord: FinancialRecord = {
      ...record,
      id: `fin-${Date.now()}`,
      recordedBy: user.name,
    };

    records.unshift(newRecord);
    this.setItem(STORAGE_KEYS.FINANCE, records);

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'FINANCE_ENTRY',
      module: 'FINANCE',
      details: `บันทึกรายการการเงิน: ${newRecord.title} (${newRecord.type}) จำนวน ${newRecord.amount.toLocaleString()} บาท`,
    });

    return newRecord;
  }

  // Customer Debt Collection (AR Payment)
  collectCustomerDebt(
    customerId: string,
    amount: number,
    paymentMethod: any,
    note?: string
  ): { success: boolean; error?: string } {
    const customers = this.getCustomers();
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return { success: false, error: 'ไม่พบข้อมูลลูกค้า' };

    cust.currentDebt = Math.max(0, (cust.currentDebt || 0) - amount);
    this.setItem(STORAGE_KEYS.CUSTOMERS, customers);

    // Add financial record as CUSTOMER_DEBT_PAYMENT (NOT sale revenue to prevent double-counting)
    this.addFinancialRecord({
      date: new Date().toISOString().split('T')[0],
      type: 'CUSTOMER_DEBT_PAYMENT',
      title: `รับชำระหนี้จาก ${cust.name}`,
      amount,
      paymentMethod,
      referenceId: cust.code,
      note: note || `ชำระหนี้ค้าง คงเหลือหนี้: ${cust.currentDebt.toLocaleString()} บาท`,
    });

    return { success: true };
  }

  // Supplier Debt Payment (AP Payment)
  paySupplierDebt(
    supplierId: string,
    amount: number,
    paymentMethod: any,
    note?: string
  ): { success: boolean; error?: string } {
    const suppliers = this.getSuppliers();
    const sup = suppliers.find(s => s.id === supplierId);
    if (!sup) return { success: false, error: 'ไม่พบข้อมูลซัพพลายเออร์' };

    sup.currentPayable = Math.max(0, (sup.currentPayable || 0) - amount);
    this.setItem(STORAGE_KEYS.SUPPLIERS, suppliers);

    this.addFinancialRecord({
      date: new Date().toISOString().split('T')[0],
      type: 'SUPPLIER_PAYMENT',
      title: `จ่ายชำระหนี้ให้เจ้าหนี้ ${sup.name}`,
      amount,
      paymentMethod,
      referenceId: sup.code,
      note: note || `จ่ายชำระหนี้ คงเหลือยอดเจ้าหนี้: ${sup.currentPayable.toLocaleString()} บาท`,
    });

    return { success: true };
  }

  // Purchase Orders
  getPurchaseOrders(): PurchaseOrder[] {
    return this.getItem<PurchaseOrder[]>(STORAGE_KEYS.PURCHASE_ORDERS, []);
  }

  savePurchaseOrder(po: PurchaseOrder): void {
    const pos = this.getPurchaseOrders();
    const idx = pos.findIndex(p => p.id === po.id);
    if (idx >= 0) {
      pos[idx] = po;
    } else {
      pos.unshift(po);
    }
    this.setItem(STORAGE_KEYS.PURCHASE_ORDERS, pos);
  }

  receivePurchaseOrder(poId: string): { success: boolean; error?: string } {
    const pos = this.getPurchaseOrders();
    const po = pos.find(p => p.id === poId);
    if (!po) return { success: false, error: 'ไม่พบใบสั่งซื้อ' };
    if (po.status === 'RECEIVED') return { success: false, error: 'รับสินค้านี้เข้าคลังแล้ว' };

    const user = this.getCurrentUser();
    const products = this.getProducts();
    const movements = this.getItem<StockMovement[]>(STORAGE_KEYS.MOVEMENTS, []);
    const dateStr = new Date().toISOString();

    for (const item of po.items) {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        const qtyBefore = prod.currentStock;
        const qtyAfter = qtyBefore + item.quantity;
        prod.currentStock = qtyAfter;
        prod.updatedAt = dateStr;

        movements.unshift({
          id: `mov-po-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          warehouseId: prod.warehouseId || 'wh-front',
          type: 'PURCHASE_RECEIPT',
          quantityChange: item.quantity,
          quantityBefore: qtyBefore,
          quantityAfter: qtyAfter,
          referenceId: po.poNumber,
          unitCost: item.unitPrice,
          userId: user.id,
          userName: user.name,
          createdAt: dateStr,
        });
      }
    }

    po.status = 'RECEIVED';
    po.receivedAt = dateStr;
    po.receivedBy = user.name;

    // Update supplier payable
    const suppliers = this.getSuppliers();
    const sup = suppliers.find(s => s.id === po.supplierId);
    if (sup) {
      sup.currentPayable = (sup.currentPayable || 0) + po.grandTotal;
      this.setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
    }

    this.setItem(STORAGE_KEYS.PURCHASE_ORDERS, pos);
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
    this.setItem(STORAGE_KEYS.MOVEMENTS, movements);

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'RECEIVE_PO',
      module: 'INVENTORY',
      details: `รับสินค้าตามใบสั่งซื้อ ${po.poNumber} ยอด ${po.grandTotal.toLocaleString()} บาท เข้าคลังเรียบร้อย`,
    });

    return { success: true };
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Keep last 500 logs
    if (logs.length > 500) logs.pop();
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // Reset demo data
  resetAllToDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.SUPPLIERS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.PURCHASE_ORDERS);
    localStorage.removeItem(STORAGE_KEYS.FINANCE);
    localStorage.removeItem(STORAGE_KEYS.SHIFTS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

export const storageService = new StorageService();
