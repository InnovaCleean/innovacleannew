import * as XLSX from 'xlsx';
import { Product } from '../types';

export const DOWNLOAD_TEMPLATE_COLS = [
    'SKU', 'Categoría', 'Nombre', 'Unidad de Medida', 'Stock', 'Costo', 'Menudeo', 'Medio', 'Mayoreo'
];

export const downloadProductTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([DOWNLOAD_TEMPLATE_COLS]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, 'plantilla_inventario.xlsx');
};

export const parseProductsExcel = (file: File): Promise<Partial<Product>[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                const cleanNumber = (val: any) => {
                    if (typeof val === 'number') return val;
                    if (!val) return 0;
                    // Remove all non-numeric chars except dot and minus
                    // Handle $1,200.50 -> 1200.50
                    const str = String(val).replace(/[^0-9.-]/g, '');
                    const num = parseFloat(str);
                    return isNaN(num) ? 0 : num;
                };

                const products: Partial<Product>[] = json.map((row: any) => ({
                    sku: String(row.SKU || row.sku || '').trim(),
                    category: String(row.Categoría || row.category || 'General').trim(),
                    name: String(row.Nombre || row.name || '').trim(),
                    unit: String(row['Unidad de Medida'] || row.unit || 'Litro').trim(),
                    stockCurrent: cleanNumber(row.Stock || row.stockCurrent),
                    stockInitial: cleanNumber(row.Stock || row.stockInitial),
                    cost: cleanNumber(row.Costo || row.cost),
                    priceRetail: cleanNumber(row.Menudeo || row.priceRetail),
                    priceMedium: cleanNumber(row.Medio || row.priceMedium),
                    priceWholesale: cleanNumber(row.Mayoreo || row.priceWholesale),
                }));

                resolve(products.filter(p => p.sku && p.name));
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};
