
import type { Timestamp } from 'firebase/firestore';

export interface ExamData {
  ne: string;
  reference: string;
  manager: string; // "De (Nombre colaborador)"
  date: Date; // This will be a Date object in the app state
  recipient: string; // "A:"
}

export interface SolicitudData {
  id: string;

  // Section 1: Monto y Cantidad
  monto?: number | string; // Form state might be string, should be number for storage
  montoMoneda?: 'cordoba' | 'dolar' | 'euro' | string;
  cantidadEnLetras?: string;

  // Section 2: Detalles de la Solicitud
  consignatario?: string;
  declaracionNumero?: string;
  unidadRecaudadora?: string;
  codigo1?: string;
  codigo2?: string; // Codigo MUR

  // Section 3: Cuenta Bancaria
  banco?: 'BAC' | 'BANPRO' | 'BANCENTRO' | 'FICOSHA' | 'AVANZ' | 'ATLANTIDA' | 'ACCION POR CHEQUE/NO APLICA BANCO' | 'Otros' | string;
  bancoOtros?: string;
  numeroCuenta?: string;
  monedaCuenta?: 'cordoba' | 'dolar' | 'euro' | 'Otros' | string;
  monedaCuentaOtros?: string;

  // Section 4: Beneficiarios
  elaborarChequeA?: string;
  elaborarTransferenciaA?: string;

  // Section 5: Checkboxes y sub-campos
  impuestosPagadosCliente?: boolean;
  impuestosPagadosRC?: string;
  impuestosPagadosTB?: string;
  impuestosPagadosCheque?: string;

  impuestosPendientesCliente?: boolean;
  documentosAdjuntos?: boolean;

  constanciasNoRetencion?: boolean;
  constanciasNoRetencion1?: boolean;
  constanciasNoRetencion2?: boolean;

  // Section 6: Otros
  correo?: string;
  observation?: string;
}


export interface AppUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  isStaticUser?: boolean;
}

// Represents the structure of each document in the "Solicitudes de Cheque" collection
export interface SolicitudRecord {
  // Fields from ExamData (general context)
  examNe: string; // Renamed to avoid clash with solicitud.id if solicitud.id was also 'ne'
  examReference: string;
  examManager: string;
  examDate: Timestamp; // Converted from ExamData.date
  examRecipient: string;

  // All fields from the specific SolicitudData being saved
  solicitudId: string; // This is the solicitud.id from SolicitudData, used as Firestore doc ID
  monto?: number; // Ensure this is a number before saving
  montoMoneda?: 'cordoba' | 'dolar' | 'euro' | string;
  cantidadEnLetras?: string;
  consignatario?: string;
  declaracionNumero?: string;
  unidadRecaudadora?: string;
  codigo1?: string;
  codigo2?: string; // Codigo MUR
  banco?: 'BAC' | 'BANPRO' | 'BANCENTRO' | 'FICOSHA' | 'AVANZ' | 'ATLANTIDA' | 'ACCION POR CHEQUE/NO APLICA BANCO' | 'Otros' | string;
  bancoOtros?: string;
  numeroCuenta?: string;
  monedaCuenta?: 'cordoba' | 'dolar' | 'euro' | 'Otros' | string;
  monedaCuentaOtros?: string;
  elaborarChequeA?: string;
  elaborarTransferenciaA?: string;
  impuestosPagadosCliente?: boolean;
  impuestosPagadosRC?: string;
  impuestosPagadosTB?: string;
  impuestosPagadosCheque?: string;
  impuestosPendientesCliente?: boolean;
  documentosAdjuntos?: boolean;
  constanciasNoRetencion?: boolean;
  constanciasNoRetencion1?: boolean;
  constanciasNoRetencion2?: boolean;
  correo?: string;
  observation?: string;

  // Metadata
  savedAt: Timestamp;
  savedBy: string | null;
}


// Old ExamDocument (for "examenesPrevios" collection)
export interface ExamDocument extends ExamData {
  solicitudes: SolicitudData[]; // Array of all solicitudes for this exam
  savedAt: Timestamp;
  savedBy: string | null;
}

// Used by fileExporter for data that might come from ExamDocument or just ExamData + Solicitudes
export interface ExportableExamData extends Omit<ExamData, 'date'> {
  date?: Date | Timestamp | null; // Exam date
  products?: SolicitudData[] | null; // 'products' is used historically, but contains SolicitudData
  savedAt?: Timestamp | Date | null; // For fetched documents
  savedBy?: string | null; // For fetched documents
}
