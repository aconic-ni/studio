import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ACCESS_CODE_LENGTH, NUMBER_TO_WORD } from "@/lib/constants";
import type { ExamInfo, Product } from "@/lib/schemas";
import * as XLSX from 'xlsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateAccessCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function convertCodeToWords(code: string): string {
  return code.split('').map(digit => NUMBER_TO_WORD[digit] || '').join(' ');
}

export function generateTxtReport(examInfo: ExamInfo, products: Product[]): string {
  let content = `EXAMEN PREVIO AGENCIA ACONIC - CustomsEX-p\n`;
  content += `===========================================\n\n`;
  content += `INFORMACIÓN GENERAL:\n`;
  content += `NE: ${examInfo.ne}\n`;
  content += `Referencia: ${examInfo.reference || 'N/A'}\n`;
  content += `Gestor: ${examInfo.manager}\n`;
  content += `Ubicación: ${examInfo.location}\n\n`;
  content += `PRODUCTOS:\n`;
  
  products.forEach((product, index) => {
      content += `\n--- Producto ${index + 1} ---\n`;
      content += `Número de Item: ${product.itemNumber || 'N/A'}\n`;
      content += `Numeración de Bultos: ${product.numberPackages || 'N/A'}\n`;
      content += `Cantidad de Bultos: ${product.quantityPackages ?? 'N/A'}\n`;
      content += `Cantidad de Unidades: ${product.quantityUnits ?? 'N/A'}\n`;
      content += `Descripción: ${product.description || 'N/A'}\n`;
      content += `Marca: ${product.brand || 'N/A'}\n`;
      content += `Modelo: ${product.model || 'N/A'}\n`;
      content += `Serie: ${product.serial || 'N/A'}\n`;
      content += `Origen: ${product.origin || 'N/A'}\n`;
      content += `Estado de Mercancía: ${product.packagingCondition || 'N/A'}\n`;
      content += `Unidad de Medida: ${product.unitMeasure || 'N/A'}\n`;
      content += `Peso: ${product.weight || 'N/A'}\n`;
      content += `Código HS Sugerido: ${product.hsCode || 'N/A'}\n`;
      content += `Observación: ${product.observation || 'N/A'}\n`;
      
      let statusText = [];
      if (product.isConform) statusText.push('Conforme a factura');
      if (product.isExcess) statusText.push('Se encontró excedente');
      if (product.isMissing) statusText.push('Se encontró faltante');
      if (product.isFault) statusText.push('Se encontró avería');
      if (statusText.length === 0) statusText.push('Sin estado específico');
      content += `Estado: ${statusText.join(', ')}\n`;
  });

  return content;
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateExcelReport(examInfo: ExamInfo, products: Product[]) {
  const now = new Date();
  const fechaHora = `${now.toLocaleDateString('es-NI')} ${now.toLocaleTimeString('es-NI')}`;
  
  const excelData: (string | number | undefined)[][] = [
      ['EXAMEN PREVIO AGENCIA ACONIC - CustomsEX-p'],
      [],
      ['INFORMACIÓN GENERAL:'],
      [],
      [`Fecha y hora: ${fechaHora}`],
      ['NE:', examInfo.ne],
      ['Referencia:', examInfo.reference || 'N/A'],
      ['Gestor:', examInfo.manager],
      ['Ubicación:', examInfo.location],
      [],
      ['PRODUCTOS:'],
      [
          'Número de Item',
          'Numeración de Bultos',
          'Cantidad de Bultos',
          'Cantidad de Unidades',
          'Descripción',
          'Marca',
          'Modelo',
          'Origen',
          'Estado de Mercancía',
          'Peso',
          'Unidad de Medida',
          'Serie',
          'Código HS Sugerido',
          'Observación',
          'Estado'
      ]
  ];

  products.forEach(product => {
      let status = '';
      if (product.isConform) status += 'Conforme a factura; ';
      if (product.isExcess) status += 'Se encontró excedente; ';
      if (product.isMissing) status += 'Se encontró faltante; ';
      if (product.isFault) status += 'Se encontró avería; ';
      if (status.length === 0) status = 'Sin estado específico';
      else status = status.slice(0, -2); // Remove trailing semicolon and space

      excelData.push([
          product.itemNumber || 'N/A',
          product.numberPackages || 'N/A',
          product.quantityPackages ?? 'N/A',
          product.quantityUnits ?? 'N/A',
          product.description || 'N/A',
          product.brand || 'N/A',
          product.model || 'N/A',
          product.origin || 'N/A',
          product.packagingCondition || 'N/A',
          product.weight || 'N/A',
          product.unitMeasure || 'N/A',
          product.serial || 'N/A',
          product.hsCode || 'N/A',
          product.observation || 'N/A',
          status
      ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(excelData);

  // Auto-fit columns - very basic, might need adjustment
  const colWidths = excelData[11].map((_, i) => ({
    wch: Math.max(...excelData.map(row => row[i] ? String(row[i]).length : 0), String(excelData[11][i]).length) + 2
  }));
  ws['!cols'] = colWidths;


  XLSX.utils.book_append_sheet(wb, ws, `Examen Previo ${examInfo.ne}`);
  XLSX.writeFile(wb, `CustomsEX-p_${examInfo.ne}_${now.toISOString().split('T')[0]}.xlsx`);
}
