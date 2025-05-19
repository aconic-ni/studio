import { z } from 'zod';

export const ExamInfoSchema = z.object({
  ne: z.string().min(1, 'NE es requerido.'),
  reference: z.string().optional(),
  manager: z.string().min(1, 'Nombre del gestor es requerido.'),
  location: z.string().min(1, 'Ubicación es requerida.'),
});
export type ExamInfo = z.infer<typeof ExamInfoSchema>;

export const ProductSchema = z.object({
  id: z.string().optional(), // for client-side identification
  itemNumber: z.string().optional(),
  description: z.string().optional(),
  weight: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  unitMeasure: z.string().optional(), // Fabricante in HTML, but seems like Unit of Measure
  serial: z.string().optional(),
  origin: z.string().optional(),
  numberPackages: z.string().optional(), // Numeración de Bultos
  quantityPackages: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, "Debe ser un número positivo").optional()
  ),
  quantityUnits: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, "Debe ser un número positivo").optional()
  ),
  packagingCondition: z.string().optional(), // Estado de Mercancía
  observation: z.string().optional(),
  hsCode: z.string().optional(), // For AI suggestion
  isConform: z.boolean().default(false),
  isExcess: z.boolean().default(false),
  isMissing: z.boolean().default(false),
  isFault: z.boolean().default(false),
});
export type Product = z.infer<typeof ProductSchema>;

export const AccessCodeSchema = z.object({
  accessCode: z.string().length(6, "El código debe tener 6 dígitos.").regex(/^\d{6}$/, "El código debe ser numérico."),
});
export type AccessCodeFormData = z.infer<typeof AccessCodeSchema>;
