
"use client";
import type React from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ExamData, SolicitudData, AppUser as AuthAppUser } from '@/types'; // Changed Product to SolicitudData
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';

export enum ExamStep {
  INITIAL_INFO = 1,
  PRODUCT_LIST = 2, // This step now manages a list of SolicitudData
  PREVIEW = 3,
  SUCCESS = 4,
}

interface AppContextType {
  examData: ExamData | null;
  products: SolicitudData[]; // Changed from Product[] to SolicitudData[]
  currentStep: ExamStep;
  editingProduct: SolicitudData | null; // Changed from Product | null
  isAddProductModalOpen: boolean;
  isProductDetailModalOpen: boolean;
  productToView: SolicitudData | null; // Changed from Product | null
  setExamData: (data: ExamData) => void;
  addProduct: (product: Omit<SolicitudData, 'id'>) => void; // Changed from Product
  updateProduct: (updatedProduct: SolicitudData) => void; // Changed from Product
  deleteProduct: (productId: string) => void;
  setCurrentStep: (step: ExamStep) => void;
  setEditingProduct: (product: SolicitudData | null) => void; // Changed from Product
  openAddProductModal: (productToEdit?: SolicitudData | null) => void; // Changed from Product
  closeAddProductModal: () => void;
  openProductDetailModal: (product: SolicitudData) => void; // Changed from Product
  closeProductDetailModal: () => void;
  resetApp: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [examData, setExamDataState] = useState<ExamData | null>(null);
  const [products, setProducts] = useState<SolicitudData[]>([]); // products is now an array of SolicitudData
  const [currentStep, setCurrentStepState] = useState<ExamStep>(ExamStep.INITIAL_INFO);
  const [editingProduct, setEditingProductState] = useState<SolicitudData | null>(null); // editingProduct is now SolicitudData or null
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isProductDetailModalOpen, setIsProductDetailModalOpen] = useState(false);
  const [productToView, setProductToView] = useState<SolicitudData | null>(null); // productToView is now SolicitudData or null

  const { user: authUser } = useAuth(); 
  const [internalUser, setInternalUser] = useState<AuthAppUser | null>(authUser);

  const { user } = useAuth(); // For pre-filling email

  const resetApp = useCallback(() => {
    setExamDataState(null);
    setProducts([]);
    setCurrentStepState(ExamStep.INITIAL_INFO);
    setEditingProductState(null);
    setIsAddProductModalOpen(false);
    setIsProductDetailModalOpen(false);
    setProductToView(null);
  }, []);


  useEffect(() => {
    const authUserChanged = authUser?.uid !== internalUser?.uid || 
                           (authUser && !internalUser) || 
                           (!authUser && internalUser);

    if (authUserChanged) {
      resetApp();
      setInternalUser(authUser); 
    }
  }, [authUser, internalUser, resetApp]);


  const setExamData = useCallback((data: ExamData) => {
    setExamDataState(data);
  }, []);

  const addProduct = useCallback((productData: Omit<SolicitudData, 'id'>) => { // productData is Omit<SolicitudData, 'id'>
    const newProduct: SolicitudData = { ...productData, id: uuidv4() }; // newProduct is SolicitudData
    setProducts((prevProducts) => [...prevProducts, newProduct]);
  }, []);

  const updateProduct = useCallback((updatedProduct: SolicitudData) => { // updatedProduct is SolicitudData
    setProducts((prevProducts) =>
      prevProducts.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    setEditingProductState(null); 
  }, []);

  const deleteProduct = useCallback((productId: string) => {
    setProducts((prevProducts) => prevProducts.filter((p) => p.id !== productId));
  }, []);

  const setCurrentStep = useCallback((step: ExamStep) => {
    setCurrentStepState(step);
  }, []);
  
  const setEditingProduct = useCallback((product: SolicitudData | null) => { // product is SolicitudData or null
    setEditingProductState(product);
  }, []);

  const openAddProductModal = useCallback((productToEdit: SolicitudData | null = null) => { // productToEdit is SolicitudData or null
    setEditingProductState(productToEdit);
    setIsAddProductModalOpen(true);
  }, []);

  const closeAddProductModal = useCallback(() => {
    setIsAddProductModalOpen(false);
    // Delay resetting editingProduct to allow form.reset to use it
    setTimeout(() => setEditingProductState(null), 100);
  }, []);

  const openProductDetailModal = useCallback((product: SolicitudData) => { // product is SolicitudData
    setProductToView(product);
    setIsProductDetailModalOpen(true);
  }, []);

  const closeProductDetailModal = useCallback(() => {
    setIsProductDetailModalOpen(false);
    setProductToView(null);
  }, []);

  // Default values for a new Solicitud, used in AppContext
  const defaultSolicitudValues: Omit<SolicitudData, 'id'> = {
    monto: undefined,
    montoMoneda: 'cordoba',
    cantidadEnLetras: '',
    declaracionNumero: '',
    unidadRecaudadora: '',
    codigo1: '',
    codigo2: '',
    banco: undefined,
    bancoOtros: '',
    numeroCuenta: '',
    monedaCuenta: undefined,
    monedaCuentaOtros: '',
    elaborarChequeA: '',
    elaborarTransferenciaA: '',
    impuestosPagadosCliente: false,
    impuestosPagadosRC: '',
    impuestosPagadosTB: '',
    impuestosPagadosCheque: '',
    impuestosPendientesCliente: false,
    documentosAdjuntos: false,
    constanciasNoRetencion: false,
    constanciasNoRetencion1: false,
    constanciasNoRetencion2: false,
    correo: user?.email || '',
    observation: '',
  };


  return (
    <AppContext.Provider
      value={{
        examData,
        products,
        currentStep,
        editingProduct,
        isAddProductModalOpen,
        isProductDetailModalOpen,
        productToView,
        setExamData,
        addProduct,
        updateProduct,
        deleteProduct,
        setCurrentStep,
        setEditingProduct,
        openAddProductModal,
        closeAddProductModal,
        openProductDetailModal,
        closeProductDetailModal,
        resetApp,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
