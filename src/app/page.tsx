"use client";

import { useState, useEffect } from 'react';
import type { ExamInfo, Product } from '@/types';
import { Header } from '@/components/Header';
import { InitialExamForm } from '@/components/customs-ex-p/InitialExamForm';
import { ProductsTable } from '@/components/customs-ex-p/ProductsTable';
import { PreviewModal } from '@/components/customs-ex-p/PreviewModal';
import { PasswordModal } from '@/components/customs-ex-p/PasswordModal';
import { AddProductModal } from '@/components/customs-ex-p/AddProductModal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateTxtReport, generateExcelReport } from '@/lib/reportUtils';
import { Eye, PackagePlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Clave hardcodeada para demostración
const CORRECT_PASSWORD = "password123";

export default function CustomsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(true);
  const [passwordError, setPasswordError] = useState('');

  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const { toast } = useToast();

  const handlePasswordSubmit = (password: string) => {
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      setShowPasswordModal(false);
      setPasswordError('');
      toast({
        title: "Acceso Concedido",
        description: "Bienvenido a Customs Ex-p.",
        variant: "default",
      });
    } else {
      setPasswordError("Clave incorrecta. Intente de nuevo.");
    }
  };

  const handleExamInfoSubmit = (data: ExamInfo) => {
    setExamInfo(data);
  };

  const handleAddProduct = (product: Product) => {
    setProducts((prevProducts) => [...prevProducts, product]);
    toast({
      title: "Producto Agregado",
      description: `${product.name} ha sido agregado exitosamente a la lista.`,
      variant: "default",
    });
    // AddProductModal se cierra a sí mismo a través de su prop onClose
  };

  const handleRemoveProduct = (productId: string) => {
    setProducts((prevProducts) => prevProducts.filter(p => p.id !== productId));
    toast({
      title: "Producto Eliminado",
      description: "El producto ha sido eliminado de la lista.",
      variant: "destructive",
    });
  };

  const handlePreview = () => {
    if (!examInfo || !examInfo.examId) {
       toast({
        title: "Falta Información del Examen",
        description: "Por favor complete primero el formulario de Información del Examen.",
        variant: "destructive",
      });
      return;
    }
    setIsPreviewModalOpen(true);
  };

  const handleConfirmAndGenerateReports = () => {
    if (!examInfo) return;
    
    try {
      generateTxtReport(examInfo, products);
      toast({
        title: "Reporte TXT Generado",
        description: "El reporte TXT ha sido descargado.",
      });
    } catch (error) {
      console.error("Error generando reporte TXT:", error);
      toast({
        title: "Error en Reporte TXT",
        description: "No se pudo generar el reporte TXT.",
        variant: "destructive",
      });
    }

    try {
      generateExcelReport(examInfo, products);
      toast({
        title: "Reporte Excel Generado",
        description: "El reporte Excel ha sido descargado.",
      });
    } catch (error) {
      console.error("Error generando reporte Excel:", error);
      toast({
        title: "Error en Reporte Excel",
        description: "No se pudo generar el reporte Excel.",
        variant: "destructive",
      });
    }
    
    setIsPreviewModalOpen(false);
  };
  
  const initialExamData: ExamInfo = {
    examId: '',
    date: new Date().toISOString().split('T')[0],
    inspectorName: '',
    location: '',
  };

  useEffect(() => {
    if (!examInfo && isAuthenticated) {
      setExamInfo(initialExamData);
    }
  }, [examInfo, isAuthenticated]);


  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-secondary/50 items-center justify-center p-4">
        <PasswordModal
          isOpen={showPasswordModal}
          onSubmit={handlePasswordSubmit}
          error={passwordError}
        />
         <div className="text-center">
            <h1 className="text-3xl font-bold text-primary mb-2">Customs Ex-p</h1>
            <p className="text-muted-foreground">Requiere Autenticación</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary/50">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 space-y-8">
        <section id="exam-info">
          <InitialExamForm 
            onExamInfoSubmit={setExamInfo} 
            initialData={examInfo || initialExamData} 
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
                <Button onClick={handlePreview} size="lg" disabled={!examInfo || !examInfo.examId || products.length === 0} className="w-full sm:w-auto">
                    <Eye className="mr-2 h-5 w-5" /> Vista Previa y Finalizar
                </Button>
            </CardContent>
          </Card>
        </section>

        {examInfo && (
          <PreviewModal
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
            onConfirm={handleConfirmAndGenerateReports}
            examInfo={examInfo}
            products={products}
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
