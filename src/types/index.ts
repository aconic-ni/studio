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
