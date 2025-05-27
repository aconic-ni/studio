
import { z } from 'zod';

// Renamed from initialInfoSchema
export const initialDataSchema = z.object({
  ne: z.string().min(1, "NE es requerido."),
  reference: z.string().optional(),
  manager: z.string().min(1, "Nombre del Usuario es requerido."), // Changed "Gestor" to "Usuario"
  date: z.date({ required_error: "Fecha es requerida." }),
  recipient: z.string().min(1, "Destinatario es requerido."),
});

// Renamed from InitialInfoFormData
export type InitialDataFormData = z.infer<typeof initialDataSchema>;

// Zod schema for the "Nueva Solicitud" form (previously productSchema)
export const solicitudSchema = z.object({
  id: z.string().optional(),

  monto: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : (typeof val === 'string' ? parseFloat(String(val).replace(/,/g, '')) : val),
    z.number({
      required_error: "Monto es requerido y debe ser mayor que cero.",
      invalid_type_error: "Monto debe ser un número."
    }).min(0.01, "Monto debe ser positivo.")
  ),
  montoMoneda: z.enum(['cordoba', 'dolar', 'euro'], { errorMap: () => ({ message: "Seleccione una moneda para el monto." })}).optional(),
  cantidadEnLetras: z.string().optional(),

  consignatario: z.string().optional(),
  declaracionNumero: z.string().optional(),
  unidadRecaudadora: z.string().optional(),
  codigo1: z.string().optional(),
  codigo2: z.string().optional(), // Codigo MUR
  
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
    if (!val) return true;
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
  // Monto is now the only required field, beneficiary fields are optional
  // if (!data.elaborarChequeA?.trim() && !data.elaborarTransferenciaA?.trim()) {
  //   ctx.addIssue({
  //     code: z.ZodIssueCode.custom,
  //     message: "Debe especificar al menos un beneficiario (para cheque o transferencia).",
  //     path: ['elaborarChequeA'], 
  //   });
  // }
});

export type SolicitudFormData = z.infer<typeof solicitudSchema>;
