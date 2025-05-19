import type { ExamInfo } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface ExamSummaryProps {
  examInfo: ExamInfo;
  onGoBack: () => void;
}

export function ExamSummary({ examInfo, onGoBack }: ExamSummaryProps) {
  return (
    <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-md">
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <div className="text-sm"><span className="font-semibold text-foreground/80">NE:</span> <span className="text-foreground">{examInfo.ne}</span></div>
        <div className="text-sm"><span className="font-semibold text-foreground/80">Referencia:</span> <span className="text-foreground">{examInfo.reference || 'N/A'}</span></div>
        <div className="text-sm"><span className="font-semibold text-foreground/80">Gestor:</span> <span className="text-foreground">{examInfo.manager}</span></div>
        <div className="text-sm"><span className="font-semibold text-foreground/80">Ubicación:</span> <span className="text-foreground">{examInfo.location}</span></div>
      </div>
      <div className="mt-3">
        <Button variant="link" onClick={onGoBack} className="text-primary hover:text-primary/80 p-0 h-auto">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Regresar para modificar datos
        </Button>
      </div>
    </div>
  );
}
