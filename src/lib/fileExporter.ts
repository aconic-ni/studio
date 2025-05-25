
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
    sheetData.push([]); // Row 2 (index 1) - Separator

    // --- General Exam Information ---
    sheetData.push(['INFORMACIÓN GENERAL:']); // Row 3 (index 2)
    sheetData.push(['NE (Tracking NX1):', examInfo.ne]);
    sheetData.push(['Referencia:', examInfo.reference || 'N/A']);
    sheetData.push(['De (Colaborador):', examInfo.manager]);
    sheetData.push(['A (Destinatario):', examInfo.recipient]);
    sheetData.push(['Fecha de Examen:', formatDate(examInfo.date)]);
    if (examInfo.savedBy) sheetData.push(['Guardado por (correo):', examInfo.savedBy]);
    if (examInfo.savedAt) sheetData.push(['Fecha y Hora de Guardado:', formatDate(examInfo.savedAt)]);
    sheetData.push([]); // Separator

    // --- Solicitud Details Title ---
    sheetData.push(['DETALLES DE LA SOLICITUD:']); // Dynamic row, e.g., Row 11 (index 10)
    sheetData.push([]); // Separator

    // --- Monto y Cantidad (Revised structure) ---
    sheetData.push(['Por este medio me dirijo a usted para solicitarle que elabore cheque por la cantidad de:']); // e.g. Row 13 (index 12)
    sheetData.push([formatCurrencyForExport(solicitud.monto, solicitud.montoMoneda)]); // e.g. Row 14 (index 13) - MONTO IN COL A
    sheetData.push(['Cantidad en Letras:', solicitud.cantidadEnLetras || 'N/A']); // e.g. Row 15 (index 14) - Label in Col A, Value in Col B
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

    // Fill remaining rows up to 40 if needed, though printArea defines the boundary.
     while (sheetData.length < 40) {
        sheetData.push(['', '']); // Add empty cells for both columns A and B
    }
    // If sheetData is longer than 40, truncate it for the purpose of print area.
    // The actual data remains, but printArea is respected.
    // This step isn't strictly necessary if printArea is correctly handled by Excel viewers.
    // const displaySheetData = sheetData.slice(0, 40);


    const ws = XLSX.utils.aoa_to_sheet(sheetData); // Use original sheetData

    // --- Styling ---
    const baseAlignment = { wrapText: true, vertical: 'top' };
    const mainTitleStyle = { 
        font: { bold: true, sz: 14 }, 
        alignment: { ...baseAlignment, horizontal: 'center', vertical: 'center' } 
    };
    const sectionHeaderStyle = { 
        font: { bold: true, sz: 12 }, 
        alignment: { ...baseAlignment, horizontal: 'left' } // Keep section headers left-aligned
    };
    const labelStyle = {
        alignment: { ...baseAlignment, horizontal: 'left' }
    };
    const valueStyle = {
        font: { bold: true },
        alignment: { ...baseAlignment, horizontal: 'left' }
    };


    let cantidadEnLetrasValueRowIndex = -1;

    sheetData.forEach((row, rIndex) => {
      // Apply base style (wrap text, top align) to all cells in columns A and B
      for (let cIndex = 0; cIndex < 2; cIndex++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rIndex, c: cIndex });
        if (!ws[cellAddress]) { 
            ws[cellAddress] = { t: 's', v: row[cIndex] ?? '' }; // Default to string if cell doesn't exist
        }
         if (typeof row[cIndex] === 'number') ws[cellAddress].t = 'n';
         if (typeof row[cIndex] === 'boolean') ws[cellAddress].t = 'b';

        if (!ws[cellAddress].s) ws[cellAddress].s = {};
        ws[cellAddress].s.alignment = { ...baseAlignment, ...ws[cellAddress].s.alignment };
      }

      const cellValueColA = row[0];
      const cellValueColB = row[1];

      // Main title
      if (rIndex === 0 && typeof cellValueColA === 'string') {
          const cellA = XLSX.utils.encode_cell({r: rIndex, c: 0});
          if(ws[cellA]) ws[cellA].s = mainTitleStyle;
      } 
      // Section headers (check for specific known headers or all caps with colon)
      else if (typeof cellValueColA === 'string' && (
        String(cellValueColA).trim() === "INFORMACIÓN GENERAL:" ||
        String(cellValueColA).trim() === "DETALLES DE LA SOLICITUD:" ||
        String(cellValueColA).trim() === "INFORMACIÓN ADICIONAL DE SOLICITUD:" ||
        String(cellValueColA).trim() === "CUENTA BANCARIA:" ||
        String(cellValueColA).trim() === "BENEFICIARIO DEL PAGO:" ||
        String(cellValueColA).trim() === "DETALLES ADICIONALES Y DOCUMENTACIÓN:" ||
        String(cellValueColA).trim() === "COMUNICACIÓN Y OBSERVACIONES:" ||
        /^[A-ZÁÉÍÓÚÑ\s]+:$/.test(String(cellValueColA).trim()) // General pattern for ALL CAPS:
      )) {
          const cellA = XLSX.utils.encode_cell({r: rIndex, c: 0});
          if(ws[cellA]) ws[cellA].s = { ...ws[cellA].s, ...sectionHeaderStyle };
      }
      // Labels in Column A that have a value in Column B (label-value pairs)
      else if (typeof cellValueColA === 'string' && (typeof cellValueColB !== 'undefined' && String(cellValueColB).trim() !== '')) {
          const cellA = XLSX.utils.encode_cell({r: rIndex, c: 0});
          const cellB = XLSX.utils.encode_cell({r: rIndex, c: 1});
          if(ws[cellA]) ws[cellA].s = {...ws[cellA].s, ...labelStyle};
          if(ws[cellB] && String(ws[cellB].v).trim() !== '' && String(ws[cellB].v) !== 'N/A') {
            ws[cellB].s = {...ws[cellB].s, ...valueStyle};
          } else if (ws[cellB]) { // Style N/A or empty values in Col B normally
            ws[cellB].s = {...ws[cellB].s, ...labelStyle};
          }
      }
      // Single user-entered value in Column A (like numeric monto or "Por este medio...")
      else if (typeof cellValueColA === 'string' || typeof cellValueColA === 'number') {
          if (String(cellValueColA).trim() === 'Por este medio me dirijo a usted para solicitarle que elabore cheque por la cantidad de:') {
            const cellA = XLSX.utils.encode_cell({r: rIndex, c: 0});
            if(ws[cellA]) ws[cellA].s = {...ws[cellA].s, ...labelStyle}; // Standard label style
          } else if (String(cellValueColA).trim() !== '' && String(cellValueColA) !== 'N/A') {
            const cellA = XLSX.utils.encode_cell({r: rIndex, c: 0});
            if(ws[cellA]) ws[cellA].s = {...ws[cellA].s, ...valueStyle}; // Bold for monto
          }
      }
      
      // Identify the row index for "Cantidad en Letras:" value cell
      if (typeof cellValueColA === 'string' && cellValueColA.trim() === 'Cantidad en Letras:') {
          cantidadEnLetrasValueRowIndex = rIndex;
      }
    });
    
    // Specific justification for the "Cantidad en Letras" value cell (Column B)
    if (cantidadEnLetrasValueRowIndex !== -1) {
        const cellBAddress = XLSX.utils.encode_cell({ r: cantidadEnLetrasValueRowIndex, c: 1 });
        if (ws[cellBAddress]) {
            if (!ws[cellBAddress].s) ws[cellBAddress].s = { alignment: {} };
            else if (!ws[cellBAddress].s.alignment) ws[cellBAddress].s.alignment = {};
            
            ws[cellBAddress].s.alignment.horizontal = 'justify';
            ws[cellBAddress].s.alignment.vertical = 'top'; 
            ws[cellBAddress].s.alignment.wrapText = true; 
            // Ensure it's bold if it's user-entered (it should be)
            if (String(ws[cellBAddress].v).trim() !== '' && String(ws[cellBAddress].v).trim() !== 'N/A') {
                 if(!ws[cellBAddress].s.font) ws[cellBAddress].s.font = {};
                 ws[cellBAddress].s.font.bold = true;
            }
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
        const cellValueColA = row[0];
        if (typeof cellValueColA === 'string' && (
            String(cellValueColA).trim() === "INFORMACIÓN GENERAL:" ||
            String(cellValueColA).trim() === "DETALLES DE LA SOLICITUD:" ||
            String(cellValueColA).trim() === "INFORMACIÓN ADICIONAL DE SOLICITUD:" ||
            String(cellValueColA).trim() === "CUENTA BANCARIA:" ||
            String(cellValueColA).trim() === "BENEFICIARIO DEL PAGO:" ||
            String(cellValueColA).trim() === "DETALLES ADICIONALES Y DOCUMENTACIÓN:" ||
            String(cellValueColA).trim() === "COMUNICACIÓN Y OBSERVACIONES:"
        )) {
             addMergeIfNotExists({ s: { r: rIndex, c: 0 }, e: { r: rIndex, c: 1 } }); // Merge specific section headers
        }
        // Merge "Por este medio..." label
        if (typeof cellValueColA === 'string' && String(cellValueColA).trim() === 'Por este medio me dirijo a usted para solicitarle que elabore cheque por la cantidad de:') {
            addMergeIfNotExists({ s: {r: rIndex, c: 0}, e: {r: rIndex, c: 1} });
        }
    });

    ws['!cols'] = [ {wch: 35}, {wch: 45} ]; // Adjusted column widths

    ws['!printSetup'] = {
        printArea: 'A1:B40', 
        fitToWidth: 1,
        fitToHeight: 0, // Allow vertical overflow across pages if content within A1:B40 is too tall
        paperSize: 1, // US Letter (8.5in x 11in)
        orientation: 'portrait'
    };
    // Explicitly define the range of the sheet. Max 40 rows for printing.
    const maxRows = Math.min(sheetData.length, 40);
    ws['!ref'] = `A1:B${maxRows}`;


    const sheetName = `Solicitud ${index + 1}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const fileName = `SolicitudesCheque_${examInfo.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
    
