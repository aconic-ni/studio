
import type { ExamData, SolicitudData, ExportableExamData } from '@/types';
import type { Timestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const formatDate = (dateValue: Date | Timestamp | string | null | undefined): string => {
  if (!dateValue) return 'N/A';
  if (typeof dateValue === 'string') return dateValue; // Already formatted or a string
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
    
    // --- DATA POPULATION ---
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
    
    // Modified: Cantidad en Letras value moved to Col A on a new row
    sheetData.push(['Cantidad en Letras:']);
    sheetData.push([solicitud.cantidadEnLetras || 'N/A']);

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
    
    // Modified: Observación value moved to Col A on a new row
    sheetData.push(['  Observación:']);
    sheetData.push([solicitud.observation || 'N/A']);
    
    const currentNumRows = sheetData.length;
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // --- STYLING ---
    // Remove ALL explicit row height settings to allow auto-height for wrapped text
    ws['!rows'] = []; 

    const mainTitleFont = { name: 'Calibri', sz: 14, bold: true };
    const sectionTitleFont = { name: 'Calibri', sz: 11, bold: true };
    const labelFont = { name: 'Calibri', sz: 11, bold: false }; // Labels are not bold by default
    const valueFont = { name: 'Calibri', sz: 11, bold: true };  // User-entered values are bold

    let rowIndexCantidadEnLetrasLabel = -1;
    let rowIndexObservacionLabel = -1;

    sheetData.forEach((row, rIndex) => {
      const isSectionTitleRow = typeof row[0] === 'string' && row[0].endsWith(':') && row[0] === row[0].toUpperCase() && row.length === 1;
      const isLabelWithValueRow = row.length > 1 && typeof row[0] === 'string' && row[0].endsWith(':');
      const isSingleValueRow = row.length === 1 && typeof row[0] === 'string' && !(row[0].endsWith(':') && row[0] === row[0].toUpperCase());
      
      // Find row indices for specific value cells
      if (typeof row[0] === 'string' && row[0] === 'Cantidad en Letras:') {
        rowIndexCantidadEnLetrasLabel = rIndex;
      }
      if (typeof row[0] === 'string' && row[0] === '  Observación:') {
        rowIndexObservacionLabel = rIndex;
      }

      row.forEach((cellValue, cIndex) => {
        if (cIndex > 1) return; // Only process columns A and B

        const cellAddress = XLSX.utils.encode_cell({ r: rIndex, c: cIndex });
        if (!ws[cellAddress]) { // Ensure cell object exists
            ws[cellAddress] = { t: 's', v: cellValue === null || cellValue === undefined ? "" : String(cellValue) };
        } else {
            ws[cellAddress].v = cellValue === null || cellValue === undefined ? "" : String(cellValue);
        }
        
        // Explicitly set cell type to string for text cells to help with wrapping
        if (typeof cellValue === 'string') {
          ws[cellAddress].t = 's';
        }

        if (!ws[cellAddress].s) ws[cellAddress].s = {};
        if (!ws[cellAddress].s.alignment) ws[cellAddress].s.alignment = {};
        
        // Base alignment: wrap text, top align, left align for all content
        ws[cellAddress].s.alignment.wrapText = true; 
        ws[cellAddress].s.alignment.vertical = 'top';
        ws[cellAddress].s.alignment.horizontal = 'left'; // Default to left for most content

        // Font styling
        ws[cellAddress].s.font = { ...labelFont }; // Default to label font

        if (isSectionTitleRow && cIndex === 0) {
          ws[cellAddress].s.font = { ...sectionTitleFont };
        } else if (isLabelWithValueRow) {
            if (cIndex === 0) { // Label in Col A
                ws[cellAddress].s.font = { ...labelFont };
            } else if (cIndex === 1) { // Value in Col B
                if (cellValue !== 'N/A' && String(cellValue).trim() !== '') {
                    ws[cellAddress].s.font = { ...valueFont };
                }
            }
        } else if (isSingleValueRow && cIndex === 0) { // Single value in Col A (e.g. Monto, or new Cantidad en Letras/Observacion value)
            if (cellValue !== 'N/A' && String(cellValue).trim() !== '') {
                ws[cellAddress].s.font = { ...valueFont };
            }
        }
      });

      // Merge section titles
      if (isSectionTitleRow) {
          if (!ws['!merges']) ws['!merges'] = [];
          ws['!merges'].push({ s: { r: rIndex, c: 0 }, e: { r: rIndex, c: 1 } });
      }
    });

    // Main title styling
    const mainTitleCellAddress = 'A1';
    if (ws[mainTitleCellAddress]) {
        ws[mainTitleCellAddress].s = {
            font: { ...mainTitleFont },
            alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }
        };
         if (!ws['!merges']) ws['!merges'] = [];
         ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }); // Merge A1:B1
    }
    
    // Specific styling for Cantidad en Letras value (now in Col A, row after its label)
    if (rowIndexCantidadEnLetrasLabel !== -1 && rowIndexCantidadEnLetrasLabel + 1 < currentNumRows) {
        const cellAddressCLValue = XLSX.utils.encode_cell({ r: rowIndexCantidadEnLetrasLabel + 1, c: 0 });
        if (!ws[cellAddressCLValue]) ws[cellAddressCLValue] = { t: 's', v: solicitud.cantidadEnLetras || 'N/A' };
        else ws[cellAddressCLValue].v = solicitud.cantidadEnLetras || 'N/A';
        ws[cellAddressCLValue].t = 's';
        if (!ws[cellAddressCLValue].s) ws[cellAddressCLValue].s = {};
        ws[cellAddressCLValue].s.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
        if (solicitud.cantidadEnLetras && solicitud.cantidadEnLetras !== 'N/A') {
             if(!ws[cellAddressCLValue].s.font) ws[cellAddressCLValue].s.font = {};
             ws[cellAddressCLValue].s.font.bold = true;
        }
    }

    // Specific styling for Observacion value (now in Col A, row after its label)
    if (rowIndexObservacionLabel !== -1 && rowIndexObservacionLabel + 1 < currentNumRows) {
        const cellAddressObsValue = XLSX.utils.encode_cell({ r: rowIndexObservacionLabel + 1, c: 0 });
        if (!ws[cellAddressObsValue]) ws[cellAddressObsValue] = { t: 's', v: solicitud.observation || 'N/A' };
        else ws[cellAddressObsValue].v = solicitud.observation || 'N/A';
        ws[cellAddressObsValue].t = 's';
        if (!ws[cellAddressObsValue].s) ws[cellAddressObsValue].s = {};
        ws[cellAddressObsValue].s.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
         if (solicitud.observation && solicitud.observation !== 'N/A') {
            if(!ws[cellAddressObsValue].s.font) ws[cellAddressObsValue].s.font = {};
            ws[cellAddressObsValue].s.font.bold = true;
        }
    }
    
    ws['!cols'] = [{ wch: 35 }, { wch: 45 }];

    // Print Setup: Fit Sheet on One Page
    ws['!printSetup'] = {
      printArea: `A1:B${Math.min(currentNumRows, 50)}`, // Print up to 50 rows or actual rows if less
      fitToWidth: 1,
      fitToHeight: 1, 
      paperSize: 9,   // US Letter
      orientation: 'portrait',
    };
    
    ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 1, r: Math.min(currentNumRows - 1, 49) }});

    const sheetName = `Solicitud ${index + 1}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const fileName = `SolicitudesCheque_${examInfo.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

