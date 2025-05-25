
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
    sheetData.push(['SOLICITUD DE CHEQUE - CustomsFA-L']); 
    sheetData.push([]); 

    // --- General Exam Information ---
    sheetData.push(['INFORMACIÓN GENERAL:']); 
    sheetData.push(['NE (Tracking NX1):', examInfo.ne]);
    sheetData.push(['Referencia:', examInfo.reference || 'N/A']);
    sheetData.push(['De (Colaborador):', examInfo.manager]);
    sheetData.push(['A (Destinatario):', examInfo.recipient]);
    sheetData.push(['Fecha de Examen:', formatDate(examInfo.date)]);
    if (examInfo.savedBy) sheetData.push(['Guardado por (correo):', examInfo.savedBy]);
    if (examInfo.savedAt) sheetData.push(['Fecha y Hora de Guardado:', formatDate(examInfo.savedAt)]);
    sheetData.push([]); 

    // --- Solicitud Details Title ---
    sheetData.push(['DETALLES DE LA SOLICITUD:']); 
    sheetData.push([]); 

    // --- Monto y Cantidad (User Specified Layout) ---
    sheetData.push(['Por este medio me dirijo a usted para solicitarle que elabore cheque por la cantidad de:']);
    sheetData.push([formatCurrencyForExport(solicitud.monto, solicitud.montoMoneda)]);
    sheetData.push(['Cantidad en Letras:', solicitud.cantidadEnLetras || 'N/A']);
    sheetData.push([]);

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

    const baseAlignment: Partial<XLSX.Alignment> = { wrapText: true, vertical: 'top' };

    let cantidadEnLetrasLabelRowIndex = -1;

    sheetData.forEach((row, rIndex) => {
        for (let cIndex = 0; cIndex < 2; cIndex++) { // Iterate only for columns A and B
            const cellAddress = XLSX.utils.encode_cell({ r: rIndex, c: cIndex });
            if (!ws[cellAddress]) {
                ws[cellAddress] = { t: 's', v: row[cIndex] ?? '' };
            }
            
            // Ensure cell type is set correctly
            if (typeof row[cIndex] === 'number') ws[cellAddress].t = 'n';
            else if (typeof row[cIndex] === 'boolean') ws[cellAddress].t = 'b';
            else if (row[cIndex] instanceof Date) { // Handle dates if any are directly passed
                ws[cellAddress].t = 'd';
                ws[cellAddress].z = XLSX.SSF.get_table()[14]; // Default date format
            } else {
                ws[cellAddress].t = 's';
            }

            // Initialize style object if it doesn't exist
            if (!ws[cellAddress].s) ws[cellAddress].s = {};
            // Apply base alignment (wrapText, vertical top)
            ws[cellAddress].s.alignment = { ...baseAlignment, ...ws[cellAddress].s.alignment };
        }

        const cellValueColA = row[0] ? String(row[0]).trim() : "";
        const cellValueColB = row[1] ? String(row[1]).trim() : "";

        // Main title styling
        if (rIndex === 0 && cellValueColA === 'SOLICITUD DE CHEQUE - CustomsFA-L') {
            ws[XLSX.utils.encode_cell({r: rIndex, c: 0})].s = {
                font: { bold: true, sz: 14 },
                alignment: { ...baseAlignment, horizontal: 'center', vertical: 'center' },
            };
        }
        // Section headers styling
        else if (
            cellValueColA.endsWith(':') && cellValueColA === cellValueColA.toUpperCase() && 
            (cellValueColB === '' || typeof row[1] === 'undefined') // Ensure it's a section header row
        ) {
           ws[XLSX.utils.encode_cell({r: rIndex, c: 0})].s = {
                font: { bold: true, sz: 12 },
                alignment: { ...baseAlignment, horizontal: 'left' },
            };
        }
        // Label-value pairs and standalone values
        else {
            // Style Label in Column A
            if (cellValueColA !== '' && cellValueColA !== 'N/A') {
                 if (!ws[XLSX.utils.encode_cell({r: rIndex, c: 0})].s.font) ws[XLSX.utils.encode_cell({r: rIndex, c: 0})].s.font = {};
                 // Don't bold labels by default, only values
            }
            // Style Value in Column B (or standalone value in Column A)
            const valueCellAddress = cellValueColB !== '' ? XLSX.utils.encode_cell({r: rIndex, c: 1}) : XLSX.utils.encode_cell({r: rIndex, c: 0});
            const valueToCheck = cellValueColB !== '' ? cellValueColB : cellValueColA;

            if (valueToCheck !== '' && valueToCheck !== 'N/A' && !String(row[0]).endsWith(':') && !String(row[0]).toUpperCase().startsWith('POR ESTE MEDIO')) {
                 if (!ws[valueCellAddress].s.font) ws[valueCellAddress].s.font = {};
                 ws[valueCellAddress].s.font.bold = true;
            }
        }
        
        if (cellValueColA === 'Cantidad en Letras:') {
            cantidadEnLetrasLabelRowIndex = rIndex;
        }
    });
    
    // Specific justification for the "Cantidad en Letras" value cell (Column B of its row)
    if (cantidadEnLetrasLabelRowIndex !== -1) {
        const cellBAddress = XLSX.utils.encode_cell({ r: cantidadEnLetrasLabelRowIndex, c: 1 }); // Column B
        if (ws[cellBAddress]) {
             if (!ws[cellBAddress].s) ws[cellBAddress].s = {}; // Initialize style object if needed
             // Ensure alignment object exists
             if (!ws[cellBAddress].s.alignment) ws[cellBAddress].s.alignment = {};

             ws[cellBAddress].s.alignment = {
                ...baseAlignment, // vertical: 'top', wrapText: true
                horizontal: 'justify', // Specific horizontal justification
                ...ws[cellBAddress].s.alignment, // Preserve other existing alignment if any (e.g. from base)
             };
             // Ensure bold if it's a user-entered value (already handled by general value styling)
             const cellValue = String(ws[cellBAddress].v).trim();
             if (cellValue !== '' && cellValue !== 'N/A') {
                 if (!ws[cellBAddress].s.font) ws[cellBAddress].s.font = {};
                 ws[cellBAddress].s.font.bold = true;
             }
        }
    }

    if (!ws['!merges']) ws['!merges'] = [];
    const addMergeIfNotExists = (newMerge: XLSX.Range) => {
        const exists = ws['!merges']!.some(m => 
            m.s.r === newMerge.s.r && m.s.c === newMerge.s.c &&
            m.e.r === newMerge.e.r && m.e.c === newMerge.e.c
        );
        if (!exists) ws['!merges']!.push(newMerge);
    };
    
    addMergeIfNotExists({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }); // Main title

    sheetData.forEach((row, rIndex) => {
        const cellValueColA = row[0] ? String(row[0]).trim() : "";
         if (
            cellValueColA.endsWith(':') && cellValueColA === cellValueColA.toUpperCase() &&
            (typeof row[1] === 'undefined' || String(row[1]).trim() === '') && // It's a section header
            rIndex !== 0 // Not the main title
        ) {
             addMergeIfNotExists({ s: { r: rIndex, c: 0 }, e: { r: rIndex, c: 1 } });
        }
        if (cellValueColA === 'Por este medio me dirijo a usted para solicitarle que elabore cheque por la cantidad de:') {
             addMergeIfNotExists({ s: {r: rIndex, c: 0}, e: {r: rIndex, c: 1} });
        }
    });

    ws['!cols'] = [ {wch: 35}, {wch: 45} ];

    const numRows = sheetData.length;
    const printAreaRows = Math.min(numRows, 50);
    ws['!printSetup'] = {
        printArea: `A1:B${printAreaRows}`, 
        fitToWidth: 1,
        fitToHeight: 0, 
        paperSize: 1, 
        orientation: 'portrait'
    };
    ws['!ref'] = `A1:B${numRows}`;


    const sheetName = `Solicitud ${index + 1}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const fileName = `SolicitudesCheque_${examInfo.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
    

    