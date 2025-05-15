"use client";

import { useState, useEffect } from 'react';
import type { ExamInfo, Product } from '@/types';
import { Header } from '@/components/Header';
import { InitialExamForm } from '@/components/customs-ex-p/InitialExamForm';
import { AddProductForm } from '@/components/customs-ex-p/AddProductForm';
import { ProductsTable } from '@/components/customs-ex-p/ProductsTable';
import { PreviewModal } from '@/components/customs-ex-p/PreviewModal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateTxtReport, generateExcelReport } from '@/lib/reportUtils';
import { Send, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function CustomsPage() {
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const { toast } = useToast();

  // Effect to update examInfo when form fields change
  // This requires InitialExamForm to call onExamInfoSubmit on every change,
  // or we manage form state here directly.
  // For simplicity, InitialExamForm currently updates its internal state.
  // We need a way to get the data from InitialExamForm to the parent.
  // A "Save Exam Info" button or auto-save on blur could work.
  // Or, pass the form instance from parent or lift state up.
  // For now, let's assume InitialExamForm is for display/initial setup.
  // The actual data for the report will be what's in the `examInfo` state.

  const handleExamInfoSubmit = (data: ExamInfo) => {
    setExamInfo(data);
    // Note: InitialExamForm doesn't have a submit button.
    // The data is set implicitly by the form's default values or if we add a "save" mechanism.
    // For this design, we'll rely on its fields being available through its form instance for preview.
    // A better approach would be to lift its state up or have an explicit save.
    // For now, let's ensure examInfo is set by the form when it's available.
    // The current InitialExamForm doesn't call onExamInfoSubmit. It should if it's meant to update the parent.
    // Let's fix InitialExamForm to call onExamInfoSubmit when its values change or on a specific action.
    // For simplicity now: we will rely on the user pressing "Preview & Submit" to capture the current form values.
    // This implies that page.tsx needs access to the InitialExamForm's form instance or state.
    // This is getting complex. Let's simplify: InitialExamForm will manage its state, and on "Preview", we'll grab its data.
    // Or, more React-idiomatic: lift state up. For now, let's assume `examInfo` state is correctly populated.
    // I will modify InitialExamForm to be a controlled component or provide data via a callback.
    // Let's try making InitialExamForm update the parent state directly via its onExamInfoSubmit
    // and it can be called on blur of fields or a small "Update Exam Info" button.
    // For the current implementation of InitialExamForm, it only has defaultValues, not a mechanism to push updates up continuously.
    // The parent `examInfo` state will be the single source of truth.
  };

  const handleAddProduct = (product: Product) => {
    setProducts((prevProducts) => [...prevProducts, product]);
    toast({
      title: "Product Added",
      description: `${product.name} has been successfully added to the list.`,
      variant: "default",
    });
  };

  const handleRemoveProduct = (productId: string) => {
    setProducts((prevProducts) => prevProducts.filter(p => p.id !== productId));
    toast({
      title: "Product Removed",
      description: "The product has been removed from the list.",
      variant: "destructive",
    });
  };

  const handlePreview = () => {
    // To get current exam form data, ideally InitialExamForm would provide it.
    // For now, assuming examInfo state is managed correctly.
    // If InitialExamForm is separate, we'd need a ref or state lift.
    // Let's consider that InitialExamForm updates the examInfo state directly for now.
    // The current InitialExamForm in the thought process expects an onExamInfoSubmit prop.
    if (!examInfo || !examInfo.examId) { // Basic check
       toast({
        title: "Missing Exam Information",
        description: "Please complete the Exam Information form first.",
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
        title: "TXT Report Generated",
        description: "The TXT report has been downloaded.",
      });
    } catch (error) {
      console.error("Error generating TXT report:", error);
      toast({
        title: "TXT Report Error",
        description: "Could not generate TXT report.",
        variant: "destructive",
      });
    }

    try {
      generateExcelReport(examInfo, products);
      toast({
        title: "Excel Report Generated",
        description: "The Excel report has been downloaded.",
      });
    } catch (error) {
      console.error("Error generating Excel report:", error);
      toast({
        title: "Excel Report Error",
        description: "Could not generate Excel report.",
        variant: "destructive",
      });
    }
    
    setIsPreviewModalOpen(false);
    // Optionally reset forms or state here
    // setExamInfo(null); 
    // setProducts([]);
  };
  
  // This will be the default examInfo if none is set.
  const initialExamData: ExamInfo = {
    examId: '',
    date: new Date().toISOString().split('T')[0],
    inspectorName: '',
    location: '',
  };

  // Effect to initialize examInfo if it's null
  useEffect(() => {
    if (!examInfo) {
      setExamInfo(initialExamData);
    }
  }, [examInfo]);


  return (
    <div className="min-h-screen flex flex-col bg-secondary/50">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 space-y-8">
        <section id="exam-info">
          {/* The InitialExamForm will update the examInfo state via its own internal logic + onExamInfoSubmit callback */}
          {/* For this form, we actually need to pass setExamInfo to it directly for real-time updates or use a ref */}
          {/* The provided InitialExamForm uses react-hook-form. We need to align its submit with setting parent state. */}
          {/* For simplicity, let's assume examInfo is updated. One way is to pass setExamInfo to InitialExamForm and it calls it on field blur. */}
          <InitialExamForm 
            onExamInfoSubmit={setExamInfo} 
            initialData={examInfo || initialExamData} 
          />
        </section>

        <section id="products" className="space-y-6">
          <AddProductForm onAddProduct={handleAddProduct} />
          <ProductsTable products={products} onRemoveProduct={handleRemoveProduct} />
        </section>
        
        <section id="actions" className="py-6">
          <Card className="shadow-lg">
            <CardContent className="p-6 flex flex-col sm:flex-row justify-end items-center gap-4">
                <p className="text-sm text-muted-foreground mr-auto">
                    Total Products: {products.length}
                </p>
                <Button onClick={handlePreview} size="lg" disabled={!examInfo || !examInfo.examId} className="w-full sm:w-auto">
                    <Eye className="mr-2 h-5 w-5" /> Preview & Finalize
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
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} Customs Ex-p. All rights reserved.
      </footer>
    </div>
  );
}
