
import type { ExamData, SolicitudData, ExportableExamData } from '@/types';
import type { Timestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const formatDate = (dateValue: Date | Timestamp | string | null | undefined): string => {
  if (!dateValue) return 'N/A';
  if (typeof dateValue === 'string') return dateValue; // Already formatted or simple string
  const dateObj = dateValue instanceof Date ? dateValue : (dateValue as Timestamp).toDate();
  return format(dateObj, "PPP", { locale: es });
};

const formatCurrencyForExport = (amount?: number | string, currency?: string) => {
    if (amount === undefined || amount === null || amount === '') return 'N/A';
    const num = Number(amount);
    if (isNaN(num)) return String(amount); // if it's not a number, return as is
    let prefix = '';
    if (currency === 'cordoba') prefix = 'C$';
    else if (currency === 'dolar') prefix = 'US$';
    else if (currency === 'euro') prefix = '€';
    return `${prefix}${num.toFixed(2)}`;
};


export function downloadTxtFile(examData: ExamData, solicitudes: SolicitudData[]) {
  let content = `SOLICITUD DE CHEQUE - CustomsFA-L\n`;
  content += `===========================================\n\n`;
  content += `INFORMACIÓN GENERAL DEL EXAMEN:\n`;
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
    content += `Declaración Número: ${solicitud.declaracionNumero || 'N/A'}\n`;
    content += `Unidad Recaudadora: ${solicitud.unidadRecaudadora || 'N/A'}\n`;
    content += `Código 1: ${solicitud.codigo1 || 'N/A'}\n`;
    content += `Código 2: ${solicitud.codigo2 || 'N/A'}\n`;
    content += `Banco: ${solicitud.banco === 'Otros' ? solicitud.bancoOtros : solicitud.banco || 'N/A'}\n`;
    if (solicitud.banco !== 'ACCION POR CHEQUE/NO APLICA BANCO') {
        content += `Número de Cuenta: ${solicitud.numeroCuenta || 'N/A'}\n`;
        content += `Moneda de la Cuenta: ${solicitud.monedaCuenta === 'Otros' ? solicitud.monedaCuentaOtros : solicitud.monedaCuenta || 'N/A'}\n`;
    }
    content += `Elaborar Cheque A: ${solicitud.elaborarChequeA || 'N/A'}\n`;
    content += `Elaborar Transferencia A: ${solicitud.elaborarTransferenciaA || 'N/A'}\n`;
    content += `Impuestos Pagados Cliente: ${solicitud.impuestosPagadosCliente ? 'Sí' : 'No'}\n`;
    if (solicitud.impuestosPagadosCliente) {
        content += `  R/C: ${solicitud.impuestosPagadosRC || 'N/A'}\n`;
        content += `  T/B: ${solicitud.impuestosPagadosTB || 'N/A'}\n`;
        content += `  Cheque: ${solicitud.impuestosPagadosCheque || 'N/A'}\n`;
    }
    content += `Impuestos Pendientes Cliente: ${solicitud.impuestosPendientesCliente ? 'Sí' : 'No'}\n`;
    content += `Documentos Adjuntos: ${solicitud.documentosAdjuntos ? 'Sí' : 'No'}\n`;
    content += `Constancias de No Retención: ${solicitud.constanciasNoRetencion ? 'Sí' : 'No'}\n`;
    if (solicitud.constanciasNoRetencion) {
        content += `  1%: ${solicitud.constanciasNoRetencion1 ? 'Sí' : 'No'}\n`;
        content += `  2%: ${solicitud.constanciasNoRetencion2 ? 'Sí' : 'No'}\n`;
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
  const now = new Date();
  const fechaHoraExportacion = `${now.toLocaleString('es-NI', { dateStyle: 'long', timeStyle: 'short' })}`;

  // --- Hoja 1: Detalles Generales del Examen ---
  const examDetailsSheetData: (string | number | Date | null | undefined | XLSX.CellObject)[][] = [
    ['SOLICITUD DE CHEQUE - CustomsFA-L'],
    [],
    ['INFORMACIÓN GENERAL DEL EXAMEN:'],
    ['NE (Tracking):', data.ne],
    ['Referencia:', data.reference || 'N/A'],
    ['De (Colaborador):', data.manager],
    ['A (Destinatario):', data.recipient],
    ['Fecha de Examen:', formatDate(data.date)],
    [],
    ['DETALLES DE EXPORTACIÓN:'],
    ['Fecha y Hora de Exportación:', fechaHoraExportacion],
  ];
  if (data.savedBy) examDetailsSheetData.push(['Guardado por (correo):', data.savedBy]);
  if (data.savedAt) examDetailsSheetData.push(['Fecha y Hora de Guardado:', formatDate(data.savedAt)]);
  
  const ws_exam_details = XLSX.utils.aoa_to_sheet(examDetailsSheetData);
  ws_exam_details['!cols'] = [ {wch: 30}, {wch: 50} ];


  // --- Hoja 2: Lista de Solicitudes ---
  const solicitudHeaders = [
    'Monto', 'Moneda Monto', 'Cantidad en Letras', 
    'Declaración Número', 'Unidad Recaudadora', 'Código 1', 'Código 2',
    'Banco', 'Otro Banco', 'Número de Cuenta', 'Moneda Cuenta', 'Otra Moneda Cuenta',
    'Elaborar Cheque A', 'Elaborar Transferencia A',
    'Imp. Pagados Cliente', 'Imp. Pagados R/C', 'Imp. Pagados T/B', 'Imp. Pagados Cheque',
    'Imp. Pendientes Cliente', 'Documentos Adjuntos',
    'Const. No Retención', 'Const. No Ret. 1%', 'Const. No Ret. 2%',
    'Correo Notificación', 'Observación'
  ];
  
  const solicitudRows = (Array.isArray(data.products) ? data.products : []).map(solicitud => {
    return [
      formatCurrencyForExport(solicitud.monto, solicitud.montoMoneda), solicitud.montoMoneda, solicitud.cantidadEnLetras,
      solicitud.declaracionNumero, solicitud.unidadRecaudadora, solicitud.codigo1, solicitud.codigo2,
      solicitud.banco, solicitud.bancoOtros, solicitud.numeroCuenta, solicitud.monedaCuenta, solicitud.monedaCuentaOtros,
      solicitud.elaborarChequeA, solicitud.elaborarTransferenciaA,
      solicitud.impuestosPagadosCliente ? 'Sí' : 'No', solicitud.impuestosPagadosRC, solicitud.impuestosPagadosTB, solicitud.impuestosPagadosCheque,
      solicitud.impuestosPendientesCliente ? 'Sí' : 'No', solicitud.documentosAdjuntos ? 'Sí' : 'No',
      solicitud.constanciasNoRetencion ? 'Sí' : 'No', solicitud.constanciasNoRetencion1 ? 'Sí' : 'No', solicitud.constanciasNoRetencion2 ? 'Sí' : 'No',
      solicitud.correo, solicitud.observatio    ];
  });

  const ws_solicitudes_data = [solicitudHeaders, ...solicitudRows];
  const ws_solicitudes = XLSX.utils.aoa_to_sheet(ws_solicitudes_data);

  const solicitudColWidths = solicitudHeaders.map((header, i) => ({
    wch: Math.max(
      header.length,
      ...solicitudRows.map(row => row[i] ? String(row[i]).length : 0)
    ) + 2 
  }));
  ws_solicitudes['!cols'] = solicitudColWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws_exam_details, `Info General ${data.ne || 'S_NE'}`);
  XLSX.utils.book_append_sheet(wb, ws_solicitudes, `Solicitudes ${data.ne || 'S_NE'}`);
  
  XLSX.writeFile(wb, `SolicitudCheque_${data.ne || 'SIN_NE'}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
