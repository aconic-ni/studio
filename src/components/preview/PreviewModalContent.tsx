
import type { ExamInfo, Product } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';
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
    return 'bg-card'; // Default background
  };

  const DetailItem: React.FC<{ label: string; value?: string | number | null; fullWidth?: boolean }> = ({ label, value, fullWidth }) => (
    <div className={fullWidth ? "col-span-2" : ""}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground break-words">{String(value || 'N/A')}</p>
    </div>
  );


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
          <h4 className="text-base md:text-lg font-medium mb-2 text-foreground">Productos ({products.length})</h4>
          {products.length > 0 ? (
            <div className="space-y-4">
              {products.map((product, index) => (
                <div key={product.id || index} className={`border p-4 rounded-lg shadow-sm ${getRowClass(product)}`}>
                  <p className="font-semibold text-md mb-2 text-foreground">
                    Producto Item: {product.itemNumber || `Artículo ${index + 1}`}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                    <DetailItem label="Descripción" value={product.description} fullWidth={true} />
                    <DetailItem label="Marca" value={product.brand} />
                    <DetailItem label="Modelo" value={product.model} />
                    <DetailItem label="Serie" value={product.serial} />
                    <DetailItem label="Origen" value={product.origin} />
                    <DetailItem label="Peso" value={product.weight} />
                    <DetailItem label="Cant. Bultos" value={product.quantityPackages} />
                    <DetailItem label="Cant. Unidades" value={product.quantityUnits} />
                    <DetailItem label="Numeración de Bultos" value={product.numberPackages} />
                    <DetailItem label="Condición Embalaje" value={product.packagingCondition} />
                    <DetailItem label="Unidad Medida" value={product.unitMeasure} />
                    <DetailItem label="Código HS Sugerido" value={product.hsCode} />
                    <DetailItem label="Observación" value={product.observation} fullWidth={true} />
                    <div className="col-span-full">
                       <p className="text-xs font-medium text-muted-foreground">Estado</p>
                       <div className="flex flex-wrap gap-1 mt-1">
                        {product.isConform && <Badge variant="default" className="bg-green-500/80 hover:bg-green-500/70 text-white">Conforme</Badge>}
                        {product.isExcess && <Badge variant="destructive" className="bg-red-500/80 hover:bg-red-500/70">Excedente</Badge>}
                        {product.isMissing && <Badge variant="secondary" className="bg-yellow-500/80 hover:bg-yellow-500/70 text-black">Faltante</Badge>}
                        {product.isFault && <Badge variant="outline" className="bg-gray-500/80 hover:bg-gray-500/70 text-white">Avería</Badge>}
                        {!(product.isConform || product.isExcess || product.isMissing || product.isFault) && 
                         <span className="text-sm text-muted-foreground">N/A</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No hay productos para mostrar en la vista previa.</p>
          )}
        </div>
      </ScrollArea>
      <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t mt-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={onDownloadTxt} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> Descargar TXT
          </Button>
          <Button variant="outline" onClick={onDownloadExcel} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> Descargar Excel
          </Button>
        </div>
        <div className="flex gap-3 w-full sm:w-auto justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancelar</Button>
          </DialogClose>
          <Button onClick={onConfirm} className="w-full sm:w-auto">Confirmar</Button>
        </div>
      </DialogFooter>
    </>
  );
}
