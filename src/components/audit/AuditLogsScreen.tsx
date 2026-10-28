import React, { useState, useMemo } from 'react';
import { AuditLog, User } from '../../types';
import { formatDateTime } from '../../services/formatters';
import { History, Search, ShieldCheck, Filter, Download } from 'lucide-react';

interface AuditLogsScreenProps {
  logs: AuditLog[];
  currentUser: User;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const AuditLogsScreen: React.FC<AuditLogsScreenProps> = ({
  logs,
  currentUser,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesSearch =
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q);

      const matchesModule = selectedModule === 'ALL' || log.module === selectedModule;
      return matchesSearch && matchesModule;
    });
  }, [logs, searchQuery, selectedModule]);

  const handleExportAuditCsv = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Module', 'Action', 'Details'];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.module}"`,
      `"${l.action}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('success', 'ส่งออก Audit Logs สำเร็จ');
  };

  const getModuleBadge = (mod: AuditLog['module']) => {
    switch (mod) {
      case 'POS':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      case 'PRODUCT':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
      case 'INVENTORY':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'FINANCE':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'AUTH':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            ประวัติการทำงานและความปลอดภัย (Audit Trail Logs)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            บันทึกทุกเหตุการณ์สำคัญ: การขาย, การแก้ราคา, การปรับสต็อก, การคืนเงิน และการเปลี่ยนสิทธิ์
          </p>
        </div>

        <button
          onClick={handleExportAuditCsv}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          ส่งออกบันทึก CSV
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อผู้ทำรายการ หรือข้อความ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">ทุกโมดูล (All Modules)</option>
            <option value="POS">จุดขายหน้าร้าน (POS)</option>
            <option value="PRODUCT">สินค้าและราคา (PRODUCT)</option>
            <option value="INVENTORY">สต็อกสินค้า (INVENTORY)</option>
            <option value="FINANCE">การเงินและกะ (FINANCE)</option>
            <option value="AUTH">เข้าสู่ระบบ/สิทธิ์ (AUTH)</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">วัน-เวลา</th>
                <th className="py-3 px-4">ผู้ทำรายการ</th>
                <th className="py-3 px-4">โมดูล</th>
                <th className="py-3 px-4">การกระทำ (Action)</th>
                <th className="py-3 px-4">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">
                    {formatDateTime(log.timestamp, 'th')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 dark:text-white">{log.userName}</span>
                    <span className="text-[10px] text-slate-400 block">{log.userRole}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getModuleBadge(log.module)}`}>
                      {log.module}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-md">
                    <div>{log.details}</div>
                    {log.oldValue && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                        ก่อน: {log.oldValue} | หลัง: {log.newValue}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
