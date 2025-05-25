
"use client";
import { useState, useEffect } from "react";
import type { Product, ProductFormData } from "@/lib/types";
import { ProductTable } from "./product-table";
import { ProductForm } from "./product-form";
import { DeleteProductDialog } from "./delete-product-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addProduct, updateProduct, deleteProduct, getProducts } from "@/lib/actions";
import { Skeleton } from "@/components/ui/skeleton";
import { useExamContext } from '@/contexts/exam-context';

export function ProductListClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [productToDelete, setProductToDelete] = useState<Product | undefined>(undefined);
  const [isDeleteDialogLoading, setIsDeleteDialogLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const { toast } = useToast();

  const { examData } = useExamContext();
  const [hasTriggeredInitialModal, setHasTriggeredInitialModal] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        toast({ title: "Error", description: "Failed to fetch products.", variant: "destructive" });
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [toast]);

  useEffect(() => {
    if (!isLoadingProducts && products.length === 0 && examData.ne && !hasTriggeredInitialModal) {
      setIsModalOpen(true);
      setHasTriggeredInitialModal(true);
    }
  }, [products, isLoadingProducts, examData, hasTriggeredInitialModal, setIsModalOpen, setHasTriggeredInitialModal]);


  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleteDialogLoading(true);
    try {
      await deleteProduct(productToDelete.id);
      setProducts(products.filter((p) => p.id !== productToDelete.id));
      toast({ title: "Success", description: `Product "${productToDelete.name}" deleted.` });
      setProductToDelete(undefined);
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" });
    } finally {
      setIsDeleteDialogLoading(false);
    }
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    setIsFormLoading(true);
    try {
      if (editingProduct) {
        const updatedProduct = await updateProduct(editingProduct.id, data);
        if (updatedProduct) {
          setProducts(products.map((p) => (p.id === editingProduct.id ? updatedProduct : p)));
          toast({ title: "Success", description: `Product "${updatedProduct.name}" updated.` });
        }
      } else {
        const newProduct = await addProduct(data);
        setProducts([...products, newProduct]);
        toast({ title: "Success", description: `Product "${newProduct.name}" added.` });
      }
      setIsModalOpen(false);
      setEditingProduct(undefined);
    } catch (error) {
      toast({ title: "Error", description: "Failed to save product.", variant: "destructive" });
    } finally {
      setIsFormLoading(false);
    }
  };

  if (isLoadingProducts) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold tracking-tight">Product Inventory</h2>
        <Button onClick={handleAddProduct}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
        </Button>
      </div>

      <ProductTable
        products={products}
        onEditProduct={handleEditProduct}
        onDeleteProduct={handleDeleteProduct}
      />

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) {setIsModalOpen(false); setEditingProduct(undefined);}}}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update the details of your product." : "Fill in the form to add a new product to your inventory."}
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            onSubmit={handleFormSubmit}
            onCancel={() => {setIsModalOpen(false); setEditingProduct(undefined);}}
            isLoading={isFormLoading}
          />
        </DialogContent>
      </Dialog>

      <DeleteProductDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(undefined)}
        onConfirm={confirmDeleteProduct}
        productName={productToDelete?.name}
        isLoading={isDeleteDialogLoading}
      />
    </div>
  );
}
