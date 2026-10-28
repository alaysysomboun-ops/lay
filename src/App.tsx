/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Product, Customer, Supplier, SaleTransaction, StockMovement,
  PurchaseOrder, FinancialRecord, CashShift, StoreSettings, User, Role,
  Currency, Language, PaymentMethod
} from './types';
import { storageService } from './services/storageService';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { ToastContainer, ToastMessage } from './components/common/NotificationToast';
import { RoleSwitcherModal } from './components/common/RoleSwitcherModal';
import { ConfirmModal } from './components/common/ConfirmModal';
import { POSScreen } from './components/pos/POSScreen';
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { ProductListScreen } from './components/products/ProductListScreen';
import { InventoryScreen } from './components/inventory/InventoryScreen';
import { CustomerListScreen } from './components/customers/CustomerListScreen';
import { SupplierListScreen } from './components/suppliers/SupplierListScreen';
import { FinanceScreen } from './components/finance/FinanceScreen';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { AuditLogsScreen } from './components/audit/AuditLogsScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { ShiftModal } from './components/finance/ShiftModal';
import { INITIAL_CATEGORIES } from './data/initialData';

export default function App() {
  // Core State
  const [currentUser, setCurrentUser] = useState<User>(() => storageService.getCurrentUser());
  const [settings, setSettings] = useState<StoreSettings>(() => storageService.getSettings());
  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [customers, setCustomers] = useState<Customer[]>(() => storageService.getCustomers());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => storageService.getSuppliers());
  const [sales, setSales] = useState<SaleTransaction[]>(() => storageService.getSales());
  const [movements, setMovements] = useState<StockMovement[]>(() => storageService.getStockMovements());
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => storageService.getPurchaseOrders());
  const [finances, setFinances] = useState<FinancialRecord[]>(() => storageService.getFinancialRecords());
  const [shifts, setShifts] = useState<CashShift[]>(() => storageService.getShifts());
  const [auditLogs, setAuditLogs] = useState(() => storageService.getAuditLogs());

  // Navigation
  const [activeTab, setActiveTab] = useState<NavTab>('pos');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals & UI
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Refresh all data from storage service
  const reloadData = useCallback(() => {
    setProducts(storageService.getProducts());
    setCustomers(storageService.getCustomers());
    setSuppliers(storageService.getSuppliers());
    setSales(storageService.getSales());
    setMovements(storageService.getStockMovements());
    setPurchaseOrders(storageService.getPurchaseOrders());
    setFinances(storageService.getFinancialRecords());
    setShifts(storageService.getShifts());
    setSettings(storageService.getSettings());
    setAuditLogs(storageService.getAuditLogs());
  }, []);

  // Handlers
  const handleSelectUser = (user: User) => {
    storageService.setCurrentUser(user);
    setCurrentUser(user);
    showToast('info', 'ປ່ຽນຜູ້ໃຊ້ງານ', `ເຂົ້າສູ່ລະບົບເປັນ ${user.name} (${user.role})`);
  };

  const handleUpdateCurrency = (curr: Currency) => {
    const updated = { ...settings, currency: curr };
    storageService.updateSettings(updated);
    setSettings(updated);
    showToast('info', 'ປ່ຽນສະກຸນເງິນ', `ປ່ຽນເປັນ ${curr}`);
  };

  const handleUpdateLanguage = (lang: Language) => {
    const updated = { ...settings, language: lang };
    storageService.updateSettings(updated);
    setSettings(updated);
    showToast('info', 'ປ່ຽນພາສາ', `ຕັ້ງຄ່າພາສາເປັນ ${lang.toUpperCase()}`);
  };

  const handleUpdateSettings = (newSettings: StoreSettings) => {
    storageService.updateSettings(newSettings);
    setSettings(newSettings);
  };

  const handleSaveProduct = (prod: Product) => {
    storageService.saveProduct(prod);
    reloadData();
    showToast('success', 'ບັນທຶກສິນຄ້າຮຽບຮ້ອຍ', prod.name);
  };

  const handleDeleteProduct = (pid: string) => {
    storageService.deleteProduct(pid);
    reloadData();
  };

  const handleImportProducts = (newProducts: Product[]) => {
    newProducts.forEach((p) => storageService.saveProduct(p));
    reloadData();
    showToast('success', 'ນຳເຂົ້າສິນຄ້າສຳເລັດ', `ນຳເຂົ້າທັງໝົດ ${newProducts.length} ລາຍການ`);
  };

  const handleAdjustStock = (
    productId: string,
    qty: number,
    type: 'ADJUST_COUNT' | 'ADJUST_DAMAGE' | 'PURCHASE_RECEIPT',
    reason: string
  ) => {
    storageService.adjustStock(productId, qty, type, reason);
    reloadData();
  };

  const handleSaveCustomer = (cust: Customer) => {
    storageService.saveCustomer(cust);
    reloadData();
  };

  const handleCollectCustomerDebt = (
    customerId: string,
    amount: number,
    method: PaymentMethod,
    note?: string
  ) => {
    storageService.collectCustomerDebt(customerId, amount, method, note);
    reloadData();
  };

  const handleSavePO = (po: PurchaseOrder) => {
    storageService.savePurchaseOrder(po);
    reloadData();
  };

  const handleReceivePO = (poId: string) => {
    storageService.receivePurchaseOrder(poId);
    reloadData();
  };

  const handlePaySupplier = (
    supplierId: string,
    amount: number,
    method: PaymentMethod,
    note?: string
  ) => {
    storageService.paySupplierDebt(supplierId, amount, method, note);
    reloadData();
  };

  const handleAddFinanceRecord = (record: Omit<FinancialRecord, 'id' | 'recordedBy'>) => {
    storageService.addFinancialRecord(record);
    reloadData();
  };

  const handleOpenShift = (openingCash: number) => {
    storageService.openShift(openingCash);
    reloadData();
  };

  const handleCloseShift = (actualCash: number, notes?: string) => {
    storageService.closeShift(actualCash, notes);
    reloadData();
  };

  const handleResetDemo = () => {
    storageService.resetAllToDemoData();
    reloadData();
    setCurrentUser(storageService.getCurrentUser());
    setIsResetConfirmOpen(false);
    showToast('info', 'ຣີເຊັດຂໍ້ມູນຕົວຢ່າງສຳເລັດ', 'ຂໍ້ມູນເລີ່ມຕົ້ນພ້ອມໃຊ້ງານ');
  };

  const activeShift = shifts.find((s) => s.status === 'OPEN');

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
        cartCount={0}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        language={settings.language}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Sticky Header */}
        <Header
          settings={settings}
          onUpdateCurrency={handleUpdateCurrency}
          onUpdateLanguage={handleUpdateLanguage}
          currentUser={currentUser}
          onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
          onResetDemoData={() => setIsResetConfirmOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          activeShift={activeShift}
          onOpenShiftModal={() => setIsShiftModalOpen(true)}
        />

        {/* Dynamic Screen View */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'pos' && (
            <POSScreen
              products={products}
              customers={customers}
              categories={INITIAL_CATEGORIES}
              settings={settings}
              currentUser={currentUser}
              onRefreshData={reloadData}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardScreen
              products={products}
              sales={sales}
              customers={customers}
              suppliers={suppliers}
              finances={finances}
              settings={settings}
              currentUser={currentUser}
              onNavigateToPOS={() => setActiveTab('pos')}
              onNavigateToInventory={() => setActiveTab('inventory')}
            />
          )}

          {activeTab === 'products' && (
            <ProductListScreen
              products={products}
              categories={INITIAL_CATEGORIES}
              suppliers={suppliers}
              warehouses={[
                { id: 'wh-front', name: 'ສາງໜ້າຮ້ານ', code: 'WH-01', location: 'ໜ້າຮ້ານ' },
                { id: 'wh-main', name: 'ສາງສິນຄ້າໃຫຍ່', code: 'WH-02', location: 'ສາງໃຫຍ່' },
              ]}
              settings={settings}
              currentUser={currentUser}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onImportProducts={handleImportProducts}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryScreen
              products={products}
              movements={movements}
              warehouses={[
                { id: 'wh-front', name: 'ສາງໜ້າຮ້ານ', code: 'WH-01', location: 'ໜ້າຮ້ານ' },
                { id: 'wh-main', name: 'ສາງສິນຄ້າໃຫຍ່', code: 'WH-02', location: 'ສາງໃຫຍ່' },
              ]}
              settings={settings}
              currentUser={currentUser}
              onAdjustStock={handleAdjustStock}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerListScreen
              customers={customers}
              settings={settings}
              currentUser={currentUser}
              onSaveCustomer={handleSaveCustomer}
              onCollectDebt={handleCollectCustomerDebt}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'suppliers' && (
            <SupplierListScreen
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              products={products}
              settings={settings}
              currentUser={currentUser}
              onSavePO={handleSavePO}
              onReceivePO={handleReceivePO}
              onPaySupplier={handlePaySupplier}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceScreen
              finances={finances}
              shifts={shifts}
              sales={sales}
              settings={settings}
              currentUser={currentUser}
              onAddFinanceRecord={handleAddFinanceRecord}
              onOpenShift={handleOpenShift}
              onCloseShift={handleCloseShift}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsScreen
              sales={sales}
              products={products}
              customers={customers}
              suppliers={suppliers}
              finances={finances}
              settings={settings}
              currentUser={currentUser}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogsScreen
              logs={auditLogs}
              currentUser={currentUser}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsScreen
              settings={settings}
              currentUser={currentUser}
              onUpdateSettings={handleUpdateSettings}
              onResetDemoData={() => setIsResetConfirmOpen(true)}
              onShowToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        currentUser={currentUser}
        users={storageService.getUsers()}
        onSelectUser={handleSelectUser}
        onClose={() => setIsRoleSwitcherOpen(false)}
      />

      {/* Reset Data Confirmation */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="ຣີເຊັດຂໍ້ມູນຕົວຢ່າງທັງໝົດ?"
        message="ການດຳເນີນການນີ້ຈະລຶບປະຫວັດການຂາຍ ແລະ ຄືນຄ່າສິນຄ້າ, ສະຕັອກ ແລະ ລູກຄ້າກັບສູ່ຂໍ້ມູນເລີ່ມຕົ້ນ"
        confirmLabel="ຢືນຢັນຣີເຊັດ"
        cancelLabel="ຍົກເລີກ"
        isDestructive={true}
        onConfirm={handleResetDemo}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Standalone Shift Modal triggered from Header */}
      <ShiftModal
        isOpen={isShiftModalOpen}
        activeShift={activeShift}
        settings={settings}
        currentUser={currentUser}
        onOpenShift={(cash) => {
          handleOpenShift(cash);
          showToast('success', 'ເປີດກະຂາຍສຳເລັດ', `ເງິນທອນ ${cash.toLocaleString()} ₭`);
        }}
        onCloseShift={(actual, notes) => {
          handleCloseShift(actual, notes);
          showToast('success', 'ປິດກະຂາຍຮຽບຮ້ອຍ', `ເງິນສົດໃນລີ້ນຊັກ ${actual.toLocaleString()} ₭`);
        }}
        onCloseModal={() => setIsShiftModalOpen(false)}
      />
    </div>
  );
}
