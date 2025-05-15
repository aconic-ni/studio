
"use client";

import type { FC } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Product } from '@/types';
import { AddProductForm } from './AddProductForm';
import { PackagePlus, Save, X } from 'lucide-react';

// Matches the Zod schema in AddProductForm
type ProductFormData = Omit<Product, 'id'>;

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProduct: (productData: ProductFormData, editingProductId: string | null) => void;
  productToEdit?: Product | null;
  initialProductData: Omit<Product, 'id'>; // To reset form for new product
}

export const AddProductModal: FC<AddProductModalProps> = ({ 
  isOpen, 
  onClose, 
  onSaveProduct, 
  productToEdit,
  initialProductData
}) => {
  const isEditing = !!productToEdit;
  
  // This key forces re-render of AddProductForm when productToEdit changes, ensuring form resets
  const formKey = productToEdit ? productToEdit.id : 'new-product';

  const handleFormSubmit = (data: ProductFormData) => {
    onSaveProduct(data, productToEdit ? productToEdit.id : null);
    onClose(); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[750px] lg:max-w-[900px] flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-primary" />
            {isEditing ? 'Editar Producto' : 'Agregar Nuevo Producto'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifique los detalles del producto.' : 'Especifique las características del producto para agregarlo a la lista.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-2 -mr-4 my-4"> {/* Added my-4 for spacing, adjusted padding for scrollbar */}
          <AddProductForm
            key={formKey} // Ensures form re-initializes when productToEdit changes
            // The form component itself will handle its submission and pass data via this callback
            // The actual "submit" button is now in the modal's footer.
            // So we need a way for the modal's submit button to trigger the form's internal submit.
            // This is typically done by giving the form an ID and referencing it in the button,
            // or by lifting the form's submit handler. We'll use react-hook-form's capabilities.
            // For simplicity, AddProductForm will need a prop that it calls on successful submit.
            // The submit button in the footer will trigger the form's submission.
            initialData={productToEdit || initialProductData}
            onSubmit={handleFormSubmit} 
            formId="product-form" // ID for the form
          />
        </ScrollArea>
        <DialogFooter className="pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button type="submit" form="product-form"> {/* This button submits the AddProductForm */}
            {isEditing ? <Save className="mr-2 h-4 w-4" /> : <PackagePlus className="mr-2 h-4 w-4" />}
            {isEditing ? 'Actualizar Producto' : 'Agregar Producto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
