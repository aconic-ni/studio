
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
    content += `Monto Solicitado: ${formatCurrencyForExport(solicitud.monto, solicitud.montoMoneda)}\n`;
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

  const titleFont = { name: 'Arial', sz: 14, bold: true };
  const boldFont = { name: 'Arial', sz: 10, bold: true };
  const normalFont = { name: 'Arial', sz: 10 };
  
  const baseAlignment = { wrapText: true, vertical: 'top', horizontal: 'left' };

  (Array.isArray(data.products) ? data.products : []).forEach((solicitud, index) => {
    const sheetData: (string | number | Date | null | undefined)[][] = [];
    let rowIndex = 0;

    // Helper to add rows and increment rowIndex
    const addRow = (rowData: (string | number | Date | null | undefined)[]) => {
        sheetData.push(rowData);
        rowIndex++;
    };
    
    let cantidadEnLetrasRowIndex = -1;
    let observacionRowIndex = -1;

    addRow(['SOLICITUD DE CHEQUE - CustomsFA-L']); // Row 0
    addRow([]); // Row 1 (Empty for spacing)

    addRow(['INFORMACIÓN GENERAL:']); // Row 2
    addRow(['A (Destinatario):', examInfo.recipient]); // Row 3
    addRow(['De (Colaborador):', examInfo.manager]); // Row 4
    addRow(['Fecha de Examen:', formatDate(examInfo.date)]); // Row 5
    addRow(['NE (Tracking NX1):', examInfo.ne]); // Row 6
    addRow(['Referencia:', examInfo.reference || 'N/A']); // Row 7
    if (examInfo.savedBy) addRow(['Guardado por (correo):', examInfo.savedBy]);
    if (examInfo.savedAt) addRow(['Fecha y Hora de Guardado:', formatDate(examInfo.savedAt)]);
    addRow([]); // Empty

    addRow(['DETALLES DE LA SOLICITUD:']); // Section Title
    addRow([]); // Empty

    // Monto y Cantidad
    addRow(['Por este medio me dirijo a usted para solicitarle que elabore cheque por la cantidad de:']);
    addRow([formatCurrencyForExport(solicitud.monto, solicitud.montoMoneda)]);
    cantidadEnLetrasRowIndex = rowIndex; // Mark this row index
    addRow(['Cantidad en Letras:', solicitud.cantidadEnLetras || 'N/A']);
    addRow([]); // Empty

    // Información Adicional de Solicitud
    addRow(['INFORMACIÓN ADICIONAL DE SOLICITUD:']);
    addRow(['  Consignatario:', solicitud.consignatario || 'N/A']);
    addRow(['  Declaración Número:', solicitud.declaracionNumero || 'N/A']);
    addRow(['  Unidad Recaudadora:', solicitud.unidadRecaudadora || 'N/A']);
    addRow(['  Código 1:', solicitud.codigo1 || 'N/A']);
    addRow(['  Código 2:', solicitud.codigo2 || 'N/A']);
    addRow([]); // Empty

    // Cuenta Bancaria
    addRow(['CUENTA BANCARIA:']);
    let bancoDisplay = solicitud.banco || 'N/A';
    if (solicitud.banco === 'Otros' && solicitud.bancoOtros) {
      bancoDisplay = `${solicitud.bancoOtros} (Otros)`;
    } else if (solicitud.banco === 'ACCION POR CHEQUE/NO APLICA BANCO') {
      bancoDisplay = 'Acción por Cheque / No Aplica Banco';
    }
    addRow(['  Banco:', bancoDisplay]);

    if (solicitud.banco !== 'ACCION POR CHEQUE/NO APLICA BANCO') {
      addRow(['  Número de Cuenta:', solicitud.numeroCuenta || 'N/A']);
      let monedaCuentaDisplay = solicitud.monedaCuenta || 'N/A';
      if (solicitud.monedaCuenta === 'Otros' && solicitud.monedaCuentaOtros) {
        monedaCuentaDisplay = `${solicitud.monedaCuentaOtros} (Otros)`;
      }
      addRow(['  Moneda de la Cuenta:', monedaCuentaDisplay]);
    }
    addRow([]); // Empty

    // Beneficiario del Pago
    addRow(['BENEFICIARIO DEL PAGO:']);
    addRow(['  Elaborar Cheque A:', solicitud.elaborarChequeA || 'N/A']);
    addRow(['  Elaborar Transferencia A:', solicitud.elaborarTransferenciaA || 'N/A']);
    addRow([]); // Empty

    // Detalles Adicionales y Documentación
    addRow(['DETALLES ADICIONALES Y DOCUMENTACIÓN:']);
    addRow(['  Impuestos pagados por el cliente mediante:', formatBooleanForExport(solicitud.impuestosPagadosCliente)]);
    if (solicitud.impuestosPagadosCliente) {
      addRow(['    R/C No.:', solicitud.impuestosPagadosRC || 'N/A']);
      addRow(['    T/B No.:', solicitud.impuestosPagadosTB || 'N/A']);
      addRow(['    Cheque No.:', solicitud.impuestosPagadosCheque || 'N/A']);
    }
    addRow(['  Impuestos pendientes de pago por el cliente:', formatBooleanForExport(solicitud.impuestosPendientesCliente)]);
    addRow(['  Se añaden documentos adjuntos:', formatBooleanForExport(solicitud.documentosAdjuntos)]);
    addRow(['  Constancias de no retención:', formatBooleanForExport(solicitud.constanciasNoRetencion)]);
    if (solicitud.constanciasNoRetencion) {
      addRow(['    1%:', formatBooleanForExport(solicitud.constanciasNoRetencion1)]);
      addRow(['    2%:', formatBooleanForExport(solicitud.constanciasNoRetencion2)]);
    }
    addRow([]); // Empty

    // Comunicación y Observaciones
    addRow(['COMUNICACIÓN Y OBSERVACIONES:']);
    addRow(['  Correos de Notificación:', solicitud.correo || 'N/A']);
    observacionRowIndex = rowIndex; // Mark this row index
    addRow(['  Observación:', solicitud.observation || 'N/A']);
    
    // Pad to 50 rows if needed for consistent print area consideration
    while (sheetData.length < 50) {
        addRow([]);
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    if (!ws['!merges']) ws['!merges'] = [];

    // Style and merge Main Title (Row 0)
    const mainTitleCellAddress = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (ws[mainTitleCellAddress]) {
      ws[mainTitleCellAddress].s = {
        font: { ...titleFont },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }
      };
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });
    }

    // Apply styles to all content cells
    for (let r = 1; r < sheetData.length; r++) { // Start from row 1 to skip main title
        const row = sheetData[r];
        for (let c = 0; c < 2; c++) { // Iterate only columns A and B
            const cellValue = row[c];
            const cellAddress = XLSX.utils.encode_cell({ r, c });

            // Ensure cell object exists, set type to string 's' if it has content
            if (typeof cellValue !== 'undefined' && cellValue !== null && String(cellValue).trim() !== '') {
                if (!ws[cellAddress]) { ws[cellAddress] = { t: 's', v: cellValue }; }
                else { ws[cellAddress].t = 's'; ws[cellAddress].v = cellValue; } // Ensure type 's'
            } else if (typeof cellValue === 'undefined' || cellValue === null || String(cellValue).trim() === '') {
                 // For empty or null cells, ensure they exist if we need to style them (e.g. borders),
                 // but don't force type 's' if they are truly empty.
                 if (!ws[cellAddress]) { ws[cellAddress] = {}; }
            }


            // Initialize style and alignment if they don't exist
            if (ws[cellAddress]) { // Only apply styles if cell object exists
                if (!ws[cellAddress].s) ws[cellAddress].s = { font: { ...normalFont } };
                if (!ws[cellAddress].s.alignment) ws[cellAddress].s.alignment = {};
                
                // Base alignment: Wrap Text and Top Align for all content cells
                ws[cellAddress].s.alignment.wrapText = true;
                ws[cellAddress].s.alignment.vertical = 'top';
                ws[cellAddress].s.alignment.horizontal = 'left'; // Default to left

                // Bolding for user-entered values (Column B) or standalone values (Column A, not labels)
                if (c === 1 && cellValue !== 'N/A' && String(cellValue).trim() !== '') {
                    ws[cellAddress].s.font = { ...boldFont };
                } else if (c === 0 && (typeof row[1] === 'undefined' || String(row[1]).trim() === '') && 
                           cellValue !== 'N/A' && String(cellValue).trim() !== '' && 
                           !String(cellValue).endsWith(':')) {
                    ws[cellAddress].s.font = { ...boldFont };
                }

                // Style section headers (all caps, ends with ':', and no value in column B)
                if (c === 0 && typeof cellValue === 'string' && cellValue.endsWith(':') && cellValue === cellValue.toUpperCase() && (typeof row[1] === 'undefined' || String(row[1]).trim() === '')) {
                    ws[cellAddress].s.font = { ...boldFont }; // Make section headers bold
                    ws[cellAddress].s.alignment.vertical = 'middle';
                    const mergeExists = ws['!merges'].some(m => m.s.r === r && m.s.c === 0 && m.e.r === r && m.e.c === 1);
                    if (!mergeExists) {
                       ws['!merges'].push({ s: { r, c: 0 }, e: { r, c: 1 } });
                    }
                }
                 // Bold specific labels like "Por este medio..."
                if (c === 0 && typeof cellValue === 'string' && cellValue.startsWith("Por este medio")) {
                    ws[cellAddress].s.font = { ...boldFont };
                }
            }
        }
    }

    // Specific alignment for "Cantidad en Letras" value cell (Column B of its row)
    if (cantidadEnLetrasRowIndex !== -1) {
        const cellBAddressCantidad = XLSX.utils.encode_cell({ r: cantidadEnLetrasRowIndex, c: 1 });
        if (ws[cellBAddressCantidad]) {
            if (!ws[cellBAddressCantidad].s) ws[cellBAddressCantidad].s = { font: { ...normalFont } }; // Ensure .s exists
            if (!ws[cellBAddressCantidad].s.alignment) ws[cellBAddressCantidad].s.alignment = {};
            ws[cellBAddressCantidad].s.alignment.wrapText = true; // Crucial for Ajustar Texto
            ws[cellBAddressCantidad].s.alignment.vertical = 'top';
            ws[cellBAddressCantidad].s.alignment.horizontal = 'left'; // Left align as per last request
            if (solicitud.cantidadEnLetras && solicitud.cantidadEnLetras !== 'N/A') {
                ws[cellBAddressCantidad].s.font = { ...boldFont };
            }
        }
    }
    
    // Specific alignment for "Observación" value cell (Column B of its row)
    if (observacionRowIndex !== -1) {
        const cellBAddressObservacion = XLSX.utils.encode_cell({ r: observacionRowIndex, c: 1 });
        if (ws[cellBAddressObservacion]) {
            if (!ws[cellBAddressObservacion].s) ws[cellBAddressObservacion].s = { font: { ...normalFont } }; // Ensure .s exists
            if (!ws[cellBAddressObservacion].s.alignment) ws[cellBAddressObservacion].s.alignment = {};
            ws[cellBAddressObservacion].s.alignment.wrapText = true; // Crucial for Ajustar Texto
            ws[cellBAddressObservacion].s.alignment.vertical = 'top';
            ws[cellBAddressObservacion].s.alignment.horizontal = 'left';
            if (solicitud.observation && solicitud.observation !== 'N/A') {
               ws[cellBAddressObservacion].s.font = { ...boldFont };
            }
        }
    }
    
    // Remove explicit row height settings to let Excel auto-adjust for wrapped text
    // ws['!rows'] = []; // DO NOT set explicit row heights if relying on auto-height with wrapText for fit-to-page

    ws['!cols'] = [{ wch: 35 }, { wch: 45 }];
    
    // Print Setup: Fit Sheet on One Page, Print Area A1:B50
    ws['!printSetup'] = {
      fitToWidth: 1,
      fitToHeight: 1, // This is key for "Imprimir hoja en una sola hoja"
      paperSize: 9,   // US Letter (9 is a common code for Letter)
      orientation: 'portrait',
      printArea: 'A1:B50' // Define the area to be scaled and printed
    };
    
    // Define the sheet's actual data extent, capped by the print area consideration
    const currentNumRows = sheetData.length;
    ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 1, r: Math.min(currentNumRows - 1, 49) }});


    const sheetName = `Solicitud ${index + 1}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const fileName = `SolicitudesCheque_${examInfo.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
