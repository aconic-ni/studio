export interface Product {
  id: string; // Unique identifier for the product entry (e.g., Firestore document ID or UUID)
  itemNumber: string; // User-defined item number / SKU
  name: string; // Name or description of the item
  reference?: string; // Optional reference code
  location?: string; // Optional location of the item
  brand?: string; // Optional brand of the item
  quantity: number; // Quantity of the item
  packagingCondition?: "New" | "Used" | "Damaged" | "Good" | "Fair" | "Poor" | "Other"; // Condition of the packaging
  // Timestamps for database entries, optional for local state
  // createdAt?: Date;
  // updatedAt?: Date;
}

export type ProductFormData = Omit<Product, 'id'>;
