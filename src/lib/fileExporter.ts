
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

  const boldFont: XLSX.Style = { font: { bold: true } };
  const titleFont: XLSX.Style = { font: { bold: true, sz: 14 } };
  const centerAlignment: XLSX.Alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  const baseAlignment: XLSX.Alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
  
  (Array.isArray(data.products) ? data.products : []).forEach((solicitud, index) => {
    const sheetData: (string | number | Date | null | undefined)[][] = [];

    sheetData.push(['SOLICITUD DE CHEQUE - CustomsFA-L']); // Row 1
    sheetData.push([]); // Row 2 (Empty for spacing)

    sheetData.push(['INFORMACIÓN GENERAL:']); // Row 3
    sheetData.push(['A (Destinatario):', examInfo.recipient]); // Row 4
    sheetData.push(['De (Colaborador):', examInfo.manager]); // Row 5
    sheetData.push(['Fecha de Examen:', formatDate(examInfo.date)]); // Row 6
    sheetData.push(['NE (Tracking NX1):', examInfo.ne]); // Row 7
    sheetData.push(['Referencia:', examInfo.reference || 'N/A']); // Row 8
    if (examInfo.savedBy) sheetData.push(['Guardado por (correo):', examInfo.savedBy]); // Row 9 (Conditional)
    if (examInfo.savedAt) sheetData.push(['Fecha y Hora de Guardado:', formatDate(examInfo.savedAt)]); // Row 10 (Conditional)
    sheetData.push([]); // Row 11 (Empty)

    sheetData.push(['DETALLES DE LA SOLICITUD:']); // Row 12
    sheetData.push([]); // Row 13 (Empty)

    // Section: Monto y Cantidad
    sheetData.push(['Por este medio me dirijo a usted para solicitarle que elabore cheque por la cantidad de:']); // Row 14
    sheetData.push([formatCurrencyForExport(solicitud.monto, solicitud.montoMoneda)]); // Row 15
    sheetData.push(['Cantidad en Letras:', solicitud.cantidadEnLetras || 'N/A']); // Row 16
    sheetData.push([]); // Row 17 (Empty)

    // Section: Información Adicional de Solicitud
    sheetData.push(['INFORMACIÓN ADICIONAL DE SOLICITUD:']); // Row 18
    sheetData.push(['  Consignatario:', solicitud.consignatario || 'N/A']); // Row 19
    sheetData.push(['  Declaración Número:', solicitud.declaracionNumero || 'N/A']); // Row 20
    sheetData.push(['  Unidad Recaudadora:', solicitud.unidadRecaudadora || 'N/A']); // Row 21
    sheetData.push(['  Código 1:', solicitud.codigo1 || 'N/A']); // Row 22
    sheetData.push(['  Código 2:', solicitud.codigo2 || 'N/A']); // Row 23
    sheetData.push([]); // Row 24 (Empty)

    // Section: Cuenta Bancaria
    sheetData.push(['CUENTA BANCARIA:']); // Row 25
    let bancoDisplay = solicitud.banco || 'N/A';
    if (solicitud.banco === 'Otros' && solicitud.bancoOtros) {
      bancoDisplay = `${solicitud.bancoOtros} (Otros)`;
    } else if (solicitud.banco === 'ACCION POR CHEQUE/NO APLICA BANCO') {
      bancoDisplay = 'Acción por Cheque / No Aplica Banco';
    }
    sheetData.push(['  Banco:', bancoDisplay]); // Row 26

    if (solicitud.banco !== 'ACCION POR CHEQUE/NO APLICA BANCO') {
      sheetData.push(['  Número de Cuenta:', solicitud.numeroCuenta || 'N/A']); // Row 27
      let monedaCuentaDisplay = solicitud.monedaCuenta || 'N/A';
      if (solicitud.monedaCuenta === 'Otros' && solicitud.monedaCuentaOtros) {
        monedaCuentaDisplay = `${solicitud.monedaCuentaOtros} (Otros)`;
      }
      sheetData.push(['  Moneda de la Cuenta:', monedaCuentaDisplay]); // Row 28
    }
    sheetData.push([]); // Row 29 (Empty)

    // Section: Beneficiario del Pago
    sheetData.push(['BENEFICIARIO DEL PAGO:']); // Row 30
    sheetData.push(['  Elaborar Cheque A:', solicitud.elaborarChequeA || 'N/A']); // Row 31
    sheetData.push(['  Elaborar Transferencia A:', solicitud.elaborarTransferenciaA || 'N/A']); // Row 32
    sheetData.push([]); // Row 33 (Empty)

    // Section: Detalles Adicionales y Documentación
    sheetData.push(['DETALLES ADICIONALES Y DOCUMENTACIÓN:']); // Row 34
    sheetData.push(['  Impuestos pagados por el cliente mediante:', formatBooleanForExport(solicitud.impuestosPagadosCliente)]); // Row 35
    if (solicitud.impuestosPagadosCliente) {
      sheetData.push(['    R/C No.:', solicitud.impuestosPagadosRC || 'N/A']); // Row 36
      sheetData.push(['    T/B No.:', solicitud.impuestosPagadosTB || 'N/A']); // Row 37
      sheetData.push(['    Cheque No.:', solicitud.impuestosPagadosCheque || 'N/A']); // Row 38
    }
    sheetData.push(['  Impuestos pendientes de pago por el cliente:', formatBooleanForExport(solicitud.impuestosPendientesCliente)]); // Row 39
    sheetData.push(['  Se añaden documentos adjuntos:', formatBooleanForExport(solicitud.documentosAdjuntos)]); // Row 40
    sheetData.push(['  Constancias de no retención:', formatBooleanForExport(solicitud.constanciasNoRetencion)]); // Row 41
    if (solicitud.constanciasNoRetencion) {
      sheetData.push(['    1%:', formatBooleanForExport(solicitud.constanciasNoRetencion1)]); // Row 42
      sheetData.push(['    2%:', formatBooleanForExport(solicitud.constanciasNoRetencion2)]); // Row 43
    }
    sheetData.push([]); // Row 44 (Empty)

    // Section: Comunicación y Observaciones
    sheetData.push(['COMUNICACIÓN Y OBSERVACIONES:']); // Row 45
    sheetData.push(['  Correos de Notificación:', solicitud.correo || 'N/A']); // Row 46
    sheetData.push(['  Observación:', solicitud.observation || 'N/A']); // Row 47
    // Add empty rows if needed to reach at least 50 for consistent print area
    while (sheetData.length < 50) {
        sheetData.push([]);
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const numRows = sheetData.length;

    // Find dynamic row indices
    let cantidadEnLetrasLabelRowIndex = -1;
    let observacionLabelRowIndex = -1;

    sheetData.forEach((row, rIdx) => {
        const labelInColA = String(row[0] ?? '').trim();
        if (labelInColA === 'Cantidad en Letras:') {
            cantidadEnLetrasLabelRowIndex = rIdx;
        }
        if (labelInColA === '  Observación:') {
            observacionLabelRowIndex = rIdx;
        }
    });

    // Apply styles
    for (let r = 0; r < numRows; r++) {
      const row = sheetData[r];
      for (let c = 0; c < 2; c++) { // Iterate only columns A and B
        const cellValue = row[c];
        const cellAddress = XLSX.utils.encode_cell({ r, c });

        if (!ws[cellAddress]) {
          ws[cellAddress] = { t: 's', v: cellValue }; // Default to string if cell doesn't exist
        } else if (typeof ws[cellAddress].v === 'undefined' && typeof cellValue !== 'undefined') {
          ws[cellAddress].v = cellValue;
          ws[cellAddress].t = typeof cellValue === 'number' ? 'n' : (typeof cellValue === 'boolean' ? 'b' : 's');
        }

        // Ensure style object and alignment object exist
        if (!ws[cellAddress].s) ws[cellAddress].s = {};
        if (!ws[cellAddress].s.alignment) ws[cellAddress].s.alignment = {};

        // Base style: Wrap Text and Top Align for all content cells
        ws[cellAddress].s.alignment.wrapText = true;
        ws[cellAddress].s.alignment.vertical = 'top';
        ws[cellAddress].s.alignment.horizontal = 'left'; // Default to left align

        // Bolding for user-entered values (in column B, or column A if it's a standalone value)
        if (c === 1 && cellValue !== 'N/A' && cellValue !== '' && typeof cellValue !== 'undefined') {
          if (!ws[cellAddress].s.font) ws[cellAddress].s.font = {};
          ws[cellAddress].s.font.bold = true;
        } else if (c === 0 && (typeof row[1] === 'undefined' || String(row[1]).trim() === '') && 
                   cellValue !== 'N/A' && cellValue !== '' && typeof cellValue !== 'undefined' && 
                   !String(cellValue).endsWith(':')) {
          if (!ws[cellAddress].s.font) ws[cellAddress].s.font = {};
          ws[cellAddress].s.font.bold = true;
        }
      }
    }

    // Style and merge Main Title
    const mainTitleCellA = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (ws[mainTitleCellA]) {
      ws[mainTitleCellA].s = { font: { ...titleFont.font }, alignment: { ...centerAlignment } };
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });
    }
    
    // Style and merge Section Headers
    sheetData.forEach((row, rIndex) => {
      const cellValueColA = String(row[0] ?? '').trim();
      if (cellValueColA.endsWith(':') && cellValueColA === cellValueColA.toUpperCase() && 
          (typeof row[1] === 'undefined' || String(row[1]).trim() === '') && rIndex !== 0) {
        const cellAddr = XLSX.utils.encode_cell({ r: rIndex, c: 0 });
        if (ws[cellAddr]) {
          ws[cellAddr].s = { font: { ...boldFont.font }, alignment: { ...baseAlignment, vertical: 'middle' } }; // Section titles vertically centered
          if (!ws['!merges']) ws['!merges'] = [];
          const mergeExists = ws['!merges'].some(m => m.s.r === rIndex && m.s.c === 0 && m.e.r === rIndex && m.e.c === 1);
          if (!mergeExists) {
            ws['!merges'].push({ s: { r: rIndex, c: 0 }, e: { r: rIndex, c: 1 } });
          }
        }
      }
    });

    // Specific alignment for "Cantidad en Letras" value (Column B of its row)
    if (cantidadEnLetrasLabelRowIndex !== -1) {
        const cellBCantidadLetras = XLSX.utils.encode_cell({ r: cantidadEnLetrasLabelRowIndex, c: 1 });
        if (ws[cellBCantidadLetras]) {
            if (!ws[cellBCantidadLetras].s) ws[cellBCantidadLetras].s = {};
            if (!ws[cellBCantidadLetras].s.alignment) ws[cellBCantidadLetras].s.alignment = {};
            ws[cellBCantidadLetras].s.alignment.wrapText = true;
            ws[cellBCantidadLetras].s.alignment.vertical = 'top';
            ws[cellBCantidadLetras].s.alignment.horizontal = 'left'; // Changed from 'justify'
            // Ensure bold if it's user-entered
            if (solicitud.cantidadEnLetras && solicitud.cantidadEnLetras !== 'N/A') {
                if(!ws[cellBCantidadLetras].s.font) ws[cellBCantidadLetras].s.font = {};
                ws[cellBCantidadLetras].s.font.bold = true;
            }
        }
    }

    // Specific alignment for "Observación" value (Column B of its row)
    if (observacionLabelRowIndex !== -1) {
        const cellBObservacion = XLSX.utils.encode_cell({ r: observacionLabelRowIndex, c: 1 });
        if (ws[cellBObservacion]) {
            if (!ws[cellBObservacion].s) ws[cellBObservacion].s = {};
            if (!ws[cellBObservacion].s.alignment) ws[cellBObservacion].s.alignment = {};
            ws[cellBObservacion].s.alignment.wrapText = true;
            ws[cellBObservacion].s.alignment.vertical = 'top';
            ws[cellBObservacion].s.alignment.horizontal = 'left';
            // Ensure bold if it's user-entered
            if (solicitud.observation && solicitud.observation !== 'N/A') {
                if(!ws[cellBObservacion].s.font) ws[cellBObservacion].s.font = {};
                ws[cellBObservacion].s.font.bold = true;
            }
        }
    }
    
    ws['!cols'] = [{ wch: 35 }, { wch: 45 }];
    // Define the sheet's data extent up to row 50 (or actual numRows if less)
    ws['!ref'] = XLSX.utils.encode_range({s: {c:0, r:0}, e: {c:1, r:Math.min(numRows -1, 49)}});


    // Print Setup: Fit to one page (width and height), Letter size, Portrait
    ws['!printSetup'] = {
      fitToWidth: 1,
      fitToHeight: 1, // This forces scaling to one page height
      paperSize: 1,   // US Letter
      orientation: 'portrait',
      printArea: 'A1:B50' // Print area now covers up to B50
    };
    
    // Remove explicit row height settings to allow Excel to auto-adjust for wrapped text before scaling
    // ws['!rows'] = []; // Reset explicit row heights

    const sheetName = `Solicitud ${index + 1}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const fileName = `SolicitudesCheque_${examInfo.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

