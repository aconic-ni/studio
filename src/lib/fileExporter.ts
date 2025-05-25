
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

  (Array.isArray(data.products) ? data.products : []).forEach((solicitud, index) => {
    const sheetData: (string | number | Date | null | undefined)[][] = [];
    
    // Helper to find row index by label in column A
    const findRowIndexByLabel = (label: string): number => {
        for (let i = 0; i < sheetData.length; i++) {
            if (sheetData[i][0] === label) {
                return i;
            }
        }
        return -1;
    };

    // Populate sheetData
    sheetData.push(['SOLICITUD DE CHEQUE - CustomsFA-L']);
    sheetData.push([]); 
    sheetData.push(['INFORMACIÓN GENERAL:']);
    sheetData.push(['A (Destinatario):', examInfo.recipient]);
    sheetData.push(['De (Colaborador):', examInfo.manager]);
    sheetData.push(['Fecha de Examen:', formatDate(examInfo.date)]);
    sheetData.push(['NE (Tracking NX1):', examInfo.ne]);
    sheetData.push(['Referencia:', examInfo.reference || 'N/A']);
    if (examInfo.savedBy) sheetData.push(['Guardado por (correo):', examInfo.savedBy]);
    if (examInfo.savedAt) sheetData.push(['Fecha y Hora de Guardado:', formatDate(examInfo.savedAt)]);
    sheetData.push([]); 
    sheetData.push(['DETALLES DE LA SOLICITUD:']);
    sheetData.push([]); 
    sheetData.push(['Por este medio me dirijo a usted para solicitarle que elabore cheque por la cantidad de:']);
    sheetData.push([formatCurrencyForExport(solicitud.monto, solicitud.montoMoneda)]);
    sheetData.push(['Cantidad en Letras:', solicitud.cantidadEnLetras || 'N/A']);
    sheetData.push([]);
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
    
    // Pad to at least 50 rows for print area consistency if needed, though dynamic is better
    const currentNumRows = sheetData.length;
    // while (sheetData.length < 50) {
    //     sheetData.push([]);
    // }

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    if (!ws['!merges']) ws['!merges'] = [];

    // --- STYLING ---
    const boldFont = { name: 'Arial', sz: 10, bold: true };
    const normalFont = { name: 'Arial', sz: 10 };
    const titleFont = { name: 'Arial', sz: 14, bold: true };

    for (let r = 0; r < currentNumRows; r++) {
        for (let c = 0; c < 2; c++) { // Only columns A (0) and B (1)
            const cellAddress = XLSX.utils.encode_cell({ r, c });
            const cellValue = sheetData[r][c];

            if (typeof cellValue !== 'undefined' && cellValue !== null) {
                if (!ws[cellAddress]) { // If cell object doesn't exist, create it
                    ws[cellAddress] = { v: cellValue };
                }
                // Ensure type is string for text wrapping, unless it's clearly a number/boolean
                if (typeof cellValue === 'string') {
                    ws[cellAddress].t = 's';
                } else if (typeof cellValue === 'number') {
                    ws[cellAddress].t = 'n';
                } else if (typeof cellValue === 'boolean') {
                    ws[cellAddress].t = 'b';
                }


                if (!ws[cellAddress].s) ws[cellAddress].s = {};
                if (!ws[cellAddress].s.alignment) ws[cellAddress].s.alignment = {};

                // Default: Wrap Text, Top Align, Left Align
                ws[cellAddress].s.alignment.wrapText = true;
                ws[cellAddress].s.alignment.vertical = 'top';
                ws[cellAddress].s.alignment.horizontal = 'left';
                ws[cellAddress].s.font = { ...normalFont };


                // Bolding for user-entered values (Column B generally, or Column A if B is empty and it's not a label)
                const isValueCell = (c === 1 && cellValue !== 'N/A' && String(cellValue).trim() !== '') ||
                                    (c === 0 && (typeof sheetData[r][1] === 'undefined' || String(sheetData[r][1]).trim() === '') &&
                                     cellValue !== 'N/A' && String(cellValue).trim() !== '' &&
                                     !String(cellValue).endsWith(':') &&
                                     !String(cellValue).toUpperCase().startsWith("SOLICITUD DE CHEQUE") &&
                                     !String(cellValue).toUpperCase().startsWith("POR ESTE MEDIO"));
                if (isValueCell) {
                    ws[cellAddress].s.font = { ...boldFont };
                }

                // Style section headers (all caps, ends with ':')
                if (c === 0 && typeof cellValue === 'string' && cellValue.endsWith(':') && cellValue === cellValue.toUpperCase()) {
                    ws[cellAddress].s.font = { ...boldFont };
                    ws[cellAddress].s.alignment.vertical = 'middle';
                    if (!ws['!merges'].some(m => m.s.r === r && m.s.c === 0 && m.e.r === r && m.e.c === 1)) {
                        ws['!merges'].push({ s: { r, c: 0 }, e: { r, c: 1 } });
                    }
                }
            }
        }
    }
    
    // Specific styling for "Cantidad en Letras" VALUE cell
    const rowIndexCantidadLetras = findRowIndexByLabel('Cantidad en Letras:');
    if (rowIndexCantidadLetras !== -1) {
        const cellBCantidadLetras = XLSX.utils.encode_cell({ r: rowIndexCantidadLetras, c: 1 });
        if (ws[cellBCantidadLetras]) {
             if(!ws[cellBCantidadLetras].s) ws[cellBCantidadLetras].s = {}; // Ensure style object
            ws[cellBCantidadLetras].t = 's'; // Crucial: Ensure it's treated as text
            ws[cellBCantidadLetras].s.alignment = {
                wrapText: true, // CRUCIAL
                vertical: 'top',
                horizontal: 'left' // As per your last request for left alignment
            };
            if (solicitud.cantidadEnLetras && solicitud.cantidadEnLetras !== 'N/A') {
                 if(!ws[cellBCantidadLetras].s.font) ws[cellBCantidadLetras].s.font = {};
                ws[cellBCantidadLetras].s.font.bold = true;
            }
        }
    }

    // Specific styling for "Observación" VALUE cell
    const rowIndexObservacion = findRowIndexByLabel('  Observación:');
    if (rowIndexObservacion !== -1) {
        const cellBObservacion = XLSX.utils.encode_cell({ r: rowIndexObservacion, c: 1 });
        if (ws[cellBObservacion]) {
            if(!ws[cellBObservacion].s) ws[cellBObservacion].s = {}; // Ensure style object
            ws[cellBObservacion].t = 's'; // Crucial: Ensure it's treated as text
            ws[cellBObservacion].s.alignment = {
                wrapText: true, // CRUCIAL
                vertical: 'top',
                horizontal: 'left'
            };
             if (solicitud.observation && solicitud.observation !== 'N/A') {
                if(!ws[cellBObservacion].s.font) ws[cellBObservacion].s.font = {};
                ws[cellBObservacion].s.font.bold = true;
            }
        }
    }

    // Main title styling
    const mainTitleCellAddress = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (ws[mainTitleCellAddress]) {
        ws[mainTitleCellAddress].s = {
            font: { ...titleFont },
            alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }
        };
        if (!ws['!merges'].some(m => m.s.r === 0 && m.s.c === 0 && m.e.r === 0 && m.e.c === 1)) {
            ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });
        }
    }
    
    ws['!cols'] = [{ wch: 35 }, { wch: 45 }];
    ws['!rows'] = []; // IMPORTANT: Remove ALL explicit row height settings to allow auto-fit

    // Print Setup: Fit Sheet on One Page
    ws['!printSetup'] = {
      fitToWidth: 1,
      fitToHeight: 1, // CRUCIAL for "Imprimir hoja en una sola hoja"
      paperSize: 9,   // US Letter (9 is common for xlsx library)
      orientation: 'portrait',
      printArea: 'A1:B50' // Max print area to consider for fitting
    };
    
    ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 1, r: Math.min(currentNumRows - 1, 49) }});


    const sheetName = `Solicitud ${index + 1}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const fileName = `SolicitudesCheque_${examInfo.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

