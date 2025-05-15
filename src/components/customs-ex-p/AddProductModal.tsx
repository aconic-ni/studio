
"use client";

import type { FC } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Product } from '@/types';
import { AddProductForm } from './AddProductForm';
import { PackagePlus } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Product) => void;
}

export const AddProductModal: FC<AddProductModalProps> = ({ isOpen, onClose, onAddProduct }) => {
  const handleProductSubmit = (product: Product) => {
    onAddProduct(product);
    onClose(); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[750px] lg:max-w-[900px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-primary" />
            Agregar Producto
          </DialogTitle>
          <DialogDescription>
            Especifique las características del producto para agregarlo a la lista.
          </DialogDescription>
        </DialogHeader>
        <AddProductForm onAddProduct={handleProductSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
};
