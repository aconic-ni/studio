
import type { InitialDataContext, SolicitudData, ExportableSolicitudContextData, SolicitudRecord } from '@/types';
import type { Timestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const formatDateForExport = (dateValue: Date | Timestamp | string | null | undefined): string => {
  if (!dateValue) return 'N/A';
  if (typeof dateValue === 'string') return dateValue; 
  const dateObj = dateValue instanceof Date ? dateValue : (dateValue as Timestamp).toDate();
  return format(dateObj, "yyyy-MM-dd HH:mm:ss", { locale: es });
};

const formatCurrencyForExportDisplay = (amount?: number | string, currency?: string) => {
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


export function downloadTxtFile(initialContextData: InitialDataContext, solicitudes: SolicitudData[]) {
  let content = `SOLICITUD DE CHEQUE - CustomsFA-L\n`;
  content += `===========================================\n\n`;
  content += `INFORMACIÓN GENERAL:\n`;
  content += `A (Destinatario): ${initialContextData.recipient}\n`;
  content += `De (Usuario): ${initialContextData.manager}\n`; // Changed "Colaborador" to "Usuario"
  content += `Fecha Solicitud: ${initialContextData.date ? format(initialContextData.date, "PPP", { locale: es }) : 'N/A'}\n`;
  content += `NE: ${initialContextData.ne}\n`;
  content += `Referencia: ${initialContextData.reference || 'N/A'}\n\n`;

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
  a.download = `SolicitudCheque_${initialContextData.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadExcelFileFromTable(data: Record<string, any>[], headers: string[], fileName: string) {
  const wb = XLSX.utils.book_new();
  
  const ws_data = [
    headers,
    ...data.map(row => headers.map(header => {
      const value = row[header];
      if (value instanceof Date) {
        return format(value, "yyyy-MM-dd HH:mm:ss", { locale: es });
      }
      return value ?? 'N/A'; 
    }))
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  const colWidths = headers.map((_, i) => {
    let maxLen = 0;
    ws_data.forEach(row => {
      const cellContent = row[i] ? String(row[i]) : '';
      if (cellContent.length > maxLen) {
        maxLen = cellContent.length;
      }
    });
    return { wch: Math.min(Math.max(maxLen, 10), 50) }; 
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Resultados de Búsqueda");
  XLSX.writeFile(wb, fileName);
}


export function downloadDetailedExcelFile(data: ExportableSolicitudContextData) {
  const wb = XLSX.utils.book_new();
  const generalInfo = data;

  (Array.isArray(data.products) ? data.products : []).forEach((solicitud, index) => {
    const sheetData: (string | number | Date | null | undefined)[][] = [];
    let currentNumRows = 0; // Track rows for this sheet

    const addRow = (rowData: (string | number | Date | null | undefined)[]) => {
      sheetData.push(rowData);
      currentNumRows++;
    };
    
    addRow(['SOLICITUD DE CHEQUE - CustomsFA-L']);
    addRow([]); 

    addRow(['INFORMACIÓN GENERAL:']); 
    addRow(['A (Destinatario):', generalInfo.recipient]);
    addRow(['De (Usuario):', generalInfo.manager]); // Changed "Colaborador" to "Usuario"
    addRow(['Fecha de Solicitud:', generalInfo.date ? format(generalInfo.date instanceof Date ? generalInfo.date : (generalInfo.date as Timestamp).toDate(), "PPP", { locale: es }) : 'N/A']);
    addRow(['NE (Tracking NX1):', generalInfo.ne]);
    addRow(['Referencia:', generalInfo.reference || 'N/A']);
    if (generalInfo.savedBy) addRow(['Guardado por (correo):', generalInfo.savedBy]);
    if (generalInfo.savedAt) addRow(['Fecha y Hora de Guardado:', formatDateForExport(generalInfo.savedAt)]);
    
    addRow([]);
    addRow(['DETALLES DE LA SOLICITUD (ID: ' + solicitud.id + '):']);
    addRow([]); 

    addRow(['Por este medio me dirijo a usted para solicitarle que elabore cheque por la cantidad de:']);
    addRow([formatCurrencyForExportDisplay(solicitud.monto, solicitud.montoMoneda)]); 
    
    addRow(['Cantidad en Letras:']);
    addRow([solicitud.cantidadEnLetras || 'N/A']);

    addRow([]);
    addRow(['INFORMACIÓN ADICIONAL DE SOLICITUD:']);
    addRow(['  Consignatario:', solicitud.consignatario || 'N/A']);
    addRow(['  Declaración Número:', solicitud.declaracionNumero || 'N/A']);
    addRow(['  Unidad Recaudadora:', solicitud.unidadRecaudadora || 'N/A']);
    addRow(['  Código 1:', solicitud.codigo1 || 'N/A']);
    addRow(['  Codigo MUR:', solicitud.codigo2 || 'N/A']);
    
    addRow([]);
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
    
    addRow([]);
    addRow(['BENEFICIARIO DEL PAGO:']);
    addRow(['  Elaborar Cheque A:', solicitud.elaborarChequeA || 'N/A']);
    addRow(['  Elaborar Transferencia A:', solicitud.elaborarTransferenciaA || 'N/A']);
    
    addRow([]);
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
    
    addRow([]);
    addRow(['COMUNICACIÓN Y OBSERVACIONES:']);
    addRow(['  Correos de Notificación:', solicitud.correo || 'N/A']);
    
    addRow(['  Observación:']); 
    addRow([solicitud.observation || 'N/A']); 
    
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    
    const baseAlignment = { wrapText: true, vertical: 'top', horizontal: 'left' };

    for (let r = 0; r < currentNumRows; ++r) {
      for (let c = 0; c < 2; ++c) { 
        const cellAddress = XLSX.utils.encode_cell({ r: r, c: c });
        const cellValue = sheetData[r]?.[c];

        if (!ws[cellAddress] && (cellValue !== undefined && cellValue !== null && cellValue !== '')) {
            ws[cellAddress] = { t: (typeof cellValue === 'number' ? 'n' : 's'), v: cellValue };
        } else if (!ws[cellAddress]) {
            ws[cellAddress] = { t: 's', v: '' }; // Ensure cell object exists even if empty
        }
        
        if (typeof ws[cellAddress].v === 'string' && ws[cellAddress].t !== 's') {
          ws[cellAddress].t = 's';
        }
        if (typeof ws[cellAddress].v === 'number' && ws[cellAddress].t !== 'n') {
          ws[cellAddress].t = 'n';
        }
        if (ws[cellAddress].v instanceof Date && ws[cellAddress].t !== 'd') {
            ws[cellAddress].t = 'd';
        }


        if (!ws[cellAddress].s) ws[cellAddress].s = {};
        if (!ws[cellAddress].s.alignment) ws[cellAddress].s.alignment = {};
        
        ws[cellAddress].s.alignment.wrapText = true;
        ws[cellAddress].s.alignment.vertical = 'top';
        if (!ws[cellAddress].s.alignment.horizontal) {
             ws[cellAddress].s.alignment.horizontal = 'left';
        }

        if (!ws[cellAddress].s.font) ws[cellAddress].s.font = {};

        // Bold labels in Column A that end with a colon (and are not section titles)
        if (c === 0 && typeof cellValue === 'string' && cellValue.endsWith(':') && !(cellValue.toUpperCase() === cellValue && cellValue.endsWith(':')) ) {
            ws[cellAddress].s.font.bold = true;
        }

        // Bold user-entered values (Column B for label-value pairs, or Col A if value is standalone)
        const isValueCell = (c === 1 && typeof sheetData[r]?.[0] === 'string' && (sheetData[r][0] as string).endsWith(':')) ||
                            (c === 0 && typeof cellValue === 'string' && !cellValue.endsWith(':') && !(cellValue.toUpperCase() === cellValue && cellValue.endsWith(':'))); 
                            
        if (isValueCell && cellValue && cellValue !== 'N/A' && cellValue !== '') {
            ws[cellAddress].s.font.bold = true;
        }
      }
    }

    if (ws['A1']) {
      ws['A1'].s = { 
        font: { name: 'Calibri', sz: 14, bold: true }, 
        alignment: { ...baseAlignment, horizontal: 'center' } 
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
           ws[cellAddr].s.alignment = { ...baseAlignment, horizontal: 'left' };
          if (!ws['!merges']) ws['!merges'] = [];
          ws['!merges'].push({ s: { r: rIndex, c: 0 }, e: { r: rIndex, c: 1 } }); 
        }
      }
    });
    
    const rowIndexCL = sheetData.findIndex(row => typeof row[0] === 'string' && row[0] === 'Cantidad en Letras:');
    if (rowIndexCL !== -1 && rowIndexCL + 1 < currentNumRows) {
        const cellAddressValue = XLSX.utils.encode_cell({ r: rowIndexCL + 1, c: 0 }); // Value is now in Col A
        if (ws[cellAddressValue]) {
            if(!ws[cellAddressValue].s) ws[cellAddressValue].s = {};
            ws[cellAddressValue].t = 's'; // Ensure it's treated as text
            ws[cellAddressValue].s.alignment = { ...baseAlignment, horizontal: 'left' }; // Changed from justify
            if (ws[cellAddressValue].v && ws[cellAddressValue].v !== 'N/A' && ws[cellAddressValue].v !== '') {
                 if(!ws[cellAddressValue].s.font) ws[cellAddressValue].s.font = {};
                 ws[cellAddressValue].s.font.bold = true;
            }
        }
    }

    const rowIndexObs = sheetData.findIndex(row => typeof row[0] === 'string' && row[0] === '  Observación:');
    if (rowIndexObs !== -1 && rowIndexObs + 1 < currentNumRows) {
        const cellAddressValue = XLSX.utils.encode_cell({ r: rowIndexObs + 1, c: 0 }); // Value is now in Col A
        if (ws[cellAddressValue]) {
             if (!ws[cellAddressValue].s) ws[cellAddressValue].s = {};
             ws[cellAddressValue].t = 's'; // Ensure it's treated as text
             ws[cellAddressValue].s.alignment = { ...baseAlignment, horizontal: 'left' };
             if (ws[cellAddressValue].v && ws[cellAddressValue].v !== 'N/A' && ws[cellAddressValue].v !== '') {
                 if(!ws[cellAddressValue].s.font) ws[cellAddressValue].s.font = {};
                 ws[cellAddressValue].s.font.bold = true;
            }
        }
    }
    
    ws['!cols'] = [{wch: 39.93}, {wch: 41.86}];
    ws['!rows'] = []; // Let Excel auto-adjust row heights

    if (!ws['!printSetup']) ws['!printSetup'] = {};
    ws['!printSetup'].paperSize = 9; // US Letter
    ws['!printSetup'].orientation = 'portrait';
    ws['!printSetup'].printArea = `A1:B${Math.min(currentNumRows, 50)}`; 
    ws['!printSetup'].fitToWidth = 1;
    ws['!printSetup'].fitToHeight = 1;
    
    ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 1, r: Math.min(currentNumRows - 1, 49) }});

    const sheetName = `Solicitud ${index + 1}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const fileName = `SolicitudesCheque_${generalInfo.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
