
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

    // Main Title
    sheetData.push(['SOLICITUD DE CHEQUE - CustomsFA-L']);
    sheetData.push([]); // Empty row for spacing

    // General Information Section
    sheetData.push(['INFORMACIÓN GENERAL:']);
    sheetData.push(['A (Destinatario):', examInfo.recipient]);
    sheetData.push(['De (Colaborador):', examInfo.manager]);
    sheetData.push(['Fecha de Examen:', formatDate(examInfo.date)]);
    sheetData.push(['NE (Tracking NX1):', examInfo.ne]);
    sheetData.push(['Referencia:', examInfo.reference || 'N/A']);
    if (examInfo.savedBy) sheetData.push(['Guardado por (correo):', examInfo.savedBy]);
    if (examInfo.savedAt) sheetData.push(['Fecha y Hora de Guardado:', formatDate(examInfo.savedAt)]);
    sheetData.push([]); // Empty row

    // Detalle de la Solicitud
    sheetData.push(['DETALLES DE LA SOLICITUD:']);
    sheetData.push([]); // Empty row

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

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const numRows = sheetData.length;

    if (!ws['!rows']) ws['!rows'] = [];
    let cantidadEnLetrasRowIndex = -1;
    let observacionRowIndex = -1;

    const baseAlignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
    const boldFont = { bold: true };

    for (let r = 0; r < numRows; r++) {
      const row = sheetData[r];
      for (let c = 0; c < 2; c++) { // Only format columns A and B
        const cellValue = row[c];
        const cellAddress = XLSX.utils.encode_cell({ r, c });

        if (!ws[cellAddress]) { // Ensure cell object exists
          ws[cellAddress] = { t: typeof cellValue === 'number' ? 'n' : 's', v: cellValue };
        } else if (typeof ws[cellAddress].v === 'undefined' && typeof cellValue !== 'undefined') {
          ws[cellAddress].v = cellValue;
          ws[cellAddress].t = typeof cellValue === 'number' ? 'n' : 's';
        }
        
        if (!ws[cellAddress].s) ws[cellAddress].s = {};
        ws[cellAddress].s.alignment = { ...baseAlignment }; // Apply base wrap text and top alignment

        // Apply bold to user-entered values (column B, or column A if no col B value)
        if (c === 1 && cellValue !== 'N/A' && cellValue !== '') {
          ws[cellAddress].s.font = { ...ws[cellAddress].s.font, ...boldFont };
        } else if (c === 0 && (typeof row[1] === 'undefined' || String(row[1]).trim() === '') && cellValue !== 'N/A' && cellValue !== '' && !String(cellValue).endsWith(':')) {
           // Bolding for single column values like the numeric Monto
           if (String(cellValue).startsWith('C$') || String(cellValue).startsWith('US$') || String(cellValue).startsWith('€')) {
             ws[cellAddress].s.font = { ...ws[cellAddress].s.font, ...boldFont };
           }
        }
      }
      // Find specific rows for later processing
      const labelInColA = String(row[0] ?? '').trim();
      if (labelInColA === 'Cantidad en Letras:') {
        cantidadEnLetrasRowIndex = r;
      }
      if (labelInColA === '  Observación:') {
        observacionRowIndex = r;
      }
    }
    
    // Specific justification and height for "Cantidad en Letras" value cell
    if (cantidadEnLetrasRowIndex !== -1) {
        const cellBAddress = XLSX.utils.encode_cell({ r: cantidadEnLetrasRowIndex, c: 1 });
        if (ws[cellBAddress]) {
            if (!ws[cellBAddress].s) ws[cellBAddress].s = {};
            if (!ws[cellBAddress].s.alignment) ws[cellBAddress].s.alignment = {};
            ws[cellBAddress].s.alignment.wrapText = true;
            ws[cellBAddress].s.alignment.vertical = 'top';
            ws[cellBAddress].s.alignment.horizontal = 'justify';
            if (solicitud.cantidadEnLetras && solicitud.cantidadEnLetras !== 'N/A') {
                ws[cellBAddress].s.font = { ...ws[cellBAddress].s.font, ...boldFont };
            }
            if(!ws['!rows']![cantidadEnLetrasRowIndex]) ws['!rows']![cantidadEnLetrasRowIndex] = {};
            ws['!rows']![cantidadEnLetrasRowIndex].hpt = 72.90; // ~170px / 2.33 (common conversion)
        }
    }
    
    // Specific alignment and height for "Observación" value cell
    if (observacionRowIndex !== -1) {
        const cellBAddress = XLSX.utils.encode_cell({ r: observacionRowIndex, c: 1 });
        if (ws[cellBAddress]) {
            if (!ws[cellBAddress].s) ws[cellBAddress].s = {};
            if (!ws[cellBAddress].s.alignment) ws[cellBAddress].s.alignment = {};
            ws[cellBAddress].s.alignment.wrapText = true;
            ws[cellBAddress].s.alignment.vertical = 'top';
            ws[cellBAddress].s.alignment.horizontal = 'left'; // Observations are usually left-aligned
             if (solicitud.observation && solicitud.observation !== 'N/A') {
                ws[cellBAddress].s.font = { ...ws[cellBAddress].s.font, ...boldFont };
            }
            if(!ws['!rows']![observacionRowIndex]) ws['!rows']![observacionRowIndex] = {};
            ws['!rows']![observacionRowIndex].hpt = 72.90;
        }
    }

    // Style and merge titles
    if (!ws['!merges']) ws['!merges'] = [];
    const addMergeIfNotExists = (newMerge: XLSX.Range) => {
        const exists = ws['!merges']!.some(m => 
            m.s.r === newMerge.s.r && m.s.c === newMerge.s.c &&
            m.e.r === newMerge.e.r && m.e.c === newMerge.e.c
        );
        if (!exists) ws['!merges']!.push(newMerge);
    };
    
    // Main Title
    const mainTitleCellA = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if(ws[mainTitleCellA]) {
        ws[mainTitleCellA].s = { 
            font: { ...boldFont, sz: 14 }, 
            alignment: { ...baseAlignment, horizontal: 'center', vertical: 'middle' } 
        };
        addMergeIfNotExists({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });
    }

    // Section Titles
    sheetData.forEach((row, rIndex) => {
        const cellValueColA = String(row[0] ?? '').trim();
        if (cellValueColA.endsWith(':') && cellValueColA === cellValueColA.toUpperCase() && (typeof row[1] === 'undefined' || String(row[1]).trim() === '') && rIndex !== 0) {
            const cellAddr = XLSX.utils.encode_cell({ r: rIndex, c: 0 });
            if(ws[cellAddr]) {
                ws[cellAddr].s = { 
                    font: { ...boldFont }, 
                    alignment: { ...baseAlignment, vertical: 'middle' } // Section titles vertically centered
                };
                addMergeIfNotExists({ s: { r: rIndex, c: 0 }, e: { r: rIndex, c: 1 } });
            }
        }
    });
    
    ws['!cols'] = [ {wch: 35}, {wch: 45} ]; // Column A width 35, Column B width 45
    ws['!ref'] = `A1:B${Math.min(numRows, 45)}`; 

    ws['!printSetup'] = {
        printArea: `A1:B45`, 
        fitToWidth: 1,
        fitToHeight: 0, // Allow vertical overflow if scale is used, scale will handle single page
        scale: 83,     // Scale to 83%
        paperSize: 1,  // US Letter   
        orientation: 'portrait'
    };

    const sheetName = `Solicitud ${index + 1}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const fileName = `SolicitudesCheque_${examInfo.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
