"use server";
import type { Product, ProductFormData } from "./types";

// This is a mock in-memory store. In a real app, you'd use a database.
let products: Product[] = [
  { id: "1", itemNumber: "ABC001", name: "High-Performance Widget", reference: "HPW-001", location: "Shelf A1", brand: "Acme Corp", quantity: 150, packagingCondition: "New" },
  { id: "2", itemNumber: "XYZ002", name: "Standard Gizmo", reference: "SG-002", location: "Bin B3", brand: "Beta Inc", quantity: 300, packagingCondition: "Used" },
  { id: "3", itemNumber: "QWE003", name: "Heavy-Duty Component", reference: "HDC-003", location: "Pallet C5", brand: "Gamma LLC", quantity: 75, packagingCondition: "Good" },
];
let nextId = products.length + 1;

export async function getProducts(): Promise<Product[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return products;
}

export async function addProduct(productData: ProductFormData): Promise<Product> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newProduct: Product = { ...productData, id: String(nextId++) };
  products.push(newProduct);
  return newProduct;
}

export async function updateProduct(id: string, productData: Partial<ProductFormData>): Promise<Product | null> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const productIndex = products.findIndex(p => p.id === id);
  if (productIndex === -1) {
    return null;
  }
  products[productIndex] = { ...products[productIndex], ...productData };
  return products[productIndex];
}

export async function deleteProduct(id: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const initialLength = products.length;
  products = products.filter(p => p.id !== id);
  return products.length < initialLength;
}
