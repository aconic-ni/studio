
import type { ExamInfo, Product } from '@/types';
import * as XLSX from 'xlsx';

const formatDateForFilename = (date: Date): string => {
  return date.toISOString().split('T')[0].replace(/-/g, '');
};

const downloadFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

export const generateTxtReport = (examInfo: ExamInfo, products: Product[]): void => {
  let reportContent = "Customs Examination Report\n";
  reportContent += "==========================\n\n";
  reportContent += "Exam Information:\n";
  reportContent += `  Exam ID: ${examInfo.examId}\n`;
  reportContent += `  Date: ${examInfo.date}\n`;
  reportContent += `  Inspector: ${examInfo.inspectorName}\n`;
  reportContent += `  Location: ${examInfo.location}\n\n`;
  reportContent += "Products:\n";
  reportContent += "==========================\n";
  if (products.length === 0) {
    reportContent += "  No products listed.\n";
  } else {
    products.forEach((product, index) => {
      reportContent += `Product ${index + 1} (Item N°: ${product.itemNumber}):\n`;
      reportContent += `  Description: ${product.description}\n`;
      reportContent += `  Brand: ${product.brand || '-'}\n`;
      reportContent += `  Model: ${product.model || '-'}\n`;
      reportContent += `  Serial Number: ${product.serialNumber || '-'}\n`;
      reportContent += `  Origin: ${product.origin}\n`;
      reportContent += `  Unit Quantity: ${product.unitQuantity} ${product.measurementUnit}\n`;
      reportContent += `  Package Quantity: ${product.packageQuantity}\n`;
      reportContent += `  Package Numbers: ${product.packageNumbers || '-'}\n`;
      reportContent += `  Weight: ${product.weightValue || '-'} ${product.weightUnit || ''}\n`;
      reportContent += `  Merchandise State: ${product.merchandiseState || '-'}\n`;
      reportContent += `  Status: ${product.status}\n`;
      reportContent += `  Observation: ${product.observation || '-'}\n\n`;
    });
  }
  reportContent += "==========================\n";
  reportContent += "End of Report\n";

  const fileName = `Customs_Report_${examInfo.examId || 'General'}_${formatDateForFilename(new Date())}.txt`;
  downloadFile(reportContent, fileName, 'text/plain;charset=utf-8;');
};

export const generateExcelReport = (examInfo: ExamInfo, products: Product[]): void => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Exam Info
  const examData = [
    ["Exam ID", examInfo.examId],
    ["Date", examInfo.date],
    ["Inspector Name", examInfo.inspectorName],
    ["Location", examInfo.location],
  ];
  const wsExam = XLSX.utils.aoa_to_sheet(examData);
  XLSX.utils.book_append_sheet(wb, wsExam, "Exam Information");

  // Sheet 2: Products
  const productHeaders = [
    "Item N°", "Descripción", "Marca", "Modelo", "Serie", "Origen", 
    "Cant. Unidades", "Unidad Medida (Cant.)", 
    "Cant. Bultos", "Numeración Bultos",
    "Peso Valor", "Peso Unidad", 
    "Estado Mercancía", "Estado", "Observación"
  ];
  const productRows = products.map(p => [
    p.itemNumber, p.description, p.brand, p.model, p.serialNumber, p.origin,
    p.unitQuantity, p.measurementUnit,
    p.packageQuantity, p.packageNumbers,
    p.weightValue, p.weightUnit,
    p.merchandiseState, p.status, p.observation
  ]);
  
  const wsProductsData = products.length > 0 ? [productHeaders, ...productRows] : [productHeaders, ["No products listed."]];
  const wsProducts = XLSX.utils.aoa_to_sheet(wsProductsData);

  if (products.length > 0) {
    const colsWidths = productHeaders.map((header, i) => ({
        wch: Math.max(header.length, ...productRows.map(row => row[i] ? String(row[i]).length : 0)) + 2
    }));
    wsProducts['!cols'] = colsWidths;
  } else {
     wsProducts['!cols'] = [{wch: 50}]; 
  }
  
  XLSX.utils.book_append_sheet(wb, wsProducts, "Products");

  const fileName = `Customs_Report_${examInfo.examId || 'General'}_${formatDateForFilename(new Date())}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
