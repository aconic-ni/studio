
import type { ExamInfo, Product, ProductStatus } from '@/types';
import { PRODUCT_STATUS } from '@/types';
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
      reportContent += `Product ${index + 1} (Item N°: ${product.itemNumber || '-' }):\n`;
      reportContent += `  Description: ${product.description}\n`;
      reportContent += `  Brand: ${product.brand || '-'}\n`;
      reportContent += `  Model: ${product.model || '-'}\n`;
      reportContent += `  Serial Number: ${product.serialNumber || '-'}\n`;
      reportContent += `  Origin: ${product.origin || '-'}\n`;
      reportContent += `  Unit Quantity: ${product.unitQuantity || 0} ${product.measurementUnit || ''}\n`;
      reportContent += `  Package Quantity: ${product.packageQuantity || 0}\n`;
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

const mapProductStatusToText = (status: ProductStatus): string => {
  switch (status) {
    case PRODUCT_STATUS.CONFORME:
      return 'Conforme a factura';
    case PRODUCT_STATUS.EXCEDENTE:
      return 'Se encontró excedente';
    case PRODUCT_STATUS.FALTANTE:
      return 'Se encontró faltante';
    case PRODUCT_STATUS.AVERIA:
      return 'Se encontró avería';
    default:
      // This case should ideally not be reached if status is always one of the enum values
      return status || 'Sin estado específico';
  }
};

export const generateExcelReport = (examInfo: ExamInfo, products: Product[]): void => {
  const now = new Date();
  const fechaHora = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

  const excelData: (string | number | undefined | null)[][] = [
    ['EXAMEN PREVIO AGENCIA ACONIC - CustomsEX-p'],
    [], // Empty row
    ['INFORMACIÓN GENERAL:'],
    [], // Empty row
    [`Fecha y hora de generación: ${fechaHora}`],
    [`ID Examen (NE): ${examInfo.examId}`],
    [`Fecha del Examen: ${examInfo.date}`],
    [`Inspector: ${examInfo.inspectorName}`],
    [`Ubicación: ${examInfo.location}`],
    [], // Empty row
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
      'Unidad de Medida (Cant.)',
      'Serie',
      'Observación',
      'Estado'
    ]
  ];

  products.forEach(product => {
    const productStatusText = mapProductStatusToText(product.status);
    const productWeight = (product.weightValue || product.weightValue === 0) && product.weightUnit 
                          ? `${product.weightValue} ${product.weightUnit}` 
                          : (product.weightValue || product.weightValue === 0 ? String(product.weightValue) : '-');

    excelData.push([
      product.itemNumber || '',
      product.packageNumbers || '',
      product.packageQuantity !== undefined ? product.packageQuantity : '',
      product.unitQuantity !== undefined ? product.unitQuantity : '',
      product.description,
      product.brand || '',
      product.model || '',
      product.origin || '',
      product.merchandiseState || '',
      productWeight,
      product.measurementUnit || '',
      product.serialNumber || '',
      product.observation || '',
      productStatusText
    ]);
  });

  if (products.length === 0) {
    excelData.push(Array(excelData[excelData.length - 1].length).fill("No hay productos listados."));
  }
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(excelData);

  // Set column widths (optional, but often helpful)
  // Example: First column width 20, second 30, etc.
  // ws['!cols'] = [ {wch:20}, {wch:30}, ... ];
  // For now, let's keep it simple as per the user's example.
  // Auto-width could be complex to implement perfectly here.
  // Let's at least give some basic widths for headers
  const productHeaders = excelData[11]; // Assuming headers are at index 11
  if (productHeaders && productHeaders.length > 0) {
    ws['!cols'] = productHeaders.map(header => ({ wch: String(header).length + 5 }));
  }


  XLSX.utils.book_append_sheet(wb, ws, `Examen Previo ${examInfo.examId}`);
  
  const fileName = `CustomsEX-p_${examInfo.examId}_${formatDateForFilename(new Date())}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
