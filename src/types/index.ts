
import type { Timestamp } from 'firebase/firestore';

export interface ExamData {
  ne: string;
  reference: string;
  manager: string; // "De (Nombre colaborador)"
  date: Date;
  recipient: string; // "A:"
}

export interface SolicitudData {
  id: string; 

  // Section 1: Monto y Cantidad
  monto?: number | string; 
  montoMoneda?: 'cordoba' | 'dolar' | 'euro' | string; 
  cantidadEnLetras?: string; 

  // Section 2: Detalles de la Solicitud
  consignatario?: string; // Added new field
  declaracionNumero?: string; 
  unidadRecaudadora?: string; 
  codigo1?: string; 
  codigo2?: string; 

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

export interface ExamDocument extends ExamData {
  solicitudes: SolicitudData[]; 
  savedAt: Timestamp;
  savedBy: string | null;
}

export interface ExportableExamData extends Omit<ExamData, 'date'> {
  date?: Date | Timestamp | null;
  products?: SolicitudData[] | null; 
  savedAt?: Timestamp | Date | null;
  savedBy?: string | null;
}
