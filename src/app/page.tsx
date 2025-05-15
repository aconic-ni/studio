
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { ExamInfo, Product, UserRole, SavedExam, ProductStatus } from '@/types';
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
import { Eye, PackagePlus, List, Edit3, Trash2, LogOut, ArrowLeftToLine, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const PASSWORDS: Record<string, UserRole> = {
  "inspector123": USER_ROLES.INSPECTOR,
  "viewer123": USER_ROLES.VIEWER,
  "admin123": USER_ROLES.ADMIN,
};

const LOCAL_STORAGE_KEY_EXAMS = "customsExamsData_v2"; // Changed key to avoid conflicts with old structure

const initialExamData: ExamInfo = {
  examId: '',
  date: new Date().toISOString().split('T')[0],
  inspectorName: '',
  location: '',
};

const initialProductData: Omit<Product, 'id'> = {
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentView, setCurrentView] = useState<'login' | 'form' | 'database'>('login');
  
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(initialExamData);
  const [products, setProducts] = useState<Product[]>([]);
  const [savedExams, setSavedExams] = useState<SavedExam[]>([]);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedExams = localStorage.getItem(LOCAL_STORAGE_KEY_EXAMS);
      if (storedExams) {
        setSavedExams(JSON.parse(storedExams));
      }
    } catch (error) {
      console.error("Error loading exams from localStorage:", error);
      toast({ title: "Error", description: "No se pudieron cargar los exámenes guardados.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_EXAMS, JSON.stringify(savedExams));
    } catch (error) {
      console.error("Error saving exams to localStorage:", error);
      toast({ title: "Error", description: "No se pudieron guardar los cambios en los exámenes.", variant: "destructive" });
    }
  }, [savedExams, toast]);


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
    }
  };
  
  const resetForm = useCallback(() => {
    setExamInfo({...initialExamData, examId: userRole === USER_ROLES.INSPECTOR ? `EXM-${Date.now().toString().slice(-6)}` : '' });
    setProducts([]);
    setEditingExamId(null);
  }, [userRole]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentView('login');
    resetForm();
    toast({ title: "Sesión Cerrada"});
  };
  
  const handleExamInfoSubmit = (data: ExamInfo) => {
    setExamInfo(data);
  };

  const handleAddProduct = (productData: Omit<Product, 'id'>) => {
     const newProduct: Product = {
        ...initialProductData, // ensures all fields are present even if not in form's default (though they should be)
        ...productData,
        id: crypto.randomUUID(),
     };
    setProducts((prevProducts) => [...prevProducts, newProduct]);
    toast({ title: "Producto Agregado", description: `${newProduct.description} ha sido agregado.` });
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

  const handleSaveOrUpdateExamAndGenerateReports = () => {
    if (!examInfo) return;

    const currentExamData: SavedExam = {
      id: editingExamId || crypto.randomUUID(),
      examInfo,
      products,
      timestamp: new Date().toISOString(),
    };

    if (editingExamId) { 
      setSavedExams(prev => prev.map(ex => ex.id === editingExamId ? currentExamData : ex));
      toast({ title: "Examen Actualizado", description: "El examen ha sido actualizado y los reportes generados." });
    } else { 
      setSavedExams(prev => [...prev, currentExamData]);
      toast({ title: "Examen Guardado", description: "El examen ha sido guardado y los reportes generados." });
    }
    
    try {
      generateTxtReport(examInfo, products);
      toast({ title: "Reporte TXT Generado" });
    } catch (error) {
      console.error("Error generando reporte TXT:", error);
      toast({ title: "Error en Reporte TXT", variant: "destructive" });
    }

    try {
      generateExcelReport(examInfo, products);
      toast({ title: "Reporte Excel Generado" });
    } catch (error) {
      console.error("Error generando reporte Excel:", error);
      toast({ title: "Error en Reporte Excel", variant: "destructive" });
    }
    
    setIsPreviewModalOpen(false);
    if (userRole === USER_ROLES.INSPECTOR) {
      resetForm(); 
    } else if (userRole === USER_ROLES.ADMIN && editingExamId) {
      setCurrentView('database'); 
      resetForm();
    } else if (userRole === USER_ROLES.ADMIN && !editingExamId) { // Admin creating new exam
        resetForm(); // Reset for another new one or go to DB
        setCurrentView('form'); // Or 'database' if preferred after admin creates one
    }
  };

  const handleEditExam = (examId: string) => {
    const examToEdit = savedExams.find(ex => ex.id === examId);
    if (examToEdit) {
      setExamInfo(examToEdit.examInfo);
      // Ensure products loaded for editing have all fields, defaulting if necessary
      const productsWithDefaults = examToEdit.products.map(p => ({ ...initialProductData, ...p }));
      setProducts(productsWithDefaults);
      setEditingExamId(examId);
      setCurrentView('form');
    }
  };

  const handleDeleteExam = (examId: string) => {
    setSavedExams(prev => prev.filter(ex => ex.id !== examId));
    toast({ title: "Examen Eliminado", description: "El examen ha sido eliminado permanentemente.", variant: "destructive"});
  };
  
  const handleCancelEdit = () => {
    resetForm();
    setCurrentView('database');
  };

  // Auto-generate Exam ID for new exams by Inspector or Admin (if not editing)
  useEffect(() => {
    if (currentView === 'form' && !editingExamId && (userRole === USER_ROLES.INSPECTOR || userRole === USER_ROLES.ADMIN)) {
        if (!examInfo?.examId) { // Only set if not already set (e.g. by admin clicking "New Exam" and form resetting)
             setExamInfo(prev => ({...prev!, examId: `EXM-${Date.now().toString().slice(-6)}`}));
        }
    }
  }, [currentView, editingExamId, userRole, examInfo?.examId]);


  if (currentView === 'login') {
    return (
      <div className="min-h-screen flex flex-col bg-secondary/50 items-center justify-center p-4">
        <PasswordModal
          isOpen={true}
          onSubmit={handlePasswordSubmit}
          error={passwordError}
        />
         <div className="text-center mt-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Customs Ex-p</h1>
            <p className="text-muted-foreground">Requiere Autenticación</p>
        </div>
      </div>
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
              {savedExams.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No hay exámenes para mostrar.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {savedExams.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(exam => ( 
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
                           <Button variant="outline" size="sm" onClick={() => { setExamInfo(exam.examInfo); setProducts(exam.products.map(p => ({...initialProductData, ...p }))); setIsPreviewModalOpen(true); } }>
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
                onConfirm={() => { setIsPreviewModalOpen(false); resetForm();}}
                examInfo={examInfo}
                products={products}
                isViewerMode={true} 
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
                    {editingExamId ? `Modo Edición Administrador: Editando examen ID: ${examInfo?.examId || ''}` : 'Modo Administrador: Creando nuevo examen.'}
                </p>
            </div>
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
                  <Button onClick={() => setShowAddProductModal(true)} size="lg" className="w-full sm:w-auto">
                      <PackagePlus className="mr-2 h-5 w-5" /> Agregar Nuevo Producto
                  </Button>
              </CardContent>
            </Card>
            <ProductsTable products={products} onRemoveProduct={handleRemoveProduct} />
          </section>
          
          <section id="actions" className="py-6">
            <Card className="shadow-lg">
              <CardContent className="p-6 flex flex-col sm:flex-row justify-end items-center gap-4">
                  <p className="text-sm text-muted-foreground mr-auto">
                      Productos Totales: {products.length}
                  </p>
                  {userRole === USER_ROLES.ADMIN && editingExamId && (
                    <Button variant="outline" onClick={handleCancelEdit} size="lg" className="w-full sm:w-auto">
                      <ArrowLeftToLine className="mr-2 h-5 w-5" /> Cancelar Edición
                    </Button>
                  )}
                  <Button 
                    onClick={handlePreview} 
                    size="lg" 
                    disabled={!examInfo || !examInfo.examId || (products.length === 0 && !editingExamId && userRole !== USER_ROLES.ADMIN)} 
                    className="w-full sm:w-auto"
                  >
                    {editingExamId ? <Save className="mr-2 h-5 w-5" /> : <Eye className="mr-2 h-5 w-5" />}
                    {editingExamId ? "Actualizar y Ver Previa" : "Vista Previa y Guardar"}
                  </Button>
              </CardContent>
            </Card>
          </section>

          {isPreviewModalOpen && examInfo && currentView === 'form' && (
            <PreviewModal
              isOpen={isPreviewModalOpen}
              onClose={() => setIsPreviewModalOpen(false)}
              onConfirm={handleSaveOrUpdateExamAndGenerateReports}
              examInfo={examInfo}
              products={products}
              isEditing={!!editingExamId}
            />
          )}
          
          <AddProductModal
            isOpen={showAddProductModal}
            onClose={() => setShowAddProductModal(false)}
            onAddProduct={handleAddProduct}
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
