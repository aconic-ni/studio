
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
  content += `NE: ${examData.ne}\n`;
  content += `Referencia: ${examData.reference || 'N/A'}\n`;
  content += `De (Colaborador): ${examData.manager}\n`;
  content += `A (Destinatario): ${examData.recipient}\n`;
  content += `Fecha: ${formatDate(examData.date)}\n\n`;

  content += `SOLICITUDES (${solicitudes.length}):\n`;

  (Array.isArray(solicitudes) ? solicitudes : []).forEach((solicitud, index) => {
    content += `\n--- Solicitud ${index + 1} ---\n`;
    content += `Monto: ${formatCurrencyForExport(solicitud.monto, solicitud.montoMoneda)}\n`;
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

    // --- Main Title ---
    sheetData.push(['SOLICITUD DE CHEQUE - CustomsFA-L']); // Row 1 (index 0)
    sheetData.push([]); // Row 2 (index 1) - Empty separator row

    // --- General Exam Information ---
    sheetData.push(['INFORMACIÓN GENERAL:']); // Row 3 (index 2)
    sheetData.push(['NE (Tracking NX1):', examInfo.ne]); // Row 4 (index 3)
    sheetData.push(['Referencia:', examInfo.reference || 'N/A']); // Row 5 (index 4)
    sheetData.push(['De (Colaborador):', examInfo.manager]); // Row 6 (index 5)
    sheetData.push(['A (Destinatario):', examInfo.recipient]); // Row 7 (index 6)
    sheetData.push(['Fecha de Examen:', formatDate(examInfo.date)]); // Row 8 (index 7)
    if (examInfo.savedBy) sheetData.push(['Guardado por (correo):', examInfo.savedBy]);
    if (examInfo.savedAt) sheetData.push(['Fecha y Hora de Guardado:', formatDate(examInfo.savedAt)]);
    sheetData.push([]); // Empty separator row

    // --- Solicitud Details Title ---
    sheetData.push(['DETALLES DE LA SOLICITUD:']); // index depends on savedBy/At
    sheetData.push([]); // Empty separator row
    
    // --- Monto y Cantidad (Revised for specific layout) ---
    // Row N (e.g. index 11 if savedBy/At not present): "Por este medio..."
    sheetData.push(['Por este medio me dirijo a usted para solicitarle que elabore cheque por la cantidad de:']);
    // Row N+1 (e.g. index 12): Monto value
    sheetData.push([formatCurrencyForExport(solicitud.monto, solicitud.montoMoneda)]);
    // Row N+2 (e.g. index 13): "Cantidad en Letras:" and its value
    sheetData.push(['Cantidad en Letras:', solicitud.cantidadEnLetras || 'N/A']);
    sheetData.push([]); // Empty row after this section

    // --- Información Adicional de Solicitud ---
    sheetData.push(['INFORMACIÓN ADICIONAL DE SOLICITUD:']);
    sheetData.push(['  Consignatario:', solicitud.consignatario || 'N/A']);
    sheetData.push(['  Declaración Número:', solicitud.declaracionNumero || 'N/A']);
    sheetData.push(['  Unidad Recaudadora:', solicitud.unidadRecaudadora || 'N/A']);
    sheetData.push(['  Código 1:', solicitud.codigo1 || 'N/A']);
    sheetData.push(['  Código 2:', solicitud.codigo2 || 'N/A']);
    sheetData.push([]);

    // --- Cuenta Bancaria ---
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

    // --- Beneficiario del Pago ---
    sheetData.push(['BENEFICIARIO DEL PAGO:']);
    sheetData.push(['  Elaborar Cheque A:', solicitud.elaborarChequeA || 'N/A']);
    sheetData.push(['  Elaborar Transferencia A:', solicitud.elaborarTransferenciaA || 'N/A']);
    sheetData.push([]);

    // --- Detalles Adicionales y Documentación ---
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

    // --- Comunicación y Observaciones ---
    sheetData.push(['COMUNICACIÓN Y OBSERVACIONES:']);
    sheetData.push(['  Correos de Notificación:', solicitud.correo || 'N/A']);
    sheetData.push(['  Observación:', solicitud.observation || 'N/A']);

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Base style for all textual content (labels and non-bold values)
    const baseTextStyle = { alignment: { wrapText: true, vertical: 'top' } };
    // Style for bold values
    const boldValueStyle = { font: { bold: true }, alignment: { wrapText: true, vertical: 'top' } };
    // Style for main title
    const mainTitleStyle = { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
    // Style for section headers
    const sectionHeaderStyle = { font: { bold: true }, alignment: { horizontal: 'left', vertical: 'top', wrapText: true } };


    sheetData.forEach((row, rIndex) => {
      row.forEach((cellValue, cIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: rIndex, c: cIndex });
        if (!ws[cellAddress]) { // Ensure cell object exists if it was empty
            if (typeof cellValue !== 'undefined' && cellValue !== null) {
                 ws[cellAddress] = { t: (typeof cellValue === 'number' ? 'n' : 's'), v: cellValue };
            } else {
                 ws[cellAddress] = { t: 's', v: '' }; // Create empty string cell
            }
        }
        // Apply base text style to all non-empty cells that are strings or numbers
        // This ensures wrapText and vertical: 'top' for all content cells
        if (ws[cellAddress] && (typeof ws[cellAddress].v === 'string' || typeof ws[cellAddress].v === 'number')) {
            if (String(ws[cellAddress].v).trim() !== '') {
                 if(!ws[cellAddress].s) ws[cellAddress].s = {}; // Ensure style object exists
                 ws[cellAddress].s.alignment = JSON.parse(JSON.stringify(baseTextStyle.alignment)); // Apply base alignment
            }
        }
      });

      // Apply specific styles (this will override parts of baseTextStyle where needed)
      const excelRowIndex = rIndex + 1; // XLSX uses 1-based indexing for direct addressing like "A1"
      if (rIndex === 0 && row.length > 0) { // Main Title (Row 1)
        const cellAddress = `A${excelRowIndex}`;
        if (ws[cellAddress]) ws[cellAddress].s = mainTitleStyle;
      } else if (row.length === 1 && typeof row[0] === 'string' && /^[A-ZÁÉÍÓÚÑ\s]+:$/.test(String(row[0]).trim())) { // Section Headers
        const cellAddress = `A${excelRowIndex}`;
        if (ws[cellAddress]) ws[cellAddress].s = sectionHeaderStyle;
      } else if (row.length === 2) { // Label-value pairs
        const valueCellAddress = XLSX.utils.encode_cell({ r: rIndex, c: 1 }); // Column B for value
        if (typeof row[1] === 'string' || typeof row[1] === 'number') {
          if (String(row[1]).trim() !== '' && String(row[1]) !== 'N/A') {
            if (ws[valueCellAddress]) {
                ws[valueCellAddress].s = JSON.parse(JSON.stringify(boldValueStyle)); // Bold user-entered values
            }
          }
        }
      } else if (row.length === 1 && (typeof row[0] === 'string' || typeof row[0] === 'number')) { // Single value rows (like numeric Monto)
        const cellAddress = XLSX.utils.encode_cell({r: rIndex, c: 0}); // Column A
        // Exclude section headers from this single-value bolding logic as they are handled above
        if (ws[cellAddress] && !(typeof row[0] === 'string' && /^[A-ZÁÉÍÓÚÑ\s]+:$/.test(String(row[0]).trim()))) {
            if (String(row[0]).trim() !== '' && String(row[0]) !== 'N/A') {
                 ws[cellAddress].s = JSON.parse(JSON.stringify(boldValueStyle)); // Bold user-entered values
            }
        }
      }
    });
    
    // Specific justification for cell B14 (Cantidad en Letras value)
    // Find the row index for "Cantidad en Letras:"
    let cantidadEnLetrasDataRowIndex = -1;
    for(let i=0; i<sheetData.length; i++) {
        if(sheetData[i][0] === 'Cantidad en Letras:') {
            cantidadEnLetrasDataRowIndex = i;
            break;
        }
    }

    if (cantidadEnLetrasDataRowIndex !== -1) {
        const cellBAddress = XLSX.utils.encode_cell({ r: cantidadEnLetrasDataRowIndex, c: 1 }); // B cell for the value
        if (ws[cellBAddress]) { 
            if (!ws[cellBAddress].s) ws[cellBAddress].s = { alignment: {} }; 
            else if (!ws[cellBAddress].s.alignment) ws[cellBAddress].s.alignment = {}; 
            
            ws[cellBAddress].s.alignment.horizontal = 'justify';
            ws[cellBAddress].s.alignment.vertical = 'top'; 
            ws[cellBAddress].s.alignment.wrapText = true;
        }
    }
    
    // Merges
    if (!ws['!merges']) ws['!merges'] = [];
    const addMergeIfNotExists = (newMerge: XLSX.Range) => {
        const exists = ws['!merges']!.some(m => 
            m.s.r === newMerge.s.r && m.s.c === newMerge.s.c &&
            m.e.r === newMerge.e.r && m.e.c === newMerge.e.c
        );
        if (!exists) ws['!merges']!.push(newMerge);
    };
    
    addMergeIfNotExists({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }); // Merge main title (A1:B1)

    sheetData.forEach((row, rIndex) => {
        if (row.length === 1 && typeof row[0] === 'string' && /^[A-ZÁÉÍÓÚÑ\s]+:$/.test(String(row[0]).trim())) {
             addMergeIfNotExists({ s: { r: rIndex, c: 0 }, e: { r: rIndex, c: 1 } }); // Merge section headers
        }
    });

    const colWidths = [ {wch: 60}, {wch: 60} ]; 
    ws['!cols'] = colWidths;

    // Set print options for fitToPage
    ws['!printSetup'] = {
        fitToWidth: 1,
        fitToHeight: 1,
        paperSize: 1, // US Letter (8.5in x 11in)
        orientation: 'portrait'
    };

    const sheetName = `Solicitud ${index + 1}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const fileName = `SolicitudesCheque_${examInfo.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
    

    