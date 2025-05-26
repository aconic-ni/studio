
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

  monto?: number | string;
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
}


export interface AppUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  isStaticUser?: boolean;
}

// Represents the structure of each document in the "SolicitudCheques" collection
export interface SolicitudRecord {
  // Fields from ExamData (general context)
  examNe: string;
  examReference: string | null; // Ensure optional fields can be null
  examManager: string;
  examDate: Timestamp;
  examRecipient: string;

  // All fields from the specific SolicitudData being saved
  solicitudId: string;
  monto: number | null; // Ensure this can be null
  montoMoneda: string | null;
  cantidadEnLetras: string | null;
  consignatario: string | null;
  declaracionNumero: string | null;
  unidadRecaudadora: string | null;
  codigo1: string | null;
  codigo2: string | null; // Codigo MUR
  banco: string | null;
  bancoOtros: string | null;
  numeroCuenta: string | null;
  monedaCuenta: string | null;
  monedaCuentaOtros: string | null;
  elaborarChequeA: string | null;
  elaborarTransferenciaA: string | null;

  impuestosPagadosCliente: boolean; // Booleans usually default to false if not explicitly null
  impuestosPagadosRC: string | null;
  impuestosPagadosTB: string | null;
  impuestosPagadosCheque: string | null;
  impuestosPendientesCliente: boolean;
  documentosAdjuntos: boolean;
  constanciasNoRetencion: boolean;
  constanciasNoRetencion1: boolean;
  constanciasNoRetencion2: boolean;

  correo: string | null;
  observation: string | null;

  // Metadata
  savedAt: Timestamp;
  savedBy: string | null;
}


// For the "DatabasePage" when exporting, it combines ExamData-like info with SolicitudData-like info
export interface ExportableExamData extends Omit<ExamData, 'date'> {
  date?: Date | Timestamp | null;
  products?: SolicitudData[] | null; // 'products' is used historically, but contains SolicitudData
  savedAt?: Timestamp | Date | null;
  savedBy?: string | null;
}
