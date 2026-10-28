import React from 'react';
import { SaleTransaction, StoreSettings } from '../../types';
import { formatCurrency, formatDateTime } from '../../services/formatters';
import { Printer, Check, X, FileText } from 'lucide-react';

interface ReceiptModalProps {
  sale: SaleTransaction | null;
  settings: StoreSettings;
  onClose: () => void;
  onNewSale: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  settings,
  onClose,
  onNewSale,
}) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">การขายเสร็จสมบูรณ์</h3>
              <p className="text-xs text-slate-500">{sale.receiptNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div
            id="pos-receipt-print-area"
            className="w-full max-w-[340px] bg-white text-slate-900 p-5 rounded-xl shadow-md border border-slate-200 font-mono text-xs leading-relaxed"
          >
            {/* Store Info */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="font-bold text-sm">{settings.storeName}</h2>
              <p className="text-[11px] text-slate-600">{settings.storeBranch}</p>
              <p className="text-[10px] text-slate-500">{settings.address}</p>
              <p className="text-[10px] text-slate-500">โทร: {settings.phone}</p>
              {settings.taxId && <p className="text-[10px] text-slate-500">เลขประจำตัวผู้เสียภาษี: {settings.taxId}</p>}
            </div>

            {/* Receipt Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>เลขที่ใบเสร็จ:</span>
                <span className="font-bold">{sale.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>วันที่-เวลา:</span>
                <span>{formatDateTime(sale.createdAt, 'th')}</span>
              </div>
              <div className="flex justify-between">
                <span>พนักงาน:</span>
                <span>{sale.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>ลูกค้า:</span>
                <span className="font-semibold">{sale.customerName}</span>
              </div>
            </div>

            {/* Items */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-2">
              <div className="flex justify-between font-bold text-[10px] uppercase text-slate-500 border-b border-slate-200 pb-1">
                <span>รายการสินค้า</span>
                <span>รวม (บาท)</span>
              </div>
              {sale.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between text-slate-800 font-sans font-medium text-[11px]">
                    <span className="truncate pr-2">{item.productName}</span>
                    <span className="font-mono font-semibold">{item.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>
                      {item.quantity} {item.unit} x {item.unitPrice.toFixed(2)}
                      {item.discount > 0 && ` (ลด -${item.discount.toFixed(2)})`}
                    </span>
                    {item.tierApplied && (
                      <span className="text-[9px] text-blue-600 font-sans font-semibold">
                        [{item.tierApplied}]
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>ยอดรวมสินค้า:</span>
                <span>{formatCurrency(sale.subtotal, settings.currency)}</span>
              </div>
              {sale.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>ส่วนลดรวม:</span>
                  <span>-{formatCurrency(sale.discountTotal, settings.currency)}</span>
                </div>
              )}
              {sale.taxAmount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>VAT ({sale.taxRate}%):</span>
                  <span>{formatCurrency(sale.taxAmount, settings.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-200">
                <span>ยอดชำระสุทธิ:</span>
                <span>{formatCurrency(sale.grandTotal, settings.currency)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>วิธีชำระ:</span>
                <span className="font-bold">
                  {sale.paymentMethod === 'CASH'
                    ? 'เงินสด (Cash)'
                    : sale.paymentMethod === 'PROMPTPAY'
                    ? 'พร้อมเพย์ QR'
                    : sale.paymentMethod === 'TRANSFER'
                    ? 'โอนธนาคาร'
                    : 'ขายเชื่อ (เครดิต)'}
                </span>
              </div>
              {sale.paymentMethod === 'CASH' && (
                <>
                  <div className="flex justify-between">
                    <span>รับเงินมา:</span>
                    <span>{formatCurrency(sale.paymentDetails.cashReceived || sale.grandTotal, settings.currency)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>เงินทอน:</span>
                    <span>{formatCurrency(sale.paymentDetails.change || 0, settings.currency)}</span>
                  </div>
                </>
              )}
              {sale.paymentMethod === 'CREDIT' && (
                <div className="text-amber-700 bg-amber-50 p-1.5 rounded mt-1 text-[10px]">
                  * บันทึกหนี้ค้างชำระในระบบบัญชีลูกหนี้เรียบร้อย
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 text-center text-[10px] text-slate-500 space-y-1">
              <p>{settings.receiptFooter}</p>
              <p className="font-mono text-[9px] text-slate-400">--- THANK YOU ---</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onNewSale}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            เปิดรายการขายใหม่
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            พิมพ์ใบเสร็จ
          </button>
        </div>
      </div>
    </div>
  );
};
