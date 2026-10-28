import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Truck,
  Wallet,
  BarChart3,
  History,
  Settings,
  ChevronRight,
  Store,
  Layers
} from 'lucide-react';
import { User, Role } from '../../types';
import { translations } from '../../data/translations';

export type NavTab =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'inventory'
  | 'customers'
  | 'suppliers'
  | 'finance'
  | 'reports'
  | 'audit'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: User;
  onOpenRoleSwitcher: () => void;
  cartCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onOpenRoleSwitcher,
  cartCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  const t = translations.th;

  // Permissions filter for sidebar
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: t.dashboard,
      icon: LayoutDashboard,
      allowedRoles: ['OWNER', 'ADMIN', 'MANAGER'],
    },
    {
      id: 'pos' as NavTab,
      label: t.pos,
      icon: ShoppingCart,
      badge: cartCount > 0 ? cartCount : undefined,
      allowedRoles: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'],
    },
    {
      id: 'products' as NavTab,
      label: t.products,
      icon: Package,
      allowedRoles: ['OWNER', 'ADMIN', 'MANAGER', 'WAREHOUSE'],
    },
    {
      id: 'inventory' as NavTab,
      label: t.inventory,
      icon: Boxes,
      allowedRoles: ['OWNER', 'ADMIN', 'MANAGER', 'WAREHOUSE'],
    },
    {
      id: 'customers' as NavTab,
      label: t.customers,
      icon: Users,
      allowedRoles: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'],
    },
    {
      id: 'suppliers' as NavTab,
      label: t.suppliers,
      icon: Truck,
      allowedRoles: ['OWNER', 'ADMIN', 'MANAGER', 'WAREHOUSE'],
    },
    {
      id: 'finance' as NavTab,
      label: t.finance,
      icon: Wallet,
      allowedRoles: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'],
    },
    {
      id: 'reports' as NavTab,
      label: t.reports,
      icon: BarChart3,
      allowedRoles: ['OWNER', 'ADMIN', 'MANAGER'],
    },
    {
      id: 'audit' as NavTab,
      label: t.auditLogs,
      icon: History,
      allowedRoles: ['OWNER', 'ADMIN', 'MANAGER'],
    },
    {
      id: 'settings' as NavTab,
      label: t.settings,
      icon: Settings,
      allowedRoles: ['OWNER', 'ADMIN'],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight leading-tight flex items-center gap-1.5">
                Smart POS
                <span className="text-[10px] bg-blue-500/20 text-blue-400 font-bold px-1.5 py-0.5 rounded border border-blue-500/30">
                  PRO
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Retail & Wholesale</p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isAllowed = item.allowedRoles.includes(currentUser.role);
            if (!isAllowed) return null;

            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card at bottom with switch button */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div
            onClick={onOpenRoleSwitcher}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/40"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                  {currentUser.name}
                </p>
                <span className="inline-block text-[10px] font-semibold text-blue-300 bg-blue-900/60 px-1.5 py-0.2 rounded">
                  {currentUser.role}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </aside>
    </>
  );
};
