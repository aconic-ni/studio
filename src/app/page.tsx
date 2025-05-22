
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { generateTxtReport, downloadFile, generateExcelReport } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, setDoc, Timestamp, getDoc } from 'firebase/firestore';


type AppView = 'login' | 'examForm' | 'productList' | 'adminDashboard';

const mockSavedExams: ExamInfo[] = [
  // Example:
  // {
  //   id: 'mock1',
  //   ne: 'NXTEST1',
  //   reference: 'MOCKREF1',
  //   manager: 'Gestor Mock',
  //   location: 'Almacén Mock',
  //   products: [
  //     { id: 'prodmock1', itemNumber: '001', description: 'Mock Product 1', quantityUnits: 10 }
  //   ],
  //   createdBy: 'Gestor Mock',
  //   createdAt: new Date(),
  //   lastModifiedBy: 'Gestor Mock',
  //   lastModifiedAt: new Date()
  // },
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
  const [isAuthLoading, setIsAuthLoading] = useState(true); // New state for initial auth check


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
      console.log("[fetchExamsForAdmin] Fetching exams from Firestore...");
      try {
        const examsCollectionRef = collection(db, "exams");
        const q = query(examsCollectionRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedExams: ExamInfo[] = querySnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
          products: docSnap.data().products || [],
          createdAt: docSnap.data().createdAt instanceof Timestamp ? docSnap.data().createdAt.toDate() : new Date(docSnap.data().createdAt || Date.now()),
          lastModifiedAt: docSnap.data().lastModifiedAt instanceof Timestamp ? docSnap.data().lastModifiedAt.toDate() : new Date(docSnap.data().lastModifiedAt || Date.now()),
        })) as ExamInfo[];
        console.log("[fetchExamsForAdmin] Exams fetched:", fetchedExams.length);
        setSavedExams(fetchedExams);
      } catch (error) {
        console.error("[fetchExamsForAdmin] Error fetching exams: ", error);
        // toast({ title: "Error", description: "No se pudieron cargar los exámenes desde la base de datos.", variant: "destructive" });
      } finally {
        setIsLoadingExams(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]); 

  useEffect(() => {
    setIsAuthLoading(true); // Start with auth loading true
    console.log("[Auth State] Setting up onAuthStateChanged listener.");
    const unsubscribe = auth.onAuthStateChanged(async firebaseUser => {
      if (firebaseUser) {
        console.log("[Auth State] User is signed in via onAuthStateChanged. UID:", firebaseUser.uid, "Email:", firebaseUser.email);
        try {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            console.log("[Auth State] onAuthStateChanged: Attempting to get Firestore doc:", `/users/${firebaseUser.uid}`);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              const role = userData.role as UserRole;
              console.log(`[Auth State] onAuthStateChanged: Document for UID ${firebaseUser.uid} exists. UserData:`, userData, "Role from Firestore:", role);
              if (!role) {
                 console.warn(`[Auth State] onAuthStateChanged: UID: ${firebaseUser.uid}, Email: ${firebaseUser.email}, Role field missing or empty in Firestore. Defaulting to 'gestor'. UserData:`, userData);
                 handleLoginSuccess('gestor');
              } else {
                handleLoginSuccess(role);
              }
            } else {
              console.warn(`[Auth State] onAuthStateChanged: Firestore document /users/${firebaseUser.uid} NOT FOUND for authenticated user ${firebaseUser.email}. Defaulting to 'gestor' role.`);
              handleLoginSuccess('gestor');
            }
        } catch (error: any) {
            console.error("[Auth State] onAuthStateChanged: Error fetching role from Firestore for UID:", firebaseUser.uid, "Error:", error.message, error);
            // toast({ title: "Error de Autenticación", description: "No se pudo verificar el rol del usuario.", variant: "destructive"});
            console.warn("[Auth State] onAuthStateChanged: Error fetching role, defaulting to 'gestor'.");
            handleLoginSuccess('gestor'); // Default to gestor if role fetch fails
        }
      } else {
        console.log("[Auth State] onAuthStateChanged: No user signed in.");
        handleLogout(false); // false to not show toast on initial load if not logged in
      }
      setIsAuthLoading(false); // Auth check finished
    });
    return () => {
      console.log("[Auth State] Cleaning up onAuthStateChanged listener.");
      unsubscribe();
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


  useEffect(() => {
    if (isLoggedIn && currentView === 'adminDashboard' && userRole === 'admin') {
      fetchExamsForAdmin();
    }
  }, [isLoggedIn, currentView, userRole, fetchExamsForAdmin, refreshExamsTrigger]);


  const handleLoginSuccess = (role: UserRole) => {
    console.log("[Login Success Handler] Role received:", role);
    setIsLoggedIn(true);
    setUserRole(role);
    // toast({ title: "Acceso Concedido", description: `Bienvenido. Rol: ${role?.toUpperCase()}` });
    if (role === 'admin') {
      setCurrentView('adminDashboard');
    } else {
      setCurrentView('examForm');
    }
    setIsAuthLoading(false); // Ensure auth loading is false after successful login
  };

  const handleLogout = (showToast = true) => {
    signOut(auth).then(() => {
      setIsLoggedIn(false);
      setUserRole(null);
      setExamInfo(null);
      setProducts([]);
      // setSavedExams(mockSavedExams); // Keep fetched exams if admin logged out? or clear? For now, let's clear.
      setEditingExamId(null);
      setCurrentView('login');
      if (showToast) {
        toast({ title: "Sesión Cerrada", description: "Has salido de la aplicación." });
      }
      console.log("[Logout] User signed out successfully.");
    }).catch((error) => {
      console.error("[Logout Error] Firebase sign out failed:", error.code, error.message);
      // For other Firebase errors (network, service unavailable), only log to console.
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

    try {
      const managerName = examInfo.manager;
      const currentUserEmail = auth.currentUser?.email || "System"; 

      if (editingExamId) {
        const examDocRef = doc(db, "exams", editingExamId);
        const updateData: Partial<ExamInfo> = {
          ...examInfo,
          products: products,
          lastModifiedAt: serverTimestamp(),
          lastModifiedBy: userRole === 'admin' ? (auth.currentUser?.email || "TEST ADMIN USER") : managerName,
        };

        delete updateData.id; // Don't try to write the id field itself
        
        // Preserve original creator and creation time explicitly if they exist on examInfo
        if (examInfo.createdBy) updateData.createdBy = examInfo.createdBy;
        if (examInfo.createdAt) updateData.createdAt = examInfo.createdAt instanceof Date ? Timestamp.fromDate(examInfo.createdAt) : examInfo.createdAt;


        await setDoc(examDocRef, updateData, { merge: true });
        toast({ title: "Examen Actualizado", description: "El examen ha sido actualizado en la base de datos." });
      } else {
        const newExamData: Omit<ExamInfo, 'id'> = {
          ...examInfo,
          products: products,
          createdBy: managerName,
          createdAt: serverTimestamp(),
          lastModifiedBy: managerName, 
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
      console.error("[Save Exam Error] Error saving exam data: ", error);
      // toast({ title: "Error al Guardar", description: "No se pudo guardar el examen en la base de datos.", variant: "destructive" });
    }
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

  const handleDownloadExcelForSavedExam = () => {
    if (!viewingExamDetail) return;
    generateExcelReport(viewingExamDetail, viewingExamDetail.products || []);
  };


  const handleOpenAddUserModal = () => setIsAddUserModalOpen(true);
  const handleCloseAddUserModal = () => setIsAddUserModalOpen(false);

  const handleCreateUser = async (userData: CreateUserFormData) => {
    console.log("[Create User Attempt] Data:", userData);
    if (!db) {
        console.error("Firestore db instance is not available for createUser");
        toast({ title: "Error de Configuración", description: "La base de datos no está disponible.", variant: "destructive" });
        return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const user = userCredential.user;
      console.log("[Create User] Firebase Auth user created. UID:", user.uid);

      await setDoc(doc(db, "users", user.uid), {
        email: userData.email,
        role: userData.role,
        createdAt: serverTimestamp(),
      });
      console.log("[Create User] Firestore user document created for UID:", user.uid, "Role:", userData.role);

      toast({ title: "Usuario Creado", description: `El usuario ${userData.email} con rol ${userData.role} ha sido creado.` });
      setIsAddUserModalOpen(false);
    } catch (error: any) {
      console.error("[Create User Error] Firebase user creation failed:", error.code, error.message, error);
      let errorMessage = "No se pudo crear el usuario.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Este correo electrónico ya está en uso.";
        toast({ title: "Error al Crear Usuario", description: errorMessage, variant: "destructive" });
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "La contraseña es demasiado débil.";
        toast({ title: "Error al Crear Usuario", description: errorMessage, variant: "destructive" });
      } else {
        console.error("Firebase user creation failed with a non-specific error:", error);
      }
    }
  };

  const handleViewSavedExam = (exam: ExamInfo) => {
    setViewingExamDetail(exam);
    setIsViewExamDetailModalOpen(true);
  };

  const handleEditSavedExam = (examToEdit: ExamInfo) => {
    if (!examToEdit.id && !examToEdit.ne) {
        toast({ title: "Error", description: "ID o NE de examen no encontrado.", variant: "destructive" });
        return;
    }
    
    const createdAtDate = examToEdit.createdAt instanceof Date ? examToEdit.createdAt :
                         (examToEdit.createdAt as any)?.toDate ? (examToEdit.createdAt as any).toDate() : new Date((examToEdit.createdAt as any) || Date.now());
    const lastModifiedAtDate = examToEdit.lastModifiedAt instanceof Date ? examToEdit.lastModifiedAt :
                               (examToEdit.lastModifiedAt as any)?.toDate ? (examToEdit.lastModifiedAt as any).toDate() : new Date((examToEdit.lastModifiedAt as any) || Date.now());

    const examDataForEditing: ExamInfo = {
        ...examToEdit,
        id: examToEdit.id, // Ensure ID is present
        ne: examToEdit.ne,
        reference: examToEdit.reference || '',
        manager: examToEdit.manager || '',
        location: examToEdit.location || '',
        products: examToEdit.products || [],
        createdAt: createdAtDate,
        createdBy: examToEdit.createdBy || examToEdit.manager, 
        lastModifiedAt: lastModifiedAtDate,
        lastModifiedBy: examToEdit.lastModifiedBy || examToEdit.manager,
    };

    console.log("[Edit Saved Exam] Loading exam for editing:", examDataForEditing);
    setExamInfo(examDataForEditing);
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
      console.log("[Back Navigation] Admin returning to dashboard from edit.");
    } else {
      setCurrentView('examForm');
       console.log("[Back Navigation] Returning to ExamForm.");
    }
  };

  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }


  if (!isLoggedIn || currentView === 'login') {
    return <AuthWorkflow onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl min-h-screen flex flex-col">
      <AppHeader isLoggedIn={isLoggedIn} onLogout={() => handleLogout(true)} />
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
            <DialogFooter className="p-5 md:p-6 pt-3 border-t">
              <Button variant="outline" onClick={handleDownloadExcelForSavedExam}>
                <Download className="mr-2 h-4 w-4" />
                Descargar Excel
              </Button>
              <Button variant="outline" onClick={() => setIsViewExamDetailModalOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

    