
import { z } from 'zod';

export const initialInfoSchema = z.object({
  ne: z.string().min(1, "NE es requerido."),
  reference: z.string().optional(),
  manager: z.string().min(1, "Nombre del Gestor es requerido."),
  date: z.date({ required_error: "Fecha es requerida." }),
  recipient: z.string().min(1, "Destinatario es requerido."),
});

export type InitialInfoFormData = z.infer<typeof initialInfoSchema>;

// Zod schema for the "Nueva Solicitud" form
export const solicitudSchema = z.object({
  id: z.string().optional(),

  monto: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : (typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val),
    z.number({invalid_type_error: "Monto debe ser un número."}).min(0.01, "Monto debe ser positivo.").optional()
  ),
  montoMoneda: z.enum(['cordoba', 'dolar', 'euro'], { errorMap: () => ({ message: "Seleccione una moneda para el monto." })}).optional(),
  cantidadEnLetras: z.string().optional(),

  consignatario: z.string().optional(), // Added new field
  declaracionNumero: z.string().optional(),
  unidadRecaudadora: z.string().optional(),
  codigo1: z.string().optional(),
  codigo2: z.string().optional(),
  
  banco: z.enum(['BAC', 'BANPRO', 'BANCENTRO', 'FICOSHA', 'AVANZ', 'ATLANTIDA', 'ACCION POR CHEQUE/NO APLICA BANCO', 'Otros'], { errorMap: () => ({ message: "Seleccione un banco." })}).optional(),
  bancoOtros: z.string().optional(),
  numeroCuenta: z.string().optional(),
  monedaCuenta: z.enum(['cordoba', 'dolar', 'euro', 'Otros'], { errorMap: () => ({ message: "Seleccione moneda de la cuenta." })}).optional(),
  monedaCuentaOtros: z.string().optional(),

  elaborarChequeA: z.string().optional(),
  elaborarTransferenciaA: z.string().optional(),

  impuestosPagadosCliente: z.boolean().default(false).optional(),
  impuestosPagadosRC: z.string().optional(),
  impuestosPagadosTB: z.string().optional(),
  impuestosPagadosCheque: z.string().optional(),

  impuestosPendientesCliente: z.boolean().default(false).optional(),
  documentosAdjuntos: z.boolean().default(false).optional(),

  constanciasNoRetencion: z.boolean().default(false).optional(),
  constanciasNoRetencion1: z.boolean().default(false).optional(),
  constanciasNoRetencion2: z.boolean().default(false).optional(),

  correo: z.string().optional().refine(val => {
    if (!val) return true; // Allow empty
    return val.split(';').every(email => z.string().email().safeParse(email.trim()).success || email.trim() === '');
  }, "Uno o más correos no son válidos."),
  observation: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.banco === 'Otros' && !data.bancoOtros?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Especifique el otro banco.",
      path: ['bancoOtros'],
    });
  }
  if (data.monedaCuenta === 'Otros' && !data.monedaCuentaOtros?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Especifique la otra moneda de la cuenta.",
      path: ['monedaCuentaOtros'],
    });
  }
  // Allow no beneficiario if "ACCION POR CHEQUE/NO APLICA BANCO" is selected, otherwise require one
  if (data.banco !== 'ACCION POR CHEQUE/NO APLICA BANCO' && !data.elaborarChequeA?.trim() && !data.elaborarTransferenciaA?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debe especificar un beneficiario para cheque o transferencia.",
      path: ['elaborarChequeA'], 
    });
     ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debe especificar un beneficiario para cheque o transferencia.",
      path: ['elaborarTransferenciaA'], 
    });
  }
});

export type SolicitudFormData = z.infer<typeof solicitudSchema>;
// Keep old ProductFormData for compatibility if other parts of the app still use it,
// but new forms should use SolicitudFormData
export type ProductFormData = SolicitudFormData; // Alias for now
export const productSchema = solicitudSchema; // Alias for now
