import React, { useState } from 'react';
import { Product } from '../../types';
import { Download, Upload, FileSpreadsheet, X, CheckCircle, AlertCircle } from 'lucide-react';

interface ProductImportModalProps {
  isOpen: boolean;
  onImport: (products: Product[]) => void;
  onClose: () => void;
}

export const ProductImportModal: React.FC<ProductImportModalProps> = ({
  isOpen,
  onImport,
  onClose,
}) => {
  if (!isOpen) return null;

  const [csvText, setCsvText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);

  const sampleCsv = `SKU,Barcode,Name,Category,BaseUnit,CostPrice,RetailPrice,WholesalePrice,MinStock,Stock
BEV-COLA-010,885012301001,โค้ก ออริจินัล 325 มล.,เครื่องดื่ม (Beverages),กระป๋อง,11.50,16.00,14.00,24,120
SNK-NUT-011,885012301101,ถั่วลิสงอบเกลือ โก๋แก่ 40 กรัม,ขนมขบเคี้ยว (Snacks),ซอง,7.50,12.00,10.00,20,80
CLN-SOAP-012,885012301201,สบู่ก้อน โพรเทคส์ 65 กรัม,ของใช้ในบ้าน (Household),ก้อน,12.00,18.00,15.00,15,45`;

  const handleDownloadSample = () => {
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'products_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleParseCsv = () => {
    setParseError(null);
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length <= 1) {
        setParseError('ข้อมูล CSV ต้องมีแถวหัวตารางและอย่างน้อย 1 แถวข้อมูล');
        return;
      }

      const parsed: Product[] = [];
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map((c) => c.trim());

        const sku = cols[0] || `SKU-${Date.now()}-${i}`;
        const barcode = cols[1] || sku;
        const name = cols[2] || `สินค้า ${sku}`;
        const category = cols[3] || 'สินค้าทั่วไป';
        const baseUnit = cols[4] || 'ชิ้น';
        const costPrice = parseFloat(cols[5]) || 0;
        const retailPrice = parseFloat(cols[6]) || 0;
        const wholesalePrice = parseFloat(cols[7]) || 0;
        const minStockAlert = parseFloat(cols[8]) || 10;
        const currentStock = parseFloat(cols[9]) || 0;

        parsed.push({
          id: `p-imp-${Date.now()}-${i}`,
          sku,
          barcode,
          name,
          category,
          baseUnit,
          costPrice,
          retailPrice,
          wholesalePrice,
          wholesaleMinQty: 6,
          priceTiers: [
            { minQty: 1, price: retailPrice, label: 'ปลีก' },
            { minQty: 6, price: wholesalePrice || retailPrice * 0.9, label: 'ส่ง 6+ ชิ้น' },
          ],
          currentStock,
          minStockAlert,
          warehouseId: 'wh-front',
          status: 'ACTIVE',
          imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      setPreviewProducts(parsed);
    } catch (e: any) {
      setParseError('เกิดข้อผิดพลาดในการแปลง CSV: ' + e.message);
    }
  };

  const handleConfirmImport = () => {
    if (previewProducts.length === 0) return;
    onImport(previewProducts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            นำเข้าสินค้าจากไฟล์ CSV (Import Products)
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
            <div>
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                ดาวน์โหลดแม่แบบไฟล์ CSV (CSV Template)
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                คอลัมน์: SKU, Barcode, Name, Category, BaseUnit, CostPrice, RetailPrice, WholesalePrice, MinStock, Stock
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              ดาวน์โหลดแม่แบบ
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              วางข้อความ CSV หรือเนื้อหาที่คัดลอกจาก Excel / CSV:
            </label>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="วางข้อมูล CSV ที่นี่..."
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setCsvText(sampleCsv)}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              ใส่ข้อมูลตัวอย่างทดสอบ
            </button>
            <button
              type="button"
              onClick={handleParseCsv}
              disabled={!csvText.trim()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              ตรวจสอบข้อมูล ({previewProducts.length} รายการพร้อมนำเข้า)
            </button>
          </div>

          {parseError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {parseError}
            </div>
          )}

          {/* Preview Table */}
          {previewProducts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                ตัวอย่างสินค้าที่จะถูกบันทึกเข้าระบบ:
              </p>
              <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-500 uppercase sticky top-0">
                    <tr>
                      <th className="p-2">SKU</th>
                      <th className="p-2">ชื่อ</th>
                      <th className="p-2">ทุน</th>
                      <th className="p-2">ปลีก</th>
                      <th className="p-2">ส่ง</th>
                      <th className="p-2">สต็อก</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                    {previewProducts.map((p, i) => (
                      <tr key={i}>
                        <td className="p-2 font-mono text-[11px]">{p.sku}</td>
                        <td className="p-2 font-bold">{p.name}</td>
                        <td className="p-2">{p.costPrice}</td>
                        <td className="p-2 font-bold text-blue-600">{p.retailPrice}</td>
                        <td className="p-2 text-emerald-600">{p.wholesalePrice}</td>
                        <td className="p-2 font-bold">{p.currentStock} {p.baseUnit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={previewProducts.length === 0}
            onClick={handleConfirmImport}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            ยืนยันนำเข้า {previewProducts.length} รายการ
          </button>
        </div>
      </div>
    </div>
  );
};
