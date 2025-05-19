
"use client";

import { useState, useEffect } from 'react';
import type { ExamInfo, Product, UserRole } from '@/lib/schemas';
import { AuthWorkflow } from '@/components/auth/AuthWorkflow';
import { AppHeader } from '@/components/common/Header';
import { ExamForm } from '@/components/exam/ExamForm';
import { ProductListScreen } from '@/components/product/ProductListScreen';
import { AddProductModalContent } from '@/components/product/AddProductModalContent';
import { ProductDetailModalContent } from '@/components/product/ProductDetailModalContent';
import { PreviewModalContent } from '@/components/preview/PreviewModalContent';
import { SuccessModalContent } from '@/components/common/SuccessModalContent';
import { AdminDashboard } from '@/components/admin/AdminDashboard'; // New Admin Dashboard
import { AddUserModalContent } from '@/components/admin/AddUserModalContent'; // New Add User Modal
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { generateTxtReport, downloadFile, generateExcelReport } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type AppView = 'login' | 'examForm' | 'productList' | 'adminDashboard';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false); // For Admin

  // Mock data for saved exams - replace with Firestore fetching later
  const [savedExams, setSavedExams] = useState<ExamInfo[]>([]); 

  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isLoggedIn && (examInfo || products.length > 0) && userRole !== 'admin') { 
        event.preventDefault();
        event.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isLoggedIn, examInfo, products, userRole]);


  const handleLoginSuccess = (role: UserRole) => {
    setIsLoggedIn(true);
    setUserRole(role);
    toast({ title: "Acceso Concedido", description: `Bienvenido. Rol: ${role?.toUpperCase()}` });
    if (role === 'admin') {
      setCurrentView('adminDashboard');
      // Fetch saved exams for admin (mocked for now)
      setSavedExams([
        { ne: 'NX1001', reference: 'REF001', manager: 'Admin Test User', location: 'Almacen Central' },
        { ne: 'NX1002', reference: 'REF002', manager: 'Admin Test User 2', location: 'Bodega B' },
      ]);
    } else {
      setCurrentView('examForm'); 
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setExamInfo(null);
    setProducts([]);
    setSavedExams([]);
    setCurrentView('login');
    toast({ title: "Sesión Cerrada", description: "Has salido de la aplicación." });
  };

  const handleExamInfoSubmit = (data: ExamInfo) => {
    setExamInfo(data);
    setCurrentView('productList');
  };

  const handleAddOrUpdateProduct = (product: Product) => {
    setProducts(prevProducts => {
      const existingIndex = prevProducts.findIndex(p => p.id === product.id);
      if (existingIndex > -1) {
        const updatedProducts = [...prevProducts];
        updatedProducts[existingIndex] = product;
        return updatedProducts;
      }
      return [...prevProducts, product];
    });
    setIsAddEditModalOpen(false);
    setEditingProduct(undefined);
  };

  const handleOpenAddProductModal = () => {
    setEditingProduct(undefined);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setIsAddEditModalOpen(true);
  };
  
  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
     if (window.confirm('¿Está seguro de que desea eliminar este producto?')) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        toast({ title: "Producto Eliminado", description: "El producto ha sido eliminado de la lista." });
     }
  };

  const handleFinalize = () => {
    if (products.length === 0 && examInfo) {
      toast({ title: "Sin Productos", description: "Debe agregar al menos un producto antes de finalizar.", variant: "destructive" });
      return;
    }
    setIsPreviewModalOpen(true);
  };

  const handleConfirmExam = () => {
    setIsPreviewModalOpen(false);
    setIsSuccessModalOpen(true);
     toast({ title: "Examen Confirmado", description: "La información del examen ha sido procesada." });
  };

  const handleStartNewExam = () => {
    setExamInfo(null);
    setProducts([]);
    setCurrentView('examForm');
    setIsSuccessModalOpen(false);
  };

  const handleReviewPreviousExam = () => {
    setIsSuccessModalOpen(false);
    setCurrentView('productList'); 
  };

  const handleSaveExamData = () => {
    // Placeholder for saving exam data to Firestore
    if (!examInfo || products.length === 0) {
      toast({ title: "Datos incompletos", description: "No hay información de examen o productos para guardar.", variant: "destructive" });
      return;
    }
    console.log("Simulando guardado de examen:", { examInfo, products });
    // In a real scenario, this would be an async call to Firebase/Firestore
    // Add to a local 'savedExams' list for admin demo purposes for now
    setSavedExams(prev => [...prev, examInfo]); 
    toast({ title: "Examen Guardado (Simulado)", description: "El examen se ha guardado localmente para demostración." });
  };
  
  const handleDownloadTxt = () => {
    if (!examInfo) return;
    const reportContent = generateTxtReport(examInfo, products);
    const filename = `CustomsEX-p_${examInfo.ne}_${new Date().toISOString().split('T')[0]}.txt`;
    downloadFile(filename, reportContent, 'text/plain');
  };

  const handleDownloadExcel = () => {
    if (!examInfo) return;
    generateExcelReport(examInfo, products);
  };

  const handleOpenAddUserModal = () => setIsAddUserModalOpen(true);
  const handleCloseAddUserModal = () => setIsAddUserModalOpen(false);
  const handleCreateUser = (userData: any) => { // Replace 'any' with CreateUserFormData
    // Placeholder for Firebase user creation
    console.log("Creando nuevo usuario (simulado):", userData);
    toast({ title: "Usuario Creado (Simulado)", description: `El usuario ${userData.email} con rol ${userData.role} ha sido creado.` });
    setIsAddUserModalOpen(false);
  };

  const handleViewSavedExam = (exam: ExamInfo) => {
    // Placeholder: In a real app, you might fetch full details or navigate to a specific view
    toast({ title: "Ver Examen", description: `Viendo detalles del examen NE: ${exam.ne}` });
    // For now, just log, or you could open a modal showing examInfo and associated products (if fetched)
    console.log("Viendo examen guardado:", exam);
  };

  if (!isLoggedIn || currentView === 'login') {
    return <AuthWorkflow onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl min-h-screen flex flex-col">
      <AppHeader isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      {userRole && (
        <div className="text-white text-center mb-2 bg-primary/20 p-2 rounded-md">
          Rol Actual: <span className="font-semibold">{userRole.toUpperCase()}</span>
        </div>
      )}
      <main className="flex-grow">
        {currentView === 'adminDashboard' && userRole === 'admin' && (
          <AdminDashboard
            savedExams={savedExams}
            onAddNewUser={handleOpenAddUserModal}
            onViewExam={handleViewSavedExam}
          />
        )}
        {currentView === 'examForm' && userRole !== 'admin' && (
          <ExamForm 
            onSubmitExamInfo={handleExamInfoSubmit} 
            initialData={examInfo || undefined} 
          />
        )}
        {currentView === 'productList' && examInfo && userRole !== 'admin' && (
          <ProductListScreen
            examInfo={examInfo}
            products={products}
            onAddNewProduct={handleOpenAddProductModal}
            onEditProduct={handleOpenEditProductModal}
            onViewProduct={handleViewProduct}
            onDeleteProduct={handleDeleteProduct}
            onFinalize={handleFinalize}
            onBackToExamForm={() => setCurrentView('examForm')}
          />
        )}
      </main>

      {/* Add/Edit Product Modal */}
      <Dialog open={isAddEditModalOpen} onOpenChange={(isOpen) => {
          if (!isOpen) setEditingProduct(undefined);
          setIsAddEditModalOpen(isOpen);
        }}>
        <DialogContent className="sm:max-w-3xl p-0">
          <DialogHeader className="p-5 md:p-6 pb-0 text-left">
            <DialogTitle className="text-lg md:text-xl font-semibold text-foreground">
              {editingProduct ? 'Editar Producto' : 'Añadir Producto'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-5 md:p-6 pt-0">
            <AddProductModalContent
              onSubmitProduct={handleAddOrUpdateProduct}
              onClose={() => { setIsAddEditModalOpen(false); setEditingProduct(undefined); }}
              initialData={editingProduct}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Detail Modal */}
      {viewingProduct && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-2xl p-0">
             <DialogHeader className="p-5 md:p-6 pb-0 text-left">
                <DialogTitle className="text-lg md:text-xl font-semibold text-foreground">Detalles del Producto</DialogTitle>
            </DialogHeader>
            <div className="p-5 md:p-6 pt-0">
              <ProductDetailModalContent product={viewingProduct} onClose={() => setIsDetailModalOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Preview Modal */}
      {examInfo && (
        <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
          <DialogContent className="sm:max-w-4xl p-0">
            <DialogHeader className="p-5 md:p-6 pb-0 text-left">
                <DialogTitle className="text-lg md:text-xl font-semibold text-foreground">Vista Previa</DialogTitle>
            </DialogHeader>
            <div className="p-5 md:p-6 pt-0">
              <PreviewModalContent
                examInfo={examInfo}
                products={products}
                onConfirm={handleConfirmExam}
                onDownloadTxt={handleDownloadTxt}
                onDownloadExcel={handleDownloadExcel}
                onClose={() => setIsPreviewModalOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Success Modal */}
      {examInfo && (
         <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
          <DialogContent className="sm:max-w-md p-0">
            <SuccessModalContent
              managerName={examInfo.manager}
              onStartNew={handleStartNewExam}
              onReviewPrevious={handleReviewPreviousExam}
              onSave={handleSaveExamData}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Add User Modal (Admin only) */}
      {userRole === 'admin' && (
        <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
          <DialogContent className="sm:max-w-lg p-0">
            <DialogHeader className="p-5 md:p-6 pb-0 text-left">
              <DialogTitle className="text-lg md:text-xl font-semibold text-foreground">
                Agregar Nuevo Usuario
              </DialogTitle>
            </DialogHeader>
            <div className="p-5 md:p-6 pt-0">
              <AddUserModalContent
                onSubmitUser={handleCreateUser}
                onClose={handleCloseAddUserModal}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
