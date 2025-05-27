
import type { Timestamp } from 'firebase/firestore';

// Represents the data collected in the initial form, held in AppContext
export interface InitialDataContext {
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
  role?: string; // e.g., 'revisor', 'calificador'
}

// Represents the structure of each document in the "SolicitudCheques" collection
export interface SolicitudRecord {
  // Fields from InitialDataContext (general context for the set of solicituds)
  examNe: string; // Remains 'examNe' as it refers to the specific "examen" tracking number
  examReference: string | null;
  examManager: string;
  examDate: Timestamp; // Firestore Timestamp
  examRecipient: string;

  // All fields from the specific SolicitudData being saved
  solicitudId: string; // This is the Firestore document ID for this record

  monto: number | null;
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

  impuestosPagadosCliente: boolean;
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
  savedAt: Timestamp; // Firestore Timestamp
  savedBy: string | null; // User's email

  // New fields for payment status
  paymentStatus?: string; // e.g., "Pagado", "Error: (mensaje)"
  paymentStatusLastUpdatedAt?: Timestamp | Date;
  paymentStatusLastUpdatedBy?: string;
}


// For exporting, it combines InitialDataContext-like info with SolicitudData-like info
export interface ExportableSolicitudContextData extends Omit<InitialDataContext, 'date'> {
  date?: Date | Timestamp | null;
  products?: SolicitudData[] | null; // 'products' is used historically, contains SolicitudData
  savedAt?: Timestamp | Date | null;
  savedBy?: string | null;
}
