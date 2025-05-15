
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { FirebaseApp } from 'firebase/app'; // Only for type, not used directly here
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
// Assume db is exported from a firebase config file
// IMPORTANT: You need to create/configure src/lib/firebase.ts and export 'db'
// For example:
// import { initializeApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore';
// const firebaseConfig = { /* your config */ };
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);
// export { db };
import { db } from '@/lib/firebase'; // Use alias for consistency

import type { ExamInfo, Product, UserRole, SavedExam, ProductStatus } from '@/types';
import type { ProductFormData } from '@/components/customs-ex-p/AddProductForm';
import { USER_ROLES, PRODUCT_STATUS } from '@/types';
import { Header } from '@/components/Header';
import { InitialExamForm } from '@/components/customs-ex-p/InitialExamForm';
import { ProductsTable } from '@/components/customs-ex-p/ProductsTable';
import { PreviewModal } from '@/components/customs-ex-p/PreviewModal';
import { PasswordModal } from '@/components/customs-ex-p/PasswordModal';
import { AddProductModal } from '@/components/customs-ex-p/AddProductModal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateTxtReport, generateExcelReport } from '@/lib/reportUtils';
import { Eye, PackagePlus, List, Edit3, Trash2, LogOut, ArrowLeftToLine, Save, FileText, FileSpreadsheet, AlertTriangle, KeyRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const PASSWORDS: Record<string, UserRole> = {
  "inspector123": USER_ROLES.INSPECTOR,
  "viewer123": USER_ROLES.VIEWER,
  "admin123": USER_ROLES.ADMIN,
};

const initialExamData: ExamInfo = {
  examId: '',
  date: new Date().toISOString().split('T')[0],
  inspectorName: '',
  location: '',
};

const initialProductFormData: Omit<Product, 'id'> = {
  itemNumber: '',
  packageNumbers: '',
  packageQuantity: 0,
  unitQuantity: 1,
  description: '',
  brand: '',
  model: '',
  origin: '',
  merchandiseState: '',
  weightValue: 0,
  weightUnit: 'kg',
  measurementUnit: 'unidades',
  serialNumber: '',
  observation: '',
  status: PRODUCT_STATUS.CONFORME,
};


export default function CustomsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Retained for conceptual auth state, though primary control is currentView
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentView, setCurrentView] = useState<'welcome' | 'login' | 'form' | 'database'>('welcome');
  
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(initialExamData);
  const [products, setProducts] = useState<Product[]>([]);
  const [savedExams, setSavedExams] = useState<SavedExam[]>([]);
  const [editingExamId, setEditingExamId] = useState<string | null>(null); 
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [dbError, setDbError] = useState<string | null>(null);
  const { toast } = useToast();

  // Firestore listener for exams
  useEffect(() => {
    if (!db || !(userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.VIEWER)) {
      if (userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.VIEWER) {
         // Only set DB error if db itself is null but we expect to use it.
         if (!db) setDbError("Error de conexión con la base de datos. Verifique la configuración de Firebase en src/lib/firebase.ts.");
      }
      return;
    }
    setDbError(null); // Clear error if db is available and role is correct
    const examsCollectionRef = collection(db, "exams");
    const q = query(examsCollectionRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const examsFromDb: SavedExam[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        examsFromDb.push({
          id: doc.id,
          examInfo: data.examInfo,
          products: data.products,
          timestamp: (data.timestamp as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        });
      });
      setSavedExams(examsFromDb);
    }, (error) => {
      console.error("Error fetching exams from Firestore:", error);
      toast({ title: "Error de Base de Datos", description: "No se pudieron cargar los exámenes guardados. Verifique la consola para más detalles.", variant: "destructive" });
      setDbError("Error al cargar datos. Verifique la configuración de Firebase y su conexión. Intente recargar la página.");
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, [userRole, toast]);


  const handlePasswordSubmit = (password: string) => {
    const role = PASSWORDS[password];
    if (role) {
      setIsAuthenticated(true);
      setUserRole(role);
      setPasswordError('');
      toast({ title: "Acceso Concedido", description: `Bienvenido como ${role}.` });
      if (role === USER_ROLES.VIEWER || role === USER_ROLES.ADMIN) {
        setCurrentView('database');
      } else {
        setCurrentView('form');
        setExamInfo({...initialExamData, examId: `EXM-${Date.now().toString().slice(-6)}`}); 
        setProducts([]);
      }
    } else {
      setPasswordError("Clave incorrecta. Intente de nuevo.");
      // Keep currentView as 'login' so modal stays open
    }
  };
  
  const resetForm = useCallback(() => {
    setExamInfo({...initialExamData, examId: userRole === USER_ROLES.INSPECTOR ? `EXM-${Date.now().toString().slice(-6)}` : '' });
    setProducts([]);
    setEditingExamId(null);
    setProductToEdit(null);
  }, [userRole]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentView('welcome'); // Go back to welcome screen
    resetForm();
    setDbError(null); // Clear DB error on logout
    toast({ title: "Sesión Cerrada"});
  };
  
  const handleExamInfoSubmit = (data: ExamInfo) => {
    setExamInfo(data);
  };

  const handleOpenAddProductModal = () => {
    setProductToEdit(null); 
    setShowAddProductModal(true);
  };

  const handleOpenEditProductModal = (product: Product) => {
    setProductToEdit(product);
    setShowAddProductModal(true);
  };
  
  const handleSaveProduct = (productData: ProductFormData, editingProductId: string | null) => {
    if (editingProductId) { 
        const updatedProduct: Product = { ...initialProductFormData, ...productData, id: editingProductId };
        setProducts(prevProducts => prevProducts.map(p => p.id === editingProductId ? updatedProduct : p));
        toast({ title: "Producto Actualizado", description: `${updatedProduct.description} ha sido actualizado.` });
    } else { 
        const newProduct: Product = {
            ...initialProductFormData,
            ...productData,
            id: crypto.randomUUID(),
        };
        setProducts(prevProducts => [...prevProducts, newProduct]);
        toast({ title: "Producto Agregado", description: `${newProduct.description} ha sido agregado.` });
    }
    setShowAddProductModal(false); 
    setProductToEdit(null); 
  };

  const handleRemoveProduct = (productId: string) => {
    setProducts((prevProducts) => prevProducts.filter(p => p.id !== productId));
    toast({ title: "Producto Eliminado", variant: "destructive" });
  };

  const handlePreview = () => {
    if (!examInfo || !examInfo.examId) {
       toast({ title: "Falta Información del Examen", description: "Complete el formulario de Información del Examen.", variant: "destructive" });
      return;
    }
    if (products.length === 0 && userRole === USER_ROLES.INSPECTOR && !editingExamId) { 
        toast({ title: "Sin Productos", description: "Agregue al menos un producto para guardar el examen.", variant: "destructive" });
        return;
    }
    setIsPreviewModalOpen(true);
  };

  const handleSaveOrUpdateExamAndGenerateReports = async (generateReports = true) => {
    if (!db) {
        toast({ title: "Error de Configuración", description: "La conexión a la base de datos (Firebase) no está configurada. Revise src/lib/firebase.ts", variant: "destructive" });
        setDbError("Firebase no configurado. Siga las instrucciones en src/lib/firebase.ts.");
        return;
    }
    if (!examInfo) {
        toast({ title: "Error", description: "Información del examen no disponible.", variant: "destructive" });
        return;
    }

    const productsWithIds = products.map(p => p.id ? p : {...p, id: crypto.randomUUID()});
    
    const examDataToSave = {
      examInfo,
      products: productsWithIds,
      timestamp: serverTimestamp(), // Use Firestore server timestamp
    };

    try {
      if (editingExamId) { // Update existing exam
        const examDocRef = doc(db, "exams", editingExamId);
        await updateDoc(examDocRef, examDataToSave);
        toast({ title: "Examen Actualizado", description: "El examen ha sido actualizado en la base de datos." });
      } else { // Save new exam
        const docRef = await addDoc(collection(db, "exams"), examDataToSave);
        toast({ title: "Examen Guardado", description: `El examen ha sido guardado en la base de datos (ID: ${docRef.id}).` });
      }

      if (generateReports) {
        try {
          generateTxtReport(examInfo, productsWithIds);
          toast({ title: "Reporte TXT Generado" });
        } catch (error) {
          console.error("Error generando reporte TXT:", error);
          toast({ title: "Error en Reporte TXT", variant: "destructive" });
        }

        try {
          generateExcelReport(examInfo, productsWithIds);
          toast({ title: "Reporte Excel Generado" });
        } catch (error) {
          console.error("Error generando reporte Excel:", error);
          toast({ title: "Error en Reporte Excel", variant: "destructive" });
        }
      }
    } catch (error) {
      console.error("Error saving/updating exam to Firestore:", error);
      toast({ title: "Error de Base de Datos", description: "No se pudo guardar/actualizar el examen. Verifique la consola.", variant: "destructive" });
      setDbError("Error al guardar en la base de datos. Verifique la conexión e inténtelo de nuevo.");
      return; // Stop further execution if save failed
    }
    
    setIsPreviewModalOpen(false); 
    
    if (userRole === USER_ROLES.INSPECTOR) {
      resetForm(); 
    } else if (userRole === USER_ROLES.ADMIN && editingExamId) {
      setCurrentView('database'); 
      resetForm();
    } else if (userRole === USER_ROLES.ADMIN && !editingExamId) { 
        resetForm(); 
        setCurrentView('form'); 
    }
  };

  const handleDirectDownloadTXT = () => {
    if (!examInfo || !examInfo.examId) {
      toast({ title: "Falta Información", description: "Complete la información del examen.", variant: "destructive" });
      return;
    }
     if (products.length === 0 && !editingExamId && userRole !== USER_ROLES.ADMIN) { // Admin can download empty if editing
        toast({ title: "Sin Productos", description: "Agregue al menos un producto.", variant: "destructive" });
        return;
    }
    try {
      generateTxtReport(examInfo, products);
      toast({ title: "Reporte TXT Descargado" });
    } catch (error) {
      console.error("Error generando reporte TXT:", error);
      toast({ title: "Error en Reporte TXT", variant: "destructive" });
    }
  };

  const handleDirectDownloadExcel = () => {
     if (!examInfo || !examInfo.examId) {
      toast({ title: "Falta Información", description: "Complete la información del examen.", variant: "destructive" });
      return;
    }
    if (products.length === 0 && !editingExamId && userRole !== USER_ROLES.ADMIN) { // Admin can download empty if editing
        toast({ title: "Sin Productos", description: "Agregue al menos un producto.", variant: "destructive" });
        return;
    }
    try {
      generateExcelReport(examInfo, products);
      toast({ title: "Reporte Excel Descargado" });
    } catch (error) {
      console.error("Error generando reporte Excel:", error);
      toast({ title: "Error en Reporte Excel", variant: "destructive" });
    }
  };

  const handleEditExam = (examIdToEdit: string) => {
    const examToEdit = savedExams.find(ex => ex.id === examIdToEdit);
    if (examToEdit) {
      setExamInfo(examToEdit.examInfo);
      // Ensure all product fields have defaults if not present in DB data
      const productsWithDefaults = examToEdit.products.map(p => ({ ...initialProductFormData, ...p }));
      setProducts(productsWithDefaults);
      setEditingExamId(examIdToEdit); 
      setCurrentView('form');
    } else {
      toast({ title: "Error", description: "No se encontró el examen para editar.", variant: "destructive" });
    }
  };

  const handleDeleteExam = async (examIdToDelete: string) => {
    if (!db) {
      toast({ title: "Error de Configuración", description: "La conexión a la base de datos (Firebase) no está configurada.", variant: "destructive" });
      setDbError("Firebase no configurado.");
      return;
    }
    try {
      await deleteDoc(doc(db, "exams", examIdToDelete));
      toast({ title: "Examen Eliminado", description: "El examen ha sido eliminado de la base de datos.", variant: "destructive"});
    } catch (error) {
      console.error("Error deleting exam from Firestore:", error);
      toast({ title: "Error de Base de Datos", description: "No se pudo eliminar el examen.", variant: "destructive" });
      setDbError("Error al eliminar de la base de datos.");
    }
  };
  
  const handleCancelEdit = () => {
    resetForm();
    setCurrentView('database');
  };

  useEffect(() => {
    if (currentView === 'form' && !editingExamId && (userRole === USER_ROLES.INSPECTOR || userRole === USER_ROLES.ADMIN)) {
        if (!examInfo?.examId || examInfo.examId === initialExamData.examId) { 
             setExamInfo(prev => ({...initialExamData, ...prev!, examId: `EXM-${Date.now().toString().slice(-6)}`}));
        }
    }
  }, [currentView, editingExamId, userRole, examInfo?.examId]);

  const commonDisabledCondition = !examInfo || !examInfo.examId || (products.length === 0 && !editingExamId && userRole !== USER_ROLES.ADMIN && userRole !== USER_ROLES.INSPECTOR);
  const firebaseConfigured = !!db;


  if (currentView === 'welcome') {
    return (
      <div className="min-h-screen flex flex-col bg-secondary/50 items-center justify-center p-4 text-center">
        <FileText 
          className="w-24 h-24 text-primary mb-6 cursor-pointer hover:text-primary/80 transition-colors" 
          onClick={() => setCurrentView('login')}
          aria-label="Iniciar sesión"
          role="button"
        />
        <h1 className="text-4xl font-bold text-primary mb-2">Customs Ex-p</h1>
        <p className="text-lg text-muted-foreground">Aplicación Progresiva para Exámenes Aduaneros</p>
        <p className="text-sm text-muted-foreground mt-4">Haga clic en el icono para ingresar.</p>
      </div>
    );
  }

  if (currentView === 'login') {
     return (
      <>
        <div className="min-h-screen flex flex-col bg-secondary/50 items-center justify-center p-4 text-center -z-10 opacity-50">
            <FileText 
              className="w-24 h-24 text-primary mb-6" 
              aria-hidden="true"
            />
            <h1 className="text-4xl font-bold text-primary mb-2">Customs Ex-p</h1>
            <p className="text-lg text-muted-foreground">Aplicación Progresiva para Exámenes Aduaneros</p>
        </div>
        <PasswordModal
            isOpen={true} 
            onSubmit={handlePasswordSubmit}
            error={passwordError}
            onClose={() => setCurrentView('welcome')} 
        />
      </>
    );
  }


  const headerActions = userRole === USER_ROLES.ADMIN && currentView === 'form' && editingExamId ? (
      <Button variant="outline" onClick={handleCancelEdit} size="sm">
          <ArrowLeftToLine className="mr-2 h-4 w-4" /> Volver a Base de Datos
      </Button>
  ) : userRole === USER_ROLES.ADMIN && currentView === 'database' ? (
    <Button onClick={() => { resetForm(); setCurrentView('form'); setEditingExamId(null); }}>
        <PackagePlus className="mr-2 h-5 w-5" /> Nuevo Examen
    </Button>
  ) : null;


  if (currentView === 'database' && (userRole === USER_ROLES.VIEWER || userRole === USER_ROLES.ADMIN)) {
    return (
      <div className="min-h-screen flex flex-col bg-secondary/50">
        <Header onLogout={handleLogout} actions={headerActions} />
        <main className="flex-grow container mx-auto p-4 md:p-6 space-y-8">
          {dbError && (
            <Card className="bg-destructive/10 border-destructive shadow-md">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5" />
                {firebaseConfigured ? "Error de Base de Datos" : "Error de Configuración de Firebase"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-destructive-foreground">{dbError}</p>
                {!firebaseConfigured && <p className="text-sm text-muted-foreground mt-2">Por favor, siga las instrucciones en `src/lib/firebase.ts` para configurar su proyecto Firebase.</p>}
              </CardContent>
            </Card>
          )}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center justify-between">
                <span className="flex items-center"><List className="inline mr-2 h-6 w-6" />Base de Datos de Exámenes</span>
              </CardTitle>
              <CardDescription>
                {savedExams.length > 0 ? `Mostrando ${savedExams.length} exámenes guardados.` : "No hay exámenes guardados."}
                {userRole === USER_ROLES.VIEWER && " (Modo Solo Lectura)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {savedExams.length === 0 && !dbError ? (
                <p className="text-muted-foreground text-center py-8">No hay exámenes para mostrar.</p>
              ) : savedExams.length === 0 && dbError ? (
                 <p className="text-destructive text-center py-8">No se pudieron cargar los exámenes debido a un error.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {savedExams.map(exam => ( 
                  <Card key={exam.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">ID: {exam.examInfo.examId}</CardTitle>
                      <CardDescription>
                        Fecha: {exam.examInfo.date} <br />
                        Inspector: {exam.examInfo.inspectorName} <br />
                        Lugar: {exam.examInfo.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm font-medium">Productos ({exam.products.length}):</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside max-h-24 overflow-y-auto pr-2">
                        {exam.products.slice(0,5).map(p => <li key={p.id} className="truncate">{p.description} (Item: {p.itemNumber})</li>)}
                        {exam.products.length > 5 && <li className="italic">... y {exam.products.length - 5} más.</li>}
                         {exam.products.length === 0 && <li className="italic">Sin productos.</li>}
                      </ul>
                    </CardContent>
                    <div className="p-4 border-t mt-auto flex flex-col gap-2">
                      <p className="text-xs text-muted-foreground">Guardado: {new Date(exam.timestamp).toLocaleString()}</p>
                      <div className="flex gap-2 items-center">
                        {(userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.VIEWER) && (
                           <Button variant="outline" size="sm" onClick={() => { setExamInfo(exam.examInfo); setProducts(exam.products.map(p => ({...initialProductFormData, ...p }))); setIsPreviewModalOpen(true); setEditingExamId(exam.id); /* Pass ID for context if needed by modal */ } }>
                              <Eye className="mr-1 h-4 w-4" /> Ver Detalles
                            </Button>
                         )}
                        {userRole === USER_ROLES.ADMIN && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleEditExam(exam.id)}>
                              <Edit3 className="mr-1 h-4 w-4" /> Editar
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteExam(exam.id)}>
                              <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        <footer className="text-center p-4 text-sm text-muted-foreground border-t">
          © {new Date().getFullYear()} Customs Ex-p. Todos los derechos reservados.
        </footer>
        {isPreviewModalOpen && examInfo && (currentView === 'database') && (
             <PreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => { setIsPreviewModalOpen(false); resetForm();}} 
                onConfirm={() => { setIsPreviewModalOpen(false); resetForm();}} // Confirm is just close for viewer
                examInfo={examInfo}
                products={products}
                isViewerMode={true} 
                isEditing={!!editingExamId} 
            />
        )}
      </div>
    );
  }
  
  if (currentView === 'form' && (userRole === USER_ROLES.INSPECTOR || userRole === USER_ROLES.ADMIN) && examInfo) {
    return (
      <div className="min-h-screen flex flex-col bg-secondary/50">
        <Header onLogout={handleLogout} actions={headerActions} />
        <main className="flex-grow container mx-auto p-4 md:p-6 space-y-8">
           {userRole === USER_ROLES.ADMIN && (
            <div className={`flex justify-between items-center p-3 mb-6 rounded-md ${editingExamId ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700' : 'bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700'}`}>
                <p className={`${editingExamId ? 'text-blue-700 dark:text-blue-200' : 'text-green-700 dark:text-green-200'} font-semibold`}>
                    {editingExamId ? `Modo Edición Administrador: Editando examen ID: ${examInfo?.examId || ''} (Firestore ID: ${editingExamId})` : 'Modo Administrador: Creando nuevo examen.'}
                </p>
            </div>
          )}
          {dbError && ( 
            <Card className="bg-destructive/10 border-destructive shadow-md">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5" />
                 {firebaseConfigured ? "Error de Base de Datos" : "Error de Configuración de Firebase"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-destructive-foreground">{dbError}</p>
                 {!firebaseConfigured && <p className="text-sm text-muted-foreground mt-2">Por favor, siga las instrucciones en `src/lib/firebase.ts` para configurar su proyecto Firebase.</p>}
              </CardContent>
            </Card>
          )}
          <section id="exam-info">
            <InitialExamForm 
              onExamInfoSubmit={handleExamInfoSubmit} 
              initialData={examInfo} 
            />
          </section>

          <section id="products" className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                  <CardTitle className="text-xl">Gestión de Productos</CardTitle>
              </CardHeader>
              <CardContent>
                  <Button onClick={handleOpenAddProductModal} size="lg" className="w-full sm:w-auto">
                      <PackagePlus className="mr-2 h-5 w-5" /> Agregar Nuevo Producto
                  </Button>
              </CardContent>
            </Card>
            <ProductsTable 
              products={products} 
              onRemoveProduct={handleRemoveProduct}
              onEditProduct={handleOpenEditProductModal} 
            />
          </section>
          
          <section id="actions" className="py-6">
            <Card className="shadow-lg">
              <CardContent className="p-6 flex flex-col sm:flex-row flex-wrap justify-end items-center gap-4">
                  <p className="text-sm text-muted-foreground mr-auto self-center">
                      Productos Totales: {products.length}
                  </p>
                  {userRole === USER_ROLES.ADMIN && editingExamId && (
                    <Button variant="outline" onClick={handleCancelEdit} size="lg" className="w-full sm:w-auto order-1 sm:order-none">
                      <ArrowLeftToLine className="mr-2 h-5 w-5" /> Cancelar Edición
                    </Button>
                  )}
                  <Button 
                    onClick={handleDirectDownloadTXT}
                    variant="outline" 
                    size="lg" 
                    disabled={commonDisabledCondition}
                    className="w-full sm:w-auto order-2 sm:order-none"
                  >
                    <FileText className="mr-2 h-5 w-5" /> Descargar TXT
                  </Button>
                   <Button 
                    onClick={handleDirectDownloadExcel}
                    variant="outline" 
                    size="lg" 
                    disabled={commonDisabledCondition}
                    className="w-full sm:w-auto order-3 sm:order-none"
                  >
                    <FileSpreadsheet className="mr-2 h-5 w-5" /> Descargar Excel
                  </Button>
                  <Button 
                    onClick={() => handleSaveOrUpdateExamAndGenerateReports(true)}
                    size="lg" 
                    disabled={commonDisabledCondition || !firebaseConfigured}
                    className="w-full sm:w-auto order-4 sm:order-none"
                  >
                    <Save className="mr-2 h-5 w-5" /> 
                    {editingExamId ? "Actualizar y Generar" : "Guardar y Generar"}
                  </Button>
                  <Button 
                    onClick={handlePreview} 
                    size="lg" 
                    disabled={commonDisabledCondition || !firebaseConfigured}
                    className="w-full sm:w-auto order-5 sm:order-none bg-blue-600 hover:bg-blue-700"
                  >
                    <Eye className="mr-2 h-5 w-5" />
                     Previsualizar y Finalizar
                  </Button>
              </CardContent>
            </Card>
          </section>

          {isPreviewModalOpen && examInfo && currentView === 'form' && (
            <PreviewModal
              isOpen={isPreviewModalOpen}
              onClose={() => setIsPreviewModalOpen(false)}
              onConfirm={() => handleSaveOrUpdateExamAndGenerateReports(true)} // Confirm from preview also saves
              examInfo={examInfo}
              products={products}
              isEditing={!!editingExamId}
            />
          )}
          
          <AddProductModal
            isOpen={showAddProductModal}
            onClose={() => { setShowAddProductModal(false); setProductToEdit(null); }}
            onSaveProduct={handleSaveProduct}
            productToEdit={productToEdit}
            initialProductData={initialProductFormData} 
          />
        </main>
        <footer className="text-center p-4 text-sm text-muted-foreground border-t">
          © {new Date().getFullYear()} Customs Ex-p. Todos los derechos reservados.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Error: Estado de la aplicación no válido o cargando...</p>
      <Button onClick={handleLogout} className="ml-4">Reintentar Login</Button>
    </div>
  );
}

    

    