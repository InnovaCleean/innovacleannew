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

                // Helper to find value by fuzzy key match
                const findValue = (row: any, ...keys: string[]) => {
                    const rowKeys = Object.keys(row);
                    for (const key of keys) {
                        // Exact match
                        if (row[key] !== undefined) return row[key];
                        // Case-insensitive match
                        const match = rowKeys.find(k => k.trim().toLowerCase() === key.toLowerCase());
                        if (match) return row[match];
                    }
                    return undefined;
                };

                const products: Partial<Product>[] = json.map((row: any) => ({
                    sku: String(findValue(row, 'SKU', 'sku', 'Código') || '').trim(),
                    category: String(findValue(row, 'Categoría', 'Categoria', 'category') || 'General').trim(),
                    name: String(findValue(row, 'Nombre', 'name', 'Producto') || '').trim(),
                    unit: String(findValue(row, 'Unidad de Medida', 'Unidad', 'unit') || 'Litro').trim(),
                    stockCurrent: cleanNumber(findValue(row, 'Stock', 'stock', 'stockCurrent', 'Existencia')),
                    stockInitial: cleanNumber(findValue(row, 'Stock', 'stock', 'stockInitial', 'Existencia')),
                    cost: cleanNumber(findValue(row, 'Costo', 'cost', 'Costo Unitario')),
                    priceRetail: cleanNumber(findValue(row, 'Menudeo', 'priceRetail', 'Precio Menudeo', 'Precio Menu')),
                    priceMedium: cleanNumber(findValue(row, 'Medio', 'priceMedium', 'Precio Medio', 'Precio Medic')),
                    priceWholesale: cleanNumber(findValue(row, 'Mayoreo', 'priceWholesale', 'Precio Mayoreo', 'Precio Mayo')),
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
