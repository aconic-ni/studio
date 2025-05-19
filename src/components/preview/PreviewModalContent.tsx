import type { ExamInfo, Product } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PreviewModalContentProps {
  examInfo: ExamInfo;
  products: Product[];
  onConfirm: () => void;
  onDownloadTxt: () => void;
  onDownloadExcel: () => void;
  onClose: () => void;
}

export function PreviewModalContent({
  examInfo,
  products,
  onConfirm,
  onDownloadTxt,
  onDownloadExcel,
  onClose,
}: PreviewModalContentProps) {

  const getRowClass = (product: Product) => {
    if (product.isExcess) return 'bg-red-500/10';
    if (product.isConform) return 'bg-green-500/10';
    if (product.isMissing) return 'bg-yellow-500/10';
    if (product.isFault) return 'bg-gray-500/10';
    return '';
  };

  return (
    <>
      <ScrollArea className="h-[70vh] pr-4"> {/* Adjust height as needed */}
        <div className="mb-6">
          <h4 className="text-base md:text-lg font-medium mb-2 text-foreground">Información General</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-muted p-3 rounded-md">
            <div><span className="font-semibold text-muted-foreground">NE:</span> <span className="text-foreground">{examInfo.ne}</span></div>
            <div><span className="font-semibold text-muted-foreground">Referencia:</span> <span className="text-foreground">{examInfo.reference || 'N/A'}</span></div>
            <div><span className="font-semibold text-muted-foreground">Gestor:</span> <span className="text-foreground">{examInfo.manager}</span></div>
            <div><span className="font-semibold text-muted-foreground">Ubicación:</span> <span className="text-foreground">{examInfo.location}</span></div>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-base md:text-lg font-medium mb-2 text-foreground">Productos</h4>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className={getRowClass(product)}>
                    <TableCell className="font-medium">{product.itemNumber || 'N/A'}</TableCell>
                    <TableCell>{product.description ? (product.description.length > 30 ? `${product.description.substring(0,30)}...` : product.description) : 'N/A'}</TableCell>
                    <TableCell>{`${product.brand || 'N/A'} / ${product.model || 'N/A'}`}</TableCell>
                    <TableCell>{`${product.quantityUnits || 0} unid. / ${product.quantityPackages || 0} bultos`}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.isConform && <Badge variant="default" className="bg-green-500/80 hover:bg-green-500/70 text-white">Conforme</Badge>}
                        {product.isExcess && <Badge variant="destructive" className="bg-red-500/80 hover:bg-red-500/70">Excedente</Badge>}
                        {product.isMissing && <Badge variant="secondary" className="bg-yellow-500/80 hover:bg-yellow-500/70 text-black">Faltante</Badge>}
                        {product.isFault && <Badge variant="outline" className="bg-gray-500/80 hover:bg-gray-500/70 text-white">Avería</Badge>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </ScrollArea>
      <DialogFooter className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={onDownloadTxt}>
            <Download className="mr-2 h-4 w-4" /> Descargar TXT
          </Button>
          <Button variant="outline" onClick={onDownloadExcel}>
            <Download className="mr-2 h-4 w-4" /> Descargar Excel
          </Button>
        </div>
        <div className="flex gap-3">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          </DialogClose>
          <Button onClick={onConfirm}>Confirmar</Button>
        </div>
      </DialogFooter>
    </>
  );
}
