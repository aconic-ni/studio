
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { FirebaseApp } from 'firebase/app';
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
import { db } from '@/lib/firebase'; 

import type { ExamInfo, Product, UserRole, SavedExam, ProductStatus, ManagedGestorAccount } from '@/types';
import type { ProductFormData } from '@/components/customs-ex-p/AddProductForm';
import { USER_ROLES, PRODUCT_STATUS } from '@/types';
import { Header } from '@/components/Header';
import { InitialExamForm } from '@/components/customs-ex-p/InitialExamForm';
import { ProductsTable } from '@/components/customs-ex-p/ProductsTable';
import { PreviewModal } from '@/components/customs-ex-p/PreviewModal';
import { PasswordModal, type LoginCredentials } from '@/components/customs-ex-p/PasswordModal';
import { AddProductModal } from '@/components/customs-ex-p/AddProductModal';
import { ManageGestoresModal } from '@/components/customs-ex-p/ManageGestoresModal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateTxtReport, generateExcelReport } from '@/lib/reportUtils';
import { Eye, PackagePlus, List, Edit3, Trash2, ArrowLeftToLine, Save, FileText, FileSpreadsheet, AlertTriangle, PackageSearch, LogIn, ChevronRight, ChevronLeft, Info, DatabaseZap, WifiOff, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Static passwords for Admin and Viewer
const STATIC_PASSWORDS: Record<string, UserRole> = {
  "viewer123": USER_ROLES.VIEWER,
  "admin123": USER_ROLES.ADMIN,
};

const ROLE_DISPLAY_NAMES: Record<Exclude<UserRole, null>, string> = {
  [USER_ROLES.INSPECTOR]: "Gestor Aduanero",
  [USER_ROLES.VIEWER]: "Visualizador",
  [USER_ROLES.ADMIN]: "Administrador",
};

const GESTOR_ACCOUNTS_STORAGE_KEY = 'customsAppGestorAccounts';

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
  unitQuantity: 0,
  description: '',
  brand: '',
  model: '',
  origin: '',
  merchandiseState: '',
  weightValue: 0,
  weightUnit: 'kg',
  measurementUnit: '',
  serialNumber: '',
  observation: '',
  status: PRODUCT_STATUS.CONFORME,
};


