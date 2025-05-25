
import type { ExamData, Product, ExportableExamData } from '@/types';
import type { Timestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


export function downloadTxtFile(examData: ExamData, products: Product[]) {
  let content = `SOLICITUD DE CHEQUE - CustomsEX-p\n`;
  content += `===========================================\n\n`;
  content += `INFORMACIÓN GENERAL:\n`;
  content += `NE: ${examData.ne}\n`;
  content += `Referencia: ${examData.reference || 'N/A'}\n`;
  content += `De (Colaborador): ${examData.manager}\n`;
  content += `A (Destinatario): ${examData.recipient}\n`;
  content += `Fecha: ${examData.date ? format(examData.date, "PPP", { locale: es }) : 'N/A'}\n\n`;
  
  content += `PRODUCTOS/SERVICIOS (DETALLE DE LA SOLICITUD):\n`;

  (Array.isArray(products) ? products : []).forEach((product, index) => {
    content += `\n--- Item ${index + 1} ---\n`;
    content += `Número de Item/Código: ${product.itemNumber || 'N/A'}\n`;
    content += `Descripción: ${product.description || 'N/A'}\n`;
    content += `Marca: ${product.brand || 'N/A'}\n`;
    content += `Modelo: ${product.model || 'N/A'}\n`;
    content += `Serie: ${product.serial || 'N/A'}\n`;
    content += `Origen (si aplica): ${product.origin || 'N/A'}\n`;
    content += `Peso (si aplica): ${product.weight || 'N/A'}\n`;
    content += `Unidad de Medida: ${product.unitMeasure || 'N/A'}\n`;
    content += `Numeración de Bultos (si aplica): ${product.numberPackages || 'N/A'}\n`;
    content += `Cantidad de Bultos (si aplica): ${product.quantityPackages || 0}\n`;
    content += `Cantidad de Unidades: ${product.quantityUnits || 0}\n`;
    content += `Condición/Estado: ${product.packagingCondition || 'N/A'}\n`;
    content += `Observación: ${product.observation || 'N/A'}\n`;
    
    const statuses = [];
    if (product.isConform) statuses.push("Conforme a factura/cotización");
    if (product.isExcess) statuses.push("Excedente (No aplica a cheques)");
    if (product.isMissing) statuses.push("Faltante (No aplica a cheques)");
    if (product.isFault) statuses.push("Avería/Defecto (No aplica a cheques)");
    // For checks, these might be less relevant, adjust as needed or provide specific statuses for financial requests
    content += `Estado General: ${statuses.length > 0 ? statuses.join(', ') : 'N/A'}\n`;
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SolicitudCheque_${examData.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadExcelFile(data: ExportableExamData) {
  const now = new Date();
  const fechaHoraExportacion = `${now.toLocaleString('es-NI', { dateStyle: 'long', timeStyle: 'short' })}`;

  const photoLinkPlaceholder = `(Link a facturas/documentos si aplica para NE: ${data.ne})`;


  // --- Hoja 1: Detalles de la Solicitud y Productos/Servicios ---
  const examDetailsSheetData: (string | number | Date | null | undefined | XLSX.CellObject)[][] = [
    ['SOLICITUD DE CHEQUE - CustomsEX-p'],
    [],
    ['INFORMACIÓN GENERAL DE LA SOLICITUD:'],
    ['NE (Tracking):', data.ne],
    ['Referencia (Factura, Cotización, etc.):', data.reference || 'N/A'],
    ['De (Colaborador):', data.manager],
    ['A (Destinatario):', data.recipient],
    ['Fecha de Solicitud:', data.date ? (data.date instanceof Date ? format(data.date, "PPP", { locale: es }) : format((data.date as Timestamp).toDate(), "PPP", { locale: es })) : 'N/A'],
    ['Soportes (Facturas/Docs):', photoLinkPlaceholder], // Placeholder for actual link if available
    [],
    ['DETALLE DE PRODUCTOS/SERVICIOS SOLICITADOS:']
  ];

  const productHeaders = [
    'Item/Código', 'Descripción', 'Marca', 'Modelo', 'Serie', 
    'Origen', 'Peso', 'Unidad Medida', 'Num. Bultos', 
    'Cant. Bultos', 'Cant. Unidades', 'Condición', 'Observación', 'Estado General'
  ];
  
  const productRows = (Array.isArray(data.products) ? data.products : []).map(product => {
    let statusText = '';
    const statuses = [];
    if (product.isConform) statuses.push("Conforme");
    // Adjust these statuses if they don't make sense for a check request
    if (product.isExcess) statuses.push("Excedente (N/A)");
    if (product.isMissing) statuses.push("Faltante (N/A)");
    if (product.isFault) statuses.push("Avería (N/A)");
    statusText = statuses.length > 0 ? statuses.join('/') : 'N/A';

    return [
      product.itemNumber || 'N/A',
      product.description || 'N/A',
      product.brand || 'N/A',
      product.model || 'N/A',
      product.serial || 'N/A',
      product.origin || 'N/A',
      product.weight || 'N/A',
      product.unitMeasure || 'N/A',
      product.numberPackages || 'N/A',
      product.quantityPackages || 0,
      product.quantityUnits || 0,
      product.packagingCondition || 'N/A',
      product.observation || 'N/A',
      statusText
    ];
  });

  const ws_exam_details_data = [...examDetailsSheetData, productHeaders, ...productRows];
  const ws_exam_details = XLSX.utils.aoa_to_sheet(ws_exam_details_data);

  const examColWidths = productHeaders.map((header, i) => ({
    wch: Math.max(
      header.length,
      ...(ws_exam_details_data.slice(examDetailsSheetData.length) as (string|number)[][]).map(row => row[i] ? String(row[i]).length : 0)
    ) + 2 
  }));
  
  const generalInfoLabels = examDetailsSheetData.slice(0, examDetailsSheetData.length - 2).map(row => String(row[0] || ''));
  const generalInfoValues = examDetailsSheetData.slice(0, examDetailsSheetData.length - 2).map(row => {
    const cellValue = row[1];
    if (typeof cellValue === 'object' && cellValue !== null && 'v' in cellValue) {
      return String((cellValue as XLSX.CellObject).v || '');
    }
    return String(cellValue || '');
  });

  if (examColWidths.length > 0 && examColWidths[0]) {
    examColWidths[0].wch = Math.max(examColWidths[0].wch || 0, ...generalInfoLabels.map(label => label.length + 2));
  }
  if (examColWidths.length > 1 && examColWidths[1]) {
    examColWidths[1].wch = Math.max(examColWidths[1].wch || 0, ...generalInfoValues.map(value => value.length + 5));
  }
  ws_exam_details['!cols'] = examColWidths;

  // --- Hoja 2: Detalles del Sistema ---
  const systemDetailsSheetData: (string | number | Date | null | undefined)[][] = [
    ['DETALLES DE SISTEMA DE LA SOLICITUD:']
  ];

  if (data.savedBy) {
    systemDetailsSheetData.push(['Guardado por (correo):', data.savedBy]);
  } else {
    systemDetailsSheetData.push(['Guardado por (correo):', 'N/A (No guardado en BD aún o dato no disponible)']);
  }

  if (data.savedAt) {
    const savedDate = data.savedAt instanceof Date ? data.savedAt : (data.savedAt as Timestamp).toDate();
    systemDetailsSheetData.push(['Fecha y Hora de Guardado:', savedDate.toLocaleString('es-NI', { dateStyle: 'long', timeStyle: 'medium' })]);
  } else {
     systemDetailsSheetData.push(['Fecha y Hora de Guardado:', 'N/A (No guardado en BD aún o dato no disponible)']);
  }
  
  systemDetailsSheetData.push(['Fecha y Hora de Exportación:', fechaHoraExportacion]);

  const ws_system_details = XLSX.utils.aoa_to_sheet(systemDetailsSheetData);
  
  const systemColWidths = [
    { wch: Math.max(...systemDetailsSheetData.map(row => String(row[0]).length)) + 2 },
    { wch: Math.max(...systemDetailsSheetData.map(row => String(row[1]).length)) + 5 },
  ];
  ws_system_details['!cols'] = systemColWidths;


  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws_exam_details, `Solicitud ${data.ne || 'S_NE'}`);
  XLSX.utils.book_append_sheet(wb, ws_system_details, "Detalle de Sistema");
  
  XLSX.writeFile(wb, `SolicitudCheque_${data.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
