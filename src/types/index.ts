
import type { Timestamp } from 'firebase/firestore';

export interface ExamData {
  ne: string;
  reference: string;
  manager: string; // "De (Nombre colaborador)"
  date: Date;
  recipient: string; // "A:"
}

// Renamed Product to SolicitudData and updated fields
export interface SolicitudData {
  id: string; // unique id

  // Section 1: Monto y Cantidad
  monto?: number | string; // "Por este medio me dirijo a usted para solicitarle que elabore cheque por la cantidad"
  montoMoneda?: 'cordoba' | 'dolar' | 'euro' | string; // Currency for monto
  cantidadEnLetras?: string; // "Cantidad en letras" (manual for now)

  // Section 2: Detalles de la Solicitud
  declaracionNumero?: string; // "Declaracion Número"
  unidadRecaudadora?: string; // "Unidad recaudadora"
  codigo1?: string; // "Codigo"
  codigo2?: string; // "Codigo"

  // Section 3: Cuenta Bancaria
  banco?: 'BAC' | 'BANPRO' | 'BANCENTRO' | 'FICOSHA' | 'AVANZ' | 'ATLANTIDA' | 'Otros' | string;
  bancoOtros?: string; // If banco is "Otros"
  numeroCuenta?: string; // "Numero de cuenta"
  monedaCuenta?: 'cordoba' | 'dolar' | 'euro' | 'Otros' | string;
  monedaCuentaOtros?: string; // If monedaCuenta is "Otros"

  // Section 4: Beneficiarios
  elaborarChequeA?: string; // "Elaborar cheque a"
  elaborarTransferenciaA?: string; // "Elaborar transferencia a"

  // Section 5: Checkboxes y sub-campos
  impuestosPagadosCliente?: boolean; // "Impuestos pagados por el cliente mediante:"
  impuestosPagadosRC?: string; // R/C (conditional)
  impuestosPagadosTB?: string; // T/B (conditional)
  impuestosPagadosCheque?: string; // Cheque (conditional)

  impuestosPendientesCliente?: boolean; // "Impuestos pendientes de pago por el cliente"
  documentosAdjuntos?: boolean; // "Se añaden documentos adjuntos"

  constanciasNoRetencion?: boolean; // "Constancias de no retencion"
  constanciasNoRetencion1?: boolean; // 1% (conditional)
  constanciasNoRetencion2?: boolean; // 2% (conditional)

  // Section 6: Otros
  correo?: string; // "Correo" (pre-filled, allow additions)
  observation?: string; // "Observación"

  // Old product fields - to be removed or confirmed if still needed for other parts
  itemNumber?: string; // To be removed
  weight?: string; // To be removed
  description?: string; // Replaced by cantidadEnLetras or observation
  brand?: string; // Replaced by declaracionNumero or others
  model?: string; // Replaced
  unitMeasure?: string; // Replaced
  serial?: string; // Replaced
  origin?: string; // Replaced by numeroCuenta or similar
  numberPackages?: string; // Replaced
  quantityPackages?: number | string; // Replaced
  quantityUnits?: number | string; // Replaced by monto
  packagingCondition?: string; // Replaced by specific statuses
  isConform?: boolean; // Replaced by specific checkboxes
  isExcess?: boolean; // Replaced
  isMissing?: boolean; // Replaced
  isFault?: boolean; // Replaced
}


export interface AppUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  isStaticUser?: boolean;
}

export interface ExamDocument extends ExamData {
  products: SolicitudData[]; // Now holds SolicitudData
  savedAt: Timestamp;
  savedBy: string | null;
}

export interface ExportableExamData extends Omit<ExamData, 'date'> {
  date?: Date | Timestamp | null;
  products?: SolicitudData[] | null; // Now holds SolicitudData
  savedAt?: Timestamp | Date | null;
  savedBy?: string | null;
}