export default function CustomsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentView, setCurrentView] = useState<'welcome' | 'login' | 'form' | 'database'>('welcome');
  const [inspectorStep, setInspectorStep] = useState<'examInfo' | 'products'>('examInfo');
  
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
  
  const firebaseConfigured = db !== null; 

  // Gestor Aduanero Account Management
  const [managedGestorAccounts, setManagedGestorAccounts] = useState<ManagedGestorAccount[]>([]);
  const [showManageGestoresModal, setShowManageGestoresModal] = useState(false);

  useEffect(() => {
    // Load managed gestor accounts from localStorage
    const storedAccounts = localStorage.getItem(GESTOR_ACCOUNTS_STORAGE_KEY);
    if (storedAccounts) {
      try {
        setManagedGestorAccounts(JSON.parse(storedAccounts));
      } catch (e) {
        console.error("Error parsing gestor accounts from localStorage", e);
        localStorage.removeItem(GESTOR_ACCOUNTS_STORAGE_KEY); // Clear corrupted data
      }
    }
  }, []);

  const saveManagedGestorAccounts = (accounts: ManagedGestorAccount[]) => {
    setManagedGestorAccounts(accounts);
    localStorage.setItem(GESTOR_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  };


  useEffect(() => {
    if (!firebaseConfigured || !(userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.VIEWER)) {
      if (userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.VIEWER) {
         if (!firebaseConfigured) setDbError("Error de configuración: Firebase no está configurado. Por favor, revise src/lib/firebase.ts.");
      }
      return;
    }
    setDbError(null); 
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
      setDbError(null);
    }, (error) => {
      console.error("Error fetching exams from Firestore:", error);
      toast({ title: "Error de Base de Datos", description: "No se pudieron cargar los exámenes guardados. Verifique la consola para más detalles.", variant: "destructive" });
      setDbError("Error al cargar datos de Firestore. Verifique la configuración de Firebase, sus reglas de seguridad y su conexión a internet. Intente recargar la página.");
    });

    return () => unsubscribe(); 
  }, [userRole, toast, firebaseConfigured]);


  const handlePasswordSubmit = (credentials: LoginCredentials) => {
    const { username, password } = credentials;

    // Check static Admin/Viewer passwords first (password only needed)
    const staticRole = STATIC_PASSWORDS[password];
    if (staticRole) {
      setIsAuthenticated(true);
      setUserRole(staticRole);
      setPasswordError('');
      const roleName = ROLE_DISPLAY_NAMES[staticRole] || staticRole;
      toast({ title: "Acceso Concedido", description: `Bienvenido como ${roleName}.` });
      if (staticRole === USER_ROLES.VIEWER || staticRole === USER_ROLES.ADMIN) {
        setCurrentView('database');
      } else { // Should not happen with current static passwords but good for structure
        setCurrentView('form');
        resetForm();
      }
      return;
    }

    // Check managed Gestor Aduanero accounts (username and password needed)
    if (username) {
      const gestorAccount = managedGestorAccounts.find(
        acc => acc.username.toLowerCase() === username.toLowerCase() && acc.password === password
      );

      if (gestorAccount) {
        setIsAuthenticated(true);
        setUserRole(USER_ROLES.INSPECTOR);
        setPasswordError('');
        // Pre-fill inspectorName and reset form for a new exam
        setExamInfo(prev => ({
          ...initialExamData,
          ...(prev && prev.examId ? { examId: prev.examId } : {} ), // keep existing examId if any (e.g. from a previous state)
          examId: `EXM-${Date.now().toString().slice(-6)}`, // Always generate new ID for new session for gestor
          inspectorName: gestorAccount.gestorName, // Pre-fill name
          date: new Date().toISOString().split('T')[0],
          location: '', // Clear location for new exam
        }));
        setProducts([]); // Clear products for new exam
        setEditingExamId(null);
        setProductToEdit(null);
        setInspectorStep('examInfo'); // Start Gestor at exam info step

        toast({ title: "Acceso Concedido", description: `Bienvenido Gestor: ${gestorAccount.gestorName}.` });
        setCurrentView('form');
        return;
      }
    }
    setPasswordError("Usuario o clave incorrecta. Intente de nuevo.");
  };
  
  const resetForm = useCallback(() => {
    // If user is a logged-in gestor, keep their name, otherwise clear it.
    const currentGestorName = userRole === USER_ROLES.INSPECTOR && examInfo?.inspectorName ? examInfo.inspectorName : '';
    
    setExamInfo({
        ...initialExamData, 
        examId: `EXM-${Date.now().toString().slice(-6)}`,
        inspectorName: currentGestorName 
    });
    setProducts([]);
    setEditingExamId(null);
    setProductToEdit(null);
    setInspectorStep('examInfo'); 
  }, [userRole, examInfo?.inspectorName]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentView('welcome'); 
    resetForm(); // This will clear inspectorName if not a gestor
    setDbError(null); 
    setExamInfo(initialExamData); // Fully reset examInfo on logout
    toast({ title: "Sesión Cerrada"});
  };
  
  const handleExamInfoChange = (data: ExamInfo) => {
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
    if (!examInfo || !examInfo.examId || !examInfo.date || !examInfo.inspectorName || !examInfo.location) {
       toast({ title: "Falta Información del Examen", description: "Complete todos los campos del formulario de Información del Examen.", variant: "destructive" });
      return;
    }
    setIsPreviewModalOpen(true);
  };

  const handleSaveOrUpdateExamAndGenerateReports = async (generateReports = true) => {
    if (!firebaseConfigured) {
        toast({ title: "Error de Configuración", description: "La conexión a la base de datos (Firebase) no está configurada. Revise src/lib/firebase.ts", variant: "destructive" });
        setDbError("Firebase no configurado. Siga las instrucciones en src/lib/firebase.ts.");
        return;
    }
    if (!examInfo || !examInfo.examId || !examInfo.date || !examInfo.inspectorName || !examInfo.location) {
        toast({ title: "Error", description: "Información del examen incompleta.", variant: "destructive" });
        return;
    }
    const isNewExamByCreator = !editingExamId && (userRole === USER_ROLES.INSPECTOR || userRole === USER_ROLES.ADMIN);
    if (products.length === 0 && isNewExamByCreator) { 
        toast({ title: "Sin Productos", description: "Agregue al menos un producto para guardar el examen.", variant: "destructive" });
        return;
    }

    const productsWithIds = products.map(p => p.id ? p : {...p, id: crypto.randomUUID()});
    
    const examDataToSave = {
      examInfo,
      products: productsWithIds,
      timestamp: serverTimestamp(), 
    };

    try {
      if (editingExamId) { 
        const examDocRef = doc(db, "exams", editingExamId);
        await updateDoc(examDocRef, examDataToSave);
        toast({ title: "Examen Actualizado", description: "El examen ha sido actualizado en la base de datos." });
      } else { 
        const docRef = await addDoc(collection(db, "exams"), examDataToSave);
        toast({ title: "Examen Guardado", description: `El examen ha sido guardado en la base de datos (ID: ${docRef.id}).` });
      }
      setDbError(null);

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
      toast({ title: "Error de Base de Datos", description: "No se pudo guardar/actualizar el examen. Verifique la consola y su configuración de Firestore.", variant: "destructive" });
      setDbError("Error al guardar en Firestore. Verifique la configuración, reglas de seguridad y conexión.");
      return; 
    }
        
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
    if (!examInfo || !examInfo.examId || !examInfo.date || !examInfo.inspectorName || !examInfo.location) {
      toast({ title: "Falta Información", description: "Complete la información del examen.", variant: "destructive" });
      return;
    }
    const isNewExamByCreator = !editingExamId && (userRole === USER_ROLES.INSPECTOR || userRole === USER_ROLES.ADMIN);
    if (products.length === 0 && isNewExamByCreator) { 
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
     if (!examInfo || !examInfo.examId || !examInfo.date || !examInfo.inspectorName || !examInfo.location) {
      toast({ title: "Falta Información", description: "Complete la información del examen.", variant: "destructive" });
      return;
    }
    const isNewExamByCreator = !editingExamId && (userRole === USER_ROLES.INSPECTOR || userRole === USER_ROLES.ADMIN);
    if (products.length === 0 && isNewExamByCreator) {
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
      const productsWithDefaults = examToEdit.products.map(p => ({ ...initialProductFormData, ...p }));
      setProducts(productsWithDefaults);
      setEditingExamId(examIdToEdit); 
      setCurrentView('form');
      if (userRole === USER_ROLES.INSPECTOR) setInspectorStep('products'); 
      setDbError(null);
    } else {
      toast({ title: "Error", description: "No se encontró el examen para editar.", variant: "destructive" });
    }
  };

  const handleDeleteExam = async (examIdToDelete: string) => {
    if (!firebaseConfigured) {
      toast({ title: "Error de Configuración", description: "La conexión a la base de datos (Firebase) no está configurada.", variant: "destructive" });
      setDbError("Firebase no configurado.");
      return;
    }
    try {
      await deleteDoc(doc(db, "exams", examIdToDelete));
      toast({ title: "Examen Eliminado", description: "El examen ha sido eliminado de la base de datos.", variant: "destructive"});
      setDbError(null);
    } catch (error) {
      console.error("Error deleting exam from Firestore:", error);
      toast({ title: "Error de Base de Datos", description: "No se pudo eliminar el examen.", variant: "destructive" });
      setDbError("Error al eliminar de Firestore.");
    }
  };
  
  const handleAdminCancelEdit = () => {
    resetForm();
    setCurrentView('database');
  };

  useEffect(() => {
    if (currentView === 'form' && !editingExamId && (userRole === USER_ROLES.INSPECTOR || userRole === USER_ROLES.ADMIN)) {
        if (userRole === USER_ROLES.ADMIN && (!examInfo?.examId || examInfo.examId === initialExamData.examId)) {
             setExamInfo(prev => ({...initialExamData, ...prev!, examId: `EXM-${Date.now().toString().slice(-6)}`}));
        }
        // For gestor, examId and name are set on login.
    }
  }, [currentView, editingExamId, userRole, examInfo?.examId]);

  const isExamInfoComplete = !!(examInfo && examInfo.examId && examInfo.date && examInfo.inspectorName && examInfo.location);
  const isNewExamByCreator = !editingExamId && (userRole === USER_ROLES.INSPECTOR || (userRole === USER_ROLES.ADMIN && !editingExamId));
  const commonDisabledConditionForActions = !isExamInfoComplete || (products.length === 0 && isNewExamByCreator);
  
  const FooterContent = () => (
    <footer className="text-center p-4 text-sm border-t border-border/30 bg-transparent text-white">
      Stvaer © 2025 <em className="italic">for</em> ACONIC
    </footer>
  );

  const DatabaseErrorDisplay = () => {
    if (!firebaseConfigured) {
      return (
        <Card className="bg-destructive/10 border-destructive shadow-md mb-6">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <WifiOff className="mr-2 h-5 w-5" /> Error de Configuración de Firebase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">Firebase no está configurado. La funcionalidad de base de datos (guardar, cargar, editar, eliminar exámenes) está desactivada.</p>
            <p className="text-sm mt-2">Por favor, siga las instrucciones en <code className="bg-muted text-muted-foreground px-1 rounded-sm">src/lib/firebase.ts</code> para configurar su proyecto Firebase.</p>
          </CardContent>
        </Card>
      );
    }
    if (dbError) {
      return (
        <Card className="bg-destructive/10 border-destructive shadow-md mb-6">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" /> Error de Base de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{dbError}</p>
            <p className="text-sm mt-2">Verifique su conexión a internet y las reglas de seguridad de Firestore. Puede ser necesario recargar la página.</p>
          </CardContent>
        </Card>
      );
    }
    return null;
  };


  if (currentView === 'welcome') {
    return (
      <div className={`min-h-screen flex flex-col relative ${currentView === 'login' ? 'backdrop-blur-sm' : ''}`}>
        <main className="flex-grow flex flex-col items-center justify-center p-4 text-center">
            <div 
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => setCurrentView('login')}
                aria-label="Iniciar sesión"
                role="button"
            >
                <PackageSearch className="h-32 w-32 text-white transition-transform group-hover:scale-110" />
                <p className="mt-4 text-3xl font-semibold text-white">Customs Ex-p</p>
            </div>
        </main>
        <FooterContent />
      </div>
    );
  }

  if (currentView === 'login') {
     return (
      <>
        <div className="min-h-screen flex flex-col relative backdrop-blur-sm">
          <main className="flex-grow flex flex-col items-center justify-center p-4 text-center opacity-50">
            <div className="flex flex-col items-center">
                <PackageSearch className="h-32 w-32 text-white" aria-hidden="true" />
                <p className="mt-4 text-3xl font-semibold text-white">Customs Ex-p</p>
            </div>
          </main>
          <FooterContent />
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

  const headerActions = (
    <>
      {userRole === USER_ROLES.ADMIN && currentView === 'form' && editingExamId && (
        <Button variant="outline" onClick={handleAdminCancelEdit} size="sm">
            <ArrowLeftToLine className="mr-2 h-4 w-4" /> Volver a Base de Datos
        </Button>
      )}
      {userRole === USER_ROLES.ADMIN && currentView === 'database' && (
        <>
          <Button onClick={() => setShowManageGestoresModal(true)} variant="outline" size="sm">
            <Users className="mr-2 h-4 w-4" /> Gestionar Gestores
          </Button>
          <Button onClick={() => { resetForm(); setCurrentView('form'); setEditingExamId(null); setDbError(null); }}>
              <PackagePlus className="mr-2 h-5 w-5" /> Nuevo Examen
          </Button>
        </>
      )}
    </>
  );


  if (currentView === 'database' && (userRole === USER_ROLES.VIEWER || userRole === USER_ROLES.ADMIN)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onLogout={handleLogout} actions={headerActions} />
        <main className="flex-grow container mx-auto p-4 md:p-6 space-y-8">
          <DatabaseErrorDisplay />
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center justify-between">
                <span className="flex items-center"><DatabaseZap className="inline mr-2 h-6 w-6" />Base de Datos de Exámenes</span>
              </CardTitle>
              <CardDescription>
                {savedExams.length > 0 ? `Mostrando ${savedExams.length} exámenes guardados.` : "No hay exámenes guardados."}
                {userRole === USER_ROLES.VIEWER && " (Modo Solo Lectura)"}
                {!firebaseConfigured && " (Funcionalidad limitada sin conexión a base de datos)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {firebaseConfigured && savedExams.length === 0 && !dbError ? (
                <p className="text-center py-8">No hay exámenes para mostrar.</p>
              ) : savedExams.length === 0 && dbError ? (
                 <p className="text-destructive text-center py-8">No se pudieron cargar los exámenes debido a un error.</p>
              ) : !firebaseConfigured && savedExams.length === 0 ? (
                 <p className="text-center py-8">Configure Firebase para ver o guardar exámenes.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {savedExams.map(exam => ( 
                  <Card key={exam.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">ID: {exam.examInfo.examId}</CardTitle>
                      <CardDescription>
                        Fecha: {exam.examInfo.date} <br />
                        Gestor Aduanero: {exam.examInfo.inspectorName} <br />
                        Lugar: {exam.examInfo.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm font-medium">Productos ({exam.products.length}):</p>
                      <ul className="text-xs list-disc list-inside max-h-24 overflow-y-auto pr-2">
                        {exam.products.slice(0,5).map(p => <li key={p.id} className="truncate">{p.description} (Item: {p.itemNumber})</li>)}
                        {exam.products.length > 5 && <li className="italic">... y {exam.products.length - 5} más.</li>}
                         {exam.products.length === 0 && <li className="italic">Sin productos.</li>}
                      </ul>
                    </CardContent>
                    <div className="p-4 border-t mt-auto flex flex-col gap-2">
                      <p className="text-xs text-muted-foreground">Guardado: {new Date(exam.timestamp).toLocaleString()}</p>
                      <div className="flex gap-2 items-center">
                        {(userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.VIEWER) && (
                           <Button variant="outline" size="sm" onClick={() => { setExamInfo(exam.examInfo); setProducts(exam.products.map(p => ({...initialProductFormData, ...p }))); setEditingExamId(exam.id); setIsPreviewModalOpen(true); } }>
                              <Eye className="mr-1 h-4 w-4" /> Ver Detalles
                            </Button>
                         )}
                        {userRole === USER_ROLES.ADMIN && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleEditExam(exam.id)} disabled={!firebaseConfigured}>
                              <Edit3 className="mr-1 h-4 w-4" /> Editar
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteExam(exam.id)} disabled={!firebaseConfigured}>
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
        <FooterContent />
        {isPreviewModalOpen && examInfo && (
             <PreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => { setIsPreviewModalOpen(false); resetForm();}} 
                examInfo={examInfo}
                products={products}
            />
        )}
         {userRole === USER_ROLES.ADMIN && (
            <ManageGestoresModal
                isOpen={showManageGestoresModal}
                onClose={() => setShowManageGestoresModal(false)}
                accounts={managedGestorAccounts}
                onSaveAccounts={saveManagedGestorAccounts}
            />
        )}
      </div>
    );
  }
  
  if (currentView === 'form' && (userRole === USER_ROLES.INSPECTOR || userRole === USER_ROLES.ADMIN) && examInfo) {
    const isInspectorCreatingNew = userRole === USER_ROLES.INSPECTOR && !editingExamId;

    return (
      <div className="min-h-screen flex flex-col">
        <Header onLogout={handleLogout} actions={headerActions} />
        <main className="flex-grow container mx-auto p-4 md:p-6 space-y-8">
          {userRole === USER_ROLES.ADMIN && (
            <div className={`flex justify-between items-center p-3 mb-6 rounded-md shadow-sm ${editingExamId ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700/50' : 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700/50'}`}>
                <p className={`font-semibold ${editingExamId ? 'text-blue-700 dark:text-blue-300' : 'text-green-700 dark:text-green-300'}`}>
                    {editingExamId ? `Modo Edición Administrador: Editando examen ID: ${examInfo?.examId || ''} (Firestore ID: ${editingExamId})` : 'Modo Administrador: Creando nuevo examen.'}
                </p>
            </div>
          )}
          <DatabaseErrorDisplay />

          {(!isInspectorCreatingNew || (isInspectorCreatingNew && inspectorStep === 'examInfo')) && (
            <section id="exam-info">
              <InitialExamForm 
                onExamInfoSubmit={handleExamInfoChange} 
                initialData={examInfo} 
                isReadOnly={userRole === USER_ROLES.INSPECTOR && !!examInfo.inspectorName} // Gestor name pre-filled is readonly
              />
              {isInspectorCreatingNew && inspectorStep === 'examInfo' && (
                <div className="mt-6 flex justify-end">
                  <Button 
                    size="lg"
                    onClick={() => setInspectorStep('products')}
                    disabled={!isExamInfoComplete}
                    className="text-primary border-primary hover:bg-accent hover:text-primary focus-visible:ring-primary"
                  >
                    Continuar <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}
            </section>
          )}

          {(!isInspectorCreatingNew || (isInspectorCreatingNew && inspectorStep === 'products')) && (
            <>
              {isInspectorCreatingNew && inspectorStep === 'products' && examInfo && (
                <Card className="shadow-md my-6">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Info className="w-5 h-5 text-primary"/>
                        Información del Examen Ingresada
                      </CardTitle>
                      <CardDescription>Verifique los datos antes de añadir productos. (Gestor Aduanero)</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setInspectorStep('examInfo')} size="sm">
                      <ChevronLeft className="mr-2 h-4 w-4" /> Retroceder
                    </Button>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p><strong>ID Examen:</strong> {examInfo.examId}</p>
                    <p><strong>Fecha:</strong> {examInfo.date}</p>
                    <p><strong>Gestor Aduanero:</strong> {examInfo.inspectorName}</p>
                    <p><strong>Ubicación:</strong> {examInfo.location}</p>
                  </CardContent>
                </Card>
              )}

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
                      <p className="text-sm mr-auto self-center text-card-foreground">
                          Productos Totales: {products.length}
                      </p>
                      {userRole === USER_ROLES.ADMIN && editingExamId && (
                        <Button variant="outline" onClick={handleAdminCancelEdit} size="lg" className="w-full sm:w-auto order-1 sm:order-none">
                          <ArrowLeftToLine className="mr-2 h-5 w-5" /> Cancelar Edición
                        </Button>
                      )}
                      <Button 
                        onClick={handleDirectDownloadTXT}
                        variant="outline" 
                        size="lg" 
                        disabled={commonDisabledConditionForActions}
                        className="w-full sm:w-auto order-2 sm:order-none"
                      >
                        <FileText className="mr-2 h-5 w-5" /> Descargar TXT
                      </Button>
                       <Button 
                        onClick={handleDirectDownloadExcel}
                        variant="outline" 
                        size="lg" 
                        disabled={commonDisabledConditionForActions}
                        className="w-full sm:w-auto order-3 sm:order-none"
                      >
                        <FileSpreadsheet className="mr-2 h-5 w-5" /> Descargar Excel
                      </Button>
                      <Button 
                        onClick={() => handleSaveOrUpdateExamAndGenerateReports(true)}
                        size="lg" 
                        disabled={commonDisabledConditionForActions || !firebaseConfigured}
                        className="w-full sm:w-auto order-4 sm:order-none"
                      >
                        <Save className="mr-2 h-5 w-5" /> 
                        {editingExamId ? "Actualizar y Generar" : "Guardar y Generar"}
                      </Button>
                      <Button 
                        onClick={handlePreview} 
                        variant="outline"
                        size="lg" 
                        disabled={commonDisabledConditionForActions} 
                        className="w-full sm:w-auto order-5 sm:order-none"
                      >
                        <Eye className="mr-2 h-5 w-5" />
                         Previsualizar
                      </Button>
                  </CardContent>
                </Card>
              </section>
            </>
          )}

          {isPreviewModalOpen && examInfo && currentView === 'form' && (
            <PreviewModal
              isOpen={isPreviewModalOpen}
              onClose={() => setIsPreviewModalOpen(false)}
              examInfo={examInfo}
              products={products}
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
        <FooterContent />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-card text-card-foreground p-8 rounded-lg shadow-xl text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-xl font-semibold text-destructive">Error: Estado de la aplicación no válido.</p>
            <p className="mt-2">Ha ocurrido un problema con la vista actual. Intente volver a iniciar sesión.</p>
            <Button onClick={handleLogout} className="mt-6">
                <LogIn className="mr-2 h-4 w-4" /> Reintentar Login
            </Button>
        </div>
      </main>
      <FooterContent />
    </div>
  );
}
