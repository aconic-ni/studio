"use client";

import type { FC } from 'react';
import type { ExamInfo, Product } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, FileText, Package, DownloadCloud, X } from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  examInfo: ExamInfo | null;
  products: Product[];
}

export const PreviewModal: FC<PreviewModalProps> = ({ isOpen, onClose, onConfirm, examInfo, products }) => {
  if (!examInfo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Confirmar Detalles de la Examinación
          </DialogTitle>
          <DialogDescription>
            Revise toda la información ingresada antes de generar los reportes.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <div className="space-y-6 py-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Información del Examen</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm p-4 bg-muted/50 rounded-md">
                <div><strong>ID Examen:</strong></div><div>{examInfo.examId}</div>
                <div><strong>Fecha:</strong></div><div>{examInfo.date}</div>
                <div><strong>Inspector:</strong></div><div>{examInfo.inspectorName}</div>
                <div><strong>Ubicación:</strong></div><div>{examInfo.location}</div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Package className="w-5 h-5 text-primary" />Productos ({products.length})</h3>
              {products.length > 0 ? (
                <ul className="space-y-3">
                  {products.map((product, index) => (
                    <li key={product.id} className="p-3 bg-muted/50 rounded-md text-sm">
                      <p className="font-medium">{index + 1}. {product.name}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                        <div><strong>Código HS:</strong> {product.hsCode}</div>
                        <div><strong>Cant:</strong> {product.quantity}</div>
                        <div><strong>Valor (unidad):</strong> {product.value.toFixed(2)}</div>
                        <div><strong>Origen:</strong> {product.countryOfOrigin}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No se han agregado productos a esta examinación.</p>
              )}
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="mt-auto pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button onClick={onConfirm} className="bg-green-600 hover:bg-green-700">
            <DownloadCloud className="mr-2 h-4 w-4" /> Confirmar y Generar Reportes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
