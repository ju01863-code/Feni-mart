import * as XLSX from 'xlsx';

export function exportToExcel(data: Record<string, unknown>[], filename: string, sheetName = 'Sheet1') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface MultiSheetConfig {
  sheetName: string;
  data: Record<string, unknown>[];
}

export function exportMultiSheetExcel(sheets: MultiSheetConfig[], filename: string) {
  const workbook = XLSX.utils.book_new();
  sheets.forEach((sheet) => {
    const ws = XLSX.utils.json_to_sheet(sheet.data.length ? sheet.data : [{ 'কোন তথ্য নেই': 'N/A' }]);
    XLSX.utils.book_append_sheet(workbook, ws, sheet.sheetName.substring(0, 31)); // Excel max sheet name 31 chars
  });
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}
