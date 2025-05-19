
import { z } from 'zod';

export const ExamInfoSchema = z.object({
  id: z.string().optional(), // Firestore document ID
  ne: z.string().min(1, 'NE es requerido.'),
  reference: z.string().optional(),
  manager: z.string().min(1, 'Nombre del gestor es requerido.'),
  location: z.string().min(1, 'Ubicación es requerida.'),
  products: z.array(z.lazy(() => ProductSchema)).optional(), // To store products with the exam
  createdAt: z.any().optional(), // Firestore timestamp
  createdBy: z.string().optional(), // User ID or name
  lastModifiedAt: z.any().optional(), // Firestore timestamp
  lastModifiedBy: z.string().optional(), // User ID or name
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

export const LoginSchema = z.object({
  email: z.string().email("Correo electrónico inválido."),
  password: z.string().min(1, "La contraseña es requerida."), // Min 1 for now for easier testing
});
export type LoginFormData = z.infer<typeof LoginSchema>;

export const UserRoleEnum = z.enum(['admin', 'ejecutivo', 'gestor']);
export type UserRole = z.infer<typeof UserRoleEnum> | null;

export const CreateUserSchema = z.object({
  email: z.string().email("Correo electrónico inválido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  role: UserRoleEnum,
});
export type CreateUserFormData = z.infer<typeof CreateUserSchema>;
