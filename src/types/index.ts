
export const USER_ROLES = {
  INSPECTOR: "gestorAduanero", // Valor cambiado
  VIEWER: "viewer",
  ADMIN: "admin",
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES] | null;

export const PRODUCT_STATUS = {
  CONFORME: "Todo conforme",
  EXCEDENTE: "Notificar Excedente",
  FALTANTE: "Notificar Faltante",
  AVERIA: "Notificar Avería",
} as const;

export type ProductStatus = typeof PRODUCT_STATUS[keyof typeof PRODUCT_STATUS];

export interface Product {
  id: string;
  itemNumber?: string;
  packageNumbers?: string;
  packageQuantity?: number;
  unitQuantity?: number;
  description: string;
  brand?: string;
  model?: string;
  origin?: string;
  merchandiseState?: string; // e.g., "Nuevo", "Usado", "Dañado leve"
  weightValue?: number;
  weightUnit?: string; // e.g., "kg", "lb", "g"
  measurementUnit?: string; // e.g., "unidades", "pares", "docenas"
  serialNumber?: string;
  observation?: string;
  status: ProductStatus;
}

export interface ExamInfo {
  examId: string;
  date: string;
  inspectorName: string; // El nombre del campo sigue igual, la etiqueta cambiará
  location: string;
}

export interface SavedExam {
  id: string; // Unique ID for the saved exam
  examInfo: ExamInfo;
  products: Product[];
  timestamp: string; // ISO string date of when it was saved/updated
}
