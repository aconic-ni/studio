
export interface Product {
  id: string;
  itemNumber: string; // User-defined item number / SKU. From HTML: itemNumber
  name: string; // Name or description of the item. From HTML: description
  reference?: string; // Optional reference code. From InitialInfoForm and ProductForm
  location?: string; // Optional location of the item. From InitialInfoForm and ProductForm
  brand?: string; // Optional brand of the item. From HTML: brand
  quantity: number; // Quantity of the item. From HTML: quantityUnits
  
  // New fields from HTML
  weight?: string; // From HTML: weight
  model?: string; // From HTML: model
  unitMeasure?: string; // From HTML: unitMeasure
  serial?: string; // From HTML: serial
  origin?: string; // From HTML: origin
  numberPackages?: string; // From HTML: numberPackages
  quantityPackages?: number; // From HTML: quantityPackages
  packagingCondition?: string; // From HTML: packagingCondition (text input, not enum)
  observation?: string; // From HTML: observation
  isConform?: boolean; // From HTML: isConform checkbox
  isExcess?: boolean; // From HTML: isExcess checkbox
  isMissing?: boolean; // From HTML: isMissing checkbox
  isFault?: boolean; // From HTML: isFault checkbox
}

export type ProductFormData = Omit<Product, 'id'>;
