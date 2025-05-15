
export interface Product {
  id: string;
  name: string;
  hsCode: string;
  quantity: number;
  value: number;
  countryOfOrigin: string;
}

export interface ExamInfo {
  examId: string;
  date: string;
  inspectorName: string;
  location: string;
}

export const USER_ROLES = {
  INSPECTOR: "inspector",
  VIEWER: "viewer",
  ADMIN: "admin",
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES] | null;

export interface SavedExam {
  id: string; // Unique ID for the saved exam
  examInfo: ExamInfo;
  products: Product[];
  timestamp: string; // ISO string date of when it was saved/updated
}
