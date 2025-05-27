
import type { InitialDataContext, SolicitudData, ExportableSolicitudContextData, SolicitudRecord } from '@/types'; // Renamed
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


export function downloadTxtFile(initialContextData: InitialDataContext, solicitudes: SolicitudData[]) { // Renamed parameter
  let content = `SOLICITUD DE CHEQUE - CustomsFA-L\n`;
  content += `===========================================\n\n`;
  content += `INFORMACIÓN GENERAL:\n`;
  content += `A (Destinatario): ${initialContextData.recipient}\n`;
  content += `De (Colaborador): ${initialContextData.manager}\n`;
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
  a.download = `SolicitudCheque_${initialContextData.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.txt`; // Renamed
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

export function downloadDetailedExcelFile(data: ExportableSolicitudContextData) { // Renamed parameter type
  const wb = XLSX.utils.book_new();
  const generalInfo = data; // Renamed

  (Array.isArray(data.products) ? data.products : []).forEach((solicitud, index) => {
    const sheetData: (string | number | Date | null | undefined)[][] = [];
    
    sheetData.push(['SOLICITUD DE CHEQUE - CustomsFA-L']);
    sheetData.push([]); 

    sheetData.push(['INFORMACIÓN GENERAL:']); 
    sheetData.push(['A (Destinatario):', generalInfo.recipient]);
    sheetData.push(['De (Colaborador):', generalInfo.manager]);
    sheetData.push(['Fecha de Solicitud:', generalInfo.date ? format(generalInfo.date instanceof Date ? generalInfo.date : (generalInfo.date as Timestamp).toDate(), "PPP", { locale: es }) : 'N/A']);
    sheetData.push(['NE (Tracking NX1):', generalInfo.ne]);
    sheetData.push(['Referencia:', generalInfo.reference || 'N/A']);
    if (generalInfo.savedBy) sheetData.push(['Guardado por (correo):', generalInfo.savedBy]);
    if (generalInfo.savedAt) sheetData.push(['Fecha y Hora de Guardado:', formatDateForExport(generalInfo.savedAt)]);
    
    sheetData.push([]);
    sheetData.push(['DETALLES DE LA SOLICITUD (ID: ' + solicitud.id + '):']);
    sheetData.push([]); 

    sheetData.push(['Por este medio me dirijo a usted para solicitarle que elabore cheque por la cantidad de:']);
    sheetData.push([formatCurrencyForExportDisplay(solicitud.monto, solicitud.montoMoneda)]); 
    
    sheetData.push(['Cantidad en Letras:', solicitud.cantidadEnLetras || 'N/A']);
    // sheetData.push([solicitud.cantidadEnLetras || 'N/A']);

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
    // sheetData.push([solicitud.observation || 'N/A']); 
    
    const currentNumRows = sheetData.length;
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    
    // Apply styles more carefully
    const baseAlignment = { wrapText: true, vertical: 'top', horizontal: 'left' };

    for (let r = 0; r < currentNumRows; ++r) {
        for (let c = 0; c < 2; ++c) { // Assuming 2 columns A and B
            const cellAddress = XLSX.utils.encode_cell({ r: r, c: c });
            let cellValue = sheetData[r]?.[c];

            if (!ws[cellAddress]) { // Ensure cell object exists
                if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
                    ws[cellAddress] = { t: 's', v: cellValue }; // Default to string type if creating
                } else {
                    ws[cellAddress] = { t: 's', v: '' }; // Create empty string cell to apply styles
                }
            }
            
            if (typeof ws[cellAddress].v === 'string' && ws[cellAddress].t !== 's') { // Correct type if inferred differently
              ws[cellAddress].t = 's';
            }


            if (!ws[cellAddress].s) ws[cellAddress].s = {}; // Ensure style object exists
            if (!ws[cellAddress].s.alignment) ws[cellAddress].s.alignment = {}; // Ensure alignment object exists
            
            // Apply base alignment (wrap text, top align, left align)
            ws[cellAddress].s.alignment.wrapText = true;
            ws[cellAddress].s.alignment.vertical = 'top';
            if (!ws[cellAddress].s.alignment.horizontal) { // Only set default horizontal if not already set
                 ws[cellAddress].s.alignment.horizontal = 'left';
            }


            if (!ws[cellAddress].s.font) ws[cellAddress].s.font = {};

            // Bold user-entered values (Column B for label-value pairs, or Col A if value is standalone)
            const isValueCell = (c === 1 && typeof sheetData[r]?.[0] === 'string' && (sheetData[r][0] as string).endsWith(':')) ||
                                (c === 0 && typeof cellValue === 'string' && !cellValue.endsWith(':') && !(cellValue.toUpperCase() === cellValue && cellValue.endsWith(':'))); // Standalone value in Col A

            if (isValueCell && cellValue && cellValue !== 'N/A' && cellValue !== '') {
                ws[cellAddress].s.font.bold = true;
            }

            // Bold labels in Column A that end with a colon
            if (c === 0 && typeof cellValue === 'string' && cellValue.endsWith(':') && !(cellValue.toUpperCase() === cellValue && cellValue.endsWith(':'))) {
                ws[cellAddress].s.font.bold = true;
            }
        }
    }

    // Main title style
    if (ws['A1']) {
      ws['A1'].s = { 
        font: { name: 'Calibri', sz: 14, bold: true }, 
        alignment: { wrapText: true, vertical: 'top', horizontal: 'center' } 
      };
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }); // Merge A1:B1
    }

    // Section headers (uppercase and ending with ':')
    sheetData.forEach((row, rIndex) => {
      if (row.length === 1 && typeof row[0] === 'string' && row[0] === row[0].toUpperCase() && row[0].endsWith(':')) {
        const cellAddr = XLSX.utils.encode_cell({ r: rIndex, c: 0 });
        if (ws[cellAddr]) {
           if(!ws[cellAddr].s) ws[cellAddr].s = {};
           ws[cellAddr].s.font = { name: 'Calibri', sz: 11, bold: true };
           ws[cellAddr].s.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
          if (!ws['!merges']) ws['!merges'] = [];
          ws['!merges'].push({ s: { r: rIndex, c: 0 }, e: { r: rIndex, c: 1 } }); // Merge across A and B
        }
      }
    });
    
    // Specific justification for Cantidad en Letras (value cell)
    const rowIndexCL = sheetData.findIndex(row => typeof row[0] === 'string' && row[0] === 'Cantidad en Letras:');
    if (rowIndexCL !== -1 && rowIndexCL + 1 < currentNumRows) { // Value is on the next row, Col A
        const cellAddrCLValue = XLSX.utils.encode_cell({ r: rowIndexCL + 1, c: 0 });
        if (ws[cellAddrCLValue]) {
            if (!ws[cellAddrCLValue].s) ws[cellAddrCLValue].s = {};
            if (!ws[cellAddrCLValue].s.alignment) ws[cellAddrCLValue].s.alignment = {};
            ws[cellAddrCLValue].t = 's';
            ws[cellAddrCLValue].s.alignment.wrapText = true;
            ws[cellAddrCLValue].s.alignment.vertical = 'top';
            ws[cellAddrCLValue].s.alignment.horizontal = 'left'; // Changed from justify to left
             if (ws[cellAddrCLValue].v && ws[cellAddrCLValue].v !== 'N/A' && ws[cellAddrCLValue].v !== '') {
                 if(!ws[cellAddrCLValue].s.font) ws[cellAddrCLValue].s.font = {};
                 ws[cellAddrCLValue].s.font.bold = true;
            }
        }
    }

    // Specific wrap for Observacion (value cell)
    const rowIndexObs = sheetData.findIndex(row => typeof row[0] === 'string' && row[0] === '  Observación:');
    if (rowIndexObs !== -1 && rowIndexObs + 1 < currentNumRows) { // Value is on the next row, Col A
        const cellAddrObsValue = XLSX.utils.encode_cell({ r: rowIndexObs + 1, c: 0 });
        if (ws[cellAddrObsValue]) {
             if (!ws[cellAddrObsValue].s) ws[cellAddrObsValue].s = {};
             if (!ws[cellAddrObsValue].s.alignment) ws[cellAddrObsValue].s.alignment = {};
             ws[cellAddrObsValue].t = 's';
             ws[cellAddrObsValue].s.alignment.wrapText = true;
             ws[cellAddrObsValue].s.alignment.vertical = 'top';
             ws[cellAddrObsValue].s.alignment.horizontal = 'left';
             if (ws[cellAddrObsValue].v && ws[cellAddrObsValue].v !== 'N/A' && ws[cellAddrObsValue].v !== '') {
                 if(!ws[cellAddrObsValue].s.font) ws[cellAddrObsValue].s.font = {};
                 ws[cellAddrObsValue].s.font.bold = true;
            }
        }
    }
    
    ws['!cols'] = [{wch: 39.93}, {wch: 41.86}];
    ws['!rows'] = []; // Let Excel auto-adjust row heights for wrapped text

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

  const fileName = `SolicitudesCheque_${generalInfo.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.xlsx`; // Renamed
  XLSX.writeFile(wb, fileName);
}
