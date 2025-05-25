
"use client";

import type { InitialInfoFormData, ExamData } from "@/lib/schemas/exam-schemas";
import type { Product, ProductFormData } from "@/lib/types";
import { useRouter } from "next/navigation";
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  getProducts as getProductsAction,
  addProduct as addProductAction,
  updateProduct as updateProductAction,
  deleteProduct as deleteProductAction,
  resetAllProductsForNewExam
} from "@/lib/actions";

export enum ExamStep {
  INITIAL_INFO = "INITIAL_INFO",
  PRODUCT_LIST = "PRODUCT_LIST",
  PREVIEW = "PREVIEW",
}

interface ExamContextType {
  examData: Partial<ExamData>;
  setExamData: (data: Partial<ExamData>) => void;
  currentStep: ExamStep;
  setCurrentStep: (step: ExamStep) => void;
  resetExam: () => void;

  products: Product[];
  isLoadingProducts: boolean;
  productCount: number;
  fetchProducts: () => Promise<void>;
  
  isProductModalOpen: boolean;
  editingProduct: Product | undefined;
  isProductFormLoading: boolean;
  openProductModal: (product?: Product) => void;
  closeProductModal: () => void;
  handleProductFormSubmit: (data: ProductFormData) => Promise<void>;

  productToDelete: Product | undefined;
  isDeleteDialogLoading: boolean;
  openDeleteDialog: (product: Product) => void;
  closeDeleteDialog: () => void;
  confirmDeleteProduct: () => Promise<void>;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

const initialExamData: Partial<ExamData> = {};

export const ExamProvider = ({ children }: { children: ReactNode }) => {
  const [examData, setExamDataState] = useState<Partial<ExamData>>(initialExamData);
  const [currentStep, setCurrentStepState] = useState<ExamStep>(ExamStep.INITIAL_INFO);
  const router = useRouter();
  const { toast } = useToast();

  // Product state
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productCount, setProductCount] = useState(0);

  // Add/Edit Product Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [isProductFormLoading, setIsProductFormLoading] = useState(false);
  const [hasAutoOpenedProductModal, setHasAutoOpenedProductModal] = useState(false);


  // Delete Product Dialog state
  const [productToDelete, setProductToDelete] = useState<Product | undefined>(undefined);
  const [isDeleteDialogLoading, setIsDeleteDialogLoading] = useState(false);


  const setExamDataCb = useCallback((data: Partial<ExamData>) => {
    setExamDataState((prevData) => ({ ...prevData, ...data }));
  }, []);

  const setCurrentStepCb = useCallback((step: ExamStep) => {
    setCurrentStepState(step);
    if (step === ExamStep.PRODUCT_LIST) {
      router.push('/');
    } else if (step === ExamStep.PREVIEW) {
      router.push('/preview');
    } else if (step === ExamStep.INITIAL_INFO) {
      router.push('/new-exam');
    }
  }, [router]);

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const fetchedProducts = await getProductsAction();
      setProducts(fetchedProducts);
      setProductCount(fetchedProducts.length);
      
      // Auto-open modal if coming from initial form and no products exist
      if (fetchedProducts.length === 0 && examData.ne && !hasAutoOpenedProductModal) {
        setIsProductModalOpen(true); // Directly open modal
        setEditingProduct(undefined); // Ensure it's for a new product
        setHasAutoOpenedProductModal(true);
      }

    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch products.", variant: "destructive" });
    } finally {
      setIsLoadingProducts(false);
    }
  }, [examData.ne, hasAutoOpenedProductModal, toast]);
  
  const resetExamCb = useCallback(async () => {
    setExamDataState(initialExamData);
    setProducts([]);
    setProductCount(0);
    setEditingProduct(undefined);
    setIsProductModalOpen(false);
    setProductToDelete(undefined);
    setHasAutoOpenedProductModal(false);
    await resetAllProductsForNewExam(); // Clear server-side mock data
    setCurrentStepCb(ExamStep.INITIAL_INFO);
  }, [setCurrentStepCb]);


  // Product Modal Handlers
  const openProductModal = useCallback((product?: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  }, []);

  const closeProductModal = useCallback(() => {
    setIsProductModalOpen(false);
    setEditingProduct(undefined);
  }, []);

  const handleProductFormSubmit = useCallback(async (data: ProductFormData) => {
    setIsProductFormLoading(true);
    try {
      if (editingProduct) {
        const updatedProduct = await updateProductAction(editingProduct.id, data);
        if (updatedProduct) {
          setProducts(prevProducts => prevProducts.map(p => (p.id === editingProduct.id ? updatedProduct : p)));
          toast({ title: "Éxito", description: `Producto "${updatedProduct.name}" actualizado.` });
        }
      } else {
        const newProduct = await addProductAction(data);
        setProducts(prevProducts => [...prevProducts, newProduct]);
        setProductCount(prevCount => prevCount + 1);
        toast({ title: "Éxito", description: `Producto "${newProduct.name}" añadido.` });
      }
      closeProductModal();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar el producto.", variant: "destructive" });
    } finally {
      setIsProductFormLoading(false);
    }
  }, [editingProduct, closeProductModal, toast]);

  // Delete Dialog Handlers
  const openDeleteDialog = useCallback((product: Product) => {
    setProductToDelete(product);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setProductToDelete(undefined);
  }, []);

  const confirmDeleteProduct = useCallback(async () => {
    if (!productToDelete) return;
    setIsDeleteDialogLoading(true);
    try {
      await deleteProductAction(productToDelete.id);
      setProducts(prevProducts => prevProducts.filter(p => p.id !== productToDelete.id));
      setProductCount(prevCount => prevCount - 1);
      toast({ title: "Éxito", description: `Producto "${productToDelete.name}" eliminado.` });
      closeDeleteDialog();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar el producto.", variant: "destructive" });
    } finally {
      setIsDeleteDialogLoading(false);
    }
  }, [productToDelete, closeDeleteDialog, toast]);


  return (
    <ExamContext.Provider value={{ 
      examData, 
      setExamData: setExamDataCb, 
      currentStep, 
      setCurrentStep: setCurrentStepCb, 
      resetExam: resetExamCb,
      products,
      isLoadingProducts,
      productCount,
      fetchProducts,
      isProductModalOpen,
      editingProduct,
      isProductFormLoading,
      openProductModal,
      closeProductModal,
      handleProductFormSubmit,
      productToDelete,
      isDeleteDialogLoading,
      openDeleteDialog,
      closeDeleteDialog,
      confirmDeleteProduct
    }}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExamContext = () => {
  const context = useContext(ExamContext);
  if (context === undefined) {
    throw new Error("useExamContext must be used within an ExamProvider");
  }
  return context;
};
