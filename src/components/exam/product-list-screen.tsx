
"use client";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExamContext, ExamStep } from '@/contexts/exam-context';
import { ProductTable } from '../products/product-table';
import { ProductDialog } from '../products/product-dialog';
import { DeleteProductDialog } from '../products/delete-product-dialog';
import { ProductDetailsModal } from '../products/product-details-modal'; // Assuming this exists
import { PlusCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ProductListScreen() {
  const { 
    examData, 
    setCurrentStep, 
    products,
    openProductModal,
    productToDelete,
    closeDeleteDialog,
    confirmDeleteProduct,
    isDeleteDialogLoading
  } = useExamContext();
  const { toast } = useToast();

  if (!examData || !examData.ne) { // Check for a key piece of examData
    return (
      <div className="text-center py-10 container mx-auto">
        <Card className="p-8 shadow-xl border">
          <p className="text-lg text-muted-foreground mb-4">Error: Datos del examen no encontrados o incompletos.</p>
          <Button onClick={() => setCurrentStep(ExamStep.INITIAL_INFO)} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inicio
          </Button>
        </Card>
      </div>
    );
  }
  
  const handleFinish = () => {
     if (products.length === 0) {
        toast({
          title: "No hay productos",
          description: "Debe agregar al menos un producto antes de finalizar.",
          variant: "destructive"
        });
        return;
      }
    setCurrentStep(ExamStep.PREVIEW);
  }

  return (
    <Card className="w-full max-w-5xl mx-auto shadow-xl border my-6">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-4">
          <CardTitle className="text-xl md:text-2xl font-semibold">EXAMEN PREVIO</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => openProductModal()} variant="default">
              <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nuevo
            </Button>
            <Button onClick={handleFinish} variant="secondary">
              <CheckCircle className="mr-2 h-5 w-5" /> Finalizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-secondary border border-border rounded-md shadow"> {/* Adjusted colors to theme */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="font-semibold">NE:</span> {examData.ne}</div>
                <div><span className="font-semibold">Referencia:</span> {examData.reference || 'N/A'}</div>
                <div><span className="font-semibold">Gestor:</span> {examData.manager}</div>
                <div><span className="font-semibold">Ubicación:</span> {examData.location}</div>
            </div>
            <div className="mt-3">
                <Button variant="link" onClick={() => setCurrentStep(ExamStep.INITIAL_INFO)} className="text-primary p-0 h-auto">
                    <ArrowLeft className="mr-1 h-4 w-4" /> Regresar para modificar datos
                </Button>
            </div>
        </div>
        
        <ProductTable products={products} />
      </CardContent>
      
      {/* Modals are controlled by ExamContext and rendered at a higher level or via context state */}
      <ProductDialog /> 
      <DeleteProductDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        onConfirm={confirmDeleteProduct}
        productName={productToDelete?.name}
        isLoading={isDeleteDialogLoading}
      />
      {/* <ProductDetailsModal />  Ensure this is implemented or remove if not used yet */}
    </Card>
  );
}
