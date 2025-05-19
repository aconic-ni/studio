"use client";

import type { ExamInfo, Product } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExamSummary } from '@/components/exam/ExamSummary';
import { ProductTable } from '@/components/product/ProductTable';
import { PlusCircle, CheckCircle } from 'lucide-react';

interface ProductListScreenProps {
  examInfo: ExamInfo;
  products: Product[];
  onAddNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onFinalize: () => void;
  onBackToExamForm: () => void;
}

export function ProductListScreen({
  examInfo,
  products,
  onAddNewProduct,
  onEditProduct,
  onViewProduct,
  onDeleteProduct,
  onFinalize,
  onBackToExamForm,
}: ProductListScreenProps) {
  return (
    <Card className="bg-card custom-shadow">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <CardTitle className="text-xl md:text-2xl font-semibold text-card-foreground">EXAMEN PREVIO</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onAddNewProduct} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-5 w-5" />
              Añadir Nuevo
            </Button>
            <Button onClick={onFinalize} variant="secondary" className="w-full sm:w-auto" disabled={products.length === 0}>
              <CheckCircle className="mr-2 h-5 w-5" />
              Finalizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ExamSummary examInfo={examInfo} onGoBack={onBackToExamForm} />
        <ProductTable
          products={products}
          onViewProduct={onViewProduct}
          onEditProduct={onEditProduct}
          onDeleteProduct={onDeleteProduct}
        />
      </CardContent>
    </Card>
  );
}
