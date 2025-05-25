
"use server";
import type { Product, ProductFormData } from "./types";

// This is a mock in-memory store. In a real app, you'd use a database.
let products: Product[] = []; // Initialize with an empty array
let nextId = 1; // Start IDs from 1

export async function getProducts(): Promise<Product[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...products]; // Return a copy to avoid direct mutation issues
}

export async function addProduct(productData: ProductFormData): Promise<Product> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newProduct: Product = { ...productData, id: String(nextId++) };
  products.push(newProduct);
  return { ...newProduct }; // Return a copy
}

export async function updateProduct(id: string, productData: Partial<ProductFormData>): Promise<Product | null> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const productIndex = products.findIndex(p => p.id === id);
  if (productIndex === -1) {
    return null;
  }
  products[productIndex] = { ...products[productIndex], ...productData };
  return { ...products[productIndex] }; // Return a copy
}

export async function deleteProduct(id: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const initialLength = products.length;
  products = products.filter(p => p.id !== id);
  return products.length < initialLength;
}

// Helper function to reset products for a new exam session, if needed from server actions context
// Typically, context reset is handled client-side, but this could be useful for more complex scenarios.
export async function resetAllProductsForNewExam(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
  products = [];
  nextId = 1;
}
