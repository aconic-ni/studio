
import type { ExamData, SolicitudData, ExportableExamData, SolicitudRecord } from '@/types';
import type { Timestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const formatDateForExport = (dateValue: Date | Timestamp | string | null | undefined): string => {
  if (!dateValue) return 'N/A';
  if (typeof dateValue === 'string') return dateValue; // Already formatted string
  const dateObj = dateValue instanceof Date ? dateValue : (dateValue as Timestamp).toDate();
  return format(dateObj, "yyyy-MM-dd HH:mm:ss", { locale: es }); // More precise format
};

const formatCurrencyForExportDisplay = (amount?: number | string, currency?: string) => {
    if (amount === undefined || amount === null || amount === '') return 'N/A';
    const num = Number(amount);
    if (isNaN(num)) return String(amount); // Return as string if not a valid number
    // For Excel, it's often better to export raw numbers and let Excel handle currency formatting
    // However, if a prefix is needed, it can be added. For display consistency:
    let prefix = '';
    if (currency === 'cordoba') prefix = 'C$';
    else if (currency === 'dolar') prefix = 'US$';
    else if (currency === 'euro') prefix = '€';
    return `${prefix}${num.toFixed(2)}`;
};

const formatBooleanForExportDisplay = (value?: boolean): string => {
  return value ? 'Sí' : 'No';
};


export function downloadTxtFile(examData: ExamData, solicitudes: SolicitudData[]) {
  let content = `SOLICITUD DE CHEQUE - CustomsFA-L\n`;
  content += `===========================================\n\n`;
  content += `INFORMACIÓN GENERAL:\n`;
  content += `A (Destinatario): ${examData.recipient}\n`;
  content += `De (Colaborador): ${examData.manager}\n`;
  content += `Fecha: ${examData.date ? format(examData.date, "PPP", { locale: es }) : 'N/A'}\n`;
  content += `NE: ${examData.ne}\n`;
  content += `Referencia: ${examData.reference || 'N/A'}\n\n`;

  content += `SOLICITUDES (${solicitudes.length}):\n`;

  (Array.isArray(solicitudes) ? solicitudes : []).forEach((solicitud, index) => {
    content += `\n--- Solicitud ${index + 1} (ID: ${solicitud.id}) ---\n`;
    content += `Por este medio me dirijo a usted para solicitarle que elabore cheque por la cantidad de: ${formatCurrencyForExportDisplay(solicitud.monto, solicitud.montoMoneda)}\n`;
    content += `Cantidad en Letras: ${solicitud.cantidadEnLetras || 'N/A'}\n`;
    content += `Consignatario: ${solicitud.consignatario || 'N/A'}\n`;
    content += `Declaración Número: ${solicitud.declaracionNumero || 'N/A'}\n`;
    content += `Unidad Recaudadora: ${solicitud.unidadRecaudadora || 'N/A'}\n`;
    content += `Código 1: ${solicitud.codigo1 || 'N/A'}\n`;
    content += `Codigo MUR: ${solicitud.codigo2 || 'N/A'}\n`;

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

    content += `Impuestos Pagados Cliente: ${formatBooleanForExportDisplay(solicitud.impuestosPagadosCliente)}\n`;
    if (solicitud.impuestosPagadosCliente) {
        content += `  R/C: ${solicitud.impuestosPagadosRC || 'N/A'}\n`;
        content += `  T/B: ${solicitud.impuestosPagadosTB || 'N/A'}\n`;
        content += `  Cheque: ${solicitud.impuestosPagadosCheque || 'N/A'}\n`;
    }
    content += `Impuestos Pendientes Cliente: ${formatBooleanForExportDisplay(solicitud.impuestosPendientesCliente)}\n`;
    content += `Documentos Adjuntos: ${formatBooleanForExportDisplay(solicitud.documentosAdjuntos)}\n`;
    content += `Constancias de No Retención: ${formatBooleanForExportDisplay(solicitud.constanciasNoRetencion)}\n`;
    if (solicitud.constanciasNoRetencion) {
        content += `  1%: ${formatBooleanForExportDisplay(solicitud.constanciasNoRetencion1)}\n`;
        content += `  2%: ${formatBooleanForExportDisplay(solicitud.constanciasNoRetencion2)}\n`;
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

// New function to generate Excel from a simple table of data (array of objects)
export function downloadExcelFileFromTable(data: Record<string, any>[], headers: string[], fileName: string) {
  const wb = XLSX.utils.book_new();
  
  const ws_data = [
    headers,
    ...data.map(row => headers.map(header => {
      const value = row[header];
      // Attempt to format dates if they are Date objects, otherwise use the value
      if (value instanceof Date) {
        return format(value, "yyyy-MM-dd HH:mm:ss", { locale: es });
      }
      return value ?? 'N/A'; // Ensure null/undefined become 'N/A'
    }))
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // Auto-calculate column widths based on content
  const colWidths = headers.map((_, i) => {
    let maxLen = 0;
    ws_data.forEach(row => {
      const cellContent = row[i] ? String(row[i]) : '';
      if (cellContent.length > maxLen) {
        maxLen = cellContent.length;
      }
    });
    return { wch: Math.min(Math.max(maxLen, 10), 50) }; // Min 10, Max 50 width
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Resultados de Búsqueda");
  XLSX.writeFile(wb, fileName);
}


// Original detailed Excel export function, renamed to avoid conflict
export function downloadDetailedExcelFile(data: ExportableExamData) {
  const wb = XLSX.utils.book_new();
  const examInfo = data;

  (Array.isArray(data.products) ? data.products : []).forEach((solicitud, index) => {
    const sheetData: (string | number | Date | null | undefined)[][] = [];
    
    sheetData.push(['SOLICITUD DE CHEQUE - CustomsFA-L']);
    sheetData.push([]); 

    sheetData.push(['INFORMACIÓN GENERAL:']); 
    sheetData.push(['A (Destinatario):', examInfo.recipient]);
    sheetData.push(['De (Colaborador):', examInfo.manager]);
    sheetData.push(['Fecha de Examen:', examInfo.date ? format(examInfo.date instanceof Date ? examInfo.date : (examInfo.date as Timestamp).toDate(), "PPP", { locale: es }) : 'N/A']);
    sheetData.push(['NE (Tracking NX1):', examInfo.ne]);
    sheetData.push(['Referencia:', examInfo.reference || 'N/A']);
    if (examInfo.savedBy) sheetData.push(['Guardado por (correo):', examInfo.savedBy]);
    if (examInfo.savedAt) sheetData.push(['Fecha y Hora de Guardado:', formatDateForExport(examInfo.savedAt)]);
    
    sheetData.push([]);
    sheetData.push(['DETALLES DE LA SOLICITUD (ID: ' + solicitud.id + '):']);
    sheetData.push([]); 

    sheetData.push(['Por este medio me dirijo a usted para solicitarle que elabore cheque por la cantidad de:']);
    sheetData.push([formatCurrencyForExportDisplay(solicitud.monto, solicitud.montoMoneda)]); 
    
    sheetData.push(['Cantidad en Letras:']);
    sheetData.push([solicitud.cantidadEnLetras || 'N/A']);

    sheetData.push([]);
    sheetData.push(['INFORMACIÓN ADICIONAL DE SOLICITUD:']);
    sheetData.push(['  Consignatario:', solicitud.consignatario || 'N/A']);
    sheetData.push(['  Declaración Número:', solicitud.declaracionNumero || 'N/A']);
    sheetData.push(['  Unidad Recaudadora:', solicitud.unidadRecaudadora || 'N/A']);
    sheetData.push(['  Código 1:', solicitud.codigo1 || 'N/A']);
    sheetData.push(['  Codigo MUR:', solicitud.codigo2 || 'N/A']);
    
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
    sheetData.push(['  Impuestos pagados por el cliente mediante:', formatBooleanForExportDisplay(solicitud.impuestosPagadosCliente)]);
    if (solicitud.impuestosPagadosCliente) {
      sheetData.push(['    R/C No.:', solicitud.impuestosPagadosRC || 'N/A']);
      sheetData.push(['    T/B No.:', solicitud.impuestosPagadosTB || 'N/A']);
      sheetData.push(['    Cheque No.:', solicitud.impuestosPagadosCheque || 'N/A']);
    }
    sheetData.push(['  Impuestos pendientes de pago por el cliente:', formatBooleanForExportDisplay(solicitud.impuestosPendientesCliente)]);
    sheetData.push(['  Se añaden documentos adjuntos:', formatBooleanForExportDisplay(solicitud.documentosAdjuntos)]);
    sheetData.push(['  Constancias de no retención:', formatBooleanForExportDisplay(solicitud.constanciasNoRetencion)]);
    if (solicitud.constanciasNoRetencion) {
      sheetData.push(['    1%:', formatBooleanForExportDisplay(solicitud.constanciasNoRetencion1)]);
      sheetData.push(['    2%:', formatBooleanForExportDisplay(solicitud.constanciasNoRetencion2)]);
    }
    
    sheetData.push([]);
    sheetData.push(['COMUNICACIÓN Y OBSERVACIONES:']);
    sheetData.push(['  Correos de Notificación:', solicitud.correo || 'N/A']);
    
    sheetData.push(['  Observación:']);
    sheetData.push([solicitud.observation || 'N/A']); 
    
    const currentNumRows = sheetData.length;
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    const baseAlignment = { wrapText: true, vertical: 'top', horizontal: 'left' };

    for (let r = 0; r < currentNumRows; ++r) {
      for (let c = 0; c < 2; ++c) {
        const cellAddress = XLSX.utils.encode_cell({ r: r, c: c });
        const cellValue = sheetData[r]?.[c];

        if (!ws[cellAddress]) { // Ensure cell object exists
          if (cellValue !== undefined && cellValue !== null) {
            ws[cellAddress] = { v: cellValue };
          } else {
            continue; // Skip empty cells in sheetData
          }
        }
        
        if (typeof ws[cellAddress].v === 'string') {
          ws[cellAddress].t = 's';
        }

        if (!ws[cellAddress].s) ws[cellAddress].s = {};
        if (!ws[cellAddress].s.alignment) ws[cellAddress].s.alignment = { ...baseAlignment }; else Object.assign(ws[cellAddress].s.alignment, baseAlignment);
        if (!ws[cellAddress].s.font) ws[cellAddress].s.font = {};


        const isLabel = c === 0 && typeof cellValue === 'string' && cellValue.endsWith(':');
        const isValueInColA = c === 0 && !isLabel && r > 0 && typeof sheetData[r-1]?.[0] === 'string' && sheetData[r-1][0].endsWith(':');
        const isValueInColB = c === 1 && cellValue !== 'N/A' && (cellValue !== '' && cellValue !== null && cellValue !== undefined) ;


        if (isLabel && cellValue !== cellValue.toUpperCase()) { 
             ws[cellAddress].s.font.bold = true;
        } else if (isValueInColA && cellValue !== 'N/A' && (cellValue !== '' && cellValue !== null && cellValue !== undefined)) {
             ws[cellAddress].s.font.bold = true;
        } else if (isValueInColB) {
             ws[cellAddress].s.font.bold = true;
        }
      }
    }
    
    if (ws['A1']) {
      ws['A1'].s = { 
        font: { name: 'Calibri', sz: 14, bold: true }, 
        alignment: { ...baseAlignment, horizontal: 'center', wrapText: true, vertical: 'top' } 
      };
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });
    }

    sheetData.forEach((row, rIndex) => {
      if (row.length === 1 && typeof row[0] === 'string' && row[0] === row[0].toUpperCase() && row[0].endsWith(':')) {
        const cellAddr = XLSX.utils.encode_cell({ r: rIndex, c: 0 });
        if (ws[cellAddr]) {
           if(!ws[cellAddr].s) ws[cellAddr].s = {};
           ws[cellAddr].s.font = { name: 'Calibri', sz: 11, bold: true };
           ws[cellAddr].s.alignment = { ...baseAlignment, horizontal: 'left', wrapText: true, vertical: 'top' };
          if (!ws['!merges']) ws['!merges'] = [];
          ws['!merges'].push({ s: { r: rIndex, c: 0 }, e: { r: rIndex, c: 1 } });
        }
      }
    });
    
    let rowIndexCL = sheetData.findIndex(row => typeof row[0] === 'string' && row[0] === 'Cantidad en Letras:');
    if (rowIndexCL !== -1 && rowIndexCL + 1 < currentNumRows) {
        const cellAddr = XLSX.utils.encode_cell({ r: rowIndexCL + 1, c: 0 });
        if (ws[cellAddr]) {
            if (typeof ws[cellAddr].v === 'string') ws[cellAddr].t = 's';
            if(!ws[cellAddr].s) ws[cellAddr].s = {};
            ws[cellAddr].s.font = (ws[cellAddr].v && ws[cellAddr].v !== 'N/A') ? { bold: true } : {}; 
            ws[cellAddr].s.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
        }
    }

    let rowIndexObs = sheetData.findIndex(row => typeof row[0] === 'string' && row[0] === '  Observación:');
    if (rowIndexObs !== -1 && rowIndexObs + 1 < currentNumRows) {
        const cellAddr = XLSX.utils.encode_cell({ r: rowIndexObs + 1, c: 0 });
        if (ws[cellAddr]) {
            if (typeof ws[cellAddr].v === 'string') ws[cellAddr].t = 's';
             if(!ws[cellAddr].s) ws[cellAddr].s = {};
            ws[cellAddr].s.font = (ws[cellAddr].v && ws[cellAddr].v !== 'N/A') ? { bold: true } : {};
            ws[cellAddr].s.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
        }
    }
    
    ws['!cols'] = [{wch: 39.93}, {wch: 41.86}];
    ws['!rows'] = [];

    if (!ws['!printSetup']) ws['!printSetup'] = {};
    ws['!printSetup'].paperSize = 9; 
    ws['!printSetup'].orientation = 'portrait';
    ws['!printSetup'].fitToWidth = 1;
    ws['!printSetup'].fitToHeight = 1; 
    ws['!printSetup'].printArea = `A1:B${Math.min(currentNumRows, 50)}`;
    
    ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 1, r: Math.min(currentNumRows - 1, 49) }});

    const sheetName = `Solicitud ${index + 1}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const fileName = `SolicitudesCheque_${examInfo.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

