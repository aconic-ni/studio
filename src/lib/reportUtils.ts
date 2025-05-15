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
      reportContent += `Product ${index + 1}:\n`;
      reportContent += `  Name: ${product.name}\n`;
      reportContent += `  HS Code: ${product.hsCode}\n`;
      reportContent += `  Quantity: ${product.quantity}\n`;
      reportContent += `  Value: ${product.value}\n`;
      reportContent += `  Country of Origin: ${product.countryOfOrigin}\n\n`;
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
  const productHeaders = ["Product Name", "HS Code", "Quantity", "Value", "Country of Origin"];
  const productRows = products.map(p => [p.name, p.hsCode, p.quantity, p.value, p.countryOfOrigin]);
  
  const wsProductsData = products.length > 0 ? [productHeaders, ...productRows] : [productHeaders, ["No products listed."]];
  const wsProducts = XLSX.utils.aoa_to_sheet(wsProductsData);

  // Auto-size columns for products sheet
  if (products.length > 0) {
    const colsWidths = productHeaders.map((header, i) => ({
        wch: Math.max(header.length, ...productRows.map(row => row[i] ? String(row[i]).length : 0)) + 2
    }));
    wsProducts['!cols'] = colsWidths;
  } else {
     wsProducts['!cols'] = [{wch: 50}]; // Default width for "No products" message
  }
  
  XLSX.utils.book_append_sheet(wb, wsProducts, "Products");

  const fileName = `Customs_Report_${examInfo.examId || 'General'}_${formatDateForFilename(new Date())}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
