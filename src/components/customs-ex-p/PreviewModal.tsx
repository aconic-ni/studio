
"use client";

import type { FC } from 'react';
import type { ExamInfo, Product, ProductStatus } from '@/types';
import { PRODUCT_STATUS } from '@/types'; 
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { FileText, Package, X, Eye } from 'lucide-react'; 

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  examInfo: ExamInfo | null;
  products: Product[];
}

const getStatusBadgeVariant = (status: ProductStatus): string => {
  switch (status) {
    case PRODUCT_STATUS.CONFORME:
      return "bg-green-100 text-green-700 border-green-300 hover:bg-green-200 dark:bg-green-700/30 dark:text-green-300 dark:border-green-600";
    case PRODUCT_STATUS.EXCEDENTE:
      return "bg-red-100 text-red-700 border-red-300 hover:bg-red-200 dark:bg-red-700/30 dark:text-red-300 dark:border-red-600";
    case PRODUCT_STATUS.FALTANTE:
      return "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200 dark:bg-yellow-700/30 dark:text-yellow-300 dark:border-yellow-600";
    case PRODUCT_STATUS.AVERIA:
      return "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 dark:bg-gray-600/30 dark:text-gray-300 dark:border-gray-500";
    default:
      return "bg-secondary text-secondary-foreground hover:bg-secondary/80";
  }
};

const getStatusDisplayName = (status: ProductStatus): string => {
    switch (status) {
        case PRODUCT_STATUS.CONFORME: return "Conforme";
        case PRODUCT_STATUS.EXCEDENTE: return "Excedente";
        case PRODUCT_STATUS.FALTANTE: return "Faltante";
        case PRODUCT_STATUS.AVERIA: return "Avería";
        default: return status;
    }
}

export const PreviewModal: FC<PreviewModalProps> = ({ 
  isOpen, 
  onClose, 
  examInfo, 
  products, 
}) => {
  if (!examInfo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] md:max-w-[800px] max-h-[90vh] flex flex-col text-foreground overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Eye className="w-6 h-6 text-foreground" />
            Detalles del Examen
          </DialogTitle>
          <DialogDescription>
            Visualizando los detalles del examen ID: {examInfo.examId}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow min-h-0 pr-2 -mr-4"> 
          <div className="space-y-6 py-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><FileText className="w-5 h-5 text-foreground" />Información del Examen</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm p-4 bg-muted/50 rounded-md">
                <div><strong>ID Examen:</strong></div><div>{examInfo.examId}</div>
                <div><strong>Fecha:</strong></div><div>{examInfo.date}</div>
                <div><strong>Gestor Aduanero:</strong></div><div>{examInfo.inspectorName}</div>
                <div><strong>Ubicación:</strong></div><div>{examInfo.location}</div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Package className="w-5 h-5 text-foreground" />Productos ({products.length})</h3>
              {products.length > 0 ? (
                <ul className="space-y-4">
                  {products.map((product, index) => (
                    <li key={product.id} className="p-4 bg-muted/50 rounded-md text-sm space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-base">{index + 1}. {product.description}</p>
                        <Badge variant="outline" className={`font-semibold text-xs ${getStatusBadgeVariant(product.status)}`}>
                            {getStatusDisplayName(product.status)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <div><strong>Item N°:</strong> {product.itemNumber || '-'}</div>
                        <div><strong>Cant. Unidades:</strong> {product.unitQuantity || 0} {product.measurementUnit || ''}</div>
                        <div><strong>Marca:</strong> {product.brand || '-'}</div>
                        <div><strong>Modelo:</strong> {product.model || '-'}</div>
                        <div><strong>Origen:</strong> {product.origin || '-'}</div>
                        <div><strong>Estado Merc.:</strong> {product.merchandiseState || '-'}</div>
                        <div><strong>Peso:</strong> {product.weightValue && product.weightUnit ? `${product.weightValue} ${product.weightUnit}` : (product.weightValue ? String(product.weightValue) : '-') }</div>
                        <div><strong>Serie:</strong> {product.serialNumber || '-'}</div>
                        <div><strong>Cant. Bultos:</strong> {product.packageQuantity || 0}</div>
                        <div className="md:col-span-1"><strong>Num. Bultos:</strong> {product.packageNumbers || '-'}</div>
                      </div>
                      {product.observation && (
                        <div>
                           <p className="text-xs font-medium mt-1"><strong>Observación:</strong></p>
                           <p className="text-xs text-muted-foreground whitespace-pre-wrap">{product.observation}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-md">No se han agregado productos a esta examinación.</p>
              )}
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="mt-auto pt-4 border-t sticky bottom-0 bg-background pb-6 px-6">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" /> Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
