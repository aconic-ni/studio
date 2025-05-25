
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

    // --- Main Title ---
    sheetData.push(['SOLICITUD DE CHEQUE - CustomsFA-L']); 
    sheetData.push([]); 

    // --- General Exam Information ---
    sheetData.push(['INFORMACIÓN GENERAL:']); 
    sheetData.push(['A (Destinatario):', examInfo.recipient]);
    sheetData.push(['De (Colaborador):', examInfo.manager]);
    sheetData.push(['Fecha de Examen:', formatDate(examInfo.date)]);
    sheetData.push(['NE (Tracking NX1):', examInfo.ne]);
    sheetData.push(['Referencia:', examInfo.reference || 'N/A']);
    if (examInfo.savedBy) sheetData.push(['Guardado por (correo):', examInfo.savedBy]);
    if (examInfo.savedAt) sheetData.push(['Fecha y Hora de Guardado:', formatDate(examInfo.savedAt)]);
    sheetData.push([]); 

    // --- Detalles de la Solicitud Title ---
    sheetData.push(['DETALLES DE LA SOLICITUD:']); 
    sheetData.push([]); 

    // --- Monto y Cantidad (New Structure) ---
    const montoLabel = "Por este medio me dirijo a usted para solicitarle que elabore cheque por la cantidad de:";
    const montoValue = formatCurrencyForExport(solicitud.monto, solicitud.montoMoneda);
    const cantidadEnLetrasLabel = "Cantidad en Letras:";
    const cantidadEnLetrasValue = solicitud.cantidadEnLetras || 'N/A';

    sheetData.push([montoLabel]);
    sheetData.push([montoValue]);
    sheetData.push([cantidadEnLetrasLabel, cantidadEnLetrasValue]);
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
    const numRows = sheetData.length;
    
    if (!ws['!rows']) ws['!rows'] = [];

    let cantidadEnLetrasValueRowIndex = -1;
    let observacionValueRowIndex = -1;

    sheetData.forEach((row, rIndex) => {
        const cellValueA = String(row[0] ?? '').trim();
        const cellValueB = String(row[1] ?? '').trim();

        const cellAddressA = XLSX.utils.encode_cell({ r: rIndex, c: 0 });
        const cellAddressB = XLSX.utils.encode_cell({ r: rIndex, c: 1 });

        // Base style: wrap text and vertical top align for all content cells
        const applyBaseStyle = (cellAddr: string) => {
            if (!ws[cellAddr]) ws[cellAddr] = { t: 's', v: sheetData[rIndex][XLSX.utils.decode_col(cellAddr.replace(/[0-9]/g, ''))] };
            if (!ws[cellAddr].s) ws[cellAddr].s = {};
            if (!ws[cellAddr].s.alignment) ws[cellAddr].s.alignment = {};
            ws[cellAddr].s.alignment.wrapText = true;
            ws[cellAddr].s.alignment.vertical = 'top';
        };
        
        if (cellValueA) applyBaseStyle(cellAddressA);
        if (typeof row[1] !== 'undefined') applyBaseStyle(cellAddressB);


        // Style for Column A (Labels and standalone values)
        if (ws[cellAddressA]) {
            // Bold if it's a section title (all caps and ends with ':') or specific standalone values
            if (cellValueA === 'SOLICITUD DE CHEQUE - CustomsFA-L' || 
                (cellValueA.endsWith(':') && cellValueA === cellValueA.toUpperCase()) ||
                (rIndex === sheetData.findIndex(r => String(r[0] ?? '').trim() === montoLabel) + 1 && cellValueA !== 'N/A') // Monto Value
            ) {
                if (!ws[cellAddressA].s.font) ws[cellAddressA].s.font = {};
                ws[cellAddressA].s.font.bold = true;
                if(cellValueA === 'SOLICITUD DE CHEQUE - CustomsFA-L') {
                    ws[cellAddressA].s.font.sz = 14;
                    if (!ws[cellAddressA].s.alignment) ws[cellAddressA].s.alignment = {};
                    ws[cellAddressA].s.alignment.horizontal = 'center';
                }
            }
        }

        // Style for Column B (Values) - Bold if user-entered
        if (ws[cellAddressB] && typeof row[1] !== 'undefined' && cellValueB !== 'N/A' && cellValueB !== '') {
            if (!ws[cellAddressB].s.font) ws[cellAddressB].s.font = {};
            ws[cellAddressB].s.font.bold = true;
        }
        
        if (cellValueA === cantidadEnLetrasLabel) {
            cantidadEnLetrasValueRowIndex = rIndex;
        }
        if (cellValueA === '  Observación:') {
            observacionValueRowIndex = rIndex;
        }
    });
    
    // Specific justification for "Cantidad en Letras" value cell (B-column of that row)
    if (cantidadEnLetrasValueRowIndex !== -1) {
        const cellBAddressForCantidad = XLSX.utils.encode_cell({ r: cantidadEnLetrasValueRowIndex, c: 1 });
        if (ws[cellBAddressForCantidad]) {
            if (!ws[cellBAddressForCantidad].s) ws[cellBAddressForCantidad].s = {};
            if (!ws[cellBAddressForCantidad].s.alignment) ws[cellBAddressForCantidad].s.alignment = {};
            ws[cellBAddressForCantidad].s.alignment.wrapText = true; // Ensure wrap
            ws[cellBAddressForCantidad].s.alignment.vertical = 'top'; // Ensure vertical align
            ws[cellBAddressForCantidad].s.alignment.horizontal = 'justify';
            // Re-apply bold if it's a user-entered value
            if (solicitud.cantidadEnLetras && solicitud.cantidadEnLetras !== 'N/A') {
                if (!ws[cellBAddressForCantidad].s.font) ws[cellBAddressForCantidad].s.font = {};
                ws[cellBAddressForCantidad].s.font.bold = true;
            }
        }
    }
     // Specific styling for "Observación" value cell (B-column of that row)
    if (observacionValueRowIndex !== -1) {
        const cellBAddressForObservacion = XLSX.utils.encode_cell({ r: observacionValueRowIndex, c: 1 });
        if (ws[cellBAddressForObservacion]) {
            if (!ws[cellBAddressForObservacion].s) ws[cellBAddressForObservacion].s = {};
            if (!ws[cellBAddressForObservacion].s.alignment) ws[cellBAddressForObservacion].s.alignment = {};
            ws[cellBAddressForObservacion].s.alignment.wrapText = true; // Ensure wrap
            ws[cellBAddressForObservacion].s.alignment.vertical = 'top'; // Ensure vertical align
            ws[cellBAddressForObservacion].s.alignment.horizontal = 'left'; // Standard for observations
            if (solicitud.observation && solicitud.observation !== 'N/A') {
                if (!ws[cellBAddressForObservacion].s.font) ws[cellBAddressForObservacion].s.font = {};
                ws[cellBAddressForObservacion].s.font.bold = true;
            }
        }
    }


    // Merges for titles
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
        const cellValueColA = String(row[0] ?? '').trim();
        if (
            cellValueColA.endsWith(':') && cellValueColA === cellValueColA.toUpperCase() &&
            (typeof row[1] === 'undefined' || String(row[1]).trim() === '') &&
            rIndex !== 0 
        ) {
             addMergeIfNotExists({ s: { r: rIndex, c: 0 }, e: { r: rIndex, c: 1 } });
        }
    });
    
    ws['!cols'] = [ {wch: 35}, {wch: 45} ];
    ws['!ref'] = `A1:B${Math.min(numRows, 45)}`; 

    ws['!printSetup'] = {
        printArea: `A1:B45`, 
        fitToWidth: 1,
        fitToHeight: 0, // Allow content to flow vertically if it wraps
        paperSize: 1,     
        orientation: 'portrait'
    };

    const sheetName = `Solicitud ${index + 1}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const fileName = `SolicitudesCheque_${examInfo.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
    
