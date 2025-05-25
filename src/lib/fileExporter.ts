
import type { ExamData, SolicitudData, ExportableExamData } from '@/types';
import type { Timestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const formatDate = (dateValue: Date | Timestamp | string | null | undefined): string => {
  if (!dateValue) return 'N/A';
  if (typeof dateValue === 'string') return dateValue;
  const dateObj = dateValue instanceof Date ? dateValue : (dateValue as Timestamp).toDate();
  return format(dateObj, "PPP", { locale: es });
};

const formatCurrencyForExport = (amount?: number | string, currency?: string) => {
    if (amount === undefined || amount === null || amount === '') return 'N/A';
    const num = Number(amount);
    if (isNaN(num)) return String(amount);
    let prefix = '';
    if (currency === 'cordoba') prefix = 'C$';
    else if (currency === 'dolar') prefix = 'US$';
    else if (currency === 'euro') prefix = '€';
    return `${prefix}${num.toFixed(2)}`;
};

const formatBooleanForExport = (value?: boolean): string => {
  return value ? 'Sí' : 'No';
};


export function downloadTxtFile(examData: ExamData, solicitudes: SolicitudData[]) {
  let content = `SOLICITUD DE CHEQUE - CustomsFA-L\n`;
  content += `===========================================\n\n`;
  content += `INFORMACIÓN GENERAL:\n`;
  content += `A (Destinatario): ${examData.recipient}\n`;
  content += `De (Colaborador): ${examData.manager}\n`;
  content += `Fecha: ${formatDate(examData.date)}\n`;
  content += `NE: ${examData.ne}\n`;
  content += `Referencia: ${examData.reference || 'N/A'}\n\n`;

  content += `SOLICITUDES (${solicitudes.length}):\n`;

  (Array.isArray(solicitudes) ? solicitudes : []).forEach((solicitud, index) => {
    content += `\n--- Solicitud ${index + 1} ---\n`;
    content += `Por este medio me dirijo a usted para solicitarle que elabore cheque por la cantidad de: ${formatCurrencyForExport(solicitud.monto, solicitud.montoMoneda)}\n`;
    content += `Cantidad en Letras: ${solicitud.cantidadEnLetras || 'N/A'}\n`;
    content += `Consignatario: ${solicitud.consignatario || 'N/A'}\n`;
    content += `Declaración Número: ${solicitud.declaracionNumero || 'N/A'}\n`;
    content += `Unidad Recaudadora: ${solicitud.unidadRecaudadora || 'N/A'}\n`;
    content += `Código 1: ${solicitud.codigo1 || 'N/A'}\n`;
    content += `Código 2: ${solicitud.codigo2 || 'N/A'}\n`;

    let bancoDisplay = solicitud.banco || 'N/A';
    if (solicitud.banco === 'Otros' && solicitud.bancoOtros) {
      bancoDisplay = `${solicitud.bancoOtros} (Otros)`;
    } else if (solicitud.banco === 'ACCION POR CHEQUE/NO APLICA BANCO') {
      bancoDisplay = 'Acción por Cheque / No Aplica Banco';
    }
    content += `Banco: ${bancoDisplay}\n`;

    if (solicitud.banco !== 'ACCION POR CHEQUE/NO APLICA BANCO') {
        content += `Número de Cuenta: ${solicitud.numeroCuenta || 'N/A'}\n`;
        let monedaCuentaDisplay = solicitud.monedaCuenta || 'N/A';
        if (solicitud.monedaCuenta === 'Otros' && solicitud.monedaCuentaOtros) {
          monedaCuentaDisplay = `${solicitud.monedaCuentaOtros} (Otros)`;
        }
        content += `Moneda de la Cuenta: ${monedaCuentaDisplay}\n`;
    }
    content += `Elaborar Cheque A: ${solicitud.elaborarChequeA || 'N/A'}\n`;
    content += `Elaborar Transferencia A: ${solicitud.elaborarTransferenciaA || 'N/A'}\n`;

    content += `Impuestos Pagados Cliente: ${formatBooleanForExport(solicitud.impuestosPagadosCliente)}\n`;
    if (solicitud.impuestosPagadosCliente) {
        content += `  R/C: ${solicitud.impuestosPagadosRC || 'N/A'}\n`;
        content += `  T/B: ${solicitud.impuestosPagadosTB || 'N/A'}\n`;
        content += `  Cheque: ${solicitud.impuestosPagadosCheque || 'N/A'}\n`;
    }
    content += `Impuestos Pendientes Cliente: ${formatBooleanForExport(solicitud.impuestosPendientesCliente)}\n`;
    content += `Documentos Adjuntos: ${formatBooleanForExport(solicitud.documentosAdjuntos)}\n`;
    content += `Constancias de No Retención: ${formatBooleanForExport(solicitud.constanciasNoRetencion)}\n`;
    if (solicitud.constanciasNoRetencion) {
        content += `  1%: ${formatBooleanForExport(solicitud.constanciasNoRetencion1)}\n`;
        content += `  2%: ${formatBooleanForExport(solicitud.constanciasNoRetencion2)}\n`;
    }
    content += `Correo Notificación: ${solicitud.correo || 'N/A'}\n`;
    content += `Observación: ${solicitud.observation || 'N/A'}\n`;
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
  const wb = XLSX.utils.book_new();
  const examInfo = data;

  (Array.isArray(data.products) ? data.products : []).forEach((solicitud, index) => {
    const sheetData: (string | number | Date | null | undefined)[][] = [];
    
    sheetData.push(['SOLICITUD DE CHEQUE - CustomsFA-L']); // Row 1
    sheetData.push([]); // Row 2 (Empty Separator)
    sheetData.push(['INFORMACIÓN GENERAL:']); // Row 3
    sheetData.push(['A (Destinatario):', examInfo.recipient]); // Row 4
    sheetData.push(['De (Colaborador):', examInfo.manager]); // Row 5
    sheetData.push(['Fecha de Examen:', formatDate(examInfo.date)]); // Row 6
    sheetData.push(['NE (Tracking NX1):', examInfo.ne]); // Row 7
    sheetData.push(['Referencia:', examInfo.reference || 'N/A']); // Row 8
    if (examInfo.savedBy) sheetData.push(['Guardado por (correo):', examInfo.savedBy]);
    if (examInfo.savedAt) sheetData.push(['Fecha y Hora de Guardado:', formatDate(examInfo.savedAt)]);
    sheetData.push([]); // Empty Separator
    sheetData.push(['DETALLES DE LA SOLICITUD:']); // Section Title
    sheetData.push([]); // Empty Separator

    // Monto y Cantidad en Letras section
    sheetData.push(['Por este medio me dirijo a usted para solicitarle que elabore cheque por la cantidad de:']); // Label for Monto
    sheetData.push([formatCurrencyForExport(solicitud.monto, solicitud.montoMoneda)]); // Monto value
    sheetData.push(['Cantidad en Letras:', solicitud.cantidadEnLetras || 'N/A']); // Cantidad en Letras label and value

    sheetData.push([]); // Empty Separator
    sheetData.push(['INFORMACIÓN ADICIONAL DE SOLICITUD:']);
    sheetData.push(['  Consignatario:', solicitud.consignatario || 'N/A']);
    sheetData.push(['  Declaración Número:', solicitud.declaracionNumero || 'N/A']);
    sheetData.push(['  Unidad Recaudadora:', solicitud.unidadRecaudadora || 'N/A']);
    sheetData.push(['  Código 1:', solicitud.codigo1 || 'N/A']);
    sheetData.push(['  Código 2:', solicitud.codigo2 || 'N/A']);
    sheetData.push([]);
    sheetData.push(['CUENTA BANCARIA:']);
    let bancoDisplay = solicitud.banco || 'N/A';
    if (solicitud.banco === 'Otros' && solicitud.bancoOtros) {
      bancoDisplay = `${solicitud.bancoOtros} (Otros)`;
    } else if (solicitud.banco === 'ACCION POR CHEQUE/NO APLICA BANCO') {
      bancoDisplay = 'Acción por Cheque / No Aplica Banco';
    }
    sheetData.push(['  Banco:', bancoDisplay]);
    if (solicitud.banco !== 'ACCION POR CHEQUE/NO APLICA BANCO') {
      sheetData.push(['  Número de Cuenta:', solicitud.numeroCuenta || 'N/A']);
      let monedaCuentaDisplay = solicitud.monedaCuenta || 'N/A';
      if (solicitud.monedaCuenta === 'Otros' && solicitud.monedaCuentaOtros) {
        monedaCuentaDisplay = `${solicitud.monedaCuentaOtros} (Otros)`;
      }
      sheetData.push(['  Moneda de la Cuenta:', monedaCuentaDisplay]);
    }
    sheetData.push([]);
    sheetData.push(['BENEFICIARIO DEL PAGO:']);
    sheetData.push(['  Elaborar Cheque A:', solicitud.elaborarChequeA || 'N/A']);
    sheetData.push(['  Elaborar Transferencia A:', solicitud.elaborarTransferenciaA || 'N/A']);
    sheetData.push([]);
    sheetData.push(['DETALLES ADICIONALES Y DOCUMENTACIÓN:']);
    sheetData.push(['  Impuestos pagados por el cliente mediante:', formatBooleanForExport(solicitud.impuestosPagadosCliente)]);
    if (solicitud.impuestosPagadosCliente) {
      sheetData.push(['    R/C No.:', solicitud.impuestosPagadosRC || 'N/A']);
      sheetData.push(['    T/B No.:', solicitud.impuestosPagadosTB || 'N/A']);
      sheetData.push(['    Cheque No.:', solicitud.impuestosPagadosCheque || 'N/A']);
    }
    sheetData.push(['  Impuestos pendientes de pago por el cliente:', formatBooleanForExport(solicitud.impuestosPendientesCliente)]);
    sheetData.push(['  Se añaden documentos adjuntos:', formatBooleanForExport(solicitud.documentosAdjuntos)]);
    sheetData.push(['  Constancias de no retención:', formatBooleanForExport(solicitud.constanciasNoRetencion)]);
    if (solicitud.constanciasNoRetencion) {
      sheetData.push(['    1%:', formatBooleanForExport(solicitud.constanciasNoRetencion1)]);
      sheetData.push(['    2%:', formatBooleanForExport(solicitud.constanciasNoRetencion2)]);
    }
    sheetData.push([]);
    sheetData.push(['COMUNICACIÓN Y OBSERVACIONES:']);
    sheetData.push(['  Correos de Notificación:', solicitud.correo || 'N/A']);
    sheetData.push(['  Observación:', solicitud.observation || 'N/A']);
    
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // --- STYLING ---
    const boldFont = { name: 'Calibri', sz: 11, bold: true };
    const normalFont = { name: 'Calibri', sz: 11 };
    const titleFont = { name: 'Calibri', sz: 14, bold: true };

    // Helper to find row index by label in column A
    const findRowIndexByLabel = (label: string): number => {
        for (let i = 0; i < sheetData.length; i++) {
            if (sheetData[i][0] === label) {
                return i;
            }
        }
        return -1;
    };
    
    // Remove ALL explicit row height settings to allow auto-height for wrapped text
    ws['!rows'] = [];

    // General cell styling loop (type setting, base alignment, bolding)
    sheetData.forEach((row, rIndex) => {
      row.forEach((cellValue, cIndex) => {
        if (cIndex < 2) { // Only columns A and B
          const cellAddress = XLSX.utils.encode_cell({ r: rIndex, c: cIndex });
          if (!ws[cellAddress]) { // Ensure cell object exists
             // If value is null/undefined, create an empty cell of type string to apply styles
            ws[cellAddress] = { t: 's', v: cellValue === null || cellValue === undefined ? "" : cellValue };
          }
          
          // Explicitly set cell type to string if it's a string, helps with wrap text
          if (typeof cellValue === 'string') {
            ws[cellAddress].t = 's';
          }

          if (!ws[cellAddress].s) ws[cellAddress].s = {};
          if (!ws[cellAddress].s.alignment) ws[cellAddress].s.alignment = {};

          // Base alignment: wrap text, top align, left align
          ws[cellAddress].s.alignment.wrapText = true; 
          ws[cellAddress].s.alignment.vertical = 'top';
          ws[cellAddress].s.alignment.horizontal = 'left';
          ws[cellAddress].s.font = { ...normalFont };

          // Bolding for user-entered values (Column B, or Column A if B is empty and it's not a label)
          const isValueCell = (cIndex === 1 && cellValue !== 'N/A' && String(cellValue).trim() !== '') ||
                              (cIndex === 0 && (typeof row[1] === 'undefined' || String(row[1]).trim() === '') &&
                               cellValue !== 'N/A' && String(cellValue).trim() !== '' &&
                               !String(cellValue).endsWith(':') &&
                               !String(cellValue).toUpperCase().startsWith("SOLICITUD DE CHEQUE") &&
                               !String(cellValue).toUpperCase().startsWith("POR ESTE MEDIO"));
          if (isValueCell) {
            ws[cellAddress].s.font = { ...boldFont };
          }

          // Style section headers (all caps, ends with ':')
          if (cIndex === 0 && typeof cellValue === 'string' && cellValue.endsWith(':') && cellValue === cellValue.toUpperCase()) {
            ws[cellAddress].s.font = { ...boldFont };
            ws[cellAddress].s.alignment.vertical = 'middle';
          }
        }
      });
    });

    // Main title styling (Row 1, Col A)
    const mainTitleCellAddress = 'A1';
    if (ws[mainTitleCellAddress]) {
        ws[mainTitleCellAddress].s = {
            font: { ...titleFont },
            alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }
        };
    }
     if (!ws['!merges']) ws['!merges'] = [];
     ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }); // Merge A1:B1

    // Specific styling for "Cantidad en Letras" value cell
    const rowIndexCantidadLetras = findRowIndexByLabel('Cantidad en Letras:');
    if (rowIndexCantidadLetras !== -1) {
        const cellAddressCL = XLSX.utils.encode_cell({ r: rowIndexCantidadLetras, c: 1 }); // Column B
        if (!ws[cellAddressCL]) ws[cellAddressCL] = { t: 's', v: solicitud.cantidadEnLetras || 'N/A'};
        else ws[cellAddressCL].v = solicitud.cantidadEnLetras || 'N/A'; // Ensure value is set
        ws[cellAddressCL].t = 's'; // Force type to string
        ws[cellAddressCL].s = { 
            alignment: { wrapText: true, vertical: 'top', horizontal: 'left' }, // IMPORTANT: wrapText
            font: (solicitud.cantidadEnLetras && solicitud.cantidadEnLetras !== 'N/A') ? { ...boldFont } : { ...normalFont }
        };
    }

    // Specific styling for "Observación" value cell
    const rowIndexObservacion = findRowIndexByLabel('  Observación:');
    if (rowIndexObservacion !== -1) {
        const cellAddressObs = XLSX.utils.encode_cell({ r: rowIndexObservacion, c: 1 }); // Column B
        if (!ws[cellAddressObs]) ws[cellAddressObs] = { t: 's', v: solicitud.observation || 'N/A' };
        else ws[cellAddressObs].v = solicitud.observation || 'N/A'; // Ensure value is set
        ws[cellAddressObs].t = 's'; // Force type to string
        ws[cellAddressObs].s = {
            alignment: { wrapText: true, vertical: 'top', horizontal: 'left' }, // IMPORTANT: wrapText
            font: (solicitud.observation && solicitud.observation !== 'N/A') ? { ...boldFont } : { ...normalFont }
        };
    }
    
    ws['!cols'] = [{ wch: 35 }, { wch: 45 }]; // Column widths

    // Print Setup: Fit Sheet on One Page
    ws['!printSetup'] = {
      printArea: `A1:B${Math.min(sheetData.length, 50)}`, // Print up to 50 rows
      fitToWidth: 1,
      fitToHeight: 1, // CRUCIAL for "Imprimir hoja en una sola hoja"
      paperSize: 9,   // US Letter
      orientation: 'portrait',
      // No scale property, fitToHeight:1 and fitToWidth:1 handle scaling
    };
    
    // Define the actual data range of the sheet
    const numRows = sheetData.length;
    ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 1, r: Math.min(numRows - 1, 49) }});


    const sheetName = `Solicitud ${index + 1}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const fileName = `SolicitudesCheque_${examInfo.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
