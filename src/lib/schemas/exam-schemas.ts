
import * as z from "zod";

export const initialInfoSchema = z.object({
  ne: z.string().min(1, "NE (Seguimiento NX1) es requerido."),
  reference: z.string().optional(),
  manager: z.string().min(1, "Nombre del Gestor es requerido."),
  location: z.string().min(1, "Ubicación de la Mercancía es requerida."),
});

export type InitialInfoFormData = z.infer<typeof initialInfoSchema>;

// Placeholder for future product data schema if needed within the exam context
export interface ExamProductData {
  // Define product fields relevant to the exam/multi-step process
  id: string;
  name: string;
  quantity: number;
}

export interface ExamData extends InitialInfoFormData {
  products?: ExamProductData[];
}
