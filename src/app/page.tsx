
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { ExamInfo, Product, UserRole, CreateUserFormData } from '@/lib/schemas';
import { AuthWorkflow } from '@/components/auth/AuthWorkflow';
import { AppHeader } from '@/components/common/Header';
import { ExamForm } from '@/components/exam/ExamForm';
import { ProductListScreen } from '@/components/product/ProductListScreen';
import { AddProductModalContent } from '@/components/product/AddProductModalContent';
import { ProductDetailModalContent } from '@/components/product/ProductDetailModalContent';
import { PreviewModalContent } from '@/components/preview/PreviewModalContent';
import { SuccessModalContent } from '@/components/common/SuccessModalContent';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AddUserModalContent } from '@/components/admin/AddUserModalContent';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { generateTxtReport, downloadFile, generateExcelReport } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { auth, db } from '@/lib/firebase'; 
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
// import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, setDoc, Timestamp, getDoc } from 'firebase/firestore'; // Firestore imports commented out
import { Timestamp } from 'firebase/firestore'; // Keep Timestamp if used for mock data typing


type AppView = 'login' | 'examForm' | 'productList' | 'adminDashboard';

// Mock data if Firestore is inactive
const mockSavedExams: ExamInfo[] = [
  // { id: 'mock1', ne: 'NXTEST1', reference: 'MOCKREF1', manager: 'Gestor Mock', location: 'Almacén Mock', products: [], createdBy: 'Gestor Mock', createdAt: new Date(), lastModifiedBy: 'Gestor Mock', lastModifiedAt: new Date() },
];


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
  
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [savedExams, setSavedExams] = useState<ExamInfo[]>(mockSavedExams); 
  const [viewingExamDetail, setViewingExamDetail] = useState<ExamInfo | null>(null);
  const [isViewExamDetailModalOpen, setIsViewExamDetailModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [refreshExamsTrigger, setRefreshExamsTrigger] = useState(0);


  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isLoggedIn && (examInfo || products.length > 0) && userRole !== 'admin' && !editingExamId) { 
        event.preventDefault();
        event.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isLoggedIn, examInfo, products, userRole, editingExamId]);

  const fetchExamsForAdmin = useCallback(async () => {
    if (userRole === 'admin') {
      setIsLoadingExams(true);
      console.log("Firestore is currently inactive. Using mock exam data for admin view.");
      // Simulate fetching by using mockSavedExams or an empty array
      // To populate with some test data if needed:
      // setSavedExams([
      //   { id: 'mock1', ne: 'NXPREV001', reference: 'CONT123', manager: 'Juan Perez (Gestor)', location: 'Bodega Central', products: [], createdBy: 'Juan Perez (Gestor)', createdAt: new Date(2023, 10, 1, 10, 0, 0), lastModifiedBy: 'TEST ADMIN USER', lastModifiedAt: new Date(2023, 10, 1, 14, 30, 0) },
      //   { id: 'mock2', ne: 'NXPREV002', reference: 'GUIA456', manager: 'Ana Gomez (Gestor)', location: 'Almacen Fiscal', products: [], createdBy: 'Ana Gomez (Gestor)', createdAt: new Date(2023, 10, 2, 11, 0, 0), lastModifiedBy: 'Ana Gomez (Gestor)', lastModifiedAt: new Date(2023, 10, 2, 11, 0, 0) },
      // ]);
      setSavedExams(mockSavedExams); // Using the defined mock array
      setIsLoadingExams(false);
      /* // Firestore logic commented out:
      try {
        const examsCollectionRef = collection(db, "exams");
        const q = query(examsCollectionRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedExams: ExamInfo[] = querySnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
          products: docSnap.data().products || [], 
          createdAt: docSnap.data().createdAt instanceof Timestamp ? docSnap.data().createdAt.toDate() : new Date(docSnap.data().createdAt),
          lastModifiedAt: docSnap.data().lastModifiedAt instanceof Timestamp ? docSnap.data().lastModifiedAt.toDate() : new Date(docSnap.data().lastModifiedAt),
        })) as ExamInfo[];
        setSavedExams(fetchedExams);
      } catch (error) {
        console.error("Error fetching exams: ", error);
        // toast({ // UI toast suppressed
        //   title: "Error al cargar exámenes",
        //   description: "No se pudieron cargar los exámenes previos desde la base de datos.",
        //   variant: "destructive",
        // });
      } finally {
        setIsLoadingExams(false);
      }
      */
    }
  }, [userRole, toast]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async firebaseUser => {
      if (firebaseUser) {
        // User is signed in. Role fetching from Firestore is commented out.
        // If AuthWorkflow provided a role (from localUsers), use it. Otherwise, default.
        if (!userRole) { // Only if role isn't already set by a direct login success
            console.warn(`Firebase user ${firebaseUser.email} detected. Firestore role fetching is disabled. Defaulting to 'gestor' role or relying on AuthWorkflow's local user check.`);
            // This part needs to align with AuthWorkflow. AuthWorkflow should be the source of truth for role on initial login.
            // This listener primarily handles session persistence.
            // For now, let's assume AuthWorkflow has handled the initial role or we set a default here if still null.
            // A better approach might be to call a function that consolidates role logic.
            // For simplicity, if userRole is still null here, means AuthWorkflow didn't set it from local.
            handleLoginSuccess('gestor'); // Default role if still not set
        } else {
            // Role was already set by AuthWorkflow (likely from localUsers)
            setIsLoggedIn(true); 
            // currentView might have already been set by AuthWorkflow
            if (userRole === 'admin' && currentView !== 'adminDashboard') {
                setCurrentView('adminDashboard');
            } else if (userRole !== 'admin' && currentView !== 'examForm' && currentView !== 'productList') {
                setCurrentView('examForm');
            }
        }
        /* // Firestore logic for role fetching commented out:
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const role = userData.role as UserRole;
          handleLoginSuccess(role); 
        } else {
          console.warn(`Firestore user data for ${firebaseUser.email} not found or Firestore inactive. Defaulting to 'gestor' role.`);
          handleLoginSuccess('gestor'); // Default role
        }
        */
      } else {
        // User is signed out
        handleLogout();
      }
    });
    return () => unsubscribe();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // userRole removed from deps to avoid re-triggering unnecessarily


  useEffect(() => {
    if (isLoggedIn && currentView === 'adminDashboard' && userRole === 'admin') {
      fetchExamsForAdmin();
    }
  }, [isLoggedIn, currentView, userRole, fetchExamsForAdmin, refreshExamsTrigger]);


  const handleLoginSuccess = (role: UserRole) => {
    setIsLoggedIn(true);
    setUserRole(role);
    toast({ title: "Acceso Concedido", description: `Bienvenido. Rol: ${role?.toUpperCase()}` });
    if (role === 'admin') {
      setCurrentView('adminDashboard');
    } else {
      setCurrentView('examForm'); 
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      setIsLoggedIn(false);
      setUserRole(null);
      setExamInfo(null);
      setProducts([]);
      setSavedExams(mockSavedExams); // Reset to mock data
      setEditingExamId(null);
      setCurrentView('login');
      toast({ title: "Sesión Cerrada", description: "Has salido de la aplicación." });
    }).catch((error) => {
      console.error("Error signing out: ", error.code, error.message);
      // toast({ title: "Error al Salir", description: "No se pudo cerrar la sesión.", variant: "destructive"}); // UI toast suppressed
    });
  };

  const handleExamInfoSubmit = (data: ExamInfo) => {
    const currentAuditFields = editingExamId && examInfo ? {
        createdBy: examInfo.createdBy,
        createdAt: examInfo.createdAt,
    } : {};

    const submittedExamInfo = { 
      ...(examInfo || {}), 
      ...currentAuditFields, 
      ...data 
    };
    setExamInfo(submittedExamInfo);
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
    setEditingExamId(null); 
    setCurrentView('examForm');
    setIsSuccessModalOpen(false);
  };

  const handleReviewPreviousExam = () => {
    setIsSuccessModalOpen(false);
    if (userRole === 'admin') {
      setCurrentView('adminDashboard');
      if (editingExamId) { 
        setExamInfo(null);
        setProducts([]);
        setEditingExamId(null);
      }
    } else {
      setCurrentView('productList');
    }
  };

  const handleSaveExamData = async () => {
    if (!examInfo || !examInfo.manager) { 
      toast({ title: "Datos incompletos", description: "Falta información del gestor o del examen.", variant: "destructive" });
      return;
    }
     if (products.length === 0) {
      toast({ title: "Sin Productos", description: "Debe agregar al menos un producto antes de guardar.", variant: "destructive" });
      return;
    }

    const currentUser = auth.currentUser; 
    const userEmailForAudit = currentUser?.email || "Usuario Desconocido";

    console.log("Firestore is currently inactive. Simulating exam save.");
    toast({ title: "Simulación de Guardado", description: "El examen ha sido 'guardado' localmente (Firestore inactivo)." });
    
    // Update mock data if admin for immediate reflection (won't persist)
    if (userRole === 'admin') {
        const now = new Date();
        const examToSave : ExamInfo = {
            ...examInfo,
            id: editingExamId || `mock_${Date.now()}`,
            products: products,
            lastModifiedAt: now,
            lastModifiedBy: userRole === 'admin' ? "TEST ADMIN USER" : userEmailForAudit,
            ...(editingExamId ? {} : { createdAt: now, createdBy: examInfo.manager }),
        };
        
        if (editingExamId) {
            const index = mockSavedExams.findIndex(ex => ex.id === editingExamId);
            if (index !== -1) mockSavedExams[index] = examToSave; else mockSavedExams.push(examToSave);
        } else {
            mockSavedExams.push(examToSave);
        }
        setRefreshExamsTrigger(prev => prev + 1);
    }

    /* // Firestore logic commented out:
    try {
      if (editingExamId) {
        const examDocRef = doc(db, "exams", editingExamId);
        const updateData: Partial<ExamInfo> = {
          ...examInfo, 
          products: products,
          lastModifiedAt: serverTimestamp(),
          lastModifiedBy: userRole === 'admin' ? (auth.currentUser?.email || "TEST ADMIN USER") : examInfo.manager,
        };
        
        delete updateData.id; 
        if (examInfo.createdBy) updateData.createdBy = examInfo.createdBy;
        if (examInfo.createdAt) updateData.createdAt = examInfo.createdAt;
        
        await setDoc(examDocRef, updateData, { merge: true }); 
        toast({ title: "Examen Actualizado", description: "El examen ha sido actualizado en la base de datos." });
      } else {
        const newExamData: ExamInfo = {
          ...examInfo,
          products: products,
          createdBy: examInfo.manager, 
          createdAt: serverTimestamp(),
          lastModifiedBy: examInfo.manager, 
          lastModifiedAt: serverTimestamp(), 
        };
        await addDoc(collection(db, "exams"), newExamData);
        toast({ title: "Examen Guardado", description: "El examen ha sido guardado en la base de datos." });
      }

      if (userRole === 'admin') {
        setTimeout(() => {
          setRefreshExamsTrigger(prev => prev + 1);
        }, 500); 
      }
      
    } catch (error) {
      console.error("Error saving exam data: ", error);
      // toast({ title: "Error al Guardar", description: "No se pudo guardar el examen.", variant: "destructive" }); // UI toast suppressed
    }
    */
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
  
  const handleCreateUser = async (userData: CreateUserFormData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      // const user = userCredential.user;
      console.log(`User ${userData.email} created in Firebase Auth. Firestore profile creation is disabled.`);
      // Firestore user profile creation commented out:
      // await setDoc(doc(db, "users", user.uid), {
      //   email: userData.email,
      //   role: userData.role,
      //   createdAt: serverTimestamp(),
      // });

      toast({ title: "Usuario Creado (Auth)", description: `El usuario ${userData.email} con rol ${userData.role} ha sido creado en Firebase Auth. Perfil Firestore desactivado.` });
      setIsAddUserModalOpen(false);
    } catch (error: any) {
      console.error("Error creating user:", error.code, error.message);
      let errorMessage = "No se pudo crear el usuario.";
      let showErrorToast = true;

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Este correo electrónico ya está en uso.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "La contraseña es demasiado débil.";
      } else {
        // For other Firebase errors, only log to console
        console.error("An unexpected Firebase error occurred during user creation:", error.message);
        showErrorToast = false; // Do not show UI toast for other Firebase errors
      }
      
      if (showErrorToast) {
        toast({ title: "Error al Crear Usuario", description: errorMessage, variant: "destructive" });
      }
    }
  };

  const handleViewSavedExam = (exam: ExamInfo) => {
    setViewingExamDetail(exam);
    setIsViewExamDetailModalOpen(true);
  };
  
  const handleEditSavedExam = (examToEdit: ExamInfo) => {
    if (!examToEdit.id && !examToEdit.ne) { // Check for ne as fallback if id is missing in mock
        toast({ title: "Error", description: "ID o NE de examen no encontrado.", variant: "destructive" });
        return;
    }
    setExamInfo({ 
      ...examToEdit, 
      // Ensure dates are Date objects if they come from mock data or converted Firestore Timestamps
      createdAt: examToEdit.createdAt instanceof Timestamp ? examToEdit.createdAt.toDate() : new Date(examToEdit.createdAt as any),
      lastModifiedAt: examToEdit.lastModifiedAt instanceof Timestamp ? examToEdit.lastModifiedAt.toDate() : new Date(examToEdit.lastModifiedAt as any),
      createdBy: examToEdit.createdBy || examToEdit.manager, 
    }); 
    setProducts(examToEdit.products || []); 
    setEditingExamId(examToEdit.id || examToEdit.ne); 
    setCurrentView('productList'); 
    toast({ title: "Editando Examen", description: `Modificando examen NE: ${examToEdit.ne}` });
  };

  const handleBackNavigation = () => {
    if (userRole === 'admin' && editingExamId) {
      setCurrentView('adminDashboard');
      setExamInfo(null); 
      setProducts([]);
      setEditingExamId(null); 
    } else {
      setCurrentView('examForm');
    }
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
          {auth.currentUser && <span className="text-xs"> ({auth.currentUser.email})</span>}
        </div>
      )}
      <main className="flex-grow">
        {currentView === 'adminDashboard' && userRole === 'admin' && (
          <AdminDashboard
            savedExams={savedExams}
            onAddNewUser={handleOpenAddUserModal}
            onViewExam={handleViewSavedExam}
            onEditExam={handleEditSavedExam} 
            isLoading={isLoadingExams}
          />
        )}
        {(currentView === 'examForm' && (userRole !== 'admin' || (userRole === 'admin' && editingExamId))) && (
          <ExamForm 
            onSubmitExamInfo={handleExamInfoSubmit} 
            initialData={examInfo || undefined} 
          />
        )}
        {(currentView === 'productList' && examInfo && (userRole !== 'admin' || (userRole === 'admin' && editingExamId))) && (
          <ProductListScreen
            examInfo={examInfo}
            products={products}
            onAddNewProduct={handleOpenAddProductModal}
            onEditProduct={handleOpenEditProductModal}
            onViewProduct={handleViewProduct}
            onDeleteProduct={handleDeleteProduct}
            onFinalize={handleFinalize}
            onBackToExamForm={handleBackNavigation}
            userRole={userRole} 
            editingExamId={editingExamId}
          />
        )}
      </main>

      <Dialog open={isAddEditModalOpen} onOpenChange={(isOpen) => {
          if (!isOpen) setEditingProduct(undefined);
          setIsAddEditModalOpen(isOpen);
        }}>
        <DialogContent className="sm:max-w-3xl p-0">
          <DialogHeader className="p-5 md:p-6 pb-0">
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

      {viewingProduct && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-2xl p-0">
             <DialogHeader className="p-5 md:p-6 pb-0">
                <DialogTitle className="text-lg md:text-xl font-semibold text-foreground">Detalles del Producto</DialogTitle>
            </DialogHeader>
            <div className="p-5 md:p-6 pt-0">
              <ProductDetailModalContent product={viewingProduct} onClose={() => setIsDetailModalOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {examInfo && (
        <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
          <DialogContent className="sm:max-w-4xl p-0">
            <DialogHeader className="p-5 md:p-6 pb-0">
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

      {userRole === 'admin' && (
        <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
          <DialogContent className="sm:max-w-lg p-0">
            <DialogHeader className="p-5 md:p-6 pb-0">
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

      {viewingExamDetail && userRole === 'admin' && (
        <Dialog open={isViewExamDetailModalOpen} onOpenChange={setIsViewExamDetailModalOpen}>
          <DialogContent className="sm:max-w-3xl p-0">
            <DialogHeader className="p-5 md:p-6 pb-0">
              <DialogTitle className="text-lg md:text-xl font-semibold text-foreground">
                Detalles del Examen Guardado
              </DialogTitle>
               <DialogDescription>
                NE: {viewingExamDetail.ne}
              </DialogDescription>
            </DialogHeader>
            <div className="p-5 md:p-6 pt-0 max-h-[70vh] overflow-y-auto">
              <div className="space-y-3">
                <h4 className="font-medium text-md">Información General</h4>
                <div className="grid grid-cols-2 gap-2 text-sm border p-3 rounded-md bg-muted/50">
                  <p><strong>Referencia:</strong> {viewingExamDetail.reference || 'N/A'}</p>
                  <p><strong>Gestor:</strong> {viewingExamDetail.manager || 'N/A'}</p>
                  <p><strong>Ubicación:</strong> {viewingExamDetail.location || 'N/A'}</p>
                  <p><strong>Creado por:</strong> {viewingExamDetail.createdBy || 'N/A'}</p>
                  <p><strong>Fecha Creación:</strong> {viewingExamDetail.createdAt ? (viewingExamDetail.createdAt instanceof Date ? viewingExamDetail.createdAt.toLocaleString() : String(viewingExamDetail.createdAt)) : 'N/A'}</p>
                  <p><strong>Modificado por:</strong> {viewingExamDetail.lastModifiedBy || 'N/A'}</p>
                  <p><strong>Última Modificación:</strong> {viewingExamDetail.lastModifiedAt ? (viewingExamDetail.lastModifiedAt instanceof Date ? viewingExamDetail.lastModifiedAt.toLocaleString() : String(viewingExamDetail.lastModifiedAt)) : 'N/A'}</p>
                </div>

                <h4 className="font-medium text-md pt-2">Productos ({viewingExamDetail.products?.length || 0})</h4>
                {viewingExamDetail.products && viewingExamDetail.products.length > 0 ? (
                  <ul className="space-y-3">
                    {viewingExamDetail.products.map((product, index) => (
                      <li key={product.id || index} className="border p-3 rounded-md text-sm">
                        <p className="font-semibold">Producto Item: {product.itemNumber || 'N/A'}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                          <p><strong>Descripción:</strong> {product.description || 'N/A'}</p>
                          <p><strong>Marca:</strong> {product.brand || 'N/A'}</p>
                          <p><strong>Modelo:</strong> {product.model || 'N/A'}</p>
                          <p><strong>Serie:</strong> {product.serial || 'N/A'}</p>
                          <p><strong>Origen:</strong> {product.origin || 'N/A'}</p>
                          <p><strong>Peso:</strong> {product.weight || 'N/A'}</p>
                          <p><strong>Cant. Bultos:</strong> {product.quantityPackages ?? 'N/A'}</p>
                          <p><strong>Cant. Unidades:</strong> {product.quantityUnits ?? 'N/A'}</p>
                          <p><strong>Num. Bultos:</strong> {product.numberPackages || 'N/A'}</p>
                          <p><strong>Condición Embalaje:</strong> {product.packagingCondition || 'N/A'}</p>
                          <p><strong>Unidad Medida:</strong> {product.unitMeasure || 'N/A'}</p>
                          <p><strong>Código HS:</strong> {product.hsCode || 'N/A'}</p>
                           <div className="col-span-2"><strong>Observación:</strong> {product.observation || 'N/A'}</div>
                          <div className="col-span-2">
                            <strong>Estado: </strong>
                            {product.isConform && <span className="mr-1 px-1.5 py-0.5 text-xs rounded bg-green-200 text-green-800">Conforme</span>}
                            {product.isExcess && <span className="mr-1 px-1.5 py-0.5 text-xs rounded bg-red-200 text-red-800">Excedente</span>}
                            {product.isMissing && <span className="mr-1 px-1.5 py-0.5 text-xs rounded bg-yellow-200 text-yellow-800">Faltante</span>}
                            {product.isFault && <span className="mr-1 px-1.5 py-0.5 text-xs rounded bg-gray-200 text-gray-800">Avería</span>}
                            {!(product.isConform || product.isExcess || product.isMissing || product.isFault) && 'N/A'}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay productos en este examen.</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
