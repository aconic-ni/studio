import type { Product } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit3, Trash2 } from 'lucide-react';

interface ProductTableProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

export function ProductTable({ products, onViewProduct, onEditProduct, onDeleteProduct }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay productos añadidos. Haga clic en "Añadir Nuevo" para comenzar.
      </div>
    );
  }

  const getRowClass = (product: Product) => {
    if (product.isExcess) return 'bg-red-500/10';
    if (product.isConform) return 'bg-green-500/10';
    if (product.isMissing) return 'bg-yellow-500/10';
    if (product.isFault) return 'bg-gray-500/10';
    return '';
  };
  
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Marca</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className={getRowClass(product)}>
              <TableCell className="font-medium">{product.itemNumber || 'N/A'}</TableCell>
              <TableCell>{product.description ? (product.description.length > 30 ? `${product.description.substring(0, 30)}...` : product.description) : 'N/A'}</TableCell>
              <TableCell>{product.brand || 'N/A'}</TableCell>
              <TableCell>{`${product.quantityUnits || 0} unid. / ${product.quantityPackages || 0} bultos`}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {product.isConform && <Badge variant="default" className="bg-green-500/80 hover:bg-green-500/70 text-white">Conforme</Badge>}
                  {product.isExcess && <Badge variant="destructive" className="bg-red-500/80 hover:bg-red-500/70">Excedente</Badge>}
                  {product.isMissing && <Badge variant="secondary" className="bg-yellow-500/80 hover:bg-yellow-500/70 text-black">Faltante</Badge>}
                  {product.isFault && <Badge variant="outline" className="bg-gray-500/80 hover:bg-gray-500/70 text-white">Avería</Badge>}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onViewProduct(product)} title="Ver">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEditProduct(product)} title="Editar">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => product.id && onDeleteProduct(product.id)} title="Eliminar" className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
